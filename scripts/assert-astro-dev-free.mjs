#!/usr/bin/env node
import {assertAstroDevFree} from '../src/integrations/assertAstroDevFree.mjs';

try {
    await assertAstroDevFree();
} catch (err) {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
}
