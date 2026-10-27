import type { CivilizationState, ContributionHistory, MonkeyState } from '../types.ts';
import type { Palette } from './palette.ts';
import { drawBuilding, type LightSource } from './buildings.ts';
import { drawMonkey, drawSpeechBubble } from './sprites.ts';
import { circle, ellipse, escapeXml, line, poly, rect } from './svg.ts';
import { pixelText, pixelTextWidth } from './pixel-font.ts';
import { createRng } from '../util/rng.ts';
import { formatNumber } from '../util/date.ts';
import { AGES } from '../sim/ages.ts';
import { SLOTS } from '../sim/catalog.ts';

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
    renderSun(palette, state),
    renderClouds(rng, palette),
    renderBirds(palette, state),
    renderMountains(rng, palette, state),
    renderJungle(rng, palette, state),
  ].join('');

  const ground = [
    renderGround(rng, palette),
    renderContributionPath(history, state, palette),
  ].join('');

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
        `@keyframes walk-${walker.id}{0%,100%{transform:translateX(0) scaleX(1)}45%{transform:translateX(${walker.distance}px) scaleX(1)}50%{transform:translateX(${walker.distance}px) scaleX(-1)}95%{transform:translateX(0) scaleX(-1)}}.walk-${walker.id}{animation-name:walk-${walker.id};animation-duration:${walker.duration}s;animation-timing-function:ease-in-out;animation-iteration-count:infinite}`,
    )
    .join('');
}

function renderSun(palette: Palette, state: CivilizationState): string {
  if (state.age.id === 'space') {
    return `<g class="planet" transform="translate(790 104)">${circle(0, 0, 34, palette.accent, 'opacity="0.12"')}${circle(
      0,
      0,
      24,
      palette.accent,
    )}${circle(-6, -7, 18, palette.accent2, 'opacity="0.5"')}${ellipse(
      0,
      2,
      40,
      10,
      'none',
      `stroke="${palette.accent2}" stroke-width="3" transform="rotate(-18)"`,
    )}${ellipse(0, 2, 44, 12, 'none', `stroke="${palette.accent}" stroke-width="1" transform="rotate(-18)"`)}</g>`;
  }
  const x = 790;
  const y = 112;
  return `<g class="sun" transform="translate(${x} ${y})">${circle(0, 0, 46, palette.sunGlow, 'opacity="0.16"')}${circle(
    0,
    0,
    34,
    palette.sunGlow,
    'opacity="0.22"',
  )}${circle(0, 0, 24, palette.sun)}${rect(-18, -12, 36, 24, palette.sun)}${rect(
    -12,
    -18,
    24,
    36,
    palette.sun,
  )}${rect(-30, -4, 8, 8, palette.sun)}${rect(22, -4, 8, 8, palette.sun)}${rect(
    -4,
    -30,
    8,
    8,
    palette.sun,
  )}${rect(-4, 22, 8, 8, palette.sun)}${rect(-6, -6, 12, 12, palette.sunGlow)}</g>`;
}

function renderMoon(palette: Palette, state: CivilizationState): string {
  if (state.age.id === 'space') return '';
  return `<g class="moon" transform="translate(812 110)">${circle(
    0,
    0,
    34,
    palette.moon,
    'opacity="0.12"',
  )}${circle(0, 0, 20, palette.moon)}${circle(-6, -5, 4, palette.cloudShade, 'opacity="0.6"')}${circle(
    7,
    6,
    3,
    palette.cloudShade,
    'opacity="0.5"',
  )}${circle(3, -9, 2, palette.cloudShade, 'opacity="0.5"')}</g>`;
}

