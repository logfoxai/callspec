export function omitUndefined<T extends Record<string, unknown>>(value: T): T {

    const out = {} as T;

    for (const [key, entry] of Object.entries(value)) {

        if (entry !== undefined) {

            (out as Record<string, unknown>)[key] = entry;

        }

    }

    return out;

}
