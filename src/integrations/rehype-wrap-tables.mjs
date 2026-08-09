import {visit} from 'unist-util-visit';

function classList(node) {
    const value = node?.properties?.className;
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') return value.split(/\s+/).filter(Boolean);
    return [];
}

/**
 * Wrap every content `<table>` in `.cs-table-scroll` so wide grids can
 * scroll horizontally without crushing columns (`display: table` preserved).
 */
export function rehypeWrapTables() {
    return (tree) => {
        visit(tree, 'element', (node, index, parent) => {
            if (node.tagName !== 'table' || parent == null || index == null) {
                return;
            }
            if (parent.tagName === 'div' && classList(parent).includes('cs-table-scroll')) {
                return;
            }

            parent.children[index] = {
                type: 'element',
                tagName: 'div',
                properties: {className: ['cs-table-scroll']},
                children: [node],
            };
        });
    };
}
