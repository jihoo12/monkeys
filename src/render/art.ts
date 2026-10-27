import type { Palette } from './palette.ts';
import { shade } from './palette.ts';
import { circle, ellipse, line, path, poly, rect } from './svg.ts';

/**
 * Shared pixel-art vocabulary.
 *
 * Everything is built from rects, polygons and tiny circles so the whole
 * scene keeps one chunky, readable pixel-art style. Helpers also keep the
 * generated SVG compact enough for a README.
 */

export interface WindowOptions {
  lit?: boolean;
  arch?: boolean;
  shutters?: boolean;
  flowerBox?: boolean;
  sill?: boolean;
  cross?: boolean;
}

export function pixelWindow(
  x: number,
  y: number,
  w: number,
  h: number,
  p: Palette,
  options: WindowOptions = {},
): string {
  const lit = options.lit ?? true;
  const glass = lit ? p.window : p.glassDark;
  const parts: string[] = [];
  if (options.arch) {
    parts.push(rect(x, y + 2, w, h - 2, p.outline));
    parts.push(poly([[x, y + 2], [x + w / 2, y - 2], [x + w, y + 2]], p.outline));
    parts.push(rect(x + 1, y + 3, w - 2, h - 3, glass, lit ? 'class="window"' : ''));
    parts.push(poly([[x + 1, y + 3], [x + w / 2, y], [x + w - 1, y + 3]], glass, lit ? 'class="window"' : ''));
    parts.push(rect(x + w / 2, y + 1, 1, h - 1, p.outline, 'opacity="0.75"'));
    parts.push(rect(x + 1, y + 3, w - 2, 1, lit ? p.windowGlow : p.glassLight, 'opacity="0.8"'));
  } else {
    parts.push(rect(x - 1, y - 1, w + 2, h + 2, p.outline));
    parts.push(rect(x, y, w, h, glass, lit ? 'class="window"' : ''));
    parts.push(rect(x, y, w, 1, lit ? p.windowGlow : p.glassLight));
    if (options.cross !== false) {
      parts.push(rect(x + Math.floor(w / 2), y, 1, h, p.outline, 'opacity="0.7"'));
      parts.push(rect(x, y + Math.floor(h / 2), w, 1, p.outline, 'opacity="0.7"'));
    }
  }
  if (options.shutters) {
    parts.push(rect(x - 4, y, 3, h, shade(p.woodDark, -0.08)));
    parts.push(rect(x - 4, y, 1, h, p.woodLight, 'opacity="0.6"'));
    parts.push(rect(x + w + 1, y, 3, h, shade(p.woodDark, -0.08)));
    parts.push(rect(x + w + 3, y, 1, h, p.woodLight, 'opacity="0.6"'));
  }
  if (options.sill) {
    parts.push(rect(x - 2, y + h + 1, w + 4, 2, p.stoneDark));
    parts.push(rect(x - 2, y + h + 1, w + 4, 1, p.stoneLight, 'opacity="0.55"'));
  }
  if (options.flowerBox) {
    parts.push(flowerBox(x - 2, y + h + 2, p));
  }
  return parts.join('');
}

export function flowerBox(x: number, y: number, p: Palette): string {
  return `${rect(x, y, 16, 4, p.woodDark)}${rect(x + 1, y, 14, 1, p.woodLight, 'opacity="0.7"')}${rect(
    x + 2,
    y - 2,
    2,
    2,
    p.accent,
  )}${rect(x + 6, y - 3, 2, 3, p.accent2)}${rect(x + 11, y - 2, 2, 2, p.accent)}${rect(
    x + 4,
    y - 4,
    1,
    1,
    shade(p.accent, 0.35),
  )}${rect(x + 12, y - 4, 1, 1, shade(p.accent, 0.35))}`;
}

export function pixelDoor(
  x: number,
  y: number,
  w: number,
  h: number,
  p: Palette,
  color = p.wood,
  arch = false,
): string {
  const parts: string[] = [];
  parts.push(rect(x - 1, y - 1, w + 2, h + 1, p.outline));
  if (arch) {
    parts.push(poly([[x, y + 2], [x + w / 2, y - 3], [x + w, y + 2]], p.outline));
    parts.push(rect(x, y + 2, w, h - 2, color));
  } else {
    parts.push(rect(x, y, w, h, color));
  }
  parts.push(rect(x + 1, y + 1, w - 2, 1, shade(color, 0.24)));
  parts.push(rect(x + 1, y + 1, 1, h - 2, shade(color, 0.15)));
  parts.push(rect(x + w - 2, y + 1, 1, h - 2, shade(color, -0.22)));
  parts.push(rect(x + w - 4, y + h / 2, 1, 2, p.metalLight));
  parts.push(rect(x - 2, y + h, w + 4, 2, p.stoneDark));
  parts.push(rect(x - 2, y + h, w + 4, 1, p.stoneLight, 'opacity="0.45"'));
  return parts.join('');
}

