import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';
import {build} from 'vite';
import {injectChirpDemoBoot, renderLoadingAppHtml} from '../src/callspec-ui/ui/loadingShell.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const uiOut = path.join(root, '..', 'dist', 'callspec-ui', 'ui');

function contentHash(filePath) {

    return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex').slice(0, 8);

}

await build({
    configFile: path.join(root, '..', 'vite.config.mts'),
});

const assetDir = path.join(uiOut, 'assets');
const cssFile = fs.readdirSync(assetDir).find((name) => name.endsWith('.css'));

if (!cssFile) {

    throw new Error('callspec UI build did not emit CSS');

}

if (cssFile !== 'style.css') {

    fs.renameSync(path.join(assetDir, cssFile), path.join(assetDir, 'style.css'));

}

const brandAssets = [
    'mark-light.svg',
    'mark-dark.svg',
];

for (const name of brandAssets) {

    fs.copyFileSync(
        path.join(root, '..', 'assets', name),
        path.join(assetDir, name),
    );

}

const fontFiles = fs.readdirSync(assetDir).filter((name) => name.endsWith('.woff2')).sort();

if (fontFiles.length < 2) {

    throw new Error('callspec UI build did not emit font files');

}

const fontPreloads = fontFiles
    .map((name) => `    <link rel="preload" href="./assets/${name}" as="font" type="font/woff2" crossorigin>`)
    .join('\n');

const appJs = path.join(assetDir, 'app.js');

if (!fs.existsSync(appJs) || fs.statSync(appJs).size < 100) {

    throw new Error('callspec UI build did not emit app.js');

}

const styleCss = path.join(assetDir, 'style.css');
const appHashed = `app.${contentHash(appJs)}.js`;
const styleHashed = `style.${contentHash(styleCss)}.css`;

fs.renameSync(appJs, path.join(assetDir, appHashed));
fs.renameSync(styleCss, path.join(assetDir, styleHashed));

const indexTemplate = injectChirpDemoBoot(`<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API Docs</title>
${fontPreloads}
    <link rel="stylesheet" href="./assets/${styleHashed}">
    <!--CALLSPEC_UI_CONFIG-->
</head>
<body>
    ${renderLoadingAppHtml()}
    <footer class="footer">
        <span class="footer-label">Powered by</span>
    </footer>
    <script src="./assets/${appHashed}"></script>
</body>
</html>
`);

fs.writeFileSync(path.join(uiOut, 'index.html'), indexTemplate);
