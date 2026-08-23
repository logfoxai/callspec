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
7. The **router passed to `mountSpec`** already gets `express.json`, malformed-JSON → `VALIDATION_ERROR`, and per-route RPC error handling — don't add those again on that router. You can still use normal Express on the **app**: middleware around the mount (rate limits, health checks) and a final `errorHandler` for non-RPC routes and stray errors. For Callspec-shaped bodies from your middleware, use `sendRouteFailureResponse` — [Outside Callspec](https://raw.githubusercontent.com/logfoxai/callspec/main/src/content/docs/outside-callspec.md).
8. After route/error changes: regenerate the client (`npx callspec …`).
9. Prefer generated **`ApiClient`** over raw `CallspecClient`.
10. Follow [Server layout](https://raw.githubusercontent.com/logfoxai/callspec/main/src/content/docs/server-layout.md) and keep `handler` inline on `route()` calls.
