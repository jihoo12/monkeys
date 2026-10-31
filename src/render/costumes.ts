import type { HolidayId } from './holidays.ts';
import { circle, line, poly, rect } from './svg.ts';

/**
 * Holiday costumes for monkeys.
 *
 * Every costume is drawn in the monkey's local sprite space: the head spans
 * x -6..6 and its crown sits at y -32. Variants are picked from the monkey id,
 * so the same monkey always wears the same costume.
 */

type Costume = () => string;

const WITCH = '#3a2050';
const WITCH_DARK = '#24122f';

const COSTUMES: Record<HolidayId, readonly Costume[]> = {
  halloween: [witchHat, devilHorns, catEars],
  christmas: [santaHat, reindeerAntlers, elfHat],
  'new-year': [partyHat, topHat('#1a1a24', '#ffd93d'), partyGlasses],
  valentines: [heartBopper, heartGlasses, flowerCrown(['#e63975', '#ffc2d4', '#ff8fb0'])],
  'st-patricks': [leprechaunHat, shamrockBopper, leprechaunBeard],
  easter: [bunnyEars, eggshellHat, flowerCrown(['#ffe066', '#b07ae8', '#ffb3c8'])],
  independence: [unclesamHat, starBopper, topHat('#1d3557', '#e63946')],
  thanksgiving: [pilgrimHat, featherCrown, pilgrimBonnet],
};

/** The costume for a monkey without a space helmet. */
export function drawCostume(holiday: HolidayId, monkeyId: number): string {
  const variants = COSTUMES[holiday];
  const costume = variants[Math.abs(monkeyId) % variants.length] ?? variants[0];
  return costume ? `<g class="costume">${costume()}</g>` : '';
}

/** Helmeted monkeys keep the helmet and get a tiny topper on the antenna. */
export function drawHelmetTopper(holiday: HolidayId): string {
  switch (holiday) {
    case 'halloween':
      return `${rect(-3, -41, 6, 4, '#ff8c1a')}${rect(-2, -42, 4, 1, '#ff8c1a')}${rect(-1, -43, 2, 1, '#3f7a3a')}${rect(-2, -40, 1, 1, '#2a0f08')}${rect(1, -40, 1, 1, '#2a0f08')}`;
    case 'christmas':
      return `${circle(0, -40, 2.6, '#e63946')}${rect(-1, -43, 2, 1, '#ffd166')}${rect(-1, -41, 1, 1, '#ffffff', 'opacity="0.7"')}`;
    case 'new-year':
      return `${star(0, -41, 3.4, '#ffd93d')}`;
    case 'valentines':
      return pixelHeart(0, -41, '#e63975');
    case 'st-patricks':
      return shamrock(0, -41, 0.6, '#2a9d4f');
    case 'easter':
      return `${rect(-2, -44, 4, 6, '#ffb3c8')}${rect(-3, -42, 6, 3, '#ffb3c8')}${rect(-3, -41, 6, 1, '#b07ae8')}`;
    case 'independence':
      return star(0, -41, 3.4, '#f1faee');
    case 'thanksgiving':
      return `${rect(-1, -44, 2, 7, '#c0561f')}${rect(-3, -42, 2, 4, '#e0a020')}${rect(1, -42, 2, 4, '#a86a2a')}`;
  }
  return '';
}

// ---------------------------------------------------------------------------
// Shared bits
// ---------------------------------------------------------------------------

function pixelHeart(x: number, y: number, color: string): string {
  return `${rect(x - 3, y - 2, 2, 2, color)}${rect(x + 1, y - 2, 2, 2, color)}${rect(x - 3, y, 6, 1, color)}${rect(
    x - 2,
    y + 1,
    4,
    1,
    color,
  )}${rect(x - 1, y + 2, 2, 1, color)}${rect(x - 2, y - 2, 1, 1, '#ffffff', 'opacity="0.55"')}`;
}

function star(x: number, y: number, r: number, color: string): string {
  const points: Array<[number, number]> = [];
  for (let i = 0; i < 10; i += 1) {
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    const radius = i % 2 === 0 ? r : r * 0.45;
    points.push([x + Math.cos(angle) * radius, y + Math.sin(angle) * radius]);
  }
  return poly(points, color);
}

