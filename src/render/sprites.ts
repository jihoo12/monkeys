import type { AgeId, MonkeyState } from '../types.ts';
import type { Palette } from './palette.ts';
import { shade } from './palette.ts';
import { circle, ellipse, line, poly, rect } from './svg.ts';
import { pixelText } from './pixel-font.ts';
import { banana } from './art.ts';
import { drawCostume, drawHelmetTopper } from './costumes.ts';
import type { HolidayId } from './holidays.ts';

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
  /** Holiday costume worn over (or instead of) the age headgear. */
  costume?: HolidayId;
}

interface Fur {
  outline: string;
  fur: string;
  furLight: string;
  furDark: string;
  face: string;
  faceShade: string;
  ear: string;
}

const FURS: readonly Fur[] = [
  {
    outline: '#241a20',
    fur: '#8b5a2b',
    furLight: '#bd7f45',
    furDark: '#633d1f',
    face: '#f4c995',
    faceShade: '#d99a63',
    ear: '#a9713a',
  },
  {
    outline: '#1d1518',
    fur: '#6b4226',
    furLight: '#9a6238',
    furDark: '#4a2c18',
    face: '#e8b07a',
    faceShade: '#c98a58',
    ear: '#7d4f2c',
  },
  {
    outline: '#2a1d1a',
    fur: '#a9713a',
    furLight: '#dda05f',
    furDark: '#7a4a26',
    face: '#f9d6a4',
    faceShade: '#e0b47a',
    ear: '#c08448',
  },
  {
    outline: '#20191c',
    fur: '#5a4a3a',
    furLight: '#8a7058',
    furDark: '#3f342a',
    face: '#dcae7f',
    faceShade: '#b88a5f',
    ear: '#6e5a46',
  },
  {
    outline: '#241a22',
    fur: '#7a4a52',
    furLight: '#a86a70',
    furDark: '#58323a',
    face: '#f0c69c',
    faceShade: '#d49a72',
    ear: '#8f5a62',
  },
];

interface Outfit {
  shirt: string;
  shirtDark: string;
  shirtLight: string;
  pants: string;
  pantsDark: string;
  shoe: string;
  trim: string;
}

const MEDIEVAL_SHIRTS = ['#b5533c', '#3f6d54', '#b08033', '#4f5b8a', '#7a3f52'] as const;
const INDUSTRIAL_SHIRTS = ['#7a8792', '#9a6a45', '#5f7360', '#8a5550', '#6a6a78'] as const;
const MODERN_SHIRTS = ['#e85d75', '#4aa3df', '#7bc043', '#f2b134', '#9b7ede', '#f07f4f'] as const;

function outfitFor(ageId: AgeId, monkey: MonkeyState, fur: Fur): Outfit {
  const index = Math.abs(monkey.id + monkey.color);
  if (ageId === 'stone') {
    return {
      shirt: fur.fur,
      shirtDark: fur.furDark,
      shirtLight: fur.furLight,
      pants: fur.furDark,
      pantsDark: shade(fur.furDark, -0.2),
      shoe: fur.outline,
      trim: '#b8a06a',
    };
  }
  if (ageId === 'medieval') {
    const shirt = MEDIEVAL_SHIRTS[index % MEDIEVAL_SHIRTS.length] ?? '#b5533c';
    return {
      shirt,
      shirtDark: shade(shirt, -0.28),
      shirtLight: shade(shirt, 0.2),
      pants: '#4a3b2e',
      pantsDark: '#33281f',
      shoe: '#2a211b',
      trim: '#e8d6b0',
    };
  }
  if (ageId === 'industrial') {
    const shirt = INDUSTRIAL_SHIRTS[index % INDUSTRIAL_SHIRTS.length] ?? '#7a8792';
    return {
      shirt,
      shirtDark: shade(shirt, -0.3),
      shirtLight: shade(shirt, 0.18),
      pants: '#3b4558',
      pantsDark: '#282f3d',
      shoe: '#241f1c',
      trim: '#c9a86a',
    };
  }
  if (ageId === 'modern') {
    const shirt = MODERN_SHIRTS[index % MODERN_SHIRTS.length] ?? '#4aa3df';
    return {
      shirt,
      shirtDark: shade(shirt, -0.25),
      shirtLight: shade(shirt, 0.22),
      pants: index % 2 === 0 ? '#3b4a6b' : '#3a3a48',
      pantsDark: '#272c3d',
      shoe: '#f0ece4',
      trim: '#1f2a3d',
    };
  }
  const accent = index % 3 === 0 ? '#b388ff' : index % 3 === 1 ? '#6ee7f9' : '#ffd166';
  return {
    shirt: '#e8ecf4',
    shirtDark: '#b8c4d4',
    shirtLight: '#ffffff',
    pants: '#cfd8e8',
    pantsDark: '#8a98b0',
    shoe: '#5a6880',
    trim: accent,
  };
}

