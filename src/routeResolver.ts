import type {Infer, Pred} from 'runtyp';
import type {DefineErrorsInput, RouteFailuresFor} from './defineErrors';

/** Preds (+ optional errors) for a route — share between `resolverFor` and `defineRoute`. */
export type RouteResolverDef = {
    input: Pred<any>
    output: Pred<any>
    errors?: DefineErrorsInput
};

/** Resolver fn type derived from route preds — full IDE on input, output, and failures. */
export type RouteResolverFor<
    Def extends RouteResolverDef,
    Ctx = unknown,
> = (
    input: Infer<Def['input']>,
    ctx: Ctx,
) => Promise<Infer<Def['output']> | RouteFailuresFor<Def['errors']>>;

/** Identity helper — `resolverFor(routeDef)(async (input, ctx) => …)` with inline autocomplete. */
export function resolverFor<const Def extends RouteResolverDef>(def: Def) {

    void def;

    return <Ctx, Fn extends RouteResolverFor<Def, Ctx>>(fn: Fn): Fn => fn;

}
