# MCP

**Quick facts**

| | |
|--|--|
| Enable | `mcp: true` on any `route()` |
| Endpoint | `{mount}/mcp` (default; override `mcpPath` on `mountSpec`) |
| Behavior | Same handlers as HTTP RPC — same auth, validation, error codes |
| Agent hints | `meta.mcpInstructions` (MCP server `instructions`; docs UI connect panel shows `authHint` instead) |
| Export | Only `scope: 'public'` routes appear in `tools/list` |

Set `mcp: true` on any route. When any route opts in, `mountSpec` mounts MCP automatically.

Set `meta.mcpInstructions` for the MCP server `instructions` field. Use `meta.authHint` for Bearer guidance in the docs UI connect panel on the home page.

This is **API-tool MCP** (live `tools/call` on your server). [Fern's MCP](./using-fern-with-callspec.md#mcp) is different — docs Q&A on a Fern-hosted site (Ask Fern), not a substitute for calling your API. You can run both.

See also: [`mountSpec` options](./api-reference/mount-spec.md) · [Docs UI](./docs-ui.md)