export function drawMonkey(monkey: MonkeyState, options: MonkeyDrawOptions): string {
  const fur = FURS[monkey.color % FURS.length] ?? FURS[0];
  if (!fur) return '';
  const outfit = outfitFor(options.ageId, monkey, fur);
  const palette = options.palette;
  const delay = options.delay ?? 0;
  const walk = options.walk;
  const facing = options.facing ?? 1;
  const ageId = options.ageId;

  const classes = ['monkey'];
  if (walk) classes.push('walker');
  if (options.working) classes.push('working');

  const inner: string[] = [];

  inner.push(drawTail(fur, outfit, ageId));
  inner.push(drawLegs(fur, outfit, ageId, monkey));
  inner.push(drawBody(fur, outfit, ageId, monkey));
  inner.push(drawArms(fur, outfit, ageId, monkey, palette));
  inner.push(drawHead(fur, outfit, ageId, monkey, palette, options.costume));
  inner.push(drawHeldItem(monkey, palette));

  const sprite = inner.join('');
  const bodyClass = walk
    ? `walk walk-${monkey.id}`
    : `monkey-idle${options.celebrate ? ' celebrate' : ''}`;

  return `<g transform="translate(${options.x} ${options.baseline}) scale(${options.scale * facing} ${
    options.scale
  })" class="${classes.join(' ')}">${ellipse(0, 0.5, 7.5, 1.5, palette.shadow)}<g class="${bodyClass}" style="animation-delay:-${delay}s">${sprite}</g></g>`;
}

// ---------------------------------------------------------------------------
// Body parts
// ---------------------------------------------------------------------------

function drawTail(fur: Fur, outfit: Outfit, ageId: AgeId): string {
  const accent = ageId === 'space' ? outfit.trim : fur.furLight;
  return `<g class="tail">${rect(
    4,
    -11,
    3,
    2,
    fur.outline,
  )}${rect(7, -14, 2, 4, fur.outline)}${rect(8, -18, 2, 5, fur.outline)}${rect(
    7,
    -20,
    3,
    3,
    fur.outline,
  )}${rect(4, -10, 2, 1, fur.fur)}${rect(6, -13, 1, 3, fur.fur)}${rect(7, -17, 1, 4, accent)}${rect(
    7,
    -19,
    2,
    2,
    fur.furLight,
  )}</g>`;
}

function drawLegs(fur: Fur, outfit: Outfit, ageId: AgeId, monkey: MonkeyState): string {
  const bare = ageId === 'stone';
  const left = bare
    ? `${rect(-4, -8, 3, 6, fur.outline)}${rect(-3, -8, 2, 5, fur.fur)}${rect(-4, -2, 3, 2, fur.outline)}${rect(-3, -2, 2, 1, fur.furLight)}`
    : `${rect(-4, -8, 3, 5, outfit.pants)}${rect(-4, -4, 3, 2, outfit.shoe)}${rect(-4, -4, 3, 1, outfit.pantsDark)}${rect(-4, -2, 3, 1, outfit.shoe)}`;
  const right = bare
    ? `${rect(1, -8, 3, 6, fur.outline)}${rect(2, -8, 2, 5, fur.fur)}${rect(1, -2, 3, 2, fur.outline)}${rect(2, -2, 2, 1, fur.furLight)}`
    : `${rect(1, -8, 3, 5, outfit.pants)}${rect(1, -4, 3, 2, outfit.shoe)}${rect(1, -4, 3, 1, outfit.pantsDark)}${rect(1, -2, 3, 1, outfit.shoe)}`;
  const ankle = ageId === 'space' ? rect(-4, -4, 3, 1, outfit.trim) : '';
  const ankle2 = ageId === 'space' ? rect(1, -4, 3, 1, outfit.trim) : '';
  const patches =
    ageId === 'industrial' && monkey.id % 2 === 0
      ? `${rect(-3, -6, 2, 2, outfit.trim, 'opacity="0.45"')}${rect(2, -5, 1, 2, outfit.trim, 'opacity="0.35"')}`
      : '';
  return `<g class="leg leg-l">${left}${ankle}</g><g class="leg leg-r">${right}${ankle2}</g>${patches}`;
}

