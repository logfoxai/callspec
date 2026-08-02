import {getPredMeta, type Pred} from 'runtyp';

/** Unwrap `p.optional(inner)` so wire/codegen can treat payload as optional on the wire. */
export function unwrapOptionalPred(pred: Pred<unknown>): {
    pred: Pred<unknown>
    optional: boolean
} {

    const meta = getPredMeta(pred);

    if (meta?.kind === 'optional') {

        return {pred: meta.inner, optional: true};

    }

    return {pred, optional: false};

}
