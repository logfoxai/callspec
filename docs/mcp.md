# MCP

**Quick facts**

| | |
|--|--|
| Enable | `mcp: true` on any `route()` |
| Endpoint | `{mount}/mcp` (default; override `mcpPath` on `mountSpec`) |
| Behavior | Same resolvers as HTTP RPC — same auth, validation, error codes |
| Agent hints | `meta.mcpInstructions` (shown in docs UI MCP connect flow) |
| Export | Only `scope: 'public'` routes appear in `tools/list` |

Set `mcp: true` on any route. When any route opts in, `mountSpec` mounts MCP automatically.

Set `meta.mcpInstructions` for agent-facing guidance in the docs UI connect flow.

This is **API-tool MCP** (live `tools/call` on your server). [Fern's MCP](using-fern-with-callspec.md#mcp) is different — docs Q&A on a Fern-hosted site (Ask Fern), not a substitute for calling your API. You can run both.

See also: [`mountSpec` options](api-reference/mount-spec.md) · [Docs UI](docs-ui.md)
