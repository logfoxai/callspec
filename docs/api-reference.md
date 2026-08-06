# API reference

<p align="center">
  <a href="../assets/callspec-flow.svg?cb=4">
    <img src="../assets/callspec-flow.svg?cb=4" alt="Callspec flow: define in TypeScript, mountSpec, CLI SDK, OpenAPI export, optional Fern multi-language SDKs" width="920" />
  </a>
</p>

`defineErrors` → `route()` → `spec()` → `mountSpec()` + CLI codegen.

## Resolvers

Pass preds, meta, and `resolver` in one `route()` call:

```typescript
import {route, err, type ResolverFor} from 'callspec';
import {predicates as p} from 'runtyp';

const product = p.object({id: p.string(), name: p.string(), priceCents: p.number()});

const products = [
    {id: 'sku-1', name: 'Widget', priceCents: 999},
    {id: 'sku-2', name: 'Gadget', priceCents: 1299},
];

export const getProductById = route({
    input: p.object({id: p.string()}),
    output: product,
    meta: {summary: 'Get product by ID', tags: ['catalog']},
    auth: 'none',
    mcp: true,
    resolver: async (input, _ctx) => {
        // input validated and fully typed — return and errors too! 🎉
        const found = products.find((item) => item.id === input.id);
        if (!found) return err.NOT_FOUND();
        return found;
    },
});
```

Separate resolver binding (optional):

```typescript
const preds = { input, output, meta, auth: 'none' } as const;

const impl: ResolverFor<typeof preds, Ctx> = async (input, _ctx) => {
    return {id: input.id, name: '…', priceCents: 0};
};

export const getProductById = route({...preds, resolver: impl});
```

| Export | Purpose |
|--------|---------|
| `route({ …, resolver })` | Wired route for `spec`; resolver also on `.resolver` for tests |
| `ResolverFor<typeof preds, Ctx?>` | Explicit resolver type for a separate binding |

Domain-specific errors: `defineErrors()` + `errors:` on the route — see [error-handling.md](error-handling.md). Builtins like `err.NOT_FOUND()` work without declaring `errors`.

Private routes: annotate auth context on the resolver — `resolver: async (input, ctx: Ctx) => …`. See [Authentication](authentication.md) and [Request context](request-context.md).

### Testing resolvers

The wired route keeps the resolver on `.resolver` — call it directly in unit tests (no HTTP, no Express):

```typescript
import {isRouteFailure} from 'callspec';
import {getProductById} from '../routes/getProductById';

const missing = await getProductById.resolver({id: 'missing'}, {});
expect(isRouteFailure(missing) && missing.code).toBe('NOT_FOUND');

const found = await getProductById.resolver({id: 'sku-1'}, {});
expect(isRouteFailure(found)).toBe(false);
expect(found).toEqual({id: 'sku-1', name: 'Widget', priceCents: 999});
```

Export the wired route from the route module when tests live in another file.

## `route`

```typescript
export const getProductById = route({
    input: Pred,
    output: Pred,
    errors?: ErrorsHandle,
    meta: RouteMeta,
    auth?: 'none' | 'bearer',
    scope?: 'public' | 'private',
    mcp?: true | McpRouteConfig,
    resolver: async (input, ctx) => { /* … */ },
})
```

Returns a wired route for `spec`. Test via `getProductById.resolver(input, ctx)`.

## `spec`

```typescript
spec({
    meta?: CallspecMeta,
    routes: RoutesMap<Ctx>,          // required — wired routes from `route({ …, resolver })`
    exports?: Record<string, Pred>,  // named schemas for consumer codegen
    authenticate?: Authenticate<Ctx>,
})
```

Throws at load time if any route uses `auth: 'bearer'` and `authenticate` is missing.

## `mountSpec`

```typescript
mountSpec(router, spec, options?: MountSpecOptions)
```