function renderClouds(rng: ReturnType<typeof createRng>, palette: Palette): string {
  const clouds: string[] = [];
  const positions = [
    [120, 120, 1],
    [430, 78, 0.8],
    [700, 150, 0.65],
    [240, 210, 0.5],
  ] as const;
  positions.forEach(([x, y, scale], index) => {
    const width = 46 + Math.floor(rng() * 30);
    const parts: string[] = [];
    parts.push(rect(-width / 2, 0, width, 10, palette.cloud));
    parts.push(rect(-width / 2 + 8, -6, width - 18, 8, palette.cloud));
    parts.push(rect(-width / 2 + 18, -12, width - 36, 8, palette.cloud));
    parts.push(rect(-width / 2 + 4, 8, width - 8, 4, palette.cloudShade));
    clouds.push(
      `<g transform="translate(${x} ${y}) scale(${scale})"><g class="cloud cloud-${index}" style="animation-delay:-${index * 3.4}s;animation-duration:${18 + index * 4}s">${parts.join(
        '',
      )}</g></g>`,
    );
  });
  return clouds.join('');
}

function renderBirds(palette: Palette, state: CivilizationState): string {
  if (state.age.id === 'space') return '';
  const parts: string[] = [];
  const birds = [
    [300, 160, 1],
    [340, 142, 0.8],
    [380, 168, 0.7],
  ] as const;
  birds.forEach(([x, y, scale], index) => {
    parts.push(
      `<g transform="translate(${x} ${y}) scale(${scale})"><g class="bird bird-${index}" style="animation-delay:-${index * 2.1}s"><path d="M-7 0 L0 -5 L7 0" fill="none" stroke="${
        palette.outline
      }" stroke-width="2"/></g></g>`,
    );
  });
  return parts.join('');
}

function renderMountains(
  rng: ReturnType<typeof createRng>,
  palette: Palette,
  state: CivilizationState,
): string {
  const layers: string[] = [];
  const configs = [
    { base: 390, height: 110, color: palette.mountainFar, step: 48 },
    { base: 402, height: 82, color: palette.mountainMid, step: 40 },
    { base: 414, height: 54, color: palette.mountainNear, step: 34 },
  ];
  configs.forEach((config, layer) => {
    const points: Array<[number, number]> = [[0, config.base]];
    for (let x = 0; x <= SCENE_WIDTH + config.step; x += config.step) {
      const peak = config.base - config.height * (0.35 + rng() * 0.65);
      points.push([x, peak]);
      points.push([x + config.step * 0.45, peak]);
      points.push([x + config.step * 0.55, peak + 8 + rng() * 12]);
    }
    points.push([SCENE_WIDTH, config.base]);
    points.push([SCENE_WIDTH, GROUND_Y + 20]);
    points.push([0, GROUND_Y + 20]);
    layers.push(poly(points, config.color));
    if (layer === 0 && state.age.id !== 'space') {
      const caps: string[] = [];
      for (let i = 0; i < 5; i += 1) {
        const x = 80 + i * 190 + rng() * 40;
        caps.push(poly([[x, config.base - 72], [x + 18, config.base - 96], [x + 36, config.base - 72]], palette.cloud, 'opacity="0.55"'));
      }
      layers.push(caps.join(''));
    }
  });
  return layers.join('');
}

function renderJungle(
  rng: ReturnType<typeof createRng>,
  palette: Palette,
  state: CivilizationState,
): string {
  const parts: string[] = [];
  for (let i = 0; i < 18; i += 1) {
    const x = 10 + i * 56 + rng() * 18;
    const h = 18 + rng() * 34;
    parts.push(rect(x, GROUND_Y - h, 4, h, palette.jungleDark));
    parts.push(ellipse(x + 2, GROUND_Y - h - 4, 16 + rng() * 8, 10, palette.jungleDark));
    parts.push(ellipse(x + 2, GROUND_Y - h - 10, 10 + rng() * 6, 7, palette.jungle));
  }
  if (state.age.id === 'space') {
    parts.push(
      `<g opacity="0.55">${rect(0, GROUND_Y - 18, SCENE_WIDTH, 18, palette.jungleDark)}${rect(
        0,
        GROUND_Y - 28,
        SCENE_WIDTH,
        10,
        palette.jungle,
      )}</g>`,
    );
  }
  return parts.join('');
}

