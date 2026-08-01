export function routePath(basePath: string, name: string): string {

    return `${basePath}/${name}`.replace(/\/{2,}/g, '/');

}
