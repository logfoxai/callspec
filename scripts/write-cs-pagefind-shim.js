"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeCsPagefindShim = writeCsPagefindShim;
const promises_1 = __importDefault(require("node:fs/promises"));
const node_path_1 = __importDefault(require("node:path"));
const node_url_1 = require("node:url");
const esbuild = __importStar(require("esbuild"));
const engineSpecifier = '../pagefind/pagefind.js';
async function writeCsPagefindShim(root) {
    const repoRoot = root ?? node_path_1.default.join(node_path_1.default.dirname((0, node_url_1.fileURLToPath)(import.meta.url)), '..');
    const outDir = node_path_1.default.join(repoRoot, 'docs-site');
    const enginePath = node_path_1.default.join(outDir, 'pagefind', 'pagefind.js');
    const outfile = node_path_1.default.join(outDir, 'cs-pagefind', 'pagefind.js');
    const entry = node_path_1.default.join(repoRoot, 'src', 'cs-pagefind', 'pagefind.ts');
    try {
        await promises_1.default.access(enginePath);
    }
    catch {
        console.error('write-cs-pagefind-shim: no pagefind index at', enginePath);
        process.exit(1);
    }
    await esbuild.build({
        entryPoints: [entry],
        bundle: true,
        format: 'esm',
        platform: 'browser',
        outfile,
        // Keep the real engine as a runtime import next to the shim.
        external: [engineSpecifier],
        logLevel: 'silent',
    });
    console.log('write-cs-pagefind-shim: wrote', node_path_1.default.relative(repoRoot, outfile));
}
const isMain = process.argv[1] && (0, node_url_1.fileURLToPath)(import.meta.url) === node_path_1.default.resolve(process.argv[1]);
if (isMain) {
    writeCsPagefindShim().catch((err) => {
        console.error(err);
        process.exit(1);
    });
}
