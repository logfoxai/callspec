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

export function codeBlock(source: string): string {

    return `<pre class="code-block"><code class="hljs language-json">${highlightJson(source)}</code></pre>`;

}
