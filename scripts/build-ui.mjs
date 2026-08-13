import crypto from 'crypto';
import {createRequire} from 'module';
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';
import {build} from 'vite';

const require = createRequire(import.meta.url);
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

const interFont = require.resolve('@fontsource-variable/inter/files/inter-latin-wght-normal.woff2');
const spaceGroteskFont = require.resolve(
    '@fontsource-variable/space-grotesk/files/space-grotesk-latin-wght-normal.woff2',
);

fs.copyFileSync(interFont, path.join(assetDir, 'inter.woff2'));
fs.copyFileSync(spaceGroteskFont, path.join(assetDir, 'space-grotesk.woff2'));

const appJs = path.join(assetDir, 'app.js');

if (!fs.existsSync(appJs) || fs.statSync(appJs).size < 100) {

    throw new Error('callspec UI build did not emit app.js');

}

const styleCss = path.join(assetDir, 'style.css');
const appHashed = `app.${contentHash(appJs)}.js`;
const styleHashed = `style.${contentHash(styleCss)}.css`;

fs.renameSync(appJs, path.join(assetDir, appHashed));
fs.renameSync(styleCss, path.join(assetDir, styleHashed));

const indexTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API Docs</title>
    <script>(function(){var t=localStorage.getItem('starlight-theme');if(t!=='light'&&t!=='dark'){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.dataset.theme=t;})();</script>
    <link rel="preload" href="./assets/inter.woff2" as="font" type="font/woff2" crossorigin>
    <link rel="preload" href="./assets/space-grotesk.woff2" as="font" type="font/woff2" crossorigin>
    <link rel="stylesheet" href="./assets/${styleHashed}">
    <!--CALLSPEC_UI_CONFIG-->
</head>
<body>
    <div id="app" class="loading">
        <p class="loading-text">Loading…</p>
    </div>
    <footer class="footer">
        <a class="footer-link" href="https://github.com/logfoxai/callspec" target="_blank" rel="noopener">
            <span class="footer-label">Powered by</span>
            <img class="footer-logo footer-logo-light" src="./assets/mark-light.svg" width="18" height="18" alt="">
            <img class="footer-logo footer-logo-dark" src="./assets/mark-dark.svg" width="18" height="18" alt="">
            <span class="footer-name">callspec</span>
        </a>
    </footer>
    <script src="./assets/${appHashed}"></script>
</body>
</html>
`;

fs.writeFileSync(path.join(uiOut, 'index.html'), indexTemplate);