function renderGround(rng: ReturnType<typeof createRng>, palette: Palette): string {
  const parts: string[] = [];
  parts.push(rect(0, GROUND_Y, SCENE_WIDTH, SCENE_HEIGHT - GROUND_Y, palette.grass));
  parts.push(rect(0, GROUND_Y, SCENE_WIDTH, 8, palette.grassLight));
  parts.push(rect(0, GROUND_Y + 8, SCENE_WIDTH, 4, palette.grassDark));
  parts.push(rect(0, 462, SCENE_WIDTH, SCENE_HEIGHT - 462, palette.dirt));
  parts.push(rect(0, 486, SCENE_WIDTH, SCENE_HEIGHT - 486, palette.dirtDark));
  parts.push(rect(0, PATH_Y, SCENE_WIDTH, 18, palette.pathDark));
  parts.push(rect(0, PATH_Y + 2, SCENE_WIDTH, 12, palette.path));
  for (let x = 8; x < SCENE_WIDTH; x += 24) {
    const y = PATH_Y + 3 + Math.floor(rng() * 10);
    parts.push(rect(x, y, 8 + Math.floor(rng() * 8), 2, palette.pathLight));
  }
  for (let i = 0; i < 42; i += 1) {
    const x = rng() * SCENE_WIDTH;
    const y = GROUND_Y + 10 + rng() * 70;
    const h = 3 + Math.floor(rng() * 7);
    parts.push(rect(x, y - h, 2, h, palette.grassDark));
    parts.push(rect(x + 2, y - h + 2, 2, 2, palette.grassLight));
  }
  for (let i = 0; i < 12; i += 1) {
    const x = rng() * SCENE_WIDTH;
    const y = GROUND_Y + 22 + rng() * 62;
    parts.push(rect(x, y, 5, 3, palette.stone));
    parts.push(rect(x + 1, y - 2, 3, 2, palette.stoneLight));
  }
  for (let i = 0; i < 14; i += 1) {
    const x = 20 + rng() * 900;
    const y = GROUND_Y + 14 + rng() * 52;
    parts.push(rect(x, y, 2, 4, palette.grassDark));
    parts.push(rect(x - 1, y - 2, 2, 2, palette.accent));
  }
  return parts.join('');
}

function renderContributionPath(
  history: ContributionHistory,
  state: CivilizationState,
  palette: Palette,
): string {
  const weeks = history.stats.weeks;
  const max = Math.max(1, ...weeks.map((week) => week.total));
  const parts: string[] = [];
  const startX = 56;
  const tileWidth = 15;
  const gap = 1;
  const totalWidth = weeks.length * (tileWidth + gap) - gap;
  parts.push(rect(startX - 3, PATH_Y - 2, totalWidth + 6, 20, palette.outline, 'opacity="0.25"'));
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
      `<rect x="${x}" y="${PATH_Y + 1}" width="${tileWidth}" height="15" fill="${color}" opacity="${
        level === 0 ? 0.7 : 1
      }"><title>Week of ${escapeXml(week.start)}: ${formatNumber(week.total)} contributions</title></rect>`,
    );
    if (level >= 3) {
      parts.push(rect(x + 2, PATH_Y + 3, 3, 2, palette.bananaLight, 'opacity="0.8"'));
    }
  });
  state.events
    .filter((event) => event.type === 'age')
    .forEach((event) => {
      const weekIndex = Math.floor((event.day - 1) / 7);
      if (weekIndex < 0 || weekIndex >= weeks.length) return;
      const x = startX + weekIndex * (tileWidth + gap) + 7;
      parts.push(rect(x - 1, PATH_Y - 12, 2, 12, palette.metalDark));
      const age = AGES.find((candidate) => event.text.includes(candidate.name));
      parts.push(
        poly(
          [
            [x + 1, PATH_Y - 12],
            [x + 10, PATH_Y - 9],
            [x + 1, PATH_Y - 6],
          ],
          age?.accent ?? palette.accent,
          'class="path-flag"',
        ),
      );
    });
  return parts.join('');
}