export function brickPattern(
  x: number,
  y: number,
  w: number,
  h: number,
  p: Palette,
  step = 8,
): string {
  const parts: string[] = [];
  for (let row = 1; row * step < h; row += 1) {
    const yy = y + row * step;
    parts.push(rect(x, yy, w, 1, p.brickDark, 'opacity="0.32"'));
    if (row % 2 === 0) {
      for (let xx = x + 4; xx < x + w; xx += step * 2) {
        parts.push(rect(xx, yy - step + 1, 1, step - 1, p.brickDark, 'opacity="0.26"'));
      }
    } else {
      for (let xx = x + step; xx < x + w; xx += step * 2) {
        parts.push(rect(xx, yy - step + 1, 1, step - 1, p.brickDark, 'opacity="0.26"'));
      }
    }
  }
  return parts.join('');
}

export function stonePattern(
  x: number,
  y: number,
  w: number,
  h: number,
  p: Palette,
  step = 9,
): string {
  const parts: string[] = [];
  for (let row = 1; row * step < h; row += 1) {
    const yy = y + row * step;
    parts.push(rect(x, yy, w, 1, p.stoneDark, 'opacity="0.5"'));
    const offset = row % 2 === 0 ? 0 : step * 2;
    for (let xx = x + offset + 3; xx < x + w; xx += step * 3) {
      parts.push(rect(xx, yy - step + 1, 1, step - 1, p.stoneDark, 'opacity="0.4"'));
    }
  }
  return parts.join('');
}

export function woodPlanks(
  x: number,
  y: number,
  w: number,
  h: number,
  p: Palette,
  step = 7,
): string {
  const parts: string[] = [];
  for (let xx = x + step; xx < x + w; xx += step) {
    parts.push(rect(xx, y, 1, h, p.woodDark, 'opacity="0.42"'));
  }
  parts.push(rect(x, y, w, 1, p.woodLight, 'opacity="0.28"'));
  return parts.join('');
}

/**
 * A peaked roof made of horizontal shingle bands.
 * `top` and `base` are local Y coordinates, `half` is the half-span.
 */
export function shingleRoof(
  top: number,
  base: number,
  half: number,
  p: Palette,
  color = p.roof,
  dark = p.roofDark,
  bands = 4,
): string {
  const parts: string[] = [];
  parts.push(poly([[-half, base], [0, top], [half, base]], dark));
  parts.push(poly([[-half + 3, base - 2], [0, top + 3], [half - 3, base - 2]], color));
  for (let band = 1; band <= bands; band += 1) {
    const t = band / (bands + 1);
    const y = base - (base - top) * t;
    const span = half * (1 - t) * 2 - 4;
    if (span <= 2) continue;
    parts.push(rect(-span / 2, y, span, 1, dark, 'opacity="0.42"'));
    for (let x = -span / 2 + 3; x < span / 2 - 2; x += 7) {
      parts.push(rect(x, y - 3, 1, 3, dark, 'opacity="0.28"'));
    }
  }
  parts.push(rect(-half, base - 2, half * 2, 2, dark));
  parts.push(rect(-1, top, 2, base - top, shade(color, 0.18), 'opacity="0.7"'));
  return parts.join('');
}

