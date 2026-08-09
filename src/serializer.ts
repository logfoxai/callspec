import {getPredMeta, type Pred} from 'runtyp';

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

function isLegacyDateWire(value: unknown): value is {__type: 'Date', value: string} {

    if (typeof value !== 'object' || value === null || Array.isArray(value)) {

        return false;

    }

    if (!('__type' in value) || !('value' in value)) {

        return false;

    }

    return value.__type === 'Date' && typeof value.value === 'string';

}

/** Coerce a known `p.date()` leaf from ISO string or legacy wrapper. */
function coerceDateLeaf(value: unknown): unknown {

    if (value instanceof Date) return value;

    if (typeof value === 'string') {

        return parseIsoDateTimeString(value) ?? value;

    }

    if (isLegacyDateWire(value)) {

        const d = new Date(value.value);

        return Number.isNaN(d.getTime()) ? value : d;

    }

    return value;

}

function mapArray(
    data: unknown[],
    mapChild: (child: unknown) => unknown,
): unknown {

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

function mapObject(
    data: Record<string, unknown>,
    mapEntry: (key: string, value: unknown) => unknown,
): unknown {

    let out: Record<string, unknown> | undefined;

    for (const [key, value] of Object.entries(data)) {

        const next = mapEntry(key, value);

        if (next !== value) {

            if (!out) out = {...data};

            out[key] = next;

        }

    }

    return out ?? data;

}

/**
 * Revive dates using a runtyp pred: coerce ISO / legacy wrappers only at `p.date()` leaves.
 * String fields that look like ISO stay strings.
 */
export function deserializeWithPred(data: unknown, pred: Pred<unknown>): unknown {

    const meta = getPredMeta(pred);

    if (!meta) {

        return deserializeLegacyOnly(data);

    }

    switch (meta.kind) {

        case 'date':
            return coerceDateLeaf(data);

        case 'optional':
            if (data === undefined) return data;
            return deserializeWithPred(data, meta.inner);

        case 'array': {
            if (!Array.isArray(data)) return data;

            return mapArray(data, (child) => deserializeWithPred(child, meta.item));
        }

        case 'object': {
            if (typeof data !== 'object' || data === null || Array.isArray(data)) {

                return data;

            }

            const record = data as Record<string, unknown>;
            const schema = meta.schema ?? {};

            return mapObject(record, (key, value) => {

                const fieldPred = schema[key];

                if (!fieldPred) return value;

                return deserializeWithPred(value, fieldPred);

            });
        }

        case 'union': {
            for (const branch of meta.predicates) {

                const candidate = deserializeWithPred(data, branch);
                const result = branch(candidate);

                if (result.isValid) return candidate;

            }

            return data;
        }

        case 'chain': {
            for (const inner of meta.predicates) {

                const innerMeta = getPredMeta(inner);

                if (
                    innerMeta
                    && innerMeta.kind !== 'unknown'
                    && innerMeta.kind !== 'any'
                ) {

                    return deserializeWithPred(data, inner);

                }

            }

            return deserializeLegacyOnly(data);
        }

        default:
            // string | number | boolean | enum | literal | any | unknown — no ISO revive
            return data;

    }

}

/** Deep-walk: revive legacy `{ __type: 'Date' }` only (no bare ISO coercion). */
function deserializeLegacyOnly(data: unknown): unknown {

    if (data === null || data === undefined) return data;

    if (typeof data !== 'object') return data;

    if (isLegacyDateWire(data)) {

        const d = new Date(data.value);

        return Number.isNaN(d.getTime()) ? data : d;

    }

    if (Array.isArray(data)) {

        return mapArray(data, deserializeLegacyOnly);

    }

    return mapObject(data as Record<string, unknown>, (_key, value) => deserializeLegacyOnly(value));

}

/**
 * Schema-free revive for clients without an output pred.
 * Only legacy Date wrappers — bare ISO strings stay strings (pass `output` pred for ISO→Date).
 */
export function deserializeResponse(data: unknown): unknown {

    return deserializeLegacyOnly(data);

}

function serializeChild(value: unknown): unknown {

    if (value === null || value === undefined) return value;

    if (value instanceof Date) return value.toISOString();

    if (typeof value !== 'object') return value;

    if (Array.isArray(value)) {

        return mapArray(value, serializeChild);

    }

    return mapObject(value as Record<string, unknown>, (_key, child) => serializeChild(child));

}

export function serializeResponse(data: unknown): unknown {

    return serializeChild(data);

}