function drawBody(fur: Fur, outfit: Outfit, ageId: AgeId, monkey: MonkeyState): string {
  const parts: string[] = [];
  // Rounded torso silhouette.
  parts.push(rect(-5, -20, 10, 13, fur.outline));
  parts.push(rect(-6, -18, 12, 9, fur.outline));
  parts.push(rect(-4, -19, 8, 11, outfit.shirt));
  parts.push(rect(-6, -18, 12, 9, outfit.shirt));
  parts.push(rect(-4, -19, 8, 2, outfit.shirtLight, 'opacity="0.55"'));
  parts.push(rect(-6, -18, 1, 9, outfit.shirtDark, 'opacity="0.55"'));
  parts.push(rect(-2, -17, 4, 6, shade(outfit.shirt, 0.08), 'opacity="0.55"'));

  if (ageId === 'stone') {
    parts.push(drawLeafSkirt(fur, monkey));
    parts.push(
      `${rect(-2, -19, 4, 3, fur.face, 'opacity="0.85"')}${rect(-1, -16, 2, 1, fur.outline, 'opacity="0.6"')}`,
    );
    parts.push(drawNecklace(monkey));
  } else if (ageId === 'medieval') {
    parts.push(rect(-6, -10, 12, 2, '#4a3b2e'));
    parts.push(rect(-2, -10, 4, 2, '#d8b45a'));
    parts.push(rect(-1, -10, 2, 1, '#f0d27a'));
    parts.push(`${rect(-5, -17, 2, 6, outfit.trim, 'opacity="0.55"')}${rect(3, -17, 1, 6, outfit.trim, 'opacity="0.35"')}`);
    parts.push(drawPouch(outfit));
  } else if (ageId === 'industrial') {
    parts.push(rect(-5, -12, 10, 3, outfit.pants));
    parts.push(rect(-4, -16, 1, 8, outfit.pants, 'opacity="0.9"'));
    parts.push(rect(3, -16, 1, 8, outfit.pants, 'opacity="0.9"'));
    parts.push(rect(-5, -12, 10, 1, outfit.pantsDark));
    parts.push(rect(-1, -11, 2, 2, '#e0b040'));
  } else if (ageId === 'modern') {
    parts.push(rect(-5, -12, 10, 2, outfit.trim, 'opacity="0.8"'));
    parts.push(rect(-4, -15, 8, 3, outfit.shirtDark, 'opacity="0.55"'));
    parts.push(`${rect(-1, -16, 2, 1, outfit.trim)}${rect(-1, -14, 2, 2, outfit.trim, 'opacity="0.8"')}`);
    parts.push(drawPouch(outfit));
  } else {
    parts.push(rect(-5, -13, 10, 4, outfit.shirtDark));
    parts.push(rect(-4, -15, 8, 2, outfit.shirtLight));
    parts.push(rect(-3, -12, 2, 2, outfit.trim));
    parts.push(rect(1, -12, 2, 2, outfit.trim, 'opacity="0.7"'));
    parts.push(rect(-1, -17, 2, 3, outfit.trim));
    parts.push(rect(-1, -17, 1, 3, '#ffffff', 'opacity="0.7"'));
    // Life-support backpack.
    parts.push(rect(-8, -18, 3, 9, outfit.shirtDark));
    parts.push(rect(-8, -17, 1, 7, outfit.shirtLight, 'opacity="0.6"'));
    parts.push(circle(-6.5, -14, 1.2, outfit.trim));
  }
  return parts.join('');
}

function drawLeafSkirt(fur: Fur, monkey: MonkeyState): string {
  const leaf = monkey.id % 2 === 0 ? '#7bd389' : '#5fbf72';
  const dark = shade(leaf, -0.28);
  return `${rect(-6, -10, 12, 3, dark)}${poly([[-7, -9], [-4, -4], [-2, -9]], leaf)}${poly(
    [[-3, -9], [0, -3], [2, -9]],
    dark,
  )}${poly([[1, -9], [4, -4], [6, -9]], leaf)}${poly([[-6, -9], [-8, -5], [-4, -6]], dark, 'opacity="0.8"')}`;
}

function drawNecklace(monkey: MonkeyState): string {
  const beads = monkey.id % 3 === 0 ? '#e8d6b0' : '#d8c090';
  return `${rect(-3, -18, 1, 1, beads)}${rect(-1, -17, 1, 1, beads)}${rect(1, -17, 1, 1, beads)}${rect(
    3,
    -18,
    1,
    1,
    beads,
  )}${poly([[0, -17], [-1, -14], [1, -14]], '#f0e4c8')}`;
}

