# Outside Callspec

Callspec owns the RPC router. Health checks, rate limiters, webhooks, and an app `errorHandler` sit outside it. When that host code should fail like RPC, these are the escape hatches — same `{ error, data? }` body.

| Where | How |
|-------|-----|
| Handler, `authenticate`, `handleUnhandledError` | **Return** `err.*`. `mountSpec` writes the response. |
| Middleware or another router — you own `res` | **`sendRouteFailureResponse(res, failure)`**. |

Do not attach Express error middleware to the `mountSpec` router. Put host middleware around the mount.

```typescript
import {err, sendRouteFailureResponse} from 'callspec';

app.use((req, res, next) => {
    if (overLimit(req)) {
        sendRouteFailureResponse(res, err.TOO_MANY_REQUESTS());
        return;
    }
    next();
});
```

| Export | When |
|--------|------|
| `sendRouteFailureResponse(res, failure)` | You have `res` and a `RouteFailure` |
| `formatRouteFailureBody(failure)` | Same JSON without `res` |
| `isRouteFailure(value)` | Narrow a helper return or `next(err)` |
| `logRequest` | Same jsout-express request log on another router |

Prefer sending in the middleware that decided. An app `errorHandler` is a backstop:

```typescript
if (isRouteFailure(err)) {
    sendRouteFailureResponse(res, err);
    return;
}
```

`authenticate` and `handleUnhandledError` stay return values — see [Error handling](./error-handling.md#mountspec-runtime).

← [Error handling](./error-handling.md)
