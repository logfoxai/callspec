# Guide

Beyond the [Getting started](../README.md#getting-started) happy path — full server layout, committed contracts, CI codegen, and frontend usage.

## How it fits together

<p align="center">
  <a href="../assets/callspec-flow.png">
    <img src="../assets/callspec-flow.png" alt="Callspec flow: Define route and spec, generate with mountSpec and CLI, ship API TS SDK MCP and docs" width="800" />
  </a>
</p>

1. **Define** — `route()` + `spec()` in TypeScript (`route + spec`). Input, output, and errors are fully typed; Callspec validates at the boundary before your resolver runs.
2. **Generate** — `mountSpec` + CLI. `mountSpec` serves the live RPC server plus `/docs`, `/callspec.json`, `/openapi.json`, and `/mcp`. The CLI generates a TypeScript SDK with shared types; optional `exports` + `--validators` emit runtyp preds for forms.
3. **Ship** — **API**, **TS SDK**, **MCP**, and **Docs** from one contract — no drift between server, client, explorer, and agents.

**Optional: other languages** — point [Fern](https://buildwithfern.com/) at `/openapi.json` (`fern init --openapi`, `fern generate`) for **Python, Go, Java, Ruby, C#**, and more. Callspec stays your TS runtime; Fern handles multi-lang DX. Details: [Fern vs Callspec](fern-vs-callspec.md).

## Full backend example

Same catalog routes — split across files. Single-file copy-paste: [complete-example.md](complete-example.md).

**Per route:** `route({ preds, meta, resolver })` — one export for `spec`. Unit-test via `getProductById.resolver(input, ctx)`; no HTTP.

### Shared schemas

Most routes reuse domain preds — you define them once, not per route file.

```typescript
// server/schemas/catalog.ts
import {predicates as p} from 'runtyp';

export const product = p.object({
    id: p.string(),
    name: p.string(),
    priceCents: p.number(),
});

export const productIdInput = p.object({id: p.string()});

export const productList = p.object({
    items: p.array(product),
    count: p.number(),
});

export const products = [
    {id: 'sku-1', name: 'Widget', priceCents: 999},
    {id: 'sku-2', name: 'Gadget', priceCents: 1299},
];
```

Pass named preds to `spec({ exports: { product, productList, … } })` when you want them in codegen / `--validators`.

### Routes

```typescript
// server/routes/getProductById.ts
import {route, err} from 'callspec';
import {product, productIdInput, products} from '../schemas/catalog';

export const getProductById = route({
    input: productIdInput,
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

```typescript
// server/routes/listProducts.ts — reuses product + productList preds, no new types
import {route} from 'callspec';
import {predicates as p} from 'runtyp';
import {productList, products} from '../schemas/catalog';

export const listProducts = route({
    input: p.object({}),
    output: productList,
    meta: {summary: 'List products', tags: ['catalog']},
    auth: 'none',
    resolver: async (_input, _ctx) => ({items: products, count: products.length}),
});
```

Swap the in-memory `products` array for a DB query in production — the resolver shape stays the same.

```typescript
// server/routes.ts
import {spec} from 'callspec';
import {product, productList} from './schemas/catalog';
import {getProductById} from './routes/getProductById';
import {listProducts} from './routes/listProducts';

export const api = spec({
    meta: {title: 'My API', version: '1.0.0', intro: 'Product catalog with typed RPC.'},
    routes: {getProductById, listProducts},
    exports: {product, productList},
});
```

Bearer routes and `authenticate`: [Authentication](#authentication).

```typescript
// server/index.ts
import express from 'express';
import {mountSpec} from 'callspec';
import {api} from './routes';

const app = express();
const router = express.Router();
router.use(express.json());

mountSpec(router, api);

app.use('/v1', router);

const port = 3000;
app.listen(port, () => {
    console.log(`RPC:         http://127.0.0.1:${port}/v1/getProductById`);
    console.log(`Docs:        http://127.0.0.1:${port}/v1/docs`);
    console.log(`Callspec:    http://127.0.0.1:${port}/v1/callspec.json`);
    console.log(`OpenAPI:     http://127.0.0.1:${port}/v1/openapi.json`);
    console.log(`MCP:         http://127.0.0.1:${port}/v1/mcp`);
});
```

| Surface | URL |
|---------|-----|
| Docs UI | `http://127.0.0.1:3000/v1/docs` |
| Contract | `http://127.0.0.1:3000/v1/callspec.json` |
| OpenAPI | `http://127.0.0.1:3000/v1/openapi.json` |
| RPC | `POST http://127.0.0.1:3000/v1/getProductById` |
| MCP | `http://127.0.0.1:3000/v1/mcp` |

`mountSpec` path options: [API reference § mountSpec](api-reference.md#mountspec).

## Authentication

Credentials are per-route, not in the input pred. Two modes:

| `auth` | Behavior |
|--------|----------|
| `'none'` | No token required — resolver gets `ctx: undefined` unless the client sent a Bearer token and you wired `authenticate` |
| `'bearer'` (default) | Missing or invalid token → **401 `UNAUTHORIZED`** before the resolver runs |

Any route with `auth: 'bearer'` requires `authenticate` on the spec — `spec` throws at load time if it is missing.

```typescript
// server/auth.ts
import type {Request} from 'express';
import type {Authenticate} from 'callspec';

export type Ctx = {userId: string};

export const authenticate: Authenticate<Ctx> = async (token, req) => {
    const session = await verifySession(token, req);
    if (!session) return undefined;
    return {userId: session.userId};
};
```

```typescript
// server/routes/getProfile.ts
import {route} from 'callspec';
import {predicates as p} from 'runtyp';
import type {Ctx} from '../auth';

export const getProfile = route({
    input: p.object({}),
    output: p.object({userId: p.string()}),
    meta: {summary: 'Get profile', tags: ['users']},
    auth: 'bearer',
    resolver: async (_input, ctx: Ctx) => ({userId: ctx.userId}),
});
```

```typescript
// server/routes.ts — add authenticate when you introduce bearer routes
import {spec} from 'callspec';
import {authenticate} from './auth';
import {product, productList} from './schemas/catalog';
import {getProfile} from './routes/getProfile';
import {getProductById} from './routes/getProductById';
import {listProducts} from './routes/listProducts';

export const api = spec({
    meta: {
        title: 'My API',
        version: '1.0.0',
        intro: 'Product catalog with typed RPC.',
        authHint: 'Authorization: Bearer <session token>',
    },
    routes: {getProductById, listProducts, getProfile},
    exports: {product, productList},
    authenticate,
});
```

**Client:** pass the token on every call — generated `ApiClient` accepts `headers` (static or a function):

```typescript
const api = new ApiClient({
    baseUrl: 'http://127.0.0.1:3000/v1',
    headers: () => ({Authorization: `Bearer ${getSessionToken()}`}),
});
```

**Docs / MCP:** `meta.authHint` shows in the docs UI and MCP connect flow. OpenAPI Bearer security is derived from route `auth` automatically.

`scope: 'private'` is separate — it hides a route from exports (SDK, docs, OpenAPI) but does not change the auth gate. See [API reference § Auth and scope](api-reference.md#auth-and-scope).

## Request context

The resolver's second argument is **request context** — whatever your `authenticate(token, req)` returns. It is not part of the RPC input pred; it is injected per HTTP/MCP request after auth.

`authenticate` receives the Bearer token (already extracted) and the Express **`req`**. Use `req` when context depends on more than the token alone — tenant header, cookie session, client IP allowlists, tracing ids, etc.

```typescript
// server/auth.ts
import type {Request} from 'express';
import type {Authenticate} from 'callspec';

export type Ctx = {
    userId: string
    tenantId: string
};

export const authenticate: Authenticate<Ctx> = async (token, req: Request) => {
    const user = await verifyJwt(token);
    if (!user) return undefined;

    const tenantId = req.headers['x-tenant-id'];
    if (typeof tenantId !== 'string') return undefined;

    return {userId: user.sub, tenantId};
};
```

Share **`Ctx`** between `authenticate` and resolvers — annotate `ctx: Ctx` on the resolver param:

```typescript
export const listOrders = route({
    input: p.object({status: p.string()}),
    output: p.object({items: p.array(p.object({id: p.string()}))}),
    meta: {summary: 'List orders', tags: ['orders']},
    auth: 'bearer',
    resolver: async (input, ctx: Ctx) => fetchOrders({tenantId: ctx.tenantId, ...input}),
});
```

**Public routes** (`auth: 'none'`): resolver normally sees `ctx` as `undefined`. If the client still sends `Authorization: Bearer …` and you defined `authenticate`, callspec resolves context anyway — useful for optional signed-in behavior on public endpoints.

**Testing:** call the wired route's resolver directly — no HTTP, no Express:

```typescript
const orders = await listOrders.resolver({status: 'open'}, {
    userId: 'user_1',
    tenantId: 'acme',
});
```

## Writing `callspec.json`

You do **not** need a committed contract — codegen can always use the live URL. To produce a file for CI or offline use:

**From a running server:**

```bash
curl -fsS http://127.0.0.1:3000/v1/callspec.json -o callspec.json
```

**From TypeScript** (same projection `mountSpec` serves):

```typescript
// scripts/write-callspec-json.ts
import {writeFileSync} from 'fs';
import {emitCallspec} from 'callspec/document';
import {api} from '../server/routes';

const basePath = '/v1'; // must match mountSpec in server/index.ts

writeFileSync(
    'callspec.json',
    JSON.stringify(
        emitCallspec(api.routes, {
            title: api.meta.title ?? 'My API',
            version: api.meta.version ?? '1.0.0',
            basePath,
            description: api.meta.intro,
            exports: api.exports,
        }),
        null,
        2,
    ),
);
```

```bash
npx tsx scripts/write-callspec-json.ts
```

## Frontend codegen

The CLI reads **`callspec.json`** (file or URL). The document already contains routes, errors, `info`, and paths — codegen does not take title, version, or basePath.

```bash
# local dev (API running)
npx callspec http://127.0.0.1:3000/v1/callspec.json --output src/generated/api.ts

# CI or offline (committed contract)
npx callspec ./callspec.json --output src/generated/api.ts

# shared runtyp preds for forms (optional)
npx callspec ./callspec.json --output src/generated/validators.ts --validators
```

Commit `callspec.json` and/or generated `api.ts`; fail CI on drift if you regenerate in the pipeline.

```json
"scripts": {
  "generate:api": "callspec ./callspec.json --output src/generated/api.ts"
}
```

The generated file imports only `callspec/client` (browser-safe), exposes one typed method per route (`CallspecRouteResult`), and can be committed with `git diff --exit-code` in CI.

```bash
callspec <source> --output <file> [--class-name ApiClient]
```

## Frontend usage

Every generated method returns a **Result**. When `!result.ok`, `result.code` is a **fully exhaustive** union of every error that route can return — handle them in a `switch` and TypeScript flags anything you miss. See [error-handling.md](error-handling.md) for the full contract.

```typescript
// src/app/getProductById.ts
import {ApiClient} from '../generated/api';
import {toast} from '../toast';

const api = new ApiClient({
    baseUrl: import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:3000/v1',
});

export async function fetchProduct(id: string) {
    const result = await api.getProductById({id});

    if (!result.ok) {
        if (result.code === 'NOT_FOUND') {
            toast.error(`Unknown product ${id}`);
            return null;
        }
        if (result.code === 'VALIDATION_ERROR') {
            toast.error('Invalid product id');
            return null;
        }
        if (result.code === 'NETWORK_ERROR') {
            toast.error('Check your connection and try again');
            return null;
        }
        toast.error('Something went wrong');
        return null;
    }

    return result.value;
}
```

```tsx
// src/components/ProductView.tsx
import {useState} from 'react';
import {fetchProduct} from '../app/getProductById';

export function ProductView() {
    const [productId, setProductId] = useState('sku-1');
    const [product, setProduct] = useState<Awaited<ReturnType<typeof fetchProduct>>>(null);

    async function onLoad() {
        setProduct(await fetchProduct(productId));
    }

    return (
        <>
            <input value={productId} onChange={(e) => setProductId(e.target.value)} />
            <button type="button" onClick={() => void onLoad()}>Load</button>
            {product && (
                <p>{product.name} — ${(product.priceCents / 100).toFixed(2)}</p>
            )}
        </>
    );
}
```

Same methods, same types, same error codes as the server and MCP tools — no hand-rolled `fetch`.

## Shared validation (backend + frontend)

Routes declare wire validation once. Codegen gives the frontend the same **types** (and, with `exports`, **named runtyp preds**) so forms and RPC stay in sync.

| What | Where it lives | Who uses it |
|------|----------------|-------------|
| RPC methods | `spec({ routes })` | Server resolvers + generated `ApiClient` |
| Full request/response shapes | Route `input` / `output` | Server boundary + generated `{Route}Input` types |
| Shared UI slices (filters, domain objects) | `spec({ exports })` | Filter bars, modals — same pred as server ([plan](exports-and-codegen.plan.md)) |
| UI-only fields | Consumer app local | Never in the spec |

Composition inside a route input **does not** auto-export the slice — register preds you want consumers to import under **`exports`**.

Powered by [runtyp](https://github.com/logfoxai/runtyp): preds validate at runtime on the server and serialize to JSON Schema for docs, OpenAPI, MCP, and codegen.
