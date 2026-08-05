<div align="center">
  <picture>
    <source srcset="assets/callspec-lockup-dark.svg?cb=3" media="(prefers-color-scheme: dark)" />
    <source srcset="assets/callspec-lockup-light.svg?cb=3" media="(prefers-color-scheme: light)" />
    <img src="assets/callspec-lockup-light.svg?cb=3" alt="callspec" />
  </picture>

  <h3 align="center">One TypeScript registry. HTTP, MCP, docs, OpenAPI, and a typed client.</h3>

  <br>

  <p>
    <a href="assets/callspec-ui-chirp-demo-home.png">
      <img src="assets/callspec-ui-chirp-demo-home.png" alt="callspec UI" width="920" />
    </a>
  </p>
</div>

**Callspec** turns a `defineRoute` registry into a running Express RPC API — with the same handlers exposed as MCP tools, a white-label docs UI, a native **`callspec.json`** contract, a real **OpenAPI 3.1** spec, and a generated TypeScript client with Result-typed errors.

Define once with [runtyp](https://github.com/logfoxai/runtyp). Ship the server, the agents surface, the docs, the OpenAPI document, and the frontend types from that one place.

## Who it’s for

Full-stack **TypeScript** teams who want:

- An Express RPC API (`POST /v1/<method>`) with boundary validation
- **MCP tools that call the same handlers** as HTTP (same auth, same validation)
- A portable contract so the browser never imports the server package
- An **OpenAPI 3.1** document from the live registry — for gateways, external docs, and any OpenAPI-based SDK generator
- Shared runtyp validators for React forms (via `exports`)

Callspec’s first-class client is TypeScript. Multi-language SDKs are not generated here — that’s what the OpenAPI export is for.

## What you get

| Surface | Where |
|---------|-------|
| HTTP RPC | `POST /v1/<methodName>` |
| MCP tools (same handlers) | `/mcp` |
| Docs UI | `/docs` |
| Native contract | `/callspec.json` |
| **OpenAPI 3.1** | `/openapi.json` |
| Generated TS client | `npx callspec … --output …` |
| Shared validators | `npx callspec … --validators` |
| Server validation | runtyp at the route boundary |
| Errors | Result unions — `{ ok, value } \| { ok: false, code, … }` |

`callspec.json` is the lossless IR for the docs UI and TypeScript client. OpenAPI is a first-class parallel projection from the same `routes` object — not a hand-maintained second spec.

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

### One registry

`defineRoute` / `defineSpec` in TypeScript is the source of truth. HTTP, MCP, docs, `callspec.json`, and OpenAPI all project from it — they are not kept in sync by hand.

### OpenAPI from the live API

`GET /openapi.json` is OpenAPI **3.1.0**, generated from your routes:

- Each method → `POST {basePath}/{methodName}` with `operationId` = method name
- `input` / `output` → JSON Schema via runtyp
- Errors → status-keyed responses (`{ error: "CODE", data? }`)
- Private routes → Bearer security (auto-derived from `access`)

Hand that document to any OpenAPI toolchain. Keep `callspec.json` for Callspec’s TypeScript client and UI (MCP flags, exports, and the Result-oriented error model stay richest there).

### MCP that executes your API

`mcp: true` on a route mounts tools at `/mcp`. Agents hit the **same handlers** as HTTP — same auth, same validation, same errors. This is a live tool surface, not a docs Q&A layer.

### Result-typed errors

HTTP failures are data, not exceptions:

```typescript
const result = await api.searchRecent({query: 'timeout'});

if (!result.ok) {
    // result.code — VALIDATION_ERROR | NOT_FOUND | …
    return;
}

result.value; // typed success
```

Wire format is always `{ "error": "CODE", "data?": … }`. The **code** is the contract; HTTP status is transport. Details: [error-handling.md](docs/error-handling.md).

### Shared validation (no server import)

Frontend teams should not depend on the API package just for types. Emit `callspec.json`, generate types (and optional runtyp validators). Forms and RPC share the same preds — see [exports plan](docs/exports-and-codegen.plan.md).

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

## TypeScript client

You do **not** publish or import the backend package in the frontend.

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
