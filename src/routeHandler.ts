import type {Infer, Pred} from 'runtyp';
import type {DefineErrorsInput, RouteFailuresFor} from './defineErrors';

/** Preds (+ optional errors) for a route — used by `route` and `HandlerFor`. */
export type RouteHandlerDef = {
    input: Pred<any>
    output: Pred<any>
    errors?: DefineErrorsInput
};

type RoutePredsOf<Def extends RouteHandlerDef> = Pick<Def, 'input' | 'output' | 'errors'>;

/** Handler fn type derived from route preds — use on a separate binding passed as `handler:`. */
export type HandlerFor<
    Def extends RouteHandlerDef,
    Ctx = unknown,
> = (
    input: Infer<RoutePredsOf<Def>['input']>,
    ctx: Ctx,
) => Promise<Infer<RoutePredsOf<Def>['output']> | RouteFailuresFor<RoutePredsOf<Def>['errors']>>;
