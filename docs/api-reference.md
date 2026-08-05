# API reference

## Resolvers

Declare preds once, get full IDE support on the resolver body:

```typescript
import {defineRoute, defineErrors, resolverFor, type RouteResolverFor} from 'callspec';
import {predicates as p} from 'runtyp';
import {lookupById} from '../domain/products';

const productErr = defineErrors({
    PRODUCT_NOT_FOUND: {data: p.object({id: p.string()})},
});

const product = p.object({id: p.string(), name: p.string(), priceCents: p.number()});

const getProductByIdRoute = {
    input: p.object({id: p.string()}),
    output: product,
    errors: productErr,
} as const;

// Option A — resolverFor (inline autocomplete, no manual type annotation)
const getProductByIdResolver = resolverFor(getProductByIdRoute)(async (input, _ctx) => {
    const found = lookupById(input.id);
    if (!found) return productErr.PRODUCT_NOT_FOUND({id: input.id});
    return found;
});

// Option B — explicit type (same types, useful for exported/testable resolvers)
const otherResolver: RouteResolverFor<typeof getProductByIdRoute> = async (input, _ctx) => {
    return {id: input.id, name: '…', priceCents: 0};
};

export const getProductById = defineRoute({
    ...getProductByIdRoute,
    meta: {summary: '…', description: '…', tags: ['catalog']},
    access: 'public',
    handler: getProductByIdResolver,
});
```

| Export | Purpose |
|--------|---------|
| `resolverFor(routeDef)` | Returns `(fn) => fn` with full resolver typing from `routeDef` |
| `RouteResolverFor<typeof routeDef, Ctx?>` | Explicit resolver type when you prefer a type declaration |
| `RouteResolverDef` | Shape of `{ input, output, errors? }` — spread into `defineRoute` |

Helpers that return domain failures: `RouteFailuresFrom<typeof productErr>`. Plain domain functions (e.g. `lookupById` returning `Product | null`) stay free of Callspec — map to route failures in the resolver.

Private routes: annotate auth context on the param — `resolverFor(route)(async (input, ctx: Ctx) => …)`.

### Testing resolvers

`resolverFor` is a compile-time helper only — it returns your function unchanged. The resolver and any extracted helpers are **plain functions** you call directly in unit tests (no HTTP, no `defineRoute`, no Express):

```typescript
import {isRouteFailure} from 'callspec';
import {lookupById} from '../domain/products';

const missing = await getProductByIdResolver({id: 'missing'}, {});
expect(isRouteFailure(missing) && missing.code).toBe('PRODUCT_NOT_FOUND');

const found = await getProductByIdResolver({id: 'sku-1'}, {});
expect(isRouteFailure(found)).toBe(false);

expect(lookupById('missing')).toBeNull();
```

Export the resolver (and helpers) from the route module when tests live in another file.

## `defineRoute`

```typescript
defineRoute({
    input: Pred,           // required
    output: Pred,          // required
    errors?: ErrorsHandle, // optional domain errors
    meta: RouteMeta,       // summary, description, tags
    access?: 'public' | 'private',  // default 'private'
    mcp?: true | McpRouteConfig,
    handler: RouteResolverFor<…>,  // your resolver (property name is `handler`)
})
```

`defineRoute` validates input, output, errors, and resolver arity (2: `input`, `ctx`). Use `p.any()` when you do not need a precise schema.

## `defineSpec`

```typescript
defineSpec({
    meta?: CallspecMeta,
    routes: RoutesMap<Ctx>,          // required — your map of defineRoute entries
    exports?: Record<string, Pred>,  // named schemas for consumer codegen
    authenticate?: Authenticate<Ctx>,
})
```

Throws at load time if any route is `private` and `authenticate` is missing.

## `mountSpec`

```typescript
mountSpec(router, spec, options?: MountSpecOptions)
```

