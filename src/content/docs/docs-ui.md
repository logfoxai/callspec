---
title: Docs UI
---

**Quick facts**

| | |
|--|--|
| Default path | `{mount}/docs` (override `docsPath` only — contract paths stay fixed) |
| Contract fetch | UI loads `{mount}/callspec.json` (relative to docs path) |
| Disable | `mountSpec(router, spec, {docs: false})` — also hides `/callspec.json` and `/openapi.json` |
| Branding | `meta.title`, `intro`, `website`, `logo`, `authHint`, `mcpInstructions` |
| Features | Try RPCs, browse schemas, MCP connect flow |

`mountSpec` serves a white-label explorer at **`/docs`** by default — try RPCs, browse schemas, connect MCP clients.

Whitelabel via `meta` (`title`, `intro`, `website`, `logo`, `authHint`, `mcpInstructions`).

See [`mountSpec` options](/api-reference/mount-spec/) · [MCP](/mcp/)
