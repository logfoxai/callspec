# route

`route()` wires one HTTP/MCP endpoint. We recommend keeping `handler` **inline** so the language server can infer input and return types.

```typescript
import {route, err} from 'callspec';
import {predicates as p} from 'runtyp';

const product = p.object({
    id: p.string(),
    name: p.string(),
    priceCents: p.number(),
});

const products = [
    {id: 'sku-1', name: 'Widget', priceCents: 999},
    {id: 'sku-2', name: 'Gadget', priceCents: 1299},
];

export const getProductById = route({
    input: p.object({id: p.string()}),
    output: product,
    meta: {summary: 'Get product by ID', tags: ['catalog']},
    auth: 'none',
    mcp: true,
    handler: async (input, _ctx) => {
        const found = products.find((item) => item.id === input.id);
        if (!found) return err.NOT_FOUND();
        return found;
    },
});
```

```typescript
route({ input?, output?, meta, handler, … })
```

| Option | Default | Description |
|--------|---------|-------------|
| `input` | `p.object({})` | Request body pred. Omit when there are no fields (extra keys rejected). |
| `output` | void | Successful response pred. Omit when a successful handler returns void or `undefined`. |
| `meta` | &mdash; | Docs/OpenAPI/MCP labels &mdash; see [Route meta](#route-meta) below. |
| `handler` | &mdash; | Your route logic &mdash; see [Handler](#handler) below. |
| `errors` | &mdash; | Domain errors &mdash; see [Builtin errors](../builtin-errors.md). |
| `auth` | `'bearer'` | Who can call the route &mdash; see [Auth and scope](./auth-and-scope.md). |
| `scope` | `'public'` | Who sees it in contracts &mdash; see [Auth and scope](./auth-and-scope.md). |
| `mcp` | &mdash; | MCP tool exposure &mdash; see [MCP](#mcp) below. |

## Handler

Your route implementation. Callspec validates **input** before the handler runs. The **output** pred types the success return and defines the contract for docs and codegen &mdash; it is not re-validated on the HTTP response.

The function always takes two arguments &mdash; validated input and request **ctx** ([Request context](../request-context.md)). Return a success value, or `err.*` / a registered domain error for expected failures ([Error handling](../error-handling.md)). Bare `throw` becomes `INTERNAL_ERROR`.

With bearer auth, annotate `ctx` with your context type ([Authentication](../authentication.md)). The wired route also exposes `.handler(input, ctx)` for unit tests ([Unit testing](../unit-testing.md)).

Returns a **wired route** (`WiredRoute`) for `spec({ routes })`.

## MCP

Omit `mcp` to keep the route HTTP-only. Set `mcp: true` (as in the example above) to list it as a tool. The tool **name** defaults to the route key (`getProductById`); the tool **title** is `meta.summary`.

Use the object form to override the tool name or pass MCP annotations through to `tools/list` (Callspec does not validate the keys):

```typescript
export const getProductById = route({
    // …
    mcp: {
        name: 'catalog_get_product',
        annotations: {readOnlyHint: true, idempotentHint: true},
    },
    handler: async (input, _ctx) => { /* … */ },
});
```

`name` must be unique among tools on that mount. Any route with `mcp` set turns on `{mount}/mcp`. Connect, auth, and `onCall`: [MCP Server](../mcp.md).

## Route meta

Every route needs `meta` with at least `summary` and `tags`. These show up in the docs UI route list, OpenAPI operation text, and MCP tool titles.

| Field | Required | Description |
|-------|----------|-------------|
| `summary` | yes | Short label &mdash; docs sidebar, OpenAPI summary, MCP tool title. |
| `tags` | yes | Grouping in the docs UI and OpenAPI tags (e.g. `['catalog']`, `['users']`). |
| `description` | no | Longer prose for OpenAPI/MCP when the summary is not enough. |

## Separate handler binding

Optional &mdash; only when you have a real reason to extract the function. See [Handler](#handler) for the contract; prefer inline `handler` on `route()`.

```typescript
import {route, type HandlerFor} from 'callspec';

const preds = {input, output, meta, auth: 'none'} as const;

const impl: HandlerFor<typeof preds, Ctx> = async (input, _ctx) => {
    return {id: input.id, name: '…', priceCents: 0};
};

export const getProductById = route({...preds, handler: impl});
```

| Export | Purpose |
|--------|---------|
| `route({ …, handler })` | Wired route for `spec`; handler also on `.handler` for tests |
| `HandlerFor<typeof preds, Ctx?>` | Explicit handler type for a separate binding |

Next: [`spec`](./spec.md)
