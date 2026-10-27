import type { AgeId, MonkeyState } from '../types.ts';
import type { Palette } from './palette.ts';
import { circle, ellipse, line, poly, rect } from './svg.ts';
import { pixelText } from './pixel-font.ts';

export interface MonkeyDrawOptions {
  x: number;
  baseline: number;
  scale: number;
  palette: Palette;
  ageId: AgeId;
  walk?: {
    distance: number;
    duration: number;
    delay: number;
  };
  delay?: number;
  celebrate?: boolean;
  working?: boolean;
  facing?: 1 | -1;
}

interface Fur {
  outline: string;
  fur: string;
  furLight: string;
  face: string;
  faceShade: string;
  ear: string;
}

const FURS: readonly Fur[] = [
  {
    outline: '#241a20',
    fur: '#8b5a2b',
    furLight: '#b97a45',
    face: '#f2c48d',
    faceShade: '#d99a63',
    ear: '#a9713a',
  },
  {
    outline: '#1d1518',
    fur: '#6b4226',
    furLight: '#9a6238',
    face: '#e8b07a',
    faceShade: '#c98a58',
    ear: '#7d4f2c',
  },
  {
    outline: '#2a1d1a',
    fur: '#a9713a',
    furLight: '#d99a63',
    face: '#f7d3a0',
    faceShade: '#e0b47a',
    ear: '#c08448',
  },
  {
    outline: '#20191c',
    fur: '#5a4a3a',
    furLight: '#8a7058',
    face: '#d8a878',
    faceShade: '#b88a5f',
    ear: '#6e5a46',
  },
];

const SHIRTS = ['#e85d75', '#4aa3df', '#7bc043', '#f2b134', '#9b7ede', '#f07f4f'] as const;
const PANTS = ['#3b4a6b', '#5a3b2e', '#2f5a4a', '#4a3b5a'] as const;

