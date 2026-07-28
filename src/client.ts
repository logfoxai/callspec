import {deserializeResponse} from './serializer';

export type ClientOptions = {
    endpoint: string
    fetchOptions?: Omit<RequestInit, 'method' | 'body'>
    onError?: (error: unknown) => void
};

export class Non200Response<T = unknown> extends Error {

    status: number;

    response: T;

    constructor(status: number, response: T) {

        super('Non200Response');
        this.name = 'Non200Response';
        this.status = status;
        this.response = response;

    }

}

export async function client<A extends {
    name: string
    input: unknown
    output: unknown
}>(
    name: A['name'],
    input: A['input'],
    options?: ClientOptions,
): Promise<A['output']> {

    const endpoint = options?.endpoint ?? '';

    let resp: Response;

    try {

        const {headers: fetchHeaders, ...restFetchOptions} = options?.fetchOptions ?? {};

        const headers = new Headers({'Content-Type': 'application/json'});

        if (fetchHeaders) {

            new Headers(fetchHeaders).forEach((value, key) => headers.set(key, value));

        }

        resp = await fetch(`${endpoint}/${name}`, {
            ...restFetchOptions,
            method: 'POST',
            headers,
            body: JSON.stringify(input ?? {}),
        });

    } catch (err) {

        options?.onError?.(err);
        throw err;

    }

    const data = await resp.text();
    let responseData: unknown;

    if (data.trim().length) {

        try {

            responseData = deserializeResponse(JSON.parse(data));

        } catch {

            responseData = data;

        }

    }

    if (!resp.ok) {

        throw new Non200Response(resp.status, responseData);

    }

    return responseData as A['output'];

}
