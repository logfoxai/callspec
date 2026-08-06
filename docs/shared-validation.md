# Shared validation

Routes declare wire validation once. Codegen gives the frontend the same **types** (and, with `exports`, **named runtyp preds**) so forms and RPC stay in sync.

| What | Where | Who uses it |
|------|-------|-------------|
| RPC methods | `spec({ routes })` | Server + generated `ApiClient` |
| Request/response shapes | Route file — colocated `input` / `output` preds | Server boundary + generated `{Route}Input` types |
| Shared UI slices | `spec({ exports })` | Filters, modals — same pred as server |
| UI-only fields | Consumer app | Never in the spec |

Route **input and output** preds belong in the route file, not a shared `schemas/` folder. Use **`exports`** only when the frontend needs a named pred beyond generated route types.

Register preds under **`exports`** when consumers should import them. Composition inside a route input does not auto-export the slice.

Powered by [runtyp](https://github.com/logfoxai/runtyp): preds validate on the server and serialize to JSON Schema for docs, OpenAPI, MCP, and codegen.

Generate validators with `--validators` — see [SDK generation](sdk-generation.md). Example layout: [Server layout](server-layout.md).
