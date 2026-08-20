/**
 * Three clean directions — no dual-gradient bracket noise.
 * node scripts/logo-pick.mjs && npx serve assets -p 8765
 * Open http://127.0.0.1:8765/_logo-pick.html
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const assets = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'assets');

const HEX =
    'M30.9 4.635A2.2 2.2 0 0 1 33.1 4.635L55.149 17.365A2.2 2.2 0 0 1 56.249 19.27V44.73A2.2 2.2 0 0 1 55.149 46.635L33.1 59.365A2.2 2.2 0 0 1 30.9 59.365L8.851 46.635A2.2 2.2 0 0 1 7.751 44.73V19.27A2.2 2.2 0 0 1 8.851 17.365Z';

function pill(x, y, w, h) {
    const r = h / 2;
    return `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}H${x + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`;
}

function markSpecFixed(accent) {
    const eq = `${pill(16, 24, 32, 6)}${pill(16, 34, 32, 6)}`;
    return `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" fill="none">
  <path fill="${accent}" fill-rule="evenodd" d="${HEX}${eq}"/>
</svg>`;
}

/** C — route: monoline write-once → serve */
function markRoute(stroke = '#22D3EE', bg = 'none') {
    const bgEl =
        bg === 'none'
            ? ''
            : `<rect x="8" y="8" width="48" height="48" rx="12" fill="${bg}" opacity="0.15"/>`;
    return `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" fill="none">
  ${bgEl}
  <circle cx="14" cy="32" r="5" fill="${stroke}"/>
  <path d="M22 32H38" stroke="${stroke}" stroke-width="5" stroke-linecap="round"/>
  <path d="M38 32l10-10v20l-10-10Z" fill="${stroke}"/>
</svg>`;
}

/** B — wordmark-only lockups (HTML/CSS, no icon) */
const wordmarks = {
    split: `<span class="wm wm-split"><span class="call">call</span><span class="spec">spec</span></span>`,
    accent: `<span class="wm wm-accent">call<span class="eq">=</span>spec</span>`,
    plain: `<span class="wm wm-plain">callspec</span>`,
};

