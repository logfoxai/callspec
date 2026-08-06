# Callspec — agent guide

Entry point for coding agents. Human-oriented overview: [README.md](README.md). Machine index: [llms.txt](llms.txt).

## Task → doc

| Task | Read first |
|------|------------|
| New project / first route | [getting-started.md](docs/getting-started.md) |
| File layout for routes & schemas | [server-layout.md](docs/server-layout.md) |
| Single-file copy-paste | [complete-example.md](docs/complete-example.md) |
| Test resolver logic (no HTTP) | [unit-testing.md](docs/unit-testing.md) |
| Bearer auth & `authenticate` | [authentication.md](docs/authentication.md) |
| Resolver context typing | [request-context.md](docs/request-context.md) |
| `route`, `spec`, `mountSpec` API | [api-reference.md](docs/api-reference.md) → subpages |
| Errors & Result contract | [error-handling.md](docs/error-handling.md) |
| Generate / pin TypeScript SDK | [sdk-generation.md](docs/sdk-generation.md) |
| Use generated client in app | [client-usage.md](docs/client-usage.md) |
| Shared preds & `--validators` | [shared-validation.md](docs/shared-validation.md) |
| Docs UI & branding | [docs-ui.md](docs/docs-ui.md) |
| MCP tools on your API | [mcp.md](docs/mcp.md) |
| OpenAPI export (not codegen input) | [openapi.md](docs/openapi.md) |
| Fern vs Callspec | [using-fern-with-callspec.md](docs/using-fern-with-callspec.md) |
| Clone repo & run demo | README § [Try the demo](README.md#try-the-demo) |

## Invariants (do not get wrong)

1. **Return failures from resolvers** — `return err.NOT_FOUND()` / domain handles. Do not `throw` for expected failures. See [error-handling.md](docs/error-handling.md).
2. **Codegen reads `callspec.json`**, not OpenAPI. CLI: `npx callspec <mount-or-file> --output …`. OpenAPI is for gateways, Fern, contract tests.
3. **Default SDK = `ApiClient`**. `--validators` is opt-in for `spec.exports` form preds.
4. **`scope: 'private'`** — server-only; omitted from SDK, docs, OpenAPI, MCP list. Does not skip auth.
5. **`auth: 'bearer'`** requires `authenticate` on `spec()` — throws at load time if missing.
6. **After route/error changes** — regenerate client (`npx callspec …`) and commit pinned contract if your repo pins it.
7. **Branch on `result.code`** when `!result.ok`, not HTTP status alone.

## Default mount URLs

With `app.use('/v1', router)` and `mountSpec` defaults (`docs: true`, any route `mcp: true`):

| Surface | Path |
|---------|------|
| RPC | `POST /v1/{methodName}` |
| Docs UI | `/v1/docs` |
| Contract | `/v1/callspec.json` |
| OpenAPI | `/v1/openapi.json` |
| MCP | `/v1/mcp` |

Details: [api-reference/mount-spec.md](docs/api-reference/mount-spec.md).

## Ignore (not product docs)

Do not treat these as API or user documentation:

- `docs/internal/` — plans, review notes, implementation deep-dives
- `docs/internal/*.plan.md`, `*.nits.md`

## Package imports

| Import | Use |
|--------|-----|
| `callspec` | `route`, `spec`, `mountSpec`, `defineErrors`, `err` |
| `callspec/client` | `CallspecClient`, generated `ApiClient` base |
| `callspec/document` | `emitCallspec`, `emitOpenApi`, codegen helpers |
| `callspec/express` | `expressErrorHandler` for non-RPC routers |

Full table: [api-reference/surfaces-and-exports.md](docs/api-reference/surfaces-and-exports.md).
