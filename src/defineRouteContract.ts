import type {Pred} from 'runtyp';
import type {DefineErrorsInput} from './defineErrors';
import type {McpRouteConfig, RouteAuth, RouteMeta, RouteScope} from './types';

/** Route preds and meta — the fields on `route()` besides `resolver`. */
export type RouteContractInput = {
    input: Pred<any>
    output: Pred<any>
    errors?: DefineErrorsInput
    meta: RouteMeta
    auth?: RouteAuth
    scope?: RouteScope
    mcp?: McpRouteConfig
};

export {defineRoute as route} from './defineRoute';
