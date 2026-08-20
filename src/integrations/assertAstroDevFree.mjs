import net from 'node:net';

/** Starlight default — documented in development.md as http://127.0.0.1:4321 */
export const ASTRO_DEV_PORT = 4321;

export function portInUse(port) {
    return new Promise((resolve) => {
        const socket = net.connect({port, host: '127.0.0.1'});
        socket.once('connect', () => {
            socket.destroy();
            resolve(true);
        });
        socket.once('error', () => {
            resolve(false);
        });
    });
}

export async function assertAstroDevFree(port = ASTRO_DEV_PORT) {
    if (await portInUse(port)) {
        throw new Error(
            `Astro is already running on http://127.0.0.1:${port}. Stop that process before starting another — a second astro:dev wipes .astro and Starlight then reports missing sidebar slugs.`,
        );
    }
}
