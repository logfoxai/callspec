import fs from 'fs';
import path from 'path';
import type {CallspecUiBranding, CallspecUiMcp} from './branding';
import {renderCallspecUiPage, resolveCallspecUiDir} from './mountCallspecUi';

export type ExportCallspecUiOptions = {
    outDir: string
    specUrl: string
    rpcBase: string
    title?: string
    branding?: CallspecUiBranding
    /** Mount-level stylesheet URL; wins over `branding.theme.customCssUrl`. */
    customCssUrl?: string
    mcpPath?: string
    mcp?: CallspecUiMcp
};

function defaultMcpPath(rpcBase: string, mcpPath: string | undefined): string {

    if (typeof mcpPath === 'string' && mcpPath.length > 0) {

        return mcpPath;

    }

    if (/^https?:\/\//i.test(rpcBase)) {

        return `${rpcBase.replace(/\/$/, '')}/mcp`;

    }

    return '../mcp';

}

/** Write a deployable Docs UI folder (baked config + assets) for S3 / Pages. */
export function exportCallspecUi(options: ExportCallspecUiOptions): void {

    const outDir = path.resolve(options.outDir);

    fs.mkdirSync(outDir, {recursive: true});

    const html = renderCallspecUiPage({
        specUrl: options.specUrl,
        rpcBase: options.rpcBase,
        title: options.title,
        branding: options.branding,
        customCssUrl: options.customCssUrl,
        mcpPath: defaultMcpPath(options.rpcBase, options.mcpPath),
        mcp: options.mcp,
    });

    fs.writeFileSync(path.join(outDir, 'index.html'), html, 'utf8');

    const assetsSrc = path.join(resolveCallspecUiDir(), 'assets');
    const assetsDest = path.join(outDir, 'assets');

    fs.cpSync(assetsSrc, assetsDest, {recursive: true});

}
