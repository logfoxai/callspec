import {defineCollection} from 'astro:content';
import {docsSchema} from '@astrojs/starlight/schema';
import {githubFriendlyDocsLoader} from './content/github-friendly-docs-loader';

export const collections = {
    docs: defineCollection({loader: githubFriendlyDocsLoader(), schema: docsSchema()}),
};
