# Snip — Backend

Tiny URL shortener. Single-file Bun server, zero npm dependencies.

## Start

```sh
bun run server.js
# or
bun start
```

## Environment variables

| Variable                 | Default                          | Description                                                          |
|--------------------------|----------------------------------|----------------------------------------------------------------------|
| `PORT`                   | `3000`                           | Port to listen on                                                    |
| `BASE_URL`               | `http://localhost:<PORT>`        | Origin prepended to every `shortUrl`                                 |
| `RAILWAY_PUBLIC_DOMAIN`  | —                                | Used as HTTPS origin for `shortUrl` when `BASE_URL` is not set       |
| `PUBLIC_DIR`             | —                                | Serve static files from this folder; `GET /` returns `index.html`   |

When both `BASE_URL` and `RAILWAY_PUBLIC_DOMAIN` are unset the server falls back to `http://localhost:<PORT>`.

## API

### `POST /api/links`

Create a short link.

**Body** `application/json`
```json
{ "url": "https://example.com/very/long/path" }
```

**201 Created**
```json
{
  "code": "aB3xYz",
  "url": "https://example.com/very/long/path",
  "shortUrl": "http://localhost:3000/aB3xYz",
  "hits": 0,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

Returns `400` on invalid JSON or a URL that is not `http`/`https`.

---

### `GET /api/links`

Return all links as a JSON array (same shape as above).

---

### `GET /:code`

Redirect (`302`) to the original URL and increment `hits`.  
Returns `404` if the code is unknown.

When `PUBLIC_DIR` is set, an existing file at `PUBLIC_DIR/:code` is served instead of performing a redirect.

## Notes

- Codes are 6 random base-62 characters (`[A-Za-z0-9]`).
- Links are stored in an in-memory `Map`; they are lost on restart.
- Full CORS support (`*`) — safe to call from any browser origin.
