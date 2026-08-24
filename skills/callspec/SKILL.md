---
name: callspec
description: >-
  Use when defining callspec routes, mountSpec, SDK codegen, Result-typed errors,
  MCP, or generated ApiClient code. Read before changing RPC APIs or error contracts.
disable-model-invocation: true
---

# Callspec

Docs: [README](https://raw.githubusercontent.com/logfoxai/callspec/main/README.md) (guide index under Contents).

## Rules

1. Handlers **return** `err.*` / domain handles for expected failures. Bare `throw` → `INTERNAL_ERROR`.
2. SDK/codegen reads **`callspec.json`** (`npx callspec …`), **not** OpenAPI.
3. Default `auth` is **`bearer`** — requires `authenticate` on `spec()`, or set `auth: 'none'`.
4. `scope: 'private'` is still mounted; does **not** skip auth. Use `visibility: 'all'` on `mountSpec` to document those routes on that mount.
5. Never re-declare **builtin** codes on route `errors:`. Domain codes must be registered (`defineErrors`).
6. When `!result.ok`, branch on **`result.code`**, not HTTP status. Don’t show `UNKNOWN_ERROR.data` to users.
7. `mountSpec` handles JSON parsing and RPC error responses on the router you pass in. Don't add `express.json()` or Express error middleware there. On the app, use middleware around the mount (rate limits, health checks) and a final `errorHandler` as usual. For Callspec-shaped errors from your middleware, use `sendRouteFailureResponse` — [Outside Callspec](https://raw.githubusercontent.com/logfoxai/callspec/main/src/content/docs/outside-callspec.md).
8. After route/error changes: regenerate the client (`npx callspec …`).
9. Prefer generated **`ApiClient`** over raw `CallspecClient`.
10. Follow [Server layout](https://raw.githubusercontent.com/logfoxai/callspec/main/src/content/docs/server-layout.md) and keep `handler` inline on `route()` calls.