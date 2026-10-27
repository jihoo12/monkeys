import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { DEMO_PROFILES, demoHistory, type DemoProfile } from '../src/data/demo.ts';
import { simulateCivilization } from '../src/sim/engine.ts';
import { renderCivilization } from '../src/render/render.ts';
import { checkSvgCompatibility } from '../src/compat.ts';
import { formatNumber } from '../src/util/date.ts';

const profiles: DemoProfile[] = ['stone', 'medieval', 'industrial', 'modern', 'space'];
const outputDir = resolve('examples/ages');
await mkdir(outputDir, { recursive: true });

const cards: string[] = [];
for (const profile of profiles) {
  const history = demoHistory(profile);
  const state = simulateCivilization(history);
  const svg = renderCivilization(state, history);
  const report = checkSvgCompatibility(svg);
  const path = resolve(outputDir, `${profile}.svg`);
  await writeFile(path, `${svg}\n`, 'utf8');
  cards.push(`<article class="card">
  <a href="ages/${profile}.svg"><img src="ages/${profile}.svg" alt="${state.age.name} monkey civilization"></a>
  <div class="meta">
    <strong>${state.age.name}</strong>
    <span>${DEMO_PROFILES[profile].label}</span>
    <span>${formatNumber(history.totalContributions)} contributions · population ${state.population} · ${formatNumber(state.bananas)} bananas</span>
    <span>${report.ok ? 'GitHub compatibility: pass' : 'GitHub compatibility: FAIL'}</span>
  </div>
</article>`);
  if (!report.ok) {
    console.error(`Compatibility check failed for ${profile}`);
    process.exitCode = 1;
  }
}

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Monkey Civilization - age gallery</title>
<style>
  :root { color-scheme: dark; }
  body { margin: 0; padding: 32px; background: #100c17; color: #fff4d6; font: 16px/1.5 ui-monospace, SFMono-Regular, Menlo, monospace; }
  h1 { margin: 0 0 4px; font-size: 28px; }
  p { margin: 0 0 28px; color: #b7a8c8; max-width: 760px; }
  .grid { display: grid; gap: 24px; max-width: 980px; }
  .card { background: #17111f; border: 2px solid #3a2b4a; border-radius: 10px; overflow: hidden; }
  .card img { display: block; width: 100%; height: auto; background: #0b0810; }
  .meta { display: grid; gap: 2px; padding: 14px 16px; font-size: 13px; color: #b7a8c8; }
  .meta strong { color: #ffcc4d; font-size: 16px; }
  a { color: inherit; }
</style>
</head>
<body>
<h1>Monkey Civilization</h1>
<p>Five deterministic civilizations generated from reproducible demo histories. Each image is a self-contained SVG with CSS-only animation. Click an image to open the SVG.</p>
<div class="grid">${cards.join('\n')}</div>
</body>
</html>`;

await writeFile(resolve('examples/gallery.html'), `${html}\n`, 'utf8');
console.log(`Wrote ${profiles.length} age SVGs to examples/ages/ and examples/gallery.html`);
