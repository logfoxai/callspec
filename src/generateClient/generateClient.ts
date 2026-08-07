import fs from 'fs';
import path from 'path';
import {parseCallspecDocument} from '../callspecDocument';
import {loadCallspecDocument} from '../callspecDocumentSource';
import {generateClientSource} from './generateClientSource';

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
