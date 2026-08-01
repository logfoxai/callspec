import type {CallspecDocument} from '../callspecDocumentTypes';
import type {CallspecUiRoute, CallspecUiSpec} from './types';

export function callspecDocumentToUiSpec(doc: CallspecDocument): CallspecUiSpec {

    const routes: CallspecUiRoute[] = Object.values(doc.routes)
        .map((route) => ({
            name: route.name,
            summary: route.summary,
            description: route.description,
            tags: [...route.tags],
            access: route.access,
            mcp: route.mcp.enabled,
            inputSchema: route.input,
            outputSchema: route.output,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

    return {
        title: doc.info.title,
        version: doc.info.version,
        routes,
    };

}
