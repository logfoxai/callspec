<div align="center">
  <picture>
    <source srcset="assets/callspec-lockup-light.svg?cb=2" media="(prefers-color-scheme: light)" />
    <source srcset="assets/callspec-lockup-dark.svg?cb=2" media="(prefers-color-scheme: dark)" />
    <img src="assets/callspec-lockup-dark.svg?cb=2" alt="callspec" />
  </picture>

  <h3 align="center">One spec powers API, docs UI, OpenAPI, MCP, and typed clients.</h3>

  <br>

  <p>
    <a href="assets/callspec-ui-chirp-demo-home.png">
      <img src="assets/callspec-ui-chirp-demo-home.png" alt="callspec UI" width="920" />
    </a>
  </p>
</div>

Define your API once and get an HTTP RPC server, white-label docs, OpenAPI 3.1, an MCP server, and a typed client. No duplicate schemas, no bolt-on doc stack, no hand-maintained tool manifests.

Every API and MCP call gets **input validation** at the boundary with clear error messages. TypeScript clients get compile-time type checking and LSP autocomplete from the same spec &mdash; with simple, clean, human-readable types.

- **One spec** — `defineSpec({ meta, routes, authenticate })` is the single source of truth
- **HTTP RPC** — `POST` per route name, JSON request/response
- **Input validation** — runtyp predicates at the boundary; 400 with field errors
- **Auth** — Bearer extraction; public vs private routes; your `authenticate` hook
- **Docs UI** — interactive, white-label `/docs` (on by default)
- **OpenAPI 3.1** — `/openapi.json` generated from routes (on by default)
- **MCP** — opt-in per route (`mcp: true`); same handlers as HTTP
- **Typed client** — `InferSpec` + `client()` from `callspec/client`

## Complete example

