import { join, resolve, sep } from "node:path";

const PORT = parseInt(process.env.PORT ?? "3000", 10);
const BASE_URL =
  process.env.BASE_URL ??
  (process.env.RAILWAY_PUBLIC_DOMAIN
    ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
    : `http://localhost:${PORT}`);
const PUBLIC_DIR = process.env.PUBLIC_DIR
  ? resolve(process.env.PUBLIC_DIR)
  : null;

/** @type {Map<string, {code:string,url:string,shortUrl:string,hits:number,createdAt:string}>} */
const links = new Map();

const BASE62 =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

function generateCode() {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => BASE62[b % 62]).join("");
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

async function tryStatic(pathname) {
  if (!PUBLIC_DIR) return null;

  let rel;
  try {
    rel = decodeURIComponent(pathname === "/" ? "index.html" : pathname.slice(1));
  } catch {
    return null; // malformed percent-encoding
  }

  const filePath = join(PUBLIC_DIR, rel);
  const safe = resolve(filePath);

  // Guard against path-traversal
  if (safe !== PUBLIC_DIR && !safe.startsWith(PUBLIC_DIR + sep)) return null;

  const file = Bun.file(safe);
  if (await file.exists()) return new Response(file, { headers: CORS });
  return null;
}

Bun.serve({
  port: PORT,
  async fetch(req) {
    const { pathname } = new URL(req.url);
    const method = req.method;

    // ── CORS preflight ────────────────────────────────────────────────────────
    if (method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }

    // ── POST /api/links ───────────────────────────────────────────────────────
    if (method === "POST" && pathname === "/api/links") {
      let body;
      try {
        body = await req.json();
      } catch {
        return json({ error: "Invalid JSON" }, 400);
      }

      let parsed;
      try {
        parsed = new URL(body?.url);
      } catch {
        return json({ error: "Invalid URL" }, 400);
      }

      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        return json({ error: "URL must use http or https" }, 400);
      }

      let code;
      do { code = generateCode(); } while (links.has(code));

      const link = {
        code,
        url: body.url,
        shortUrl: `${BASE_URL}/${code}`,
        hits: 0,
        createdAt: new Date().toISOString(),
      };
      links.set(code, link);
      return json(link, 201);
    }

    // ── GET /api/links ────────────────────────────────────────────────────────
    if (method === "GET" && pathname === "/api/links") {
      return json([...links.values()]);
    }

    // ── GET /:code  (and static files) ────────────────────────────────────────
    if (method === "GET") {
      // Static file wins over a short code with the same name
      const staticRes = await tryStatic(pathname);
      if (staticRes) return staticRes;

      // Short-code redirect (single path segment only)
      if (pathname !== "/") {
        const code = pathname.slice(1);
        if (!code.includes("/")) {
          const link = links.get(code);
          if (link) {
            link.hits++;
            return new Response(null, {
              status: 302,
              headers: { ...CORS, Location: link.url },
            });
          }
        }
      }

      return json({ error: "Not found" }, 404);
    }

    return json({ error: "Not found" }, 404);
  },
});

console.log(`Snip backend listening on port ${PORT}`);
console.log(`BASE_URL: ${BASE_URL}`);
if (PUBLIC_DIR) console.log(`Serving static files from: ${PUBLIC_DIR}`);
