export function serializeResponse(data: unknown): unknown {

    if (data === null || data === undefined) return data;

    if (data instanceof Date) {

        return {
            __type: 'Date',
            value: data.toISOString(),
        };

    }

    if (Array.isArray(data)) return data.map(serializeResponse);

    if (typeof data === 'object') {

        const serialized: Record<string, unknown> = {};

        for (const [key, value] of Object.entries(data as Record<string, unknown>)) {

            serialized[key] = serializeResponse(value);

        }

        return serialized;

    }

    return data;

}

export function deserializeResponse(data: unknown): unknown {

    if (data === null || data === undefined) return data;

    if (
        typeof data === 'object'
        && data !== null
        && '__type' in data
        && (data as { __type: string }).__type === 'Date'
        && 'value' in data
    ) {

        return new Date((data as { value: string }).value);

    }

    if (Array.isArray(data)) return data.map(deserializeResponse);

    if (typeof data === 'object') {

        const deserialized: Record<string, unknown> = {};

        for (const [key, value] of Object.entries(data as Record<string, unknown>)) {

            deserialized[key] = deserializeResponse(value);

        }

        return deserialized;

    }

    return data;

}
