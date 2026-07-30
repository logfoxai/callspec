# Callspec mount API (v0.2)

Reference for **`defineSpec`** and **`mountSpec`** in callspec 0.2.0. User-facing guide: [README](../README.md).

`defineSpec({ meta?, routes, authenticate? })` composes into **`Callspec<Ctx>`** (`{ meta, routes, authenticate? }`). **`mountSpec(router, spec)`** wires HTTP RPC, docs UI, OpenAPI, and MCP. Surfaces are **on by default**.

---

## Spec layout

| What | Where |
|------|--------|
| Identity, presentation, MCP copy | **`spec.meta`** |
| Route definitions | **`spec.routes`** |
| Auth middleware hook | **`spec.authenticate`** |
| HTTP paths, surface opt-out | **`mountSpec` options** |

Preferred assembly (object shorthand):

```typescript
defineSpec({ meta, routes, authenticate });
```

---

## `meta` fields

| Field | Required | Default | Notes |
|-------|----------|---------|-------|
| `title` | no | `Callspec API` | UI, OpenAPI, MCP `serverInfo` |
| `version` | no | `0.0.0` | UI, OpenAPI, MCP |
| `intro` | no | — | Docs UI home |
| `website` | no | — | `{ url, label? }` |
| `logo` | no | letter placeholder | `{ light?, dark? }` URLs |
| `authHint` | no | generic Bearer copy | When private routes exist |
| `mcpInstructions` | no | — | MCP `tools/list` |

Omitted `title` / `version` are filled at mount/emit time.

---

## Auth — `authenticate(token, req)`

- callspec **extracts Bearer**; **401** on private routes without Bearer **before** the hook.
- Hook returns `undefined` on private → **401** (before input validation).
- **Public routes:** hook called only when a token is present; otherwise `ctx` is undefined.
- **`Ctx`** is app-defined. **`req`** is always passed.
- Token shape validation (UUID, API key hex, etc.) is the app's job — not callspec.
- Required on the spec when any route is `private`.

---

## Surfaces

| Surface | Default | Disable |
|---------|---------|---------|
| RPC | always | — |
| UI `/docs` | **on** | `ui: false` |
| OpenAPI `/openapi.json` | **on** | `openApi: false` |
| MCP | on if any route `mcp: true` | remove route `mcp: true` |

`basePath` prefixes RPC, UI, OpenAPI, and MCP paths (e.g. `/v1/searchLogs`, `/v1/docs`, `/v1/mcp`).

MCP mounts inside **`mountSpec`** when routes opt in. **`mountMcp` is not a public export.**

---

## Composition (Logfox layout)

```typescript
// middleware/getUserContext.ts
export async function getUserContext(token: string, req: Request): Promise<RequestContext | undefined> { … }

// routes/meta.ts — presentation only
export const meta = {
    title: 'Logfox API',
    version: process.env.VERSION,
    mcpInstructions: '…',
};

// routes/authenticate.ts
export const authenticate = getUserContext;

// routes/routes.ts — defineRoute exports; handlers from resolvers/
export const routes = { searchLogs, healthcheck, … };

// routes/spec.ts
export const api = defineSpec({ meta, routes, authenticate });
export type API = InferSpec<typeof api.routes>;

// routes/api.ts
mountSpec(apiRouter, api, { basePath: '/v1' });
```

---

## Examples

### Minimal

```typescript
export const api = defineSpec({
    routes: { ping: defineRoute({ access: 'public', … }) },
});
mountSpec(router, api);
```

### RPC-only

```typescript
mountSpec(router, api, { basePath: '/v1', ui: false, openApi: false });
```

---

## `defineSpec`

Named-params object only — **`{ meta?, routes, authenticate? }`**.

```typescript
defineSpec(input: {
    meta?: CallspecMeta
    routes: Record<string, RouteDef>
    authenticate?: Authenticate<Ctx>
}): Callspec<Ctx>
```

**Validation:**

- **`routes` required**
- **`meta` optional**
- Route handler arity 2
- Throw if any route is `private` and `authenticate` is missing

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

Not on mount: meta fields, `authenticate`, env toggles.

---

## Migration from 0.1.x

| Removed | Replacement |
|---------|-------------|
| `defineSpec(flat route map)` | `defineSpec({ meta?, routes, authenticate? })` |
| `contextResolver` on mount | `authenticate(token, req)` on spec |
| `docs.*`, `exposeDocs`, nested `branding` | `meta` + mount defaults |
| Public `mountMcp()` | Inside `mountSpec` |
| User `openApi.security` | Auto from route `access` |
| Opt-in UI/OpenAPI | Default on |

---

## Out of scope

- `brandAssetsDir`, mount-level MCP toggle, env surface gates (`EXPOSE_*`)
- Framework token-format validation; second auth hook
- Public `mountMcp` export