const ROLE_ANCHORS: Record<
  MonkeyState['role'],
  { x: number; scale: number; working?: boolean }
> = {
  elder: { x: 78, scale: 2.05 },
  farmer: { x: 190, scale: 2.1, working: true },
  chef: { x: 306, scale: 2.0, working: true },
  musician: { x: 364, scale: 2.0 },
  builder: { x: 430, scale: 2.15, working: true },
  scholar: { x: 556, scale: 2.0 },
  astronaut: { x: 870, scale: 2.2 },
  walker: { x: 480, scale: 1.95 },
};

interface MonkeySpot {
  x: number;
  baseline: number;
  scale: number;
}

// Hand-placed spots give the troop depth: some monkeys stand on the road,
// some behind it on the grass, and some right at the front of the scene.
const MONKEY_SPOTS: readonly MonkeySpot[] = [
  { x: 78, baseline: 496, scale: 2.05 },
  { x: 132, baseline: 489, scale: 1.7 },
  { x: 190, baseline: 500, scale: 2.2 },
  { x: 248, baseline: 493, scale: 1.76 },
  { x: 306, baseline: 497, scale: 2.0 },
  { x: 364, baseline: 487, scale: 1.64 },
  { x: 430, baseline: 496, scale: 2.1 },
  { x: 494, baseline: 500, scale: 2.2 },
  { x: 556, baseline: 490, scale: 1.74 },
  { x: 618, baseline: 497, scale: 2.05 },
  { x: 684, baseline: 486, scale: 1.6 },
  { x: 746, baseline: 499, scale: 2.15 },
  { x: 808, baseline: 492, scale: 1.8 },
  { x: 870, baseline: 497, scale: 2.2 },
];

