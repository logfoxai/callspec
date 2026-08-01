import fs from 'fs';
import path from 'path';
import {CallspecDocumentError, parseCallspecDocument} from '../callspecDocument';
import {generateClientSource} from './generateClientSource';

async function loadCallspecDocument(source: string): Promise<unknown> {

    if (/^https?:\/\//i.test(source)) {

        const resp = await fetch(source);

        if (!resp.ok) {

            throw new CallspecDocumentError(
                `Failed to fetch Callspec document (${resp.status} ${resp.statusText})`,
            );

        }

        return resp.json();

    }

    const filePath = path.resolve(source);

    if (!fs.existsSync(filePath)) {

        throw new CallspecDocumentError(`Callspec document not found: ${filePath}`);

    }

    const raw = fs.readFileSync(filePath, 'utf8');

    try {

        return JSON.parse(raw);

    } catch {

        throw new CallspecDocumentError(`Invalid JSON in Callspec document: ${filePath}`);

    }

}

export async function generateClientFile(
    source: string,
    outputPath: string,
    options?: {className?: string},
): Promise<void> {

    const raw = await loadCallspecDocument(source);
    const document = parseCallspecDocument(raw);
    const sourceCode = generateClientSource(document, options);
    const resolvedOutput = path.resolve(outputPath);

    fs.mkdirSync(path.dirname(resolvedOutput), {recursive: true});
    fs.writeFileSync(resolvedOutput, sourceCode.endsWith('\n') ? sourceCode : `${sourceCode}\n`, 'utf8');

}
