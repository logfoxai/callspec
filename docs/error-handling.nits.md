# Error handling overhaul — review nits

Branch: `feat/error-contract` · [PR #21](https://github.com/logfoxai/callspec/pull/21)

Walkthrough list from a callspec-only review. **Your call** = owner decision; **Fix** = likely before merge unless you disagree.

---

## Fix (likely bugs)

| # | Area | Issue | Status |
|---|------|--------|--------|
| 1 | `client.ts` normalization | ~~String bodies before status; client invented `INTERNAL_ERROR`~~ | **Done** — pipeline: exact JSON → phrases → status → fuzzy → `UNKNOWN_ERROR` with raw body/headers; `INTERNAL_ERROR` server-only |
| 2 | `client.ts` `coerceToRouteClientError` | Builtin wire bodies with missing required `data` (e.g. `{ error: "TOO_MANY_REQUESTS" }` with no payload) cast to `CallspecBuiltinClientError` without validation. Types promise `data`; runtime may be undefined. | Validate required builtin payloads; fall back to `UNKNOWN_ERROR` when shape is wrong. |
| 3 | `defineErrors.ts` → `mountSpec` | Invalid failer args (`err.NOT_FOUND({ message: 123 })`) throw plain `Error` inside `failRouteError`. Caught by mountSpec step 6 → **500 INTERNAL_ERROR**, not a contract outcome. | Document as programmer-error → 500, **or** map to `VALIDATION_ERROR` / rethrow as `CallspecValidationError`. Add integration test either way. |
| 4 | `mountSpec.ts` vs `expressErrorHandler.ts` | Docs say legacy **`RouteError`** is supported. `expressErrorHandler` handles `isRouteError`; **`mountSpec` does not** — thrown `RouteError` → 500 `INTERNAL_ERROR`. | Add `isRouteError` to mountSpec catch order (step 2b), **or** doc that `RouteError` is express-middleware-only and deprecate on RPC routes. |
| 5 | `errors.ts` | `RouteError` JSDoc says “Thrown via defineErrors handles — mapped by mountSpec.” **`defineErrors` returns `RouteFailure`, not `RouteError`**, and mountSpec doesn't map `RouteError`. | Fix comment; align with decision on #4. |

---

## Your call (design)

| # | Area | Issue | Options |
|---|------|--------|---------|
| 6 | Compile-time vs runtime | Undeclared domain failures are a **compile error** on returns; no runtime allowlist if types are bypassed. | A) Document compile-time-only (current). B) Dev-mode runtime check against `route.errors`. C) Prod runtime check → `INTERNAL_ERROR`. |
| 7 | Throw vs return | Returns are compile-time gated; thrown `RouteFailure` is not. Convention: return from handlers, throw in middleware. | A) Do nothing (current). B) ESLint in consumers. C) Dev-only mountSpec warning when caught code ∉ route.errors. |
| 8 | `generateClientSource.ts` | `{Route}Error` includes merged builtins; `CallspecClientErrors<E>` also unions `CallspecBuiltinClientError` — duplicate codes, slightly different `data` types. | A) Generate domain-only `*Error`; rely on builtin union in `CallspecRouteResult`. B) Keep duplication; document. |
| 9 | `generateClientSource.ts` | `allowedErrorCodes` includes builtin keys from `route.errors` (redundant — `coerceToRouteClientError` already checks builtins first). | A) Pass domain-only codes. B) Leave as-is (harmless). |
| 10 | `mountMcp.ts` | MCP failures → tool result `isError: true` + JSON string of `{ error, data? }`. Unhandled throws → JSON-RPC `{ error: { code, message } }`, not HTTP wire. No `handleUnhandledError`, no jsout logging. | A) Document MCP as separate channel. B) Align shapes / add hook parity with mountSpec. |
| 11 | `expressErrorHandler.ts` | Non-mount routes get 500 with **no default logging**; mountSpec logs unhandled via `logUnhandledError`. | A) Document difference. B) Add optional log hook to `expressErrorHandler`. |
| 12 | Legacy `RouteError` export | Docs mention legacy throws; **`RouteError` class not exported** from `callspec` or `callspec/express` (only `isRouteError`, format/send helpers). | A) Export for migration. B) Docs: catch/migrate existing throws only; no new `RouteError`. |

---

## Docs

| # | Gap | Recommendation |
|---|-----|----------------|
| 13 | No **MCP error** section in `error-handling.md` (tool errors vs JSON-RPC errors, auth, no `handleUnhandledError`). | Add § MCP errors. |
| 14 | No **v2 migration** guide (`errors()` → `defineErrors`, return vs throw, client `CallspecRouteResult`, regen steps). | README section or `docs/migration-v2-errors.md`. |
| 15 | `failRouteError` throw → 500 behavior undocumented (see Fix #3). | One line under Rules or handler patterns. |
| 16 | `expressErrorHandler` section omits `RouteError`, no logging, parity with mountSpec. | Expand Non-RPC §. |
| 17 | README § Package exports lists only `CallspecClient` / `isCallspecOk`; omits `normalizeClientErrorBody`, `coerceToRouteClientError`, `isCallspecFailure`, etc. | List client helpers for non-RPC adopters. |
| 18 | Emitted `callspec.json` includes merged builtins on every route — can look like “re-declaring builtins.” | One sentence: emitted for codegen/OpenAPI; don't declare in source. |

---

## Tests

| # | Gap | Recommendation |
|---|-----|----------------|
| 19 | No direct unit tests for `normalizeClientErrorBody` / `coerceToRouteClientError` (edge cases covered only via `callResult` mocks). | Focused `client.spec.ts` cases for Fix #1, #2. |
| 20 | No `expressErrorHandler.spec.ts`. | Cover validation, unauth, `RouteFailure` throw, `RouteError` throw, `INTERNAL_ERROR`, `headersSent`. |
| 21 | MCP error paths untested (returned/thrown `RouteFailure`, validation, unauth, unhandled throw). | Extend `integration.spec.ts` with MCP-enabled failure routes. |
| 22 | HTTP thrown `RouteFailure` (mountSpec catch step 2) untested — returns covered; throws not. | One integration test: `throw err.NOT_FOUND()` in handler. |
| 23 | Validation integration test asserts status 400 only, not `{ error, errors }` body. | Assert full wire shape. |
| 24 | Invalid failer → HTTP response (Fix #3). | Integration test once behavior is decided. |
| 25 | `defineRoute.typecheck.ts` missing helper-extraction patterns (`RouteFailuresFrom`, invalid failer from helper). | Optional compile-only cases. |

---

## Nice-to-have

| # | Item |
|---|------|
| 26 | Omit redundant `{Route}Error` type alias when route has no domain codes (builtins-only). |
| 27 | Document `callspecClientErrorCode` / `isCallspecFailure` when to use vs `isCallspecOk`. |
| 28 | Consider `HTTP_ERROR` removal — unparseable bodies now map to `INTERNAL_ERROR` in `callResult`; `normalizeClientErrorBody` still returns `INTERNAL_ERROR` for empty/garbage (good). |

---

## Suggested merge gate

**Must fix or explicitly accept:** #1 (client string/status mismatch), #4+#5 (RouteError story), #3 (invalid failer behavior + test).

**Should before v2.0.0 publish:** #13–14 (MCP + migration docs), #19–22 (test gaps on client + express + MCP + throw).

**Can defer:** #6–12 design nits, #8–9 codegen cleanup, #25–28.
