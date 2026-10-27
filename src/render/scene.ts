import type { CivilizationState, ContributionHistory, MonkeyState } from '../types.ts';
import type { Palette } from './palette.ts';
import { shade } from './palette.ts';
import { drawBuilding, type LightSource } from './buildings.ts';
import { drawMonkey, drawSpeechBubble } from './sprites.ts';
import { circle, ellipse, escapeXml, line, poly, rect } from './svg.ts';
import { pixelText, pixelTextWidth } from './pixel-font.ts';
import { createRng, type Rng } from '../util/rng.ts';
import { formatNumber } from '../util/date.ts';
import { AGES } from '../sim/ages.ts';
import { SLOTS } from '../sim/catalog.ts';
import {
  antenna,
  bananaBunch,
  bananaPlant,
  barrel,
  bird,
  bush,
  cloud,
  crate,
  drone,
  firePit,
  flag,
  flowers,
  grassTuft,
  lampPost,
  lightPool,
  pottedPlant,
  rockCluster,
  smallFence,
  torch,
  tree,
} from './art.ts';

export const SCENE_WIDTH = 960;
export const SCENE_HEIGHT = 500;
export const GROUND_Y = 382;
export const BUILDING_BASELINE = 470;
export const PATH_Y = 480;
export const MONKEY_BASELINE = 496;
export const HUD_Y = 502;
export const HUD_HEIGHT = 150;

export interface SceneResult {
  svg: string;
  css: string;
  lights: LightSource[];
}

interface WalkerAnimation {
  id: number;
  distance: number;
  duration: number;
  delay: number;
}

export function renderScene(
  state: CivilizationState,
  history: ContributionHistory,
  palette: Palette,
  animation: boolean,
): SceneResult {
  const rng = createRng(`scene:${state.seed}:${state.age.id}`);
  const lights: LightSource[] = [];
  const walkers: WalkerAnimation[] = [];

  const background = [
    rect(0, 0, SCENE_WIDTH, SCENE_HEIGHT, 'url(#skyGradient)'),
    rect(0, 0, SCENE_WIDTH, SCENE_HEIGHT, 'url(#skyGlow)'),
    renderSkyBands(palette),
    renderSun(palette, state),
    renderClouds(rng, palette, state),
    renderSkyCraft(rng, palette, state),
    renderBirds(palette, state),
    renderMountains(rng, palette, state),
    renderTreeLine(rng, palette, state),
    renderBackdrop(rng, palette, state),
  ].join('');

  const ground = [renderGround(rng, palette, state), renderContributionPath(history, state, palette)].join('');

  const buildings = SLOTS.map((slotDefinition) => {
    const slot = state.slots.find((candidate) => candidate.id === slotDefinition.id);
    if (!slot) return '';
    return drawBuilding(slot, BUILDING_BASELINE, palette, state.age.id, lights);
  }).join('');

  const village = renderVillageDetails(rng, palette, state, lights);
  const monkeys = renderMonkeys(state, palette, walkers, animation);
  const foreground = renderForeground(rng, palette, state);

  const night = `<rect class="night" x="0" y="0" width="${SCENE_WIDTH}" height="${SCENE_HEIGHT}" fill="${palette.night}" style="--night-opacity:${palette.nightOpacity}"/>`;
  const stars = renderStars(rng, palette, state);
  const moon = renderMoon(palette, state);
  const fireflies = renderFireflies(rng, palette, state);
  const lightLayer = renderLights(lights, palette);
  const header = renderHeader(state, palette);

  const svg = [
    background,
    ground,
    buildings,
    village,
    monkeys,
    foreground,
    night,
    stars,
    moon,
    fireflies,
    lightLayer,
    header,
  ].join('');

  const css = animation ? renderSceneCss(walkers) : '';
  return { svg, css, lights };
}

function renderSceneCss(walkers: WalkerAnimation[]): string {
  return walkers
    .map(
      (walker) =>
        `@keyframes walk-${walker.id}{0%,100%{transform:translateX(0) scaleX(1)}44%{transform:translateX(${walker.distance}px) scaleX(1)}50%{transform:translateX(${walker.distance}px) scaleX(-1)}94%{transform:translateX(0) scaleX(-1)}}.walk-${walker.id}{animation-name:walk-${walker.id};animation-duration:${walker.duration}s;animation-timing-function:ease-in-out;animation-iteration-count:infinite;animation-delay:-${walker.delay}s}`,
    )
    .join('');
}

// ---------------------------------------------------------------------------
// Sky and far scenery
// ---------------------------------------------------------------------------

function renderSkyBands(p: Palette): string {
  const parts: string[] = [];
  parts.push(rect(0, 330, SCENE_WIDTH, 52, p.haze, 'opacity="0.18"'));
  parts.push(rect(0, 352, SCENE_WIDTH, 30, p.haze, 'opacity="0.14"'));
  parts.push(rect(0, 368, SCENE_WIDTH, 14, p.haze, 'opacity="0.2"'));
  for (let y = 120; y < 360; y += 48) {
    parts.push(rect(0, y, SCENE_WIDTH, 1, '#ffffff', 'opacity="0.04"'));
  }
  return parts.join('');
}

function renderSun(p: Palette, state: CivilizationState): string {
  if (state.age.id === 'space') {
    return `<g transform="translate(788 104)"><g class="planet">
      ${circle(0, 0, 42, p.accent, 'opacity="0.10"')}
      ${circle(0, 0, 30, p.accent, 'opacity="0.16"')}
      ${circle(0, 0, 24, p.accent)}
      ${circle(-7, -8, 18, shade(p.accent, 0.25), 'opacity="0.8"')}
      ${circle(-13, -13, 6, shade(p.accent, 0.55), 'opacity="0.5"')}
      ${ellipse(0, 2, 42, 9, 'none', `stroke="${p.accent2}" stroke-width="3" transform="rotate(-18)"`)}
      ${ellipse(0, 2, 47, 12, 'none', `stroke="${p.accent}" stroke-width="1" opacity="0.7" transform="rotate(-18)"`)}
      ${circle(-28, 18, 3, p.accent2, 'opacity="0.8"')}
    </g></g>`;
  }
  const x = 792;
  const y = 110;
  const sun = p.sun;
  const glow = p.sunGlow;
  return `<g class="sun" transform="translate(${x} ${y})">
    ${circle(0, 0, 52, glow, 'opacity="0.08"')}
    ${circle(0, 0, 40, glow, 'opacity="0.12"')}
    ${circle(0, 0, 30, sun, 'opacity="0.22"')}
    ${circle(0, 0, 22, sun)}
    ${rect(-16, -10, 32, 20, sun)}
    ${rect(-10, -16, 20, 32, sun)}
    ${rect(-30, -4, 8, 8, sun)}
    ${rect(22, -4, 8, 8, sun)}
    ${rect(-4, -30, 8, 8, sun)}
    ${rect(-4, 22, 8, 8, sun)}
    ${rect(-7, -7, 14, 14, glow, 'opacity="0.55"')}
    ${rect(-22, -18, 6, 6, glow, 'opacity="0.5"')}
    ${rect(16, 14, 5, 5, glow, 'opacity="0.45"')}
  </g>`;
}

