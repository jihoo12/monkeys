import { createServer } from 'node:http';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { demoHistory } from './data/demo.ts';
import { simulateCivilization } from './sim/engine.ts';
import { renderCivilization } from './render/render.ts';

interface PreviewOptions {
  port: number;
  svgPath: string;
}

const options = parseArgs(process.argv.slice(2));
const svgPath = resolve(options.svgPath);

await ensureDemoSvg(svgPath);
const staticSvg = await buildStaticSvg();

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`);

  if (url.pathname === '/favicon.ico') {
    response.writeHead(204);
    response.end();
    return;
  }

  if (url.pathname === '/svg' || url.pathname === '/monkey-civilization.svg') {
    try {
      const [svg, info] = await Promise.all([readFile(svgPath, 'utf8'), stat(svgPath)]);
      response.writeHead(200, {
        'Content-Type': 'image/svg+xml; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-SVG-Mtime': String(info.mtimeMs),
      });
      response.end(svg);
    } catch (error) {
      response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end(`Could not read ${svgPath}: ${String(error)}`);
    }
    return;
  }

  if (url.pathname === '/static.svg') {
    response.writeHead(200, {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'no-store',
    });
    response.end(staticSvg);
    return;
  }

  if (url.pathname === '/generate') {
    await ensureDemoSvg(svgPath, true);
    response.writeHead(302, { Location: '/' });
    response.end();
    return;
  }

  const info = await stat(svgPath).catch(() => null);
  const version = info ? Math.round(info.mtimeMs) : Date.now();
  const html = renderPage(svgPath, version);
  response.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  response.end(html);
});

server.listen(options.port, '127.0.0.1', () => {
  console.log(`Monkey Civilization preview: http://127.0.0.1:${options.port}`);
  console.log(`  SVG file: ${svgPath}`);
  console.log('  Ctrl+C to stop. The page mimics GitHub README image rendering (light + dark).');
});

function parseArgs(argv: string[]): PreviewOptions {
  let port = Number(process.env.PORT ?? 4321);
  let svgPath = 'examples/monkey-civilization.svg';
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg) continue;
    if (arg === '--port' || arg === '-p') {
      const value = argv[i + 1];
      if (!value) throw new Error('--port requires a value');
      port = Number(value);
      i += 1;
    } else if (arg.startsWith('--port=')) {
      port = Number(arg.split('=')[1]);
    } else if (arg === '--svg') {
      const value = argv[i + 1];
      if (!value) throw new Error('--svg requires a value');
      svgPath = value;
      i += 1;
    } else if (arg.startsWith('--svg=')) {
      svgPath = arg.split('=')[1] ?? svgPath;
    } else if (arg === '--help' || arg === '-h') {
      console.log('Usage: npm run preview -- [--port 4321] [--svg examples/monkey-civilization.svg]');
      process.exit(0);
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }
  if (!Number.isFinite(port) || port <= 0) throw new Error('Port must be a positive number');
  return { port, svgPath };
}

async function ensureDemoSvg(path: string, force = false): Promise<void> {
  if (!force) {
    const info = await stat(path).catch(() => null);
    if (info) return;
  }
  const history = demoHistory('space');
  const state = simulateCivilization(history);
  const svg = renderCivilization(state, history);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${svg}\n`, 'utf8');
  console.log(`Generated demo SVG at ${path}`);
}

async function buildStaticSvg(): Promise<string> {
  const history = demoHistory('space');
  const state = simulateCivilization(history);
  return renderCivilization(state, history, { animation: false });
}

function renderPage(path: string, version: number): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Monkey Civilization - local preview</title>
<style>
  :root { color-scheme: light dark; }
  * { box-sizing: border-box; }
  body { margin: 0; padding: 28px; font: 15px/1.55 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; background: #0e0b13; color: #fff4d6; }
  h1 { margin: 0 0 4px; font-size: 26px; }
  .sub { color: #b7a8c8; margin: 0 0 24px; }
  .toolbar { display: flex; flex-wrap: wrap; gap: 10px; margin: 0 0 22px; }
  .toolbar a { color: #17111f; background: #ffcc4d; border: 2px solid #ffcc4d; padding: 7px 12px; text-decoration: none; font-weight: 700; }
  .toolbar a.secondary { background: transparent; color: #ffcc4d; }
  .panes { display: grid; gap: 24px; max-width: 980px; }
  .pane { border: 2px solid #3a2b4a; border-radius: 10px; overflow: hidden; }
  .pane h2 { margin: 0; padding: 10px 14px; font-size: 13px; letter-spacing: .06em; text-transform: uppercase; background: #17111f; color: #b7a8c8; }
  .readme { padding: 28px; }
  .readme.light { background: #ffffff; }
  .readme.dark { background: #0d1117; }
  .readme img { display: block; width: 100%; max-width: 880px; height: auto; margin: 0 auto; }
  .note { max-width: 900px; margin: 26px 0 0; color: #b7a8c8; }
  .note code { color: #ffcc4d; }
  .note li { margin: 4px 0; }
</style>
</head>
<body>
<h1>Monkey Civilization</h1>
<p class="sub">Local preview · ${escapeHtml(path)} · GitHub README width ≈ 880px</p>
<div class="toolbar">
  <a href="/svg?v=${version}">Open animated SVG</a>
  <a class="secondary" href="/static.svg">Static fallback</a>
  <a class="secondary" href="/generate">Regenerate demo</a>
</div>
<div class="panes">
  <section class="pane">
    <h2>GitHub light theme · &lt;img&gt; context</h2>
    <div class="readme light"><img src="/svg?v=${version}" alt="Monkey Civilization animated SVG"></div>
  </section>
  <section class="pane">
    <h2>GitHub dark theme · &lt;img&gt; context</h2>
    <div class="readme dark"><img src="/svg?v=${version}" alt="Monkey Civilization animated SVG"></div>
  </section>
</div>
<div class="note">
  <p>This page loads the SVG through an <code>&lt;img&gt;</code> element, which is how a GitHub profile README loads it. The SVG contains no JavaScript and no external assets.</p>
  <ul>
    <li>CSS animation is progressive enhancement. The static fallback uses the same scene with all animations disabled.</li>
    <li>GitHub's Camo image proxy caches images. If a daily update looks stale, append a version query string to the README URL.</li>
    <li>GitHub mobile clients and some viewers may show only the static first frame.</li>
  </ul>
</div>
</body>
</html>`;
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
