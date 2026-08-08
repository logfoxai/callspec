---
name: callspec
description: >-
  Use when defining callspec routes, mountSpec, SDK codegen, Result-typed errors,
  MCP, or generated ApiClient code. Read before changing RPC APIs or error contracts.
disable-model-invocation: true
---

# Callspec

Start at the [README Contents](https://github.com/logfoxai/callspec#contents) — pick the guide under `src/content/docs/`. Ignore `docs/internal/`.

## Do not get wrong

1. Handlers **return** `err.*` / domain handles for expected failures. Bare `throw` → `INTERNAL_ERROR`.
2. SDK/codegen reads **`callspec.json`** (`npx callspec …`), **not** OpenAPI.
3. Default `auth` is **`bearer`** — requires `authenticate` on `spec()`, or set `auth: 'none'`.
4. `scope: 'private'` omits from SDK/docs/OpenAPI/MCP; still mounted; does **not** skip auth.
5. Never re-declare **builtin** codes on route `errors:`. Domain codes must be registered (`defineErrors`).
6. When `!result.ok`, branch on **`result.code`**, not HTTP status. Don’t show `UNKNOWN_ERROR.data` to users.
7. Don’t wire Express error middleware / jsout on the `mountSpec` router — it owns the catch path.
8. After route/error changes: regenerate the client; commit pinned contract if the repo pins one.
9. Prefer generated **`ApiClient`** over raw `CallspecClient`. Form preds live on generated **`schemas`** (from `exports` + route wire shapes).
10. Fern docs MCP ≠ Callspec `/mcp` tools — different jobs.
