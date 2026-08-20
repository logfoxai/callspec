/**
 * Callspec logo lab — 12 craft iterations optimized for nav (~22px) + hero.
 * Open http://127.0.0.1:8765/_logo-lab.html
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'assets');

const HEX =
    'M30.9 4.635A2.2 2.2 0 0 1 33.1 4.635L55.149 17.365A2.2 2.2 0 0 1 56.249 19.27V44.73A2.2 2.2 0 0 1 55.149 46.635L33.1 59.365A2.2 2.2 0 0 1 30.9 59.365L8.851 46.635A2.2 2.2 0 0 1 7.751 44.73V19.27A2.2 2.2 0 0 1 8.851 17.365Z';

const HEX_SHARP = 'M32 4L56.25 18V46L32 60L7.75 46V18Z';

function uid() {
    return `g${Math.random().toString(36).slice(2, 9)}`;
}

function pill(x, y, w, h) {
    const r = h / 2;
    return `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}H${x + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`;
}

function dual(clipId, L, R, hex = HEX) {
    return `<defs>
      <clipPath id="${clipId}"><path d="${hex}"/></clipPath>
      <linearGradient id="${L}" x1="10" y1="8" x2="30" y2="56" gradientUnits="userSpaceOnUse">
        <stop stop-color="#F0ABFC"/><stop offset=".5" stop-color="#C026D3"/><stop offset="1" stop-color="#5B21B6"/>
      </linearGradient>
      <linearGradient id="${R}" x1="34" y1="8" x2="54" y2="56" gradientUnits="userSpaceOnUse">
        <stop stop-color="#A5F3FC"/><stop offset=".5" stop-color="#06B6D4"/><stop offset="1" stop-color="#1D4ED8"/>
      </linearGradient>
    </defs>
    <g clip-path="url(#${clipId})">
      <rect width="32" height="64" fill="url(#${L})"/>
      <rect x="32" width="32" height="64" fill="url(#${R})"/>
    </g>`;
}

function wrap(inner) {
    return `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" fill="none">${inner}</svg>`;
}

/** I01 — Hex with equals cut DIRECTLY (no circle). Bigger features for 16–22px. */
function i01() {
    const c = uid(), L = uid(), R = uid();
    return wrap(`${dual(c, L, R)}
    <path fill="#fff" fill-rule="evenodd" d="${HEX}${pill(18, 24.5, 28, 5.2)}${pill(18, 34.3, 28, 5.2)}"/>`);
}

/** I02 — Hex direct triple bars (spec lines, thick) */
function i02() {
    const c = uid(), L = uid(), R = uid();
    return wrap(`${dual(c, L, R)}
    <path fill="#fff" fill-rule="evenodd" d="${HEX}${pill(20, 22.5, 24, 4.2)}${pill(17, 29.9, 30, 4.2)}${pill(20, 37.3, 24, 4.2)}"/>`);
}

/** I03 — Thick brackets only (brand DNA). Dual gradient arms, open center. */
function i03() {
    const L = uid(), R = uid();
    return wrap(`<defs>
      <linearGradient id="${L}" x1="2" y1="4" x2="28" y2="60" gradientUnits="userSpaceOnUse">
        <stop stop-color="#F0ABFC"/><stop offset="1" stop-color="#7C3AED"/>
      </linearGradient>
      <linearGradient id="${R}" x1="36" y1="4" x2="62" y2="60" gradientUnits="userSpaceOnUse">
        <stop stop-color="#67E8F9"/><stop offset="1" stop-color="#2563EB"/>
      </linearGradient>
    </defs>
    <path fill="url(#${L})" d="M28 6 6 32l22 26 9.5-9.5L22 32 37.5 15.5 28 6Z"/>
    <path fill="url(#${R})" d="M36 6l22 26-22 26-9.5-9.5L42 32 26.5 15.5 36 6Z"/>`);
}