```typescript
import express from 'express';
import {defineSpec, defineRoute, mountSpec, type InferSpec} from 'callspec';
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

export const api = defineSpec({meta, routes, authenticate});
export type API = InferSpec<typeof api.routes>;

const app = express();
const router = express.Router();

router.use(express.json());

mountSpec(router, api);

app.use('/v1', router);

const port = Number(process.env.PORT ?? 3000);

app.listen(port, () => {
    console.log(`RPC:      http://127.0.0.1:${port}/v1/searchRecent`);
    console.log(`Docs:     http://127.0.0.1:${port}/v1/docs`);
    console.log(`OpenAPI:  http://127.0.0.1:${port}/v1/openapi.json`);
    console.log(`MCP:      http://127.0.0.1:${port}/v1/mcp`);
    console.log('Auth:     Authorization: Bearer demo-anything');
});
```

## API reference

There is no separate markdown API doc. **The exports are the reference** — after `npm i callspec`, use your editor on `callspec` and `callspec/client` (published `dist/*.d.ts`), or browse the types in this repo under `src/`.

### `defineRoute`

```typescript
defineRoute({
    input: p.object({…}),           // required — runtyp predicate
    output?: p.object({…}),         // optional output validation
    meta: {summary, description, tags},
    access?: 'public' | 'private',  // default 'private'
    mcp?: true | {name?, annotations?},
    handler: (input, ctx) => …,     // arity 2
})
```

### `defineSpec`

```typescript
defineSpec({
    meta?: CallspecMeta,
    routes: Record<string, RouteDef>,  // required
    authenticate?: (token, req) => Ctx | undefined,
})
```

Throws at build time if any route is `private` and `authenticate` is missing.

**`CallspecMeta`:** `title?`, `version?`, `intro?`, `website?`, `logo?`, `authHint?`, `mcpInstructions?`. Omitted `title` / `version` default to `Callspec API` / `0.0.0` at emit time.

### `mountSpec`

```typescript
mountSpec(router, spec, {
    basePath?: string,              // prefix for all surfaces below
    ui?: boolean | string,          // default true → '/docs'
    openApi?: boolean | string,     // default true → '/openapi.json'
    mcpPath?: string,               // default '/mcp'
})
```

**Default paths** (on the router you pass in; add your app prefix such as `/v1` via `basePath` or `app.use`):

| Surface | Method | Default path |
|---------|--------|----------------|
| RPC | `POST` | `{basePath}/{routeName}` |
| Docs UI | `GET` | `{basePath}/docs` |
| OpenAPI | `GET` | `{basePath}/openapi.json` |
| MCP | `POST` | `{basePath}/mcp` (only if any route has `mcp: true`) |

Surfaces are **on by default**. Disable docs/OpenAPI with `{ui: false, openApi: false}`.

### Client

```typescript
import {client} from 'callspec/client';
import type {InferSpec} from 'callspec';

type API = InferSpec<typeof api.routes>;
await client<API['searchRecent']>('searchRecent', input, {endpoint: '…/v1'});
```

Also exported: `executeRoute`, `emitOpenApi`, `mountCallspecUi`, `serializeResponse` / `deserializeResponse`, and errors (`CallspecValidationError`, `CallspecUnauthorizedError`, `CallspecNotFoundError`).

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

Agents call the **same handlers** as HTTP RPC — same auth gate, same **input validation**. Public tools work without a token; private tools return 401 without one. Configure MCP copy on `meta.mcpInstructions`.

## callspec UI

Minimal, fast docs UI baked into the package. Browse routes, try RPCs, read OpenAPI, and **connect MCP clients** from the home page. Whitelabel via **`meta`** (see **`defineSpec`** above).

```typescript
export const meta = {
    title: 'Chirp API v2',
    version: process.env.VERSION,
    intro: 'Read and write posts, timelines, lists, and direct messages.',
    website: {url: 'https://chirp.social', label: 'chirp.social'},
    logo: {light: './brand/mark.png', dark: './brand/mark-dark.png'},
    authHint: 'Use Authorization: Bearer demo for private tools in this demo.',
    mcpInstructions: 'Chirp-shaped demo API powered by callspec.',
};

export const authenticate = getUserContext;
```

When `logo` is omitted, the UI shows a letter placeholder from `title`. Run `npm run dev:docs` for the **Chirp** sample.

## Auth

- **`access: 'public'`** — no credentials required
- **`access: 'private'`** (default) — 401 without valid Bearer token
- **`authenticate(token, req)`** on the spec — your hook; callspec extracts Bearer and calls it

Private gate runs **before** validation so unauthenticated callers never see field-level errors.

OpenAPI Bearer security is **auto-derived** from route `access` — do not pass `security` manually.

## runtyp + OpenAPI

Field `{ description }` on runtyp preds flows to JSON Schema → OpenAPI → callspec UI → MCP `inputSchema`. Route-level `meta` (summary, tags) is callspec-only.

Powered by [runtyp](https://github.com/logfoxai/runtyp) for validation and schema generation.

## Client

Fetch-only — works in the browser and in Node 18+ (global `fetch`). The `callspec/client` entry has no `http`, `https`, or Express imports, so it is safe in frontend bundles.

**Browser or frontend bundler** — import the client subpath so you do not pull server code:

```typescript
import type {API} from './my-api';
import {client} from 'callspec/client';

const results = await client<API['searchRecent']>('searchRecent', {
    query: 'callspec',
    max_results: 10,
}, {
    endpoint: 'https://api.example.com/v1',
    fetchOptions: {headers: {Authorization: `Bearer ${token}`}},
});
```

**Service package** — export the API type from your spec entry:

```typescript
import {defineSpec, type InferSpec} from 'callspec';
import {meta} from './meta';
import {routes} from './routes';
import {authenticate} from './authenticate';

export const api = defineSpec({meta, routes, authenticate});
export type API = InferSpec<typeof api.routes>;
```

Responses deserialize ISO date strings back to `Date` on read (`deserializeResponse`).

## Development

```bash
npm run validate   # build server + callspec UI, lint, test (incl. integration)
npm run dev:docs   # Chirp demo API + callspec UI at :3456/v1/docs
```

Integration tests spin up Express in-process and verify OpenAPI, `/docs`, auth, MCP, and RPC end-to-end.

## Help build the standard

callspec is early — and we're looking for **maintainers and contributors** who want to help define how typed APIs work in the age of agents.

The goal is simple: **one spec → HTTP RPC, docs, OpenAPI, and MCP** — no duplicate schemas, no bolt-on tool manifests, no duct-tape between surfaces.

If you join now, you're not polishing someone else's finished spec. You're shaping the defaults: callspec UI UX, MCP ergonomics, client DX, framework adapters, examples, and the docs people copy from.

**Good first contributions:** callspec UI polish, MCP client configs, docs and demos, runtyp/OpenAPI edge cases, Fastify/Hono mounts, issue triage, or a blog post about your integration.

- **Issues & ideas:** [github.com/logfoxai/callspec/issues](https://github.com/logfoxai/callspec/issues)
- **PRs welcome** — `npm run validate` before you push; conventional commits (`feat:`, `fix:`, `docs:`, `style:`, etc.)

If you want maintainer access or a dedicated area to own (callspec UI, MCP, clients, docs), open an issue or PR and say hi.
