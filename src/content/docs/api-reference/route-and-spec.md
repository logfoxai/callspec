# route & spec

`route()` wires one HTTP/MCP endpoint. `spec()` collects those routes plus spec-level metadata, optional shared preds, and auth. Pass the result to `mountSpec()` to serve RPC, the docs UI, `callspec.json`, OpenAPI, and MCP.

## route

```typescript
route({ input, output, meta, handler, … })
```

| Option | Default | Description |
|--------|---------|-------------|
| `input` | — | Runtyp pred for the request body (POST JSON). Validated before your handler runs. |
| `output` | — | Runtyp pred for a successful response. |
| `meta` | — | Docs/OpenAPI/MCP labels — see [Route meta](#route-meta) below. |
| `handler` | — | `(input, ctx) => output \| failure`. Must accept exactly `(input, ctx)`. |
| `errors` | — | Domain error codes from `defineErrors()`. Builtins (`NOT_FOUND`, `UNAUTHORIZED`, …) are always available — never declare those. |
| `auth` | `'bearer'` | `'none'` — no token required. `'bearer'` — missing/invalid token → 401 before the handler. |
| `scope` | `'public'` | `'public'` — included in docs, OpenAPI, SDK codegen, MCP `tools/list`. `'private'` — server-only; omitted from exports. |
| `mcp` | — | Expose as an MCP tool. `true`, or `{ name?, annotations? }` to override the tool name or MCP annotations. |

Returns a **wired route** (`WiredRoute`) for `spec({ routes })`. Call `.handler(input, ctx)` in tests — no HTTP. See [Handlers](./handlers.md) and [Unit testing](../unit-testing.md).

### Route meta

Every route needs `meta` with at least `summary` and `tags`. These show up in the docs UI route list, OpenAPI operation text, and MCP tool titles.

| Field | Required | Description |
|-------|----------|-------------|
| `summary` | yes | Short label — docs sidebar, OpenAPI summary, MCP tool title. |
| `tags` | yes | Grouping in the docs UI and OpenAPI tags (e.g. `['catalog']`, `['users']`). |
| `description` | no | Longer prose for OpenAPI/MCP when the summary is not enough. |

## spec

```typescript
spec({ routes, meta?, exports?, authenticate? })
```

| Option | Default | Description |
|--------|---------|-------------|
| `routes` | — | Map of wired routes — see [Routes map](#routes-map). |
| `meta` | `{}` | Spec title, docs UI branding, OpenAPI `info`, MCP server hints — see [Spec meta](#spec-meta). |
| `exports` | — | Named runtyp preds for frontend codegen — see [Exports](#exports). |
| `authenticate` | — | Bearer hook — required when any route uses `auth: 'bearer'`. See [Authentication](../authentication.md). |

Throws at load time if any route uses `auth: 'bearer'` and `authenticate` is missing.

### Routes map

Keys become **RPC method names** — `routes: { getProductById }` is called as `POST /v1/getProductById` (plus your Express mount prefix). Values must come from `route({ …, handler })`, not bare preds.

Only routes with `scope: 'public'` appear in `callspec.json`, OpenAPI, SDK codegen, and MCP `tools/list`. Private routes still run on the server.

### Spec meta

`meta` is flat JSON on the spec. It flows into emitted documents and into the **docs UI** when you `mountSpec`. It does **not** turn docs on or off — that is `mountSpec(router, spec, { docs?, docsPath? })` ([`mountSpec` options](./mount-spec.md)).

| Field | Default | Used in | Description |
|-------|---------|---------|-------------|
| `title` | `'Callspec API'` | Docs UI header, OpenAPI `info.title`, MCP server name | Display name for your API. |
| `version` | `'0.0.0'` | OpenAPI `info.version`, MCP server version | Semver or build id — your choice. |
| `intro` | — | Docs UI home (required to show it), OpenAPI `info.description` | Welcome paragraph under the title. Without `intro`, the UI opens on the route list — no home page or MCP connect panel. |
| `website` | — | Docs UI home link | `{ url, label? }` — `label` defaults to the hostname or “Learn more”. |
| `logo` | — | Docs UI header + home | `{ light, dark? }` — image URLs; see [Logo URLs](#logo-urls). |
| `authHint` | auto | Docs UI MCP connect panel (home page) | Prose about Bearer tokens shown in the connect UI. Auto-set when bearer routes exist unless you override. |
| `mcpInstructions` | — | MCP server `instructions` field | Agent-facing server description returned by MCP `initialize` — not shown in the docs UI connect panel. |

Full whitelabel example (from the Chirp demo):

```typescript
const meta = {
    title: 'Chirp API v2',
    version: '2.0.0',
    intro: 'Read and write posts, timelines, and DMs.',
    website: {url: 'https://chirp.social', label: 'chirp.social'},
    logo: {
        light: './brand/mark-light.png',
        dark: './brand/mark-dark.png',
    },
    authHint: 'Use Authorization: Bearer <token> for private routes.',
    mcpInstructions: 'Chirp API — use Bearer demo in this sandbox.',
};

export const api = spec({meta, routes: {getUserById, …}});
```

#### Logo URLs

Paths in `logo.light` / `logo.dark` are resolved **relative to the docs UI URL** (e.g. `./brand/mark.png` under `/v1/docs` → `/v1/docs/brand/mark.png`). Use absolute URLs (`https://…`) when the asset is hosted elsewhere.

Serve files under the docs path on the same router:

```typescript
router.use('/docs/brand', express.static(path.join(__dirname, 'brand'), {index: false}));
mountSpec(router, api, {docsPath: '/docs'});
// meta.logo.light: './brand/mark.png'  →  /docs/brand/mark.png
```

If `dark` is omitted, the light logo is used in both themes.

#### Docs UI surfaces

`mountSpec` serves the built-in explorer by default at `{mount}/docs`. The UI loads `{mount}/callspec.json`, lists public routes, lets you try RPCs, browse schemas, and connect MCP clients.

| What you want | Where to configure |
|---------------|-------------------|
| Turn docs/OpenAPI/`callspec.json` off | `mountSpec(…, {docs: false})` |
| Change docs path only | `mountSpec(…, {docsPath: '/explorer'})` — contract paths stay `/callspec.json` and `/openapi.json` |
| Title, intro, logo, website | `spec({ meta: { … } })` |
| Per-route summaries and tags | `route({ meta: { summary, tags, … } })` |

More: [Docs UI](../docs-ui.md) · [Branding](../docs-ui-branding.md) · [`mountSpec`](./mount-spec.md)

### Exports

Optional map of **named runtyp preds** that are not routes — shared form shapes, filters, enums for the frontend:

```typescript
import {product, productList} from './schemas/product';

export const api = spec({
    meta: {title: 'My API', version: '1.0.0'},
    routes: {getProductById, listProducts},
    exports: {product, productList},
});
```

`exports` land in `callspec.json` and appear on the generated **`schemas`** object (plus top-level Infer types):

```bash
npx callspec ./callspec.json --output src/generated/api.ts
```

```typescript
import {schemas, type Product} from './generated/api';
```

See [Shared validation](../shared-validation.md) and [SDK generation](../sdk-generation.md).

### authenticate

```typescript
import type {Authenticate} from 'callspec';

export type Ctx = {userId: string};

export const authenticate: Authenticate<Ctx> = async (token, req) => {
    const session = await verifySession(token, req);
    return session ? {userId: session.userId} : undefined;
};

export const api = spec({meta, routes, authenticate});
```

Callspec extracts `Authorization: Bearer …`, calls your hook, and passes the returned context to handlers on bearer routes. Return `undefined` for invalid tokens → 401. See [Authentication](../authentication.md) and [Request context](../request-context.md).

← [API reference](../api-reference.md) · Next: [`mountSpec`](./mount-spec.md)
