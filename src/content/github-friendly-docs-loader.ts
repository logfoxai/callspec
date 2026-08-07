import {readFile} from 'node:fs/promises';
import {docsLoader} from '@astrojs/starlight/loaders';
import type {Loader} from 'astro/loaders';

/**
 * Starlight requires frontmatter `title`; guide sources use a GitHub-friendly `# Title`
 * instead. Inject title from the first markdown heading before schema validation.
 */
export function githubFriendlyDocsLoader(): Loader {
    const inner = docsLoader();

    return {
        name: 'github-friendly-docs-loader',
        load: async (context) => {
            const parseData = context.parseData.bind(context);

            context.parseData = async (props) => {
                const {data, filePath} = props;

                if (!data.title && filePath?.endsWith('.md')) {
                    const contents = await readFile(filePath, 'utf-8');
                    if (!contents.startsWith('---')) {
                        const match = contents.match(/^# (.+)\r?\n/);
                        if (match) {
                            return parseData({...props, data: {...data, title: match[1]}});
                        }
                    }
                }

                return parseData(props);
            };

            return inner.load(context);
        },
    };
}
