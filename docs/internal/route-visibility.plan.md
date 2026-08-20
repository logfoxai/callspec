# Private docs for you, public docs for everyone else

You already mark a route `scope: 'private'`. It still runs on the server. Today it never shows up in `/docs` or the generated client.

This change lets your environments show those private routes in the same `/docs` (and in the spec JSON the client is generated from). Prod keeps showing only public routes.

Private routes are documented. They are just not on the public contract.

Related: [Auth and scope](../../src/content/docs/api-reference/auth-and-scope.md), [route & spec](../../src/content/docs/api-reference/route-and-spec.md).

## Two settings

- **`auth`** — who can call it (`bearer` vs no token). Not about docs.
- **`scope`** — who can see it in docs/specs (`public` vs `private`).

A route with no login is not a private-docs route. That’s `auth`, not `scope`.

## How you turn it on

Callspec does not guess your environment. You pass it when you mount the API:

```typescript
mountSpec(router, api, {
    visibility: process.env.NODE_ENV === 'production' ? 'public' : 'all',
});
```

- **`all`** (dev/stage): `/docs`, `callspec.json`, OpenAPI, and MCP list include private routes.
- **`public`** (prod, and the default): public routes only.

Anyone who can open that `/docs` will see the private routes.

## Generating the client

No `callspec --scope=private`. Point the CLI at a server that used `visibility: 'all'`.

```bash
npx callspec http://127.0.0.1:3000/v1 --output src/generated/api.ts
```

## What we will not do

- A CLI flag that tries to add private routes back after they were stripped
- A second secret docs URL
- Renaming or changing `auth`

## Build notes

- Thread `visibility` through `exportedRoutes`, `emitCallspec`, `emitOpenApi`, and `mountSpec`
- Docs: getting-started, mount-spec, auth-and-scope, sdk-generation — never “undocumented”
- Tests: `public` omits private routes; `all` includes them and still labels them `scope: 'private'`
