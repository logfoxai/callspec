---
name: callspec
description: >-
  Use when defining callspec routes, mountSpec, SDK codegen, Result-typed errors,
  MCP, generated ApiClient code, or migrating a frontend/CLI off express-typed-rpc
  or a shared types package. Read before changing RPC APIs, client imports, or error contracts.
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
6. When `!result.ok`, branch on **`result.code`**, not HTTP status. **Handle the codes that matter for that screen; send the rest through a shared helper.** Don't show `UNKNOWN_ERROR.data` to users.
7. `mountSpec` handles JSON parsing and RPC error responses on the router you pass in. Don't add `express.json()` or Express error middleware there. On the app, use middleware around the mount (rate limits, health checks) and a final `errorHandler` as usual. For Callspec-shaped errors from your middleware, use `sendRouteFailureResponse` — [Outside Callspec](https://raw.githubusercontent.com/logfoxai/callspec/main/src/content/docs/outside-callspec.md).
8. After route/error changes: regenerate the client (`npx callspec …`).
9. Prefer generated **`ApiClient`** over raw `CallspecClient`.
10. Follow [Server layout](https://raw.githubusercontent.com/logfoxai/callspec/main/src/content/docs/server-layout.md) and keep `handler` inline on `route()` calls.

## Consumer apps (frontend, CLI)

The generated file **is** the SDK. See [SDK generation](https://raw.githubusercontent.com/logfoxai/callspec/main/src/content/docs/sdk-generation.md).

- Import **`ApiClient`**, route types, and **`schemas`** from the codegen output (e.g. `src/generated/api`). Use them directly.
- **`"generate:api": "callspec <source> --output src/generated/api.ts"`** in package.json. No custom codegen scripts.
- **Do not** add `src/api/`, barrel re-export `index.ts`, wrapper clients, duplicate enum files, re-export barrels in `domain/`, or a second type surface on top of generated exports.
- **Enums:** codegen emits `export const IssueStatus = { open: 'open', ... }` (3.12+). Import from generated — do not add `apiEnums.ts`. Numeric ranges (e.g. log level `0`–`7`) stay as `number`; use literals or UI maps.
- **OK:** one small app helper that constructs `new ApiClient({ baseUrl, headers })` from config/session (not a subclass or facade).
- **OK:** a shared **`handleFailure`** / **`throwRouteFailure`** (see [client-usage](https://raw.githubusercontent.com/logfoxai/callspec/main/src/content/docs/client-usage.md)) — check `result.ok` at the call site; map unhandled codes in one helper. No `unwrapResult` wrapper that hides the Result check.
- **Migrating** off `express-typed-rpc` / `@logfoxai/types`: read [SDK generation § Migrating](https://raw.githubusercontent.com/logfoxai/callspec/main/src/content/docs/sdk-generation.md#migrating-from-express-typed-rpc--shared-types-packages) — do not recreate the old import paths.