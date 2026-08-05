<div align="center">
  <picture>
    <source srcset="assets/callspec-lockup-dark.svg?cb=3" media="(prefers-color-scheme: dark)" />
    <source srcset="assets/callspec-lockup-light.svg?cb=3" media="(prefers-color-scheme: light)" />
    <img src="assets/callspec-lockup-light.svg?cb=3" alt="callspec" />
  </picture>

  <h3 align="center">TypeScript RPC — not REST. One registry for methods, errors, MCP, docs, and OpenAPI.</h3>

  <br>

  <p>
    <a href="assets/callspec-ui-chirp-demo-home.png">
      <img src="assets/callspec-ui-chirp-demo-home.png" alt="callspec UI" width="920" />
    </a>
  </p>
</div>

**Callspec** is a full **RPC** stack for TypeScript — not a REST framework with types bolted on.

You define **methods** (`searchRecent`, `createTweet`), not resources and verbs. Each call is `POST /v1/<methodName>` with a typed input, typed output, and a **typed error contract**. Handlers `return err.NOT_FOUND()` (or a domain code); clients get a **Result** — `{ ok: true, value } | { ok: false, code, status, data? }` — so HTTP failures are data you switch on, not exceptions you try/catch.

From that same registry: Express server, MCP tools on the **same handlers**, white-label docs, native **`callspec.json`**, and a real **OpenAPI 3.1** export for the rest of the ecosystem.

Define once with [runtyp](https://github.com/logfoxai/runtyp). The error model is part of the product — not an afterthought.

## Who it’s for

Full-stack **TypeScript** teams who want RPC end-to-end:

- **Methods, not REST resources** — `POST /v1/<method>` with input/output/error schemas
- **Result-typed errors** — error **codes** are the contract; status is transport (HTTP/OpenAPI)
- **MCP on the same handlers** — agents execute your API with the same auth and validation
- A portable contract so the browser never imports the server package
- An **OpenAPI 3.1** document from the live registry — for gateways, external docs, and OpenAPI-based generators
- Shared runtyp validators for React forms (via `exports`)

First-class surface is TypeScript RPC. Multi-language clients come from the OpenAPI export, not from Callspec itself.

## What you get

| Piece | What it is |
|-------|------------|
| **RPC API** | `POST /v1/<methodName>` — methods, not REST CRUD |
| **Error contract** | Builtin + domain codes; Result unions on the client — no try/catch for HTTP errors |
| **MCP tools** | Same handlers as HTTP |
| **Docs UI** | `/docs` — explorer colocated with the API |
| **Native contract** | `/callspec.json` — lossless IR (methods, errors, MCP, exports) |
| **OpenAPI 3.1** | `/openapi.json` — first-class export for OpenAPI tooling |
| **TS RPC client** | Generated methods returning `CallspecRouteResult` |
| **Shared validators** | `exports` → runtyp preds for forms |
| **Server validation** | runtyp at the boundary |

`callspec.json` carries the full RPC contract (including error codes). OpenAPI is a parallel projection for tools that speak REST/OpenAPI — useful, but not a substitute for the native Result/error model.

## Getting help

Callspec is early. Stuck or trying it out? Discord **skyyskater** — I maintain the project and answer there directly.

## Quick start

```bash
npm i callspec runtyp express
npm i -D tsx typescript @types/express
```

**Requirements:** Node.js 18+, TypeScript 5+, Express 4.x (peer).

**Try the demo** (this repo):

```bash
npm run build && npm run dev:docs
```

Open [http://127.0.0.1:3456/v1/docs](http://127.0.0.1:3456/v1/docs). Use `Authorization: Bearer demo` for private routes and MCP.

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
    console.log(`RPC:      http://127.0.0.1:${port}/v1/searchRecent`);
    console.log(`Docs:     http://127.0.0.1:${port}/v1/docs`);
    console.log(`Callspec: http://127.0.0.1:${port}/v1/callspec.json`);
    console.log(`OpenAPI:  http://127.0.0.1:${port}/v1/openapi.json`);
    console.log(`MCP:      http://127.0.0.1:${port}/v1/mcp`);
});
```

By default `mountSpec` serves `/docs`, `/callspec.json`, and `/openapi.json`. Pass `{docs: false}` to disable all three (API + MCP only).

## Core ideas

### RPC, not REST

Routes are **named methods** with `input`, `output`, and `errors` — not `GET /users/:id` style resources. Transport happens to be HTTP (`POST` + JSON) so browsers, agents, and OpenAPI tooling can talk to it. The programming model is RPC: call a method, get a Result.

### Error handling is the contract

Failures are **typed return possibilities**, not mystery status codes:

```typescript
// server — return errors, don't throw for domain failures
if (!user) return err.NOT_FOUND();
if (taken) return userErr.USER_EXISTS({email: input.email});
return user;

