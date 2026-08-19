#!/usr/bin/env node
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {cleanAstroCache} from '../src/integrations/cleanAstroCache.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

cleanAstroCache(root);
console.log('clean-astro-cache: wiped .astro and node_modules/.vite');
