#!/usr/bin/env node

import {CallspecDocumentError} from '../callspecDocument';
import {generateClientFile} from '../generateClient/generateClient';

function printHelp(): void {

    process.stdout.write(`Usage:
  callspec <source> --output <file>

Arguments:
  <source>    Path to callspec.json or HTTP(S) URL

Options:
  --output      Output TypeScript file (required)
  --class-name  Generated client class name (default: ApiClient)
  --help        Show this help

Examples:
  callspec ./callspec.json --output ./src/generated/api.ts
  callspec https://api.example.com/v1/callspec.json --output ./src/generated/api.ts
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
