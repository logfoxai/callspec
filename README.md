<div align="center">
  <picture>
    <source srcset="assets/callspec-lockup-dark.svg?cb=3" media="(prefers-color-scheme: dark)" />
    <source srcset="assets/callspec-lockup-light.svg?cb=3" media="(prefers-color-scheme: light)" />
    <img src="assets/callspec-lockup-light.svg?cb=3" alt="callspec" />
  </picture>

  <h3 align="center">Simple TypeScript powers your API, SDK, MCP, docs, and OpenAPI spec.</h3>

  <br>

  <p>
    <a href="assets/callspec-ui-chirp-demo-home.png">
      <img src="assets/callspec-ui-chirp-demo-home.png" alt="callspec UI" width="920" />
    </a>
  </p>
</div>

Define your API once with simple TypeScript — methods like `searchRecent` with typed inputs, outputs, and errors — and Callspec gives you the whole stack from that one place: the server, a tightly integrated **TypeScript SDK**, shared types (and optional form validators), docs, MCP tools, and **OpenAPI 3.1**.

On the frontend you call `api.searchRecent({…})` and get a **Result** back — success value or a typed error `code` you can switch on. Same methods, same types, same errors as the server and as agents on MCP. No drift, no hand-rolled client, no guessing which status codes mean what.

## Features

- ⚡ **RPC methods** — define `searchRecent`, not resource CRUD; Callspec mounts the server for you
- 🧩 **TypeScript SDK** — first-class client with shared types; feels like part of your app, not a bolted-on generator
- 🎯 **Result-typed errors** — end-to-end error codes from handler → SDK → OpenAPI → MCP
- 📄 **OpenAPI 3.1** — for tooling, gateways, and multi-language generators when you need them
- 🤖 **MCP** — same methods as your SDK, same auth and validation
- 📘 **Docs UI** — white-label explorer to try methods and connect MCP clients
- ✅ **Shared validators** — optional `exports` + `--validators` for forms that reuse server preds
- 🔐 **Auth** — `public` / `private` with Bearer; reflected in OpenAPI automatically

Docs, OpenAPI, and MCP paths are configurable defaults on `mountSpec`.

## Getting started

```bash
npm i callspec runtyp express
npm i -D tsx typescript @types/express
```

**Requirements:** Node.js 18+, TypeScript 5+, Express 4.x (peer).

Reach out to **skyyskater** on Discord for direct support.

**Try the demo** (in this repo):

```bash
npm run build && npm run dev:docs
```

Open [http://127.0.0.1:3456/v1/docs](http://127.0.0.1:3456/v1/docs) — Chirp sample API. Use `Authorization: Bearer demo` for private routes and MCP tools.

## Minimal example

```typescript
import express from 'express';
import {defineSpec, defineRoute, mountSpec} from 'callspec';
import {predicates as p} from 'runtyp';

const api = defineSpec({
    meta: {title: 'My API', version: '1.0.0'},
    routes: {
        ping: defineRoute({
            input: p.object({}),
            output: p.object({ok: p.boolean()}),
            meta: {summary: 'Ping', description: 'Health check', tags: ['system']},
            access: 'public',
            handler: async () => ({ok: true}),
        }),
    },
});

const app = express();
const router = express.Router();
router.use(express.json());

mountSpec(router, api, {
    basePath: '/v1', // recorded in OpenAPI / callspec.json (match app.use below)
    mcpPath: '/mcp', // default; only mounted if a route sets mcp: true
    docs: {
        uiPath: '/docs',                 // default
        callspecPath: '/callspec.json',  // default
        openApiPath: '/openapi.json',    // default
    },
    // docs: false,  // disable docs UI + callspec.json + OpenAPI together
});

app.use('/v1', router);
app.listen(3000);
```

Omit `docs` (or pass `true`) for the same defaults. Pass `docs: false` for RPC-only (no UI / specs). Set any of `uiPath`, `callspecPath`, `openApiPath`, or `mcpPath` independently.

Fuller example with auth and MCP: [docs/complete-example.md](docs/complete-example.md).

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

`mountSpec` owns the RPC catch path and default logging. Use `expressErrorHandler()` from `callspec/express` only for routes **outside** mountSpec. Transport failures (DNS, offline, aborted `fetch`) become client-only **`NETWORK_ERROR`** (`status: 0`) — still a Result, not a thrown exception.

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