function shamrock(x: number, y: number, scale: number, color: string): string {
  return `<g transform="translate(${x} ${y}) scale(${scale})">${circle(-2.6, -2, 2.8, color)}${circle(
    2.6,
    -2,
    2.8,
    color,
  )}${circle(0, 1.6, 2.8, color)}${rect(-0.6, 2, 1.2, 4, color)}</g>`;
}

/** A thin headband with two springy antennae, each topped by `topper`. */
function bopper(band: string, topper: (x: number, y: number) => string): string {
  return `${rect(-6, -33, 12, 1, band)}${line(-4, -33, -5, -39, band, 1)}${line(4, -33, 5, -39, band, 1)}${topper(
    -5,
    -40,
  )}${topper(5, -40)}`;
}

// ---------------------------------------------------------------------------
// Halloween
// ---------------------------------------------------------------------------

function witchHat(): string {
  return `${rect(-9, -33, 18, 2, WITCH_DARK)}${rect(-8, -34, 16, 1, WITCH)}${rect(-5, -37, 10, 3, WITCH)}${rect(
    -4,
    -40,
    8,
    3,
    WITCH,
  )}${rect(-3, -43, 5, 3, WITCH)}${rect(-1, -46, 4, 3, WITCH)}${rect(2, -47, 3, 2, WITCH_DARK)}${rect(
    -5,
    -36,
    10,
    1,
    '#ff7518',
  )}${rect(-1, -37, 2, 2, '#ffd166')}${rect(-4, -40, 2, 3, '#ffffff', 'opacity="0.12"')}`;
}

function devilHorns(): string {
  return `${poly(
    [
      [-6, -30],
      [-3, -31],
      [-7, -38],
    ],
    '#d62839',
  )}${poly(
    [
      [6, -30],
      [3, -31],
      [7, -38],
    ],
    '#d62839',
  )}${rect(-6, -35, 1, 2, '#ff6b6b', 'opacity="0.8"')}${rect(5, -35, 1, 2, '#ff6b6b', 'opacity="0.8"')}`;
}

function catEars(): string {
  return `${rect(-6, -33, 12, 1, '#1a1020')}${poly(
    [
      [-7, -32],
      [-2, -32],
      [-6, -39],
    ],
    '#1a1020',
  )}${poly(
    [
      [7, -32],
      [2, -32],
      [6, -39],
    ],
    '#1a1020',
  )}${poly(
    [
      [-5.5, -33],
      [-3.5, -33],
      [-5.2, -36.5],
    ],
    '#ff8fb0',
  )}${poly(
    [
      [5.5, -33],
      [3.5, -33],
      [5.2, -36.5],
    ],
    '#ff8fb0',
  )}`;
}

// ---------------------------------------------------------------------------
// Christmas
// ---------------------------------------------------------------------------

function santaHat(): string {
  return `${rect(-5, -38, 10, 4, '#d62839')}${rect(-3, -41, 8, 3, '#d62839')}${rect(1, -43, 6, 2, '#d62839')}${rect(
    5,
    -42,
    3,
    3,
    '#a4161a',
  )}${rect(-4, -38, 3, 3, '#ff6b6b', 'opacity="0.5"')}${rect(-7, -35, 14, 3, '#f4faff')}${rect(
    -7,
    -33,
    14,
    1,
    '#c8dce8',
  )}${circle(8.5, -39, 2.2, '#f4faff')}`;
}

function reindeerAntlers(): string {
  const brown = '#7a4a26';
  return `${rect(-5, -33, 10, 1, brown)}${rect(-5, -38, 2, 6, brown)}${rect(-8, -40, 2, 3, brown)}${rect(
    -7,
    -38,
    3,
    1,
    brown,
  )}${rect(-4, -41, 1, 3, brown)}${rect(3, -38, 2, 6, brown)}${rect(6, -40, 2, 3, brown)}${rect(
    4,
    -38,
    3,
    1,
    brown,
  )}${rect(3, -41, 1, 3, brown)}${rect(-1, -26, 3, 2, '#e63946')}${rect(-1, -26, 1, 1, '#ffb3b3')}`;
}

function elfHat(): string {
  return `${poly(
    [
      [-6, -33],
      [6, -33],
      [-9, -44],
    ],
    '#2a9d4f',
  )}${poly(
    [
      [-3, -36],
      [1, -36],
      [-5, -40],
    ],
    '#e63946',
  )}${rect(-7, -34, 14, 2, '#e63946')}${rect(-6, -34, 2, 1, '#ffd166')}${rect(-1, -34, 2, 1, '#ffd166')}${rect(
    4,
    -34,
    2,
    1,
    '#ffd166',
  )}${circle(-9.5, -44, 1.6, '#ffd166')}`;
}