function drawPouch(outfit: Outfit): string {
  return `${rect(4, -9, 3, 4, outfit.shirtDark)}${rect(5, -9, 2, 1, outfit.trim, 'opacity="0.7"')}${rect(
    4,
    -8,
    1,
    2,
    outfit.trim,
    'opacity="0.45"',
  )}`;
}

function drawArms(fur: Fur, outfit: Outfit, ageId: AgeId, monkey: MonkeyState, palette: Palette): string {
  const bare = ageId === 'stone';
  const sleeveLeft = bare
    ? `${rect(-7, -18, 2, 5, fur.fur)}${rect(-8, -18, 3, 2, fur.furLight)}`
    : `${rect(-7, -18, 2, 6, outfit.shirt)}${rect(-7, -18, 2, 2, outfit.shirtLight, 'opacity="0.5"')}`;
  const sleeveRight = bare
    ? `${rect(5, -18, 2, 5, fur.fur)}${rect(5, -18, 2, 2, fur.furLight)}`
    : `${rect(5, -18, 2, 6, outfit.shirt)}${rect(6, -18, 1, 2, outfit.shirtLight, 'opacity="0.5"')}`;
  const glove = ageId === 'space' ? outfit.trim : fur.furLight;
  const handLeft = `${rect(-7, -13, 3, 2, fur.outline)}${rect(-7, -13, 2, 1, glove)}`;
  const handRight = `${rect(5, -13, 3, 2, fur.outline)}${rect(5, -13, 2, 1, glove)}`;
  const bananaHand = heldBananaHand(monkey, ageId);
  const leftBanana = bananaHand === -1 ? drawHeldBanana(-1, palette) : '';
  const rightBanana = bananaHand === 1 ? drawHeldBanana(1, palette) : '';
  const cuff = ageId === 'modern' ? `${rect(-7, -14, 3, 1, outfit.trim)}${rect(5, -14, 3, 1, outfit.trim)}` : '';
  return `<g class="arm arm-l">${sleeveLeft}${leftBanana}${handLeft}${cuff}</g><g class="arm arm-r">${sleeveRight}${rightBanana}${handRight}${
    ageId === 'modern' ? cuff : ''
  }${drawTool(monkey, fur, outfit, ageId)}</g>`;
}

