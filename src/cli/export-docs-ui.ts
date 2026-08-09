import {exportCallspecUi} from '../callspec-ui/exportCallspecUi';

export function printExportDocsUiHelp(): void {

    process.stdout.write(`Usage:
  callspec export-docs-ui --out <dir> --spec-url <url> --rpc-base <url> [options]

Write a static Docs UI folder (baked window.__CALLSPEC_UI__ + assets) for S3 / Pages.

Required:
  --out         Output directory
  --spec-url    Absolute or relative URL to callspec.json
  --rpc-base    Absolute or relative RPC base (try-it POSTs)

Optional:
  --title       Page title
  --mcp-path    MCP URL or path relative to the docs page (default: ../mcp)
  --mcp-url     Absolute MCP endpoint (sets mcp.url in baked config)
  --help        Show this help

Examples:
  callspec export-docs-ui --out ./docs-ui-dist \\
    --spec-url https://api.example.com/v1/callspec.json \\
    --rpc-base https://api.example.com/v1 \\
    --mcp-url https://api.example.com/v1/mcp \\
    --title "Acme API"

Requires a prior \`npm run build\` (or published package assets under dist/callspec-ui/ui).
`);

}

function parseExportDocsUiArgs(argv: string[]): {
    help?: boolean
    outDir?: string
    specUrl?: string
    rpcBase?: string
    title?: string
    mcpPath?: string
    mcpUrl?: string
    error?: string
} {

    const args = argv.slice(2);
    const result: ReturnType<typeof parseExportDocsUiArgs> = {};

    if (args.includes('--help') || args.includes('-h')) {

        result.help = true;
        return result;

    }

    for (let index = 1; index < args.length; index += 1) {

        const arg = args[index];
        const value = args[index + 1];

        if (arg === '--out') {

            result.outDir = value;
            index += 1;

        } else if (arg === '--spec-url') {

            result.specUrl = value;
            index += 1;

        } else if (arg === '--rpc-base') {

            result.rpcBase = value;
            index += 1;

        } else if (arg === '--title') {

            result.title = value;
            index += 1;

        } else if (arg === '--mcp-path') {

            result.mcpPath = value;
            index += 1;

        } else if (arg === '--mcp-url') {

            result.mcpUrl = value;
            index += 1;

        } else if (arg.startsWith('-')) {

            result.error = `unknown option: ${arg}`;
            return result;

        }

    }

    if (!result.outDir) {

        result.error = '--out is required';

    } else if (!result.specUrl) {

        result.error = '--spec-url is required';

    } else if (!result.rpcBase) {

        result.error = '--rpc-base is required';

    }

    return result;

}

export function runExportDocsUi(argv: string[]): number {

    const parsed = parseExportDocsUiArgs(argv);

    if (parsed.help) {

        printExportDocsUiHelp();
        return 0;

    }

    if (parsed.error || !parsed.outDir || !parsed.specUrl || !parsed.rpcBase) {

        process.stderr.write(`Error: ${parsed.error ?? 'invalid arguments'}\n`);
        printExportDocsUiHelp();
        return 1;

    }

    try {

        exportCallspecUi({
            outDir: parsed.outDir,
            specUrl: parsed.specUrl,
            rpcBase: parsed.rpcBase,
            title: parsed.title,
            mcpPath: parsed.mcpPath,
            mcp: parsed.mcpUrl ? {url: parsed.mcpUrl} : undefined,
        });

        process.stdout.write(`Wrote Docs UI to ${parsed.outDir}\n`);
        return 0;

    } catch (err) {

        const message = err instanceof Error ? err.message : String(err);

        process.stderr.write(`Error: ${message}\n`);
        return 1;

    }

}
