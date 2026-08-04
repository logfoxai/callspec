# Error handling overhaul — review nits

Branch: `feat/error-contract` · [PR #21](https://github.com/logfoxai/callspec/pull/21)

Walkthrough list from a callspec-only review. **Your call** = owner decision; **Fix** = likely before merge unless you disagree.

---

## Fix (likely bugs)

| # | Area | Issue | Status |
|---|------|--------|--------|
| 1 | Client normalization pipeline | ~~String bodies before status; client invented `INTERNAL_ERROR`~~ | **Done** — exact JSON → undeclared `{ error }` → exact phrase → status → fuzzy → `UNKNOWN_ERROR`; `INTERNAL_ERROR` server-only |
| 2 | Client payload contract | ~~Missing/invalid `data` cast to typed errors; synthetic TMR fields~~ | **Done** — validate domain payloads via `domainErrors` schemas or `UNKNOWN_ERROR`; optional TMR; no invented fields; server `failRouteError` validates on emit |
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
| 9 | `generateClientSource.ts` | `allowedErrorCodes` includes builtin keys from `route.errors` (redundant — builtins parsed in `parseBuiltinFromWire` first). | A) Pass domain-only codes. B) Leave as-is (harmless). |
| 10 | `mountMcp.ts` | MCP failures → tool result `isError: true` + JSON string of `{ error, data? }`. Unhandled throws → JSON-RPC `{ error: { code, message } }`, not HTTP wire. No `handleUnhandledError`, no jsout logging. | A) Document MCP as separate channel. B) Align shapes / add hook parity with mountSpec. |
| 11 | `expressErrorHandler.ts` | Non-mount routes get 500 with **no default logging**; mountSpec logs unhandled via `logUnhandledError`. | A) Document difference. B) Add optional log hook to `expressErrorHandler`. |
| 12 | Legacy `RouteError` export | Docs mention legacy throws; **`RouteError` class not exported** from `callspec` or `callspec/express` (only `isRouteError`, format/send helpers). | A) Export for migration. B) Docs: catch/migrate existing throws only; no new `RouteError`. |

---

## Fuzzy matching follow-ups

See [client-error-fuzzy-matching.md](./client-error-fuzzy-matching.md) for how fuzzy works today.

| # | Area | Issue | Options |
|---|------|--------|---------|
| 29 | `matchBuiltinHeuristics` | `"502 Bad Gateway"` normalizes to `502badgateway` — not in phrase table → `UNKNOWN_ERROR` even when human-readable. | A) Add compound/normalized keys. B) Accept as `UNKNOWN_ERROR` (current). |
| 30 | Pipeline order | Exact phrase (step 3) runs **before** status (step 4) — e.g. HTTP 403 + body `"Unauthorized"` → `UNAUTHORIZED`, not `FORBIDDEN`. | A) Accept. B) Status before phrase. C) Status wins when body contradicts. |
| 31 | Fuzzy scope | Domain codes no longer fuzzy-matched (intentional — validate or `UNKNOWN`). | **Done** — document only. |

---

## Docs

| # | Gap | Recommendation | Status |
|---|-----|----------------|--------|
| 13 | No **MCP error** section in `error-handling.md` | Add § MCP errors. | Open |
| 14 | No **v2 migration** guide | README section or `docs/migration-v2-errors.md`. | Open |
| 15 | `failRouteError` throw → 500 behavior undocumented (see Fix #3) | One line under Rules or handler patterns. | Open |
| 16 | `expressErrorHandler` section omits `RouteError`, no logging, parity with mountSpec | Expand Non-RPC §. | Open |
| 17 | README § Package exports omits client helpers | List `normalizeClientErrorBody`, `isCallspecFailure`, etc. | Open |
| 18 | Emitted `callspec.json` includes merged builtins on every route | One sentence: emitted for codegen/OpenAPI; don't declare in source. | Open |
| 32 | Fuzzy matching behavior | [client-error-fuzzy-matching.md](./client-error-fuzzy-matching.md) | **Done** |

---

## Tests

| # | Gap | Recommendation | Status |
|---|-----|----------------|--------|
| 19 | Client normalization edge cases | Module tests under `clientErrorNormalization/` + `clientErrorDataValidation.spec.ts` | **Done** |
| 20 | No `expressErrorHandler.spec.ts` | Cover validation, unauth, `RouteFailure` throw, `RouteError` throw, `INTERNAL_ERROR`, `headersSent`. | Open |
| 21 | MCP error paths untested | Extend `integration.spec.ts` with MCP-enabled failure routes. | Open |
| 22 | HTTP thrown `RouteFailure` untested | One integration test: `throw err.NOT_FOUND()` in handler. | Open |
| 23 | Validation integration test asserts status 400 only | Assert full `{ error, errors }` wire shape. | Open |
| 24 | Invalid failer → HTTP response (Fix #3) | Integration test once behavior is decided. | Open |
| 25 | `defineRoute.typecheck.ts` missing helper-extraction patterns | Optional compile-only cases. | Open |

---

## Nice-to-have

| # | Item |
|---|------|
| 26 | Omit redundant `{Route}Error` type alias when route has no domain codes (builtins-only). |
| 27 | Document `callspecClientErrorCode` / `isCallspecFailure` when to use vs `isCallspecOk`. |
| 28 | Consider `HTTP_ERROR` removal — unparseable bodies → `UNKNOWN_ERROR` (current). |

---

## Suggested merge gate

**Must fix or explicitly accept:** #4+#5 (RouteError story), #3 (invalid failer behavior + test).

**Should before v2.0.0 publish:** #13–14 (MCP + migration docs), #20–22 (express + MCP + throw tests).

**Can defer:** #6–12 design nits, #8–9 codegen cleanup, #25–28, #29–30 fuzzy follow-ups.