/** Thatched or leaf roof: soft stepped silhouette with a warm fringe. */
export function thatchRoof(
  top: number,
  base: number,
  half: number,
  p: Palette,
  color = p.roof,
): string {
  const parts: string[] = [];
  const dark = shade(color, -0.28);
  const light = shade(color, 0.16);
  for (let i = 0; i < 4; i += 1) {
    const t = i / 4;
    const y = top + (base - top) * t;
    const span = half * (0.25 + t * 0.75) * 2;
    parts.push(rect(-span / 2, y, span, (base - top) / 4 + 1, i % 2 === 0 ? color : dark));
  }
  parts.push(poly([[-half, base], [0, top], [half, base]], color));
  for (let x = -half + 4; x < half - 2; x += 6) {
    const y = base - 4 - Math.abs(x) * 0.12;
    parts.push(rect(x, y, 1, 4 + Math.abs(x) * 0.1, dark, 'opacity="0.5"'));
  }
  parts.push(rect(-half, base - 2, half * 2, 2, dark));
  parts.push(rect(-1, top + 2, 2, base - top - 2, light, 'opacity="0.45"'));
  return parts.join('');
}

export function battlement(
  x: number,
  y: number,
  width: number,
  p: Palette,
  color = p.stoneLight,
  block = 7,
): string {
  const parts: string[] = [];
  parts.push(rect(x, y, width, 4, color));
  for (let xx = x; xx < x + width - 2; xx += block) {
    parts.push(rect(xx, y - 4, Math.min(4, x + width - xx), 4, color));
    parts.push(rect(xx, y - 4, Math.min(4, x + width - xx), 1, shade(color, 0.28)));
  }
  return parts.join('');
}

export function lampPost(x: number, base: number, p: Palette, height = 42): string {
  const top = base - height;
  return `<g transform="translate(${x} ${base})">${ellipse(0, 0, 9, 2, p.shadow)}${rect(
    -1,
    top + 8,
    3,
    height - 8,
    p.metalDark,
  )}${rect(0, top + 8, 1, height - 8, p.metalLight, 'opacity="0.55"')}${rect(
    -5,
    top,
    11,
    3,
    p.metalDark,
  )}${rect(-4, top + 3, 9, 7, p.metalDark)}${rect(
    -2,
    top + 5,
    5,
    4,
    p.window,
    'class="window"',
  )}${rect(-5, top - 2, 11, 2, p.metal)}${circle(0, top + 7, 2, p.windowGlow, 'opacity="0.75"')}</g>`;
}

export function torch(x: number, base: number, p: Palette): string {
  return `<g transform="translate(${x} ${base})">${ellipse(0, 0, 8, 2, p.shadow)}${rect(
    -1,
    -30,
    3,
    30,
    p.woodDark,
  )}${rect(-3, -32, 7, 3, p.wood)}${poly(
    [[-5, -32], [0, -46], [5, -32]],
    p.fire,
    'class="flame"',
  )}${poly([[-2, -32], [0, -40], [2, -32]], p.fireLight, 'class="flame"')}${rect(
    -3,
    -34,
    6,
    2,
    p.woodDark,
  )}</g>`;
}

export function firePit(x: number, base: number, scale: number, p: Palette): string {
  return `<g transform="translate(${x} ${base}) scale(${scale})">${ellipse(0, 0, 22, 5, p.shadow)}${ellipse(
    0,
    -1,
    14,
    4,
    p.dirtDark,
  )}${circle(-10, -3, 3, p.stoneDark)}${circle(9, -3, 3, p.stoneDark)}${circle(0, -5, 3, p.stone)}${circle(
    -6,
    1,
    3,
    p.stone,
  )}${circle(7, 1, 3, p.stone)}${rect(-10, -5, 20, 3, p.woodDark)}${rect(
    -7,
    -8,
    14,
    2,
    p.wood,
  )}${poly([[-7, -6], [-4, -20], [0, -28], [4, -19], [7, -6]], p.fire, 'class="fire"')}${poly(
    [[-4, -6], [-2, -15], [1, -21], [4, -13], [5, -6]],
    p.fireLight,
    'class="fire"',
  )}${rect(-2, -10, 3, 6, '#fff3a8', 'class="fire"')}</g>`;
}

export function smokePuff(x: number, y: number, size: number, p: Palette, delay: number): string {
  return `<g class="smoke" style="animation-delay:-${delay}s">${circle(
    x,
    y,
    size,
    p.smoke,
    'opacity="0.6"',
  )}${circle(x + size * 0.8, y - size * 0.6, size * 0.68, p.smokeLight, 'opacity="0.48"')}${circle(
    x - size * 0.6,
    y - size * 0.2,
    size * 0.52,
    p.smoke,
    'opacity="0.35"',
  )}</g>`;
}