function renderMoon(p: Palette, state: CivilizationState): string {
  if (state.age.id === 'space') {
    return `<g class="moon" transform="translate(690 72) scale(0.55)" opacity="0.85">${circle(
      0,
      0,
      26,
      p.moon,
      'opacity="0.12"',
    )}${circle(0, 0, 14, p.moon)}${circle(-4, -3, 3, p.cloudShade, 'opacity="0.55"')}</g>`;
  }
  return `<g class="moon" transform="translate(818 108)">
    ${circle(0, 0, 38, p.moon, 'opacity="0.10"')}
    ${circle(0, 0, 26, p.moon, 'opacity="0.16"')}
    ${circle(0, 0, 18, p.moon)}
    ${circle(-6, -5, 4, p.cloudShade, 'opacity="0.55"')}
    ${circle(7, 6, 3, p.cloudShade, 'opacity="0.45"')}
    ${circle(3, -9, 2, p.cloudShade, 'opacity="0.45"')}
    ${circle(-9, 6, 2, p.cloudShade, 'opacity="0.35"')}
  </g>`;
}

function renderClouds(rng: Rng, p: Palette, state: CivilizationState): string {
  const parts: string[] = [];
  const count = state.age.id === 'space' ? 2 : 8;
  const positions: Array<[number, number, number]> = [
    [110, 108, 1.1],
    [390, 76, 0.85],
    [660, 146, 0.7],
    [250, 204, 0.55],
    [840, 188, 0.48],
    [520, 250, 1.25],
    [176, 284, 1.6],
    [758, 268, 1.3],
  ];
  for (let i = 0; i < count; i += 1) {
    const [x, y, scale] = positions[i] ?? [0, 0, 1];
    const jitter = (rng() - 0.5) * 22;
    parts.push(cloud(x + jitter, y + (rng() - 0.5) * 8, scale, p, `cloud-${i}`));
  }
  return parts.join('');
}

function renderBirds(p: Palette, state: CivilizationState): string {
  if (state.age.id === 'space') return '';
  const birds: Array<[number, number, number]> = [
    [286, 158, 1],
    [322, 140, 0.8],
    [356, 166, 0.7],
    [248, 194, 0.55],
  ];
  return birds.map(([x, y, scale], index) => bird(x, y, scale, p, index)).join('');
}

function renderSkyCraft(rng: Rng, p: Palette, state: CivilizationState): string {
  const parts: string[] = [];
  if (state.age.id === 'medieval') {
    const x = 148 + rng() * 30;
    parts.push(`<g transform="translate(${x} 84)"><g class="balloon">
      ${poly([[-13, 8], [-10, -12], [0, -20], [10, -12], [13, 8], [7, 8], [0, -2], [-7, 8]], p.accent)}
      ${poly([[-8, 6], [-6, -8], [0, -14], [6, -8], [8, 6], [3, 6], [0, 0], [-3, 6]], p.accent2)}
      ${rect(-5, 8, 10, 6, p.woodDark)}
      ${line(-5, 8, -7, 14, p.woodDark, 1)}
      ${line(5, 8, 7, 14, p.woodDark, 1)}
      ${rect(-2, 12, 4, 2, p.banana)}
    </g></g>`);
  } else if (state.age.id === 'industrial') {
    parts.push(`<g transform="translate(258 92)"><g class="airship">
      ${ellipse(0, 0, 34, 13, p.metalLight)}
      ${ellipse(0, -2, 30, 9, p.metal)}
      ${rect(-8, 10, 16, 7, p.metalDark)}
      ${rect(-6, 11, 12, 4, p.window, 'class="window"')}
      ${poly([[-34, 0], [-42, 4], [-34, 6], [-30, 2]], p.metalDark)}
      ${rect(-1, -16, 2, 5, p.metalDark)}
    </g></g>`);
  } else if (state.age.id === 'modern') {
    parts.push(`<g transform="translate(146 104)"><g class="heli">
      ${rect(-13, -2, 26, 8, p.metalLight)}
      ${rect(-10, -1, 10, 5, p.glass)}
      ${rect(8, 1, 8, 5, p.metal)}
      ${rect(-16, -6, 32, 2, p.metalDark)}
      ${circle(0, -5, 2, p.metalDark)}
      ${rect(-1, 6, 2, 6, p.metalDark)}
      ${rect(-6, 12, 12, 2, p.metalDark)}
      ${rect(-15, -7, 4, 1, p.accent2, 'opacity="0.8"')}
    </g></g>`);
  } else if (state.age.id === 'space') {
    parts.push(`<g transform="translate(205 90)"><g class="satellite">
      ${rect(-4, -4, 8, 8, p.metalLight)}
      ${rect(-1, -6, 2, 12, p.metal)}
      ${rect(-18, -3, 12, 6, p.glass, 'opacity="0.8"')}
      ${rect(6, -3, 12, 6, p.glass, 'opacity="0.8"')}
      ${rect(-18, -3, 12, 1, p.glassLight)}
      ${rect(6, -3, 12, 1, p.glassLight)}
      ${circle(9, -9, 2, p.accent2, 'class="blink"')}
      ${line(0, -6, 0, -12, p.metal, 1)}
      ${circle(0, -13, 1.5, p.accent)}
    </g></g>`);
  }
  return parts.join('');
}

function renderMountains(rng: Rng, p: Palette, state: CivilizationState): string {
  const layers: string[] = [];
  const configs = [
    { base: 390, height: 124, color: p.mountainFar, step: 58, snow: state.age.id !== 'space' },
    { base: 402, height: 90, color: p.mountainMid, step: 46, snow: false },
    { base: 414, height: 58, color: p.mountainNear, step: 38, snow: false },
  ];
  for (let layer = 0; layer < configs.length; layer += 1) {
    const config = configs[layer];
    if (!config) continue;
    const points: Array<[number, number]> = [[0, config.base]];
    const facets: string[] = [];
    for (let x = 0; x <= SCENE_WIDTH + config.step; x += config.step) {
      const peak = config.base - config.height * (0.34 + rng() * 0.66);
      const shoulder = peak + 22 + rng() * 20;
      points.push([x + config.step * 0.12, shoulder]);
      points.push([x + config.step * 0.34, peak]);
      points.push([x + config.step * 0.46, peak + 3]);
      points.push([x + config.step * 0.7, shoulder]);
      if (layer === 0) {
        facets.push(
          poly(
            [
              [x + config.step * 0.34, peak],
              [x + config.step * 0.34 + 13, peak + 26],
              [x + config.step * 0.46, peak + 3],
            ],
            shade(config.color, 0.22),
            'opacity="0.45"',
          ),
        );
        if (config.snow) {
          facets.push(
            poly(
              [
                [x + config.step * 0.34, peak],
                [x + config.step * 0.26, peak + 11],
                [x + config.step * 0.34, peak + 8],
                [x + config.step * 0.4, peak + 13],
                [x + config.step * 0.46, peak + 3],
              ],
              p.cloud,
              'opacity="0.65"',
            ),
          );
        }
      }
    }
    points.push([SCENE_WIDTH, config.base]);
    points.push([SCENE_WIDTH, GROUND_Y + 26]);
    points.push([0, GROUND_Y + 26]);
    layers.push(poly(points, config.color));
    layers.push(facets.join(''));
    layers.push(rect(0, config.base - 6, SCENE_WIDTH, 18, config.color, 'opacity="0.35"'));
  }
  return layers.join('');
}

function renderTreeLine(rng: Rng, p: Palette, state: CivilizationState): string {
  const parts: string[] = [];
  const density = state.age.id === 'stone' ? 24 : state.age.id === 'medieval' ? 18 : state.age.id === 'industrial' ? 11 : state.age.id === 'modern' ? 12 : 8;
  for (let i = 0; i < density; i += 1) {
    const x = 8 + i * (944 / density) + (rng() - 0.5) * 18;
    const scale = 0.55 + rng() * 0.35;
    const variant = state.age.id === 'space' ? 'alien' : state.age.id === 'stone' ? (i % 3 === 0 ? 'palm' : 'round') : 'round';
    parts.push(tree(x, 432 + rng() * 6, scale, p, variant, true));
  }
  parts.push(rect(0, 424, SCENE_WIDTH, 14, p.jungleDark, 'opacity="0.22"'));
  return parts.join('');
}

