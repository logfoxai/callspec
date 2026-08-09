import type {CallspecUiBranding} from './callspec-ui/branding';
import type {CallspecMeta, RouteAuth} from './types';
import {hasBearerRoutes} from './routeVisibility';

const DEFAULT_CALLSPEC_TITLE = 'Callspec API';
const DEFAULT_CALLSPEC_VERSION = '0.0.0';

const DEFAULT_AUTH_HINT =
    'Bearer routes require Authorization: Bearer <token>.';

export function resolveCallspecMeta(meta: CallspecMeta): CallspecMeta & {
    title: string
    version: string
} {

    return {
        ...meta,
        title: meta.title ?? DEFAULT_CALLSPEC_TITLE,
        version: meta.version ?? DEFAULT_CALLSPEC_VERSION,
    };

}

export function metaBrandingFromCallspecMeta(
    meta: CallspecMeta & {title: string},
    options?: {authHint?: string},
): CallspecUiBranding & {mcp?: {authHint?: string}} {

    const authHint = meta.authHint ?? options?.authHint;

    return {
        name: meta.title,
        intro: meta.intro,
        websiteUrl: meta.website?.url,
        websiteLabel: meta.website?.label,
        logoUrl: meta.logo?.light,
        logoUrlDark: meta.logo?.dark ?? meta.logo?.light,
        favicon: meta.favicon ?? meta.logo?.light,
        theme: meta.theme,
        navbarLinks: meta.navbarLinks,
        footer: meta.footer,
        headerHtml: meta.headerHtml,
        sdkInstall: meta.sdkInstall,
        ...(authHint ? {mcp: {authHint}} : {}),
    };

}

export function slugifyName(name: string, fallback: string): string {

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    return slug || fallback;

}

export function slugServerName(title: string): string {

    return slugifyName(title, 'callspec');

}

export function joinRoutePath(basePath: string, segment: string): string {

    return `${basePath}/${segment}`.replace(/\/{2,}/g, '/');

}

export function joinMountPath(basePath: string, subPath: string): string {

    const joined = `${basePath}${subPath}`.replace(/\/{2,}/g, '/');

    return joined || subPath;

}

export function siblingSpecPath(relativePath: string): string {

    const segment = relativePath.replace(/^\/+/, '');

    return segment ? `../${segment}` : '..';

}

function mountSubpathDepth(subpath: string): number {

    return subpath.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean).length;

}

/** Relative URL from a mount subpath (e.g. docs UI) back to the mount root. */
export function relativeToMountRoot(fromSubpath: string): string {

    const depth = mountSubpathDepth(fromSubpath);

    if (depth === 0) {

        return '..';

    }

    return '../'.repeat(depth).replace(/\/$/, '') || '..';

}

/** Relative URL from one mount subpath to another at the same mount root. */
export function relativeToMountPath(fromSubpath: string, toSubpath: string): string {

    const target = toSubpath.replace(/^\//, '');

    return `${relativeToMountRoot(fromSubpath)}/${target}`.replace(/\/{2,}/g, '/');

}

export function defaultAuthHint(
    meta: CallspecMeta,
    routes: Record<string, {auth: RouteAuth}>,
): string | undefined {

    if (meta.authHint) return meta.authHint;

    if (hasBearerRoutes(routes)) return DEFAULT_AUTH_HINT;

    return undefined;

}
