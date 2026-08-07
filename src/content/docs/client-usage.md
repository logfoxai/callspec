# Client usage

Wrap generated methods in app helpers — branch on `result.code` in a `switch`; TypeScript flags missing cases.

```typescript
// src/app/getProductById.ts
import {ApiClient} from '../generated/api';

const api = new ApiClient({
    baseUrl: import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:3000/v1',
    headers: () => ({Authorization: `Bearer ${getSessionToken()}`}),
});

export async function fetchProduct(id: string) {
    const result = await api.getProductById({id});

    if (!result.ok) {
        if (result.code === 'NOT_FOUND') return null;
        if (result.code === 'NETWORK_ERROR') throw new Error('offline');
        throw new Error('unexpected');
    }

    return result.value;
}
```

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

See [Authentication](./authentication.md) for Bearer headers and [Error handling](./error-handling.md) for the Result contract.