function renderBackdrop(rng: Rng, p: Palette, state: CivilizationState): string {
  const parts: string[] = [];
  const far = p.silhouette;
  const mid = p.silhouette2;
  if (state.age.id === 'stone') {
    for (let i = 0; i < 5; i += 1) {
      const x = 70 + i * 190 + rng() * 40;
      parts.push(tree(x, 446, 0.8 + rng() * 0.4, p, i % 2 === 0 ? 'palm' : 'round', true));
    }
    parts.push(rect(0, 440, SCENE_WIDTH, 6, p.jungleDark, 'opacity="0.35"'));
  } else if (state.age.id === 'medieval') {
    // A distant castle and village rooftops.
    parts.push(`<g opacity="0.55" transform="translate(84 448)">
      ${rect(-26, -44, 52, 44, far)}${rect(-34, -58, 14, 58, far)}${rect(20, -58, 14, 58, far)}
      ${rect(-8, -64, 16, 24, far)}${poly([[-36, -58], [-27, -72], [-18, -58]], mid)}
      ${poly([[18, -58], [27, -72], [36, -58]], mid)}${poly([[-10, -64], [0, -78], [10, -64]], mid)}
      ${rect(-4, -24, 8, 24, mid)}${rect(-4, -50, 3, 6, p.window, 'opacity="0.55"')}
    </g>`);
    for (let i = 0; i < 7; i += 1) {
      const x = 170 + i * 120 + rng() * 20;
      const h = 18 + rng() * 24;
      parts.push(rect(x, 448 - h, 20 + rng() * 12, h, far, 'opacity="0.5"'));
      parts.push(poly([[x - 3, 448 - h], [x + 12, 448 - h - 10], [x + 27, 448 - h]], mid, 'opacity="0.6"'));
      parts.push(rect(x + 6, 448 - h + 7, 4, 5, p.window, 'opacity="0.45"'));
    }
    parts.push(`<g opacity="0.5" transform="translate(860 444)">${windmillSilhouette(p, far)}</g>`);
  } else if (state.age.id === 'industrial') {
    for (let i = 0; i < 5; i += 1) {
      const x = 44 + i * 195 + rng() * 30;
      const h = 34 + rng() * 38;
      parts.push(rect(x, 452 - h, 44 + rng() * 18, h, far, 'opacity="0.65"'));
      parts.push(rect(x + 8, 452 - h - 26, 7, 28, mid, 'opacity="0.8"'));
      parts.push(poly([[x - 2, 452 - h], [x + 10, 452 - h - 10], [x + 22, 452 - h]], mid, 'opacity="0.7"'));
      for (let w = 0; w < 3; w += 1) {
        parts.push(rect(x + 9 + w * 12, 452 - h + 10 + (w % 2) * 12, 5, 5, p.window, 'opacity="0.45"'));
      }
    }
    parts.push(rect(0, 446, SCENE_WIDTH, 4, p.smoke, 'opacity="0.12"'));
    parts.push(rect(0, 434, SCENE_WIDTH, 2, p.smokeLight, 'opacity="0.08"'));
  } else if (state.age.id === 'modern') {
    for (let i = 0; i < 9; i += 1) {
      const x = 24 + i * 110 + rng() * 20;
      const h = 30 + rng() * 62;
      const w = 30 + rng() * 26;
      parts.push(rect(x, 456 - h, w, h, far, 'opacity="0.55"'));
      parts.push(rect(x, 456 - h, w, 2, mid, 'opacity="0.7"'));
      for (let ww = 0; ww < 3; ww += 1) {
        for (let hh = 0; hh < Math.floor(h / 14); hh += 1) {
          if ((ww + hh + i) % 3 === 0) {
            parts.push(rect(x + 5 + ww * 9, 456 - h + 8 + hh * 14, 4, 5, p.windowGlow, 'opacity="0.35"'));
          }
        }
      }
    }
    parts.push(rect(0, 452, SCENE_WIDTH, 6, p.haze, 'opacity="0.3"'));
  } else {
    for (let i = 0; i < 8; i += 1) {
      const x = 30 + i * 122 + rng() * 26;
      const h = 26 + rng() * 44;
      parts.push(rect(x, 452 - h, 28 + rng() * 20, h, far, 'opacity="0.55"'));
      parts.push(
        `<path d="M${x - 4} 452 Q${x + 12} ${452 - h - 20} ${x + 32} 452 Z" fill="${mid}" opacity="0.55"/>`,
      );
      parts.push(circle(x + 12, 452 - h + 8, 2, p.accent2, 'opacity="0.55"'));
    }
    parts.push(rect(0, 446, SCENE_WIDTH, 6, p.accent2, 'opacity="0.12"'));
  }
  // A few tiny foreground silhouettes on the horizon for depth.
  for (let i = 0; i < 8; i += 1) {
    const x = 30 + rng() * 900;
    parts.push(rect(x, 450 - rng() * 8, 1, 6, mid, 'opacity="0.5"'));
  }
  return parts.join('');
}

function windmillSilhouette(p: Palette, color: string): string {
  return `${rect(-2, -34, 4, 34, color)}${rect(-12, -34, 24, 6, color)}${poly(
    [[-2, -34], [-18, -48], [2, -42]],
    color,
  )}${poly([[-2, -34], [18, -48], [-2, -42]], color)}`;
}

// ---------------------------------------------------------------------------
// Ground and contribution path
// ---------------------------------------------------------------------------

function renderGround(rng: Rng, p: Palette, state: CivilizationState): string {
  const parts: string[] = [];
  const space = state.age.id === 'space';
  parts.push(rect(0, GROUND_Y, SCENE_WIDTH, SCENE_HEIGHT - GROUND_Y, p.grass));
  parts.push(rect(0, GROUND_Y, SCENE_WIDTH, 5, p.grassLight));
  parts.push(rect(0, GROUND_Y + 5, SCENE_WIDTH, 4, p.grass));
  parts.push(rect(0, GROUND_Y + 9, SCENE_WIDTH, 7, p.grassDark, 'opacity="0.28"'));
  parts.push(rect(0, 430, SCENE_WIDTH, 18, p.grass, 'opacity="0.65"'));
  parts.push(rect(0, 446, SCENE_WIDTH, 10, p.grassDark, 'opacity="0.55"'));
  parts.push(rect(0, 456, SCENE_WIDTH, 16, p.dirt, 'opacity="0.7"'));
  parts.push(rect(0, 464, SCENE_WIDTH, 8, p.dirtDark));
  parts.push(rect(0, 470, SCENE_WIDTH, 8, space ? p.metalDark : p.stoneDark));
  parts.push(rect(0, 470, SCENE_WIDTH, 2, space ? p.metal : p.stone, 'opacity="0.7"'));

  for (let i = 0; i < 54; i += 1) {
    const x = rng() * SCENE_WIDTH;
    const y = GROUND_Y + 10 + rng() * 62;
    const h = 3 + Math.floor(rng() * 7);
    parts.push(rect(x, y - h, 2, h, p.grassDark, 'opacity="0.8"'));
    parts.push(rect(x + 2, y - h + 2, 2, 2, p.grassLight, 'opacity="0.75"'));
  }
  for (let i = 0; i < 18; i += 1) {
    const x = 16 + rng() * 928;
    const y = GROUND_Y + 16 + rng() * 56;
    parts.push(rockCluster(x, y, 0.22 + rng() * 0.2, p));
  }
  for (let i = 0; i < 22; i += 1) {
    const x = 18 + rng() * 924;
    const y = GROUND_Y + 12 + rng() * 58;
    parts.push(flowers(x, y, p, 0.55 + rng() * 0.3));
  }
  for (let i = 0; i < 34; i += 1) {
    const x = rng() * SCENE_WIDTH;
    const y = 446 + rng() * 22;
    const h = 4 + Math.floor(rng() * 7);
    parts.push(grassTuft(x, y, h, p, p.grassDark));
  }

  if (space) {
    for (let x = 20; x < SCENE_WIDTH; x += 40) {
      parts.push(rect(x, 458, 2, 2, p.accent2, 'opacity="0.35"'));
    }
  }
  renderRoad(parts, rng, p, state);
  return parts.join('');
}

