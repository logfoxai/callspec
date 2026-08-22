import net from 'node:net';

/** Starlight default — documented in development.md as http://127.0.0.1:4321 */
export const ASTRO_DEV_PORT = 4321;

/** Astro increments when 4321 is taken — scan the usual fallback range. */
export const ASTRO_DEV_PORT_MAX = 4330;

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

export async function astroDevPortsInUse(
    from = ASTRO_DEV_PORT,
    to = ASTRO_DEV_PORT_MAX,
) {
    const busy = [];

    for (let port = from; port <= to; port++) {
        if (await portInUse(port)) {
            busy.push(port);
        }
    }

    return busy;
}

function astroDevBusyMessage(ports) {
    const primary = ports[0];
    const also = ports.length > 1 ? ` (also ${ports.slice(1).join(', ')})` : '';

    return (
        `Astro dev appears to be running on http://127.0.0.1:${primary}${also}. ` +
        'Stop it before starting another or running astro:build — wiping .astro while dev is up breaks Starlight sidebar slugs.'
    );
}

export async function assertAstroDevFree(port) {
    if (port !== undefined) {
        if (await portInUse(port)) {
            throw new Error(astroDevBusyMessage([port]));
        }

        return;
    }

    const busy = await astroDevPortsInUse();

    if (busy.length > 0) {
        throw new Error(astroDevBusyMessage(busy));
    }
}
