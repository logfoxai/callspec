# File uploads

Add `file()` to a route input. The request is `multipart/form-data`. The handler gets `{ filename, mimeType, size, buffer }`.

```typescript title="src/routes/upload.ts" frame="code"
import {route, file} from 'callspec';
import {predicates as p} from 'runtyp';

export const upload = route({
    input: p.object({
        file: file({
            maxBytes: 10 * 1024 * 1024,
            mime: ['image/jpeg', 'image/png'],
        }),
    }),
    output: p.object({url: p.string()}),
    meta: {summary: 'Upload a photo', tags: ['user']},
    handler: async (input, ctx) => {
        const key = await storePhoto(input.file, ctx);
        return {url: key};
    },
});
```

| `file()` option | Default | Description |
|-----------------|---------|-------------|
| `maxBytes` | 10MB | oversize → `VALIDATION_ERROR` |
| `mime` | any | allow-list of `Content-Type` values |

String fields can sit next to the file in the same `p.object`. The file is buffered in memory up to `maxBytes`.

The generated client types the field as `Blob` (`File` works) and posts multipart:

```typescript
const result = await api.upload({
    file: input.files[0],
});
```

`callspec.json` sets `encoding: "multipart"`. OpenAPI uses `multipart/form-data`. Do not set `mcp: true` on these routes.