function renderRoad(parts: string[], rng: Rng, p: Palette, state: CivilizationState): void {
  parts.push(rect(0, PATH_Y - 2, SCENE_WIDTH, 22, p.outline, 'opacity="0.3"'));
  if (state.age.id === 'stone' || state.age.id === 'medieval') {
    parts.push(rect(0, PATH_Y, SCENE_WIDTH, 20, p.pathDark));
    parts.push(rect(0, PATH_Y + 2, SCENE_WIDTH, 15, p.path));
  } else if (state.age.id === 'industrial') {
    parts.push(rect(0, PATH_Y, SCENE_WIDTH, 20, p.pathDark));
    parts.push(rect(0, PATH_Y + 2, SCENE_WIDTH, 16, p.path));
    // Rails and sleepers run behind the crowd.
    for (let x = 0; x < SCENE_WIDTH; x += 18) {
      parts.push(rect(x, PATH_Y + 5, 8, 2, p.woodDark, 'opacity="0.75"'));
    }
    parts.push(rect(0, PATH_Y + 6, SCENE_WIDTH, 2, p.metalLight));
    parts.push(rect(0, PATH_Y + 13, SCENE_WIDTH, 2, p.metalLight));
    parts.push(rect(0, PATH_Y + 7, SCENE_WIDTH, 1, p.metalDark, 'opacity="0.6"'));
  } else if (state.age.id === 'modern') {
    parts.push(rect(0, PATH_Y, SCENE_WIDTH, 20, p.pathDark));
    parts.push(rect(0, PATH_Y + 2, SCENE_WIDTH, 16, p.path));
    for (let x = 8; x < SCENE_WIDTH; x += 46) {
      parts.push(rect(x, PATH_Y + 8, 18, 3, p.banana, 'opacity="0.75"'));
    }
  } else {
    parts.push(rect(0, PATH_Y, SCENE_WIDTH, 20, p.metalDark));
    parts.push(rect(0, PATH_Y + 2, SCENE_WIDTH, 16, p.pathDark));
    for (let x = 0; x < SCENE_WIDTH; x += 46) {
      parts.push(rect(x, PATH_Y + 2, 2, 16, p.metal, 'opacity="0.35"'));
    }
    parts.push(rect(0, PATH_Y + 2, SCENE_WIDTH, 1, p.accent2, 'opacity="0.55"'));
    parts.push(rect(0, PATH_Y + 17, SCENE_WIDTH, 1, p.accent, 'opacity="0.45"'));
  }
  // Pebbles, ruts and wear.
  for (let i = 0; i < 20; i += 1) {
    const x = rng() * SCENE_WIDTH;
    const y = PATH_Y + 3 + rng() * 14;
    parts.push(rect(x, y, 3 + Math.floor(rng() * 8), 1, p.pathLight, 'opacity="0.45"'));
  }
}

function renderContributionPath(
  history: ContributionHistory,
  state: CivilizationState,
  palette: Palette,
): string {
  const weeks = history.stats.weeks;
  if (weeks.length === 0) return '';
  const max = Math.max(1, ...weeks.map((week) => week.total));
  const parts: string[] = [];
  const startX = 56;
  const tileWidth = 15;
  const gap = 1;
  const totalWidth = weeks.length * (tileWidth + gap) - gap;
  parts.push(rect(startX - 4, PATH_Y + 1, totalWidth + 8, 16, palette.outline, 'opacity="0.55"'));
  parts.push(rect(startX - 3, PATH_Y + 2, totalWidth + 6, 14, palette.hudInset, 'opacity="0.8"'));
  weeks.forEach((week, index) => {
    const x = startX + index * (tileWidth + gap);
    const level = week.total === 0 ? 0 : Math.min(4, Math.ceil((week.total / max) * 4));
    const color =
      level === 0
        ? palette.pathDark
        : level === 1
          ? palette.grassDark
          : level === 2
            ? palette.grass
            : level === 3
              ? palette.accent2
              : palette.accent;
    parts.push(
      `<rect x="${x}" y="${PATH_Y + 3}" width="${tileWidth}" height="12" fill="${color}" opacity="${
        level === 0 ? 0.62 : 1
      }"><title>Week of ${escapeXml(week.start)}: ${formatNumber(week.total)} contributions</title></rect>`,
    );
    parts.push(rect(x, PATH_Y + 3, tileWidth, 1, level >= 3 ? palette.bananaLight : palette.pathLight, 'opacity="0.35"'));
    if (level >= 3) {
      parts.push(rect(x + 2, PATH_Y + 5, 3, 2, palette.bananaLight, 'opacity="0.9"'));
    }
    if (level === 4) {
      parts.push(rect(x + 11, PATH_Y + 11, 2, 2, palette.bananaLight, 'opacity="0.8"'));
    }
  });
  state.events
    .filter((event) => event.type === 'age')
    .forEach((event) => {
      const weekIndex = Math.floor((event.day - 1) / 7);
      if (weekIndex < 0 || weekIndex >= weeks.length) return;
      const x = startX + weekIndex * (tileWidth + gap) + 7;
      parts.push(rect(x - 1, PATH_Y - 14, 2, 14, palette.metalDark));
      const age = AGES.find((candidate) => event.text.includes(candidate.name));
      parts.push(
        poly(
          [
            [x + 1, PATH_Y - 14],
            [x + 10, PATH_Y - 11],
            [x + 1, PATH_Y - 8],
          ],
          age?.accent ?? palette.accent,
          'class="path-flag"',
        ),
      );
    });
  return parts.join('');
}

// ---------------------------------------------------------------------------
// Village props, tree and monkeys
// ---------------------------------------------------------------------------

const ROLE_ANCHORS: Record<MonkeyState['role'], { x: number; scale: number; working?: boolean }> = {
  elder: { x: 78, scale: 2.15 },
  farmer: { x: 188, scale: 2.2, working: true },
  chef: { x: 306, scale: 2.1, working: true },
  musician: { x: 364, scale: 2.1 },
  builder: { x: 438, scale: 2.25, working: true },
  scholar: { x: 562, scale: 2.1 },
  astronaut: { x: 890, scale: 2.3 },
  walker: { x: 480, scale: 2.05 },
};

interface MonkeySpot {
  x: number;
  baseline: number;
  scale: number;
}

const MONKEY_SPOTS: readonly MonkeySpot[] = [
  { x: 78, baseline: 496, scale: 2.15 },
  { x: 132, baseline: 490, scale: 1.82 },
  { x: 190, baseline: 500, scale: 2.28 },
  { x: 248, baseline: 493, scale: 1.88 },
  { x: 306, baseline: 498, scale: 2.12 },
  { x: 364, baseline: 488, scale: 1.78 },
  { x: 430, baseline: 497, scale: 2.2 },
  { x: 494, baseline: 500, scale: 2.3 },
  { x: 556, baseline: 491, scale: 1.86 },
  { x: 618, baseline: 498, scale: 2.14 },
  { x: 684, baseline: 487, scale: 1.74 },
  { x: 746, baseline: 500, scale: 2.24 },
  { x: 808, baseline: 493, scale: 1.9 },
  { x: 876, baseline: 498, scale: 2.28 },
];

