# Callspec

<div align="center">
  <picture>
    <source srcset="assets/callspec-lockup-light.svg?cb=2" media="(prefers-color-scheme: light)" />
    <source srcset="assets/callspec-lockup-dark.svg?cb=2" media="(prefers-color-scheme: dark)" />
    <img src="assets/callspec-lockup-dark.svg?cb=2" alt="callspec" />
  </picture>

  <h3 align="center">One spec powers API, docs UI, MCP, typed clients, and OpenAPI.</h3>

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
| **Runtime client** | `CallspecClient` from `callspec/client` |
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

## API reference

### `defineRoute`

```typescript
defineRoute({
    input: p.object({…}),           // required — runtyp predicate
    output: p.object({…}),          // required — use p.any() if unconstrained
    meta: {summary, description, tags},
    access?: 'public' | 'private',  // default 'private'
    mcp?: true | {name?, annotations?},
    errors?: errors({…}),
    handler: (input, ctx) => …,     // arity 2 — compile-time checked against input/output
})
```

### `defineSpec`

```typescript
defineSpec({
    meta?: CallspecMeta,
    routes: RoutesMap<Ctx>,          // required — your map of defineRoute entries
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

When `docs` is enabled, the docs UI fetches **`callspec.json`** from the configured path (default `/callspec.json` relative to the router).

### Input and output

Every route requires **`input`** and **`output`** preds — same runtyp style throughout. Use `p.any()` when you do not need a precise schema. Only **`errors`** is optional.

```typescript
defineRoute({
    input: p.object({query: p.string()}),
    output: p.object({
        results: p.array(p.object({id: p.string(), text: p.string()})),
        count: p.number(),
    }),
    meta: {
        summary: 'Search recent posts',
        description: 'Returns posts matching a query.',
        tags: ['posts'],
    },
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

The CLI (`npx callspec …`) and `generateClientFile` need the **`callspec.json`** document. That is the same JSON `mountSpec` serves at `/callspec.json` on a running API. Pick whichever source is easiest — the generator accepts a **URL or a file path** and does not care which path you used to obtain the document.

### Getting `callspec.json` (three options)

**Option A — Fetch from a running API (URL)**

Point the CLI at a live `/callspec.json` endpoint. You do not need a local copy of the file.

```bash
npx callspec https://api.example.com/v1/callspec.json --output src/generated/api.ts
# local dev:
npx callspec http://127.0.0.1:3000/v1/callspec.json --output src/generated/api.ts
```

Good when:

- The API is up locally, in staging, or in production
- CI can start the server (or hit a deployed env) before client generation
- You are happy to regenerate only when a server is available

If that is always true for you, this option alone is enough — you can skip Options B and C.

**Option B — Read a file on disk**

Check in or build a `callspec.json` file, then pass the path to the CLI.

```bash
npx callspec ./callspec.json --output src/generated/api.ts
```

Good when:

- You already have the document as an artifact (from CI, a script, or manual export)
- You want a committed snapshot to diff in PRs
- Frontend CI should not depend on a running backend

The file can come from anywhere — including Option C below.

**Option C — Emit from your backend route code**

Your API is defined in TypeScript as a **`routes` object**: a map of names to `defineRoute({…})` entries, wrapped in `defineSpec({ meta, routes, authenticate })`. That object is the source of truth in code (sometimes called the route registry — it is just `routes.ts`, not a second spec format).

`emitCallspec(api.routes, …)` writes the same JSON shape the server would return at `/callspec.json`, without starting Express:

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
// or: npx callspec ./callspec.json --output ./src/generated/api.ts
```

Good when:

- The API is not deployed yet (greenfield)
- CI should generate the client without booting the server
- You work offline or want a deterministic script step
- Backend and frontend are in separate repos or a monorepo — emit in the backend package, then generate/copy the client into the frontend

Options B and C both end at `./callspec.json` → CLI. Option A skips the local file and uses the URL as the CLI source directly. All three produce the same generated client.

Copy or commit `src/generated/api.ts` into the frontend; import `ApiClient` there — never `@logfoxai/api-service`.

### Using the generated client

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

`callspec.json` is Callspec's native, versioned contract (`callspec: "1.0"`). The docs UI and client generator consume it directly. OpenAPI (`/openapi.json`) is a parallel projection for Swagger, Postman, and other OpenAPI tooling — both come from the same `routes` object, not from each other.

Programmatic emission and validation:

```typescript
import {emitCallspec, emitOpenApi, parseCallspecDocument, generateClientFile} from 'callspec/document';

const document = emitCallspec(api.routes, {
    title: 'My API',
    version: '1.0.0',
    basePath: '/v1',
    description: api.meta.intro,
});

const validated = parseCallspecDocument(document);

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

`parseCallspecDocument` is for tooling that ingests external JSON (CLI, tests). Your own `emitCallspec` output is already well-formed.

## Runtime client

Every generated method returns `CallspecRouteResult<T, E>` — a discriminated union so HTTP errors are typed data, not exceptions.

```typescript
import {CallspecClient, isCallspecOk} from 'callspec/client';

const runtime = new CallspecClient({baseUrl: 'https://api.example.com/v1'});
const result = await runtime.callResult<{results: unknown[]}>('searchRecent', {query: 'x'});

if (isCallspecOk(result)) {
    console.log(result.value);
} else {
    console.error(result.status, result.error);
}
```

For application code, prefer the **generated client** — it wraps `CallspecClient.callResult` with per-route input/output/error types.

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

## Package exports

| Import | Use |
|--------|-----|
| `callspec` | `defineRoute`, `defineSpec`, `mountSpec`, `errors`, `commonErrors`; types `Callspec`, `RoutesMap`, `MountSpecOptions` |
| `callspec/client` | Runtime client (`CallspecClient`, `isCallspecOk`, `CallspecRouteResult`, …) and generated client types |
| `callspec/document` | `emitCallspec`, `emitOpenApi`, `parseCallspecDocument`, `generateClientFile` |

## Development

```bash
npm run validate   # build, lint, knip, typecheck:routes, test + coverage
npm run dev:docs   # Chirp demo API + callspec UI at :3456/v1/docs
```

**`typecheck:routes`** — compile-only checks in `src/typecheck/` (via `npm run typecheck:routes`) assert that `defineRoute` handlers match their `input`/`output` preds. Add a similar file in your service repo if you want CI to catch resolver drift.

Integration tests spin up Express in-process and verify `callspec.json`, OpenAPI, `/docs`, auth, MCP, RPC, and client generation end-to-end.

## Help build the standard

callspec is early — and we're looking for **maintainers and contributors** who want to help define how typed APIs work in the age of agents.

- **Issues & ideas:** [github.com/logfoxai/callspec/issues](https://github.com/logfoxai/callspec/issues)
- **PRs welcome** — `npm run validate` before you push; conventional commits (`feat:`, `fix:`, `docs:`, etc.)