export function drawMonkey(monkey: MonkeyState, options: MonkeyDrawOptions): string {
  const fur = FURS[monkey.color % FURS.length] ?? FURS[0];
  if (!fur) return '';
  const shirt = SHIRTS[monkey.id % SHIRTS.length] ?? '#e85d75';
  const pants = PANTS[monkey.id % PANTS.length] ?? '#3b4a6b';
  const palette = options.palette;
  const delay = options.delay ?? 0;
  const walk = options.walk;
  const facing = options.facing ?? 1;

  const classes = ['monkey'];
  if (walk) classes.push('walker');
  if (options.working) classes.push('working');

  const inner: string[] = [];

  // Tail sits behind everything.
  inner.push(
    `<g class="tail" style="transform-origin: 5px -9px">${rect(5, -10, 3, 1, fur.fur)}${rect(
      7,
      -9,
      1,
      3,
      fur.fur,
    )}${rect(6, -7, 2, 1, fur.furLight)}${rect(5, -6, 2, 1, fur.fur)}</g>`,
  );

  // Legs are separate groups so they can swing.
  inner.push(
    `<g class="leg leg-l">${rect(-3, -6, 2, 5, pants)}${rect(-4, -2, 3, 2, fur.outline)}${rect(
      -3,
      -2,
      2,
      1,
      fur.furLight,
    )}</g>`,
  );
  inner.push(
    `<g class="leg leg-r">${rect(1, -6, 2, 5, pants)}${rect(1, -2, 3, 2, fur.outline)}${rect(
      2,
      -2,
      2,
      1,
      fur.furLight,
    )}</g>`,
  );

  // Body and shirt.
  inner.push(rect(-5, -14, 10, 9, fur.outline));
  inner.push(rect(-4, -13, 8, 7, shirt));
  inner.push(rect(-2, -11, 4, 4, fur.face));
  inner.push(rect(-2, -11, 4, 1, fur.faceShade));
  inner.push(rect(-3, -13, 1, 3, fur.outline));
  inner.push(rect(2, -13, 1, 3, fur.outline));
  inner.push(rect(-4, -7, 8, 1, pants));

  // Arms. The right arm gets a tool when the monkey has a job.
  inner.push(
    `<g class="arm arm-l">${rect(-7, -13, 2, 6, shirt)}${rect(-7, -8, 2, 2, fur.fur)}${rect(
      -7,
      -8,
      1,
      1,
      fur.furLight,
    )}</g>`,
  );
  inner.push(
    `<g class="arm arm-r">${rect(5, -13, 2, 6, shirt)}${rect(5, -8, 2, 2, fur.fur)}${rect(
      5,
      -8,
      1,
      1,
      fur.furLight,
    )}</g>`,
  );

  // Head.
  inner.push(rect(-5, -22, 10, 8, fur.outline));
  inner.push(rect(-4, -21, 8, 6, fur.fur));
  inner.push(rect(-7, -19, 2, 3, fur.outline));
  inner.push(rect(5, -19, 2, 3, fur.outline));
  inner.push(rect(-6, -18, 1, 2, fur.ear));
  inner.push(rect(5, -18, 1, 2, fur.ear));
  inner.push(rect(-3, -19, 6, 4, fur.face));
  inner.push(rect(-3, -19, 6, 1, fur.faceShade));
  inner.push(rect(-2, -18, 1, 2, fur.outline));
  inner.push(rect(1, -18, 1, 2, fur.outline));
  inner.push(rect(-1, -16, 3, 1, fur.faceShade));
  inner.push(rect(0, -15, 2, 1, fur.outline));
  inner.push(rect(-1, -23, 2, 1, fur.furLight));

  // Accessory.
  inner.push(drawAccessory(monkey, fur, palette));

  // Tools / carried bananas.
  inner.push(drawTool(monkey, fur, palette, shirt));

  const sprite = inner.join('');
  const walkGroup = walk
    ? `<g class="walk walk-${monkey.id}" style="animation-delay:-${walk.delay}s">${sprite}</g>`
    : `<g class="monkey-idle${options.celebrate ? ' celebrate' : ''}" style="animation-delay:-${delay}s">${sprite}</g>`;

  return `<g transform="translate(${options.x} ${options.baseline}) scale(${options.scale * facing} ${options.scale})" class="${classes.join(
    ' ',
  )}">${ellipse(0, 0.5, 7, 1.4, palette.shadow)}${walkGroup}</g>`;
}

function drawAccessory(monkey: MonkeyState, fur: Fur, palette: Palette): string {
  switch (monkey.accessory) {
    case 'leaf':
      return [
        rect(-4, -24, 8, 2, palette.leafDark),
        rect(-3, -25, 6, 1, palette.leaf),
        rect(-1, -26, 2, 1, palette.leafDark),
        poly([[-7, -24], [-4, -24], [-5, -22]], palette.leaf),
        poly([[7, -24], [4, -24], [5, -22]], palette.leaf),
      ].join('');
    case 'hardhat':
      return [
        rect(-6, -24, 12, 2, '#f2b134'),
        rect(-4, -26, 8, 2, '#ffcc4d'),
        rect(-5, -25, 1, 1, '#e0a020'),
        rect(4, -25, 1, 1, '#e0a020'),
      ].join('');
    case 'helmet':
      return [
        ellipse(0, -18, 8, 8, palette.glass, `opacity="0.28" stroke="${palette.glassLight}" stroke-width="1"`),
        rect(-6, -14, 12, 1, palette.metalLight),
        rect(-1, -28, 2, 2, palette.metal),
        circle(0, -29, 1, palette.accent2),
      ].join('');
    case 'bow':
      return [
        rect(-1, -24, 2, 2, '#f06292'),
        poly([[-5, -25], [-1, -24], [-5, -22]], '#f06292'),
        poly([[5, -25], [1, -24], [5, -22]], '#f06292'),
      ].join('');
    case 'crown':
      return [
        rect(-5, -25, 10, 2, '#ffd93d'),
        rect(-5, -27, 1, 2, '#ffd93d'),
        rect(-1, -28, 2, 3, '#ffd93d'),
        rect(4, -27, 1, 2, '#ffd93d'),
        rect(-3, -24, 1, 1, '#e0a800'),
        rect(2, -24, 1, 1, '#e0a800'),
      ].join('');
    default:
      return '';
  }
}