export function chimney(
  x: number,
  y: number,
  w: number,
  h: number,
  p: Palette,
  color = p.brick,
): string {
  return `${rect(x - 1, y - 1, w + 2, h + 1, p.outline)}${rect(x, y, w, h, color)}${brickPattern(
    x,
    y,
    w,
    h,
    p,
    6,
  )}${rect(x - 2, y - 3, w + 4, 3, shade(color, -0.28))}${rect(
    x - 1,
    y - 2,
    w + 2,
    1,
    shade(color, 0.2),
    'opacity="0.6"',
  )}`;
}

/** A connected 10 × 8 crescent, with a shaded peel and two brown tips. */
export function banana(x: number, y: number, scale: number, p: Palette): string {
  return `<g transform="translate(${x} ${y}) scale(${scale})">${path(
    'M0 1H2V3H3V4H6V3H7V2H8V0H10V4H9V6H8V7H6V8H3V7H2V6H1V4H0Z',
    p.bananaDark,
  )}${path(
    'M1 2H2V3H3V4H6V3H7V2H9V4H8V5H7V6H3V5H2V4H1Z',
    p.banana,
  )}${path(
    'M1 2H2V3H3V4H6V3H7V2H8V4H7V5H3V4H2V3H1Z',
    p.bananaLight,
  )}${rect(8, 0, 2, 2, p.woodDark)}${rect(8, 0, 1, 1, p.woodLight)}${rect(0, 1, 1, 2, p.woodDark)}</g>`;
}

export function bananaBunch(x: number, y: number, scale: number, p: Palette): string {
  return `<g transform="translate(${x} ${y}) scale(${scale})">${banana(-5, -4, 0.7, p)}${banana(
    -1,
    -3,
    0.7,
    p,
  )}${banana(-3, -1, 0.75, p)}${rect(0, -5, 2, 3, p.woodDark)}${rect(0, -5, 1, 2, p.woodLight)}</g>`;
}

export function bananaPlant(x: number, base: number, scale: number, p: Palette): string {
  return `<g transform="translate(${x} ${base}) scale(${scale})">${ellipse(
    0,
    1,
    7,
    2,
    p.shadow,
  )}${rect(-2, -25, 4, 25, p.woodDark)}${rect(-1, -25, 2, 25, p.wood)}${poly(
    [[-2, -24], [-20, -34], [-7, -17]],
    p.leafDark,
  )}${poly([[2, -22], [20, -33], [8, -15]], p.leaf)}${poly(
    [[-1, -19], [-15, -12], [-2, -10]],
    p.leaf,
  )}${poly([[1, -17], [15, -11], [2, -8]], p.leafDark)}${poly(
    [[-1, -25], [-9, -38], [0, -28]],
    shade(p.leaf, 0.12),
  )}${bananaBunch(0, -21, 1, p)}</g>`;
}

export function bush(x: number, base: number, scale: number, p: Palette, dark = false): string {
  const leaf = dark ? p.leafDark : p.leaf;
  const light = shade(leaf, 0.18);
  return `<g transform="translate(${x} ${base}) scale(${scale})">${ellipse(0, 0, 13, 3, p.shadow)}${poly(
    [[-13, 0], [-16, -10], [-6, -8], [-3, -17], [5, -13], [12, -16], [15, -6], [10, 0]],
    leaf,
  )}${rect(-9, -11, 4, 3, light, 'opacity="0.7"')}${rect(2, -14, 3, 3, light, 'opacity="0.55"')}${rect(
    -4,
    -6,
    2,
    2,
    p.accent,
    'opacity="0.75"',
  )}</g>`;
}

export function rockCluster(x: number, base: number, scale: number, p: Palette): string {
  return `<g transform="translate(${x} ${base}) scale(${scale})">${ellipse(0, 0, 14, 3, p.shadow)}${poly(
    [[-13, 0], [-10, -8], [-3, -12], [4, -9], [13, 0]],
    p.stoneDark,
  )}${poly([[-9, -1], [-7, -7], [-2, -9], [2, -7], [7, -1]], p.stone)}${rect(
    -6,
    -7,
    4,
    1,
    p.stoneLight,
    'opacity="0.75"',
  )}${circle(10, -2, 3, p.stone)}${circle(-12, -1, 2, p.stoneDark)}</g>`;
}

