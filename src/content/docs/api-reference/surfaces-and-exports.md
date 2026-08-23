# Surfaces & package exports

## Errors

Errors are **typed return possibilities**, not mystery exceptions. Full guide: [Error handling](../error-handling.md). Builtin and client-only codes: [Builtin errors](../builtin-errors.md). Host middleware: [Outside Callspec](../outside-callspec.md).

## Native Callspec document

`callspec.json` is Callspec's native contract (`callspec: "2.0"`). `mountSpec` serves it at `/callspec.json`. Optional pinning, codegen, and `emitCallspec`: [SDK generation](../sdk-generation.md).

## OpenAPI

**OpenAPI 3.1** at `/openapi.json` — parallel projection from the same `routes` object. Full guide: [OpenAPI](../openapi.md).

## Runtime client

Low-level `CallspecClient` if you need it; prefer the generated client for app code.

```typescript
import {CallspecClient, isCallspecOk} from 'callspec/client';

const runtime = new CallspecClient({baseUrl: 'https://api.example.com/v1'});
const result = await runtime.callResult<{id: string; name: string; priceCents: number}>('getProductById', {id: 'sku-1'});

if (isCallspecOk(result)) {
    console.log(result.value);
} else {
    console.error(result.status, result.code);
}
```

See [Client error normalization](../error-handling.md#client-error-normalization).

## Built-in MCP server

Set `mcp: true` on any `route`. When any route opts in, `mountSpec` mounts MCP at `/mcp` automatically.

Agents call the **same handlers** as HTTP RPC — same auth gate, same input validation, same error codes. Guide: [MCP](../mcp.md).

## Docs UI

Minimal, fast docs UI baked into the package. Browse routes, try RPCs, read schemas, and **connect MCP clients** from the home page. Pass `{docs: false}` to keep the API private and use `/mcp` only.

Whitelabel via flat **`meta`** fields (`title`, `intro`, `website`, `logo`, `theme`, `navbarLinks`, `footer`, `notice`, `favicon`, `sdkInstall`, `authHint`, `mcpInstructions`). Guide: [Docs UI](../docs-ui.md) · [Branding](../docs-ui-branding.md).

## Package exports

| Import | Use |
|--------|-----|
| `callspec` | Server: route, spec, mountSpec, defineErrors, err, isRouteFailure, sendRouteFailureResponse, formatRouteFailureBody, logRequest, BUILTIN_ERROR.<br>Types: Callspec, RoutesMap, MountSpecOptions, ExportVisibility, RouteFailure, RouteContractInput, HandlerFor, RouteHandler, Authenticate, WiredRoute |
| `callspec/client` | Runtime client: CallspecClient, isCallspecOk, CLIENT_ERROR, BUILTIN_ERROR, CallspecRouteResult, … |
| `callspec/document` | emitCallspec, emitOpenApi, parseCallspecDocument, generateClientFile |

← [Auth and scope](./auth-and-scope.md) · Next: [Builtin errors](../builtin-errors.md)

