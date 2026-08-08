import {defineCollection} from 'astro:content';
import {i18nLoader} from '@astrojs/starlight/loaders';
import {docsSchema, i18nSchema} from '@astrojs/starlight/schema';
import {githubFriendlyDocsLoader} from './content/github-friendly-docs-loader';

export const collections = {
    docs: defineCollection({loader: githubFriendlyDocsLoader(), schema: docsSchema()}),
    i18n: defineCollection({loader: i18nLoader(), schema: i18nSchema()}),
};
