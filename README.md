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

Define your API once with simple TypeScript — methods like `searchRecentPosts` with typed inputs, outputs, and errors — and Callspec gives you the whole stack from that one place: the server, a **TypeScript SDK** you use in your own app or ship to consumers, shared types (and optional form validators), docs, MCP tools, and **OpenAPI 3.1**.

On the frontend you call `api.searchRecentPosts({…})` and get a **Result** back — success value or a typed error `code` you can switch on. Same methods, same types, same errors as the server and as agents on MCP. No drift, no hand-rolled client, no guessing which status codes mean what.

## Features

- ⚡ **RPC methods** — define `searchRecentPosts`, not resource CRUD; Callspec mounts the server for you
- 🧩 **TypeScript SDK** — use it in your frontend or publish it for API consumers; shared types end-to-end
- 🎯 **Result-typed errors** — end-to-end error codes from handler → SDK → OpenAPI → MCP
- 📄 **OpenAPI 3.1** — for tooling, gateways, and multi-language generators when you need them
- 🤖 **MCP** — same methods as your SDK, same auth and validation
- 📘 **Docs UI** — white-label explorer to try methods and connect MCP clients
- ✅ **Shared validators** — optional `exports` + `--validators` for forms that reuse server preds
- 🔐 **Auth** — `public` / `private` with Bearer; reflected in OpenAPI automatically

Docs, OpenAPI, and MCP paths are configurable defaults on `mountSpec`.

## Getting started