function drawHead(
  fur: Fur,
  outfit: Outfit,
  ageId: AgeId,
  monkey: MonkeyState,
  palette: Palette,
  costume?: HolidayId,
): string {
  const expression = Math.abs(monkey.id + monkey.role.length) % 5;
  const parts: string[] = [];
  // Ears behind the head.
  parts.push(rect(-9, -27, 3, 5, fur.outline));
  parts.push(rect(6, -27, 3, 5, fur.outline));
  parts.push(rect(-8, -26, 2, 3, fur.ear));
  parts.push(rect(7, -26, 2, 3, fur.ear));
  parts.push(rect(-8, -25, 1, 1, fur.faceShade, 'opacity="0.8"'));
  parts.push(rect(7, -25, 1, 1, fur.faceShade, 'opacity="0.8"'));

  // Head silhouette with stepped pixel corners.
  parts.push(rect(-4, -32, 8, 1, fur.outline));
  parts.push(rect(-5, -31, 10, 2, fur.outline));
  parts.push(rect(-6, -29, 12, 8, fur.outline));
  parts.push(rect(-5, -21, 10, 1, fur.outline));
  parts.push(rect(-4, -32, 8, 1, fur.fur));
  parts.push(rect(-5, -31, 10, 2, fur.fur));
  parts.push(rect(-5, -29, 10, 7, fur.fur));
  parts.push(rect(-4, -22, 8, 1, fur.furDark, 'opacity="0.35"'));
  // Forehead highlight.
  parts.push(rect(-4, -31, 5, 1, fur.furLight, 'opacity="0.55"'));
  // Face patch: two soft oval-ish blocks.
  parts.push(rect(-4, -28, 8, 6, fur.face));
  parts.push(rect(-5, -27, 1, 4, fur.face));
  parts.push(rect(4, -27, 1, 4, fur.face));
  parts.push(rect(-3, -28, 6, 1, fur.faceShade, 'opacity="0.45"'));
  parts.push(rect(-3, -21, 6, 1, fur.faceShade, 'opacity="0.35"'));

  // Eyes, brows and expression.
  const eyeY = -27;
  const leftEye = `<g class="eye" style="animation-delay:-${(monkey.id % 7) * 0.43}s">${rect(
    -3,
    eyeY,
    2,
    2,
    fur.outline,
  )}${rect(-3, eyeY, 1, 1, '#ffffff')}</g>`;
  const rightEye = `<g class="eye" style="animation-delay:-${(monkey.id % 7) * 0.43}s">${rect(
    1,
    eyeY,
    2,
    2,
    fur.outline,
  )}${rect(1, eyeY, 1, 1, '#ffffff')}</g>`;
  parts.push(leftEye, rightEye);

  if (expression === 1) {
    // Curious: raised brows.
    parts.push(rect(-4, -29, 2, 1, fur.furDark));
    parts.push(rect(2, -29, 2, 1, fur.furDark));
  } else if (expression === 2) {
    // Determined: angled brows.
    parts.push(rect(-4, -29, 2, 1, fur.furDark));
    parts.push(rect(2, -29, 2, 1, fur.furDark));
    parts.push(rect(-4, -28, 1, 1, fur.furDark));
    parts.push(rect(3, -28, 1, 1, fur.furDark));
  } else if (expression === 3) {
    // Sleepy.
    parts.push(rect(-4, -28, 3, 1, fur.furDark));
    parts.push(rect(1, -28, 3, 1, fur.furDark));
  } else {
    parts.push(rect(-4, -29, 2, 1, fur.furDark, 'opacity="0.65"'));
    parts.push(rect(2, -29, 2, 1, fur.furDark, 'opacity="0.65"'));
  }

  // Muzzle, nose and mouth.
  parts.push(rect(-1, -25, 2, 1, fur.faceShade));
  parts.push(rect(-1, -25, 1, 1, fur.outline, 'opacity="0.7"'));
  if (expression === 1) {
    parts.push(rect(-1, -23, 2, 2, fur.outline));
    parts.push(rect(0, -23, 1, 1, '#e87a7a'));
  } else if (expression === 3) {
    parts.push(rect(-1, -23, 2, 1, fur.outline, 'opacity="0.6"'));
  } else if (expression === 4) {
    parts.push(rect(-2, -23, 4, 1, fur.outline));
    parts.push(rect(-1, -22, 2, 1, '#e87a7a'));
  } else {
    parts.push(rect(-2, -23, 4, 1, fur.outline, 'opacity="0.75"'));
    parts.push(rect(-3, -24, 1, 1, fur.outline, 'opacity="0.6"'));
    parts.push(rect(2, -24, 1, 1, fur.outline, 'opacity="0.6"'));
  }
  // Blush.
  parts.push(rect(-4, -25, 1, 1, '#e88a7a', 'opacity="0.45"'));
  parts.push(rect(3, -25, 1, 1, '#e88a7a', 'opacity="0.45"'));
  // Hair tuft.
  parts.push(rect(-2, -33, 2, 2, fur.furDark));
  parts.push(rect(0, -34, 2, 2, fur.fur));
  parts.push(rect(2, -33, 1, 1, fur.furLight));

  // Age-specific headgear and accessories.
  parts.push(drawHeadgear(monkey, fur, outfit, ageId, palette, costume));
  return `<g class="head">${parts.join('')}</g>`;
}

