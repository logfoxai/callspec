# Getting started

This page walks through a minimal server and client. Prefer one file? Copy the [single-file server example](./single-file-server-example.md).

For coding agents: [Working with Coding Agents](./coding-agents.md) (skill + copy-paste prompts).

## 1. Install backend dependencies

```bash
# callspec = RPC runtime; runtyp = typed validators for input/output; express = HTTP peer
npm i callspec runtyp express
npm i -D tsx typescript @types/express
```

Requirements: Node.js **18+** (runtime), TypeScript 5+, Express 4.x (peer).

## 2. Define a route

```typescript title="server/routes/getProductById.ts" frame="code"
import {route, err} from 'callspec';
// runtyp predicates — validate on the wire and drive TypeScript types
import {predicates as p} from 'runtyp';

// Shared output shape — reused as the route `output` pred
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
    // Request body must match this pred (RPC is POST JSON)
    input: p.object({id: p.string()}),
    output: product,
    // Docs UI / OpenAPI / MCP labels
    meta: {summary: 'Get product by ID', tags: ['catalog']},
    auth: 'none', // public — no Bearer; default is 'bearer'
    mcp: true, // expose as an MCP tool when the server mounts MCP
    handler: async (input, _ctx) => {
        // `input` is already validated and typed
        const found = products.find((item) => item.id === input.id);
        // Expected failures: return err.* — do not throw
        if (!found) return err.NOT_FOUND();
        return found; // must satisfy `output`
    },
});
```

Related: [runtyp](https://github.com/logfoxai/runtyp) · [Builtin errors](./builtin-errors.md) · [Error handling](./error-handling.md) · [Unit testing](./unit-testing.md) · [route & spec](./api-reference/route-and-spec.md)

## 3. Define and mount backend API

```typescript title="server/routes.ts" frame="code"
import {spec} from 'callspec';
import {getProductById} from './routes/getProductById';

// One registry — routes (+ optional authenticate, exports)
export const api = spec({
    meta: {title: 'My API', version: '1.0.0'},
    routes: {getProductById},
});
```

```typescript title="server/index.ts" frame="code"
import {mountSpec} from 'callspec';
import express from 'express';
import {api} from './routes';

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
npx tsx server/index.ts
```

Open [http://127.0.0.1:3000/v1/docs](http://127.0.0.1:3000/v1/docs).

Related: [Docs UI](./docs-ui.md) · [mountSpec](./api-reference/mount-spec.md) · [MCP Server](./mcp.md) · [OpenAPI](./openapi.md) · [Server layout](./server-layout.md)

## 4. Generate the SDK

```bash
# Live mount (server running) — pass the mount point; callspec.json is appended
npx callspec http://127.0.0.1:3000/v1 --output src/generated/api.ts

# From a pinned file — fetch the contract, then codegen offline / in CI
curl -fsS http://127.0.0.1:3000/v1/callspec.json -o callspec.json
npx callspec ./callspec.json --output src/generated/api.ts
```

Related: [SDK generation](./sdk-generation.md) · [Shared validation](./shared-validation.md) (`schemas` from codegen)

## 5. Call from your app

Each method returns a **Result** — check `result.ok`, then `switch` on `result.code`. The failure union is exhaustive (builtins + client-only codes + any domain errors you declared); TypeScript flags a missing `case`.

Full copy-paste template (every builtin + `NETWORK_ERROR` / `UNKNOWN_ERROR` filled in): **[Client usage](./client-usage.md)**.

Related: [Client usage](./client-usage.md) · [Builtin errors](./builtin-errors.md) · [Authentication](./authentication.md)
