# Outside Callspec

Write your own Express around `mountSpec` — a global limiter, health, an app `errorHandler`. That's a normal use case. Callspec owns the RPC router; you own the rest.

When that middleware should fail like an RPC route, send the same `{ error, data? }` body. A little bit of an escape hatch. Fine.

| Where | How |
|-------|-----|
| Handler, `authenticate`, `handleUnhandledError` | **Return** `err.*`. `mountSpec` writes the response. |
| Your middleware — you own `res` | **`sendRouteFailureResponse(res, failure)`**. |

Don't hang Express error middleware on the `mountSpec` router. Put yours around the mount.

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

Send in the middleware that decided. An app `errorHandler` is a backstop:

```typescript
if (isRouteFailure(err)) {
    sendRouteFailureResponse(res, err);
    return;
}
```

`authenticate` and `handleUnhandledError` stay return values — see [Error handling](./error-handling.md#mountspec-runtime).

← [Error handling](./error-handling.md)
