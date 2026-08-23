# File uploads

`file()` on a route input is still a normal Callspec RPC. The handler is `(input, ctx)`. The generated client is `api.upload({ file, … })`. Auth, errors, and the JSON response are unchanged.

The wire is `multipart/form-data` so the browser can send a real file. That is an implementation detail — you do not build `FormData` or read streams yourself.

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
        const key = await storePhoto(input.file, ctx);
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

`callspec.json` sets `encoding: "multipart"`. OpenAPI uses `multipart/form-data`. Do not set `mcp: true` on these routes.
