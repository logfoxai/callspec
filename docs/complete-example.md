# Complete example

A fuller Callspec API with auth, MCP, meta branding, and all default surfaces.

```typescript
import express from 'express';
import {defineSpec, defineRoute, mountSpec} from 'callspec';
import type {Authenticate, RouteHandler} from 'callspec';
import {predicates as p} from 'runtyp';

type AuthContext = {userId: string};

type SearchRecentInput = {
    query: string
    max_results?: number
};

type SearchRecentOutput = {
    results: {id: string; text: string; authorId: string}[]
    count: number
};

const searchRecent: RouteHandler<SearchRecentInput, SearchRecentOutput, AuthContext> = async (input, ctx) => ({
    results: [{id: '1', text: `Match for "${input.query}"`, authorId: ctx.userId}],
    count: 1,
});

const authenticate: Authenticate<AuthContext> = async (token, _req) => {
    if (token.startsWith('demo-')) return {userId: 'user_123'};
    return undefined;
};

export const meta = {
    title: 'My API',
    version: process.env.VERSION ?? '1.0.0',
    intro: 'Search and manage posts from one typed RPC surface.',
    mcpInstructions: 'Read-only search tools require Bearer demo-* tokens in this example.',
};

export const routes = {
    searchRecent: defineRoute({
        input: p.object({
            query: p.string({description: 'Search query (supports from:, #hashtag, …)'}),
            max_results: p.optional(p.number({range: {min: 1, max: 100}})),
        }),
        output: p.object({
            results: p.array(p.object({id: p.string(), text: p.string(), authorId: p.string()})),
            count: p.number(),
        }),
        meta: {
            summary: 'Search recent posts',
            description: 'Returns posts matching a query.',
            tags: ['posts'],
        },
        access: 'private',
        mcp: true,
        handler: searchRecent,
    }),
};

export const api = defineSpec({
    meta,
    routes,
    authenticate,
});

const app = express();
const router = express.Router();

router.use(express.json());

mountSpec(router, api);

app.use('/v1', router);

const port = Number(process.env.PORT ?? 3000);

app.listen(port, () => {
    console.log(`RPC:         http://127.0.0.1:${port}/v1/searchRecent`);
    console.log(`Docs:        http://127.0.0.1:${port}/v1/docs`);
    console.log(`Callspec:    http://127.0.0.1:${port}/v1/callspec.json`);
    console.log(`OpenAPI:     http://127.0.0.1:${port}/v1/openapi.json`);
    console.log(`MCP:         http://127.0.0.1:${port}/v1/mcp`);
    console.log('Auth:        Authorization: Bearer demo-anything');
});
```

With defaults, `mountSpec` serves `/docs`, `/callspec.json`, `/openapi.json`, and `/mcp` (when any route has `mcp: true`). See the [README](../README.md) for per-path overrides.
