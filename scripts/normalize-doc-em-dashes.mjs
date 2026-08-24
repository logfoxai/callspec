#!/usr/bin/env node
/**
 * Replace Unicode em dashes (—) with &mdash; in docs prose.
 * Skips fenced code blocks and inline `code` spans.
 */
import {glob} from 'node:fs/promises';
import {readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const EM_DASH = '\u2014';

function replaceOutsideInlineCode(text) {
    const parts = text.split(/(`[^`\n]*`)/g);
    return parts
        .map((part, i) => (i % 2 === 1 ? part : part.replaceAll(EM_DASH, '&mdash;')))
        .join('');
}

function convertMarkdown(content) {
    const fence = /(```[\s\S]*?```)/g;
    return content
        .split(fence)
        .map((segment, i) => (i % 2 === 1 ? segment : replaceOutsideInlineCode(segment)))
        .join('');
}

async function main() {
    const files = [];
    for await (const entry of glob('src/content/docs/**/*.{md,mdx}', {cwd: ROOT})) {
        files.push(entry);
    }

    let changed = 0;

    for (const rel of files.sort()) {
        const filePath = path.join(ROOT, rel);
        const before = await readFile(filePath, 'utf8');
        const after = convertMarkdown(before);
        if (after !== before) {
            await writeFile(filePath, after);
            changed++;
            console.log(rel);
        }
    }

    console.log(`Updated ${changed} file(s).`);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
