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
    /** Optional srcset, e.g. "./brand/mark.png 1x, ./brand/mark@2x.png 2x" */
    logoSrcSet?: string
    /** Display size in px. Default 80 */
    logoSize?: number
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
