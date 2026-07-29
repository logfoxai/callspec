# callspec API redesign

**Implemented in callspec v0.2.0.**

`defineSpec({ meta?, routes })` composes into **`Callspec<Ctx>`** (`{ meta, routes }`). Thin **`mountSpec(router, spec)`**. Surfaces **on by default**. **Hard break** (greenfield, no normalizer).

---

## Decision checklist

| Decision | Status |
|----------|--------|
| Spec shape: **`meta` + `routes`** (meta first in docs) | ✓ |
| Composition: export **`meta`**, **`routes`**, handlers; **`defineSpec({ meta, routes })`** (object shorthand) | ✓ |
| `title` / `version` optional → defaults **`Callspec API`** / **`0.0.0`** | ✓ |
| README examples: **`version: process.env.VERSION`** | ✓ |
| Auth: **`meta.authenticate(token, req)`** only; Bearer extracted; 401 without Bearer on private | ✓ |
| No UUID/token-format validation in framework | ✓ |
| No second auth hook (`contextResolver`, `resolveReq`) | ✓ |
| OpenAPI Bearer auto from `access`; no user `security` | ✓ |
| UI / OpenAPI **default on**; opt out with `false` | ✓ |
| No env surface gates (`EXPOSE_*`) on mount | ✓ |
| MCP auto in `mountSpec`; **no public `mountMcp` export** | ✓ |
| `basePath`, `ui`, `openApi`, `mcpPath` on **mount** only | ✓ |
| Logo: URL pair, letter placeholder, CSS sizes | ✓ |
| No `brandAssetsDir`, nested `branding`, separate `name` | ✓ |
| `InferSpec<typeof api.routes>` | ✓ |
| Hard break; no legacy normalizer | ✓ |
| **`defineSpec({ meta?, routes })`** — named object param + **object shorthand at call site** | ✓ |

**Call shape (locked):** single argument **`{ meta?, routes }`**. No positional overload. Name exports **`meta`** and **`routes`** so assembly is always shorthand:

```typescript
defineSpec({ meta, routes });
```

---

## Locked decisions

| What | Where |
|------|--------|
| Identity, presentation, auth, MCP copy | **`spec.meta`** |
| Route definitions | **`spec.routes`** |
| HTTP paths, surface opt-out | **`mountSpec`** |

### `meta` fields

| Field | Required | Default | Notes |
|-------|----------|---------|-------|
| `title` | no | `Callspec API` | UI, OpenAPI, MCP `serverInfo` |
| `version` | no | `0.0.0` | UI, OpenAPI, MCP |
| `intro` | no | — | Docs UI home |
| `website` | no | — | `{ url, label? }` |
| `logo` | no | letter placeholder | `{ light?, dark? }` URLs |
| `authHint` | no | generic Bearer copy | When private routes exist |
| `authenticate` | if any private route | — | `(token, req) => Ctx \| undefined` |
| `mcpInstructions` | no | — | MCP `tools/list` |

Defaults for `title` / `version` applied at mount/emit when omitted (stored meta may stay sparse).

### Auth — `meta.authenticate(token, req)`

- callspec **extracts Bearer**; **401** on private routes without Bearer **before** hook.
- Hook returns `undefined` on private → **401** (before input validation).
- **Public routes:** hook called only when token present; else `ctx` undefined.
- **`Ctx`** is app-defined (Logfox: `RequestContext`). **`req`** always passed.
- App validates token shape (UUID, API key hex, etc.) — not callspec.

### Surfaces

| Surface | Default | Disable |
|---------|---------|---------|
| RPC | always | — |
| UI `/docs` | **on** | `ui: false` |
| OpenAPI `/openapi.json` | **on** | `openApi: false` |
| MCP | on if any route `mcp: true` | remove route `mcp: true` |

`basePath` prefixes RPC, UI, OpenAPI, and MCP paths (e.g. `/v1/searchLogs`, `/v1/docs`, `/v1/mcp`).