export function grassTuft(x: number, base: number, height: number, p: Palette, color = p.grassDark): string {
  return `${rect(x, base - height, 2, height, color)}${rect(x + 2, base - height + 2, 2, height - 2, color)}${rect(
    x - 2,
    base - height + 3,
    2,
    height - 3,
    color,
  )}${rect(x + 1, base - height, 1, 2, p.grassLight, 'opacity="0.75"')}`;
}

export function flowers(x: number, base: number, p: Palette, scale = 1): string {
  return `<g transform="translate(${x} ${base}) scale(${scale})">${rect(
    -6,
    -6,
    1,
    6,
    p.grassDark,
  )}${rect(-2, -9, 1, 9, p.grassDark)}${rect(3, -5, 1, 5, p.grassDark)}${rect(
    -7,
    -7,
    3,
    2,
    p.accent,
  )}${rect(-3, -10, 3, 2, p.accent2)}${rect(2, -6, 3, 2, p.accent)}${rect(
    -6,
    -7,
    1,
    1,
    p.bananaLight,
  )}${rect(-2, -10, 1, 1, p.bananaLight)}</g>`;
}

export function pottedPlant(x: number, base: number, scale: number, p: Palette): string {
  return `<g transform="translate(${x} ${base}) scale(${scale})">${rect(-5, -7, 10, 7, p.roofDark)}${rect(
    -4,
    -6,
    8,
    5,
    p.roof,
  )}${rect(-3, -6, 2, 1, p.roofDark)}${rect(-1, -20, 2, 14, p.woodDark)}${poly(
    [[-1, -18], [-9, -24], [-3, -15]],
    p.leafDark,
  )}${poly([[1, -16], [9, -23], [3, -13]], p.leaf)}${poly(
    [[-1, -13], [-7, -9], [-1, -8]],
    p.leaf,
  )}${poly([[1, -12], [7, -8], [1, -7]], p.leafDark)}</g>`;
}

export function crate(x: number, base: number, p: Palette, scale = 1, banana = false): string {
  return `<g transform="translate(${x} ${base}) scale(${scale})">${ellipse(0, 1, 9, 2, p.shadow)}${rect(
    -8,
    -12,
    16,
    12,
    p.woodDark,
  )}${rect(-7, -11, 14, 10, p.wood)}${rect(-7, -7, 14, 1, p.woodDark)}${rect(
    -7,
    -3,
    14,
    1,
    p.woodDark,
  )}${rect(-7, -11, 1, 10, p.woodLight, 'opacity="0.55"')}${rect(
    -7,
    -12,
    14,
    1,
    p.woodLight,
  )}${banana ? bananaBunch(0, -13, 1, p) : ''}</g>`;
}

export function barrel(x: number, base: number, p: Palette): string {
  return `${rect(x, base - 15, 12, 15, p.woodDark)}${rect(x + 1, base - 14, 10, 13, p.wood)}${rect(
    x + 1,
    base - 12,
    10,
    2,
    p.metalDark,
  )}${rect(x + 1, base - 5, 10, 2, p.metalDark)}${rect(
    x + 2,
    base - 14,
    1,
    13,
    p.woodLight,
    'opacity="0.5"',
  )}`;
}

export function signBoard(
  text: string,
  x: number,
  y: number,
  scale: number,
  p: Palette,
  bg = p.woodDark,
  fg = p.bananaLight,
  pixelText: (text: string, x: number, y: number, scale: number, fill: string, extra?: string) => string,
  pixelTextWidth: (text: string, scale: number) => number,
): string {
  const width = pixelTextWidth(text, scale) + 8;
  return `${rect(x - width / 2 - 1, y - 3, width + 2, 7 * scale + 6, p.outline)}${rect(
    x - width / 2,
    y - 2,
    width,
    7 * scale + 4,
    bg,
  )}${rect(x - width / 2, y - 2, width, 1, shade(bg, 0.3), 'opacity="0.6"')}${pixelText(
    text,
    x - width / 2 + 4,
    y,
    scale,
    fg,
  )}`;
}

export function flag(x: number, y: number, p: Palette, color: string): string {
  return `${rect(x - 1, y - 30, 2, 30, p.metalDark)}${rect(x - 1, y - 30, 1, 30, p.metalLight, 'opacity="0.4"')}${poly(
    [[x + 1, y - 30], [x + 18, y - 25], [x + 1, y - 20]],
    color,
    'class="flag"',
  )}${rect(x + 1, y - 30, 1, 10, shade(color, 0.3), 'opacity="0.6"')}`;
}