function planMonkeySpots(monkeys: MonkeyState[]): Map<number, MonkeySpot> {
  const free = MONKEY_SPOTS.map((_, index) => index);
  const result = new Map<number, MonkeySpot>();
  let walkerIndex = 0;

  // Give the named roles first pick of the spots near their buildings, then
  // let the walkers fill whatever is left.
  const ordered = [...monkeys].sort(
    (a, b) => Number(a.role === 'walker') - Number(b.role === 'walker') || a.id - b.id,
  );

  for (const monkey of ordered) {
    const target =
      monkey.role === 'walker'
        ? 96 + ((walkerIndex++ * 151 + monkey.id * 47) % 780)
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
  rng: ReturnType<typeof createRng>,
  palette: Palette,
  state: CivilizationState,
  lights: LightSource[],
): string {
  const parts: string[] = [];

  // A paved civic apron appears once the village can afford stone. It visually
  // ties the middle plots together and gives the monkeys a place to stand.
  if (state.ageIndex >= 2) {
    const base = state.age.id === 'space' ? palette.metalDark : palette.stoneDark;
    const top = state.age.id === 'space' ? palette.metal : palette.stone;
    parts.push(rect(390, 466, 320, 14, base));
    parts.push(rect(392, 468, 316, 10, top));
    for (let x = 400; x < 708; x += 16) {
      parts.push(rect(x, 468, 1, 10, base, 'opacity="0.75"'));
    }
    if (state.age.id === 'space') {
      parts.push(rect(392, 477, 316, 2, palette.accent2, 'opacity="0.65"'));
    }
  }

  parts.push(greatBananaTree(500, 470, palette, state));

  for (const x of [125, 374, 618, 748, 862]) {
    if (state.ageIndex === 0) {
      parts.push(torch(x, 470, palette));
    } else {
      parts.push(lampPost(x, 470, palette));
    }
    lights.push({
      x,
      y: state.ageIndex === 0 ? 448 : 428,
      radius: state.ageIndex === 0 ? 20 : 24,
      color: state.ageIndex === 0 ? palette.fire : palette.windowGlow,
    });
  }

  parts.push(bananaCrate(252, 470, palette));

  // A few loose stones and grass tufts break up the empty green strip.
  for (let i = 0; i < 10; i += 1) {
    const x = 30 + rng() * 900;
    const y = 458 + rng() * 10;
    parts.push(rect(x, y, 3 + Math.floor(rng() * 4), 2, palette.stone));
  }
  for (let i = 0; i < 18; i += 1) {
    const x = 20 + rng() * 920;
    const y = 456 + rng() * 12;
    parts.push(rect(x, y - 4, 1, 4, palette.grassDark));
    parts.push(rect(x + 1, y - 6, 1, 3, palette.grassLight));
  }

  return parts.join('');
}

function greatBananaTree(
  x: number,
  base: number,
  p: Palette,
  state: CivilizationState,
): string {
  const advanced = state.ageIndex >= 2;
  const planter = advanced
    ? `${rect(-24, -9, 48, 9, state.age.id === 'space' ? p.metalDark : p.stoneDark)}${rect(
        -22,
        -11,
        44,
        4,
        state.age.id === 'space' ? p.metal : p.stone,
      )}${rect(-5, -11, 10, 2, p.dirtDark)}`
    : `${ellipse(0, -4, 20, 5, p.dirtDark)}${rect(-14, -8, 28, 4, p.dirtDark)}`;
  const canopy = [
    poly([[-4, -70], [-38, -84], [-48, -76], [-14, -62]], p.leafDark),
    poly([[4, -70], [40, -86], [50, -78], [12, -60]], p.leaf),
    poly([[-3, -74], [-28, -104], [-38, -98], [-7, -78]], p.leaf),
    poly([[3, -74], [32, -108], [42, -100], [7, -78]], p.leafDark),
    poly([[-5, -76], [-14, -116], [-6, -122], [2, -80]], p.leaf),
    poly([[5, -76], [16, -118], [8, -122], [-2, -80]], p.leafDark),
    poly([[-18, -82], [-38, -70], [-32, -62], [-9, -68]], p.leafDark),
    poly([[18, -84], [40, -72], [34, -64], [9, -68]], p.leaf),
    line(-4, -70, -38, -82, p.leafDark, 1),
    line(4, -70, 40, -84, p.leafDark, 1),
    line(-3, -74, -28, -102, p.leafDark, 1),
    line(3, -74, 32, -106, p.leafDark, 1),
    rect(-4, -78, 8, 8, p.woodDark),
    rect(-2, -76, 4, 6, p.wood),
    bananaBunch(12, -64, p),
    bananaBunch(-15, -72, p),
    bananaBunch(2, -88, p),
  ].join('');
  return `<g transform="translate(${x} ${base})">${ellipse(0, 1, 34, 4, p.shadow)}${planter}${rect(
    -5,
    -72,
    10,
    62,
    p.woodDark,
  )}${rect(-3, -70, 6, 60, p.wood)}${rect(-6, -10, 12, 4, p.woodDark)}<g class="tree-sway">${canopy}</g></g>`;
}

function lampPost(x: number, base: number, p: Palette): string {
  return `<g transform="translate(${x} ${base})">${ellipse(0, 0, 8, 2, p.shadow)}${rect(
    -1,
    -36,
    3,
    36,
    p.metalDark,
  )}${rect(-5, -38, 11, 3, p.metalLight)}${rect(-4, -44, 9, 7, p.metalDark)}${rect(
    -2,
    -42,
    5,
    4,
    p.accent2,
  )}${rect(-5, -46, 11, 2, p.metal)}${circle(0, -40, 2, p.windowGlow)}</g>`;
}

function torch(x: number, base: number, p: Palette): string {
  return `<g transform="translate(${x} ${base})">${ellipse(0, 0, 7, 2, p.shadow)}${rect(
    -1,
    -28,
    3,
    28,
    p.woodDark,
  )}${rect(-3, -30, 7, 3, p.wood)}${poly(
    [[-4, -30], [0, -42], [4, -30]],
    p.fire,
    'class="flame"',
  )}${poly([[-2, -30], [0, -37], [2, -30]], p.fireLight, 'class="flame"')}</g>`;
}

function bananaCrate(x: number, base: number, p: Palette): string {
  return `<g transform="translate(${x} ${base})">${ellipse(0, 1, 14, 2, p.shadow)}${rect(
    -13,
    -14,
    26,
    14,
    p.woodDark,
  )}${rect(-11, -12, 22, 10, p.wood)}${rect(-13, -9, 26, 2, p.woodDark)}${rect(
    -11,
    -16,
    22,
    3,
    p.woodLight,
  )}${rect(-8, -20, 8, 2, p.bananaDark)}${rect(-7, -19, 7, 2, p.banana)}${rect(
    -4,
    -17,
    5,
    2,
    p.banana,
  )}${rect(1, -20, 7, 2, p.bananaDark)}${rect(2, -19, 6, 2, p.banana)}</g>`;
}

function bananaBunch(x: number, y: number, p: Palette): string {
  return `<g transform="translate(${x} ${y})">${rect(0, 0, 9, 2, p.bananaDark)}${rect(
    1,
    1,
    8,
    2,
    p.banana,
  )}${rect(3, 3, 6, 2, p.banana)}${rect(2, 5, 4, 1, p.bananaDark)}${rect(
    1,
    0,
    1,
    2,
    p.bananaLight,
  )}</g>`;
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

  monkeys.forEach((monkey, index) => {
    const spot = spots.get(monkey.id) ?? MONKEY_SPOTS[0]!;
    const anchor = ROLE_ANCHORS[monkey.role];
    const { x, baseline, scale } = spot;
    let walk: WalkerAnimation | undefined;
    const working = anchor.working ?? false;
    const celebrate = monkey.role === 'astronaut' && state.age.id === 'space';

    if (monkey.role === 'walker') {
      const direction = index % 2 === 0 ? 1 : -1;
      const distance = direction * (24 + (index % 3) * 12);
      const clampedDistance =
        x + distance * scale > 934 || x + distance * scale < 20 ? -distance : distance;
      walk = {
        id: monkey.id,
        distance: clampedDistance,
        duration: 12 + (index % 4) * 2.4,
        delay: (index * 1.7) % 9,
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
        ageId: state.age.id,
        walk,
        delay: index * 0.37,
        working,
        celebrate,
        facing,
      }),
    );

    if (index === 0) {
      speech.push(
        drawSpeechBubble(
          state.age.id === 'space' ? 'OOK!' : 'BANANA?',
          x + 4,
          baseline - scale * 29,
          palette,
          2,
          2.4,
        ),
      );
    }
    if (monkey.role === 'astronaut' && state.age.id === 'space') {
      speech.push(
        drawSpeechBubble(
          'TO THE MOON!',
          x,
          baseline - scale * 31,
          palette,
          2,
          3.8,
        ),
      );
    }
  });

  return `${parts.join('')}${speech.join('')}`;
}

