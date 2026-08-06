---
name: callspec
description: >-
  Use when defining callspec routes, mountSpec, SDK codegen, Result-typed errors,
  MCP, or generated ApiClient code. Read before changing RPC APIs or error contracts.
disable-model-invocation: true
---

# Callspec

Spec-first TypeScript RPC: one `route()` registry → server, SDK, MCP, docs, OpenAPI.

Human docs: [github.com/logfoxai/callspec/tree/main/docs](https://github.com/logfoxai/callspec/tree/main/docs). Repo README: [README.md](https://github.com/logfoxai/callspec#readme).

## Task → doc

| Task | Read first |
|------|------------|
| New project / first route | [getting-started.md](https://github.com/logfoxai/callspec/blob/main/src/content/docs/getting-started.md) |
| File layout for routes & schemas | [server-layout.md](https://github.com/logfoxai/callspec/blob/main/src/content/docs/server-layout.md) |
| Single-file copy-paste | [complete-example.md](https://github.com/logfoxai/callspec/blob/main/src/content/docs/complete-example.md) |
| Test resolver logic (no HTTP) | [unit-testing.md](https://github.com/logfoxai/callspec/blob/main/src/content/docs/unit-testing.md) |
| Bearer auth & `authenticate` | [authentication.md](https://github.com/logfoxai/callspec/blob/main/src/content/docs/authentication.md) |
| Resolver context typing | [request-context.md](https://github.com/logfoxai/callspec/blob/main/src/content/docs/request-context.md) |
| `route`, `spec`, `mountSpec` API | [api-reference.md](https://github.com/logfoxai/callspec/blob/main/src/content/docs/api-reference.md) |
| Errors & Result contract | [error-handling.md](https://github.com/logfoxai/callspec/blob/main/src/content/docs/error-handling.md) |
| Generate / pin TypeScript SDK | [sdk-generation.md](https://github.com/logfoxai/callspec/blob/main/src/content/docs/sdk-generation.md) |
| Use generated client in app | [client-usage.md](https://github.com/logfoxai/callspec/blob/main/src/content/docs/client-usage.md) |
| Shared preds & `--validators` | [shared-validation.md](https://github.com/logfoxai/callspec/blob/main/src/content/docs/shared-validation.md) |
| Docs UI & branding | [docs-ui.md](https://github.com/logfoxai/callspec/blob/main/src/content/docs/docs-ui.md) |
| MCP tools on your API | [mcp.md](https://github.com/logfoxai/callspec/blob/main/src/content/docs/mcp.md) |
| OpenAPI export (not codegen input) | [openapi.md](https://github.com/logfoxai/callspec/blob/main/src/content/docs/openapi.md) |
| Fern vs Callspec | [using-fern-with-callspec.md](https://github.com/logfoxai/callspec/blob/main/src/content/docs/using-fern-with-callspec.md) |

## Invariants (do not get wrong)

1. **Return failures from resolvers** — `return err.NOT_FOUND()` / domain handles. Do not `throw` for expected failures.
2. **Codegen reads `callspec.json`**, not OpenAPI. CLI: `npx callspec <mount-or-file> --output …`. OpenAPI is for gateways, Fern, contract tests.
3. **Default SDK = `ApiClient`**. `--validators` is opt-in for `spec.exports` form preds.
4. **`scope: 'private'`** — server-only; omitted from SDK, docs, OpenAPI, MCP list. Does not skip auth.
5. **`auth: 'bearer'`** requires `authenticate` on `spec()` — throws at load time if missing.
6. **After route/error changes** — regenerate client (`npx callspec …`) and commit pinned contract if the repo pins it.
7. **Branch on `result.code`** when `!result.ok`, not HTTP status alone.
8. **Do not wire Express error middleware on `mountSpec` routers** — mountSpec owns catch path, logging, and `INTERNAL_ERROR`.

## Default mount URLs

With `app.use('/v1', router)` and `mountSpec` defaults (`docs: true`, any route `mcp: true`):

| Surface | Path |
|---------|------|
| RPC | `POST /v1/{methodName}` |
| Docs UI | `/v1/docs` |
| Contract | `/v1/callspec.json` |
| OpenAPI | `/v1/openapi.json` |
| MCP | `/v1/mcp` |

## Package imports

| Import | Use |
|--------|-----|
| `callspec` | `route`, `spec`, `mountSpec`, `defineErrors`, `err` |
| `callspec/client` | `CallspecClient`, generated `ApiClient` base |
| `callspec/document` | `emitCallspec`, `emitOpenApi`, codegen helpers |
| `callspec/express` | `expressErrorHandler` for non-RPC routers |

## Ignore (not product docs)

Do not treat as API or user documentation:

- `docs/internal/` — plans, review notes, implementation deep-dives

## Logfox monorepo

When working in the Logfox workspace:

- **Skill SSOT:** `libs/callspec/skills/callspec/SKILL.md` — copy into `.cursor/skills/callspec/SKILL.md` when this file changes.
- **Platform architecture / deploy / workers:** logfox-knowledge skill — link, do not duplicate here.
- **Local package:** `libs/callspec` (published npm name: `callspec`).