function drawHeadgear(
  monkey: MonkeyState,
  fur: Fur,
  outfit: Outfit,
  ageId: AgeId,
  palette: Palette,
  costume?: HolidayId,
): string {
  const parts: string[] = [];
  if (costume && monkey.accessory !== 'helmet') {
    // Costumes replace hats; ear-level gear still reads underneath.
    if (ageId === 'modern' || ageId === 'space') {
      parts.push(drawHeadgear({ ...monkey, accessory: 'none' }, fur, outfit, ageId, palette));
    }
    parts.push(drawCostume(costume, monkey.id));
    return parts.join('');
  }
  if (monkey.accessory === 'helmet') {
    parts.push(
      `<g class="helmet">${circle(0, -26, 9, palette.glass, 'opacity="0.22"')}${circle(
        0,
        -26,
        9,
        'none',
        `stroke="${palette.glassLight}" stroke-width="1" opacity="0.75"`,
      )}${rect(-6, -20, 12, 2, palette.metalLight)}${rect(-6, -20, 12, 1, palette.metal)}${rect(
        -2,
        -36,
        4,
        3,
        palette.metal,
      )}${rect(-1, -37, 2, 2, palette.accent2)}${costume ? drawHelmetTopper(costume) : ''}</g>`,
    );
  } else if (monkey.accessory === 'hardhat') {
    const hat = ageId === 'space' ? palette.accent2 : '#f2b134';
    const hatLight = ageId === 'space' ? '#d8ffff' : '#ffd166';
    parts.push(
      `${rect(-6, -34, 12, 2, shade(hat, -0.3))}${rect(-5, -36, 10, 2, hat)}${rect(
        -7,
        -33,
        14,
        1,
        shade(hat, -0.2),
      )}${rect(-4, -36, 4, 1, hatLight, 'opacity="0.8"')}`,
    );
  } else if (monkey.accessory === 'leaf') {
    parts.push(
      `${rect(-5, -34, 10, 2, palette.leafDark)}${rect(-4, -35, 8, 1, palette.leaf)}${poly(
        [[-8, -34], [-4, -34], [-5, -31]],
        palette.leaf,
      )}${poly([[8, -34], [4, -34], [5, -31]], palette.leaf)}${rect(-1, -36, 2, 1, palette.leafDark)}`,
    );
  } else if (monkey.accessory === 'crown') {
    parts.push(
      `${rect(-5, -35, 10, 2, '#e0a800')}${rect(-5, -38, 2, 4, '#ffd93d')}${rect(
        -1,
        -39,
        2,
        5,
        '#ffd93d',
      )}${rect(4, -38, 1, 4, '#ffd93d')}${rect(-3, -35, 1, 1, '#fff3a8')}${rect(
        2,
        -35,
        1,
        1,
        '#fff3a8',
      )}${rect(-1, -36, 2, 1, '#e85d75')}`,
    );
  } else if (monkey.accessory === 'bow') {
    parts.push(
      `${rect(-1, -34, 2, 2, '#f06292')}${poly([[-6, -35], [-1, -34], [-6, -31]], '#f06292')}${poly(
        [[6, -35], [1, -34], [6, -31]],
        '#f06292',
      )}${rect(-4, -34, 2, 1, '#ff9ec2', 'opacity="0.8"')}`,
    );
  }

  if (ageId === 'medieval' && monkey.accessory !== 'crown' && monkey.accessory !== 'hardhat') {
    parts.push(`${rect(-6, -33, 12, 2, outfit.shirtDark)}${rect(-6, -33, 12, 1, outfit.shirt, 'opacity="0.7"')}`);
  } else if (ageId === 'industrial' && monkey.accessory !== 'hardhat') {
    parts.push(
      `${rect(-6, -34, 12, 2, outfit.shirtDark)}${rect(-4, -35, 8, 2, outfit.shirt)}${rect(
        -7,
        -33,
        14,
        1,
        outfit.shirtDark,
      )}`,
    );
  } else if (ageId === 'modern' && monkey.accessory !== 'crown') {
    parts.push(
      `${rect(-7, -28, 2, 5, palette.metalDark)}${rect(-7, -28, 2, 2, outfit.trim)}${rect(
        5,
        -28,
        2,
        5,
        palette.metalDark,
      )}${rect(5, -28, 2, 2, outfit.trim)}${rect(-5, -31, 10, 1, palette.metalDark, 'opacity="0.5"')}`,
    );
  } else if (ageId === 'space' && monkey.accessory !== 'helmet') {
    parts.push(
      `${rect(-7, -29, 2, 4, outfit.shirtDark)}${rect(-7, -29, 2, 1, outfit.trim)}${rect(
        5,
        -29,
        2,
        4,
        outfit.shirtDark,
      )}${rect(5, -29, 2, 1, outfit.trim)}`,
    );
  }
  return parts.join('');
}

