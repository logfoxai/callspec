# Callspec

<div align="center">
  <picture>
    <source srcset="assets/callspec-lockup-light.svg?cb=2" media="(prefers-color-scheme: light)" />
    <source srcset="assets/callspec-lockup-dark.svg?cb=2" media="(prefers-color-scheme: dark)" />
    <img src="assets/callspec-lockup-dark.svg?cb=2" alt="callspec" />
  </picture>

  <h3 align="center">One spec powers API, docs UI, native Callspec contract, OpenAPI, MCP, and generated clients.</h3>

  <br>

  <p>
    <a href="assets/callspec-ui-chirp-demo-home.png">
      <img src="assets/callspec-ui-chirp-demo-home.png" alt="callspec UI" width="920" />
    </a>
  </p>
</div>

Define your API once and get an HTTP RPC server, white-label docs, the native **`callspec.json`** contract, OpenAPI 3.1, an MCP server, and a generated TypeScript client. No duplicate schemas, no backend package imports in the frontend, no bolt-on doc stack.

Every API and MCP call gets **input validation** at the boundary with clear error messages.

| Feature | Location |
|---------|----------|
| **HTTP RPC API** | `POST /v1/<methodName>` |
| **Interactive UI docs** | `/docs` |
| **Native Callspec document** | `/callspec.json` |
| **OpenAPI 3.1** | `/openapi.json` |
| **MCP tools** | `/mcp` |
| **Generated client** | `npx callspec … --output …` |
| **Low-level fetch client** | `client()` from `callspec/client` |
| **Input validation** | Runtime (runtyp) + compile-time (generated types) |

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

### Input and output

Every route requires **`input`** and **`output`** preds — same runtyp style throughout. Use `p.any()` when you do not need a precise schema. Only **`errors`** is optional.

```typescript
defineRoute({
    input: p.object({query: p.string()}),
    output: p.object({
        results: p.array(p.object({id: p.string(), text: p.string()})),
        count: p.number(),
    }),
    handler: searchRecent,
});
```

`defineRoute` type-checks handlers against the spec: the `input` pred fixes `I`, the `output` pred fixes `O`, and the handler must implement `(input: I, ctx: Ctx) => O`. A mismatched resolver is a compile error on the `handler` property.

### Route errors

**Framework errors** (automatic on every route — do not declare):

| Code | Status | When |
|------|--------|------|
| `VALIDATION_ERROR` | 400 | Input failed runtyp validation |
| `UNAUTHORIZED` | 401 | Private route without valid Bearer token |
| `ROUTE_NOT_FOUND` | 404 | Unknown RPC method name |
| `INTERNAL_ERROR` | 500 | Unhandled exception in handler |

**Domain errors** — declare per route with `errors()` and throw from the handler:

```json
{ "error": "NOT_FOUND" }
{ "error": "USER_EXISTS", "data": { "email": "taken@example.com" } }
```

Optional **`commonErrors`** preset for typical domain codes (`NOT_FOUND`, `FORBIDDEN`, `CONFLICT`):

```typescript
import {defineRoute, errors, commonErrors} from 'callspec';

const err = errors({
    ...commonErrors,
    USER_EXISTS: {status: 409, data: p.object({email: p.string()})},
});

export const routes = {
    getUser: defineRoute({
        input: p.object({email: p.string()}),
        output: p.object({email: p.string(), name: p.string()}),
        errors: err,
        meta: {summary: 'Get user', description: 'Lookup by email', tags: ['users']},
        access: 'public',
        handler: async (input, _ctx) => {
            if (!user) throw err.NOT_FOUND();
            if (taken) throw err.USER_EXISTS({email: input.email});
            return user;
        },
    }),
};
```

Generated clients export per-route `GetUserError` unions and `GetUserResult`. Framework errors (`UNAUTHORIZED`, `VALIDATION_ERROR`, etc.) are included in every `*Result` type automatically — **no try/catch for HTTP errors**.

## Frontend client generation

You do **not** need to publish or import your backend package in the frontend.

Generate a typed client from the native document:

```bash
npx callspec https://api.example.com/v1/callspec.json --output src/generated/api.ts
```

Local file (monorepos, offline CI):

```bash
npx callspec ./callspec.json --output src/generated/api.ts
```

Use the generated client — every method returns a **Result**, not a thrown error:

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
    if (result.error.error === 'VALIDATION_ERROR') {
        console.error(result.error.errors);
        return;
    }
    // other declared route errors or unexpected HTTP bodies
    console.error(result.status, result.error);
    return;
}

