/** Browser tab title — `{meta.title} - Callspec`. */
export function callspecDocumentTitle(metaTitle: string | undefined): string {

    const title = metaTitle?.trim();

    if (!title) {

        return 'Callspec';

    }

    return `${title} - Callspec`;

}
