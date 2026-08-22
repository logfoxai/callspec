import type {Infer, Pred} from 'runtyp';
import type {DefineErrorsInput, RouteFailuresFor} from './defineErrors';
import {emptyObjectInput} from './routeDefaults';

/** Preds (+ optional errors) for a route — used by `route` and `HandlerFor`. */
export type RouteHandlerDef = {
    input?: Pred<any>
    output?: Pred<any>
    errors?: DefineErrorsInput
};

type RoutePredsOf<Def extends RouteHandlerDef> = Pick<Def, 'input' | 'output' | 'errors'>;

type InferPred<T> = T extends Pred<infer U> ? U : never;

type HandlerInput<Def extends RouteHandlerDef> = [RoutePredsOf<Def>['input']] extends [undefined]
    ? Infer<typeof emptyObjectInput>
    : InferPred<RoutePredsOf<Def>['input']>;

type HandlerOutput<Def extends RouteHandlerDef> = [RoutePredsOf<Def>['output']] extends [undefined]
    ? void
    : InferPred<RoutePredsOf<Def>['output']>;

/** Handler fn type derived from route preds — use on a separate binding passed as `handler:`. */
export type HandlerFor<
    Def extends RouteHandlerDef,
    Ctx = unknown,
> = (
    input: HandlerInput<Def>,
    ctx: Ctx,
) => Promise<HandlerOutput<Def> | RouteFailuresFor<RoutePredsOf<Def>['errors']>>;
