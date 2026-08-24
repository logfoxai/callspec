import {getPredMeta, predicates as p, toJsonSchema, type Pred} from 'runtyp';
import type {JsonSchema} from './callspecDocumentTypes';

/** Default when `route({ input })` is omitted — same as writing `p.object({})`. */
export const emptyObjectInput = p.object({});

/** Default when `route({ output })` is omitted — handler `undefined`, JSON Schema / HTTP `null`. */
export const voidSuccess = p.literal(undefined);

export function isVoidSuccessPred(pred: Pred<unknown>): boolean {

    const meta = getPredMeta(pred);

    return meta?.kind === 'literal' && meta.value === undefined;

}

export function predToJsonSchema(pred: Pred<unknown>): JsonSchema {

    if (isVoidSuccessPred(pred)) {

        return {type: 'null'};

    }

    return toJsonSchema(pred);

}
