<div align="center">
  <picture>
    <source srcset="assets/callspec-lockup-light.svg?cb=2" media="(prefers-color-scheme: light)" />
    <source srcset="assets/callspec-lockup-dark.svg?cb=2" media="(prefers-color-scheme: dark)" />
    <img src="assets/callspec-lockup-dark.svg?cb=2" alt="callspec" />
  </picture>

  <h3 align="center">One spec ships RPC, docs UI, OpenAPI, MCP, and typed clients.</h3>

  <br>

  <p>
    <a href="assets/callspec-ui-chirp-demo-home.png">
      <img src="assets/callspec-ui-chirp-demo-home.png" alt="callspec UI" width="920" />
    </a>
  </p>
</div>

Define your API once and get an HTTP RPC server, white-label docs, OpenAPI 3.1, an MCP server, and a typed client. No duplicate schemas, no bolt-on doc stack, no hand-maintained tool manifests.

Every call to your API and MCP have built-in input validation with user-friendly error messages. Clients have built-in compile-time type checking and enjoy LSP autocomplete same as any other types &mdash; with human readable types, thanks to [runtyp](https://github.com/logfoxai/runtyp).

## ✨ What you get

| Surface | How you get it |
|---------|----------------|
| **HTTP RPC** | `POST /v1/<methodName>` |
| **Interactive docs** | Built-in **callspec UI** at `/docs` |
| **OpenAPI 3.1** | `GET /openapi.json` from the same spec |
| **MCP tools** | `mcp: true` → `tools/list` + `tools/call` at `/mcp` — JSON Schema inputs + runtyp validation on every call |
| **Typed client** | `client<API['searchRecent']>('searchRecent', input)` |

One schema, one handler layer, one mount. Past RPC and OpenAPI stacks often stopped at the wire format — docs were a separate install, agent tooling was DIY, and white-labeling meant forking someone else's UI. callspec bundles the full surface: **`mountSpec` once** and you're live.

## Complete Example

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

const api = defineSpec({
    searchRecent: defineRoute({
        input: p.object({
            query: p.string({description: 'Search query (supports from:, #hashtag, …)'}),
            max_results: p.optional(p.number({range: {min: 1, max: 100}})),
        }),
        meta: {
            summary: 'Search recent posts',
            tags: ['posts'],
        },
        access: 'private',
        mcp: true,
        handler: searchRecent,
    }),
});

const app = express();
const router = express.Router();

router.use(express.json());

mountSpec(router, api, {
    contextResolver: (req) => {
        if (req.headers.authorization?.startsWith('Bearer ')) {
            return {userId: 'user_123'};
        }
        return undefined;
    },
    docs: {
        openApi: {title: 'My API', version: '1.0.0'},
        ui: {
            branding: {name: 'My API'},
        },
    },
});

app.use('/v1', router);

const port = Number(process.env.PORT ?? 3000);

app.listen(port, () => {
    console.log(`RPC:      http://127.0.0.1:${port}/v1/searchRecent`);
    console.log(`Docs:     http://127.0.0.1:${port}/v1/docs`);
    console.log(`OpenAPI:  http://127.0.0.1:${port}/v1/openapi.json`);
    console.log(`MCP:      http://127.0.0.1:${port}/v1/mcp`);
    console.log('Auth:     Authorization: Bearer anything (demo token)');
});
```

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

## 🔌 Built-in MCP server

No separate MCP process. No hand-maintained tool manifest. No stdio bridge.

1. **Opt in per route** — `mcp: true` on any `defineRoute`. Input/output schemas come from the same runtyp preds as HTTP.
2. **Validated tool calls** — every `tools/call` runs through the same runtyp pipeline as RPC. Field `{ description }`, ranges, and enums flow into MCP `inputSchema` so clients know what to send; invalid args return **structured validation errors** (not opaque 500s) that agents can read and retry.
3. **Built into `mountSpec`** — when any route opts in, MCP mounts at `/mcp` automatically (override with `mcp: { path, serverInfo, instructions }` or disable with `mcp: false`).
4. **Connect from callspec UI** — at `/docs`, the **Connect MCP** panel shows your endpoint and copy-paste configs for Cursor (`.cursor/mcp.json`), Claude Desktop, Claude Code CLI, VS Code, Windsurf, and Pi — including `Authorization` headers when you have private tools.

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
        summary: 'Search recent posts',
        description: 'Returns posts from the last seven days matching a search query.',
        tags: ['posts'],
    },
    access: 'private',
    mcp: true,
    handler: searchRecent,
}),
```

Agents call the **same handlers** as HTTP RPC — with the same auth gate and the same validation. Public tools work without a token; private tools return 401 without one.

## 📖 callspec UI

Minimal, fast docs UI baked into the package. Browse routes, try RPCs, read OpenAPI, and **connect MCP clients** from the home page. Point `docs.ui.branding` at your product — display name, welcome copy, website link, and logo (light/dark, optional `brandAssetsDir` for static files at `/docs/brand/`). Run `npm run dev:docs` to see the **Chirp** sample — callspec UI white-labeled as a fictional API.

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
            intro: 'Read and write posts, timelines, lists, and direct messages.',
            websiteUrl: 'https://chirp.social',
            websiteLabel: 'chirp.social',
            logoUrl: './brand/mark.png',
            logoUrlDark: './brand/mark.png',
            logoSize: 80,
        },
        brandAssetsDir: '/path/to/your/logos',
        mcp: {authHint: 'Use Authorization: Bearer demo for private tools in this demo.'},
    },
}
```

Toggle each surface independently — OpenAPI only, UI only, MCP off (`mcp: false`), or neither (`docs: false`).

Light and dark lockups follow `prefers-color-scheme` in docs; the UI footer switches marks on `data-theme` the same way as [Castellan](https://github.com/logfoxai/castellan).

## 🔐 Auth

- **`access: 'public'`** — no credentials required (e.g. Chirp `healthcheck`, `getTweet`)
- **`access: 'private'`** (default) — 401 without `contextResolver` result
- App-specific auth stays in your `contextResolver` (e.g. map `Authorization: Bearer …` to `{userId, username}`)

Private gate runs **before** validation so unauthenticated callers never see field-level errors.

## 🧩 runtyp + OpenAPI

Field `{ description }` on runtyp preds flows to JSON Schema → OpenAPI → callspec UI → MCP `inputSchema`. Route-level `meta` (summary, tags) is callspec-only.

Powered by [runtyp](https://github.com/logfoxai/runtyp) for validation and schema generation.

## 📦 Client

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

**Service package** — export the API type once from your spec:

```typescript
import type {InferSpec} from 'callspec';

