# MCP

Set `mcp: true` on any route. When any route opts in, `mountSpec` mounts MCP at **`/mcp`** (override with `mcpPath`). Agents call the **same resolvers** as HTTP RPC — same auth, validation, and error codes.

Set `meta.mcpInstructions` for agent-facing guidance in the docs UI connect flow.

This is **API-tool MCP** (live `tools/call` on your server). [Fern's MCP](using-fern-with-callspec.md#mcp) is different — docs Q&A on a Fern-hosted site (Ask Fern), not a substitute for calling your API. You can run both.
