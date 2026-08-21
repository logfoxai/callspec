import type {Element, Root} from 'hast';
import type {Plugin} from 'unified';
import {visit} from 'unist-util-visit';

function classList(node: Element | undefined): string[] {
    const value = node?.properties?.className;
    if (Array.isArray(value)) return value.filter((entry): entry is string => typeof entry === 'string');
    if (typeof value === 'string') return value.split(/\s+/).filter(Boolean);
    return [];
}

/**
 * Wrap every content `<table>` in `.cs-table-scroll` so wide grids can
 * scroll horizontally without crushing columns (`display: table` preserved).
 */
export function rehypeWrapTables(): Plugin<[undefined], Root> {
    return (tree) => {
        visit(tree, 'element', (node, index, parent) => {
            if (node.tagName !== 'table' || parent == null || index == null) {
                return;
            }
            const parentElement = parent as Element;
            if (parentElement.tagName === 'div' && classList(parentElement).includes('cs-table-scroll')) {
                return;
            }

            parentElement.children[index] = {
                type: 'element',
                tagName: 'div',
                properties: {className: ['cs-table-scroll']},
                children: [node],
            };
        });
    };
}
