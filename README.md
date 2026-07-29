<div align="center">
  <picture>
    <source srcset="assets/callspec-lockup-light.svg" media="(prefers-color-scheme: light)" />
    <source srcset="assets/callspec-lockup-dark.svg" media="(prefers-color-scheme: dark)" />
    <img src="assets/callspec-lockup-dark.svg" alt="callspec" />
  </picture>

  <p><strong>One registry. HTTP RPC, interactive docs, OpenAPI, MCP, and a typed client.</strong></p>
</div>

One `defineRegistry` powers HTTP RPC, OpenAPI, callspec UI docs, MCP tools, and a typed client. Add a route once; it shows up everywhere.

<p align="center">
  <a href="assets/callspec-ui-chirp-demo-home.png">
    <img src="assets/callspec-ui-chirp-demo-home.png" alt="callspec UI home — Chirp demo API with Connect MCP panel showing Cursor config" width="920" />
  </a>
</p>

<p align="center"><sub><strong>callspec UI</strong> — built-in, <strong>white-label</strong> docs UI with a <strong>Connect MCP</strong> panel. Copy the endpoint and a ready-made config for Cursor, Claude, VS Code, Windsurf, or Pi.</sub></p>

```typescript
import {defineRegistry, defineRoute, mountRegistry} from 'callspec';
import {predicates as p} from 'runtyp';

export const api = defineRegistry({
    getUserById: defineRoute({
        input: p.object({
            id: p.string({description: 'Unique identifier of the User (numeric string)'}),
        }),
        meta: {
            summary: 'Get User by ID',
            description: 'Returns information about a User specified by ID.',
            tags: ['users'],
        },
        access: 'private',
        mcp: true,
        handler: getUserById,
    }),
});

mountRegistry(app, api, {
    contextResolver: getChirpContext,
    docs: {
        openApi: {title: 'Chirp API v2', version: '2.0.0'},
        exposeUi: true,
        exposeOpenApi: true,
        ui: {
            branding: {
                name: 'Chirp',
                intro: 'The Chirp API v2 lets you read and write posts, timelines, lists, and direct messages.',
                websiteUrl: 'https://chirp.social',
                logoUrl: './brand/mark.png',
            },
        },
    },
    mcp: {
        instructions: 'Chirp API v2 — use Bearer auth for private tools.',
    },
});
```

