import type {CallspecMeta} from './types';

export const DEFAULT_CALLSPEC_TITLE = 'Callspec API';
export const DEFAULT_CALLSPEC_VERSION = '0.0.0';

export const DEFAULT_AUTH_HINT =
    'Private routes require Authorization: Bearer <token>.';

export function resolveCallspecMeta<Ctx>(meta: CallspecMeta<Ctx>): CallspecMeta<Ctx> & {
    title: string
    version: string
} {

    return {
        ...meta,
        title: meta.title ?? DEFAULT_CALLSPEC_TITLE,
        version: meta.version ?? DEFAULT_CALLSPEC_VERSION,
    };

}

export function metaBrandingFromCallspecMeta<Ctx>(
    meta: CallspecMeta<Ctx> & {title: string},
    options?: {authHint?: string},
): {
    name?: string
    intro?: string
    websiteUrl?: string
    websiteLabel?: string
    logoUrl?: string
    logoUrlDark?: string
    mcp?: {authHint?: string}
} {

    const authHint = meta.authHint ?? options?.authHint;

    return {
        name: meta.title,
        intro: meta.intro,
        websiteUrl: meta.website?.url,
        websiteLabel: meta.website?.label,
        logoUrl: meta.logo?.light,
        logoUrlDark: meta.logo?.dark ?? meta.logo?.light,
        ...(authHint ? {mcp: {authHint}} : {}),
    };

}

export function slugServerName(title: string): string {

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    return slug || 'callspec';

}

export function joinMountPath(basePath: string, subPath: string): string {

    const joined = `${basePath}${subPath}`.replace(/\/{2,}/g, '/');

    return joined || subPath;

}

export function siblingSpecPath(mountPath: string): string {

    return mountPath.startsWith('/') ? `..${mountPath}` : mountPath;

}

export function hasPrivateRoutes(routes: Record<string, {access: string}>): boolean {

    return Object.values(routes).some((route) => route.access === 'private');

}

export function defaultAuthHint<Ctx>(
    meta: CallspecMeta<Ctx>,
    routes: Record<string, {access: string}>,
): string | undefined {

    if (meta.authHint) return meta.authHint;

    if (hasPrivateRoutes(routes)) return DEFAULT_AUTH_HINT;

    return undefined;

}
