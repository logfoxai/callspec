import type {
    CallspecNavbarLink,
    CallspecUiFooter,
    CallspecUiTheme,
} from '../types';

export type CallspecUiBranding = {
    /** Display name; defaults to OpenAPI info.title */
    name?: string
    /** Short welcome paragraph on the home page */
    intro?: string
    /** Company or product website */
    websiteUrl?: string
    /** Link label; defaults to hostname or "Learn more" */
    websiteLabel?: string
    /** Logo URL (relative to docs mount or absolute) */
    logoUrl?: string
    /** Dark-mode logo; falls back to logoUrl */
    logoUrlDark?: string
    /** Favicon URL; defaults from meta.favicon or logo light */
    favicon?: string
    /** CSS variable overrides + optional webfont URLs */
    theme?: CallspecUiTheme
    /** Persistent top-nav links (Dashboard, GitHub, …) */
    navbarLinks?: CallspecNavbarLink[]
    /** Footer options; poweredBy defaults to true when omitted */
    footer?: CallspecUiFooter
};

export type CallspecUiMcp = {
    /** MCP endpoint (absolute or relative). Default: sibling of docs at mcpPath */
    url?: string
    /** Auth note shown when private MCP tools exist */
    authHint?: string
};

export type CallspecUiConfig = {
    specUrl: string
    rpcBase: string
    title?: string
    branding?: CallspecUiBranding
    /** Relative path from docs to MCP endpoint. Default `../mcp` */
    mcpPath?: string
    mcp?: CallspecUiMcp
};
