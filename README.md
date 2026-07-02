# snip-cli

Tiny URL shortener CLI. Zero npm dependencies. Requires Node.js 18+.

## Install

```sh
npm install -g .
```

Or run directly:

```sh
node cli.js <command>
```

## Commands

```
snip add <url>    Shorten a URL; prints the short link
snip ls           List all links — code, hit count, original URL
snip open <code>  Open the link for <code> in the default browser
snip help         Show usage
```

## Configuration

| Variable   | Default                 | Description       |
|------------|-------------------------|-------------------|
| `SNIP_API` | `http://localhost:3000` | Backend base URL  |

```sh
SNIP_API=https://my.domain snip ls
```

## Examples

```sh
$ snip add https://github.com/teng-zi-hang/ai-sdlc-snip-demo
http://localhost:3000/aB3xYz

$ snip ls
CODE    HITS  URL
------  ----  ---
aB3xYz     3  https://github.com/teng-zi-hang/ai-sdlc-snip-demo

$ snip open aB3xYz
Opening https://github.com/teng-zi-hang/ai-sdlc-snip-demo
```

## Notes

- Uses Node's global `fetch` (no `node-fetch` needed).
- `snip open` issues `GET /:code` with `redirect: 'manual'`, reads the `Location`
  header, and launches the URL with `start` / `open` / `xdg-open` depending on OS.
- The package has no `"type": "module"` — CommonJS only.
