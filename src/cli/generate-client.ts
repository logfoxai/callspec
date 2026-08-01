#!/usr/bin/env node

import {CallspecDocumentError} from '../callspecDocument';
import {generateClientFile} from '../generateClient/generateClient';

function printHelp(): void {

    process.stdout.write(`Usage:
  callspec generate-client <source> --output <file>

Arguments:
  <source>    Path to callspec.json or HTTP(S) URL returning callspec.json

Options:
  --output    Output TypeScript file path (required)
  --class-name  Generated client class name (default: ApiClient)
  --help      Show this help message

Examples:
  callspec generate-client ./callspec.json --output ./src/generated/api.ts
  callspec generate-client https://api.example.com/callspec.json --output ./src/generated/api.ts
`);

}

function parseArgs(argv: string[]): {
    source?: string
    output?: string
    className?: string
    help?: boolean
} {

    let args = argv.slice(2);

    if (args[0] === 'generate-client') {

        args = args.slice(1);

    }

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
        process.exit(parsed.help && !parsed.source ? 0 : 1);
        return;

    }

    if (!parsed.source) {

        process.stderr.write('Error: missing <source> path or URL\n');
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
