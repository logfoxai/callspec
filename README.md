<div align="center">
  <picture>
    <source srcset="assets/callspec-lockup-dark.svg?cb=4" media="(prefers-color-scheme: dark)" />
    <source srcset="assets/callspec-lockup-light.svg?cb=4" media="(prefers-color-scheme: light)" />
    <img src="assets/callspec-lockup-light.svg?cb=4" alt="callspec" />
  </picture>
  <h3 align="center">Simple TypeScript powers your RPC API, SDK, MCP, docs, and OpenAPI spec.</h3>
  <br>
  <p align="center">
  <a href="assets/callspec-flow.svg?cb=5">
    <img src="assets/callspec-flow.svg?cb=5" alt="Callspec flow: define in TypeScript, mountSpec, CLI SDK, OpenAPI export, optional Fern multi-language SDKs" />
  </a>
</p>
</div>

Define your API once with simple TypeScript — methods like `getProductById` with typed inputs, outputs, and errors — and Callspec gives you the whole stack from that one place: the server, a **TypeScript SDK** you use in your own app or ship to consumers, shared types (and optional form validators), docs, MCP tools, and **OpenAPI 3.1**.

On the frontend you call `api.getProductById({…})` and get a **Result** back — success value or a typed error `code` you can switch on. Same methods, same types, same errors as the server and as agents on MCP. No drift, no hand-rolled client, no guessing which status codes mean what.

- ⚡ **RPC functions** — define simple functions like `getProductById`, not REST CRUD
- 🧩 **TypeScript SDK** — use it in your frontend or publish it for API consumers
- 🎯 **Result-typed errors** — end-to-end error codes from resolver → SDK → OpenAPI → MCP
- 📄 **OpenAPI 3.1** — for tooling, gateways, and multi-language generators when you need them
- 🤖 **MCP** — same methods as your SDK, same auth and validation
- 📘 **Docs UI** — white-label explorer to try methods and connect MCP clients
- ✅ **Shared types & validators** — same preds end-to-end; optional `exports` + `--validators` for forms

## Contents

