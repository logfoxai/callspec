import {getPredMeta, type Pred, type ValidationResult} from 'runtyp';

const FILE_PRED = Symbol.for('callspec.file');

export type UploadedFile = {
    filename: string
    mimeType: string
    size: number
    buffer: Buffer
};

export type FilePredOptions = {
    maxBytes?: number
    mime?: readonly string[]
};

export type RouteFileField = {
    name: string
    opts: FilePredOptions
    required: boolean
};

/** Default upload cap — matches the Logfox avatar use case (~10MB). */
export const DEFAULT_FILE_MAX_BYTES = 10 * 1024 * 1024;

type FilePred = Pred<UploadedFile> & {
    [FILE_PRED]: FilePredOptions
};

function isUploadedFile(value: unknown): value is UploadedFile {

    if (typeof value !== 'object' || value === null) return false;

    const candidate = value as {
        filename?: unknown
        mimeType?: unknown
        size?: unknown
        buffer?: unknown
    };

    return typeof candidate.filename === 'string'
        && typeof candidate.mimeType === 'string'
        && typeof candidate.size === 'number'
        && Buffer.isBuffer(candidate.buffer);

}

function isFilePred(pred: Pred<unknown>): pred is FilePred {

    return FILE_PRED in pred;

}

function filePredOptions(pred: Pred<unknown>): FilePredOptions | undefined {

    if (!isFilePred(pred)) return undefined;

    return pred[FILE_PRED];

}

function unwrapOptional(pred: Pred<unknown>): Pred<unknown> {

    const meta = getPredMeta(pred);

    if (meta?.kind === 'optional') return meta.inner;

    return pred;

}

export function routeFileFields(input: Pred<unknown>): RouteFileField[] {

    const meta = getPredMeta(input);

    if (meta?.kind !== 'object' || !meta.schema) return [];

    const fields: RouteFileField[] = [];

    for (const [name, child] of Object.entries(meta.schema)) {

        const childMeta = getPredMeta(child);
        const inner = unwrapOptional(child);

        if (!isFilePred(inner)) continue;

        fields.push({
            name,
            opts: filePredOptions(inner) ?? {},
            required: childMeta?.kind !== 'optional',
        });

    }

    return fields;

}

export function isMultipartRoute(input: Pred<unknown>): boolean {

    return routeFileFields(input).length > 0;

}

export function multipartLimits(input: Pred<unknown>): {fileSize: number, files: number} {

    const fields = routeFileFields(input);
    const sizes = fields.map((field) => field.opts.maxBytes ?? DEFAULT_FILE_MAX_BYTES);

    return {
        fileSize: sizes.length ? Math.max(...sizes) : DEFAULT_FILE_MAX_BYTES,
        // Busboy counts discarded extra file parts toward `files`. Leave slack
        // so an unused field before the real one does not starve the route.
        files: Math.max(fields.length, 1) + 8,
    };

}

export function file(opts: FilePredOptions = {}): Pred<UploadedFile> {

    const maxBytes = opts.maxBytes ?? DEFAULT_FILE_MAX_BYTES;
    const mime = opts.mime;

    const pred = ((value: unknown): ValidationResult<UploadedFile> => {

        if (!isUploadedFile(value)) {

            return {isValid: false, errors: {root: 'must be a file'}};

        }

        if (value.size > maxBytes || value.buffer.length > maxBytes) {

            return {isValid: false, errors: {root: `file must be at most ${maxBytes} bytes`}};

        }

        if (mime && mime.length > 0 && !mime.includes(value.mimeType)) {

            return {isValid: false, errors: {root: `file type must be ${mime.join(' or ')}`}};

        }

        return {isValid: true, value};

    }) as FilePred;

    pred[FILE_PRED] = {maxBytes, mime};

    return pred;

}
