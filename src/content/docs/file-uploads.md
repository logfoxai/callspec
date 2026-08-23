# File uploads

Callspec routes can accept file uploads. Add `file()` to the input. The handler is still `(input, ctx)` and the generated client is still `api.upload({ file, … })` — auth, errors, and the JSON response do not change.

On the wire the request is `multipart/form-data`. Callspec handles that for you — you do not build `FormData` or read streams.

```typescript title="src/routes/upload.ts" frame="code"
import {route, file} from 'callspec';
import {predicates as p} from 'runtyp';

export const upload = route({
    input: p.object({
        file: file({
            maxBytes: 10 * 1024 * 1024,
            mime: ['image/jpeg', 'image/png'],
        }),
        caption: p.optional(p.string()),
    }),
    output: p.object({url: p.string()}),
    meta: {summary: 'Upload a photo', tags: ['user']},
    handler: async (input, ctx) => {
        const key = await storePhoto(input.file, input.caption, ctx);
        return {url: key};
    },
});
```

`input.file` is `{ filename, mimeType, size, buffer }`. Sibling fields (`caption` here) are ordinary pred values on the same object. Prefer strings for those — multipart parts arrive as text.

The generated client types the file as `Blob` (`File` works) and posts multipart:

```typescript
const result = await api.upload({
    file: input.files[0],
    caption: 'hi',
});
```

| `file()` option | Default | Description |
|-----------------|---------|-------------|
| `maxBytes` | 10MB | oversize → `VALIDATION_ERROR` |
| `mime` | any | allow-list of `Content-Type` values |

The file is buffered in memory up to `maxBytes`. A JSON body is rejected — the route is multipart-only.

`callspec.json` sets `encoding: "multipart"`. OpenAPI uses `multipart/form-data`.

[MCP](./mcp.md) `tools/call` only takes JSON arguments. These routes reject JSON, so they cannot be MCP tools. Leave `mcp` unset — Callspec will still list the tool if you set it, then fail when an agent calls it. This is a limitation of the MCP adapter, not of HTTP uploads.

Docs UI Try It also posts JSON only, so it cannot send a file. Use the generated client (or any multipart request).
