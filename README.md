<div align="center">
  <picture>
    <source srcset="assets/callspec-lockup-dark.svg?cb=3" media="(prefers-color-scheme: dark)" />
    <source srcset="assets/callspec-lockup-light.svg?cb=3" media="(prefers-color-scheme: light)" />
    <img src="assets/callspec-lockup-light.svg?cb=3" alt="callspec" />
  </picture>

  <h3 align="center">One spec powers your API, SDK, MCP, docs, and OpenAPI.</h3>

  <br>

  <p>
    <a href="assets/callspec-ui-chirp-demo-home.png">
      <img src="assets/callspec-ui-chirp-demo-home.png" alt="callspec UI" width="920" />
    </a>
  </p>
</div>

Define your API once with simple TypeScript and get an **HTTP RPC** server, white-label docs, **OpenAPI 3.1**, an MCP server, and a generated TypeScript client with **shared types** (and optional shared validators for forms).

You define **methods** — `searchRecent`, `createTweet` — each with typed input, output, and errors. Call them over HTTP as `POST …/<method>` (mount path is yours — e.g. `/v1`). Handlers `return err.NOT_FOUND()`; the client gets a **Result** (`ok` / `code`) instead of try/catch for HTTP failures. That error contract is end-to-end — server, OpenAPI, MCP, and the generated client.

## Features

- ⚡ **HTTP RPC** — named methods over `POST …/<method>`, with runtyp validation at the boundary
- 🎯 **Result-typed errors** — handlers `return` failures; clients switch on `code`, not try/catch
- 📄 **OpenAPI 3.1** — emitted from the same registry for tooling, gateways, and multi-language generators
- 🤖 **MCP** — opt-in tools that call the same handlers as HTTP (same auth, same validation)
- 📘 **Docs UI** — white-label explorer for trying RPCs and connecting MCP clients
- 🧩 **TypeScript client + shared types** — generated from the contract; browser-safe, one Result per method
- ✅ **Shared validators** — optional `exports` + `--validators` so forms can reuse the same runtyp preds
- 🔐 **Auth** — `public` / `private` routes with Bearer; OpenAPI security derived automatically

Paths like `/docs`, `/openapi.json`, and `/mcp` are defaults — override via `mountSpec` options.

## Getting help

callspec is early — if you're trying it out or stuck on something, reach me on Discord (**skyyskater**). I maintain the project and answer adopters there directly.

## Getting started

```bash
npm i callspec runtyp express
npm i -D tsx typescript @types/express
```

**Requirements:** Node.js 18+, TypeScript 5+, Express 4.x (peer).

**Try the demo** (in this repo):

```bash
npm run build && npm run dev:docs
```

Open [http://127.0.0.1:3456/v1/docs](http://127.0.0.1:3456/v1/docs) — Chirp sample API. Use `Authorization: Bearer demo` for private routes and MCP tools.

## Complete example

```typescript
import express from 'express';
import {defineSpec, defineRoute, mountSpec} from 'callspec';
import {predicates as p} from 'runtyp';

type AuthContext = {userId: string};

async function searchRecent(
    input: {query: string; max_results?: number},
    ctx: AuthContext,
) {
    return {
        results: [{id: '1', text: `Match for "${input.query}"`, authorId: ctx.userId}],
        count: 1,
    };
}

async function getUserContext(token: string, _req: express.Request): Promise<AuthContext | undefined> {
    if (token.startsWith('demo-')) return {userId: 'user_123'};
    return undefined;
}

export const meta = {
    title: 'My API',
    version: process.env.VERSION ?? '1.0.0',
    intro: 'Search and manage posts from one typed RPC surface.',
    mcpInstructions: 'Read-only search tools require Bearer demo-* tokens in this example.',
};

export const authenticate = getUserContext;

export const routes = {
    searchRecent: defineRoute({
        input: p.object({
            query: p.string({description: 'Search query (supports from:, #hashtag, …)'}),
            max_results: p.optional(p.number({range: {min: 1, max: 100}})),
        }),
        output: p.object({
            results: p.array(p.object({id: p.string(), text: p.string(), authorId: p.string()})),
            count: p.number(),
        }),
        meta: {
            summary: 'Search recent posts',
            description: 'Returns posts matching a query.',
            tags: ['posts'],
        },
        access: 'private',
        mcp: true,
        handler: searchRecent,
    }),
};

export const api = defineSpec({
    meta,
    routes,
    authenticate,
});

const app = express();
const router = express.Router();

router.use(express.json());

mountSpec(router, api);

app.use('/v1', router);

const port = Number(process.env.PORT ?? 3000);

app.listen(port, () => {
    console.log(`RPC:         http://127.0.0.1:${port}/v1/searchRecent`);
    console.log(`Docs:        http://127.0.0.1:${port}/v1/docs`);
    console.log(`Callspec:    http://127.0.0.1:${port}/v1/callspec.json`);
    console.log(`OpenAPI:     http://127.0.0.1:${port}/v1/openapi.json`);
    console.log(`MCP:         http://127.0.0.1:${port}/v1/mcp`);
    console.log('Auth:        Authorization: Bearer demo-anything');
});
```

When docs are enabled (the default), `mountSpec` serves **`/docs`**, **`/callspec.json`**, and **`/openapi.json`** together. Pass `{docs: false}` to disable all three.

## Errors

Errors are **typed return possibilities**, not mystery exceptions. Full guide: [error-handling.md](docs/error-handling.md).

**Server** — return failures; don’t throw for domain cases:

```typescript
import {defineRoute, defineErrors, err} from 'callspec';