- [Getting started](#getting-started)
  - [Install backend dependencies](#1-install-backend-dependencies)
  - [Define backend routes](#2-define-backend-routes)
  - [Define and mount backend API](#3-define-and-mount-backend-api)
  - [Generate the SDK](#4-generate-the-sdk)
  - [Call from your app](#5-call-from-your-app)
  - [Try the demo](#try-the-demo)
- [How it fits together](#how-it-fits-together)
- [Server layout](#server-layout)
- [Complete example](#complete-example)
- [Authentication](#authentication)
- [Request context](#request-context)
- [API reference](#api-reference)
- [Error handling](#error-handling)
- [SDK generation](#sdk-generation)
- [Client usage](#client-usage)
- [Shared validation](#shared-validation)
- [Docs UI](#docs-ui)
- [MCP](#mcp)
- [OpenAPI](#openapi)
- [Development](#development)
- [Help build the standard](#help-build-the-standard)
- [Support](#support)

## Getting started

Walk through a minimal server and client below. For a [single-file copy-paste server](docs/complete-example.md) or deeper topics, see the sections below.

### 1. Install backend dependencies

```bash
npm i callspec runtyp express
npm i -D tsx typescript @types/express
```

Requirements: Node.js 18+, TypeScript 5+, Express 4.x (peer).

### 2. Define backend routes

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
        // input validated and fully typed — return and errors too! 🎉
        const found = products.find((item) => item.id === input.id);
        if (!found) return err.NOT_FOUND();
        return found;
    },
});
```

**Quick notes:**

- Return failures from resolvers (ie, `return err.NOT_FOUND()`) &mdash; **don't throw exceptions**.
- Built-in error responses such as `NOT_FOUND` and `SERVICE_UNAVAILABLE` can be returned from any route without defining them.
- Define custom domain errors with `errors:`.

### 3. Define and mount backend API

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

### 4. Generate the SDK

```bash
# From URL (server running) — pass the mount point; callspec.json is appended
npx callspec http://127.0.0.1:3000/v1 --output src/generated/api.ts

# From file
npx callspec ./callspec.json --output src/generated/api.ts
```

### 5. Call from your app

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

## How it fits together

1. **Define** — `route()` + `spec()` in TypeScript. Typed inputs/outputs, Result errors, optional validators (`exports` + `--validators`).
2. **mountSpec** — serve the HTTP API, docs UI (`/docs`), OpenAPI 3.1 (`/openapi.json`), and MCP (`/mcp`). Auth is reflected in OpenAPI and MCP.
3. **CLI** — `npx callspec http://127.0.0.1:3000/v1 --output …` (mount point; fetches `/callspec.json`) → TypeScript SDK.
4. **OpenAPI** — gateways, testing, mocking, and multi-language generators at `/openapi.json`.
5. **Optional: Fern** — multi-language SDKs and docs. Callspec stays your TS runtime; Fern handles public multi-lang DX. [Fern vs Callspec](docs/fern-vs-callspec.md).

## Server layout

Split routes across files — one export per method for `spec`. Unit-test via `getProductById.resolver(input, ctx)`; no HTTP.

**Shared schemas** — reuse domain preds, not copy-paste per route:

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
```

Pass named preds to `spec({ exports: { product, productList, … } })` when you want them in codegen / `--validators`.

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

| Surface | URL |
|---------|-----|
| Docs UI | `http://127.0.0.1:3000/v1/docs` |
| Contract | `http://127.0.0.1:3000/v1/callspec.json` |
| OpenAPI | `http://127.0.0.1:3000/v1/openapi.json` |
| RPC | `POST http://127.0.0.1:3000/v1/getProductById` |
| MCP | `http://127.0.0.1:3000/v1/mcp` |

Bearer routes and `authenticate`: [Authentication](#authentication).

## Complete example

Single-file copy-paste server you can run locally — same catalog API, no split layout.

**[docs/complete-example.md](docs/complete-example.md)**

## Authentication

Credentials are per-route, not in the input pred.

| `auth` | Behavior |
|--------|----------|
| `'none'` | No token required — resolver gets `ctx: undefined` unless the client sent a Bearer token and you wired `authenticate` |
| `'bearer'` (default) | Missing or invalid token → **401 `UNAUTHORIZED`** before the resolver runs |

Any route with `auth: 'bearer'` requires `authenticate` on the spec — `spec` throws at load time if it is missing.

```typescript
// server/auth.ts
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

**Client** — pass the token on every call:

```typescript
const api = new ApiClient({
    baseUrl: 'http://127.0.0.1:3000/v1',
    headers: () => ({Authorization: `Bearer ${getSessionToken()}`}),
});
```

**Docs / MCP:** set `meta.authHint`. OpenAPI Bearer security is derived from route `auth` automatically.

`scope: 'private'` hides a route from exports (SDK, docs, OpenAPI) but does not change the auth gate. See [API reference](#api-reference).

## Request context

The resolver's second argument is **request context** — whatever your `authenticate(token, req)` returns. It is not part of the RPC input pred; it is injected per request after auth.

Use `req` when context depends on more than the token — tenant header, tracing ids, etc.

```typescript
export type Ctx = {userId: string; tenantId: string};

export const authenticate: Authenticate<Ctx> = async (token, req) => {
    const user = await verifyJwt(token);
    if (!user) return undefined;

    const tenantId = req.headers['x-tenant-id'];
    if (typeof tenantId !== 'string') return undefined;

    return {userId: user.sub, tenantId};
};
```

Annotate `ctx: Ctx` on the resolver param. **Public routes** (`auth: 'none'`): `ctx` is normally `undefined`; if the client sends `Authorization: Bearer …` and you defined `authenticate`, context is still resolved.

**Testing** — no HTTP, no Express:

```typescript
const orders = await listOrders.resolver({status: 'open'}, {
    userId: 'user_1',
    tenantId: 'acme',
});
```

## API reference

`defineErrors` → `route()` → `spec()` → `mountSpec()` + CLI codegen.

| API | Purpose |
|-----|---------|
| `route({ input, output, meta, resolver, … })` | Define one RPC method; test via `.resolver(input, ctx)` |
| `spec({ meta, routes, exports?, authenticate? })` | Register wired routes into a callspec |
| `mountSpec(router, spec, options?)` | Serve RPC, docs UI, `callspec.json`, OpenAPI, MCP |

**`mountSpec` options:** `basePath`, `docs`, `docsPath`, `mcpPath`, `logging`, `handleUnhandledError`, `logUnhandledError`.

**Package exports:** `callspec`, `callspec/client`, `callspec/document`, `callspec/express`.

Full reference (resolver patterns, scope, runtime client, testing): **[docs/api-reference.md](docs/api-reference.md)**

## Error handling

Return failures from resolvers — `return err.NOT_FOUND()` — not throws. Every generated client method returns a **Result** with a fully exhaustive `code` union (domain, builtin, and client-only errors like `NETWORK_ERROR` and `UNKNOWN_ERROR`).

- **Builtins** — automatic on every route; never re-declare (`NOT_FOUND`, `VALIDATION_ERROR`, `UNAUTHORIZED`, …).
- **Domain errors** — `defineErrors()` + `errors:` on the route; TypeScript checks resolver return types at compile time.
- **mountSpec runtime** — owns validation, auth, and unhandled-error mapping; no extra error middleware on the mounted router.

Full design reference: **[docs/error-handling.md](docs/error-handling.md)**

## SDK generation

The CLI reads **`{mount}/callspec.json`** — pass a mount-point URL or a path to the file. The document already contains routes, errors, `info`, and paths.

```bash
# local dev (API running)
npx callspec http://127.0.0.1:3000/v1 --output src/generated/api.ts

# CI or offline (committed contract)
npx callspec ./callspec.json --output src/generated/api.ts

# shared runtyp preds for forms (optional)
npx callspec ./callspec.json --output src/generated/validators.ts --validators
```

```bash
callspec <source> --output <file> [--class-name ApiClient]
```

Commit `callspec.json` and/or generated `api.ts`; fail CI on drift.

```json
"scripts": {
  "generate:api": "callspec ./callspec.json --output src/generated/api.ts"
}
```

The generated file imports only `callspec/client` (browser-safe) — one typed method per route.

**Writing `callspec.json`** — not required; codegen can use the live URL. For CI:

```bash
curl -fsS http://127.0.0.1:3000/v1/callspec.json -o callspec.json
```

Or from TypeScript via `emitCallspec` from `callspec/document` (same projection `mountSpec` serves). See [OpenAPI](#openapi).

## Client usage

Wrap generated methods in app helpers — branch on `result.code` in a `switch`; TypeScript flags missing cases.

```typescript
const api = new ApiClient({
    baseUrl: import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:3000/v1',
    headers: () => ({Authorization: `Bearer ${getSessionToken()}`}),
});

export async function fetchProduct(id: string) {
    const result = await api.getProductById({id});

    if (!result.ok) {
        if (result.code === 'NOT_FOUND') return null;
        if (result.code === 'NETWORK_ERROR') throw new Error('offline');
        throw new Error('unexpected');
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

Same methods, same types, same error codes as the server and MCP — no hand-rolled `fetch`.

## Shared validation

Routes declare wire validation once. Codegen gives the frontend the same **types** (and, with `exports`, **named runtyp preds**) so forms and RPC stay in sync.

| What | Where | Who uses it |
|------|-------|-------------|
| RPC methods | `spec({ routes })` | Server + generated `ApiClient` |
| Request/response shapes | Route `input` / `output` | Server boundary + generated `{Route}Input` types |
| Shared UI slices | `spec({ exports })` | Filters, modals — same pred as server |
| UI-only fields | Consumer app | Never in the spec |

Register preds you want consumers to import under **`exports`**. Composition inside a route input does not auto-export the slice.

Powered by [runtyp](https://github.com/logfoxai/runtyp): preds validate on the server and serialize to JSON Schema for docs, OpenAPI, MCP, and codegen.

## Docs UI

`mountSpec` serves a white-label explorer at **`/docs`** by default — try RPCs, browse schemas, connect MCP clients. Contract paths are fixed: **`/callspec.json`**, **`/openapi.json`**. Override only the UI mount with `docsPath`; pass `{docs: false}` to disable docs surfaces.

Whitelabel via `meta` (`title`, `intro`, `website`, `logo`, `authHint`, `mcpInstructions`).

## MCP

Set `mcp: true` on any route. When any route opts in, `mountSpec` mounts MCP at **`/mcp`** (override with `mcpPath`). Agents call the **same resolvers** as HTTP RPC — same auth, validation, and error codes.

Set `meta.mcpInstructions` for agent-facing guidance in the docs UI connect flow.

## OpenAPI

**OpenAPI 3.1** at **`/openapi.json`** is a parallel projection from the same `routes` object (not derived from `callspec.json`). RPC methods appear as `POST` paths; errors grouped by HTTP status. Use for gateways, mocking, and multi-language generators (e.g. Fern).

**Native contract:** **`callspec.json`** (`callspec: "2.0"`) at a fixed path on the mount — codegen source of truth.

```typescript
import {emitCallspec, emitOpenApi} from 'callspec/document';
```

`emitOpenApi` and `parseCallspecDocument` are in `callspec/document` for server tooling and tests.

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
