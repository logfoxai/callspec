# Getting started

For coding agents: [Working with Coding Agents](./coding-agents.md) (skill + copy-paste prompts).

## 1. Install backend dependencies

```bash
# callspec = RPC runtime; runtyp = typed validators for input/output; express = HTTP server
npm i callspec runtyp express
npm i -D tsx typescript @types/express
```

Requirements: Node.js **18+** (runtime), TypeScript 5+, Express 4.x (peer).

## 2. Define a route

```typescript title="src/routes/getProductById.ts" frame="code"
import {route, err} from 'callspec';
// runtyp predicates — validate on the wire and drive TypeScript types
import {predicates as p, Infer} from 'runtyp';

// Shape once — wire validation + TS type
const product = p.object({
    id: p.string(),
    name: p.string(),
    priceCents: p.number(),
});
type Product = Infer<typeof product>;

const products: Product[] = [
    {id: 'sku-1', name: 'Widget', priceCents: 999},
    {id: 'sku-2', name: 'Gadget', priceCents: 1299},
];

export const getProductById = route({
    input: p.object({id: p.string()}),
    output: product,
    meta: {summary: 'Get product by ID', tags: ['catalog']},
    auth: 'none',
    mcp: true,
    // Keep the handler inline for LSP support
    handler: async (input, _ctx) => {
        const found = products.find((item) => item.id === input.id);
        if (!found) return err.NOT_FOUND();
        return found;
    },
});
```

Callspec validates `input` and `output` against the preds automatically — bad wire data is rejected before your handler runs, and successful responses are checked on the way out.

`auth` is who can call the route. `scope` is who can see it in docs and specs — default `'public'`. Use `scope: 'private'` for routes you document on your own mounts (`visibility: 'all'` in dev/stage). See [Auth and scope](./api-reference/auth-and-scope.md).

Related: [runtyp](https://github.com/logfoxai/runtyp) · [Builtin errors](./builtin-errors.md) · [Error handling](./error-handling.md) · [Unit testing](./unit-testing.md) · [route & spec](./api-reference/route-and-spec.md)

## 3. Define the API

```typescript title="src/spec.ts" frame="code"
import {spec} from 'callspec';
import {getProductById} from './routes/getProductById';

// One registry — routes (+ optional authenticate, exports)
export const api = spec({
    meta: {title: 'My API', version: '1.0.0'},
    routes: {getProductById},
});
```

Related: [route & spec](./api-reference/route-and-spec.md) · [Server layout](./server-layout.md)

## 4. Mount and run

```typescript title="src/index.ts" frame="code"
import {mountSpec} from 'callspec';
import express from 'express';
import {api} from './spec';

const app = express();
const router = express.Router();
router.use(express.json());

// Serves RPC, docs UI, callspec.json, openapi.json, and MCP (if any route has mcp: true)
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

```bash
npx tsx src/index.ts
```

Open [http://127.0.0.1:3000/v1/docs](http://127.0.0.1:3000/v1/docs).

Related: [Docs UI](./docs-ui.md) · [mountSpec](./api-reference/mount-spec.md) · [MCP Server](./mcp.md) · [OpenAPI](./openapi.md)

## 5. Generate the SDK

```bash
# Live mount (server running) — pass the mount point
npx callspec http://127.0.0.1:3000/v1 --output src/generated/api.ts

# Optional — pin the contract for CI / offline codegen
curl -fsS http://127.0.0.1:3000/v1/callspec.json -o callspec.json
npx callspec ./callspec.json --output src/generated/api.ts
```

Related: [SDK generation](./sdk-generation.md) · [Shared validation](./shared-validation.md) (`schemas` from codegen)

## 6. Call from your app

Each method returns a **Result** — check `result.ok`, handle the codes that matter for that UI, and send the rest through a shared helper (you do **not** need a giant `switch` at every call site).

```typescript title="src/app/getProductById.ts" frame="code"
import {ApiClient} from '../generated/api';

const api = new ApiClient({
    baseUrl: 'http://127.0.0.1:3000/v1',
});

export async function fetchProduct(id: string) {
    const result = await api.getProductById({id});

    if (!result.ok) {
        if (result.code === 'NOT_FOUND') {
            console.error(`Unknown sku ${id}`);
            return null;
        }
        console.error(result.code, result.data);
        return null;
    }

    return result.value; // { id, name, priceCents }
}

const product = await fetchProduct('sku-1');
console.log(product?.name, product?.priceCents);
```

Shared helper + optional exhaustive `switch`: **[Client usage](./client-usage.md)**.

Related: [Client usage](./client-usage.md) · [Builtin errors](./builtin-errors.md) · [Authentication](./authentication.md)
