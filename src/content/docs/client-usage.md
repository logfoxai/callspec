# Client usage

Generated methods return a **Result** — check `result.ok`, then handle failures. You do **not** need a giant `switch` at every call site.

Typical pattern: handle the codes that matter for that UI, and send everything else through a small shared helper for builtins / network / unknown.

Codes reference: [Builtin errors](./builtin-errors.md).

## Typical call

```typescript
// src/app/getProductById.ts
import {ApiClient} from '../generated/api';
import {handleFailure} from './handleFailure';

const api = new ApiClient({
    baseUrl: import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:3000/v1',
    // Optional — see Authentication
    // headers: () => ({Authorization: `Bearer ${getSessionToken()}`}),
});

export async function fetchProduct(id: string) {
    const result = await api.getProductById({id});

    if (!result.ok) {
        if (result.code === 'NOT_FOUND') {
            // domain / UX-specific — toast, navigate, empty state, …
            return null;
        }
        handleFailure(result); // shared default for everything else
        return null;
    }

    return result.value; // { id, name, priceCents }
}
```

When you add `errors: defineErrors({ … })` on the route, regenerate the client and handle those codes the same way (specific `if` / `switch` arms, or fold them into the shared helper).

## Shared failure helper

Put builtin and client-only handling in **one** place so call sites stay thin:

```typescript
// src/app/handleFailure.ts
import {toast} from '../toast'; // sonner, react-hot-toast, whatever you use

type Failed = {ok: false; code: string; status: number; data?: unknown};

/** Default UX for builtins + NETWORK_ERROR / UNKNOWN_ERROR (and any leftover domain codes). */
export function handleFailure(result: Failed): void {
    switch (result.code) {
        case 'VALIDATION_ERROR': {
            const data = result.data as Record<string, string> | undefined;
            toast.error(Object.values(data ?? {})[0] ?? 'Invalid request');
            return;
        }
        case 'UNAUTHORIZED':
            toast.error('Please sign in');
            return;
        case 'FORBIDDEN':
            toast.error('You do not have access');
            return;
        case 'TOO_MANY_REQUESTS':
        case 'SERVICE_UNAVAILABLE': {
            const data = result.data as {message?: string} | undefined;
            toast.error(data?.message ?? 'Something went wrong — try again shortly');
            return;
        }
        case 'NETWORK_ERROR':
            toast.error('Check your connection and try again');
            return;
        case 'UNKNOWN_ERROR':
            console.error(result.data); // operators / devtools — do not show to users
            toast.error('Something went wrong');
            return;
        default:
            toast.error('Something went wrong');
    }
}
```

Tighten or expand this helper as your product needs — one file, not every call site.

## React sketch

```tsx
// src/components/ProductView.tsx
import {useState} from 'react';
import {fetchProduct} from '../app/getProductById';

export function ProductView() {
    const [productId, setProductId] = useState('sku-1');
    const [product, setProduct] = useState<Awaited<ReturnType<typeof fetchProduct>>>(null);

    async function onLoad() {
        setProduct(await fetchProduct(productId));
    }

    return (
        <>
            <input value={productId} onChange={(e) => setProductId(e.target.value)} />
            <button type="button" onClick={() => void onLoad()}>Load</button>
            {product && (
                <p>{product.name} — ${(product.priceCents / 100).toFixed(2)}</p>
            )}
        </>
    );
}
```

See [Authentication](./authentication.md) for Bearer headers and [Error handling](./error-handling.md) for the Result contract and client normalization.

## Dates

JSON has no `Date` type. On the wire, dates are **ISO 8601 strings** (`2024-01-15T12:00:00.000Z`) — matching OpenAPI `format: date-time`.

Coercion is **schema-guided** (only at `p.date()` leaves). ISO-shaped strings in `p.string()` fields stay strings.

- **Server:** `executeRoute` revives ISO strings using the route’s **input** pred before validation.
- **Generated clients:** pass the route **output** pred into `callResult`, so `result.value` gets `Date` where the schema says date.
- **Bare `CallspecClient.callResult` without `output`:** dates stay ISO strings (pass `output` to revive).
- **Requests:** pass `Date` in input objects; `JSON.stringify` sends ISO strings.

Breaking vs callspec 2.x: responses no longer use `{ __type: 'Date', value }`. Wire format is plain ISO only.

## Exhaustive switch (optional)

If you want TypeScript to flag a missing `case` at a call site (or inside `handleFailure`), switch on every code in that route’s failure union and end with `never`:

```typescript
if (!result.ok) {
    switch (result.code) {
        case 'NOT_FOUND':
            // …
            return null;
        case 'FORBIDDEN':
        case 'TOO_MANY_REQUESTS':
        case 'SERVICE_UNAVAILABLE':
        case 'VALIDATION_ERROR':
        case 'UNAUTHORIZED':
        case 'ROUTE_NOT_FOUND':
        case 'INTERNAL_ERROR':
        case 'NETWORK_ERROR':
        case 'UNKNOWN_ERROR':
            handleFailure(result);
            return null;
        default: {
            const _exhaustive: never = result;
            return _exhaustive;
        }
    }
}
```

Useful when a route’s domain-error set changes often and you want the compiler to nudge you. Not required for day-to-day call sites — prefer the [typical call](#typical-call) + [shared helper](#shared-failure-helper).