/** I04 — Brackets + equals between (call → typed) */
function i04() {
    const L = uid(), R = uid(), br = uid();
    return wrap(`<defs>
      <linearGradient id="${L}" x1="2" y1="4" x2="24" y2="60" gradientUnits="userSpaceOnUse">
        <stop stop-color="#F0ABFC"/><stop offset="1" stop-color="#7C3AED"/>
      </linearGradient>
      <linearGradient id="${R}" x1="40" y1="4" x2="62" y2="60" gradientUnits="userSpaceOnUse">
        <stop stop-color="#67E8F9"/><stop offset="1" stop-color="#2563EB"/>
      </linearGradient>
      <linearGradient id="${br}" x1="24" y1="0" x2="40" y2="0" gradientUnits="userSpaceOnUse">
        <stop stop-color="#E879F9"/><stop offset="1" stop-color="#22D3EE"/>
      </linearGradient>
    </defs>
    <path fill="url(#${L})" d="M22 8 4 32l18 24 8-8L16 32 30 16 22 8Z"/>
    <path fill="url(#${R})" d="M42 8l18 24-18 24-8-8L48 32 34 16 42 8Z"/>
    <rect x="24" y="25" width="16" height="4.5" rx="2.25" fill="url(#${br})"/>
    <rect x="24" y="34.5" width="16" height="4.5" rx="2.25" fill="url(#${br})"/>`);
}

/** I05 — Soft tile (rounded square) dual + equals knockout — app-icon clear */
function i05() {
    const c = uid(), L = uid(), R = uid();
    const tile = 'M12 8h40a8 8 0 0 1 8 8v32a8 8 0 0 1-8 8H12a8 8 0 0 1-8-8V16a8 8 0 0 1 8-8Z';
    return wrap(`<defs>
      <clipPath id="${c}"><path d="${tile}"/></clipPath>
      <linearGradient id="${L}" x1="8" y1="8" x2="28" y2="56" gradientUnits="userSpaceOnUse">
        <stop stop-color="#F0ABFC"/><stop offset="1" stop-color="#7C3AED"/>
      </linearGradient>
      <linearGradient id="${R}" x1="36" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
        <stop stop-color="#67E8F9"/><stop offset="1" stop-color="#2563EB"/>
      </linearGradient>
    </defs>
    <g clip-path="url(#${c})">
      <rect width="32" height="64" fill="url(#${L})"/>
      <rect x="32" width="32" height="64" fill="url(#${R})"/>
    </g>
    <path fill="#fff" fill-rule="evenodd" d="${tile}${pill(18, 25, 28, 5.5)}${pill(18, 33.5, 28, 5.5)}"/>`);
}

/** I06 — Diamond dual + equals */
function i06() {
    const c = uid(), L = uid(), R = uid();
    const dia = 'M32 4L60 32L32 60L4 32Z';
    return wrap(`<defs>
      <clipPath id="${c}"><path d="${dia}"/></clipPath>
      <linearGradient id="${L}" x1="8" y1="8" x2="30" y2="56" gradientUnits="userSpaceOnUse">
        <stop stop-color="#F0ABFC"/><stop offset="1" stop-color="#7C3AED"/>
      </linearGradient>
      <linearGradient id="${R}" x1="34" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
        <stop stop-color="#67E8F9"/><stop offset="1" stop-color="#2563EB"/>
      </linearGradient>
    </defs>
    <g clip-path="url(#${c})">
      <rect width="32" height="64" fill="url(#${L})"/>
      <rect x="32" width="32" height="64" fill="url(#${R})"/>
    </g>
    <path fill="#fff" fill-rule="evenodd" d="${dia}${pill(20, 25.5, 24, 4.8)}${pill(20, 33.7, 24, 4.8)}"/>`);
}

