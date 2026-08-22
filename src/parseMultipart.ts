import busboy from 'busboy';
import type {Request} from 'express';
import {CallspecValidationError} from './errors';
import type {RouteFileField, UploadedFile} from './file';

export async function parseMultipart(
    req: Request,
    fileFields: RouteFileField[],
    limits: {fileSize: number, files: number},
): Promise<Record<string, unknown>> {

    if (!req.is('multipart/form-data')) {

        throw new CallspecValidationError({body: 'Expected multipart/form-data'});

    }

    const fileNames = new Set(fileFields.map((field) => field.name));

    return new Promise((resolve, reject) => {

        const input: Record<string, unknown> = {};
        let truncated = false;
        let settled = false;

        const fail = (errors: Record<string, string>): void => {

            if (settled) return;

            settled = true;
            reject(new CallspecValidationError(errors));

        };

        let parser: ReturnType<typeof busboy>;

        try {

            parser = busboy({
                headers: req.headers,
                limits: {
                    files: limits.files,
                    fileSize: limits.fileSize,
                    fields: 32,
                },
            });

        } catch {

            fail({body: 'Expected multipart/form-data'});
            return;

        }

        parser.on('file', (name, stream, info) => {

            if (!fileNames.has(name)) {

                stream.resume();
                return;

            }

            const chunks: Buffer[] = [];

            stream.on('data', (chunk: Buffer | string) => {

                chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));

            });

            stream.on('limit', () => {

                truncated = true;

            });

            stream.on('end', () => {

                const buffer = Buffer.concat(chunks);
                const uploaded: UploadedFile = {
                    filename: info.filename || 'upload',
                    mimeType: info.mimeType || 'application/octet-stream',
                    size: buffer.length,
                    buffer,
                };

                input[name] = uploaded;

            });

        });

        parser.on('field', (name, value) => {

            if (fileNames.has(name)) return;

            input[name] = value;

        });

        parser.on('error', () => {

            fail({body: 'Malformed multipart body'});

        });

        parser.on('close', () => {

            if (settled) return;

            if (truncated) {

                fail({file: `file must be at most ${limits.fileSize} bytes`});
                return;

            }

            settled = true;
            resolve(input);

        });

        req.pipe(parser);

    });

}