function planMonkeySpots(monkeys: MonkeyState[]): Map<number, MonkeySpot> {
  const free = MONKEY_SPOTS.map((_, index) => index);
  const result = new Map<number, MonkeySpot>();
  let walkerIndex = 0;

  const ordered = [...monkeys].sort(
    (a, b) => Number(a.role === 'walker') - Number(b.role === 'walker') || a.id - b.id,
  );

  for (const monkey of ordered) {
    const target =
      monkey.role === 'walker'
        ? 96 + ((walkerIndex++ * 137 + monkey.id * 47) % 790)
        : ROLE_ANCHORS[monkey.role].x;
    let bestIndex = free[0] ?? 0;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (const index of free) {
      const spot = MONKEY_SPOTS[index];
      if (!spot) continue;
      const distance = Math.abs(spot.x - target);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = index;
      }
    }
    const spot = MONKEY_SPOTS[bestIndex];
    if (!spot) continue;
    result.set(monkey.id, spot);
    free.splice(free.indexOf(bestIndex), 1);
  }
  return result;
}

function renderVillageDetails(
  rng: Rng,
  p: Palette,
  state: CivilizationState,
  lights: LightSource[],
): string {
  const parts: string[] = [];
  const age = state.age.id;

  // Civic apron ties the central plots together.
  if (state.ageIndex >= 2) {
    const base = age === 'space' ? p.metalDark : p.stoneDark;
    const top = age === 'space' ? p.metal : p.stone;
    parts.push(rect(386, 463, 328, 12, base));
    parts.push(rect(388, 465, 324, 8, top));
    for (let x = 396; x < 710; x += 16) {
      parts.push(rect(x, 465, 1, 8, base, 'opacity="0.7"'));
    }
    if (age === 'space') {
      parts.push(rect(388, 471, 324, 1, p.accent2, 'opacity="0.7"'));
    }
  }

  parts.push(greatBananaTree(500, 468, p, state));

  for (const x of [125, 374, 618, 748, 862]) {
    if (state.ageIndex === 0) {
      parts.push(torch(x, 468, p));
    } else {
      parts.push(lampPost(x, 468, p, age === 'space' ? 50 : 42));
    }
    lights.push({
      x,
      y: state.ageIndex === 0 ? 432 : 424,
      radius: state.ageIndex === 0 ? 24 : 28,
      color: state.ageIndex === 0 ? p.fire : p.windowGlow,
    });
  }

  parts.push(bananaCrate(252, 468, p));

  if (age === 'stone') {
    parts.push(rect(40, 464, 20, 3, p.woodDark));
    parts.push(rect(44, 460, 12, 4, p.wood));
    parts.push(rockCluster(104, 466, 0.5, p));
    parts.push(bananaPlant(340, 466, 0.9, p));
    parts.push(bananaPlant(936, 466, 0.8, p));
    parts.push(bush(592, 466, 0.9, p, true));
    parts.push(grassTuft(646, 466, 10, p));
    parts.push(firePit(718, 466, 0.55, p));
    parts.push(rockCluster(890, 466, 0.55, p));
  } else if (age === 'medieval') {
    parts.push(hayBale(84, 466, p));
    parts.push(barrel(110, 466, p));
    parts.push(cart(274, 466, p));
    parts.push(well(574, 466, p));
    parts.push(smallFence(630, 466, 26, p));
    parts.push(bananaPlant(666, 466, 0.8, p));
    parts.push(barrel(928, 466, p));
    parts.push(pottedPlant(398, 465, 0.8, p));
    parts.push(bush(848, 466, 0.75, p, true));
  } else if (age === 'industrial') {
    parts.push(steamVent(96, 466, p, 0));
    parts.push(steamVent(350, 466, p, 1.1));
    parts.push(steamVent(660, 466, p, 2.2));
    parts.push(steamVent(900, 466, p, 0.8));
    parts.push(crate(156, 466, p, 0.9, true));
    parts.push(barrel(166, 466, p));
    parts.push(powerBox(384, 466, p));
    parts.push(gearCluster(714, 466, p));
    parts.push(crate(940, 466, p, 0.75, false));
    parts.push(coalPile(806, 466, p));
    parts.push(railSignal(590, 466, p));
  } else if (age === 'modern') {
    parts.push(streetTree(96, 466, p));
    parts.push(streetTree(344, 466, p));
    parts.push(streetTree(658, 466, p));
    parts.push(streetTree(920, 466, p));
    parts.push(bench(160, 466, p));
    parts.push(hydrant(236, 466, p));
    parts.push(trafficLight(400, 466, p));
    parts.push(scooter(742, 466, p));
    parts.push(crate(866, 466, p, 0.75, false));
    parts.push(pottedPlant(680, 465, 0.85, p));
    parts.push(bush(846, 466, 0.55, p, true));
  } else {
    parts.push(robot(102, 466, p));
    parts.push(holoSign(156, 466, p, 'OOK'));
    parts.push(crate(224, 466, p, 0.8, false));
    parts.push(pipeCluster(348, 466, p));
    parts.push(robot(654, 466, p, true));
    parts.push(holoSign(716, 466, p, 'SCI'));
    parts.push(crate(944, 466, p, 0.75, false));
    parts.push(antenna(398, 466, 28, p, p.accent2));
    parts.push(drone(910, 438, p, 0.7));
    parts.push(flowers(820, 466, p, 0.8));
  }

  // Loose stones and grass tufts keep the verge lively but not cluttered.
  for (let i = 0; i < 8; i += 1) {
    const x = 30 + rng() * 900;
    const y = 458 + rng() * 8;
    parts.push(rect(x, y, 3 + Math.floor(rng() * 4), 2, p.stone));
    parts.push(rect(x, y, 2, 1, p.stoneLight, 'opacity="0.6"'));
  }
  for (let i = 0; i < 14; i += 1) {
    const x = 20 + rng() * 920;
    const y = 456 + rng() * 11;
    parts.push(grassTuft(x, y, 5 + Math.floor(rng() * 6), p, p.grassDark));
  }
  return parts.join('');
}

function greatBananaTree(x: number, base: number, p: Palette, state: CivilizationState): string {
  const advanced = state.ageIndex >= 2;
  const planter = advanced
    ? `${rect(-25, -9, 50, 9, state.age.id === 'space' ? p.metalDark : p.stoneDark)}${rect(
        -23,
        -11,
        46,
        4,
        state.age.id === 'space' ? p.metal : p.stone,
      )}${rect(-6, -11, 12, 2, p.dirtDark)}${rect(-2, -12, 4, 2, p.grassDark)}`
    : `${ellipse(0, -4, 22, 5, p.dirtDark)}${rect(-15, -8, 30, 4, p.dirtDark)}${flowers(8, -6, p, 0.7)}`;
  const canopy = [
    poly([[-4, -70], [-40, -86], [-50, -78], [-14, -62]], p.leafDark),
    poly([[4, -70], [42, -88], [52, -80], [12, -60]], p.leaf),
    poly([[-3, -74], [-30, -106], [-40, -100], [-7, -78]], p.leaf),
    poly([[3, -74], [34, -110], [44, -102], [7, -78]], p.leafDark),
    poly([[-5, -76], [-15, -118], [-6, -124], [2, -80]], p.leaf),
    poly([[5, -76], [17, -120], [8, -124], [-2, -80]], p.leafDark),
    poly([[-18, -82], [-40, -70], [-34, -62], [-9, -68]], p.leafDark),
    poly([[18, -84], [42, -72], [36, -64], [9, -68]], p.leaf),
    line(-4, -70, -40, -84, p.leafDark, 1),
    line(4, -70, 42, -86, p.leafDark, 1),
    line(-3, -74, -30, -104, p.leafDark, 1),
    line(3, -74, 34, -108, p.leafDark, 1),
    rect(-4, -78, 8, 8, p.woodDark),
    rect(-2, -76, 4, 6, p.wood),
    bananaBunch(13, -64, 1, p),
    bananaBunch(-16, -72, 1, p),
    bananaBunch(2, -90, 1, p),
    bananaBunch(-8, -58, 0.8, p),
  ].join('');
  return `<g transform="translate(${x} ${base})">${ellipse(0, 1, 36, 4, p.shadow)}${planter}${rect(
    -5,
    -72,
    10,
    62,
    p.woodDark,
  )}${rect(-3, -70, 6, 60, p.wood)}${rect(-6, -10, 12, 4, p.woodDark)}<g class="tree-sway">${canopy}</g></g>`;
}

