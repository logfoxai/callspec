# Docs UI

`mountSpec` serves a white-label explorer at **`/docs`** by default — try RPCs, browse schemas, connect MCP clients. Contract paths are fixed: **`/callspec.json`**, **`/openapi.json`**. Override only the UI mount with `docsPath`; pass `{docs: false}` to disable docs surfaces.

Whitelabel via `meta` (`title`, `intro`, `website`, `logo`, `authHint`, `mcpInstructions`).

See [API reference § mountSpec](api-reference.md#mountspec) for options.