export const api = defineSpec({
    getTweet: defineRoute({ /* … */ }),
    searchRecent: defineRoute({ /* … */ }),
    createTweet: defineRoute({ /* … */ }),
});
export type API = InferSpec<typeof api>;
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

The goal is simple: **one spec → HTTP RPC, docs, OpenAPI, and MCP** — no duplicate schemas, no bolt-on tool manifests, no duct-tape between surfaces.

If you join now, you're not polishing someone else's finished spec. You're shaping the defaults: callspec UI UX, MCP ergonomics, client DX, framework adapters, examples, and the docs people copy from. Early contributors tend to become the people others cite — show up in release notes, speak at the meetup, get asked "who built this?" when the pattern spreads.

**Good first contributions:** callspec UI polish, MCP client configs, docs and demos, runtyp/OpenAPI edge cases, Fastify/Hono mounts, issue triage, or a blog post about your integration.

- **Issues & ideas:** [github.com/logfoxai/callspec/issues](https://github.com/logfoxai/callspec/issues)
- **PRs welcome** — `npm run validate` before you push; conventional commits (`feat:`, `fix:`, `docs:`, `style:`, etc.)

If you want maintainer access or a dedicated area to own (callspec UI, MCP, clients, docs), open an issue or PR and say hi. We'd rather have a small crew that cares than a huge drive-by.