function drawTool(monkey: MonkeyState, fur: Fur, palette: Palette, shirt: string): string {
  switch (monkey.role) {
    case 'farmer':
      return `<g class="tool tool-hoe" style="transform-origin: 6px -8px">${line(
        6,
        -8,
        11,
        -16,
        palette.woodDark,
        1.5,
      )}${rect(9, -18, 4, 1, palette.metal)}${rect(12, -17, 1, 2, palette.metalDark)}</g>`;
    case 'builder':
      return `<g class="tool tool-hammer" style="transform-origin: 6px -8px">${rect(
        6,
        -8,
        1,
        6,
        palette.woodDark,
      )}${rect(5, -10, 4, 2, palette.metal)}${rect(5, -10, 4, 1, palette.metalLight)}</g>`;
    case 'scholar':
      return `${rect(6, -10, 4, 4, '#4aa3df')}${rect(7, -9, 3, 3, '#e8f0f4')}${rect(
        8,
        -9,
        1,
        3,
        '#4aa3df',
      )}`;
    case 'musician':
      return `<g class="tool tool-banjo" style="transform-origin: 6px -8px">${circle(
        8,
        -7,
        3,
        palette.wood,
      )}${circle(8, -7, 1.5, palette.woodLight)}${line(9, -9, 12, -15, palette.woodDark, 1)}${rect(
        11,
        -16,
        2,
        2,
        palette.metal,
      )}</g>`;
    case 'chef':
      return `<g class="tool tool-pan" style="transform-origin: 6px -8px">${ellipse(
        8,
        -7,
        3,
        2,
        palette.metalDark,
      )}${ellipse(8, -7, 2, 1.2, palette.metalLight)}${rect(10, -7, 4, 1, palette.woodDark)}${rect(
        12,
        -9,
        2,
        1,
        palette.banana,
      )}</g>`;
    case 'elder':
      return `${line(7, -8, 7, 0, palette.woodDark, 1.5)}${rect(5, -2, 3, 1, palette.wood)}`;
    case 'astronaut':
      return `${rect(5, -11, 2, 2, shirt)}${rect(5, -11, 1, 1, palette.accent2)}`;
    case 'walker':
      return monkey.id % 3 === 0
        ? `${rect(6, -9, 3, 1, palette.bananaDark)}${rect(7, -10, 2, 1, palette.banana)}${rect(
            6,
            -8,
            2,
            1,
            palette.bananaLight,
          )}`
        : '';
    default:
      return '';
  }
}

export function drawSpeechBubble(
  text: string,
  x: number,
  y: number,
  palette: Palette,
  scale = 2,
  delay = 0,
): string {
  const width = Math.max(24, text.length * 6 * scale + 10);
  const height = 7 * scale + 10;
  const cx = Math.max(width / 2 + 4, Math.min(SCENE_SAFE_WIDTH - width / 2, x));
  return `<g class="speech" style="animation-delay:-${delay}s">${rect(
    cx - width / 2 + 2,
    y + 2,
    width,
    height,
    'rgba(20, 12, 20, 0.4)',
  )}${rect(cx - width / 2, y, width, height, '#fff8e8', `stroke="${palette.outline}" stroke-width="2"`)}${poly(
    [
      [cx - 5, y + height],
      [cx + 5, y + height],
      [cx, y + height + 7],
    ],
    '#fff8e8',
    `stroke="${palette.outline}" stroke-width="2"`,
  )}${pixelText(text, cx - width / 2 + 5, y + 5, scale, palette.outline)}</g>`;
}

const SCENE_SAFE_WIDTH = 960;