/** I07 — Apex: thick chevrons + solid white core pill (simple, bold) */
function i07() {
    const L = uid(), R = uid();
    return wrap(`<defs>
      <linearGradient id="${L}" x1="2" y1="4" x2="30" y2="60" gradientUnits="userSpaceOnUse">
        <stop stop-color="#F0ABFC"/><stop offset="1" stop-color="#7C3AED"/>
      </linearGradient>
      <linearGradient id="${R}" x1="34" y1="4" x2="62" y2="60" gradientUnits="userSpaceOnUse">
        <stop stop-color="#67E8F9"/><stop offset="1" stop-color="#2563EB"/>
      </linearGradient>
    </defs>
    <path fill="url(#${L})" d="M26 4 2 32l24 28 12-12L20 32 38 14 26 4Z"/>
    <path fill="url(#${R})" d="M38 4l24 28-24 28-12-12L44 32 26 14 38 4Z"/>
    <rect x="27" y="22" width="10" height="20" rx="5" fill="#fff"/>`);
}

/** I08 — Nav-first: oversized = on hex, almost fills face */
function i08() {
    const c = uid(), L = uid(), R = uid();
    return wrap(`${dual(c, L, R, HEX_SHARP)}
    <path fill="#fff" fill-rule="evenodd" d="${HEX_SHARP}${pill(14, 22, 36, 7)}${pill(14, 35, 36, 7)}"/>`);
}

/** I09 — Split C: heavy C monogram, dual gradient fill via clip */
function i09() {
    const c = uid(), L = uid(), R = uid();
    // C as thick ring missing right opening
    const C =
        'M44 16.5c-4.2-3.8-9.8-6-16-6C16.5 10.5 8 19.8 8 32s8.5 21.5 20 21.5c6.2 0 11.8-2.2 16-6l-5.2-5.8c-2.6 2.2-6 3.5-10.8 3.5-8.2 0-13.8-5.6-13.8-13.2S19.8 18.8 28 18.8c4.8 0 8.2 1.3 10.8 3.5L44 16.5Z';
    return wrap(`<defs>
      <clipPath id="${c}"><path d="${C}"/></clipPath>
      <linearGradient id="${L}" x1="8" y1="10" x2="28" y2="54" gradientUnits="userSpaceOnUse">
        <stop stop-color="#F0ABFC"/><stop offset="1" stop-color="#7C3AED"/>
      </linearGradient>
      <linearGradient id="${R}" x1="30" y1="10" x2="50" y2="54" gradientUnits="userSpaceOnUse">
        <stop stop-color="#67E8F9"/><stop offset="1" stop-color="#2563EB"/>
      </linearGradient>
    </defs>
    <g clip-path="url(#${c})">
      <rect width="32" height="64" fill="url(#${L})"/>
      <rect x="32" width="32" height="64" fill="url(#${R})"/>
    </g>
    <rect x="34" y="28.5" width="18" height="7" rx="3.5" fill="#fff"/>`);
}

/** I10 — Forge bold: left bracket + two thick bars (asymmetric, nav-clear) */
function i10() {
    const L = uid(), R = uid();
    return wrap(`<defs>
      <linearGradient id="${L}" x1="2" y1="4" x2="28" y2="60" gradientUnits="userSpaceOnUse">
        <stop stop-color="#F0ABFC"/><stop offset="1" stop-color="#7C3AED"/>
      </linearGradient>
      <linearGradient id="${R}" x1="30" y1="14" x2="62" y2="50" gradientUnits="userSpaceOnUse">
        <stop stop-color="#67E8F9"/><stop offset="1" stop-color="#2563EB"/>
      </linearGradient>
    </defs>
    <path fill="url(#${L})" d="M26 5 3 32l23 27 11-11L22 32 37 16 26 5Z"/>
    <rect x="30" y="18" width="28" height="9" rx="4.5" fill="url(#${R})"/>
    <rect x="34" y="37" width="24" height="9" rx="4.5" fill="url(#${R})"/>`);
}