export function antenna(x: number, base: number, height: number, p: Palette, color = p.accent2): string {
  return `${rect(x - 1, base - height, 2, height, p.metalDark)}${rect(x, base - height, 1, height, p.metalLight, 'opacity="0.5"')}${rect(
    x - 5,
    base - height * 0.62,
    10,
    2,
    p.metalDark,
  )}${rect(x - 3, base - height * 0.36, 6, 2, p.metalDark)}${circle(
    x,
    base - height - 1,
    2.5,
    color,
    'class="blink"',
  )}`;
}

export function drone(x: number, y: number, p: Palette, scale = 1): string {
  return `<g transform="translate(${x} ${y}) scale(${scale})"><g class="drone">${rect(
    -3,
    -2,
    6,
    4,
    p.metalDark,
  )}${rect(-5, -3, 10, 2, p.metalLight)}${rect(-11, -4, 6, 1, p.metal)}${rect(
    5,
    -4,
    6,
    1,
    p.metal,
  )}${rect(-11, -3, 1, 2, p.metal)}${rect(10, -3, 1, 2, p.metal)}${circle(
    0,
    0,
    1.3,
    p.accent2,
    'class="blink"',
  )}</g></g>`;
}

export function cloud(x: number, y: number, scale: number, p: Palette, className: string): string {
  const w = 58;
  return `<g transform="translate(${x} ${y}) scale(${scale})"><g class="cloud ${className}">${rect(
    -w / 2,
    0,
    w,
    9,
    p.cloudShade,
  )}${rect(-w / 2 + 6, -5, w - 16, 8, p.cloud)}${rect(-w / 2 + 16, -11, w - 32, 8, p.cloud)}${rect(
    -w / 2 + 26,
    -16,
    w - 48,
    7,
    p.cloud,
  )}${rect(-w / 2 + 2, 0, w - 4, 7, p.cloud)}${rect(
    -w / 2 + 8,
    -4,
    12,
    3,
    '#ffffff',
    'opacity="0.35"',
  )}${rect(-w / 2 + 28, -13, 10, 2, '#ffffff', 'opacity="0.3"')}</g></g>`;
}

export function bird(x: number, y: number, scale: number, p: Palette, index: number): string {
  return `<g transform="translate(${x} ${y}) scale(${scale})"><g class="bird bird-${index}"><path d="M-8 0 L-2 -5 L0 -2 L2 -5 L8 0" fill="none" stroke="${
    p.outline
  }" stroke-width="2" stroke-linecap="square"/></g></g>`;
}

export function tree(
  x: number,
  base: number,
  scale: number,
  p: Palette,
  variant: 'round' | 'pine' | 'palm' | 'alien' = 'round',
  dark = false,
): string {
  const leaf = dark ? p.jungleDark : p.jungle;
  const leafLight = dark ? p.jungle : p.jungleLight;
  const trunk = dark ? shade(p.woodDark, -0.15) : p.woodDark;
  const parts: string[] = [];
  parts.push(ellipse(0, 0, 12, 2, p.shadow));
  parts.push(rect(-2, -24, 4, 24, trunk));
  if (variant === 'pine') {
    parts.push(poly([[-11, -16], [0, -34], [11, -16]], leaf));
    parts.push(poly([[-14, -22], [0, -44], [14, -22]], leaf));
    parts.push(poly([[-10, -30], [0, -50], [10, -30]], leafLight));
    parts.push(poly([[-8, -34], [0, -48], [8, -34]], leaf, 'opacity="0.7"'));
  } else if (variant === 'palm') {
    parts.push(ellipse(0, -26, 14, 8, leaf));
    parts.push(poly([[-1, -26], [-20, -36], [-8, -22]], leaf));
    parts.push(poly([[1, -26], [20, -37], [9, -21]], leafLight));
    parts.push(poly([[-1, -24], [-17, -16], [-3, -14]], leafLight));
    parts.push(poly([[1, -22], [16, -14], [3, -12]], leaf));
    parts.push(bananaBunch(0, -22, 0.8, p));
  } else if (variant === 'alien') {
    parts.push(rect(-1, -26, 2, 26, p.accentDark, 'opacity="0.7"'));
    parts.push(ellipse(0, -32, 10, 7, leaf));
    parts.push(ellipse(-8, -27, 7, 5, leafLight));
    parts.push(ellipse(8, -28, 7, 5, leaf));
    parts.push(circle(0, -33, 2, p.accent2, 'class="blink"'));
  } else {
    parts.push(ellipse(0, -31, 13, 11, leaf));
    parts.push(ellipse(-8, -26, 8, 7, leafLight));
    parts.push(ellipse(8, -34, 8, 8, leaf));
    parts.push(ellipse(2, -40, 7, 6, leafLight));
    parts.push(rect(-4, -37, 3, 2, leafLight, 'opacity="0.8"'));
    parts.push(rect(4, -28, 2, 2, leafLight, 'opacity="0.65"'));
  }
  parts.push(rect(-3, -26, 6, 2, trunk));
  return `<g transform="translate(${x} ${base}) scale(${scale})">${parts.join('')}</g>`;
}

