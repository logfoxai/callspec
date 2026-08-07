# Surfaces & package exports

## Errors

Errors are **typed return possibilities**, not mystery exceptions. Full guide: [Error handling](../error-handling.md).

Builtin codes (automatic on every route — never declare): `VALIDATION_ERROR`, `UNAUTHORIZED`, `ROUTE_NOT_FOUND`, `NOT_FOUND`, `FORBIDDEN`, `CONFLICT`, `TOO_MANY_REQUESTS`, `SERVICE_UNAVAILABLE`, `INTERNAL_ERROR`. Client-only: `NETWORK_ERROR`, `UNKNOWN_ERROR`.

## Native Callspec document

`callspec.json` is Callspec's native contract (`callspec: "2.0"`). `mountSpec` serves it at `/callspec.json`. Pinning, codegen, and `emitCallspec`: [SDK generation](../sdk-generation.md).

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

Agents call the **same resolvers** as HTTP RPC — same auth gate, same input validation, same error codes. Guide: [MCP](../mcp.md).

## Docs UI

Minimal, fast docs UI baked into the package. Browse routes, try RPCs, read schemas, and **connect MCP clients** from the home page. Pass `{docs: false}` to keep the API private and use `/mcp` only.

Whitelabel via flat **`meta`** fields (`title`, `intro`, `website`, `logo`, `authHint`, `mcpInstructions`). Guide: [Docs UI](../docs-ui.md).

## Package exports

| Import | Use |
|--------|-----|
| `callspec` | `route`, `spec`, `mountSpec`, `defineErrors`, `err`, `logRequest`, `BUILTIN_ERROR`; types `Callspec`, `RoutesMap`, `MountSpecOptions`, `RouteFailure`, `RouteContractInput`, `ResolverFor`, `RouteResolver`, `Authenticate`, `WiredRoute` |
| `callspec/client` | Runtime client (`CallspecClient`, `isCallspecOk`, `CLIENT_ERROR`, `BUILTIN_ERROR`, `CallspecRouteResult`, …) |
| `callspec/document` | `emitCallspec`, `emitOpenApi`, `parseCallspecDocument`, `generateClientFile` |

← [API reference](../api-reference.md)