// client — switch on code; no try/catch for HTTP errors
const result = await api.getUser({email});
if (!result.ok) {
    switch (result.code) {
        case 'NOT_FOUND': …
        case 'USER_EXISTS': … // data narrowed
        case 'VALIDATION_ERROR': …
    }
    return;
}
result.value; // success
```

Wire body is always `{ "error": "CODE", "data?": … }`. The **`error` code** is what clients and agents branch on; HTTP status exists for OpenAPI/proxies. Builtins (`NOT_FOUND`, `VALIDATION_ERROR`, …) are on every route; domain codes are declared per method. Full guide: [error-handling.md](docs/error-handling.md).

### One registry

`defineRoute` / `defineSpec` is the source of truth. HTTP, MCP, docs, `callspec.json`, and OpenAPI all project from it.

### MCP that executes your API

`mcp: true` mounts tools at `/mcp`. Agents call the **same handlers** — same auth, validation, and error codes. Live execution, not docs search.

### OpenAPI from the live API

`GET /openapi.json` is OpenAPI **3.1.0** from the same registry — so you still get a standard spec for gateways and OpenAPI generators:

- Each RPC method → `POST {basePath}/{methodName}`
- Schemas from runtyp; errors as status-keyed `{ error, data? }` bodies
- Bearer security from `access: 'private'`

OpenAPI is a REST-shaped **view** of your RPC. The native Result/`code` client experience lives in `callspec.json` + the generated TS client.

### Shared validation (no server import)

Don’t import the API package for types. Emit `callspec.json`, generate types and optional runtyp validators. Forms and RPC share preds — [exports plan](docs/exports-and-codegen.plan.md).

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
    handler: (input, ctx) => …,     // arity 2 — checked against input/output
})
```

### `defineSpec`

```typescript
defineSpec({
    meta?: CallspecMeta,
    routes: RoutesMap<Ctx>,          // required
    exports?: Record<string, Pred>,  // named schemas for consumer codegen
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
| `basePath` | `''` | Prefix for RPC paths and emitted documents |
| `docs` | `true` | `false` disables `/docs`, `/callspec.json`, `/openapi.json`; or `{ uiPath?, callspecPath?, openApiPath? }` |
| `mcpPath` | `'/mcp'` | MCP HTTP endpoint |
| `logging` | `true` | Request + unhandled-error logging; `false` in tests |
| `handleUnhandledError` | — | `(err, req) => RouteFailure \| undefined` before `INTERNAL_ERROR` |
| `logUnhandledError` | jsout `logger.error` | Override unhandled-error logging only |

`mountSpec` owns the RPC catch path — no separate error middleware for that router. See [mountSpec runtime](docs/error-handling.md#mountspec-runtime).

### Auth

- **`access: 'public'`** — no credentials
- **`access: 'private'`** (default) — 401 without a valid Bearer token
- **`authenticate(token, req)`** — your hook; Callspec extracts Bearer and calls it

OpenAPI Bearer security is derived from route `access`.

### Route errors

Builtin codes (every route — do not redeclare):

| Code | When |
|------|------|
| `VALIDATION_ERROR` | Input failed runtyp |
| `UNAUTHORIZED` | Private route, bad/missing token |
| `ROUTE_NOT_FOUND` | Unknown method name |
| `NOT_FOUND` | Handler: resource missing |
| `FORBIDDEN` | Not allowed |
| `CONFLICT` | State conflict |
| `TOO_MANY_REQUESTS` | Rate limit |
| `SERVICE_UNAVAILABLE` | Dependency down |
| `INTERNAL_ERROR` | Unhandled throw — logged and returned by `mountSpec` |

Domain errors — declare only route-specific codes; builtins like `err.NOT_FOUND()` are always available:

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

Use `expressErrorHandler()` from `callspec/express` only for routes **outside** `mountSpec`.

## TypeScript RPC client

Generated methods are RPC calls returning Results — not a thin REST wrapper. You do **not** publish or import the backend package in the frontend.

Generate from `callspec.json` (URL or file):

```bash
# from a running API
npx callspec https://api.example.com/v1/callspec.json --output src/generated/api.ts