const userErr = defineErrors({
    USER_EXISTS: {data: p.object({email: p.string()})},
});

export const routes = {
    getUser: defineRoute({
        input: p.object({email: p.string()}),
        output: p.object({email: p.string(), name: p.string()}),
        errors: userErr,
        meta: {summary: 'Get user', description: 'Lookup by email', tags: ['users']},
        access: 'public',
        handler: async (input, _ctx) => {
            if (!user) return err.NOT_FOUND();
            if (taken) return userErr.USER_EXISTS({email: input.email});
            return user;
        },
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

`mountSpec` owns the RPC catch path and default logging. Use `expressErrorHandler()` from `callspec/express` only for routes **outside** mountSpec. Network failures (DNS, offline) still throw from `fetch` — only HTTP responses become Results.

## API reference

### `defineRoute`

```typescript
defineRoute({
    input: p.object({…}),           // required — runtyp predicate
    output: p.object({…}),          // required — use p.any() if unconstrained
    meta: {summary, description, tags},
    access?: 'public' | 'private',  // default 'private'
    mcp?: true | {name?, annotations?},
    errors?: defineErrors({…}),
    handler: (input, ctx) => …,     // arity 2 — compile-time checked against input/output
})
```

### `defineSpec`

```typescript
defineSpec({
    meta?: CallspecMeta,
    routes: RoutesMap<Ctx>,          // required — your map of defineRoute entries
    exports?: Record<string, Pred>,  // named schemas for consumer codegen (filters, domain preds)
    authenticate?: (token, req) => Ctx | undefined,
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

You do **not** need to publish or import your backend package in the frontend.

The CLI needs the **`callspec.json`** document — the same JSON `mountSpec` serves at `/callspec.json`. Pass a URL or a file path.

```bash
# from a running API
npx callspec https://api.example.com/v1/callspec.json --output src/generated/api.ts

# from a file
npx callspec ./callspec.json --output src/generated/api.ts
```

Emit without starting Express:

```typescript
import {writeFileSync} from 'fs';
import {emitCallspec, generateClientFile} from 'callspec/document';
import {api} from './routes/spec';

const document = emitCallspec(api.routes, {
    title: api.meta.title ?? 'My API',
    version: api.meta.version ?? '1.0.0',
    basePath: '/v1',
    description: api.meta.intro,
});

writeFileSync('callspec.json', JSON.stringify(document, null, 2));
await generateClientFile('./callspec.json', './src/generated/api.ts');
```

### Using the generated client

```typescript
import {ApiClient} from './generated/api';

const api = new ApiClient({
    baseUrl: 'https://api.example.com/v1',
    headers: () => ({
        Authorization: `Bearer ${getToken()}`,
    }),
});

const result = await api.searchRecent({
    query: 'timeout',
    max_results: 10,
});

if (!result.ok) {
    if (result.code === 'VALIDATION_ERROR') {
        console.error(result.data);
        return;
    }
    console.error(result.status, result.code);
    return;
}

result.value; // SearchRecentOutput — fully typed
```

The generated file:

- Imports only `callspec/client` (browser-safe — no Express)
- One typed method per route, each returning `CallspecRouteResult`
- Preserves Callspec wire behavior (including Date deserialization)
- Can be committed; CI can regenerate with `git diff --exit-code`

```bash
callspec <source> --output <file> [--class-name ApiClient]
```

## Native Callspec document & OpenAPI

`callspec.json` is Callspec's native contract (`callspec: "1.0"`). The docs UI and TypeScript client generator consume it directly — methods, access, MCP flags, exports, and the full error model.

**OpenAPI 3.1** (`/openapi.json`) is emitted from the same `routes` object (not derived from `callspec.json`). Same inputs, outputs, auth, and error bodies — ready for OpenAPI tooling, gateways, and multi-language SDK generators. RPC methods appear as `POST` paths; errors are grouped by HTTP status.

```typescript
import {emitCallspec, emitOpenApi, parseCallspecDocument, generateClientFile} from 'callspec/document';

const document = emitCallspec(api.routes, {
    title: 'My API',
    version: '1.0.0',
    basePath: '/v1',
    description: api.meta.intro,
});

const openApi = emitOpenApi(api.routes, {
    title: 'My API',
    version: '1.0.0',
    basePath: '/v1',
    description: api.meta.intro,
});

await generateClientFile('./callspec.json', './src/generated/api.ts', {
    className: 'ApiClient',
});
```

## Runtime client

Low-level `CallspecClient` if you need it; prefer the generated client for app code.

```typescript
import {CallspecClient, isCallspecOk} from 'callspec/client';

const runtime = new CallspecClient({baseUrl: 'https://api.example.com/v1'});
const result = await runtime.callResult<{results: unknown[]}>('searchRecent', {query: 'x'});

if (isCallspecOk(result)) {
    console.log(result.value);
} else {
    console.error(result.status, result.code);
}
```

Failed responses are normalized in order: exact callspec JSON → known body phrases → HTTP status → fuzzy match → client-only **`UNKNOWN_ERROR`**. See [Client error normalization](docs/error-handling.md#client-error-normalization).

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
| `callspec` | `defineRoute`, `defineSpec`, `mountSpec`, `defineErrors`, `err`, `logRequest`, `BUILTIN_ERROR`; types `Callspec`, `RoutesMap`, `MountSpecOptions`, `RouteFailure` |
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
