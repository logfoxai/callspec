# Getting started

This page walks through a minimal server and client. Prefer one file? Copy the [single-file server example](./single-file-server-example.md).

For coding agents, use [SKILL.md](./coding-agents.md).

## 1. Install backend dependencies

```bash
npm i callspec runtyp express
npm i -D tsx typescript @types/express
```

Requirements: Node.js **18+** (runtime), TypeScript 5+, Express 4.x (peer). Contributing to this repo (`npm run validate`, docs site) needs Node **≥22.12** — see [Development](./development.md).

### Install with an AI assistant

Paste this into Cursor, Claude Code, or similar:

```text
Install Callspec in this project: npm i callspec runtyp express and npm i -D tsx typescript @types/express. Then follow https://callspec.logfox.ai/getting-started/ — define a route with route(), mount with mountSpec, generate the client with npx callspec, and use Result-typed client calls (check result.ok / result.code). Return err.* from resolvers; do not throw expected failures.
```

## 2. Define a route

```typescript
// server/routes/getProductById.ts
import {route, err} from 'callspec';
import {predicates as p} from 'runtyp';

const product = p.object({
    id: p.string(),
    name: p.string(),
    priceCents: p.number(),
});

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
    // resolver = the function that runs for this RPC method (typed input + ctx → output or err.*)
    resolver: async (input, _ctx) => {
        // input validated and fully typed — return and errors too! 🎉
        const found = products.find((item) => item.id === input.id);
        if (!found) return err.NOT_FOUND();
        return found;
    },
});
```

**Quick notes:**

- Return failures from resolvers (ie, `return err.NOT_FOUND()`) — **don't throw exceptions**. Built-in codes (`NOT_FOUND`, `UNAUTHORIZED`, …) are listed under [Builtin codes](./error-handling.md#builtin-codes).
- Define custom domain errors with `errors:` on the route — see [Error handling](./error-handling.md).
- Test resolver logic with `.resolver(input, ctx)` — no HTTP. See [Unit testing](./unit-testing.md).

## 3. Define and mount backend API

```typescript
// server/routes.ts + server/index.ts
import {spec} from 'callspec';
import {mountSpec} from 'callspec';
import express from 'express';
import {getProductById} from './routes/getProductById';

export const api = spec({
    meta: {title: 'My API', version: '1.0.0'},
    routes: {getProductById},
});

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

```bash
npx tsx server/index.ts
```

Open [http://127.0.0.1:3000/v1/docs](http://127.0.0.1:3000/v1/docs).

## 4. Generate the SDK

```bash
# Live mount (server running) — pass the mount point; callspec.json is appended
npx callspec http://127.0.0.1:3000/v1 --output src/generated/api.ts

# From file — pin the contract from the server, then codegen offline
curl -fsS http://127.0.0.1:3000/v1/callspec.json -o callspec.json
npx callspec ./callspec.json --output src/generated/api.ts
```

CI, pinning, and `schemas`: [SDK generation](./sdk-generation.md).

## 5. Call from your app

Each method returns a **Result** — check `result.ok`, then branch on `result.code`. That union is **fully exhaustive** (every domain, builtin, and client error for the route); TypeScript catches a missing `switch` case. Types are inferred; import `GetProductByIdOutput` etc. only when you need them (props, shared helpers).

```typescript
import {ApiClient} from './generated/api';
import {toast} from './toast'; // sonner, react-hot-toast, whatever you use

const api = new ApiClient({baseUrl: 'http://127.0.0.1:3000/v1'});

const id = 'sku-1';
const result = await api.getProductById({id});

if (!result.ok) {
    if (result.code === 'NOT_FOUND') {
        toast.error(`Unknown sku ${id}`);
        return;
    }
    if (result.code === 'NETWORK_ERROR') {
        toast.error('Check your connection and try again');
        return;
    }
    toast.error('Something went wrong');
    return;
}

result.value.name;       // string
result.value.priceCents; // number
```

See [Client usage](./client-usage.md) for auth headers, app helpers, and React patterns.

**Also useful:** [Authentication](./authentication.md) · [Request context](./request-context.md) · [API reference](./api-reference.md) · [SDK generation](./sdk-generation.md)
