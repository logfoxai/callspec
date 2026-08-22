import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const FONTS_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../../assets/fonts');
const LIB_FONT = /url\((['"])\/fonts\/([^'"]+\.woff2)\1\)/g;
const CSS_IMPORT = /@import\s+[^;]+;\s*/g;

/**
 * Lib-mode path so Vite emits woff2 files instead of leaving absolute /fonts/ urls.
 */
export function rewritePublicFontsForLibBuild(css: string, fromFile: string): string {
    const rel = path.relative(path.dirname(fromFile), FONTS_DIR).replaceAll('\\', '/');

    return css.replace(
        LIB_FONT,
        (_all, quote: string, file: string) => `url(${quote}${rel}/${file}?no-inline${quote})`,
    );
}

export interface ExplorerCssRewrite {
    code: string;
    map: null;
}

/**
 * Vite 8 inlines `@import './docs-tokens.css'` from disk, so rewrite that file
 * into styles.css and hoist remaining @imports before @font-face.
 */
export function rewriteExplorerCss(code: string, id: string): ExplorerCssRewrite | null {
    const file = id.split('?')[0];

    if (!file.endsWith('styles.css') || !code.includes('docs-tokens.css')) {
        return null;
    }

    const tokensPath = path.join(path.dirname(file), 'docs-tokens.css');
    const hoisted: string[] = [];
    let tokens = rewritePublicFontsForLibBuild(fs.readFileSync(tokensPath, 'utf8'), tokensPath);

    tokens = tokens.replace(CSS_IMPORT, (statement) => {
        hoisted.push(statement.trim());
        return '';
    });

    let next = code.replace(/@import\s+['"][^'"]*docs-tokens\.css['"];?\s*/, `${tokens}\n`);

    next = next.replace(CSS_IMPORT, (statement) => {
        hoisted.push(statement.trim());
        return '';
    });

    return {code: `${hoisted.join('\n')}\n${next}`, map: null};
}
