import path from 'node:path';

const DOCS_SEGMENT = `${path.sep}src${path.sep}content${path.sep}docs${path.sep}`;

/**
 * Rewrite GitHub-friendly `./page.md` links to Starlight slugs (`/page/`) at build time.
 * Source files keep `.md` extensions for GitHub browsing.
 */
function toStarlightSlug(filePath, url) {
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

function visitLinks(node, visitor) {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'link' && typeof node.url === 'string') visitor(node);
    if (Array.isArray(node.children)) {
        for (const child of node.children) visitLinks(child, visitor);
    }
}

/** @returns {import('unified').Plugin} */
export function remarkStarlightMdLinks() {
    return (tree, file) => {
        if (!file.path?.includes(DOCS_SEGMENT)) return;

        visitLinks(tree, (link) => {
            const rewritten = toStarlightSlug(file.path, link.url);
            if (rewritten) link.url = rewritten;
        });
    };
}
