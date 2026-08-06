# Overview

- **`defineErrors()`** — domain error maps; shorthand **`err`** is builtins-only.
- **Return failures from resolvers** — `return err.NOT_FOUND()` / `return registerErr.USER_EXISTS({ … })`; success is a plain route output object.
- **`RouteFailure`** — `{ ok: false, code, status, data? }` from resolvers and from `defineErrors` / `err` handles.
- **Builtins on every route** — merged at `defineRoute` time; automatic in OpenAPI, `callspec.json`, and every client `*Result` union. Do not re-declare builtin codes on routes.
- **Strict domain registration** — returned domain codes must appear on the route; TypeScript checks resolver return types against `errors:` at compile time (no runtime allowlist).
- **`BUILTIN_ERROR`** — one constant namespace for all automatic codes (validation, auth, route-not-found, etc.).
- Client Result — `{ ok: true, value } | { ok: false, status, code, data? }`. Branch on `code` when `!result.ok`. Every failure union includes client-only **`UNKNOWN_ERROR`** (HTTP response outside the route contract) and **`NETWORK_ERROR`** (no HTTP response — DNS, offline, abort; `status: 0`).
- **Codegen** — after changing routes or error specs, rerun `npx callspec …` and refresh generated client types.

Framework validation and auth **throw** `CallspecValidationError` / `CallspecUnauthorizedError` — mountSpec maps those inline. Any other unhandled error becomes **`INTERNAL_ERROR`** (see [mountSpec runtime](mountspec-runtime.md)).

← [Error handling](../error-handling.md)
