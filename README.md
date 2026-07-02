# Snip — URL Shortener

One backend, two clients. Each layer lives on its own orphan branch and is wired
here as a Git submodule.

---

## Architecture

```
Browser / CLI  ──►  Bun HTTP server  ──►  in-memory Map
```

- **Backend** (`backend/`) — zero-dependency Bun server; stores links in an
  in-memory `Map`; open CORS so any origin can call it.
- **Frontend** (`frontend/`) — Angular 19 SPA; pill-shaped URL input; live links
  table; dark design inspired by Lovable.dev.
- **CLI** (`cli/`) — Node.js 18 CommonJS script; `snip add`, `snip ls`,
  `snip open`; zero npm dependencies; uses global `fetch`.

---

## API Contract

All endpoints are served by the Bun backend on `PORT` (default `3000`).

| Method | Path          | Request body                  | Success response                                       | Error                   |
|--------|---------------|-------------------------------|--------------------------------------------------------|-------------------------|
| `POST` | `/api/links`  | `{ "url": "https://…" }`     | `201 { code, url, shortUrl, hits, createdAt }`        | `400 { error }` on bad/non-http(s) URL |
| `GET`  | `/api/links`  | —                             | `200` array of link objects (same shape)               | —                       |
| `GET`  | `/:code`      | —                             | `302 Location: <original URL>`, increments `hits`      | `404 { error }` if unknown |
| `OPTIONS` | `*`        | —                             | `204` CORS preflight                                   | —                       |

Link object shape:

```json
{
  "code":      "aB3xYz",
  "url":       "https://example.com/long/path",
  "shortUrl":  "http://localhost:3000/aB3xYz",
  "hits":      3,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

---

## Repository Layout

```
snip-demo/            ← superproject  (main branch)
├── .gitmodules
├── backend/          ← submodule → origin/backend   (Bun server)
├── frontend/         ← submodule → origin/frontend  (Angular 19 SPA)
└── cli/              ← submodule → origin/cli       (Node CLI)
```

Each submodule is an **orphan branch** in this same repository — branches share no
commit history with each other.

---

## Clone

Always pass `--recurse-submodules`; without it the three subdirectories are
checked out empty.

```sh
git clone --recurse-submodules https://github.com/teng-zi-hang/ai-sdlc-snip-demo.git
cd ai-sdlc-snip-demo
```

Fix an existing shallow clone:

```sh
git submodule update --init --recursive
```

---

## Run

### 1 · Backend

Requires [Bun](https://bun.sh) (or `npm install -g bun`).

```sh
cd backend
bun run server.js
# Listening on http://localhost:3000
```

Optional env vars:

| Variable               | Default                  | Purpose                              |
|------------------------|--------------------------|--------------------------------------|
| `PORT`                 | `3000`                   | Port to listen on                    |
| `BASE_URL`             | `http://localhost:<PORT>`| Origin used in `shortUrl` values     |
| `RAILWAY_PUBLIC_DOMAIN`| —                        | Auto-sets `BASE_URL` to `https://…`  |
| `PUBLIC_DIR`           | —                        | Serve static files from this folder  |

### 2 · Frontend (dev server)

Requires Node.js 18+.

```sh
cd frontend
npm install
npx ng serve --open
# http://localhost:4200
```

Production build (output → `dist/snip-frontend/browser/`):

```sh
npx ng build
```

Point the Angular app at a remote backend by setting `API` in
`src/app/links.service.ts`, or serve the build output via `PUBLIC_DIR` on the
backend itself.

### 3 · CLI

Requires Node.js 18+.

```sh
cd cli
node cli.js help

node cli.js add https://github.com/teng-zi-hang/ai-sdlc-snip-demo
# http://localhost:3000/aB3xYz

node cli.js ls
# CODE    HITS  URL
# ------  ----  ---
# aB3xYz     3  https://github.com/teng-zi-hang/ai-sdlc-snip-demo

node cli.js open aB3xYz
# Opening https://github.com/teng-zi-hang/ai-sdlc-snip-demo
```

Install globally and use the `snip` wrapper:

```sh
npm install -g .     # inside cli/
snip ls
```

Set `SNIP_API` to target a remote backend:

```sh
SNIP_API=https://my.domain snip ls
```

---

## Update Workflow

### Push a change inside a submodule, then bump the superproject pointer

```sh
# 1. Work in the submodule as a normal repo
cd backend
# … edit server.js …
git add .
git commit -m "fix: something"
git push

# 2. Back in the superproject, advance the pinned commit
cd ..
git submodule update --remote backend   # fast-forwards pointer to latest remote HEAD
git add backend
git commit -m "chore: bump backend"
git push
```

### Pull the latest pointer after someone else bumped it

```sh
git pull
git submodule update --init --recursive
```
