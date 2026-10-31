import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { DEMO_PROFILES, demoHistory, type DemoProfile } from '../src/data/demo.ts';
import { simulateCivilization } from '../src/sim/engine.ts';
import { renderCivilization } from '../src/render/render.ts';
import { HOLIDAYS } from '../src/render/holidays.ts';
import { checkSvgCompatibility } from '../src/compat.ts';
import { formatNumber } from '../src/util/date.ts';

const profiles: DemoProfile[] = ['stone', 'medieval', 'industrial', 'modern', 'space'];
const outputDir = resolve('examples/ages');
const holidayDir = resolve('examples/holidays');
await mkdir(outputDir, { recursive: true });
await mkdir(holidayDir, { recursive: true });

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

const holidayCards: string[] = [];
const holidayHistory = demoHistory('space');
const holidayState = simulateCivilization(holidayHistory);
for (const holiday of HOLIDAYS) {
  const svg = renderCivilization(holidayState, holidayHistory, { holiday: holiday.id });
  const report = checkSvgCompatibility(svg);
  await writeFile(resolve(holidayDir, `${holiday.id}.svg`), `${svg}\n`, 'utf8');
  holidayCards.push(`<article class="card">
  <a href="holidays/${holiday.id}.svg"><img src="holidays/${holiday.id}.svg" alt="${holiday.name} monkey civilization"></a>
  <div class="meta">
    <strong>${holiday.name}</strong>
    <span>${holiday.greeting}</span>
    <span>${report.ok ? 'GitHub compatibility: pass' : 'GitHub compatibility: FAIL'}</span>
  </div>
</article>`);
  if (!report.ok) {
    console.error(`Compatibility check failed for ${holiday.id}`);
    process.exitCode = 1;
  }
}

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Monkey Civilization - age and holiday gallery</title>
<style>
  :root { color-scheme: dark; }
  body { margin: 0; padding: 32px; background: #100c17; color: #fff4d6; font: 16px/1.5 ui-monospace, SFMono-Regular, Menlo, monospace; }
  h1 { margin: 0 0 4px; font-size: 28px; }
  h2 { margin: 36px 0 8px; font-size: 20px; }
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
<h2 id="ages">Ages</h2>
<div class="grid">${cards.join('\n')}</div>
<h2 id="holiday-themes">Holiday themes</h2>
<p>Every theme is selected from the generation date. These previews force each theme on the same space-age civilization.</p>
<div class="grid">${holidayCards.join('\n')}</div>
</body>
</html>`;

await writeFile(resolve('examples/gallery.html'), `${html}\n`, 'utf8');
console.log(
  `Wrote ${profiles.length} age SVGs to examples/ages/, ${HOLIDAYS.length} holiday SVGs to examples/holidays/, and examples/gallery.html`,
);