// ---------------------------------------------------------------------------
// New Year
// ---------------------------------------------------------------------------

function partyHat(): string {
  return `${poly(
    [
      [-5, -33],
      [5, -33],
      [0, -46],
    ],
    '#6ee7f9',
  )}${poly(
    [
      [-3.6, -37],
      [3.6, -37],
      [2.4, -40],
      [-2.4, -40],
    ],
    '#ff8fb0',
  )}${poly(
    [
      [-4.8, -34],
      [4.8, -34],
      [4.2, -35.5],
      [-4.2, -35.5],
    ],
    '#ffd93d',
  )}${rect(-1.2, -43, 2.4, 1.4, '#ffd93d')}${circle(0, -47, 2, '#ffd93d')}${rect(-1, -48, 1, 1, '#ffffff')}`;
}

function topHat(color: string, band: string): Costume {
  return () =>
    `${rect(-8, -34, 16, 2, color)}${rect(-5, -43, 10, 9, color)}${rect(-5, -37, 10, 2, band)}${rect(
      -4,
      -42,
      2,
      5,
      '#ffffff',
      'opacity="0.14"',
    )}${rect(-6, -44, 12, 1, color)}`;
}

function partyGlasses(): string {
  return `${star(-2.5, -26.5, 3.6, '#ffd93d')}${star(2.5, -26.5, 3.6, '#ff8fb0')}${rect(-3, -27, 2, 1, '#1a1020')}${rect(
    2,
    -27,
    2,
    1,
    '#1a1020',
  )}${rect(-7, -27, 2, 1, '#ffd93d')}${rect(5, -27, 2, 1, '#ff8fb0')}${partyHorn()}`;
}

function partyHorn(): string {
  return `${rect(-2, -23, 5, 1, '#6ee7f9')}${rect(3, -24, 2, 3, '#ffd93d')}`;
}

// ---------------------------------------------------------------------------
// Valentine's Day
// ---------------------------------------------------------------------------

function heartBopper(): string {
  return bopper('#e63975', (x, y) => pixelHeart(x, y, '#e63975'));
}

function heartGlasses(): string {
  return `${pixelHeart(-3, -27, '#e63975')}${pixelHeart(3, -27, '#e63975')}${rect(-1, -27, 2, 1, '#a81f50')}${rect(
    -7,
    -28,
    2,
    1,
    '#a81f50',
  )}${rect(5, -28, 2, 1, '#a81f50')}`;
}

function flowerCrown(colors: readonly string[]): Costume {
  return () => {
    const parts: string[] = [rect(-6, -33, 12, 1, '#4a7a4a')];
    [-5, -2, 1, 4].forEach((x, index) => {
      const color = colors[index % colors.length] ?? '#ffffff';
      parts.push(rect(x - 1, -35, 3, 3, color));
      parts.push(rect(x, -34, 1, 1, '#ffe066'));
    });
    parts.push(rect(-7, -33, 2, 1, '#6aa96a'), rect(5, -33, 2, 1, '#6aa96a'));
    return parts.join('');
  };
}

// ---------------------------------------------------------------------------
// St. Patrick's Day
// ---------------------------------------------------------------------------

function leprechaunHat(): string {
  return `${rect(-9, -34, 18, 2, '#1a6b34')}${poly(
    [
      [-5, -34],
      [5, -34],
      [6, -44],
      [-6, -44],
    ],
    '#2a9d4f',
  )}${rect(-6, -45, 12, 1, '#1a6b34')}${rect(-5, -37, 10, 2, '#1a1020')}${rect(-2, -38, 4, 4, '#ffd93d')}${rect(
    -1,
    -37,
    2,
    2,
    '#1a1020',
  )}${shamrock(4, -42, 0.38, '#7ae08a')}`;
}

function shamrockBopper(): string {
  return bopper('#2a9d4f', (x, y) => shamrock(x, y, 0.5, '#4abf6a'));
}

