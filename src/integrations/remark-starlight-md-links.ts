import path from 'node:path';
import type {Link, Root} from 'mdast';
import type {Plugin} from 'unified';
import type {VFile} from 'vfile';

const DOCS_SEGMENT = `${path.sep}src${path.sep}content${path.sep}docs${path.sep}`;

/**
 * Rewrite GitHub-friendly `./page.md` links to Starlight slugs (`/page/`) at build time.
 * Source files keep `.md` extensions for GitHub browsing.
 */
function toStarlightSlug(filePath: string, url: string): string | null {
    const hashIndex = url.indexOf('#');
    const pathPart = hashIndex === -1 ? url : url.slice(0, hashIndex);
    const hash = hashIndex === -1 ? '' : url.slice(hashIndex);

    if (!pathPart.endsWith('.md')) return null;
    if (/^[a-z][a-z0-9+.-]*:/i.test(pathPart)) return null;

    const docsIndex = filePath.indexOf(DOCS_SEGMENT);
    if (docsIndex === -1) return null;

    const docsRoot = filePath.slice(0, docsIndex + DOCS_SEGMENT.length);
    const sourceDir = path.dirname(filePath);
    const targetPath = path.resolve(sourceDir, pathPart);

    if (!targetPath.startsWith(docsRoot)) return null;

    const slug = path
        .relative(docsRoot, targetPath)
        .replace(/\.md$/, '')
        .split(path.sep)
        .join('/');

    return `/${slug}/${hash}`;
}

function visitLinks(node: unknown, visitor: (link: Link) => void): void {
    if (!node || typeof node !== 'object') return;
    const tree = node as {type?: string; url?: string; children?: unknown[]};
    if (tree.type === 'link' && typeof tree.url === 'string') {
        visitor(tree as Link);
    }
    if (Array.isArray(tree.children)) {
        for (const child of tree.children) visitLinks(child, visitor);
    }
}

export function remarkStarlightMdLinks(): Plugin<[undefined], Root> {
    return (tree, file) => {
        const vfile = file as VFile;
        if (!vfile.path?.includes(DOCS_SEGMENT)) return;

        visitLinks(tree, (link) => {
            const rewritten = toStarlightSlug(vfile.path!, link.url);
            if (rewritten) link.url = rewritten;
        });
    };
}