/** I11 — Circle seal: dual circle + equals (simplest silhouette at 16px) */
function i11() {
    const c = uid(), L = uid(), R = uid();
    return wrap(`<defs>
      <clipPath id="${c}"><circle cx="32" cy="32" r="28"/></clipPath>
      <linearGradient id="${L}" x1="8" y1="8" x2="30" y2="56" gradientUnits="userSpaceOnUse">
        <stop stop-color="#F0ABFC"/><stop offset="1" stop-color="#7C3AED"/>
      </linearGradient>
      <linearGradient id="${R}" x1="34" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
        <stop stop-color="#67E8F9"/><stop offset="1" stop-color="#2563EB"/>
      </linearGradient>
    </defs>
    <g clip-path="url(#${c})">
      <rect width="32" height="64" fill="url(#${L})"/>
      <rect x="32" width="32" height="64" fill="url(#${R})"/>
    </g>
    <path fill="#fff" fill-rule="evenodd" d="M32 8A24 24 0 1 0 32 56 24 24 0 1 0 32 8Z${pill(18, 25, 28, 5.5)}${pill(18, 33.5, 28, 5.5)}"/>`);
}

/** I12 — Current control: hex + circle + equals (known weak at nav) */
function i12() {
    const c = uid(), L = uid(), R = uid();
    return wrap(`${dual(c, L, R)}
    <path fill="#fff" fill-rule="evenodd" d="M32 18.8A13.2 13.2 0 1 0 32 45.2 13.2 13.2 0 1 0 32 18.8Z${pill(23.5, 27.4, 17, 3.4)}${pill(23.5, 33.2, 17, 3.4)}"/>`);
}

const iterations = [
    {id: 'i01', name: '01 Direct equals', note: 'Hex + = cut into face. No nested circle. Nav-first.', fn: i01},
    {id: 'i02', name: '02 Direct triple', note: 'Hex + 3 thick bars. Spec lines.', fn: i02},
    {id: 'i03', name: '03 Bracket pair', note: 'Pure <>. Brand DNA. Maximum clarity.', fn: i03},
    {id: 'i04', name: '04 Brackets + =', note: '<> with equals between.', fn: i04},
    {id: 'i05', name: '05 Soft tile', note: 'Rounded square seal. App-icon clear.', fn: i05},
    {id: 'i06', name: '06 Diamond', note: 'Diamond + equals.', fn: i06},
    {id: 'i07', name: '07 Apex core', note: 'Chevrons + solid pill. Very bold.', fn: i07},
    {id: 'i08', name: '08 Giant equals', note: 'Sharp hex, oversized =. Reads at 16px.', fn: i08},
    {id: 'i09', name: '09 Split C', note: 'C monogram + bar. Lettermark.', fn: i09},
    {id: 'i10', name: '10 Forge', note: 'Call bracket → typed bars. Directional.', fn: i10},
    {id: 'i11', name: '11 Circle seal', note: 'Round dual + =. Softest silhouette.', fn: i11},
    {id: 'i12', name: '12 Control (old)', note: 'Hex+circle+=. Too nested for nav.', fn: i12},
];

