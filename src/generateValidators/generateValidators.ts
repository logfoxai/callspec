import fs from 'fs';
import path from 'path';
import {parseCallspecDocument} from '../callspecDocument';
import {loadCallspecDocument} from '../callspecDocumentSource';
import {generateValidatorsSource} from './generateValidatorsSource';

export async function generateValidatorsFile(
    source: string,
    outputPath: string,
): Promise<void> {

    const raw = await loadCallspecDocument(source);
    const document = parseCallspecDocument(raw);
    const sourceCode = generateValidatorsSource(document);
    const resolvedOutput = path.resolve(outputPath);

    fs.mkdirSync(path.dirname(resolvedOutput), {recursive: true});
    fs.writeFileSync(resolvedOutput, sourceCode.endsWith('\n') ? sourceCode : `${sourceCode}\n`, 'utf8');

}