| Option | Default | Description |
|--------|---------|-------------|
| `basePath` | `''` | Prefix for RPC paths and for paths baked into emitted documents |
| `docs` | `true` | Pass `false` to disable `/docs`, `/callspec.json`, and `/openapi.json` at the mount root |
| `docsPath` | `'/docs'` | Docs UI path on this router (`callspec.json` and `openapi.json` paths are fixed) |
| `mcpPath` | `'/mcp'` | MCP HTTP endpoint on this router |
| `logging` | `true` | jsout-express request log on this router + jsout error log on unhandled throws; pass `false` in tests |
| `handleUnhandledError` | — | `(err, req) => RouteFailure \| undefined` — map infra throws before `INTERNAL_ERROR` |
| `logUnhandledError` | jsout `logger.error` | Override unhandled-error logging only |

When `docs` is enabled, the docs UI fetches **`callspec.json`** at `/callspec.json` on this router (fixed path). Override only the UI mount:

```typescript
mountSpec(router, spec, {docsPath: '/explorer'});
// UI at /explorer — still loads ../callspec.json relative to that path
```

See [error-handling.md § mountSpec runtime](error-handling.md#mountspec-runtime).

## Auth and scope

See [Authentication](authentication.md) and [Request context](request-context.md) for full examples.

- **`auth: 'none'`** — no credentials required
- **`auth: 'bearer'`** (default) — 401 without valid Bearer token
- **`authenticate(token, req)`** on the spec — your hook; callspec extracts Bearer and calls it with the Express `req`

**Scope** controls export surfaces (not HTTP mounting — all routes stay callable on the server):

- **`scope: 'public'`** (default) — included in `callspec.json`, OpenAPI, docs UI, SDK codegen, and MCP `tools/list`
- **`scope: 'private'`** — server-only; omitted from those exports

OpenAPI Bearer security is **auto-derived** from route `auth`.

## Errors

Errors are **typed return possibilities**, not mystery exceptions. Full guide: [error-handling.md](error-handling.md).

Builtin codes (automatic on every route — never declare): `VALIDATION_ERROR`, `UNAUTHORIZED`, `ROUTE_NOT_FOUND`, `NOT_FOUND`, `FORBIDDEN`, `CONFLICT`, `TOO_MANY_REQUESTS`, `SERVICE_UNAVAILABLE`, `INTERNAL_ERROR`. Client-only: `NETWORK_ERROR`, `UNKNOWN_ERROR`.

## Native Callspec document & OpenAPI

`callspec.json` is Callspec's native contract (`callspec: "2.0"`). `mountSpec` serves it at `/callspec.json` — or use `emitCallspec` to write the same document to disk ([OpenAPI § Native contract](openapi.md#native-contract-callspecjson)).

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

Set `mcp: true` on any `route`. When any route opts in, `mountSpec` mounts MCP at `/mcp` automatically.

Agents call the **same resolvers** as HTTP RPC — same auth gate, same input validation, same error codes.

## Docs UI

Minimal, fast docs UI baked into the package. Browse routes, try RPCs, read schemas, and **connect MCP clients** from the home page. Pass `{docs: false}` to keep the API private and use `/mcp` only.

Whitelabel via flat **`meta`** fields (`title`, `intro`, `website`, `logo`, `authHint`, `mcpInstructions`).

## Package exports

| Import | Use |
|--------|-----|
| `callspec` | `route`, `spec`, `mountSpec`, `defineErrors`, `err`, `logRequest`, `BUILTIN_ERROR`; types `Callspec`, `RoutesMap`, `MountSpecOptions`, `RouteFailure`, `RouteContractInput`, `ResolverFor`, `RouteResolver`, `Authenticate`, `WiredRoute` |
| `callspec/express` | `expressErrorHandler` |
| `callspec/client` | Runtime client (`CallspecClient`, `isCallspecOk`, `CLIENT_ERROR`, `BUILTIN_ERROR`, `CallspecRouteResult`, …) |
| `callspec/document` | `emitCallspec`, `emitOpenApi`, `parseCallspecDocument`, `generateClientFile`, `generateValidatorsFile` |