function renderMonkeys(
  state: CivilizationState,
  palette: Palette,
  walkers: WalkerAnimation[],
  animation: boolean,
): string {
  const parts: string[] = [];
  const monkeys = state.visibleMonkeys;
  const spots = planMonkeySpots(monkeys);
  const speech: string[] = [];
  const age = state.age.id;
  let astronautSpoke = false;
  const ambientRng = createRng(`monkeys:${state.seed}:${state.age.id}`);

  monkeys.forEach((monkey, index) => {
    const spot = spots.get(monkey.id) ?? MONKEY_SPOTS[0]!;
    const anchor = ROLE_ANCHORS[monkey.role];
    const { x, baseline, scale } = spot;
    let walk: WalkerAnimation | undefined;
    const working = (anchor.working ?? false) && age !== 'space';
    const celebrate =
      (monkey.role === 'musician' && (age === 'medieval' || age === 'modern')) ||
      (monkey.role === 'astronaut' && age === 'space') ||
      (monkey.id + state.ageIndex) % 11 === 0;

    if (monkey.role === 'walker') {
      const direction = index % 2 === 0 ? 1 : -1;
      const distance = direction * (22 + (index % 3) * 10);
      const clampedDistance =
        x + distance * scale > 936 || x + distance * scale < 20 ? -distance : distance;
      walk = {
        id: monkey.id,
        distance: clampedDistance,
        duration: 13 + (index % 4) * 2.2,
        delay: (index * 1.63) % 9,
      };
    }

    if (walk) walkers.push(walk);
    const facing: 1 | -1 = walk ? 1 : x < 480 ? 1 : -1;
    parts.push(
      drawMonkey(monkey, {
        x,
        baseline,
        scale,
        palette,
        ageId: age,
        walk,
        delay: index * 0.47 + (monkey.id % 5) * 0.31,
        working,
        celebrate,
        facing,
      }),
    );

    // Small, deterministic ambient props that make each monkey feel busy.
    if (working && ambientRng() > 0.35) {
      parts.push(
        `<g class="dust" style="animation-delay:-${(index * 0.7) % 2}s">${circle(
          x + 14 * facing,
          baseline - 4,
          3,
          palette.dirt,
          'opacity="0.35"',
        )}${circle(x + 19 * facing, baseline - 7, 2, palette.dirt, 'opacity="0.25"')}</g>`,
      );
    }
    if (monkey.role === 'musician') {
      parts.push(
        `<g class="note" style="animation-delay:-${(index * 0.9) % 3}s">${pixelText(
          '♪'.replace('♪', '*'),
          x + 18 * facing,
          baseline - 42,
          2,
          palette.accent,
        )}${rect(x + 26 * facing, baseline - 50, 2, 8, palette.accent)}${circle(
          x + 25 * facing,
          baseline - 42,
          2,
          palette.accent,
        )}</g>`,
      );
    }
    if (monkey.role === 'chef') {
      parts.push(
        `<g class="steam" style="animation-delay:-${(index * 0.5) % 2}s">${circle(
          x + 12 * facing,
          baseline - 36,
          3,
          palette.smokeLight,
          'opacity="0.3"',
        )}</g>`,
      );
    }
    if (monkey.role === 'astronaut' && age === 'space') {
      parts.push(
        `<g class="sparkle" style="animation-delay:-${(index * 0.4) % 2}s">${rect(
          x + 16 * facing,
          baseline - 58,
          2,
          2,
          palette.accent2,
        )}${rect(x + 20 * facing, baseline - 62, 1, 1, palette.accent2)}</g>`,
      );
    }

    if (index === 0) {
      const line =
        monkey.role === 'astronaut' && age === 'space'
          ? 'TO THE MOON!'
          : age === 'space'
            ? 'OOK!'
            : monkey.role === 'elder'
              ? 'OOK OOK'
              : age === 'stone'
                ? 'BANANA?'
                : age === 'medieval'
                  ? 'TRADE?'
                  : 'SHIP IT';
      speech.push(drawSpeechBubble(line, x + 8 * facing, baseline - scale * 33, palette, 2, 2.4));
    }
    if (monkey.role === 'astronaut' && age === 'space' && index !== 0 && !astronautSpoke) {
      astronautSpoke = true;
      speech.push(drawSpeechBubble('TO THE MOON!', x, baseline - scale * 35, palette, 2, 4.1));
    }
  });

  // In a still frame a single bubble reads as personality; several overlap.
  return `${parts.join('')}${(animation ? speech : speech.slice(0, 1)).join('')}`;
}

// ---------------------------------------------------------------------------
// Foreground and atmosphere
// ---------------------------------------------------------------------------

function renderForeground(rng: Rng, p: Palette, state: CivilizationState): string {
  const parts: string[] = [];
  const age = state.age.id;
  if (age === 'stone' || age === 'medieval') {
    parts.push(bananaPlant(18, 500, 1.15, p));
    parts.push(bananaPlant(48, 500, 0.9, p));
    parts.push(bananaPlant(930, 500, 1.1, p));
    parts.push(bananaPlant(954, 500, 1.25, p));
    parts.push(bush(84, 500, 0.9, p, true));
    parts.push(bush(900, 500, 0.8, p, true));
  } else if (age === 'industrial') {
    parts.push(pipeStub(22, 500, p));
    parts.push(barrel(76, 500, p));
    parts.push(crate(910, 500, p, 1, true));
    parts.push(pipeStub(948, 500, p));
  } else if (age === 'modern') {
    parts.push(pottedPlant(20, 500, 1.25, p));
    parts.push(bush(68, 500, 0.7, p, true));
    parts.push(pottedPlant(928, 500, 1.2, p));
    parts.push(bush(892, 500, 0.7, p, true));
  } else {
    parts.push(pipeStub(20, 500, p));
    parts.push(crate(902, 500, p, 1.1, false));
    parts.push(pipeStub(950, 500, p));
  }
  for (let i = 0; i < 22; i += 1) {
    const x = rng() * SCENE_WIDTH;
    const y = 498 + rng() * 2;
    const h = 4 + Math.floor(rng() * 8);
    parts.push(grassTuft(x, y, h, p, p.grassDark));
  }
  for (let i = 0; i < 9; i += 1) {
    const x = rng() * SCENE_WIDTH;
    parts.push(rockCluster(x, 499, 0.2 + rng() * 0.16, p));
  }
  if (age === 'stone' || age === 'medieval') {
    parts.push(
      `<g class="leaves">${rect(150, 300, 3, 2, p.leaf, 'opacity="0.8"')}${rect(
        300,
        260,
        2,
        2,
        p.accent,
        'opacity="0.7"',
      )}${rect(720, 320, 3, 2, p.leafDark, 'opacity="0.7"')}</g>`,
    );
  }
  if (age === 'space') {
    parts.push(
      `<g class="shooting-star">${line(120, 70, 190, 100, p.accent2, 2, 'opacity="0.85"')}${circle(
        190,
        100,
        2,
        p.accent2,
      )}</g>`,
    );
    parts.push(`<g class="aurora">${poly(
      [[40, 220], [170, 150], [310, 210], [440, 140], [560, 200], [560, 230], [440, 175], [310, 245], [170, 190], [40, 250]],
      p.accent2,
      'opacity="0.07"',
    )}${poly(
      [[120, 240], [250, 175], [390, 230], [520, 165], [660, 215], [660, 238], [520, 198], [390, 260], [250, 210], [120, 270]],
      p.accent,
      'opacity="0.06"',
    )}</g>`);
  }
  return parts.join('');
}

