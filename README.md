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

Define your API once with simple TypeScript — methods like `searchProducts` with typed inputs, outputs, and errors — and Callspec gives you the whole stack from that one place: the server, a **TypeScript SDK** you use in your own app or ship to consumers, shared types (and optional form validators), docs, MCP tools, and **OpenAPI 3.1**.

On the frontend you call `api.searchProducts({…})` and get a **Result** back — success value or a typed error `code` you can switch on. Same methods, same types, same errors as the server and as agents on MCP. No drift, no hand-rolled client, no guessing which status codes mean what.

## Features

- ⚡ **RPC methods** — define `searchProducts`, not resource CRUD; Callspec mounts the server for you
- 🧩 **TypeScript SDK** — use it in your frontend or publish it for API consumers; shared types end-to-end
- 🎯 **Result-typed errors** — end-to-end error codes from handler → SDK → OpenAPI → MCP
- 📄 **OpenAPI 3.1** — for tooling, gateways, and multi-language generators when you need them
- 🤖 **MCP** — same methods as your SDK, same auth and validation
- 📘 **Docs UI** — white-label explorer to try methods and connect MCP clients
- ✅ **Shared validators** — optional `exports` + `--validators` for forms that reuse server preds
- 🔐 **Auth** — `public` / `private` with Bearer; reflected in OpenAPI automatically

## Getting started

**Backend → generate SDK → call from your app.**

### 1. Backend

```bash
npm i callspec runtyp express
npm i -D tsx typescript @types/express
```

Node.js 18+, TypeScript 5+, Express 4.x (peer).

Return domain failures from handlers (`return searchErr.PRODUCT_NOT_FOUND({…})`) — don't throw. Builtins like `VALIDATION_ERROR` are automatic.

```typescript
// server/routes/searchProducts.ts
import {defineRoute, defineErrors, isRouteFailure, type RouteFailuresFrom} from 'callspec';
import {predicates as p, type Infer} from 'runtyp';

const catalog = new Map([
    ['sku-1', {id: 'sku-1', name: 'Trail Pack 24L', priceCents: 8900}],
    ['sku-2', {id: 'sku-2', name: 'Insulated Bottle', priceCents: 2400}],
]);

const searchErr = defineErrors({
    SEARCH_CRITERIA_REQUIRED: {},
    PRODUCT_NOT_FOUND: {data: p.object({id: p.string()})},
});

const searchProductsInput = p.object({
    id: p.optional(p.string()),
    keywords: p.optional(p.string()),
});
const searchProductsOutput = p.object({
    results: p.array(p.object({id: p.string(), name: p.string(), priceCents: p.number()})),
    count: p.number(),
});

type SearchProduct = Infer<typeof searchProductsOutput>['results'][number];

function lookupById(id: string): SearchProduct | RouteFailuresFrom<typeof searchErr> {
    const product = catalog.get(id);
    if (!product) return searchErr.PRODUCT_NOT_FOUND({id});
    return product;
}

async function searchProductsHandler(
    input: Infer<typeof searchProductsInput>,
    _ctx: unknown,
) {
    if (input.id) {
        const product = lookupById(input.id);
        if (isRouteFailure(product)) return product;
        return {results: [product], count: 1};
    }
    const keywords = input.keywords?.trim();
    if (keywords) {
        const needle = keywords.toLowerCase();
        const results = [...catalog.values()].filter((item) => item.name.toLowerCase().includes(needle));
        return {results, count: results.length};
    }
    return searchErr.SEARCH_CRITERIA_REQUIRED();
}

export const searchProducts = defineRoute({
    input: searchProductsInput,
    output: searchProductsOutput,
    errors: searchErr,
    meta: {summary: 'Search products', description: 'Look up by product id or search by keywords.', tags: ['catalog']},
    access: 'public',
    mcp: true,
    handler: searchProductsHandler,
});
```

```typescript
// server/routes.ts + server/index.ts — see docs/guide.md for full layout
import {defineSpec} from 'callspec';
import {mountSpec} from 'callspec';
import express from 'express';
import {searchProducts} from './routes/searchProducts';

export const api = defineSpec({
    meta: {title: 'My API', version: '1.0.0'},
    routes: {searchProducts},
});

const app = express();
const router = express.Router();
router.use(express.json());
mountSpec(router, api);
app.use('/v1', router);
app.listen(3000);
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

Codegen exports **`SearchProductsInput`**, **`SearchProductsOutput`**, and **`SearchProductsResult`** — input, success value, and a discriminated error union.

```typescript
import {
    ApiClient,
    type SearchProductsInput,
    type SearchProductsOutput,
    type SearchProductsResult,
} from './generated/api';

const api = new ApiClient({baseUrl: 'http://127.0.0.1:3000/v1'});

const input: SearchProductsInput = {keywords: 'trail'};
const result: SearchProductsResult = await api.searchProducts(input);

if (!result.ok) {
    if (result.code === 'PRODUCT_NOT_FOUND') {
        const missingId: string = result.data.id;
        throw new Error(`Unknown sku ${missingId}`);
    }
    if (result.code === 'SEARCH_CRITERIA_REQUIRED') {
        throw new Error('Pass id or keywords');
    }
    throw new Error(result.code);
}

const {results, count}: SearchProductsOutput = result.value;
const first = results[0];
first.priceCents; // number — fully typed from your server preds
count; // number
```

### Try the demo

```bash
npm run build && npm run dev:docs
```

Open [http://127.0.0.1:3456/v1/docs](http://127.0.0.1:3456/v1/docs) — Chirp sample API.

## Documentation

| Doc | What's in it |
|-----|----------------|
| [Guide](docs/guide.md) | Full server layout, writing `callspec.json`, CI codegen, React client, shared validators |
| [Complete example](docs/complete-example.md) | Single-file copy-paste server |
| [API reference](docs/api-reference.md) | `defineRoute`, `defineSpec`, `mountSpec`, auth, MCP, docs UI, package exports |
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
