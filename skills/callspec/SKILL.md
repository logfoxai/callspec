---
name: callspec
description: >-
  Use when defining callspec routes, mountSpec, SDK codegen, Result-typed errors,
  MCP, or generated ApiClient code. Read before changing RPC APIs or error contracts.
disable-model-invocation: true
---

# Callspec

Read [README.md](../../README.md) (guide index under Contents) and pick guides under `src/content/docs/`. Links in this repo are **relative paths** — they work in a checkout and on GitHub’s file viewer. Ignore `docs/internal/`.

If you must fetch docs over HTTP without a checkout: `https://raw.githubusercontent.com/logfoxai/callspec/main/` + repo-relative path — never `github.com/.../blob/...` HTML.

## Do not get wrong

1. Handlers **return** `err.*` / domain handles for expected failures. Bare `throw` → `INTERNAL_ERROR`.
2. SDK/codegen reads **`callspec.json`** (`npx callspec …`), **not** OpenAPI.
3. Default `auth` is **`bearer`** — requires `authenticate` on `spec()`, or set `auth: 'none'`.
4. `scope: 'private'` is still mounted; does **not** skip auth. Use `visibility: 'all'` on `mountSpec` to document those routes on that mount.
5. Never re-declare **builtin** codes on route `errors:`. Domain codes must be registered (`defineErrors`).
6. When `!result.ok`, branch on **`result.code`**, not HTTP status. Don’t show `UNKNOWN_ERROR.data` to users.
7. Don’t wire Express error middleware or `express.json()` on the `mountSpec` router — it owns JSON parse and the catch path. Host middleware outside the mount: [Outside Callspec](../../src/content/docs/outside-callspec.md).
8. After route/error changes: regenerate the client (`npx callspec …`).
9. Prefer generated **`ApiClient`** over raw `CallspecClient`.
10. When splitting files, follow [Server layout](../../src/content/docs/server-layout.md) — keep `handler` inline for LSP.
11. **Uploads:** `file()` on an input field — multipart wire; MCP stays JSON-only.