function leprechaunBeard(): string {
  const ginger = '#e0782a';
  return `${leprechaunHat()}${rect(-6, -24, 2, 3, ginger)}${rect(4, -24, 2, 3, ginger)}${rect(-5, -22, 10, 3, ginger)}${rect(
    -3,
    -19,
    6,
    2,
    ginger,
  )}${rect(-2, -22, 4, 1, '#1a1020', 'opacity="0.7"')}${rect(-4, -21, 2, 1, '#ffa95a', 'opacity="0.7"')}`;
}

// ---------------------------------------------------------------------------
// Easter
// ---------------------------------------------------------------------------

function bunnyEars(): string {
  const white = '#f8f4ff';
  return `${rect(-6, -33, 12, 1, '#b07ae8')}${rect(-5, -44, 3, 11, white)}${rect(2, -44, 3, 11, white)}${rect(
    -4,
    -45,
    1,
    1,
    white,
  )}${rect(3, -45, 1, 1, white)}${rect(-4, -42, 1, 8, '#ffb3c8')}${rect(3, -42, 1, 8, '#ffb3c8')}`;
}

function eggshellHat(): string {
  const shell = '#fffaf0';
  return `${rect(-6, -35, 12, 3, shell)}${poly(
    [
      [-6, -35],
      [-4, -38],
      [-2, -35],
      [0, -38],
      [2, -35],
      [4, -38],
      [6, -35],
    ],
    shell,
  )}${rect(-6, -33, 12, 1, '#e8dcc8')}${rect(-1, -42, 3, 4, '#ffe066')}${rect(1, -40, 2, 1, '#ff9f1c')}${rect(
    0,
    -41,
    1,
    1,
    '#1a1020',
  )}`;
}

// ---------------------------------------------------------------------------
// Independence Day
// ---------------------------------------------------------------------------

function unclesamHat(): string {
  const parts: string[] = [rect(-8, -34, 16, 2, '#1d3557'), rect(-5, -46, 10, 12, '#f1faee')];
  for (let x = -4; x <= 4; x += 3) {
    parts.push(rect(x, -46, 1.5, 9, '#e63946'));
  }
  parts.push(rect(-5, -37, 10, 3, '#1d3557'));
  parts.push(star(0, -35.5, 1.6, '#f1faee'));
  parts.push(rect(-6, -47, 12, 1, '#1d3557'));
  return parts.join('');
}

function starBopper(): string {
  return bopper('#1d3557', (x, y) => star(x, y, 3, x < 0 ? '#e63946' : '#f1faee'));
}

// ---------------------------------------------------------------------------
// Thanksgiving
// ---------------------------------------------------------------------------

function pilgrimHat(): string {
  return `${rect(-9, -34, 18, 2, '#1a1418')}${poly(
    [
      [-5, -34],
      [5, -34],
      [4, -44],
      [-4, -44],
    ],
    '#2a2228',
  )}${rect(-5, -37, 10, 2, '#5a4a3a')}${rect(-2, -38, 4, 4, '#e0c060')}${rect(-1, -37, 2, 2, '#2a2228')}${rect(
    -3,
    -43,
    2,
    5,
    '#ffffff',
    'opacity="0.08"',
  )}`;
}

function featherCrown(): string {
  const colors = ['#8a3a10', '#c0561f', '#e0a020', '#c0561f', '#8a3a10'];
  const parts: string[] = [];
  colors.forEach((color, index) => {
    const angle = -40 + index * 20;
    parts.push(
      `<g transform="translate(0 -32) rotate(${angle})">${rect(-1.5, -12, 3, 11, color)}${rect(
        -0.5,
        -11,
        1,
        9,
        '#fff0d0',
        'opacity="0.35"',
      )}</g>`,
    );
  });
  parts.push(rect(-6, -34, 12, 2, '#a86a2a'));
  parts.push(rect(-5, -34, 2, 1, '#e0a020'), rect(-1, -34, 2, 1, '#2a9d8f'), rect(3, -34, 2, 1, '#e0a020'));
  return parts.join('');
}

function pilgrimBonnet(): string {
  return `${rect(-7, -34, 14, 4, '#f4ece0')}${rect(-8, -31, 2, 7, '#f4ece0')}${rect(6, -31, 2, 7, '#f4ece0')}${rect(
    -7,
    -34,
    14,
    1,
    '#d8ccb8',
  )}${rect(-6, -24, 2, 3, '#d8ccb8')}${rect(4, -24, 2, 3, '#d8ccb8')}`;
}
