# Client usage

Copy-paste template for a generated route with **no domain errors** (every builtin + client-only code). TypeScript flags a missing `case`. When you add `errors: defineErrors({ … })` on the route, regenerate the client and add those codes to the `switch`.

Codes reference: [Builtin errors](./builtin-errors.md).

## Exhaustive call template

```typescript
// src/app/getProductById.ts
import {ApiClient} from '../generated/api';
import {toast} from '../toast'; // sonner, react-hot-toast, whatever you use

const api = new ApiClient({
    baseUrl: import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:3000/v1',
    // Optional — see Authentication
    // headers: () => ({Authorization: `Bearer ${getSessionToken()}`}),
});

export async function fetchProduct(id: string) {
    const result = await api.getProductById({id});

    if (!result.ok) {
        switch (result.code) {
            // —— return from handlers (err.*) ——
            case 'NOT_FOUND':
                toast.error(`Unknown sku ${id}`);
                return null;
            case 'FORBIDDEN':
                toast.error('You do not have access to this product');
                return null;
            case 'CONFLICT':
                toast.error('That change conflicts with the current state');
                return null;
            case 'TOO_MANY_REQUESTS':
                toast.error(result.data?.message ?? 'Too many requests — try again shortly');
                return null;
            case 'SERVICE_UNAVAILABLE':
                toast.error(result.data?.message ?? 'Service temporarily unavailable');
                return null;

            // —— produced by mountSpec ——
            case 'VALIDATION_ERROR':
                // result.data is field → message
                toast.error(Object.values(result.data)[0] ?? 'Invalid request');
                return null;
            case 'UNAUTHORIZED':
                toast.error('Please sign in');
                return null;
            case 'ROUTE_NOT_FOUND':
                console.error('RPC missing on server:', result.data.route);
                toast.error('Something went wrong');
                return null;
            case 'INTERNAL_ERROR':
                toast.error('Something went wrong');
                return null;

            // —— client-only (SDK, never returned by your handler) ——
            case 'NETWORK_ERROR':
                toast.error('Check your connection and try again');
                return null;
            case 'UNKNOWN_ERROR':
                console.error(result.data); // operators / devtools — do not show to users
                toast.error('Something went wrong');
                return null;

            default: {
                const _exhaustive: never = result;
                return _exhaustive;
            }
        }
    }

    return result.value; // { id, name, priceCents }
}
```

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

- **Server:** `executeRoute` revives ISO / legacy wrappers using the route’s **input** pred before validation.
- **Generated clients:** pass the route **output** pred into `callResult`, so `result.value` gets `Date` where the schema says date.
- **Bare `CallspecClient.callResult` without `output`:** only legacy `{ __type: 'Date', value: '…' }` is revived; bare ISO strings stay strings.
- **Requests:** pass `Date` in input objects; `JSON.stringify` sends ISO strings.
