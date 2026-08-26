# spec

`spec()` collects [wired routes](./route.md) plus spec-level metadata, optional shared preds, and auth. Pass the result to [`mountSpec()`](./mount-spec.md) to serve RPC, the docs UI, `callspec.json`, OpenAPI, and MCP.

```typescript
spec({ routes, meta?, exports?, authenticate? })
```

| Option | Default | Description |
|--------|---------|-------------|
| `routes` | &mdash; | Map of wired routes &mdash; see [Routes map](#routes-map). |
| `meta` | `{}` | Spec title, docs UI branding, OpenAPI `info`, MCP server hints &mdash; see [Spec meta](#spec-meta). |
| `exports` | &mdash; | Named runtyp preds for frontend codegen &mdash; see [Exports](#exports). |
| `authenticate` | &mdash; | Bearer hook &mdash; required when any route uses `auth: 'bearer'`. See [Authentication](../authentication.md). |

Throws at load time if any route uses `auth: 'bearer'` and `authenticate` is missing.

## Routes map

Keys become **RPC method names** &mdash; `routes: { getProductById }` is called as `POST /v1/getProductById` (plus your Express mount prefix). Values must come from `route({ …, handler })`, not bare preds.

By default only `scope: 'public'` routes appear in `callspec.json`, OpenAPI, SDK codegen, and MCP `tools/list`. Private routes still run on the server. Pass `visibility: 'all'` on `mountSpec` (or `emitCallspec`) to document them on that mount. See [Auth and scope](./auth-and-scope.md).

## Spec meta

`meta` is flat JSON on the spec. It flows into emitted documents and into the **docs UI** when you `mountSpec`. It does **not** turn docs on or off &mdash; that is `mountSpec(router, spec, { docs?, docsPath? })` ([`mountSpec` options](./mount-spec.md)).

| Field | Default | Used in | Description |
|-------|---------|---------|-------------|
| `title` | `'Callspec API'` | Docs UI header, OpenAPI `info.title`, MCP server name | Display name for your API. |
| `version` | `'0.0.0'` | Docs UI header, OpenAPI `info.version`, MCP server version | Semver or build id &mdash; your choice. Always shown next to the API name. |
| `intro` | &mdash; | Docs UI home blurb, OpenAPI `info.description` | Optional welcome paragraph. Home is omitted when `intro`, `website`, and `sdkInstall` are all empty. |
| `website` | &mdash; | Docs UI home link | `{ url, label? }` &mdash; `label` defaults to the hostname or “Learn more”. |
| `logo` | Callspec hex | Docs UI header + home | `{ light, dark? }` &mdash; image URLs; omit to use the Callspec mark. See [Logo URLs](#logo-urls). |
| `favicon` | `logo.light` | Docs UI tab icon | Explicit favicon URL; falls back to `logo.light`. |
| `theme` | &mdash; | Docs UI CSS variables | `{ accent?, background?, surface?, fontFamily?, fontUrls? }` &mdash; vars injected at boot. Accent-only keeps light/dark distinct; `background` / `surface` pin both modes and derive text for contrast. |
| `navbarLinks` | &mdash; | Docs UI top header | `{ label, href, external? }[]` &mdash; product links next to the brand. |
| `footer` | `{ poweredBy: true }` | Docs UI footer | `{ poweredBy?: boolean }` &mdash; set `poweredBy: false` to hide “Powered by callspec”. |
| `notice` | &mdash; | Docs UI banner | Plain-text `{ title?, message, command?, links? }` above the top header. |
| `sdkInstall` | &mdash; | Docs UI home | Static install hint with copy button (e.g. `npm i @acme/sdk`). |
| `authHint` | auto | Docs UI MCP connect panel (home page) | Prose about Bearer tokens shown in the connect UI. Auto-set when bearer routes exist unless you override. |
| `mcpInstructions` | &mdash; | MCP server `instructions` field | Agent-facing server description returned by MCP `initialize` &mdash; not shown in the docs UI connect panel. |

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
    theme: {
        accent: '#1d9bf0',
        background: '#f7f9f9',
        surface: '#ffffff',
    },
    navbarLinks: [
        {label: 'chirp.social', href: 'https://chirp.social', external: true},
        {label: 'GitHub', href: 'https://github.com/logfoxai/callspec', external: true},
    ],
    authHint: 'Use Authorization: Bearer <token> for private routes.',
    mcpInstructions: 'Chirp API — use Bearer demo in this sandbox.',
};

export const api = spec({meta, routes: {getUserById, …}});
```

### Logo URLs

Paths in `logo.light` / `logo.dark` are resolved **relative to the docs UI URL** (e.g. `./brand/mark.png` under `/v1/docs` → `/v1/docs/brand/mark.png`). Use absolute URLs (`https://…`) when the asset is hosted elsewhere.

Serve files under the docs path on the same router:

```typescript
router.use('/docs/brand', express.static(path.join(__dirname, 'brand'), {index: false}));
mountSpec(router, api, {docsPath: '/docs'});
// meta.logo.light: './brand/mark.png'  →  /docs/brand/mark.png
```

If `dark` is omitted, the light logo is used in both themes.

### Docs UI surfaces

`mountSpec` serves the built-in explorer by default at `{mount}/docs`. The UI loads `{mount}/callspec.json`, lists public routes, lets you try RPCs, browse schemas, and connect MCP clients.

| What you want | Where to configure |
|---------------|-------------------|
| Turn docs/OpenAPI/`callspec.json` off | `mountSpec(…, {docs: false})` |
| Change docs path only | `mountSpec(…, {docsPath: '/explorer'})` &mdash; contract paths stay `/callspec.json` and `/openapi.json` |
| Title, intro, logo, theme, navbar, footer | `spec({ meta: { … } })` |
| Per-route summaries and tags | `route({ meta: { summary, tags, … } })` |

More: [Docs UI](../docs-ui.md) · [Branding](../docs-ui-branding.md) · [`mountSpec`](./mount-spec.md)

## Exports

Optional map of **named runtyp preds** that are not routes &mdash; shared form shapes, filters, enums for the frontend:

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
npx callspec http://127.0.0.1:3000/v1 --output src/generated/api.ts
```

```typescript
import {schemas, type Product} from './generated/api';
```

See [Shared validation](../shared-validation.md) and [SDK generation](../sdk-generation.md).

## authenticate

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

← [`route`](./route.md) · Next: [`mountSpec`](./mount-spec.md)
