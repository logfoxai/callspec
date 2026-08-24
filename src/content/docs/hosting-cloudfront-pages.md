# Hosting Docs UI (CloudFront / Pages)

Serve the Callspec [Docs UI](./docs-ui.md) behind **CloudFront**, **S3**, or **Cloudflare/Netlify Pages** so it feels like a native product surface &mdash; without Fern.

Live data (`callspec.json`, OpenAPI, RPC, MCP) always comes from your API process. Only the UI shell and assets can move to a CDN.

## Choose a pattern

| Pattern | When to use | Callspec work |
|---------|-------------|----------------|
| **A &mdash; Reverse proxy** | Same origin as the API; simplest | None (document + infra) |
| **B &mdash; Static export** | UI on S3/Pages; API elsewhere | `export-docs-ui` + absolute URLs + CORS |
| **C &mdash; Shared SPA distribution** | Apex path like `/docs` next to marketing | Infra behaviors (+ A or B) |

### Pattern A &mdash; Reverse proxy → API

```
Browser → CloudFront / Pages → api.example.com/v1/docs/
```

All `/docs/*`, `callspec.json`, RPC, and MCP hit the API (via CloudFront behavior, Caddy, or ALB). Relative `specUrl` / `rpcBase` from `mountSpec` keep working.

- **Pros:** No export step; try-it and MCP stay colocated
- **Cons:** HTML is not a pure edge object (cache GET `/docs/` with a short TTL if you want)
- **Logfox fit:** CloudFront behavior or path rewrite on the API host

No Callspec code changes. Use Express cache headers from `mountCallspecUi` (HTML `no-cache`, hashed JS/CSS `immutable`).

### Pattern B &mdash; Static UI on CDN + API for JSON/RPC

```
/docs/*  → S3 + CloudFront (exported shell + assets)
/v1/*    → API (callspec.json, openapi.json, RPC, MCP)
```

1. Build Callspec (`npm run build` or install the published package).
2. Export a deployable folder:

```bash
callspec export-docs-ui --out ./docs-ui-dist \
  --spec-url https://api.example.com/v1/callspec.json \
  --rpc-base https://api.example.com/v1 \
  --mcp-url https://api.example.com/v1/mcp \
  --title "Acme API"
```

3. Upload `docs-ui-dist/` (`aws s3 sync`, Pages, Netlify).
4. Enable **CORS** on the API for the docs origin (try-it browser fetches).
5. Set CDN `Cache-Control` for hashed `/assets/*` to long-lived / immutable; keep `index.html` short TTL or `no-cache`.

Absolute `specUrl`, `rpcBase`, and `mcp.url` are plain strings &mdash; the browser `fetch` / `URL` APIs accept them as-is.

When `--rpc-base` is an `http(s)` URL and you omit `--mcp-path` / `--mcp-url`, export defaults `mcpPath` to `{rpcBase}/mcp` so MCP does not resolve against the CDN docs origin.

### Pattern C &mdash; Same distribution as a marketing SPA

Extend your static frontend CloudFront (or Pages) map:

| Path | Origin |
|------|--------|
| `/docs/*` | S3 (exported UI) **or** API reverse proxy (Pattern A) |
| `/*` | Marketing / app SPA |

Subpath on the apex (`example.com/docs`) is DNS + behaviors &mdash; not a separate `docs.` host.

## CloudFront sketch (Pattern B)

- Behavior `/docs/assets/*` → S3; cache policy honors origin `Cache-Control` (hashed JS/CSS are `immutable`)
- Behavior `/docs*` → S3; `index.html` short TTL / `no-cache`
- API remains a separate origin for `/v1/*` (or your mount)

## Pages / Netlify rewrite (Pattern A)

Point `/docs/*` (and API paths you need) at the API origin &mdash; same idea as a Fern reverse proxy. Prefer Pattern A when you do not need a separate static bucket.

## CORS checklist (Pattern B)

- Allow the docs origin on API CORS
- Allow methods used by try-it (`POST`, `OPTIONS`)
- Allow `Authorization` if routes use bearer auth
- MCP over HTTP may need the same origin allowlist depending on the client

## Related

- [Docs UI](./docs-ui.md)
- [Branding](./docs-ui-branding.md)
- [`mountSpec`](./api-reference/mount-spec.md)
