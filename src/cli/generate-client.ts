#!/usr/bin/env node

import {CallspecDocumentError} from '../callspecDocument';
import {generateClientFile} from '../generateClient/generateClient';
import {printExportDocsUiHelp, runExportDocsUi} from './export-docs-ui';

function printHelp(): void {

    process.stdout.write(`Usage:
  callspec <source> --output <file> [--class-name <name>]
  callspec export-docs-ui --out <dir> --spec-url <url> --rpc-base <url> [options]

Commands:
  <source> …          Generate a typed TypeScript client from callspec.json
  export-docs-ui …    Write a static Docs UI folder for S3 / Pages hosting

Client generation:
  <source>    Mount point (URL or directory) or path to callspec.json
  --output      Output TypeScript file (required)
  --class-name  Generated client class name (default: ApiClient)
  --help        Show this help

Emits ApiClient, route types, and a \`schemas\` object of runtyp preds (exports + route wire shapes).

Document paths are fixed: <mount>/callspec.json (and <mount>/openapi.json for OpenAPI tools).

Examples:
  callspec ./callspec.json --output ./src/generated/api.ts
  callspec ./ --output ./src/generated/api.ts
  callspec http://127.0.0.1:3000/v1 --output ./src/generated/api.ts
  callspec https://api.example.com/v1/callspec.json --output ./src/generated/api.ts
  callspec export-docs-ui --help
`);

}

function parseArgs(argv: string[]): {
    source?: string
    output?: string
    className?: string
    help?: boolean
} {

    const args = argv.slice(2);
    const result: ReturnType<typeof parseArgs> = {};

    if (args.includes('--help') || args.includes('-h') || args.length === 0) {

        result.help = true;
        return result;

    }

    result.source = args[0];

    for (let index = 1; index < args.length; index += 1) {

        const arg = args[index];

        if (arg === '--output') {

            result.output = args[index + 1];
            index += 1;

        } else if (arg === '--class-name') {

            result.className = args[index + 1];
            index += 1;

        }

    }

    return result;

}

async function main(): Promise<void> {

    const command = process.argv[2];

    if (command === 'export-docs-ui') {

        if (process.argv.includes('--help') || process.argv.includes('-h')) {

            printExportDocsUiHelp();
            process.exit(0);
            return;

        }

        process.exit(runExportDocsUi(process.argv));
        return;

    }

    const parsed = parseArgs(process.argv);

    if (parsed.help) {

        printHelp();
        process.exit(parsed.source ? 1 : 0);
        return;

    }

    if (!parsed.source) {

        process.stderr.write('Error: missing <source>\n');
        printHelp();
        process.exit(1);
        return;

    }

    if (!parsed.output) {

        process.stderr.write('Error: --output is required\n');
        printHelp();
        process.exit(1);
        return;

    }

    try {

        await generateClientFile(parsed.source, parsed.output, {
            className: parsed.className,
        });

    } catch (err) {

        const message = err instanceof CallspecDocumentError || err instanceof Error
            ? err.message
            : String(err);

        process.stderr.write(`Error: ${message}\n`);
        process.exit(1);

    }

}

void main();
