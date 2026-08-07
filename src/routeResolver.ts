import type {Infer, Pred} from 'runtyp';
import type {DefineErrorsInput, RouteFailuresFor} from './defineErrors';

/** Preds (+ optional errors) for a route — used by `route` and `ResolverFor`. */
export type RouteResolverDef = {
    input: Pred<any>
    output: Pred<any>
    errors?: DefineErrorsInput
};

type RoutePredsOf<Def extends RouteResolverDef> = Pick<Def, 'input' | 'output' | 'errors'>;

/** Resolver fn type derived from route preds — use on a separate binding passed as `resolver:`. */
export type ResolverFor<
    Def extends RouteResolverDef,
    Ctx = unknown,
> = (
    input: Infer<RoutePredsOf<Def>['input']>,
    ctx: Ctx,
) => Promise<Infer<RoutePredsOf<Def>['output']> | RouteFailuresFor<RoutePredsOf<Def>['errors']>>;