result.value; // SearchRecentOutput — fully typed
```

For routes with declared errors:

```typescript
const result = await api.getUser({email: 'missing@example.com'});

if (!result.ok && result.error.error === 'NOT_FOUND') {
    // result.error is narrowed to { error: "NOT_FOUND" }
}
```

Network failures (DNS, offline) still throw from `fetch` — only HTTP responses become Results.

The generated file:

- Imports only `callspec/client` (browser-safe — no Express, runtyp, or server code)
- Exposes one typed method per route returning `CallspecRouteResult`
- Preserves Callspec wire behavior (including Date deserialization)
- Can be committed; CI can regenerate with `git diff --exit-code`

### CLI

```bash
callspec <source> --output <file> [--class-name ApiClient]
```

`<source>` is a path to `callspec.json` or an HTTP(S) URL. Run `callspec --help` for details.

## Native Callspec document

`callspec.json` is Callspec's native, versioned contract. The docs UI and client generator consume it directly.

Programmatic emission from your route registry:

```typescript
import {emitCallspec, parseCallspecDocument} from 'callspec';

const document = emitCallspec(api.routes, {
    title: 'My API',
    version: '1.0.0',
    basePath: '/v1',
    description: api.meta.intro,
});

const validated = parseCallspecDocument(document);
```

OpenAPI remains available for Swagger, Postman, and other OpenAPI tooling — both formats are projections of the same registry, not conversions of each other.

## Low-level client (legacy / advanced)

The fetch-only `client()` helper and `CallspecClient.call()` still throw on HTTP errors for scripts and backward compatibility. Prefer the **generated client** (Result-based) for application code.

```typescript
import {client, CallspecClient, CallspecHttpError, isCallspecOk} from 'callspec/client';

// Result API (no catch for HTTP error responses):
const runtime = new CallspecClient({baseUrl: 'https://api.example.com/v1'});
const result = await runtime.callResult<{results: unknown[]}>('searchRecent', {query: 'x'});
if (isCallspecOk(result)) {
    console.log(result.value);
}

// Throwing API (legacy):
try {
    await client('searchRecent', {query: 'callspec'}, {endpoint: 'https://api.example.com/v1'});
} catch (err) {
    if (err instanceof CallspecHttpError) {
        console.error(err.status, err.body);
    }
}
```

For new frontend work, prefer the **generated client**.

### Monorepo type sharing (legacy)

You may still export `InferSpec<typeof api.routes>` from a shared backend entry for in-repo convenience, but it is no longer the primary documented workflow and requires importing the backend spec module.

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

## Built-in MCP server

Set `mcp: true` on any `defineRoute`. When any route opts in, `mountSpec` mounts MCP at `/mcp` automatically.

Agents call the **same handlers** as HTTP RPC — same auth gate, same **input validation**.

## callspec UI

Minimal, fast docs UI baked into the package. Browse routes, try RPCs, read schemas, and **connect MCP clients** from the home page.

Whitelabel via flat **`meta`** fields (`title`, `intro`, `website`, `logo`, `authHint`, `mcpInstructions`).

## Auth

- **`access: 'public'`** — no credentials required
- **`access: 'private'`** (default) — 401 without valid Bearer token
- **`authenticate(token, req)`** on the spec — your hook; callspec extracts Bearer and calls it

OpenAPI Bearer security is **auto-derived** from route `access`.

## runtyp + schemas

Field `{ description }` on runtyp preds flows to JSON Schema in both `callspec.json` and OpenAPI. Route-level `meta` (summary, tags) is callspec-only.

Powered by [runtyp](https://github.com/logfoxai/runtyp) for validation and schema generation.

## Development

```bash
npm run validate   # build server + callspec UI, lint, test (incl. integration)
npm run dev:docs   # Chirp demo API + callspec UI at :3456/v1/docs
```

Design notes: [docs/mount-spec-api.md](docs/mount-spec-api.md).

Integration tests spin up Express in-process and verify `callspec.json`, OpenAPI, `/docs`, auth, MCP, RPC, and client generation end-to-end.

## Help build the standard

callspec is early — and we're looking for **maintainers and contributors** who want to help define how typed APIs work in the age of agents.

- **Issues & ideas:** [github.com/logfoxai/callspec/issues](https://github.com/logfoxai/callspec/issues)
- **PRs welcome** — `npm run validate` before you push; conventional commits (`feat:`, `fix:`, `docs:`, etc.)