const directions = [
    {
        id: 'spec',
        title: '1 · Spec mark',
        pitch: 'Hex seal with a bold equals cutout. One accent color — no gradient arms. Says “typed contract” at a glance.',
        marks: {
            dark: markSpecFixed('#22D3EE'),
            light: markSpecFixed('#0284C7'),
        },
    },
    {
        id: 'wordmark',
        title: '2 · Wordmark only',
        pitch: 'Drop the nav icon entirely. Typography carries the brand — lighter “call”, heavier “spec”, or call=spec ligature.',
        marks: null,
        wordmarkVariants: [
            {id: 'split', label: 'call + spec', html: wordmarks.split},
            {id: 'accent', label: 'call=spec', html: wordmarks.accent},
            {id: 'plain', label: 'plain bold', html: wordmarks.plain},
        ],
    },
    {
        id: 'route',
        title: '3 · Route arrow',
        pitch: 'Monoline dot → arrow. “Write once, serve everywhere” without brackets or gradients.',
        marks: {
            dark: markRoute('#22D3EE'),
            light: markRoute('#0284C7'),
        },
    },
];

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>Callspec · pick a direction</title>
<style>
  :root{--bg:#05060a;--fg:#f1f5f9;--muted:#94a3b8;--line:#1e293b;--nav:#0a0c12;--accent:#22d3ee}
  *{box-sizing:border-box}
  body{margin:0;padding:1.5rem;background:var(--bg);color:var(--fg);font-family:ui-sans-serif,system-ui,sans-serif}
  h1{font-size:1.1rem;margin:0 0 .35rem;letter-spacing:-.02em}
  .lede{color:var(--muted);font-size:.9rem;margin:0 0 1.5rem;max-width:42rem;line-height:1.5}
  .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem}
  @media(max-width:960px){.grid{grid-template-columns:1fr}}
  .card{border:1px solid var(--line);border-radius:18px;background:#0b1220;overflow:hidden;display:flex;flex-direction:column}
  .card:hover{border-color:#334155}
  .nav{background:var(--nav);border-bottom:1px solid var(--line);padding:.65rem 1rem;display:flex;align-items:center;gap:.6rem;min-height:3.5rem}
  .nav .mark{width:2rem;height:2rem;flex-shrink:0}
  .nav .mark svg{width:100%;height:100%;display:block}
  .hero{flex:1;min-height:220px;display:grid;place-items:center;background:radial-gradient(ellipse 90% 55% at 50% 0%, hsl(210 80% 40% / .25), transparent 60%), #07080c}
  .hero .mark svg{width:120px;height:120px}
  .hero .wm-only{font-size:2.4rem}
  .body{padding:1rem 1.1rem 1.25rem}
  h2{margin:0 0 .4rem;font-size:1rem}
  .pitch{margin:0 0 1rem;font-size:.78rem;color:var(--muted);line-height:1.45;min-height:3.2em}
  .wm{font-weight:800;font-size:1.05rem;letter-spacing:-.04em;line-height:1}
  .wm-split .call{font-weight:500;color:#94a3b8}
  .wm-split .spec{font-weight:800;color:#f8fafc}
  .wm-accent .eq{color:var(--accent);font-weight:700;margin:0 .02em}
  .wm-plain{font-weight:800;color:#f8fafc}
  .wm-row{display:flex;flex-direction:column;gap:.55rem;margin-bottom:.75rem}
  .wm-row .nav{background:transparent;border:1px solid var(--line);border-radius:10px;padding:.55rem .75rem;min-height:auto}
  .sizes{display:flex;gap:.6rem;align-items:center;padding:.5rem .65rem;background:#000;border-radius:10px;border:1px solid var(--line)}
  .sizes svg{display:block}
  .s16{width:16px;height:16px}.s22{width:22px;height:22px}.s32{width:32px;height:32px}
  .tag{font-size:.65rem;text-transform:uppercase;letter-spacing:.1em;color:var(--accent);margin-bottom:.5rem;display:block}
</style>
</head>
<body>
<h1>Three directions — pick what feels least wrong</h1>
<p class="lede">Same nav bar height as Starlight (2rem mark). No magenta/cyan bracket mashup. Click isn’t wired — just tell me “1”, “2”, or “3” (or “2 split”, etc.).</p>
<div class="grid">
${directions
    .map((d) => {
        if (d.id === 'wordmark') {
            const rows = d.wordmarkVariants
                .map(
                    (v) => `<div class="nav wm-row"><span class="tag">${v.label}</span>${v.html}</div>`,
                )
                .join('');
            return `<article class="card">
    <div class="nav">${d.wordmarkVariants[0].html}</div>
    <div class="hero wm-only">${d.wordmarkVariants[1].html}</div>
    <div class="body">
      <h2>${d.title}</h2>
      <p class="pitch">${d.pitch}</p>
      ${rows}
    </div>
  </article>`;
        }
        return `<article class="card">
    <div class="nav"><div class="mark">${d.marks.dark}</div><span class="wm">callspec</span></div>
    <div class="hero"><div class="mark">${d.marks.dark}</div></div>
    <div class="body">
      <h2>${d.title}</h2>
      <p class="pitch">${d.pitch}</p>
      <div class="sizes">
        <div class="s16">${d.marks.dark}</div>
        <div class="s22">${d.marks.dark}</div>
        <div class="s32">${d.marks.dark}</div>
      </div>
    </div>
  </article>`;
    })
    .join('\n')}
</div>
</body>
</html>`;

fs.writeFileSync(path.join(assets, '_logo-pick.html'), html);
console.log('wrote', path.join(assets, '_logo-pick.html'));
