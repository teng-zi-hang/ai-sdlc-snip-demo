#!/usr/bin/env node
'use strict';

const { spawnSync } = require('child_process');

const BASE = (process.env.SNIP_API || 'http://localhost:3000').replace(/\/$/, '');
const [, , cmd, ...args] = process.argv;

// ── helpers ───────────────────────────────────────────────────────────────────

function die(msg) {
  process.stderr.write(msg + '\n');
  process.exit(1);
}

async function request(path, opts = {}) {
  try {
    return await fetch(BASE + path, opts);
  } catch (err) {
    die('Cannot reach backend at ' + BASE + '\n' + err.message);
  }
}

// ── snip add <url> ────────────────────────────────────────────────────────────

async function cmdAdd([url]) {
  if (!url) die('Usage: snip add <url>');

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:')
      die('URL must use http or https');
  } catch {
    die('Invalid URL: ' + url);
  }

  const res = await request('/api/links', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) die(body.error || 'Server error ' + res.status);

  process.stdout.write(body.shortUrl + '\n');
}

// ── snip ls ───────────────────────────────────────────────────────────────────

async function cmdLs() {
  const res = await request('/api/links');
  const body = await res.json().catch(() => die('Bad response from server'));
  if (!res.ok) die((body && body.error) || 'Server error ' + res.status);

  const links = body;
  if (!Array.isArray(links) || !links.length) {
    process.stdout.write('No links yet.\n');
    return;
  }

  const cW = Math.max('CODE'.length, ...links.map(l => l.code.length));
  const hW = Math.max('HITS'.length, ...links.map(l => String(l.hits).length));

  const row = (code, hits, url) =>
    code.padEnd(cW) + '  ' + String(hits).padStart(hW) + '  ' + url;

  process.stdout.write(row('CODE', 'HITS', 'URL') + '\n');
  process.stdout.write(row('-'.repeat(cW), '-'.repeat(hW), '-'.repeat(3)) + '\n');
  for (const { code, hits, url } of links) {
    process.stdout.write(row(code, hits, url) + '\n');
  }
}

// ── snip open <code> ──────────────────────────────────────────────────────────

async function cmdOpen([code]) {
  if (!code) die('Usage: snip open <code>');

  const res = await request('/' + code, { redirect: 'manual' });

  if (res.status === 404) die('Unknown code: ' + code);

  const location = res.headers.get('location');
  if (!location) die('No redirect location returned (status ' + res.status + ')');

  const platform = process.platform;
  const [bin, argv] =
    platform === 'win32'  ? ['cmd',      ['/c', 'start', '', location]] :
    platform === 'darwin' ? ['open',     [location]] :
                            ['xdg-open', [location]];

  const result = spawnSync(bin, argv, { stdio: 'inherit' });
  if (result.error) die('Could not open browser: ' + result.error.message);

  process.stdout.write('Opening ' + location + '\n');
}

// ── usage ──────────────────────────────────────────────────────────────────────

function usage() {
  process.stdout.write(
    'snip — tiny URL shortener CLI\n\n' +
    'Usage:\n' +
    '  snip add <url>    Shorten a URL and print the short link\n' +
    '  snip ls           List all links (code, hits, original URL)\n' +
    '  snip open <code>  Open the link for <code> in the default browser\n' +
    '  snip help         Show this message\n\n' +
    'Environment:\n' +
    '  SNIP_API          Backend base URL (default: http://localhost:3000)\n'
  );
}

// ── dispatch ──────────────────────────────────────────────────────────────────

(async () => {
  switch (cmd) {
    case 'add':    await cmdAdd(args);  break;
    case 'ls':     await cmdLs();       break;
    case 'open':   await cmdOpen(args); break;
    case undefined:
    case 'help':
    case '--help':
    case '-h':     usage(); break;
    default:
      die('Unknown command: ' + cmd + '\nRun "snip help" for usage.');
  }
})().catch(err => die('Unexpected error: ' + (err.message || err)));