# from a file (CI snapshot / emitCallspec)
npx callspec ./callspec.json --output src/generated/api.ts

# validators for forms + routes
npx callspec ./callspec.json --output src/generated/validators.ts --validators
```

Emit without booting Express:

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

### Using the client

```typescript
import {ApiClient} from './generated/api';

const api = new ApiClient({
    baseUrl: 'https://api.example.com/v1',
    headers: () => ({Authorization: `Bearer ${getToken()}`}),
});

const result = await api.searchRecent({query: 'timeout', max_results: 10});

if (!result.ok) {
    if (result.code === 'VALIDATION_ERROR') {
        console.error(result.data);
        return;
    }
    console.error(result.status, result.code);
    return;
}

result.value; // SearchRecentOutput
```

Network failures (DNS, offline) still throw from `fetch`. HTTP responses become Results.

The generated file imports only `callspec/client` (browser-safe — no Express). Prefer it over the low-level `CallspecClient` runtime. Client normalization order and `UNKNOWN_ERROR`: [error-handling.md](docs/error-handling.md#client-error-normalization).

```bash
callspec <source> --output <file> [--class-name ApiClient] [--validators]
```

## Shared validation (backend + frontend)

| What | Where | Who uses it |
|------|-------|-------------|
| RPC methods | `defineSpec({ routes })` | Handlers + generated `ApiClient` |
| Request/response shapes | Route `input` / `output` | Boundary + generated types |
| Shared UI slices | `defineSpec({ exports })` | Filters, modals — same pred as server |
| UI-only fields | Consumer app | Never in the spec |

Composition inside a route input does **not** auto-export a slice — register preds under **`exports`**. Field `{ description }` on runtyp preds flows to JSON Schema in both `callspec.json` and OpenAPI.

## Docs UI

Minimal explorer colocated with your API: browse routes, try RPCs, read schemas, connect MCP clients. Whitelabel via `meta` (`title`, `intro`, `website`, `logo`, `authHint`, `mcpInstructions`). Turn off with `{docs: false}` when the API should stay private and agents use `/mcp` only.

## Package exports

| Import | Use |
|--------|-----|
| `callspec` | `defineRoute`, `defineSpec`, `mountSpec`, `defineErrors`, `err`, `logRequest`, `BUILTIN_ERROR`; types |
| `callspec/express` | `expressErrorHandler` |
| `callspec/client` | `CallspecClient`, `isCallspecOk`, Result types, error helpers |
| `callspec/document` | `emitCallspec`, `emitOpenApi`, `parseCallspecDocument`, `generateClientFile`, `generateValidatorsFile` |

## Development

```bash
npm run validate   # build, lint, knip, typecheck:routes, test + coverage
npm run dev:docs   # Chirp demo at :3456/v1/docs
```

`typecheck:routes` asserts handlers match `input`/`output` preds. Integration tests cover `callspec.json`, OpenAPI, `/docs`, auth, MCP, RPC, and client generation.

## Help build it

Callspec is early. Looking for maintainers and contributors who care about TypeScript-first RPC with agents in the loop.

- **Issues:** [github.com/logfoxai/callspec/issues](https://github.com/logfoxai/callspec/issues)
- **PRs welcome** — `npm run validate` before you push; conventional commits (`feat:`, `fix:`, `docs:`, …)
