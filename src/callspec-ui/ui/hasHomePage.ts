import type {CallspecUiBranding} from '../branding';

function nonempty(value: string | undefined): boolean {

    return Boolean(value?.trim());

}

/** Home only when intro, website, or SDK install would show something. */
export function hasHomePage(branding: CallspecUiBranding | undefined): boolean {

    return nonempty(branding?.intro)
        || nonempty(branding?.websiteUrl)
        || nonempty(branding?.sdkInstall);

}
