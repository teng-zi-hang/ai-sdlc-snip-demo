#!/usr/bin/env node
/**
 * scripts/build-bundle.mjs
 *
 * Assembles the deployable "bundle" submodule from the backend / frontend / cli
 * source submodules and, optionally, pushes the result.
 *
 * Usage:
 *   node scripts/build-bundle.mjs          # build + commit locally
 *   node scripts/build-bundle.mjs --push   # build + commit + push
 *
 * The script is a safe no-op: it checks the staged diff before every `git commit`
 * and skips when nothing changed.
 */

import { execSync, spawnSync } from 'node:child_process';
import {
  copyFileSync, cpSync, existsSync,
  mkdirSync, readdirSync, rmSync, writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PUSH = process.argv.includes('--push');

const D = {
  backend:  join(ROOT, 'backend'),
  frontend: join(ROOT, 'frontend'),
  cli:      join(ROOT, 'cli'),
  bundle:   join(ROOT, 'bundle'),
};

// ── helpers ───────────────────────────────────────────────────────────────────

function run(cmd, cwd = ROOT) {
  process.stdout.write(`\n  $ ${cmd}  [${cwd.replace(ROOT, '.')}]\n`);
  try {
    execSync(cmd, { cwd, stdio: 'inherit' });
  } catch {
    process.stderr.write(`\nFATAL: command failed — ${cmd}\n`);
    process.exit(1);
  }
}

/** True when the git index differs from HEAD (handles repos with no commits). */
function hasStagedChanges(cwd) {
  const r = spawnSync('git', ['diff', '--cached', '--quiet'], { cwd });
  if (r.error) throw r.error;
  return r.status !== 0; // exit 1 = staged changes exist
}

// ── 1. Update source submodules ───────────────────────────────────────────────

console.log('\n══ 1 · update source submodules ══');
run('git submodule update --init --remote backend frontend cli');

// ── 2. Build frontend ─────────────────────────────────────────────────────────

console.log('\n══ 2 · build frontend ══');
run('npm install', D.frontend);

// Use the local ng binary — avoids version mismatches and works offline
const ngBin = join(
  D.frontend, 'node_modules', '.bin',
  process.platform === 'win32' ? 'ng.cmd' : 'ng',
);
run(`"${ngBin}" build`, D.frontend);

const indexHtml = join(D.frontend, 'dist', 'snip-frontend', 'browser', 'index.html');
if (!existsSync(indexHtml)) {
  process.stderr.write(`\nFATAL: build output missing: ${indexHtml}\n`);
  process.exit(1);
}
console.log(`  ✓ verified ${indexHtml.replace(ROOT, '.')}`);

// ── 3. Assemble bundle/ ───────────────────────────────────────────────────────

console.log('\n══ 3 · assemble bundle/ ══');

// server.js + cli.js — verbatim copies
for (const [name, src] of [
  ['server.js', join(D.backend, 'server.js')],
  ['cli.js',    join(D.cli,     'cli.js')],
]) {
  copyFileSync(src, join(D.bundle, name));
  console.log(`  ✓ ${name}`);
}

// public/ — wipe then re-copy the Angular browser build
const publicDir  = join(D.bundle, 'public');
const browserDir = join(D.frontend, 'dist', 'snip-frontend', 'browser');
if (existsSync(publicDir)) rmSync(publicDir, { recursive: true, force: true });
cpSync(browserDir, publicDir, { recursive: true });
console.log(`  ✓ public/  (${readdirSync(publicDir).length} files)`);

// Generated text files
const generated = {
  '.env': 'PUBLIC_DIR=./public\n',

  'package.json': JSON.stringify({
    name: 'snip-bundle',
    version: '1.0.0',
    description: 'Snip — self-contained deployable bundle (server + SPA + CLI)',
    scripts: { start: 'bun server.js' },
    // intentionally no "type" field — keeps cli.js runnable under plain node
  }, null, 2) + '\n',

  'Dockerfile': [
    'FROM oven/bun:1-alpine',
    'WORKDIR /app',
    'COPY . .',
    'ENV PORT=3000',
    'EXPOSE 3000',
    'CMD bun server.js',
    '',
  ].join('\n'),

  '.dockerignore': 'node_modules\n.git\n',

  'railway.json': JSON.stringify({
    $schema: 'https://railway.app/railway.schema.json',
    build:  { builder: 'DOCKERFILE' },
    deploy: { startCommand: 'bun server.js', restartPolicyType: 'ON_FAILURE' },
  }, null, 2) + '\n',
};

for (const [name, content] of Object.entries(generated)) {
  writeFileSync(join(D.bundle, name), content);
  console.log(`  ✓ ${name}`);
}

// ── 4. Commit inside bundle/ ──────────────────────────────────────────────────

console.log('\n══ 4 · commit bundle ══');
run('git add -A', D.bundle);

if (hasStagedChanges(D.bundle)) {
  const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
  run(`git commit -m "chore: bundle ${stamp}"`, D.bundle);
} else {
  console.log('  — nothing to commit in bundle/ (no-op)');
}

if (PUSH) {
  // Submodule is in detached-HEAD state; push explicitly to the bundle branch.
  // Safe even if origin already has the commit (idempotent).
  run('git push origin HEAD:bundle', D.bundle);
  console.log('  ✓ pushed bundle branch');
}

// ── 5. Bump superproject pointer ──────────────────────────────────────────────

console.log('\n══ 5 · bump superproject pointer ══');
run('git add bundle');

if (hasStagedChanges(ROOT)) {
  run('git commit -m "chore: bump bundle"');
} else {
  console.log('  — bundle pointer unchanged (no-op)');
}

if (PUSH) {
  run('git push');
  console.log('  ✓ pushed main');
}

console.log('\n  ✓ build-bundle complete\n');