function renderStars(rng: Rng, p: Palette, state: CivilizationState): string {
  const parts: string[] = [];
  const count = state.age.id === 'space' ? 150 : 90;
  for (let i = 0; i < count; i += 1) {
    const x = rng() * SCENE_WIDTH;
    const y = 6 + rng() * 330;
    const size = rng() > 0.9 ? 2 : 1;
    parts.push(
      `<rect class="star" x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${size}" height="${size}" fill="${
        p.star
      }" style="animation-delay:-${((i * 0.37) % 5).toFixed(2)}s"/>`,
    );
    if (i % 19 === 0) {
      parts.push(
        `<g class="star" style="animation-delay:-${((i * 0.21) % 5).toFixed(2)}s">${rect(x - 3, y, 7, 1, p.star)}${rect(
          x,
          y - 3,
          1,
          7,
          p.star,
        )}</g>`,
      );
    }
  }
  return parts.join('');
}

function renderFireflies(rng: Rng, p: Palette, state: CivilizationState): string {
  if (state.age.id === 'space') return '';
  const parts: string[] = [];
  for (let i = 0; i < 12; i += 1) {
    const x = 30 + rng() * 900;
    const y = 410 + rng() * 78;
    parts.push(
      `<g class="firefly" style="animation-delay:-${(i * 0.8) % 6}s">${circle(
        x,
        y,
        5,
        p.fireLight,
        'opacity="0.12"',
      )}${circle(x, y, 1.7, p.fireLight)}${circle(x + 1, y - 1, 0.7, '#ffffff', 'opacity="0.8"')}</g>`,
    );
  }
  return parts.join('');
}

function renderLights(lights: LightSource[], p: Palette): string {
  const parts: string[] = [];
  lights.forEach((light, index) => {
    parts.push(lightPool(light.x, light.y, light.radius, light.color, (index * 0.13) % 4));
  });
  if (parts.length === 0) {
    parts.push(circle(0, 0, 0, p.accent, 'opacity="0"'));
  }
  return parts.join('');
}

function renderHeader(state: CivilizationState, palette: Palette): string {
  const username = state.username.toUpperCase().replace(/^DEMO-/, 'DEMO/');
  const day = state.days.length;
  const subtitle = `@${username} * YEAR 1 * DAY ${day}`;
  const tagline = 'COMMITS IN. BANANAS OUT.';
  const taglineX = 902 - pixelTextWidth(tagline, 2);
  const generated = 'AUTO-GENERATED DAILY';
  const generatedX = 902 - pixelTextWidth(generated, 2);
  return `<g class="header">${pixelHeader('MONKEY CIVILIZATION', 56, 18, 4, palette, 3)}${rect(
    56,
    50,
    258,
    2,
    palette.outline,
    'opacity="0.65"',
  )}${rect(56, 50, 190, 1, palette.accent, 'opacity="0.45"')}${pixelHeader(
    subtitle,
    58,
    56,
    2,
    palette,
    2,
  )}${pixelHeader(tagline, taglineX, 24, 2, palette, 2)}${pixelHeader(
    generated,
    generatedX,
    46,
    2,
    palette,
    2,
  )}${circle(generatedX - 12, 53, 3, palette.accent2)}${circle(generatedX - 12, 53, 6, palette.accent2, 'opacity="0.2"')}</g>`;
}

function pixelHeader(
  text: string,
  x: number,
  y: number,
  scale: number,
  palette: Palette,
  shadow: number,
): string {
  return `${pixelText(text, x + shadow, y + shadow, scale, palette.outline)}${pixelText(
    text,
    x,
    y,
    scale,
    palette.hudText,
  )}`;
}

// ---------------------------------------------------------------------------
// Small age-specific props
// ---------------------------------------------------------------------------

function bananaCrate(x: number, base: number, p: Palette): string {
  return `<g transform="translate(${x} ${base})">${ellipse(0, 1, 15, 2, p.shadow)}${rect(
    -14,
    -15,
    28,
    15,
    p.woodDark,
  )}${rect(-12, -13, 24, 11, p.wood)}${rect(-14, -10, 28, 2, p.woodDark)}${rect(
    -12,
    -17,
    24,
    3,
    p.woodLight,
  )}${bananaBunch(-8, -18, 1, p)}${bananaBunch(1, -17, 0.9, p)}</g>`;
}

function hayBale(x: number, base: number, p: Palette): string {
  return `<g transform="translate(${x} ${base})">${ellipse(0, 1, 11, 2, p.shadow)}${rect(
    -10,
    -13,
    20,
    13,
    p.bananaDark,
  )}${rect(-9, -12, 18, 10, p.banana)}${rect(-9, -9, 18, 1, p.bananaDark, 'opacity="0.5"')}${rect(
    -9,
    -5,
    18,
    1,
    p.bananaDark,
    'opacity="0.5"',
  )}${line(-10, -11, 10, -2, p.bananaDark, 1, 'opacity="0.6"')}</g>`;
}

function cart(x: number, base: number, p: Palette): string {
  return `<g transform="translate(${x} ${base})">${ellipse(0, 1, 20, 3, p.shadow)}${rect(
    -18,
    -18,
    36,
    12,
    p.woodDark,
  )}${rect(-16, -16, 32, 9, p.wood)}${circle(-10, -2, 4, p.outline)}${circle(
    -10,
    -2,
    2,
    p.wood,
  )}${circle(10, -2, 4, p.outline)}${circle(10, -2, 2, p.wood)}${rect(-20, -20, 3, 14, p.woodDark)}${rect(
    18,
    -20,
    3,
    14,
    p.woodDark,
  )}${bananaBunch(-8, -17, 1, p)}${bananaBunch(3, -16, 0.8, p)}</g>`;
}

function well(x: number, base: number, p: Palette): string {
  return `<g transform="translate(${x} ${base})">${ellipse(0, 1, 13, 2, p.shadow)}${rect(
    -10,
    -12,
    20,
    12,
    p.stoneDark,
  )}${rect(-9, -11, 18, 9, p.stone)}${ellipse(0, -11, 8, 2, p.water)}${rect(-2, -26, 4, 15, p.woodDark)}${rect(
    -9,
    -28,
    18,
    3,
    p.roof,
  )}${rect(-2, -25, 4, 3, p.metalDark)}</g>`;
}

function steamVent(x: number, base: number, p: Palette, delay: number): string {
  return `<g transform="translate(${x} ${base})">${rect(-5, -6, 10, 6, p.metalDark)}${rect(
    -4,
    -5,
    8,
    3,
    p.metal,
  )}${circle(0, -10, 5, p.smokeLight, 'opacity="0.15"')}${`<g class="steam" style="animation-delay:-${delay}s">${circle(
    0,
    -16,
    4,
    p.smokeLight,
    'opacity="0.35"',
  )}${circle(4, -23, 3, p.smokeLight, 'opacity="0.25"')}</g>`}</g>`;
}