function drawTool(
  monkey: MonkeyState,
  fur: Fur,
  outfit: Outfit,
  ageId: AgeId,
): string {
  const wood = '#6b4229';
  const metal = '#b8c0c8';
  const metalDark = '#6a747e';
  switch (monkey.role) {
    case 'farmer':
      if (ageId === 'modern' || ageId === 'space') {
        return `<g class="tool tool-hoe">${rect(
          6,
          -14,
          2,
          8,
          metalDark,
        )}${rect(7, -16, 3, 3, metal)}${rect(7, -16, 3, 1, '#e8f0f4')}${rect(
          6,
          -7,
          2,
          2,
          outfit.trim,
        )}</g>`;
      }
      return `<g class="tool tool-hoe">${line(
        6,
        -12,
        11,
        -22,
        wood,
        1.5,
      )}${rect(9, -24, 5, 2, metal)}${rect(13, -23, 1, 3, metalDark)}</g>`;
    case 'builder':
      if (ageId === 'industrial' || ageId === 'modern' || ageId === 'space') {
        return `<g class="tool tool-hammer">${rect(
          6,
          -13,
          2,
          8,
          metalDark,
        )}${rect(5, -15, 5, 3, metal)}${rect(5, -15, 5, 1, '#e8f0f4')}${rect(
          9,
          -13,
          2,
          2,
          outfit.trim,
        )}</g>`;
      }
      return `<g class="tool tool-hammer">${rect(
        6,
        -13,
        1,
        8,
        wood,
      )}${rect(4, -16, 6, 3, metal)}${rect(4, -16, 6, 1, '#e8f0f4')}</g>`;
    case 'scholar':
      return `<g class="tool tool-book">${rect(
        5,
        -14,
        6,
        5,
        fur.outline,
      )}${rect(6, -13, 5, 3, ageId === 'space' ? '#6ee7f9' : '#e8f0f4')}${rect(
        8,
        -13,
        1,
        3,
        ageId === 'space' ? '#b388ff' : '#4aa3df',
      )}</g>`;
    case 'musician':
      return `<g class="tool tool-banjo">${circle(
        9,
        -11,
        3,
        wood,
      )}${circle(9, -11, 1.5, '#d8a060')}${line(10, -13, 13, -20, wood, 1)}${rect(
        12,
        -21,
        3,
        2,
        metal,
      )}${rect(6, -13, 3, 2, outfit.trim, 'opacity="0.8"')}</g>`;
    case 'chef':
      return `<g class="tool tool-pan">${ellipse(
        9,
        -11,
        3,
        2,
        metalDark,
      )}${ellipse(9, -11, 2, 1.2, metal)}${rect(11, -11, 4, 1, wood)}${rect(
        13,
        -13,
        2,
        1,
        '#ffd166',
      )}</g>`;
    case 'elder':
      return `${line(7, -13, 7, 0, wood, 1.5)}${rect(5, -2, 3, 1, '#9a6238')}${circle(
        7,
        -15,
        1.5,
        outfit.trim,
        'opacity="0.9"',
      )}`;
    case 'astronaut':
      return `<g class="tool tool-scanner">${rect(
        5,
        -15,
        4,
        5,
        outfit.shirtDark,
      )}${rect(6, -14, 2, 2, outfit.trim)}${rect(6, -14, 2, 1, '#ffffff', 'opacity="0.8"')}${rect(
        9,
        -16,
        1,
        3,
        '#6ee7f9',
        'class="blink"',
      )}</g>`;
    case 'walker':
      return '';
    default:
      return '';
  }
}

function heldBananaHand(monkey: MonkeyState, ageId: AgeId): -1 | 0 | 1 {
  if (monkey.role === 'walker') return monkey.id % 3 === 1 ? 0 : 1;
  if (
    (monkey.role === 'farmer' && ageId !== 'space') ||
    (monkey.role === 'elder' && ageId === 'stone') ||
    monkey.role === 'chef'
  ) {
    return -1;
  }
  return 0;
}

function drawHeldBanana(hand: -1 | 1, palette: Palette): string {
  // Anchor the stem inside the palm; the fingers are painted over it.
  // Nesting the fruit in the arm keeps their movement together.
  return `<g class="held-banana" transform="translate(${hand * 6.5} -12.5) scale(${hand * 0.7} 0.7) rotate(-80) translate(-9 -1)">${banana(0, 0, 1, palette)}</g>`;
}

function drawHeldItem(monkey: MonkeyState, palette: Palette): string {
  if (monkey.role === 'walker' && monkey.id % 3 === 1) {
    return `<g class="carry">${rect(-10, -15, 8, 5, palette.woodDark)}${rect(
      -9,
      -14,
      6,
      3,
      palette.wood,
    )}${rect(-8, -15, 3, 1, palette.banana, 'opacity="0.9"')}${rect(
      2,
      -15,
      3,
      5,
      palette.woodDark,
      'opacity="0.35"',
    )}</g>`;
  }
  return '';
}

export function drawSpeechBubble(
  text: string,
  x: number,
  y: number,
  palette: Palette,
  scale = 2,
  delay = 0,
): string {
  const width = Math.max(34, text.length * 6 * scale + 12);
  const height = 7 * scale + 10;
  const cx = Math.max(width / 2 + 4, Math.min(SCENE_SAFE_WIDTH - width / 2, x));
  return `<g class="speech" style="animation-delay:-${delay}s">${rect(
    cx - width / 2 + 3,
    y + 4,
    width,
    height,
    'rgba(20, 12, 20, 0.45)',
  )}${rect(
    cx - width / 2 - 1,
    y - 1,
    width + 2,
    height + 2,
    palette.outline,
  )}${rect(cx - width / 2, y, width, height, '#fff8e8')}${rect(
    cx - width / 2,
    y,
    width,
    2,
    palette.bananaLight,
    'opacity="0.8"',
  )}${poly(
    [
      [cx - 6, y + height],
      [cx + 6, y + height],
      [cx, y + height + 8],
    ],
    '#fff8e8',
    `stroke="${palette.outline}" stroke-width="2"`,
  )}${rect(cx - width / 2 + 4, y + 5, 3, 3, palette.banana)}${pixelText(
    text,
    cx - width / 2 + 12,
    y + 6,
    scale,
    palette.outline,
  )}</g>`;
}

