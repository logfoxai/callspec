#!/usr/bin/env node
/**
 * One-shot (re-runnable): strip Starlight frontmatter, lead with # Title, use relative .md links.
 */
import {readFile, readdir, writeFile} from 'node:fs/promises';
import {dirname, join, relative} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = join(fileURLToPath(import.meta.url), '..', '..');
const docsRoot = join(root, 'src/content/docs');

async function listMarkdownFiles(dir) {
    const entries = await readdir(dir, {withFileTypes: true});
    const files = [];
    for (const entry of entries) {
        const path = join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...(await listMarkdownFiles(path)));
        } else if (entry.name.endsWith('.md')) {
            files.push(path);
        }
    }
    return files;
}

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

function parseFrontmatter(raw) {
    const match = raw.match(FRONTMATTER);
    if (!match) return {title: null, body: raw};
    const titleLine = match[1].match(/^title:\s*(.+)$/m);
    const title = titleLine?.[1]?.trim().replace(/^['"]|['"]$/g, '') ?? null;
    return {title, body: raw.slice(match[0].length)};
}

function toRelativeMd(fromFile, target) {
    if (target.startsWith('http') || target.startsWith('mailto:')) return target;

    if (target.startsWith('/callspec-flow.svg')) {
        return '../../../assets/callspec-flow.svg';
    }

    if (!target.startsWith('/')) return target;

    const hash = target.includes('#') ? target.slice(target.indexOf('#')) : '';
    const pathPart = target.replace(hash, '').replace(/^\/|\/$/g, '');
    const targetFile = join(docsRoot, `${pathPart}.md`);
    let rel = relative(dirname(fromFile), targetFile);
    if (!rel.startsWith('.')) rel = `./${rel}`;
    return `${rel}${hash}`;
}

function rewriteLinks(body, fromFile) {
    return body.replace(/\]\((\/[^)]+)\)/g, (_, target) => `](${toRelativeMd(fromFile, target)})`);
}

async function convert(file) {
    if (file.endsWith('index.mdx')) return;

    const raw = await readFile(file, 'utf-8');
    const {title, body} = parseFrontmatter(raw);
    if (!title) {
        throw new Error(`Missing title frontmatter: ${file}`);
    }

    let next = body.trimStart();
    if (!next.startsWith(`# ${title}`)) {
        next = `# ${title}\n\n${next}`;
    }

    next = rewriteLinks(next, file);
    await writeFile(file, `${next}\n`);
}

async function main() {
    const files = await listMarkdownFiles(docsRoot);
    for (const file of files) {
        await convert(file);
    }
    console.log(`Converted ${files.length} guide pages.`);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