Recommended path: **backend → generate SDK from live contract → call from your app**. Deeper options (committed contract, CI, React, auth) are in **[Guide](#guide)** below.

### 1. Backend

```bash
npm i callspec runtyp express
npm i -D tsx typescript @types/express
```

Node.js 18+, TypeScript 5+, Express 4.x (peer).

Define each route in its own file with `defineRoute`, assemble `defineSpec`, then `mountSpec` serves RPC, docs, `callspec.json`, OpenAPI, and MCP. Fuller copy-paste server: **[docs/complete-example.md](docs/complete-example.md)**.

```typescript
// server/routes/searchRecentPosts.ts
import {defineRoute} from 'callspec';
import type {RouteHandler} from 'callspec';
import {predicates as p, type Infer} from 'runtyp';

export type Ctx = {userId: string};

const input = p.object({
    query: p.string(),
    max_results: p.optional(p.number({range: {min: 1, max: 100}})),
});

const output = p.object({
    results: p.array(p.object({id: p.string(), text: p.string(), authorId: p.string()})),
    count: p.number(),
});

const handler: RouteHandler<Infer<typeof input>, Infer<typeof output>, Ctx> = async (input, ctx) => ({
    results: [{id: '1', text: `Match for "${input.query}"`, authorId: ctx.userId}],
    count: 1,
});

export const searchRecentPosts = defineRoute({
    input,
    output,
    meta: {summary: 'Search recent posts', tags: ['posts']},
    access: 'private',
    mcp: true,
    handler,
});
```

```typescript
// server/routes.ts
import {defineSpec} from 'callspec';
import type {Authenticate} from 'callspec';
import {searchRecentPosts, type Ctx} from './routes/searchRecentPosts';

const authenticate: Authenticate<Ctx> = async (token, _req) => {
    if (!token) return undefined;
    return {userId: 'user_123'};
};

export const api = defineSpec({
    meta: {title: 'My API', version: '1.0.0', intro: 'Search posts from a typed RPC surface.'},
    authenticate,
    routes: {searchRecentPosts},
});
```

```typescript
// server/index.ts
import express from 'express';
import {mountSpec} from 'callspec';
import {api} from './routes';

const app = express();
const router = express.Router();
router.use(express.json());

mountSpec(router, api, {basePath: '/v1'});

app.use('/v1', router);
app.listen(3000);
```

```bash
npx tsx server/index.ts
```

Open [http://127.0.0.1:3000/v1/docs](http://127.0.0.1:3000/v1/docs) and try a route.

### 2. Generate the SDK

With the API running, point the CLI at the live contract (no server package in the browser):

```bash
npx callspec http://127.0.0.1:3000/v1/callspec.json --output src/generated/api.ts
```

### 3. Call from your app

```typescript
import {ApiClient} from './generated/api';

const api = new ApiClient({baseUrl: 'http://127.0.0.1:3000/v1'});

const result = await api.searchRecentPosts({query: 'hello', max_results: 10});
if (!result.ok) {
    // branch on result.code — see [error-handling.md](docs/error-handling.md)
    throw new Error(result.code);
}
result.value.results;
```

### Try the demo

In this repo:

```bash
npm run build && npm run dev:docs
```

Open [http://127.0.0.1:3456/v1/docs](http://127.0.0.1:3456/v1/docs) — Chirp sample API (`Authorization: Bearer demo` for private routes).

## Guide

### Full backend example

One file per route (`defineRoute` + preds + handler), then assemble the spec — same pattern as [complete-example.md](docs/complete-example.md):

```typescript
// server/routes/searchRecentPosts.ts
import {defineRoute} from 'callspec';
import type {RouteHandler} from 'callspec';
import {predicates as p, type Infer} from 'runtyp';

export type Ctx = {userId: string};

const input = p.object({
    query: p.string(),
    max_results: p.optional(p.number({range: {min: 1, max: 100}})),
});

const output = p.object({
    results: p.array(p.object({id: p.string(), text: p.string(), authorId: p.string()})),
    count: p.number(),
});

const handler: RouteHandler<Infer<typeof input>, Infer<typeof output>, Ctx> = async (input, ctx) => ({
    results: [{id: '1', text: `Match for "${input.query}"`, authorId: ctx.userId}],
    count: 1,
});

export const searchRecentPosts = defineRoute({
    input,
    output,
    meta: {
        summary: 'Search recent posts',
        description: 'Returns posts matching a query.',
        tags: ['posts'],
    },
    access: 'private',
    mcp: true,
    handler,
});
```

```typescript
// server/routes.ts
import {defineSpec} from 'callspec';
import type {Authenticate} from 'callspec';
import {searchRecentPosts, type Ctx} from './routes/searchRecentPosts';

const authenticate: Authenticate<Ctx> = async (token, _req) => {
    if (!token) return undefined;
    return {userId: 'user_123'};
};

export const api = defineSpec({
    meta: {title: 'My API', version: '1.0.0', intro: 'Search posts from a typed RPC surface.'},
    authenticate,
    routes: {searchRecentPosts},
});
```

| Surface | URL |
|---------|-----|
| Docs UI | `http://127.0.0.1:3000/v1/docs` |
| Contract | `http://127.0.0.1:3000/v1/callspec.json` |
| OpenAPI | `http://127.0.0.1:3000/v1/openapi.json` |
| RPC | `POST http://127.0.0.1:3000/v1/searchRecentPosts` |
| MCP | `http://127.0.0.1:3000/v1/mcp` |

`mountSpec` path options (`docs`, `mcpPath`, per-path overrides): [API reference § mountSpec](#mountspec).

### Writing `callspec.json`

You do **not** need a committed contract — codegen can always use the live URL (Getting started §2). To produce a file for CI or offline use:

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

### Frontend codegen

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

### Frontend usage

The generated `ApiClient` imports only `callspec/client` (browser-safe). Every method returns a **Result** — branch on `ok` and `code`:

```typescript
// src/app/searchRecentPosts.ts
import {ApiClient} from '../generated/api';

const api = new ApiClient({
    baseUrl: import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:3000/v1',
    headers: () => ({
        Authorization: `Bearer ${localStorage.getItem('token') ?? ''}`,
    }),
});

export async function searchRecentPosts(query: string) {
    const result = await api.searchRecentPosts({query, max_results: 10});

    if (!result.ok) {
        if (result.code === 'VALIDATION_ERROR') {
            throw new Error(`Invalid input: ${JSON.stringify(result.data)}`);
        }
        if (result.code === 'UNAUTHORIZED') {
            throw new Error('Sign in required');
        }
        throw new Error(result.code);
    }

    return result.value.results;
}
```

```tsx
// src/components/Search.tsx
import {useState} from 'react';
import {searchRecentPosts} from '../app/searchRecentPosts';

export function Search() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<{id: string; text: string}[]>([]);

    async function onSearch() {
        setResults(await searchRecentPosts(query));
    }

    return (
        <>
            <input value={query} onChange={(e) => setQuery(e.target.value)} />
            <button type="button" onClick={() => void onSearch()}>Search</button>
            <ul>{results.map((r) => <li key={r.id}>{r.text}</li>)}</ul>
        </>
    );
}
```

Same methods, same types, same error codes as the server and MCP tools — no hand-rolled `fetch`.

## Errors

Errors are **typed return possibilities**, not mystery exceptions. Full guide: [error-handling.md](docs/error-handling.md).

**Server** — return failures; don’t throw for domain cases:

```typescript
import {defineRoute, defineErrors, err} from 'callspec';
import type {RouteHandler} from 'callspec';
import {predicates as p, type Infer} from 'runtyp';

type Ctx = unknown;

const getUserInput = p.object({email: p.string()});
const getUserOutput = p.object({email: p.string(), name: p.string()});

const userErr = defineErrors({
    USER_EXISTS: {data: p.object({email: p.string()})},
});

const getUser: RouteHandler<Infer<typeof getUserInput>, Infer<typeof getUserOutput>, Ctx> = async (input, _ctx) => {
    if (!user) return err.NOT_FOUND();
    if (taken) return userErr.USER_EXISTS({email: input.email});
    return user;
};

export const routes = {
    getUser: defineRoute({
        input: getUserInput,
        output: getUserOutput,
        errors: userErr,
        meta: {summary: 'Get user', description: 'Lookup by email', tags: ['users']},
        access: 'public',
        handler: getUser,
    }),
};
```

**Client** — every method returns a Result; branch on `code`:

```typescript
const result = await api.getUser({email: 'missing@example.com'});

if (!result.ok) {
    if (result.code === 'NOT_FOUND') { /* … */ }
    if (result.code === 'USER_EXISTS') { /* result.data.email */ }
    return;
}

result.value; // success — fully typed
```

Wire format is always `{ "error": "CODE", "data?": … }`. The **`error` code** is the contract; HTTP status is a transport hint for OpenAPI and proxies.

**Builtin errors** (automatic on every route — never declare):

| Code | When |
|------|------|
| `VALIDATION_ERROR` | Input failed runtyp validation |
| `UNAUTHORIZED` | Private route without valid Bearer token |
| `ROUTE_NOT_FOUND` | Unknown RPC method name |
| `NOT_FOUND` | Handler: resource missing |
| `FORBIDDEN` | Handler/middleware: not allowed |
| `CONFLICT` | Handler: state conflict |
| `TOO_MANY_REQUESTS` | Rate limit middleware |
| `SERVICE_UNAVAILABLE` | Dependency unavailable |
| `INTERNAL_ERROR` | Unhandled throw — `mountSpec` logs and responds |

`mountSpec` owns the RPC catch path and default logging. Use `expressErrorHandler()` from `callspec/express` only for routes **outside** mountSpec. Transport failures (DNS, offline, aborted `fetch`) become client-only **`NETWORK_ERROR`** (`status: 0`) — still a Result, not a thrown exception.

## API reference

### `defineRoute`

Define **runtyp preds once**, then type handlers with `Infer<typeof …>`. Pass preds and handlers separately into `defineRoute`:

```typescript
const searchRecentPostsInput = p.object({…});
const searchRecentPostsOutput = p.object({…});

const searchRecentPosts: RouteHandler<
    Infer<typeof searchRecentPostsInput>,
    Infer<typeof searchRecentPostsOutput>,
    Ctx
> = async (input, ctx) => ({…});

defineRoute({
    input: searchRecentPostsInput,
    output: searchRecentPostsOutput,
    meta: {summary, description, tags},
    access?: 'public' | 'private',  // default 'private'
    mcp?: true | {name?, annotations?},
    errors?: defineErrors({…}),
    handler: searchRecentPosts,
})
```

`defineRoute` checks the handler against the preds at compile time (arity 2: `input`, `ctx`).

### `defineSpec`

```typescript
defineSpec({
    meta?: CallspecMeta,
    routes: RoutesMap<Ctx>,          // required — your map of defineRoute entries
    exports?: Record<string, Pred>,  // named schemas for consumer codegen (filters, domain preds)
    authenticate?: Authenticate<Ctx>,
})
```

Throws at load time if any route is `private` and `authenticate` is missing.

### `mountSpec`

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

See [error-handling.md § mountSpec runtime](docs/error-handling.md#mountspec-runtime).

### Input and output

Every route requires **`input`** and **`output`** preds. Use `p.any()` when you do not need a precise schema. Only **`errors`** is optional.

`defineRoute` type-checks handlers against the spec: the `input` pred fixes `I`, the `output` pred fixes `O`, and the handler must implement `(input: I, ctx: Ctx) => O`. A mismatched resolver is a compile error on the `handler` property.

## Shared validation and types (backend + frontend)

Routes declare wire validation once. Codegen gives the frontend the same **types** (and, with `exports`, **named runtyp preds**) so forms and RPC stay in sync without copy-paste drift.

| What | Where it lives | Who uses it |
|------|----------------|-------------|
| RPC methods | `defineSpec({ routes })` | Server handlers + generated `ApiClient` |
| Full request/response shapes | Route `input` / `output` | Server boundary + generated `{Route}Input` types |
| Shared UI slices (filters, domain objects) | `defineSpec({ exports })` | Filter bars, modals — same pred as server ([plan](docs/exports-and-codegen.plan.md)) |
| UI-only fields | Consumer app local | Never in the spec |

```bash
npx callspec ./callspec.json --output ./src/generated/validators.ts --validators
```

Composition inside a route input **does not** auto-export the slice — register preds you want consumers to import under **`exports`**.

Powered by [runtyp](https://github.com/logfoxai/runtyp): preds validate at runtime on the server and serialize to JSON Schema for docs, OpenAPI, MCP, and codegen.

## Frontend client generation

See **Getting started** for the happy path and **[Guide § Frontend codegen](#frontend-codegen)** for CI, validators, and package scripts.

The CLI reads **`callspec.json`** (file or URL) and writes a typed client. It does not take title, version, or basePath — those live in the document because `mountSpec` (or `emitCallspec`) already wrote them from `defineSpec({ meta })` and `basePath`. See **Guide § Writing callspec.json** for producing the file.

```bash
# deployed or local API
npx callspec https://api.example.com/v1/callspec.json --output src/generated/api.ts

# checked-in contract
npx callspec ./callspec.json --output src/generated/api.ts

# shared runtyp preds for forms (optional)
npx callspec ./callspec.json --output src/generated/validators.ts --validators
```

Optional: `--class-name ApiClient` (default). `emitCallspec` and friends live in `callspec/document` for the optional write step above — not for client codegen.

### Generated client details

The generated file:

- Imports only `callspec/client` (browser-safe — no Express)
- One typed method per route, each returning `CallspecRouteResult`
- Preserves Callspec wire behavior (including Date deserialization)
- Can be committed; CI can regenerate with `git diff --exit-code`

```bash
callspec <source> --output <file> [--class-name ApiClient]
```

## Native Callspec document & OpenAPI

`callspec.json` is Callspec's native contract (`callspec: "1.0"`). `mountSpec` serves it at `/callspec.json` — or use `emitCallspec` to write the same document to disk ([Guide § Writing callspec.json](#writing-callspecjson)). The docs UI and TypeScript client generator consume that file as-is.

**OpenAPI 3.1** (`/openapi.json`) is a parallel projection from the same `routes` object (not derived from `callspec.json`). Same inputs, outputs, auth, and error bodies — ready for OpenAPI tooling, gateways, and multi-language SDK generators. RPC methods appear as `POST` paths; errors are grouped by HTTP status.

`emitOpenApi` and `parseCallspecDocument` are also in `callspec/document` for server tooling and tests.

## Runtime client

Low-level `CallspecClient` if you need it; prefer the generated client for app code.

```typescript
import {CallspecClient, isCallspecOk} from 'callspec/client';

const runtime = new CallspecClient({baseUrl: 'https://api.example.com/v1'});
const result = await runtime.callResult<{results: unknown[]}>('searchRecentPosts', {query: 'x'});

if (isCallspecOk(result)) {
    console.log(result.value);
} else {
    console.error(result.status, result.code);
}
```

Failed HTTP responses are normalized in order: exact callspec JSON → known body phrases → HTTP status → fuzzy match → client-only **`UNKNOWN_ERROR`**. Fetch that never gets a response → **`NETWORK_ERROR`**. See [Client error normalization](docs/error-handling.md#client-error-normalization).

## Built-in MCP server

Set `mcp: true` on any `defineRoute`. When any route opts in, `mountSpec` mounts MCP at `/mcp` automatically.

Agents call the **same handlers** as HTTP RPC — same auth gate, same input validation, same error codes.

## callspec UI

Minimal, fast docs UI baked into the package. Browse routes, try RPCs, read schemas, and **connect MCP clients** from the home page. Pass `{docs: false}` to keep the API private and use `/mcp` only.

Whitelabel via flat **`meta`** fields (`title`, `intro`, `website`, `logo`, `authHint`, `mcpInstructions`).

## Auth

- **`access: 'public'`** — no credentials required
- **`access: 'private'`** (default) — 401 without valid Bearer token
- **`authenticate(token, req)`** on the spec — your hook; callspec extracts Bearer and calls it

OpenAPI Bearer security is **auto-derived** from route `access`.

## Package exports

| Import | Use |
|--------|-----|
| `callspec` | `defineRoute`, `defineSpec`, `mountSpec`, `defineErrors`, `err`, `logRequest`, `BUILTIN_ERROR`; types `Callspec`, `RoutesMap`, `MountSpecOptions`, `RouteFailure`, `RouteHandler`, `Authenticate` |
| `callspec/express` | `expressErrorHandler` |
| `callspec/client` | Runtime client (`CallspecClient`, `isCallspecOk`, `CLIENT_ERROR`, `BUILTIN_ERROR`, `CallspecRouteResult`, …) |
| `callspec/document` | `emitCallspec`, `emitOpenApi`, `parseCallspecDocument`, `generateClientFile`, `generateValidatorsFile` |

## Development

```bash
npm run validate   # build, lint, knip, typecheck:routes, test + coverage
npm run dev:docs   # Chirp demo API + callspec UI at :3456/v1/docs
```

**`typecheck:routes`** — compile-only checks in `src/typecheck/` assert that `defineRoute` handlers match their `input`/`output` preds.

Integration tests spin up Express in-process and verify `callspec.json`, OpenAPI, `/docs`, auth, MCP, RPC, and client generation end-to-end.

## Help build the standard

callspec is early — and we're looking for **maintainers and contributors** who want to help define how typed APIs work in the age of agents.

- **Issues & ideas:** [github.com/logfoxai/callspec/issues](https://github.com/logfoxai/callspec/issues)
- **PRs welcome** — `npm run validate` before you push; conventional commits (`feat:`, `fix:`, `docs:`, etc.)

## Support

Questions or stuck on an integration? Join us on [Discord](https://discord.gg/2wyYnBDhWQ) — reach out to **skyyskater** for direct help.
