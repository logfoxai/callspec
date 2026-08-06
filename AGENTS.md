# Callspec — agent guide

Entry point for coding agents. Human-oriented overview: [README.md](https://github.com/logfoxai/callspec#readme). Machine index: [llms.txt](https://github.com/logfoxai/callspec/blob/main/llms.txt). Doc site: [/getting-started](/getting-started).

## Task → doc

| Task | Read first |
|------|------------|
| New project / first route | [Getting started](/getting-started) |
| File layout for routes & schemas | [Server layout](/server-layout) |
| Single-file copy-paste | [Complete example](/complete-example) |
| Test resolver logic (no HTTP) | [Unit testing](/unit-testing) |
| Bearer auth & `authenticate` | [Authentication](/authentication) |
| Resolver context typing | [Request context](/request-context) |
| `route`, `spec`, `mountSpec` API | [API reference](/api-reference) → subpages |
| Errors & Result contract | [Error handling](/error-handling) |
| Generate / pin TypeScript SDK | [SDK generation](/sdk-generation) |
| Use generated client in app | [Client usage](/client-usage) |
| Shared preds & `--validators` | [Shared validation](/shared-validation) |
| Docs UI & branding | [Docs UI](/docs-ui) |
| MCP tools on your API | [MCP](/mcp) |
| OpenAPI export (not codegen input) | [OpenAPI](/openapi) |
| Fern vs Callspec | [Callspec + Fern](/using-fern-with-callspec) |
| Clone repo & run demo | [Try the demo](/#try-the-live-api-demo) |

## Invariants (do not get wrong)

1. **Return failures from resolvers** — `return err.NOT_FOUND()` / domain handles. Do not `throw` for expected failures. See [Error handling](/error-handling).
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

Details: [mountSpec](/api-reference/mount-spec).

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

Full table: [Surfaces & exports](/api-reference/surfaces-and-exports).