| Option | Default | Description |
|--------|---------|-------------|
| `basePath` | `''` | Prefix for RPC paths and for paths baked into emitted documents |
| `docs` | `true` | Pass `false` to disable `/docs`, `/callspec.json`, and `/openapi.json`; or pass `{ uiPath?, callspecPath?, openApiPath? }` to override individual paths |
| `mcpPath` | `'/mcp'` | MCP HTTP endpoint on this router |
| `logging` | `true` | jsout-express request log on this router + jsout error log on unhandled throws; pass `false` in tests |
| `handleUnhandledError` | — | `(err, req) => RouteFailure \| undefined` — map infra throws before `INTERNAL_ERROR` |
| `logUnhandledError` | jsout `logger.error` | Override unhandled-error logging only |

When `docs` is enabled, the docs UI fetches **`callspec.json`** from the configured path (default `/callspec.json` relative to the router).

See [error-handling.md § mountSpec runtime](error-handling.md#mountspec-runtime).

## Auth

- **`access: 'public'`** — no credentials required
- **`access: 'private'`** (default) — 401 without valid Bearer token
- **`authenticate(token, req)`** on the spec — your hook; callspec extracts Bearer and calls it

OpenAPI Bearer security is **auto-derived** from route `access`.

## Errors

Errors are **typed return possibilities**, not mystery exceptions. Full guide: [error-handling.md](error-handling.md).

Builtin codes (automatic on every route — never declare): `VALIDATION_ERROR`, `UNAUTHORIZED`, `ROUTE_NOT_FOUND`, `NOT_FOUND`, `FORBIDDEN`, `CONFLICT`, `TOO_MANY_REQUESTS`, `SERVICE_UNAVAILABLE`, `INTERNAL_ERROR`. Client-only: `NETWORK_ERROR`, `UNKNOWN_ERROR`.

## Native Callspec document & OpenAPI

`callspec.json` is Callspec's native contract (`callspec: "1.0"`). `mountSpec` serves it at `/callspec.json` — or use `emitCallspec` to write the same document to disk ([Guide § Writing callspec.json](guide.md#writing-callspecjson)).

**OpenAPI 3.1** (`/openapi.json`) is a parallel projection from the same `routes` object (not derived from `callspec.json`). RPC methods appear as `POST` paths; errors are grouped by HTTP status.

`emitOpenApi` and `parseCallspecDocument` are in `callspec/document` for server tooling and tests.

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

See [Client error normalization](error-handling.md#client-error-normalization).

## Built-in MCP server

Set `mcp: true` on any `defineRoute`. When any route opts in, `mountSpec` mounts MCP at `/mcp` automatically.

Agents call the **same resolvers** as HTTP RPC — same auth gate, same input validation, same error codes.

## Docs UI

Minimal, fast docs UI baked into the package. Browse routes, try RPCs, read schemas, and **connect MCP clients** from the home page. Pass `{docs: false}` to keep the API private and use `/mcp` only.

Whitelabel via flat **`meta`** fields (`title`, `intro`, `website`, `logo`, `authHint`, `mcpInstructions`).

## Package exports

| Import | Use |
|--------|-----|
| `callspec` | `defineRoute`, `defineSpec`, `mountSpec`, `defineErrors`, `err`, `resolverFor`, `logRequest`, `BUILTIN_ERROR`; types `Callspec`, `RoutesMap`, `MountSpecOptions`, `RouteFailure`, `RouteResolverFor`, `RouteResolverDef`, `RouteHandler`, `Authenticate` |
| `callspec/express` | `expressErrorHandler` |
| `callspec/client` | Runtime client (`CallspecClient`, `isCallspecOk`, `CLIENT_ERROR`, `BUILTIN_ERROR`, `CallspecRouteResult`, …) |
| `callspec/document` | `emitCallspec`, `emitOpenApi`, `parseCallspecDocument`, `generateClientFile`, `generateValidatorsFile` |
