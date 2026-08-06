<div align="center">
  <picture>
    <source srcset="assets/callspec-lockup-dark.svg?cb=3" media="(prefers-color-scheme: dark)" />
    <source srcset="assets/callspec-lockup-light.svg?cb=3" media="(prefers-color-scheme: light)" />
    <img src="assets/callspec-lockup-light.svg?cb=3" alt="callspec" />
  </picture>

  <h3 align="center">Simple TypeScript powers your RPC API, SDK, MCP, docs, and OpenAPI spec.</h3>

  <br>

  <p>
    <a href="assets/callspec-ui-chirp-demo-home.png">
      <img src="assets/callspec-ui-chirp-demo-home.png" alt="callspec UI" width="920" />
    </a>
  </p>
</div>

Define your API once with simple TypeScript — methods like `getProductById` with typed inputs, outputs, and errors — and Callspec gives you the whole stack from that one place: the server, a **TypeScript SDK** you use in your own app or ship to consumers, shared types (and optional form validators), docs, MCP tools, and **OpenAPI 3.1**.

On the frontend you call `api.getProductById({…})` and get a **Result** back — success value or a typed error `code` you can switch on. Same methods, same types, same errors as the server and as agents on MCP. No drift, no hand-rolled client, no guessing which status codes mean what.

## Features

- ⚡ **RPC methods** — define `getProductById`, not resource CRUD; Callspec mounts the server for you
- 🧩 **TypeScript SDK** — use it in your frontend or publish it for API consumers; shared types end-to-end
- 🎯 **Result-typed errors** — end-to-end error codes from resolver → SDK → OpenAPI → MCP
- 📄 **OpenAPI 3.1** — for tooling, gateways, and multi-language generators when you need them
- 🤖 **MCP** — same methods as your SDK, same auth and validation
- 📘 **Docs UI** — white-label explorer to try methods and connect MCP clients
- ✅ **Shared validators** — optional `exports` + `--validators` for forms that reuse server preds
- 🔐 **Auth & scope** — `auth: none | bearer` for credentials; `scope: public | private` for exports (SDK, docs, OpenAPI)

## Getting started

**Backend → generate SDK → call from your app.**

### 1. Backend

```bash
npm i callspec runtyp express
npm i -D tsx typescript @types/express
```

Node.js 18+, TypeScript 5+, Express 4.x (peer).

Return failures from resolvers (`return err.NOT_FOUND()`) — don't throw. Builtins are automatic on every route; add `defineErrors` when you need domain-specific codes ([error-handling.md](docs/error-handling.md)).

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
    resolver: async (input, _ctx) => {
        const found = products.find((item) => item.id === input.id);
        // Already validated! 🎉
        if (!found) return err.NOT_FOUND();
        return found;
    },
});
```

```typescript
// server/routes.ts + server/index.ts — see docs/guide.md for full layout
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

### 2. Generate the SDK

```bash
npx callspec http://127.0.0.1:3000/v1/callspec.json --output src/generated/api.ts
```

### 3. Call from your app

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

### Try the demo

```bash
npm run build && npm run dev:docs
```

Open [http://127.0.0.1:3456/v1/docs](http://127.0.0.1:3456/v1/docs) — Chirp sample API.

## Documentation

| Doc | What's in it |
|-----|----------------|
| [Guide](docs/guide.md) | Full server layout, authentication, request context, CI codegen, React client, shared validators |
| [Complete example](docs/complete-example.md) | Single-file copy-paste server |
| [API reference](docs/api-reference.md) | `route`, `spec`, `mountSpec`, auth, MCP, docs UI, package exports |
| [Error handling](docs/error-handling.md) | Result contract, domain errors, builtins, client normalization |

## Development

```bash
npm run validate   # build, lint, knip, typecheck:routes, test + coverage
npm run dev:docs   # Chirp demo API + callspec UI at :3456/v1/docs
```

## Help build the standard

callspec is early — and we're looking for **maintainers and contributors** who want to help define how typed APIs work in the age of agents.

- **Issues & ideas:** [github.com/logfoxai/callspec/issues](https://github.com/logfoxai/callspec/issues)
- **PRs welcome** — `npm run validate` before you push; conventional commits (`feat:`, `fix:`, `docs:`, etc.)

## Support

Questions or stuck on an integration? Join us on [Discord](https://discord.gg/2wyYnBDhWQ) — reach out to **skyyskater** for direct help.