function renderForeground(
  rng: ReturnType<typeof createRng>,
  palette: Palette,
  state: CivilizationState,
): string {
  const parts: string[] = [];
  const plants = [
    [18, 496, 1.1],
    [48, 498, 0.9],
    [930, 498, 1.0],
    [950, 496, 1.2],
  ] as const;
  plants.forEach(([x, y, scale]) => {
    parts.push(bananaPlantForeground(x, y, scale, palette));
  });
  for (let i = 0; i < 16; i += 1) {
    const x = rng() * SCENE_WIDTH;
    const y = 496 + rng() * 4;
    const h = 4 + Math.floor(rng() * 8);
    parts.push(rect(x, y - h, 2, h, palette.grassDark));
    parts.push(rect(x + 2, y - h + 2, 2, 3, palette.grassLight));
  }
  if (state.age.id === 'space') {
    parts.push(
      `<g class="shooting-star">${line(120, 70, 190, 100, palette.accent2, 2, 'opacity="0.8"')}${circle(
        190,
        100,
        2,
        palette.accent2,
      )}</g>`,
    );
  }
  return parts.join('');
}

function bananaPlantForeground(x: number, y: number, scale: number, p: Palette): string {
  return `<g transform="translate(${x} ${y}) scale(${scale})" shape-rendering="crispEdges">${rect(
    -2,
    -34,
    4,
    34,
    p.woodDark,
  )}${rect(-1, -34, 2, 34, p.wood)}${poly([[-2, -32], [-22, -42], [-6, -24]], p.leafDark)}${poly(
    [[2, -30], [22, -42], [7, -22]],
    p.leaf,
  )}${poly([[-1, -26], [-18, -18], [-2, -14]], p.leaf)}${poly(
    [[1, -24], [18, -16], [2, -12]],
    p.leafDark,
  )}${rect(-3, -32, 6, 2, p.bananaDark)}${rect(-2, -31, 4, 1, p.banana)}${rect(
    -5,
    -29,
    3,
    1,
    p.banana,
  )}${rect(2, -29, 3, 1, p.banana)}</g>`;
}