function powerBox(x: number, base: number, p: Palette): string {
  return `<g transform="translate(${x} ${base})">${rect(-8, -20, 16, 20, p.metalDark)}${rect(
    -7,
    -19,
    14,
    18,
    p.metal,
  )}${rect(-5, -16, 10, 5, p.windowGlow, 'opacity="0.6"')}${rect(-4, -8, 8, 2, p.metalDark)}${rect(
    -4,
    -4,
    8,
    2,
    p.metalDark,
  )}${line(8, -18, 14, -24, p.metalDark, 2)}</g>`;
}

function gearCluster(x: number, base: number, p: Palette): string {
  return `<g transform="translate(${x} ${base})">${`<g class="gear">${circle(
    0,
    -10,
    8,
    p.metalDark,
  )}${circle(0, -10, 4, p.metal)}${rect(-1, -20, 2, 20, p.metalDark)}${rect(-10, -11, 20, 2, p.metalDark)}</g>`}${rect(
    -14,
    -2,
    28,
    2,
    p.metalDark,
  )}${circle(12, -8, 5, p.metalDark)}${circle(12, -8, 2, p.metal)}</g>`;
}

function coalPile(x: number, base: number, p: Palette): string {
  return `<g transform="translate(${x} ${base})">${ellipse(0, 1, 14, 2, p.shadow)}${poly(
    [[-13, 0], [-9, -8], [-2, -13], [6, -9], [14, 0]],
    p.outline,
  )}${poly([[-10, 0], [-7, -7], [-1, -10], [4, -7], [10, 0]], p.metalDark)}${circle(-4, -6, 2, p.metal)}${circle(
    4,
    -4,
    2,
    p.metal,
  )}</g>`;
}

function railSignal(x: number, base: number, p: Palette): string {
  return `<g transform="translate(${x} ${base})">${rect(-2, -34, 4, 34, p.metalDark)}${rect(
    -5,
    -42,
    10,
    8,
    p.metalDark,
  )}${circle(0, -39, 2.5, p.fire, 'class="blink"')}${rect(-7, -46, 14, 2, p.metal)}</g>`;
}

function streetTree(x: number, base: number, p: Palette): string {
  return `<g transform="translate(${x} ${base})">${ellipse(0, 1, 10, 2, p.shadow)}${rect(
    -2,
    -28,
    4,
    28,
    p.woodDark,
  )}${rect(-1, -28, 2, 28, p.wood)}${ellipse(0, -36, 15, 13, p.leaf)}${ellipse(-8, -30, 9, 8, p.leafDark)}${ellipse(
    8,
    -38,
    8,
    8,
    p.leaf,
  )}${ellipse(2, -46, 7, 6, p.jungleLight)}${rect(-10, -2, 20, 2, p.stoneDark)}</g>`;
}

function bench(x: number, base: number, p: Palette): string {
  return `<g transform="translate(${x} ${base})">${rect(-12, -10, 24, 3, p.wood)}${rect(
    -12,
    -16,
    24,
    2,
    p.wood,
  )}${rect(-10, -7, 2, 7, p.metalDark)}${rect(8, -7, 2, 7, p.metalDark)}${rect(
    -12,
    -14,
    2,
    8,
    p.woodDark,
  )}${rect(10, -14, 2, 8, p.woodDark)}</g>`;
}

function hydrant(x: number, base: number, p: Palette): string {
  return `<g transform="translate(${x} ${base})">${rect(-3, -10, 6, 10, p.accent)}${rect(
    -4,
    -12,
    8,
    3,
    p.accentDark,
  )}${rect(-5, -8, 2, 3, p.metalDark)}${rect(3, -8, 2, 3, p.metalDark)}${rect(
    -5,
    -2,
    10,
    2,
    p.metalDark,
  )}</g>`;
}

function trafficLight(x: number, base: number, p: Palette): string {
  return `<g transform="translate(${x} ${base})">${rect(-1, -30, 2, 30, p.metalDark)}${rect(
    -4,
    -46,
    8,
    16,
    p.metalDark,
  )}${circle(0, -42, 2, p.fire, 'class="blink"')}${circle(0, -36, 2, p.bananaDark)}${circle(
    0,
    -38,
    2,
    p.grass,
    'opacity="0.35"',
  )}</g>`;
}

function scooter(x: number, base: number, p: Palette): string {
  return `<g transform="translate(${x} ${base})">${circle(-9, -4, 4, p.outline)}${circle(
    -9,
    -4,
    2,
    p.metal,
  )}${circle(9, -4, 4, p.outline)}${circle(9, -4, 2, p.metal)}${rect(-8, -12, 15, 4, p.accent)}${rect(
    -2,
    -16,
    5,
    5,
    p.accent2,
  )}${line(6, -12, 9, -18, p.metalDark, 1.5)}${rect(8, -20, 4, 1, p.metalDark)}</g>`;
}

function robot(x: number, base: number, p: Palette, alt = false): string {
  return `<g transform="translate(${x} ${base})">${ellipse(0, 1, 8, 2, p.shadow)}${rect(
    -6,
    -24,
    12,
    14,
    p.metalDark,
  )}${rect(-5, -23, 10, 12, p.metal)}${rect(-3, -20, 6, 3, p.glass)}${circle(-1, -18.5, 1, p.accent2)}${rect(
    -4,
    -10,
    8,
    2,
    p.accent2,
    'opacity="0.7"',
  )}${rect(-4, -8, 3, 8, p.metalDark)}${rect(1, -8, 3, 8, p.metalDark)}${rect(
    -7,
    -28,
    14,
    4,
    alt ? p.accent2 : p.accent,
  )}${rect(-2, -31, 4, 3, p.metalDark)}${circle(0, -32, 1.5, alt ? p.accent : p.accent2, 'class="blink"')}${line(
    -7,
    -20,
    -11,
    -14,
    p.metalDark,
    2,
  )}${line(7, -20, 11, -14, p.metalDark, 2)}</g>`;
}

function holoSign(x: number, base: number, p: Palette, text: string): string {
  return `<g transform="translate(${x} ${base})">${rect(-1, -22, 2, 22, p.metalDark)}${`<g class="holo">${rect(
    -18,
    -40,
    36,
    16,
    p.accent2,
    'opacity="0.12"',
  )}${rect(-17, -39, 34, 14, 'none', `stroke="${p.accent2}" stroke-width="1" opacity="0.7"`)}${pixelText(
    text,
    -14,
    -36,
    1,
    p.accent2,
  )}</g>`}</g>`;
}

function pipeStub(x: number, base: number, p: Palette): string {
  return `<g transform="translate(${x} ${base})">${rect(-5, -18, 10, 18, p.metalDark)}${rect(
    -4,
    -17,
    8,
    16,
    p.metal,
  )}${rect(-5, -20, 10, 3, p.metalLight)}${rect(-3, -14, 6, 2, p.metalDark)}${rect(
    -3,
    -8,
    6,
    2,
    p.metalDark,
  )}</g>`;
}

function pipeCluster(x: number, base: number, p: Palette): string {
  return `<g transform="translate(${x} ${base})">${rect(-12, -6, 24, 6, p.metalDark)}${rect(
    -10,
    -18,
    6,
    14,
    p.metal,
  )}${rect(-2, -24, 6, 20, p.metal)}${rect(7, -16, 5, 12, p.metal)}${rect(
    -10,
    -20,
    6,
    2,
    p.metalDark,
  )}${rect(-2, -26, 6, 2, p.metalDark)}${rect(7, -18, 5, 2, p.metalDark)}</g>`;
}