const SCENE_SAFE_WIDTH = 960;

export function drawBananaIcon(x: number, y: number, scale: number, palette: Palette): string {
  return `<g shape-rendering="crispEdges">${banana(x, y, scale, palette)}</g>`;
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
  )}${rect(4, 2, 1, 1, '#fff3a8', 'opacity="0.7"')}</g>`;
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
    parts.push(rect(1, 8, 10, 2, palette.dirtDark));
    parts.push(rect(2, 7, 8, 1, palette.stoneDark));
    parts.push(poly([[3, 7], [5, 2], [7, 7]], palette.fire));
    parts.push(poly([[4, 7], [6, 3], [8, 7]], palette.fireLight));
    parts.push(rect(5, 5, 2, 2, '#fff3a8'));
    parts.push(rect(0, 6, 2, 2, palette.woodDark));
    parts.push(rect(9, 6, 2, 2, palette.woodDark));
  } else if (ageId === 'medieval') {
    parts.push(rect(1, 4, 3, 6, palette.stone));
    parts.push(rect(6, 4, 3, 6, palette.stone));
    parts.push(rect(3, 6, 5, 4, palette.stone));
    parts.push(rect(1, 3, 3, 1, palette.stoneLight));
    parts.push(rect(6, 3, 3, 1, palette.stoneLight));
    parts.push(rect(2, 1, 1, 2, palette.stoneLight));
    parts.push(rect(7, 1, 1, 2, palette.stoneLight));
    parts.push(rect(4, 7, 2, 3, palette.outline));
    parts.push(rect(4, 5, 2, 1, palette.accent));
    parts.push(rect(0, 9, 10, 1, palette.stoneDark));
  } else if (ageId === 'industrial') {
    parts.push(rect(1, 5, 9, 4, palette.brick));
    parts.push(rect(2, 2, 2, 4, palette.brickDark));
    parts.push(rect(7, 3, 2, 3, palette.brickDark));
    parts.push(rect(3, 6, 2, 2, palette.window));
    parts.push(rect(6, 6, 2, 2, palette.window));
    parts.push(rect(1, 9, 9, 1, palette.brickDark));
    parts.push(circle(4, 4, 4.5, 'none', `stroke="${palette.metalLight}" stroke-width="1" opacity="0.6"`));
    parts.push(circle(4, 4, 1.5, palette.metal));
    parts.push(rect(8, 0, 1, 3, palette.smoke, 'opacity="0.7"'));
  } else if (ageId === 'modern') {
    parts.push(rect(1, 1, 4, 9, palette.glassDark));
    parts.push(rect(2, 2, 2, 8, palette.glass));
    parts.push(rect(6, 3, 3, 7, palette.glassDark));
    parts.push(rect(7, 4, 1, 6, palette.glassLight));
    for (let row = 0; row < 3; row += 1) {
      parts.push(rect(2, 3 + row * 3, 2, 1, palette.glassLight, 'opacity="0.8"'));
      parts.push(rect(7, 5 + row * 2, 1, 1, palette.glassLight, 'opacity="0.7"'));
    }
    parts.push(rect(0, 9, 10, 1, palette.metalDark));
    parts.push(circle(9, 1, 1.2, palette.sun));
  } else {
    parts.push(poly([[5, 0], [8, 4], [8, 7], [2, 7], [2, 4]], palette.metalLight));
    parts.push(poly([[5, 1], [7, 4], [7, 6], [3, 6], [3, 4]], palette.metal));
    parts.push(circle(5, 4, 1.2, palette.accent2));
    parts.push(rect(4, 7, 2, 1, palette.accent));
    parts.push(poly([[2, 8], [8, 8], [10, 10], [0, 10]], palette.accent));
    parts.push(rect(1, 9, 8, 1, palette.accentDark));
  }
  return `<g transform="translate(${x} ${y}) scale(${scale})" shape-rendering="crispEdges">${parts.join(
    '',
  )}</g>`;
}
