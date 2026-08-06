# Client error normalization

`CallspecClient.callResult` maps failures to typed `{ ok: false, status, code, data? }` results. **`INTERNAL_ERROR` is only used when the server sends that code on the wire** — the client never invents it during HTTP normalization.

## Transport failures

If `fetch` throws (DNS failure, offline, abort, etc.) before any HTTP response, the client returns:

```typescript
{ ok: false, status: 0, code: 'NETWORK_ERROR', data: { message, name? } }
```

`status: 0` means no response. `data.message` / `data.name` come from the thrown `Error` when available. This is client-only (not in `callspec.json`).

## HTTP failure pipeline (in order)

1. **Exact callspec JSON** — `{ error: "CODE", data? }` (and `errors` on `VALIDATION_ERROR`). Builtin codes and route-declared domain codes map to typed failures when the wire shape validates. Domain payloads are checked against `callspec.json` schemas (codegen passes `domainErrors`). An `{ error }` field that fails validation or is undeclared becomes **`UNKNOWN_ERROR`** (preserves raw body).
2. **Exact body phrases** — case-insensitive literals such as `Unauthorized`, `Forbidden`, `Bad Gateway`, `Service Unavailable`.
3. **HTTP status** — takes priority over fuzzy body matching. Examples: 401 → `UNAUTHORIZED`, 502/503/504 → `SERVICE_UNAVAILABLE`, 429 → `TOO_MANY_REQUESTS` (code only when the body has no validated payload). Unmapped statuses fall through.
4. **Fuzzy body match** — strip HTML for matching only; normalize case/spacing/underscores; map phrases (`badgateway`, `unauthorized`, …) and code-like strings to known builtins or declared domain codes.
5. **`UNKNOWN_ERROR`** (client-only, not in `callspec.json`) — `{ code: 'UNKNOWN_ERROR', data: { body, headers? } }`. **`body` is the raw parsed response** (string or JSON) for operator debugging; **`headers`** are response headers when present. Do not show `UNKNOWN_ERROR.data` to end users — log or devtools only.

HTML tag stripping applies **only** while matching (steps 2–4). It is not applied to `UNKNOWN_ERROR.data.body`.

For non-RPC / legacy routes, **`normalizeClientErrorBody(status, body, options?)`** from `callspec/client` runs the same HTTP pipeline (optional `responseHeaders` in options).

For fuzzy-matching implementation notes, see `docs/internal/` in the repo (not published on this site).

← [Error handling](../error-handling.md)