export function smallFence(x: number, base: number, width: number, p: Palette): string {
  const parts: string[] = [];
  for (let i = 0; i <= width; i += 7) {
    parts.push(rect(x + i, base - 13, 2, 13, p.wood));
    parts.push(rect(x + i, base - 13, 1, 2, p.woodLight, 'opacity="0.7"'));
  }
  parts.push(rect(x, base - 10, width + 2, 2, p.woodDark));
  parts.push(rect(x, base - 4, width + 2, 2, p.woodDark));
  return parts.join('');
}

export function waterTower(x: number, base: number, p: Palette): string {
  return `<g transform="translate(${x} ${base})">${rect(-1, -34, 2, 34, p.metalDark)}${rect(
    -12,
    -54,
    24,
    20,
    p.metalDark,
  )}${rect(-11, -52, 22, 16, p.metal)}${rect(-11, -52, 22, 3, p.metalLight)}${rect(
    -9,
    -46,
    18,
    1,
    p.metalDark,
  )}${rect(-9, -40, 18, 1, p.metalDark)}${poly([[-13, -54], [0, -62], [13, -54]], p.roofDark)}${rect(
    -1,
    -58,
    2,
    6,
    p.metalLight,
  )}</g>`;
}

export function chainLink(x: number, base: number, height: number, p: Palette): string {
  const parts: string[] = [];
  parts.push(rect(x, base - height, 1, height, p.metalDark));
  parts.push(rect(x, base - height, 1, 2, p.metalLight));
  for (let y = base - height + 4; y < base; y += 5) {
    parts.push(rect(x - 1, y, 3, 1, p.metalDark, 'opacity="0.7"'));
  }
  return parts.join('');
}

export function groundShadow(x: number, base: number, width: number, p: Palette): string {
  return ellipse(x, base + 1, width / 2, 2.2, p.shadow);
}

export function lightPool(x: number, y: number, radius: number, color: string, delay = 0): string {
  return `<g class="lamp" style="animation-delay:-${delay}s">${circle(
    x,
    y,
    radius,
    color,
    'opacity="0.10"',
  )}${circle(x, y, radius * 0.55, color, 'opacity="0.16"')}${circle(
    x,
    y,
    Math.max(2, radius * 0.18),
    color,
    'opacity="0.5"',
  )}</g>`;
}

export function roofDetails(
  x: number,
  y: number,
  width: number,
  p: Palette,
  count = 3,
): string {
  const parts: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const xx = x + (width / (count + 1)) * (i + 1);
    parts.push(rect(xx, y, 2, 3, p.roofDark));
  }
  return parts.join('');
}

/** A subtle warm/cool rim light along a vertical edge. */
export function rimLight(x: number, y: number, h: number, color: string): string {
  return rect(x, y, 1, h, color, 'opacity="0.35"');
}

/** Horizontal timber beams used by medieval facades. */
export function timberFrame(x: number, y: number, w: number, h: number, p: Palette): string {
  const parts: string[] = [];
  parts.push(rect(x, y, w, 2, p.woodDark));
  parts.push(rect(x, y + h - 2, w, 2, p.woodDark));
  parts.push(rect(x, y, 2, h, p.woodDark));
  parts.push(rect(x + w - 2, y, 2, h, p.woodDark));
  parts.push(line(x + 2, y + 2, x + w - 2, y + h - 2, p.woodDark, 1.2, 'opacity="0.8"'));
  parts.push(line(x + w - 2, y + 2, x + 2, y + h - 2, p.woodDark, 1.2, 'opacity="0.8"'));
  return parts.join('');
}
