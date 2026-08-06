---
title: route & spec
---

# `route` & `spec`

## `route`

```typescript
export const getProductById = route({
    input: Pred,
    output: Pred,
    errors?: ErrorsHandle,
    meta: RouteMeta,
    auth?: 'none' | 'bearer',
    scope?: 'public' | 'private',
    mcp?: true | McpRouteConfig,
    resolver: async (input, ctx) => { /* … */ },
})
```

Returns a wired route for `spec`. Test via `getProductById.resolver(input, ctx)`.

## `spec`

```typescript
spec({
    meta?: CallspecMeta,
    routes: RoutesMap<Ctx>,          // required — wired routes from `route({ …, resolver })`
    exports?: Record<string, Pred>,  // named schemas for consumer codegen
    authenticate?: Authenticate<Ctx>,
})
```

Throws at load time if any route uses `auth: 'bearer'` and `authenticate` is missing.

← [API reference](../api-reference.md) · Next: [`mountSpec`](mount-spec.md)
