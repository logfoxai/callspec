# File uploads

Put the file on a Callspec route. `mountSpec` accepts `multipart/form-data`, validates the file, and your handler gets a buffer — same auth, errors, `callspec.json`, OpenAPI, and generated client as JSON RPC.

Use this when a service today has a leftover Express upload handler (Logfox `POST /upload`) that should live in the spec.

## Route

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
        // input.file.buffer / filename / mimeType / size
        const key = await storePhoto(input.file, ctx);
        return {url: key};
    },
});
```

`file()` in the input object makes the route **multipart**. Extra form fields (strings) sit next to the file in the same `p.object`.

| `file()` option | Default | Meaning |
|-----------------|---------|---------|
| `maxBytes` | 10MB | Reject larger files as `VALIDATION_ERROR` |
| `mime` | any | Allow-list of `Content-Type` values (e.g. JPEG/PNG) |

The handler input type is `{ filename, mimeType, size, buffer }`. Storage, resize, and S3 keys stay in the service.

## Client

Regenerate the SDK. File fields are `Blob` (`File` works — it extends `Blob`):

```typescript
const result = await api.upload({
    file: input.files[0],
});

if (!result.ok) {
    // same result.code contract as JSON routes
}
```

Do not `fetch` a non-spec `/upload` URL. The generated method posts `multipart/form-data` to `POST {baseUrl}/upload`.

## Contract

- `callspec.json` marks the route `encoding: "multipart"` and the file field `format: "binary"`
- OpenAPI uses `multipart/form-data` (not `application/json`)
- Auth is the same `auth` / `authenticate` as other routes
- Wrong type, oversize, or a JSON body on an upload route → `VALIDATION_ERROR`
- MCP is JSON-only — do not set `mcp: true` on upload routes

The docs UI Try It panel is still JSON. Call the generated client (or curl with `-F file=@photo.png`) to exercise uploads.

## Limits

`mountSpec` buffers the file in memory up to `maxBytes`. That is enough for avatars and similar. Streaming or presigned direct-to-storage is out of scope here.

Related: [Error handling](./error-handling.md) · [SDK generation](./sdk-generation.md) · [route & spec](./api-reference/route-and-spec.md)
