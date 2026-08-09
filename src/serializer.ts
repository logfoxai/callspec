const ISO_DATE_TIME =
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$/;

export function parseIsoDateTimeString(s: string): Date | undefined {

    const len = s.length;

    if (len < 20 || len > 35) return undefined;

    if (s[4] !== '-' || s[7] !== '-' || s[10] !== 'T') return undefined;

    if (s[13] !== ':' || s[16] !== ':') return undefined;

    if (!ISO_DATE_TIME.test(s)) return undefined;

    const d = new Date(s);

    return Number.isNaN(d.getTime()) ? undefined : d;

}

function isLegacyDateWire(value: unknown): value is {__type: 'Date'; value: string} {

    return typeof value === 'object'
        && value !== null
        && !Array.isArray(value)
        && (value as {__type?: unknown}).__type === 'Date'
        && typeof (value as {value?: unknown}).value === 'string';

}

function mapContainers(data: unknown, mapChild: (child: unknown) => unknown): unknown {

    if (Array.isArray(data)) {

        let out: unknown[] | undefined;

        for (let i = 0; i < data.length; i++) {

            const next = mapChild(data[i]);

            if (next !== data[i]) {

                if (!out) out = data.slice(0, i);

                out.push(next);

            } else if (out) {

                out.push(data[i]);

            }

        }

        return out ?? data;

    }

    if (typeof data === 'object' && data !== null) {

        let out: Record<string, unknown> | undefined;

        for (const [key, value] of Object.entries(data as Record<string, unknown>)) {

            const next = mapChild(value);

            if (next !== value) {

                if (!out) out = {...data as Record<string, unknown>};

                out[key] = next;

            }

        }

        return out ?? data;

    }

    return data;

}

function deserializeChild(value: unknown): unknown {

    if (value === null || value === undefined) return value;

    if (typeof value === 'string') {

        return parseIsoDateTimeString(value) ?? value;

    }

    if (typeof value !== 'object') return value;

    if (isLegacyDateWire(value)) {

        return new Date(value.value);

    }

    return mapContainers(value, deserializeChild);

}

function serializeChild(value: unknown): unknown {

    if (value === null || value === undefined) return value;

    if (value instanceof Date) return value.toISOString();

    if (typeof value !== 'object') return value;

    return mapContainers(value, serializeChild);

}

export function deserializeResponse(data: unknown): unknown {

    return deserializeChild(data);

}

export function serializeResponse(data: unknown): unknown {

    return serializeChild(data);

}