function renderStars(
  rng: ReturnType<typeof createRng>,
  palette: Palette,
  state: CivilizationState,
): string {
  const parts: string[] = [];
  const count = state.age.id === 'space' ? 110 : 70;
  for (let i = 0; i < count; i += 1) {
    const x = rng() * SCENE_WIDTH;
    const y = 8 + rng() * 300;
    const size = rng() > 0.9 ? 2 : 1;
    parts.push(
      `<rect class="star" x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${size}" height="${size}" fill="${
        palette.star
      }" style="animation-delay:-${(i * 0.37) % 5}s"/>`,
    );
    if (i % 23 === 0) {
      parts.push(
        `<g class="star" style="animation-delay:-${(i * 0.21) % 5}s">${rect(x - 3, y, 7, 1, palette.star)}${rect(
          x,
          y - 3,
          1,
          7,
          palette.star,
        )}</g>`,
      );
    }
  }
  return parts.join('');
}

function renderFireflies(
  rng: ReturnType<typeof createRng>,
  palette: Palette,
  state: CivilizationState,
): string {
  if (state.age.id === 'space') return '';
  const parts: string[] = [];
  for (let i = 0; i < 10; i += 1) {
    const x = 30 + rng() * 900;
    const y = 420 + rng() * 60;
    parts.push(
      `<g class="firefly" style="animation-delay:-${(i * 0.8) % 6}s">${circle(
        x,
        y,
        4,
        palette.fireLight,
        'opacity="0.12"',
      )}${circle(x, y, 1.5, palette.fireLight)}</g>`,
    );
  }
  return parts.join('');
}

function renderLights(lights: LightSource[], palette: Palette): string {
  const parts: string[] = [];
  lights.forEach((light, index) => {
    parts.push(
      `<g class="lamp" style="animation-delay:-${(index * 0.13) % 4}s">${circle(
        light.x,
        light.y,
        light.radius,
        light.color,
        'opacity="0.10"',
      )}${circle(light.x, light.y, light.radius * 0.55, light.color, 'opacity="0.16"')}${circle(
        light.x,
        light.y,
        Math.max(2, light.radius * 0.18),
        light.color,
        'opacity="0.55"',
      )}</g>`,
    );
  });
  if (parts.length === 0) {
    parts.push(circle(0, 0, 0, palette.accent, 'opacity="0"'));
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
  return `<g class="header">${pixelHeader('MONKEY CIVILIZATION', 56, 18, 4, palette, 3)}${pixelHeader(
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
  )}${circle(generatedX - 12, 53, 3, palette.accent2)}</g>`;
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