### MCP

Mounted inside **`mountSpec`** when `spec.routes` has MCP opt-ins. Internal helper OK; **`mountMcp` removed from public exports**.

---

## Composition (preferred layout)

Export bindings named **`meta`** and **`routes`** (not `apiMeta` / `apiRoutes`) so `defineSpec({ meta, routes })` uses object shorthand everywhere.

```typescript
// middleware/getUserContext.ts
export async function getUserContext(token: string, req: Request): Promise<RequestContext | undefined> { … }

// spec/meta.ts
export const meta = {
    title: 'Logfox API',
    version: process.env.VERSION,
    authenticate: getUserContext,
    mcpInstructions: '…',
};

// spec/routes.ts — defineRoute exports; handlers from resolvers/
export const routes = {
    searchLogs,
    healthcheck,
};

// spec/index.ts
import {meta} from './meta';
import {routes} from './routes';

export const api = defineSpec({meta, routes});
export type API = InferSpec<typeof api.routes>;

// routes/api.ts
mountSpec(apiRouter, api, {basePath: '/v1'});
```

Inline literals OK for **minimal README snippets** only (e.g. routes-only one-liner).

---

## Examples

### Minimal snippet

```typescript
export const api = defineSpec({
    routes: { ping: defineRoute({ access: 'public', … }) },
});
mountSpec(router, api);
```

### RPC-only opt-out

```typescript
mountSpec(router, api, { basePath: '/v1', ui: false, openApi: false });
```

---

## `defineSpec`

Named-params object only — **`{ meta?, routes }`**, not positional `(meta, routes)`.

```typescript
defineSpec(input: { meta?: CallspecMeta<Ctx>; routes: Record<string, RouteDef> }): Callspec<Ctx>
```

**Validation:**

- **`routes` required** (non-empty in practice).
- **`meta` optional** — defaults applied when absent.
- Route handler arity 2.
- Throw if any route is `private` and `meta?.authenticate` is missing.

**Consumers:** `mountSpec` reads `spec.meta` + `spec.routes`; `executeRoute(spec.routes[name], …)`; `listMcpTools(spec.routes)`.

---

## `mountSpec`

```typescript
mountSpec(router, spec: Callspec<Ctx>, options?: {
    basePath?: string,
    ui?: boolean | string,       // default true
    openApi?: boolean | string, // default true
    mcpPath?: string,           // default `/mcp`
}): void
```

Not on mount: meta fields, `authenticate`, env toggles. UI `rpcBase` derived internally (no `brandAssetsDir`).

---

## Breaking changes (hard break, `feat!`)

| Removed | Replacement |
|---------|-------------|
| `defineSpec(flat route map)` | `defineSpec({ meta?, routes })` |
| `contextResolver` on mount | `meta.authenticate(token, req)` |
| `docs.*`, `exposeDocs`, nested `branding` | `meta` + mount defaults |
| Public `mountMcp()` | Inside `mountSpec` |
| User `openApi.security` | Auto from `access` |
| Opt-in UI/OpenAPI | Default on |
| `MountMcpOptions`, `MountSpecDocsOptions` nesting | Gone |
| Legacy normalizer | None |

---

## Out of scope

- `brandAssetsDir`, `logoSrcSet`, user logo sizes, separate display `name`
- Mount-level MCP toggle; MCP `serverInfo` override
- Public `mountMcp`; legacy shim; env surface gates; framework token validation; second auth hook

---

## Acceptance criteria

- README: composition layout (`meta`, `routes`, `defineSpec({ meta, routes })`); `version: process.env.VERSION`; `mountSpec(router, api)`; tagline **“One spec powers …”** (not “ships”).
- `InferSpec<typeof api.routes>` for typed client surface.
- Default-on UI/OpenAPI; omitted meta title/version → defaults.
- Private + no Bearer → 401 before `authenticate`.
- **`mountMcp` not in package exports.**
- `npm run validate` green in callspec.