const data = iterations.map((it) => {
    const dark = it.fn();
    const light = dark.replaceAll('fill="#fff"', 'fill="#0B1220"');
    return {id: it.id, name: it.name, note: it.note, dark, light};
});

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>Callspec · 12 iterations</title>
<style>
  :root{--bg:#05060a;--fg:#f1f5f9;--muted:#94a3b8;--line:#1e293b;--nav:#0a0c12}
  *{box-sizing:border-box}
  body{margin:0;padding:1.25rem;background:var(--bg);color:var(--fg);font-family:ui-sans-serif,system-ui,sans-serif}
  h1{font-size:.7rem;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);margin:0 0 .35rem}
  .lede{color:var(--muted);font-size:.85rem;margin:0 0 1.25rem;max-width:48rem;line-height:1.45}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:.85rem}
  .card{border:1px solid var(--line);border-radius:16px;background:#0b1220;overflow:hidden}
  .card.pick{border-color:#c084fc99;box-shadow:0 0 0 1px #a855f755}
  .navsim{background:var(--nav);border-bottom:1px solid var(--line);padding:.55rem .85rem;display:flex;align-items:center;gap:.55rem}
  .navsim .mark{height:1.35rem;width:1.35rem}
  .navsim .mark svg{width:100%;height:100%;display:block}
  .navsim .wm{font-weight:800;font-size:.95rem;letter-spacing:-.03em}
  .navsim.big .mark{height:1.85rem;width:1.85rem}
  .navsim.big .wm{font-size:1.1rem}
  .stage{height:200px;display:grid;place-items:center;background:radial-gradient(circle at 40% 40%,#4c1d9540,transparent 55%),#03040a}
  .stage svg{width:140px;height:140px}
  .body{padding:.85rem .95rem 1rem}
  h2{margin:0 0 .25rem;font-size:.95rem}
  p{margin:0 0 .7rem;font-size:.72rem;color:var(--muted);line-height:1.4;min-height:2.3em}
  .pair{display:grid;grid-template-columns:1fr 1fr;gap:.4rem;margin-bottom:.5rem}
  .sw{aspect-ratio:1;border-radius:10px;display:grid;place-items:center;border:1px solid var(--line)}
  .sw.d{background:#000}.sw.l{background:#e8edf5}
  .sw svg{width:64%;height:64%}
  .sizes{display:flex;gap:.75rem;align-items:center;padding:.45rem .65rem;background:#000;border-radius:10px;border:1px solid var(--line)}
  .sizes > div{display:grid}
  .sizes svg{width:100%;height:100%;display:block}
  .s16{width:16px;height:16px}.s22{width:22px;height:22px}.s32{width:32px;height:32px}.s48{width:48px;height:48px}
  .tag{display:inline-block;font-size:.6rem;letter-spacing:.08em;text-transform:uppercase;color:#e9d5ff;background:#581c8788;border:1px solid #a855f766;padding:.12rem .4rem;border-radius:999px;margin-bottom:.35rem}
</style>
</head>
<body>
<h1>Callspec · 12 iterations — nav scale first</h1>
<p class="lede">Starlight nav logo is ~1.35rem (~22px). Nested hex+circle+= dies there. Each card shows a fake nav bar at 1.35rem and 1.85rem, then favicon sizes, then hero.</p>
<div class="grid" id="grid"></div>
<script>
const DATA = ${JSON.stringify(data)};
const pick = new URLSearchParams(location.search).get('pick');
document.getElementById('grid').innerHTML = DATA.map(it => {
  const isPick = pick === it.id;
  return \`<article class="card\${isPick?' pick':''}" id="\${it.id}">
    <div class="navsim">
      <div class="mark">\${it.dark}</div><span class="wm">callspec</span>
    </div>
    <div class="navsim big">
      <div class="mark">\${it.dark}</div><span class="wm">callspec</span>
    </div>
    <div class="stage">\${it.dark}</div>
    <div class="body">
      \${isPick?'<span class="tag">Selected</span>':''}
      <h2>\${it.name}</h2>
      <p>\${it.note}</p>
      <div class="pair"><div class="sw d">\${it.dark}</div><div class="sw l">\${it.light}</div></div>
      <div class="sizes">
        <div class="s16">\${it.dark}</div>
        <div class="s22">\${it.dark}</div>
        <div class="s32">\${it.dark}</div>
        <div class="s48">\${it.dark}</div>
      </div>
    </div>
  </article>\`;
}).join('');
</script>
</body>
</html>`;

fs.writeFileSync(path.join(root, '_logo-lab.html'), html);
console.log('wrote', path.join(root, '_logo-lab.html'), 'iterations:', data.length);