export function drawBananaIcon(x: number, y: number, scale: number, palette: Palette): string {
  return `<g transform="translate(${x} ${y}) scale(${scale})" shape-rendering="crispEdges">${rect(
    1,
    1,
    6,
    2,
    palette.bananaDark,
  )}${rect(2, 0, 5, 1, palette.banana)}${rect(3, 3, 5, 2, palette.banana)}${rect(
    2,
    5,
    3,
    1,
    palette.bananaDark,
  )}${rect(0, 0, 1, 2, palette.bananaDark)}${rect(7, 5, 1, 2, palette.bananaDark)}${rect(
    3,
    1,
    2,
    1,
    palette.bananaLight,
  )}</g>`;
}

export function drawMonkeyFaceIcon(
  x: number,
  y: number,
  scale: number,
  palette: Palette,
): string {
  return `<g transform="translate(${x} ${y}) scale(${scale})" shape-rendering="crispEdges">${rect(
    1,
    0,
    8,
    8,
    palette.outline,
  )}${rect(2, 1, 6, 6, '#8b5a2b')}${rect(0, 2, 2, 3, palette.outline)}${rect(
    8,
    2,
    2,
    3,
    palette.outline,
  )}${rect(1, 2, 1, 2, '#a9713a')}${rect(8, 2, 1, 2, '#a9713a')}${rect(
    3,
    2,
    4,
    4,
    '#f2c48d',
  )}${rect(4, 3, 1, 1, palette.outline)}${rect(6, 3, 1, 1, palette.outline)}${rect(
    5,
    5,
    2,
    1,
    '#d99a63',
  )}</g>`;
}

export function drawAgeIcon(
  ageId: AgeId,
  x: number,
  y: number,
  scale: number,
  palette: Palette,
): string {
  const parts: string[] = [];
  if (ageId === 'stone') {
    parts.push(rect(2, 6, 8, 2, palette.stoneDark));
    parts.push(poly([[3, 6], [5, 1], [7, 6]], palette.fire));
    parts.push(poly([[5, 6], [6, 2], [8, 6]], palette.fireLight));
  } else if (ageId === 'medieval') {
    parts.push(rect(1, 3, 10, 5, palette.stone));
    parts.push(rect(0, 2, 2, 6, palette.stoneLight));
    parts.push(rect(10, 2, 2, 6, palette.stoneLight));
    parts.push(rect(3, 0, 2, 3, palette.stoneLight));
    parts.push(rect(7, 0, 2, 3, palette.stoneLight));
    parts.push(rect(4, 5, 4, 3, palette.outline));
  } else if (ageId === 'industrial') {
    parts.push(rect(1, 4, 10, 4, palette.brick));
    parts.push(rect(2, 1, 2, 4, palette.brickDark));
    parts.push(rect(7, 2, 2, 3, palette.brickDark));
    parts.push(rect(3, 6, 2, 2, palette.window));
    parts.push(rect(7, 6, 2, 2, palette.window));
    parts.push(rect(1, 8, 10, 1, palette.brickDark));
  } else if (ageId === 'modern') {
    parts.push(rect(2, 1, 8, 8, palette.glass));
    parts.push(rect(2, 1, 8, 1, palette.glassLight));
    parts.push(rect(4, 3, 1, 2, palette.glassDark));
    parts.push(rect(6, 3, 1, 2, palette.glassDark));
    parts.push(rect(4, 6, 1, 2, palette.glassDark));
    parts.push(rect(6, 6, 1, 2, palette.glassDark));
    parts.push(rect(1, 8, 10, 1, palette.metalDark));
  } else {
    parts.push(poly([[5, 0], [8, 5], [8, 8], [2, 8], [2, 5]], palette.metalLight));
    parts.push(poly([[5, 1], [7, 5], [7, 7], [3, 7], [3, 5]], palette.metal));
    parts.push(circle(5, 5, 1.2, palette.accent2));
    parts.push(poly([[2, 8], [8, 8], [10, 10], [0, 10]], palette.accent));
  }
  return `<g transform="translate(${x} ${y}) scale(${scale})" shape-rendering="crispEdges">${parts.join(
    '',
  )}</g>`;
}
