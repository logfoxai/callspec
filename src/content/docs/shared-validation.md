# Shared validation

Routes declare wire validation once. Codegen gives the frontend the same **types** and a **`schemas`** map of **named runtyp preds** so forms and RPC stay in sync.

| What | Where | Who uses it |
|------|-------|-------------|
| RPC methods | `spec({ routes })` | Server + generated `ApiClient` |
| Shared domain entities | `schemas/` (or similar) — `Product`, `User`, … | Imported by route `input` / `output` |
| Route-specific wire shapes | Route file — IDs, filters, one-off wrappers | That route's generated `{Route}Input` / output types + `schemas.{route}Input` |
| Shared UI slices | `spec({ exports })` | Filters, modals — `schemas.product`, `type Product` |
| UI-only fields | Consumer app | Never in the spec |

Share domain preds like **`Product`** across routes; keep method-specific shapes (e.g. `{ id }` lookup input) in the route file. **`exports`** is optional — register shared preds when the frontend should import them by name from `schemas`.

Composition inside a route input does not auto-export the slice — list it under **`exports`** when consumers need that name.

Powered by [runtyp](https://github.com/logfoxai/runtyp): preds validate on the server and serialize to JSON Schema for docs, OpenAPI, MCP, and codegen.

One command writes client + schemas — see [SDK generation](./sdk-generation.md). Example layout: [Server layout](./server-layout.md).
