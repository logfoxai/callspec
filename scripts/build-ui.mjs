import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';
import {build} from 'vite';

const root = path.dirname(fileURLToPath(import.meta.url));
const uiOut = path.join(root, '..', 'dist', 'callspec-ui', 'ui');

const indexTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API Docs</title>
    <script>(function(){var t=localStorage.getItem('callspec-ui-theme');if(t!=='light'&&t!=='dark'){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.dataset.theme=t;})();</script>
    <link rel="stylesheet" href="./assets/style.css">
    <!--CALLSPEC_UI_CONFIG-->
</head>
<body>
    <div id="app" class="loading">
        <p class="loading-text">Loading…</p>
    </div>
    <footer class="footer">
        <a class="footer-link" href="https://github.com/logfoxai/callspec" target="_blank" rel="noopener">
            <span class="footer-label">Powered by</span>
            <img class="footer-logo footer-logo-light" src="./assets/mark-light.png" width="18" height="18" alt="">
            <img class="footer-logo footer-logo-dark" src="./assets/mark-dark.png" width="18" height="18" alt="">
            <span class="footer-name">callspec</span>
        </a>
    </footer>
    <script src="./assets/app.js"></script>
</body>
</html>
`;

await build({
    configFile: path.join(root, '..', 'vite.config.ts'),
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
    'mark-light.png',
    'mark-dark.png',
];

for (const name of brandAssets) {

    fs.copyFileSync(
        path.join(root, '..', 'assets', name),
        path.join(assetDir, name),
    );

}

const appJs = path.join(assetDir, 'app.js');

if (!fs.existsSync(appJs) || fs.statSync(appJs).size < 100) {

    throw new Error('callspec UI build did not emit app.js');

}

fs.writeFileSync(path.join(uiOut, 'index.html'), indexTemplate);
