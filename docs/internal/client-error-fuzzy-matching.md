# Client error fuzzy matching

How `resolveRouteClientError` guesses **builtin** error codes from messy non-callspec responses. Domain errors are never fuzzy-matched — they require validated `{ error, data? }` JSON (codegen passes `domainErrors` schemas).

See also [error-handling.md](../error-handling.md) for the full pipeline.

---

## Where fuzzy sits

Fuzzy is **step 5** (last heuristic before `UNKNOWN_ERROR`):

| Step | Function | What it does |
|------|----------|--------------|
| 1 | `parseCallspecJson` | Exact `{ error, data? }` — builtins + schema-validated domain |
| 2 | `hasExplicitCallspecErrorField` | Undeclared/invalid `{ error }` → `UNKNOWN_ERROR` |
| 3 | `matchExactBodyPhrase` | Whole-body literal phrases |
| 4 | `matchBuiltinByStatus` | HTTP status → builtin code |
| 5 | `matchFuzzyBuiltin` | Loose text → builtin code |
| 6 | `buildUnknownClientError` | Preserve raw body (+ headers) |

Implementation lives under `src/clientErrorNormalization/`.

---

## How fuzzy works

### 1. Extract text (`bodyTextForMatching`)

| Body | Text used |
|------|-----------|
| `"Bad Gateway"` | the string |
| `{ error: "FORBIDDEN" }` | `"FORBIDDEN"` |
| `{ message: "Not found" }` | `"Not found"` |
| `{}` or `[...]` | nothing — fuzzy skipped |

### 2. Normalize (`normalizeFuzzyKey`)

1. Strip HTML tags (for matching only — not stored in `UNKNOWN_ERROR.data.body`)
2. Lowercase
3. Remove spaces, underscores, hyphens

| Input | Key |
|-------|-----|
| `"Bad Gateway"` | `badgateway` |
| `"bad-gateway"` | `badgateway` |
| `"NOT_FOUND"` | `notfound` |
| `"502 Bad Gateway"` | `502badgateway` (no table entry) |

### 3. Lookup (`matchFuzzyBuiltin`)

1. **Phrase table** (`FUZZY_PHRASE_TO_CODE`): `badgateway` → `SERVICE_UNAVAILABLE`, `notfound` → `NOT_FOUND`, etc.
2. **Builtin code string**: if normalized key uppercased is a known `BuiltinErrorCode` (rare in practice — `NOT_FOUND` normalizes to `notfound`, not `NOT_FOUND`).

**Skipped:** `TOO_MANY_REQUESTS` (use status 429 or JSON). **Domain codes** (use step 1 with `domainErrors`).

Fuzzy returns `{ code }` only — never invented `data`.

---

## Exact vs fuzzy

| Body | Exact phrase (step 3) | Fuzzy (step 5) |
|------|----------------------|----------------|
| `"Not Found"` | ✓ `NOT_FOUND` | ✓ `notfound` |
| `"bad-gateway"` | ✗ | ✓ `SERVICE_UNAVAILABLE` |
| `"502 Bad Gateway"` | ✗ | ✗ → `UNKNOWN_ERROR` |

Exact requires the whole body (after HTML strip + lowercase) to equal a table entry. Fuzzy collapses spacing/punctuation.

---

## Example scenarios

| Scenario | Status | Body | Winner | Result |
|----------|--------|------|--------|--------|
| nginx 503 HTML | 503 | `<html>503 Service Unavailable</html>` | Status | `SERVICE_UNAVAILABLE` |
| Plain “Bad Gateway” | 400 | `"Bad Gateway"` | Exact phrase | `SERVICE_UNAVAILABLE` |
| Dashed gateway | 400 | `"bad-gateway"` | Fuzzy | `SERVICE_UNAVAILABLE` |
| 502 HTML, status 400 | 400 | `<html>502 Bad Gateway</html>` | None | `UNKNOWN_ERROR` |
| Random 401 body | 401 | `"something else"` | Status | `UNAUTHORIZED` |
| 403 + “Forbidden” | 403 | `"Forbidden"` | Exact phrase | `FORBIDDEN` |
| 403 + random body | 403 | `"something else"` | Status | `FORBIDDEN` |
| 403 + “Unauthorized” | 403 | `"Unauthorized"` | Exact phrase (before status) | `UNAUTHORIZED` |
| Undeclared JSON | 409 | `{ error: "USER_EXISTS" }` | Step 2 | `UNKNOWN_ERROR` |
| Valid domain JSON | 409 | `{ error: "USER_EXISTS", data: { email: "x" } }` + schemas | JSON | `USER_EXISTS` |
| Generic 500 text | 500 | `"Internal Server Error"` | None | `UNKNOWN_ERROR` |
| Bare 429 | 429 | `""` | Status | `TOO_MANY_REQUESTS` (no fake data) |

**Note:** Step 3 (exact phrase) runs before step 4 (status). A 403 response whose body is literally `"Unauthorized"` maps to `UNAUTHORIZED`, not `FORBIDDEN`.

---

## Known gaps / follow-ups

Documented in [error-handling.nits.md](./error-handling.nits.md) (internal):

- **`502badgateway`** — HTML/error text with status prefix does not fuzzy-match; falls through to `UNKNOWN_ERROR`. Consider adding compound keys or running fuzzy before status for specific cases.
- **Exact-before-status ordering** — body text can override HTTP status (403 + `"Unauthorized"`). Accept or reorder pipeline.
- **Foreign `{ error: "CODE" }` without schema** — always `UNKNOWN_ERROR` when `domainErrors` is required (intentional; no type lies).

---

## Mental model

Fuzzy is a **last-resort builtin guess** for proxy/gateway/middleware responses that are not callspec JSON. When in doubt, the client returns **`UNKNOWN_ERROR`** with the raw body — never fabricated payload fields.
