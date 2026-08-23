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
route({ input, output, meta, handler, … })
```

| Option | Default | Description |
|--------|---------|-------------|
| `input` | — | Runtyp pred for the request body (POST JSON, or multipart when a field is [`file()`](../file-uploads.md)). Validated before your handler runs. |
| `output` | — | Runtyp pred for a successful response. |
| `meta` | — | Docs/OpenAPI/MCP labels — see [Route meta](#route-meta) below. |
| `handler` | — | `(input, ctx) => output \| failure`. Must accept exactly `(input, ctx)`. |
| `errors` | — | Domain error codes from `defineErrors()`. Builtins are always available — never declare those; see [Builtin errors](../builtin-errors.md). |
| `auth` | `'bearer'` | `'none'` — no token required. `'bearer'` — missing/invalid token → 401 before the handler. |
| `scope` | `'public'` | `'public'` — on the public contract (docs, OpenAPI, SDK, MCP `tools/list`). `'private'` — documented when `visibility` is `'all'`. Still mounted. |
| `mcp` | — | Opt the route into MCP `tools/list`. `true`, or `{ name?, annotations? }` — see [MCP](#mcp). |

Returns a **wired route** (`WiredRoute`) for `spec({ routes })`. Call `.handler(input, ctx)` in tests — no HTTP. See [Unit testing](../unit-testing.md).

Domain errors: `defineErrors()` + `errors:` on the route — [Error handling](../error-handling.md). Builtins like `err.NOT_FOUND()` work without declaring `errors`. Bearer context: annotate `handler: async (input, ctx: Ctx) => …` — [Authentication](../authentication.md) and [Request context](../request-context.md).

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
| `summary` | yes | Short label — docs sidebar, OpenAPI summary, MCP tool title. |
| `tags` | yes | Grouping in the docs UI and OpenAPI tags (e.g. `['catalog']`, `['users']`). |
| `description` | no | Longer prose for OpenAPI/MCP when the summary is not enough. |

## Separate handler binding

Optional — only when you have a real reason to extract the function. Prefer the inline `handler` above.

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
