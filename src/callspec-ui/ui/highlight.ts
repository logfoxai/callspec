import hljs from 'highlight.js/lib/core';
import json from 'highlight.js/lib/languages/json';

hljs.registerLanguage('json', json);

export function highlightJson(source: string): string {

    try {

        return hljs.highlight(source, {language: 'json'}).value;

    } catch {

        return source
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

    }

}

export function codeBlock(source: string, id?: string): string {

    const idAttr = id ? ` id="${id}"` : '';

    return `<pre class="code-block"${idAttr}><code class="hljs language-json">${highlightJson(source)}</code></pre>`;

}
