---
title: Shared validation
---

Routes declare wire validation once. Codegen gives the frontend the same **types** (and, with `exports`, **named runtyp preds**) so forms and RPC stay in sync.

| What | Where | Who uses it |
|------|-------|-------------|
| RPC methods | `spec({ routes })` | Server + generated `ApiClient` |
| Shared domain entities | `schemas/` (or similar) — `Product`, `User`, … | Imported by route `input` / `output` |
| Route-specific wire shapes | Route file — IDs, filters, one-off wrappers | That route's generated `{Route}Input` / output types |
| Shared UI slices | `spec({ exports })` | Filters, modals — same pred as server |
| UI-only fields | Consumer app | Never in the spec |

Share domain preds like **`Product`** across routes; keep method-specific shapes (e.g. `{ id }` lookup input) in the route file. **`exports`** is optional — register shared preds when the frontend should import them by name.

Register preds under **`exports`** when consumers should import them. Composition inside a route input does not auto-export the slice.

Powered by [runtyp](https://github.com/logfoxai/runtyp): preds validate on the server and serialize to JSON Schema for docs, OpenAPI, MCP, and codegen.

Generate validators with `--validators` — see [SDK generation](sdk-generation.md). Example layout: [Server layout](server-layout.md).
