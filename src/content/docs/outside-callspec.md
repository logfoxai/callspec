# Outside Callspec

You can add your own Express middleware around `mountSpec` — for example a global rate limiter, a health check, or an app `errorHandler`. Callspec handles the RPC router. Your middleware handles the rest.

If that middleware should return the same error body as an RPC route (`{ error, data? }`), `sendRouteFailureResponse` is the escape hatch: call it when you have `res`.

| Where | How |
|-------|-----|
| Handler, `authenticate`, or `handleUnhandledError` | Return `err.*`. `mountSpec` writes the response. |
| Your middleware (you have `res`) | Call `sendRouteFailureResponse(res, failure)`. |

Do not add Express error middleware to the `mountSpec` router. Add yours on the app, around the mount.

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

Call `sendRouteFailureResponse` in the middleware that decided the failure. An app `errorHandler` can catch `RouteFailure` values that were passed to `next`:

```typescript
if (isRouteFailure(err)) {
    sendRouteFailureResponse(res, err);
    return;
}
```

`authenticate` and `handleUnhandledError` still return values — see [Error handling](./error-handling.md#mountspec-runtime).