Try the demo locally: `npm run build && npm run dev:docs` → [http://127.0.0.1:3456/v1/docs](http://127.0.0.1:3456/v1/docs) (Chirp API sample; use `Bearer demo` for private tools).

## 🔌 Built-in MCP server

No separate MCP process. No hand-maintained tool manifest. No stdio bridge.

1. **Opt in per route** — `mcp: true` on any `defineRoute`. Input/output schemas come from the same runtyp preds as HTTP.
2. **Built into `mountRegistry`** — when any route opts in, MCP mounts at `/mcp` automatically (override with `mcp: { path, serverInfo, instructions }` or disable with `mcp: false`).
3. **Connect from the callspec UI** — at `/docs`, the **Connect MCP** panel shows your endpoint and copy-paste configs for Cursor (`.cursor/mcp.json`), Claude Desktop, Claude Code CLI, VS Code, Windsurf, and Pi — including `Authorization` headers when you have private tools.

```typescript
searchRecent: defineRoute({
    input: p.object({
        query: p.string({description: 'Search query (supports operators like from:, #hashtag)'}),
        max_results: p.optional(p.number({
            description: 'Maximum number of results (1–100)',
            range: {min: 1, max: 100},
        })),
    }),
    meta: {
        summary: 'Search recent Tweets',
        description: 'Returns Tweets from the last seven days matching a search query.',
        tags: ['tweets'],
    },
    access: 'private',
    mcp: true,
    handler: searchRecent,
}),
```

Agents call the **same handlers** as your HTTP RPC. Auth uses the same `contextResolver` (e.g. `Authorization: Bearer …`). Public tools work without a token; private tools return 401 without one.

## ✨ What you get

| Surface | How you get it |
|---------|----------------|
| **HTTP RPC** | `POST /v1/<methodName>` |
| **Interactive docs** | Built-in **callspec UI** at `/docs` |
| **OpenAPI 3.1** | `GET /openapi.json` from the same registry |
| **MCP tools** | `mcp: true` on a route → `tools/list` + `tools/call` at `/mcp` |
| **Typed client** | `client<API['searchRecent']>('searchRecent', input)` |

One schema, one handler layer, one mount. Past RPC and OpenAPI stacks often stopped at the wire format — docs were a separate install, agent tooling was DIY, and white-labeling meant forking someone else's UI. callspec bundles the full surface: **`mountRegistry` once** and you're live.

### 📖 callspec UI — interactive docs (white-label)

Minimal, fast docs UI baked into the package. Browse routes, try RPCs, read OpenAPI, and **connect MCP clients** from the home page. Point `docs.ui.branding` at your product: display name, welcome copy, website link, and logo (light/dark, optional `brandAssetsDir` for static files at `/docs/brand/`). Run `npm run dev:docs` to see the **Chirp** sample — callspec UI white-labeled as a fictional API.

Env-gated in production; flip on with:

```typescript
docs: {
    openApi: {title: 'Chirp API v2', version: '2.0.0'},
    exposeOpenApi: true,
    exposeUi: true,
    openApiPath: '/openapi.json',
    uiPath: '/docs',
    ui: {
        branding: {
            name: 'Chirp',
            intro: 'The Chirp API v2 lets you read and write posts, timelines, lists, and direct messages.',
            websiteUrl: 'https://chirp.social',
            websiteLabel: 'chirp.social',
            logoUrl: './brand/mark.png',
            logoUrlDark: './brand/mark.png',
            logoSize: 80,
        },
        brandAssetsDir: '/path/to/your/logos',  // served at /docs/brand/
        mcp: {
            authHint: 'Use Authorization: Bearer demo for private tools in this demo.',
        },
    },
}
```

Toggle each surface independently — spec only, UI only, MCP off (`mcp: false`), or neither (`docs: false`).

### 🔐 Auth

- **`access: 'public'`** — no credentials required (e.g. Chirp `healthcheck`, `getTweet`)
- **`access: 'private'`** (default) — 401 without `contextResolver` result
- App-specific auth stays in your `contextResolver` (e.g. map `Authorization: Bearer …` to `{userId, username}`)

Private gate runs **before** validation so unauthenticated callers never see field-level errors.

### 🧩 runtyp + OpenAPI

Field `{ description }` on runtyp preds flows to JSON Schema → OpenAPI → callspec UI → MCP `inputSchema`. Route-level `meta` (summary, tags) is callspec-only.

## 📦 Client

Fetch-only — works in the browser and in Node 18+ (global `fetch`). The `callspec/client` entry has no `http`, `https`, or Express imports, so it is safe in frontend bundles.

**Browser or frontend bundler** — import the client subpath so you do not pull server code:

```typescript
import type {API} from './chirp-api';
import {client} from 'callspec/client';

const timeline = await client<API['searchRecent']>('searchRecent', {
    query: 'callspec',
    max_results: 10,
}, {
    endpoint: 'https://api.chirp.social/v2',
    fetchOptions: {headers: {Authorization: `Bearer ${token}`}},
});
```

**Service package** — export the API type once from your Chirp registry:

```typescript
import type {InferRegistry} from 'callspec';

export const api = defineRegistry({
    getTweet: defineRoute({ /* … */ }),
    searchRecent: defineRoute({ /* … */ }),
    createTweet: defineRoute({ /* … */ }),
});
export type API = InferRegistry<typeof api>;
```

Responses deserialize ISO date strings back to `Date` on read (`deserializeResponse`).

## 🛠 Development

```bash
npm run validate   # build server + callspec UI, lint, test (incl. integration)
npm run dev:docs   # Chirp demo API + callspec UI at :3456/v1/docs
```

Integration tests spin up Express in-process and verify OpenAPI, `/docs`, auth, MCP, and RPC end-to-end.

## 🤝 Help build the standard

callspec is early — and we're looking for **maintainers and contributors** who want to help define how typed APIs work in the age of agents.

The goal is simple: **one registry → HTTP RPC, docs, OpenAPI, and MCP** — no duplicate schemas, no bolt-on tool manifests, no duct-tape between surfaces.

If you join now, you're not polishing someone else's finished spec. You're shaping the defaults: callspec UI UX, MCP ergonomics, client DX, framework adapters, examples, and the docs people copy from. Early contributors tend to become the people others cite — show up in release notes, speak at the meetup, get asked "who built this?" when the pattern spreads.

**Good first contributions:** callspec UI polish, MCP client configs, docs and demos, runtyp/OpenAPI edge cases, Fastify/Hono mounts, issue triage, or a blog post about your integration.

- **Issues & ideas:** [github.com/logfoxai/callspec/issues](https://github.com/logfoxai/callspec/issues)
- **PRs welcome** — `npm run validate` before you push; conventional commits (`feat:`, `fix:`, `docs:`, `style:`, etc.)

If you want maintainer access or a dedicated area to own (callspec UI, MCP, clients, docs), open an issue or PR and say hi. We'd rather have a small crew that cares than a huge drive-by.

## 📁 Package layout

```
src/
  defineRoute.ts      # route definition + arity guard
  defineRegistry.ts   # named route map
  executeRoute.ts     # shared HTTP + MCP pipeline
  mountRegistry.ts    # POST routes + openapi + callspec UI + MCP
  mountMcp.ts         # low-level MCP mount (used by mountRegistry)
  mcpTools.ts         # tools/list schemas from runtyp
  openapi.ts          # OpenAPI 3.1 emitter
  client.ts           # typed fetch client
  callspec-ui/          # built-in docs UI (bundled to dist/callspec-ui/ui)
```

Powered by [runtyp](https://github.com/logfoxai/runtyp) for validation.
