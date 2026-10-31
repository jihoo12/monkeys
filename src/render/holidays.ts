import type { Palette } from './palette.ts';
import { shade } from './palette.ts';
import { circle, ellipse, line, path, poly, rect } from './svg.ts';
import { pixelText, pixelTextWidth } from './pixel-font.ts';
import type { Rng } from '../util/rng.ts';
import { parseDateString } from '../util/date.ts';

/**
 * Date-driven holiday themes.
 *
 * A theme changes the palette, the greeting in the scene header, and adds a
 * layer of pixel-art decorations. Themes are selected from a date string, never
 * from the wall clock, so a generation stays deterministic.
 */

export type HolidayId =
  | 'new-year'
  | 'valentines'
  | 'st-patricks'
  | 'easter'
  | 'independence'
  | 'halloween'
  | 'thanksgiving'
  | 'christmas';

export type HolidayOption = HolidayId | 'auto' | 'none';

export interface HolidayDefinition {
  id: HolidayId;
  name: string;
  /** Short all-caps line shown where the tagline normally sits. */
  greeting: string;
  /** Inclusive `MM-DD` window. Omitted when `matches` is used instead. */
  window?: { from: string; to: string };
  /** Custom matcher for movable feasts. */
  matches?: (date: Date) => boolean;
  palette: Partial<Palette>;
  /** Full-scene tint applied above the village. */
  atmosphere: { color: string; opacity: number };
}

const NIGHT = {
  star: '#fff8d6',
} as const;

const INK = '#1a1020';

export const HOLIDAYS: readonly HolidayDefinition[] = [
  {
    id: 'new-year',
    name: "New Year's Day",
    greeting: 'HAPPY NEW YEAR!',
    window: { from: '12-31', to: '01-01' },
    palette: {
      skyTop: '#050a1f',
      skyBottom: '#1a2a5a',
      haze: '#2a3a7a',
      sun: '#ffe066',
      sunGlow: '#ffcc4d',
      moon: '#fff8d6',
      star: NIGHT.star,
      cloud: '#3a4a7a',
      cloudShade: '#2a3560',
      mountainFar: '#2a3560',
      mountainMid: '#202a4f',
      mountainNear: '#182040',
      silhouette: '#141a34',
      silhouette2: '#0f142a',
      accent: '#ffd93d',
      accent2: '#6ee7f9',
      accentDark: '#a87916',
      window: '#ffe066',
      windowGlow: '#ffd93d',
      hudBorder: '#ffd93d',
      hudAccent: '#ffd93d',
      hudAccent2: '#6ee7f9',
      night: '#02040f',
      nightOpacity: 0.5,
    },
    atmosphere: { color: '#ffd93d', opacity: 0.06 },
  },
  {
    id: 'valentines',
    name: "Valentine's Day",
    greeting: 'HAPPY VALENTINES!',
    window: { from: '02-14', to: '02-14' },
    palette: {
      skyTop: '#ff9ec4',
      skyBottom: '#ffe3ec',
      haze: '#ffd0e0',
      sun: '#fff0a0',
      sunGlow: '#ff8fb0',
      moon: '#fff4f8',
      star: '#fff0f6',
      cloud: '#fff4f8',
      cloudShade: '#ffd6e4',
      mountainFar: '#d98aa8',
      mountainMid: '#c97a98',
      mountainNear: '#b06a88',
      silhouette: '#9a5a78',
      silhouette2: '#7a4a62',
      grass: '#8abf7a',
      grassLight: '#a8d99a',
      grassDark: '#6a9f5a',
      accent: '#e63975',
      accent2: '#ff8fb0',
      accentDark: '#a81f50',
      window: '#ffd166',
      windowGlow: '#ff8fb0',
      hudBorder: '#e63975',
      hudAccent: '#e63975',
      hudAccent2: '#ff8fb0',
      night: '#2a0a1a',
      nightOpacity: 0.5,
    },
    atmosphere: { color: '#ff8fb0', opacity: 0.08 },
  },
  {
    id: 'st-patricks',
    name: "St. Patrick's Day",
    greeting: 'HAPPY ST PATRICKS!',
    window: { from: '03-17', to: '03-17' },
    palette: {
      skyTop: '#5fa8e8',
      skyBottom: '#c9f0d0',
      haze: '#b8e8c0',
      sun: '#ffe066',
      sunGlow: '#8fd96f',
      mountainFar: '#7abf7a',
      mountainMid: '#5f9f5f',
      mountainNear: '#4a8a4a',
      silhouette: '#3a7a4a',
      silhouette2: '#2a5f3a',
      jungle: '#2f8a4a',
      jungleDark: '#1e6b34',
      jungleLight: '#4abf6a',
      grass: '#4fbf5a',
      grassLight: '#7ae08a',
      grassDark: '#3a9a44',
      accent: '#2a9d4f',
      accent2: '#ffd93d',
      accentDark: '#1a6b34',
      window: '#ffe066',
      windowGlow: '#ffd93d',
      hudBorder: '#2a9d4f',
      hudAccent: '#2a9d4f',
      hudAccent2: '#ffd93d',
      night: '#0a1a10',
      nightOpacity: 0.55,
    },
    atmosphere: { color: '#2a9d4f', opacity: 0.05 },
  },
  {
    id: 'easter',
    name: 'Easter Sunday',
    greeting: 'HAPPY EASTER!',
    matches: (date) => monthDay(date) === easterSunday(date.getUTCFullYear()),
    palette: {
      skyTop: '#a8d8f0',
      skyBottom: '#ffe8f0',
      haze: '#e8d8f0',
      sun: '#fff2a8',
      sunGlow: '#ffb3c8',
      cloud: '#fffafc',
      cloudShade: '#f0d8e8',
      mountainFar: '#b8c8d8',
      mountainMid: '#a8b8c8',
      mountainNear: '#8aa0b8',
      jungle: '#5a9a6a',
      jungleDark: '#3f7a4f',
      jungleLight: '#7abf8a',
      grass: '#7adf8a',
      grassLight: '#a8f0b0',
      grassDark: '#5abf6a',
      accent: '#b07ae8',
      accent2: '#ffb3c8',
      accentDark: '#7a4aa8',
      window: '#ffe066',
      windowGlow: '#ffb3c8',
      hudBorder: '#b07ae8',
      hudAccent: '#b07ae8',
      hudAccent2: '#ffb3c8',
      night: '#1a1030',
      nightOpacity: 0.5,
    },
    atmosphere: { color: '#ffb3c8', opacity: 0.06 },
  },
  {
    id: 'independence',
    name: 'Independence Day',
    greeting: 'HAPPY JULY FOURTH!',
    window: { from: '07-04', to: '07-04' },
    palette: {
      skyTop: '#0a1a4a',
      skyBottom: '#3a4a8a',
      haze: '#2a3a6a',
      sun: '#ffe066',
      sunGlow: '#ffcc4d',
      cloud: '#4a5a8a',
      cloudShade: '#3a4a7a',
      mountainFar: '#3a4a7a',
      mountainMid: '#2f3a66',
      mountainNear: '#242f55',
      silhouette: '#1a2444',
      silhouette2: '#141c36',
      accent: '#e63946',
      accent2: '#4a8fe0',
      accentDark: '#a4161a',
      window: '#ffe066',
      windowGlow: '#ffcc4d',
      hudBorder: '#e63946',
      hudAccent: '#e63946',
      hudAccent2: '#4a8fe0',
      night: '#050a20',
      nightOpacity: 0.58,
    },
    atmosphere: { color: '#1a2a6a', opacity: 0.1 },
  },
  {
    id: 'halloween',
    name: 'Halloween',
    greeting: 'HAPPY HALLOWEEN!',
    window: { from: '10-31', to: '10-31' },
    palette: {
      skyTop: '#1a0b2e',
      skyBottom: '#4a1a3a',
      haze: '#3a1430',
      sun: '#ff9e3d',
      sunGlow: '#ff6b1a',
      moon: '#ffe8b0',
      star: '#ffd9a0',
      cloud: '#4a2a5a',
      cloudShade: '#2e1838',
      mountainFar: '#3a2a4a',
      mountainMid: '#2c1f3a',
      mountainNear: '#21162e',
      silhouette: '#1c1228',
      silhouette2: '#140c1e',
      jungle: '#2f3a2a',
      jungleDark: '#1e2a1c',
      jungleLight: '#4a5a3a',
      grass: '#3f5a3a',
      grassLight: '#5a7a4a',
      grassDark: '#2a3f28',
      accent: '#ff7518',
      accent2: '#b45cff',
      accentDark: '#a84a00',
      window: '#ffb347',
      windowGlow: '#ff7518',
      fire: '#7dff6b',
      fireLight: '#c8ffb0',
      leaf: '#6b8a4a',
      leafDark: '#3f5a2a',
      hudBorder: '#ff7518',
      hudAccent: '#ff7518',
      hudAccent2: '#b45cff',
      night: '#0a0414',
      nightOpacity: 0.55,
    },
    atmosphere: { color: '#5a1a6a', opacity: 0.12 },
  },
  {
    id: 'thanksgiving',
    name: 'Thanksgiving',
    greeting: 'HAPPY THANKSGIVING!',
    matches: (date) =>
      date.getUTCMonth() === 10 && monthDay(date) === nthWeekdayOfMonth(date.getUTCFullYear(), 10, 4, 4),
    palette: {
      skyTop: '#e8a85a',
      skyBottom: '#ffe0a8',
      haze: '#f0c890',
      sun: '#fff0b0',
      sunGlow: '#ffb347',
      mountainFar: '#c9a06a',
      mountainMid: '#b08a58',
      mountainNear: '#967446',
      silhouette: '#7a5a34',
      silhouette2: '#5f4628',
      jungle: '#7a6a2a',
      jungleDark: '#5f5220',
      jungleLight: '#9a8a3a',
      grass: '#a89a4a',
      grassLight: '#c8ba6a',
      grassDark: '#8a7a3a',
      accent: '#c0561f',
      accent2: '#e0a020',
      accentDark: '#8a3a10',
      window: '#ffb347',
      windowGlow: '#e0a020',
      hudBorder: '#c0561f',
      hudAccent: '#c0561f',
      hudAccent2: '#e0a020',
      night: '#1a0e08',
      nightOpacity: 0.55,
    },
    atmosphere: { color: '#e0a020', opacity: 0.07 },
  },
  {
    id: 'christmas',
    name: 'Christmas',
    greeting: 'MERRY CHRISTMAS!',
    window: { from: '12-24', to: '12-26' },
    palette: {
      skyTop: '#0f2a4a',
      skyBottom: '#6a9ac0',
      haze: '#bcd8e8',
      sun: '#fff2c0',
      sunGlow: '#ffd27a',
      moon: '#ffffff',
      star: '#ffffff',
      cloud: '#f4faff',
      cloudShade: '#c8dce8',
      mountainFar: '#8aa8b8',
      mountainMid: '#6a8a9a',
      mountainNear: '#4a6a7a',
      silhouette: '#3a5a6a',
      silhouette2: '#2a4a5a',
      jungle: '#2f6a4a',
      jungleDark: '#1e4a34',
      jungleLight: '#4a8a5a',
      grass: '#6a9a7a',
      grassLight: '#8ab89a',
      grassDark: '#4a7a5a',
      accent: '#e63946',
      accent2: '#2a9d8f',
      accentDark: '#a4161a',
      window: '#ffd166',
      windowGlow: '#ff9f1c',
      fire: '#ff9f1c',
      fireLight: '#ffe066',
      hudBorder: '#e63946',
      hudAccent: '#e63946',
      hudAccent2: '#2a9d8f',
      night: '#050d1a',
      nightOpacity: 0.55,
    },
    atmosphere: { color: '#bfe8ff', opacity: 0.08 },
  },
];

export const HOLIDAY_IDS: readonly HolidayId[] = HOLIDAYS.map((holiday) => holiday.id);

export function isHolidayId(value: string): value is HolidayId {
  return (HOLIDAY_IDS as readonly string[]).includes(value);
}

/** Parse a CLI/action value into a holiday option. */
export function parseHolidayOption(value: string): HolidayOption {
  const normalized = value.trim().toLowerCase();
  if (normalized === '' || normalized === 'auto') return 'auto';
  if (normalized === 'none' || normalized === 'off') return 'none';
  if (isHolidayId(normalized)) return normalized;
  throw new Error(
    `Unknown holiday "${value}". Use auto, none, or one of: ${HOLIDAY_IDS.join(', ')}.`,
  );
}

/** Resolve a holiday for a date. `auto` uses the date, `none` disables it. */
export function resolveHoliday(
  option: HolidayOption | undefined,
  dateString: string,
): HolidayDefinition | null {
  if (!option || option === 'auto') return holidayFor(dateString);
  if (option === 'none') return null;
  return HOLIDAYS.find((holiday) => holiday.id === option) ?? null;
}

/** The holiday whose window contains the given `YYYY-MM-DD` date. */
export function holidayFor(dateString: string): HolidayDefinition | null {
  const date = parseDateString(dateString);
  if (Number.isNaN(date.getTime())) return null;
  const key = monthDay(date);
  for (const holiday of HOLIDAYS) {
    if (holiday.matches) {
      if (holiday.matches(date)) return holiday;
      continue;
    }
    if (holiday.window && inWindow(key, holiday.window.from, holiday.window.to)) return holiday;
  }
  return null;
}

/** Merge a holiday's palette overrides into an age palette. */
export function applyHolidayPalette(
  palette: Palette,
  holiday: HolidayDefinition | null,
): Palette {
  if (!holiday) return palette;
  return { ...palette, ...holiday.palette };
}

export function holidayCss(holiday: HolidayDefinition): string {
  return `
.bat{transform-box:fill-box;transform-origin:center;animation:holiday-bat 1.3s ease-in-out infinite alternate}
.ghost{transform-box:fill-box;transform-origin:center;animation:holiday-ghost 4.5s ease-in-out infinite alternate}
.pumpkin-glow{transform-box:fill-box;transform-origin:center;animation:holiday-pumpkin 2.2s ease-in-out infinite alternate}
.holiday-snow{animation:holiday-snow 8s linear infinite}
.twinkle-light{transform-box:fill-box;transform-origin:center;animation:holiday-twinkle 1.8s steps(2) infinite}
.garland-bulb{animation:holiday-bulb 2.4s ease-in-out infinite alternate}
.holiday-firework{transform-box:fill-box;transform-origin:center;animation:holiday-firework 3.2s ease-out infinite}
.holiday-confetti{animation:holiday-confetti 6s linear infinite}
.heart-float{transform-box:fill-box;transform-origin:center;animation:holiday-heart 5.5s ease-in-out infinite alternate}
.holiday-petal{animation:holiday-petal 9s linear infinite}
.shamrock-float{transform-box:fill-box;transform-origin:center;animation:holiday-shamrock 4.8s ease-in-out infinite alternate}
.holiday-sparkle{transform-box:fill-box;transform-origin:center;animation:holiday-sparkle 2.6s ease-in-out infinite alternate}
.holiday-leaf{animation:holiday-leaf 10s linear infinite}
.holiday-egg-float{transform-box:fill-box;transform-origin:center;animation:holiday-egg 5.2s ease-in-out infinite alternate}
.holiday-star{transform-box:fill-box;transform-origin:center;animation:holiday-star 2.8s ease-in-out infinite alternate}
@keyframes holiday-bat{from{transform:scaleY(1)}to{transform:scaleY(.55)}}
@keyframes holiday-ghost{from{transform:translateY(0)}to{transform:translateY(-7px)}}
@keyframes holiday-pumpkin{from{opacity:.35}to{opacity:.9}}
@keyframes holiday-snow{0%{transform:translateY(-12px);opacity:0}8%{opacity:.95}100%{transform:translateY(540px);opacity:0}}
@keyframes holiday-twinkle{0%,100%{opacity:.45}50%{opacity:1}}
@keyframes holiday-bulb{from{opacity:.5}to{opacity:1}}
@keyframes holiday-firework{0%{opacity:0;transform:scale(.2)}18%{opacity:1}68%{opacity:.85;transform:scale(1)}100%{opacity:0;transform:scale(1.2)}}
@keyframes holiday-confetti{0%{transform:translateY(-14px) rotate(0);opacity:0}10%{opacity:1}100%{transform:translateY(540px) rotate(560deg);opacity:0}}
@keyframes holiday-heart{from{transform:translateY(0) scale(1)}to{transform:translateY(-10px) scale(1.08)}}
@keyframes holiday-petal{0%{transform:translate(0,-10px) rotate(0);opacity:0}10%{opacity:.9}100%{transform:translate(-24px,540px) rotate(320deg);opacity:0}}
@keyframes holiday-shamrock{from{transform:rotate(-8deg)}to{transform:rotate(8deg)}}
@keyframes holiday-sparkle{0%,100%{transform:scale(.5);opacity:.3}50%{transform:scale(1);opacity:1}}
@keyframes holiday-leaf{0%{transform:translate(0,-10px) rotate(0);opacity:0}10%{opacity:.9}100%{transform:translate(30px,540px) rotate(280deg);opacity:0}}
@keyframes holiday-egg{from{transform:translateY(0) rotate(-4deg)}to{transform:translateY(-9px) rotate(4deg)}}
@keyframes holiday-star{from{transform:scale(.85);opacity:.7}to{transform:scale(1.15);opacity:1}}
@media (prefers-reduced-motion: reduce){.bat,.ghost,.pumpkin-glow,.holiday-snow,.twinkle-light,.garland-bulb,.holiday-firework,.holiday-confetti,.heart-float,.holiday-petal,.shamrock-float,.holiday-sparkle,.holiday-leaf,.holiday-egg-float,.holiday-star{animation:none!important}}
`;
}

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function monthDay(date: Date): string {
  return `${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

function inWindow(value: string, from: string, to: string): boolean {
  return from <= to ? value >= from && value <= to : value >= from || value <= to;
}

/** Gregorian Easter Sunday as `MM-DD`. */
function easterSunday(year: number): string {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return `${pad(month)}-${pad(day)}`;
}

/** `n`th weekday (0=Sunday) of a month as `MM-DD`. */
function nthWeekdayOfMonth(year: number, month: number, weekday: number, n: number): string {
  const first = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const day = 1 + ((weekday - first + 7) % 7) + (n - 1) * 7;
  return `${pad(month + 1)}-${pad(day)}`;
}

// ---------------------------------------------------------------------------
// Shared decoration helpers
// ---------------------------------------------------------------------------

function fallingParticles(
  rng: Rng,
  count: number,
  className: string,
  colors: readonly string[],
  shape: (color: string, index: number) => string,
): string {
  const parts: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const x = rng() * 960;
    const y = rng() * 480;
    const color = colors[i % colors.length] ?? '#ffffff';
    const delay = (i * 0.47) % 9;
    const duration = 6 + (i % 5) * 1.3;
    parts.push(
      `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)})"><g class="${className}" style="animation-delay:-${delay.toFixed(2)}s;animation-duration:${duration.toFixed(1)}s">${shape(
        color,
        i,
      )}</g></g>`,
    );
  }
  return parts.join('');
}

function heartShape(x: number, y: number, scale: number, color: string, extra = ''): string {
  const d = 'M0 5 C-9 -2 -9 -10 -3.5 -10 C-1.4 -10 0 -8 0 -5.6 C0 -8 1.4 -10 3.5 -10 C9 -10 9 -2 0 5 Z';
  return `<g transform="translate(${x} ${y}) scale(${scale})">${path(d, color, extra)}</g>`;
}

function shamrockShape(x: number, y: number, scale: number, color: string, extra = ''): string {
  return `<g transform="translate(${x} ${y}) scale(${scale})">${circle(-3, -3, 3.4, color, extra)}${circle(
    3,
    -3,
    3.4,
    color,
    extra,
  )}${circle(0, 1, 3.4, color, extra)}${rect(-0.8, 2, 1.6, 6, color, extra)}</g>`;
}

function eggShape(x: number, y: number, scale: number, color: string, stripe: string): string {
  return `<g transform="translate(${x} ${y}) scale(${scale})">${ellipse(0, 0, 5, 6.5, color)}${rect(
    -5,
    -1.5,
    10,
    1.5,
    stripe,
    'opacity="0.85"',
  )}${rect(-5, 2.5, 10, 1.5, stripe, 'opacity="0.85"')}${ellipse(-2, -2.5, 1.4, 2, '#ffffff', 'opacity="0.45"')}</g>`;
}

function flagShape(x: number, y: number, scale: number, p: Palette): string {
  return `<g transform="translate(${x} ${y}) scale(${scale})">${rect(0, -20, 1.5, 20, p.metalDark)}${rect(
    1.5,
    -20,
    18,
    12,
    '#f1faee',
  )}${rect(1.5, -20, 18, 2, '#e63946')}${rect(1.5, -16, 18, 2, '#e63946')}${rect(
    1.5,
    -12,
    18,
    2,
    '#e63946',
  )}${rect(1.5, -20, 8, 7, '#1d3557')}${rect(3, -18.5, 1, 1, '#f1faee')}${rect(
    5.5,
    -18.5,
    1,
    1,
    '#f1faee',
  )}${rect(8, -18.5, 1, 1, '#f1faee')}${rect(3, -16.5, 1, 1, '#f1faee')}${rect(
    5.5,
    -16.5,
    1,
    1,
    '#f1faee',
  )}${rect(8, -16.5, 1, 1, '#f1faee')}</g>`;
}

// ---------------------------------------------------------------------------
// Holiday layers
// ---------------------------------------------------------------------------

export function renderHolidayBackdrop(
  holiday: HolidayDefinition,
  rng: Rng,
  p: Palette,
): string {
  switch (holiday.id) {
    case 'halloween':
      return halloweenBackdrop(rng, p);
    case 'christmas':
      return christmasBackdrop(rng, p);
    case 'new-year':
      return newYearBackdrop(rng, p);
    case 'valentines':
      return valentinesBackdrop(rng, p);
    case 'st-patricks':
      return stPatricksBackdrop(rng, p);
    case 'easter':
      return easterBackdrop(rng, p);
    case 'independence':
      return independenceBackdrop(rng, p);
    case 'thanksgiving':
      return thanksgivingBackdrop(rng, p);
  }
  return '';
}

export function renderHolidayGround(
  holiday: HolidayDefinition,
  rng: Rng,
  p: Palette,
  dateString: string,
): string {
  switch (holiday.id) {
    case 'halloween':
      return halloweenGround(rng, p);
    case 'christmas':
      return christmasGround(rng, p);
    case 'new-year':
      return newYearGround(rng, p, dateString);
    case 'valentines':
      return valentinesGround(rng, p);
    case 'st-patricks':
      return stPatricksGround(rng, p);
    case 'easter':
      return easterGround(rng, p);
    case 'independence':
      return independenceGround(rng, p);
    case 'thanksgiving':
      return thanksgivingGround(rng, p);
  }
  return '';
}

export function renderHolidayOverlay(
  holiday: HolidayDefinition,
  rng: Rng,
  p: Palette,
): string {
  const tint = rect(0, 0, 960, 500, holiday.atmosphere.color, `opacity="${holiday.atmosphere.opacity}"`);
  switch (holiday.id) {
    case 'halloween':
      return `${tint}${fallingParticles(rng, 16, 'holiday-leaf', ['#ff7518', '#b45cff', '#ffd166'], (color) =>
        rect(-2, -2, 4, 4, color, 'opacity="0.75"'),
      )}`;
    case 'christmas':
      return `${tint}${fallingParticles(rng, 70, 'holiday-snow', ['#ffffff', '#eaf6ff', '#d8ecff'], (color, i) =>
        rect(-(i % 2), -(i % 2), 2 + (i % 2), 2 + (i % 2), color, 'opacity="0.9"'),
      )}`;
    case 'new-year':
      return `${tint}${fallingParticles(
        rng,
        44,
        'holiday-confetti',
        ['#ffd93d', '#6ee7f9', '#ff8fb0', '#7bd389', '#b388ff'],
        (color, i) => rect(-1.5, -3, 3, 6, color, `transform="rotate(${(i * 37) % 90})"`),
      )}`;
    case 'valentines':
      return `${tint}${fallingParticles(rng, 22, 'holiday-petal', ['#e63975', '#ff8fb0', '#ffc2d4'], (color) =>
        heartShape(0, 0, 0.55, color, 'opacity="0.85"'),
      )}`;
    case 'st-patricks':
      return `${tint}${fallingParticles(rng, 18, 'holiday-sparkle', ['#ffd93d', '#7ae08a', '#ffffff'], (color) =>
        poly(
          [
            [0, -3],
            [1, -1],
            [3, 0],
            [1, 1],
            [0, 3],
            [-1, 1],
            [-3, 0],
            [-1, -1],
          ],
          color,
          'opacity="0.9"',
        ),
      )}`;
    case 'easter':
      return `${tint}${fallingParticles(
        rng,
        26,
        'holiday-petal',
        ['#ffb3c8', '#b07ae8', '#7adf8a', '#ffe066'],
        (color) => circle(0, 0, 2, color, 'opacity="0.85"'),
      )}`;
    case 'independence':
      return `${tint}${fallingParticles(
        rng,
        24,
        'holiday-sparkle',
        ['#e63946', '#f1faee', '#4a8fe0'],
        (color) => circle(0, 0, 1.6, color, 'opacity="0.9"'),
      )}`;
    case 'thanksgiving':
      return `${tint}${fallingParticles(
        rng,
        26,
        'holiday-leaf',
        ['#c0561f', '#e0a020', '#a86a2a', '#8a3a10'],
        (color, i) => leafShape(0, 0, 1, color, i % 2 === 0),
      )}`;
  }
  return tint;
}

function leafShape(x: number, y: number, scale: number, color: string, flip: boolean): string {
  const direction = flip ? -1 : 1;
  return `<g transform="translate(${x} ${y}) scale(${scale * direction} ${scale})">${path(
    'M0 4 C-6 2 -7 -4 0 -7 C7 -4 6 2 0 4 Z',
    color,
    'opacity="0.9"',
  )}${line(0, 4, 0, -6, shade(color, -0.25), 0.6)}</g>`;
}

// ---------------------------------------------------------------------------
// Halloween
// ---------------------------------------------------------------------------

function halloweenBackdrop(rng: Rng, p: Palette): string {
  const parts: string[] = [];
  const bats: Array<[number, number]> = [
    [120, 96],
    [214, 68],
    [330, 122],
    [520, 82],
    [642, 112],
    [758, 64],
    [860, 142],
    [410, 54],
  ];
  bats.forEach(([x, y], index) => {
    parts.push(bat(x, y, 0.75 + rng() * 0.5, p.outline, index * 0.31));
  });
  const ghosts: Array<[number, number, number]> = [
    [270, 150, 1],
    [690, 190, 0.8],
    [560, 120, 0.65],
  ];
  ghosts.forEach(([x, y, scale], index) => {
    parts.push(ghost(x, y, scale, index * 0.9));
  });
  return parts.join('');
}

function bat(x: number, y: number, scale: number, color: string, delay: number): string {
  return `<g transform="translate(${x} ${y}) scale(${scale})"><g class="bat" style="animation-delay:-${delay.toFixed(
    2,
  )}s">${poly(
    [
      [-2, -1],
      [-14, -8],
      [-12, 1],
      [-3, 3],
    ],
    color,
  )}${poly(
    [
      [2, -1],
      [14, -8],
      [12, 1],
      [3, 3],
    ],
    color,
  )}${ellipse(0, 0, 3.2, 4.2, color)}${poly(
    [
      [-2.5, -4],
      [-1.5, -8],
      [0, -4],
    ],
    color,
  )}${poly(
    [
      [2.5, -4],
      [1.5, -8],
      [0, -4],
    ],
    color,
  )}${rect(-1.6, -1.5, 1, 1.4, INK)}${rect(0.6, -1.5, 1, 1.4, INK)}</g></g>`;
}

function ghost(x: number, y: number, scale: number, delay: number): string {
  return `<g transform="translate(${x} ${y}) scale(${scale})"><g class="ghost" style="animation-delay:-${delay.toFixed(
    2,
  )}s">${path(
    'M-9 6 Q-9 -9 0 -9 Q9 -9 9 6 L6 3 L3 6 L0 3 L-3 6 L-6 3 Z',
    '#eef0ff',
    'opacity="0.8"',
  )}${rect(-4, -3, 2, 3, '#2a1a3a')}${rect(2, -3, 2, 3, '#2a1a3a')}</g></g>`;
}

function jackOLantern(x: number, base: number, scale: number, p: Palette): string {
  const orange = '#ff8c1a';
  const dark = '#c2560a';
  const ink = '#2a0f08';
  return `<g transform="translate(${x} ${base}) scale(${scale})">${ellipse(0, 1, 17, 3, p.shadow)}${circle(
    0,
    -13,
    18,
    orange,
    'opacity="0.12"',
  )}${ellipse(0, -11, 16, 12, orange)}${ellipse(-8, -11, 7, 12, dark, 'opacity="0.55"')}${ellipse(
    8,
    -11,
    7,
    12,
    dark,
    'opacity="0.55"',
  )}${rect(-2, -25, 4, 6, '#3f7a3a')}${poly(
    [
      [-10, -15],
      [-5, -15],
      [-7.5, -10],
    ],
    ink,
  )}${poly(
    [
      [5, -15],
      [10, -15],
      [7.5, -10],
    ],
    ink,
  )}${poly(
    [
      [-10, -7],
      [-7, -10],
      [-4, -6],
      [0, -10],
      [4, -6],
      [7, -10],
      [10, -7],
      [6, -2],
      [-6, -2],
    ],
    ink,
  )}<g class="pumpkin-glow">${ellipse(0, -10, 13, 9, '#ffd166', 'opacity="0.18"')}</g></g>`;
}

function halloweenGround(rng: Rng, p: Palette): string {
  const parts: string[] = [];
  parts.push(jackOLantern(160, 468, 1.05, p));
  parts.push(jackOLantern(590, 468, 0.85, p));
  parts.push(jackOLantern(842, 468, 1.15, p));
  parts.push(jackOLantern(952, 468, 0.7, p));
  for (let i = 0; i < 14; i += 1) {
    const x = 30 + rng() * 900;
    const y = 462 + rng() * 8;
    parts.push(
      `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)})">${poly(
        [
          [-3, 0],
          [3, 0],
          [0, -8],
        ],
        '#ffb703',
      )}${poly(
        [
          [-2, -3],
          [2, -3],
          [0, -8],
        ],
        '#ffd166',
      )}${rect(-1, -9, 2, 2, '#fff8e8')}</g>`,
    );
  }
  // A bare, spooky tree on the verge.
  parts.push(`<g transform="translate(742 468)">${rect(-3, -34, 6, 34, '#2a1a20')}${line(
    -2,
    -28,
    -18,
    -46,
    '#2a1a20',
    3,
  )}${line(2, -24, 18, -42, '#2a1a20', 3)}${line(-10, -38, -22, -36, '#2a1a20', 2)}${line(
    10,
    -36,
    22,
    -34,
    '#2a1a20',
    2,
  )}${circle(-18, -47, 2, '#b45cff', 'opacity="0.7"')}${circle(18, -43, 2, '#b45cff', 'opacity="0.6"')}</g>`);
  return parts.join('');
}

// ---------------------------------------------------------------------------
// Christmas
// ---------------------------------------------------------------------------

function christmasBackdrop(rng: Rng, p: Palette): string {
  const parts: string[] = [];
  // North star.
  parts.push(`<g transform="translate(736 70)"><g class="holiday-star">${poly(
    [
      [0, -14],
      [4, -4],
      [14, 0],
      [4, 4],
      [0, 14],
      [-4, 4],
      [-14, 0],
      [-4, -4],
    ],
    '#fff3a8',
  )}${circle(0, 0, 5, '#ffffff', 'opacity="0.9"')}${circle(0, 0, 12, '#fff3a8', 'opacity="0.18"')}</g></g>`);
  // Garland across the sky.
  const points: string[] = [];
  for (let x = 0; x <= 960; x += 24) {
    points.push(`${x} ${140 + Math.sin(x / 150) * 16}`);
  }
  parts.push(
    `<path d="M${points.join(' L')}" fill="none" stroke="#3a5a4a" stroke-width="1.5" opacity="0.7"/>`,
  );
  const colors = ['#e63946', '#ffd166', '#2a9d8f', '#6ee7f9', '#ff8fb0'];
  for (let x = 24; x <= 936; x += 48) {
    const y = 140 + Math.sin(x / 150) * 16;
    parts.push(
      `<g transform="translate(${x} ${y})"><rect x="-1" y="0" width="2" height="5" fill="#3a5a4a"/><circle class="garland-bulb" cx="0" cy="7" r="3" fill="${
        colors[Math.floor(x / 48) % colors.length] ?? '#ffd166'
      }" style="animation-delay:-${((x * 0.03) % 2).toFixed(2)}s"/></g>`,
    );
  }
  // A couple of snow clouds.
  parts.push(ellipse(180, 76, 46, 15, p.cloud, 'opacity="0.55"'));
  parts.push(ellipse(206, 68, 30, 13, p.cloud, 'opacity="0.6"'));
  parts.push(ellipse(152, 70, 24, 11, p.cloudShade, 'opacity="0.5"'));
  return parts.join('');
}

function christmasTree(x: number, base: number, p: Palette): string {
  const greens = ['#1e5a3a', '#2a6f47', '#358a56', '#40a366'];
  const tiers = [
    [-30, -14, 0, -50],
    [-25, -32, 0, -66],
    [-19, -49, 0, -82],
    [-13, -64, 0, -96],
  ];
  const parts: string[] = [];
  parts.push(ellipse(0, 1, 28, 4, p.shadow));
  parts.push(rect(-5, -18, 10, 18, '#5a3a22'));
  tiers.forEach((tier, index) => {
    const [left, top, , peak] = tier as [number, number, number, number];
    parts.push(
      poly(
        [
          [left, top],
          [-left, top],
          [0, peak],
        ],
        greens[index] ?? greens[greens.length - 1]!,
      ),
    );
    parts.push(
      poly(
        [
          [left + 4, top + 2],
          [left + 12, top + 2],
          [left + 8, top + 6],
        ],
        '#eaf6ff',
        'opacity="0.8"',
      ),
    );
  });
  parts.push(`<g class="holiday-star">${poly(
    [
      [0, -116],
      [3, -108],
      [11, -105],
      [3, -102],
      [0, -94],
      [-3, -102],
      [-11, -105],
      [-3, -108],
    ],
    '#ffd166',
  )}</g>`);
  const ornaments: Array<[number, number, string]> = [
    [-16, -30, '#e63946'],
    [14, -34, '#ffd166'],
    [-20, -48, '#6ee7f9'],
    [18, -52, '#e63946'],
    [-12, -64, '#ffd166'],
    [10, -70, '#6ee7f9'],
    [-6, -78, '#e63946'],
  ];
  ornaments.forEach(([ox, oy, color], index) => {
    parts.push(
      `<circle class="twinkle-light" cx="${ox}" cy="${oy}" r="2.6" fill="${color}" style="animation-delay:-${(
        index * 0.23
      ).toFixed(2)}s"/>`,
    );
  });
  return `<g transform="translate(${x} ${base})">${parts.join('')}</g>`;
}

function present(x: number, base: number, w: number, h: number, color: string, ribbon: string): string {
  return `<g transform="translate(${x} ${base})">${ellipse(0, 1, w * 0.6, 2, 'rgba(20,12,20,0.35)')}${rect(
    -w / 2,
    -h,
    w,
    h,
    color,
  )}${rect(-w / 2, -h, w, 2, shade(color, 0.2))}${rect(-1.5, -h, 3, h, ribbon)}${rect(
    -w / 2,
    -h / 2 - 1.5,
    w,
    3,
    ribbon,
  )}${rect(-6, -h - 4, 5, 4, ribbon)}${rect(1, -h - 4, 5, 4, ribbon)}</g>`;
}

function snowman(x: number, base: number, p: Palette): string {
  return `<g transform="translate(${x} ${base})">${ellipse(0, 1, 14, 3, p.shadow)}${circle(
    0,
    -8,
    9,
    '#f4faff',
  )}${circle(0, -22, 7, '#f4faff')}${circle(0, -33, 5.5, '#f4faff')}${rect(-6, -40, 12, 4, '#2a1a20')}${rect(
    -4,
    -46,
    8,
    6,
    '#2a1a20',
  )}${rect(-3, -43, 6, 2, '#e63946')}${circle(-2, -34, 1, '#2a1a20')}${circle(2, -34, 1, '#2a1a20')}${poly(
    [
      [0, -32],
      [5, -31],
      [0, -30],
    ],
    '#ff8c1a',
  )}${rect(-5, -27, 10, 2, '#e63946')}${rect(-2, -27, 4, 5, '#2a9d8f')}${circle(0, -18, 1, '#2a1a20')}${circle(
    0,
    -12,
    1,
    '#2a1a20',
  )}${line(-6, -20, -12, -14, '#5a3a22', 1.5)}${line(6, -20, 12, -14, '#5a3a22', 1.5)}</g>`;
}

function christmasGround(rng: Rng, p: Palette): string {
  const parts: string[] = [];
  parts.push(christmasTree(45, 468, p));
  parts.push(present(160, 468, 18, 14, '#e63946', '#ffd166'));
  parts.push(present(222, 468, 12, 10, '#2a9d8f', '#f4faff'));
  parts.push(snowman(842, 468, p));
  parts.push(present(905, 468, 20, 15, '#b45cff', '#ffd166'));
  // Snow patches along the verge.
  for (let i = 0; i < 18; i += 1) {
    const x = 20 + rng() * 920;
    const y = 456 + rng() * 12;
    parts.push(ellipse(x, y, 6 + rng() * 8, 2 + rng() * 2, '#f4faff', 'opacity="0.65"'));
  }
  return parts.join('');
}

// ---------------------------------------------------------------------------
// New Year
// ---------------------------------------------------------------------------

function newYearBackdrop(rng: Rng, p: Palette): string {
  const parts: string[] = [];
  const bursts: Array<[number, number, string, number]> = [
    [170, 110, '#ffd93d', 0],
    [420, 76, '#6ee7f9', 0.7],
    [690, 128, '#ff8fb0', 1.3],
    [870, 80, '#b388ff', 1.9],
    [300, 190, '#7bd389', 2.4],
  ];
  bursts.forEach(([x, y, color, delay]) => {
    parts.push(firework(x, y, color, delay, 0.8 + rng() * 0.5));
  });
  return parts.join('');
}

function firework(
  x: number,
  y: number,
  color: string,
  delay: number,
  scale: number,
): string {
  const rays: string[] = [];
  for (let i = 0; i < 12; i += 1) {
    const angle = (i / 12) * Math.PI * 2;
    rays.push(
      line(
        0,
        0,
        Math.cos(angle) * 24,
        Math.sin(angle) * 24,
        color,
        1.6,
        'opacity="0.9"',
      ),
    );
    rays.push(circle(Math.cos(angle) * 24, Math.sin(angle) * 24, 1.4, color));
  }
  return `<g transform="translate(${x} ${y}) scale(${scale})"><g class="holiday-firework" style="animation-delay:-${delay.toFixed(
    2,
  )}s">${rays.join('')}${circle(0, 0, 2.4, '#ffffff')}</g></g>`;
}

function newYearGround(rng: Rng, p: Palette, dateString: string): string {
  const parts: string[] = [];
  const date = parseDateString(dateString);
  const year = Number.isNaN(date.getTime())
    ? 2026
    : date.getUTCMonth() === 11
      ? date.getUTCFullYear() + 1
      : date.getUTCFullYear();
  const label = String(year);
  const labelX = 480 - pixelTextWidth(label, 3) / 2;
  parts.push(
    `<g transform="translate(${labelX} 424)" opacity="0.9">${pixelText(label, 0, 0, 3, '#ffd93d')}${pixelText(
      label,
      1,
      1,
      3,
      '#a87916',
      'opacity="0.5"',
    )}</g>`,
  );
  // Champagne glasses and streamers.
  const glasses: Array<[number, number]> = [
    [45, 468],
    [905, 468],
  ];
  glasses.forEach(([x, y], index) => {
    parts.push(`<g transform="translate(${x} ${y})">${poly(
      [
        [-5, -22],
        [5, -22],
        [3, -10],
        [-3, -10],
      ],
      '#d8f0ff',
      'opacity="0.8"',
    )}${rect(-0.8, -10, 1.6, 8, '#d8f0ff')}${rect(-4, -2, 8, 2, '#d8f0ff')}${circle(
      -2,
      -18,
      1,
      '#ffffff',
      'opacity="0.9"',
    )}${circle(2, -15, 0.8, '#ffffff', 'opacity="0.8"')}${rect(
      7,
      -26,
      2,
      26,
      '#ffd93d',
      `class="holiday-confetti" style="animation-delay:-${index * 0.4}s"`,
    )}</g>`);
  });
  for (let i = 0; i < 16; i += 1) {
    const x = 20 + rng() * 920;
    const y = 458 + rng() * 10;
    parts.push(
      rect(x, y, 3 + (i % 3), 2, ['#ffd93d', '#6ee7f9', '#ff8fb0', '#7bd389'][i % 4] ?? '#ffd93d', 'opacity="0.8"'),
    );
  }
  return parts.join('');
}

// ---------------------------------------------------------------------------
// Valentine's Day
// ---------------------------------------------------------------------------

function valentinesBackdrop(rng: Rng, p: Palette): string {
  const parts: string[] = [];
  const colors = ['#e63975', '#ff8fb0', '#ffc2d4'];
  for (let i = 0; i < 12; i += 1) {
    const x = 60 + rng() * 840;
    const y = 60 + rng() * 240;
    const scale = 0.6 + rng() * 1.1;
    parts.push(
      `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)})"><g class="heart-float" style="animation-delay:-${(
        i * 0.41
      ).toFixed(2)}s">${heartShape(0, 0, scale, colors[i % colors.length] ?? '#e63975', 'opacity="0.85"')}</g></g>`,
    );
  }
  // A pair of cupid-style hearts near the sun.
  parts.push(`<g transform="translate(700 96)">${heartShape(0, 0, 2.2, '#e63975', 'opacity="0.9"')}${line(
    -22,
    4,
    22,
    -4,
    '#e63975',
    1.4,
    'opacity="0.7"',
  )}</g>`);
  return parts.join('');
}

function heartBalloon(x: number, base: number, scale: number, color: string): string {
  return `<g transform="translate(${x} ${base})">${line(0, -4, 0, 22, '#7a4a62', 1)}${heartShape(
    0,
    -22,
    scale,
    color,
  )}${ellipse(-3, -26, 1.5, 3, '#ffffff', 'opacity="0.5"')}</g>`;
}

function valentinesGround(rng: Rng, p: Palette): string {
  const parts: string[] = [];
  parts.push(heartBalloon(45, 468, 1.7, '#e63975'));
  parts.push(heartBalloon(160, 468, 1.1, '#ff8fb0'));
  parts.push(heartBalloon(905, 468, 1.6, '#e63975'));
  parts.push(heartBalloon(842, 468, 1, '#ffc2d4'));
  // Rose bushes.
  const bushes: Array<[number, number]> = [
    [222, 468],
    [777, 468],
  ];
  bushes.forEach(([x, y]) => {
    parts.push(`<g transform="translate(${x} ${y})">${ellipse(0, -8, 15, 9, '#4a7a4a')}${circle(
      -7,
      -10,
      3,
      '#e63975',
    )}${circle(5, -13, 3, '#ff8fb0')}${circle(0, -6, 3, '#e63975')}${circle(9, -7, 2.5, '#ffc2d4')}</g>`);
  });
  // Scattered petals.
  for (let i = 0; i < 14; i += 1) {
    const x = 30 + rng() * 900;
    const y = 460 + rng() * 8;
    parts.push(heartShape(x, y, 0.35, '#ff8fb0', 'opacity="0.75"'));
  }
  return parts.join('');
}

// ---------------------------------------------------------------------------
// St. Patrick's Day
// ---------------------------------------------------------------------------

function stPatricksBackdrop(rng: Rng, p: Palette): string {
  const parts: string[] = [];
  const cx = 300;
  const cy = 330;
  const colors = ['#e63946', '#ff9f1c', '#ffd93d', '#2a9d4f', '#4a8fe0', '#8a4bff'];
  colors.forEach((color, index) => {
    const radius = 220 - index * 9;
    parts.push(
      `<path d="M${cx - radius} ${cy} A${radius} ${radius} 0 0 1 ${cx + radius} ${cy}" fill="none" stroke="${color}" stroke-width="7" opacity="0.55"/>`,
    );
  });
  for (let i = 0; i < 10; i += 1) {
    const x = 40 + rng() * 880;
    const y = 70 + rng() * 230;
    parts.push(
      `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)})"><g class="shamrock-float" style="animation-delay:-${(
        i * 0.37
      ).toFixed(2)}s">${shamrockShape(0, 0, 0.8 + rng() * 0.5, '#2a9d4f', 'opacity="0.8"')}</g></g>`,
    );
  }
  return parts.join('');
}

function potOfGold(x: number, base: number, p: Palette): string {
  return `<g transform="translate(${x} ${base})">${ellipse(0, 1, 16, 3, p.shadow)}${poly(
    [
      [-14, -16],
      [14, -16],
      [11, 0],
      [-11, 0],
    ],
    '#3a2a1a',
  )}${rect(-16, -20, 32, 5, '#5a3a22')}${ellipse(0, -20, 15, 4, '#ffd93d')}${circle(
    -6,
    -22,
    4,
    '#ffd93d',
  )}${circle(2, -24, 4, '#ffd93d')}${circle(8, -21, 3.5, '#ffd166')}${circle(-2, -20, 3.5, '#ffe066')}${circle(
    -7,
    -24,
    1.2,
    '#fff8d6',
  )}${circle(3, -26, 1.2, '#fff8d6')}</g>`;
}

function stPatricksGround(rng: Rng, p: Palette): string {
  const parts: string[] = [];
  parts.push(potOfGold(905, 468, p));
  // Shamrock clusters.
  const clusters: Array<[number, number]> = [
    [45, 468],
    [160, 468],
    [590, 468],
    [650, 468],
  ];
  clusters.forEach(([x, y], index) => {
    parts.push(
      `<g transform="translate(${x} ${y})">${shamrockShape(0, 0, 1 + (index % 2) * 0.35, '#2a9d4f')}${shamrockShape(
        12,
        3,
        0.7,
        '#4abf6a',
      )}</g>`,
    );
  });
  // A leprechaun hat.
  parts.push(`<g transform="translate(280 468)">${rect(-16, -6, 32, 6, '#1a6b34')}${rect(
    -11,
    -24,
    22,
    18,
    '#2a9d4f',
  )}${rect(-12, -8, 24, 3, '#ffd93d')}${rect(-1, -22, 2, 14, '#1a6b34')}</g>`);
  for (let i = 0; i < 12; i += 1) {
    const x = 30 + rng() * 900;
    const y = 460 + rng() * 8;
    parts.push(shamrockShape(x, y, 0.4, '#4abf6a', 'opacity="0.75"'));
  }
  return parts.join('');
}

// ---------------------------------------------------------------------------
// Easter
// ---------------------------------------------------------------------------

function easterBackdrop(rng: Rng, p: Palette): string {
  const parts: string[] = [];
  const colors = ['#ffb3c8', '#b07ae8', '#7adf8a', '#ffe066', '#8fd8e8'];
  for (let i = 0; i < 10; i += 1) {
    const x = 50 + rng() * 860;
    const y = 70 + rng() * 230;
    parts.push(
      `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)})"><g class="holiday-egg-float" style="animation-delay:-${(
        i * 0.43
      ).toFixed(2)}s">${eggShape(0, 0, 0.9 + rng() * 0.5, colors[i % colors.length] ?? '#ffb3c8', '#ffffff')}</g></g>`,
    );
  }
  // Bunting.
  const buntingColors = ['#ffb3c8', '#b07ae8', '#7adf8a', '#ffe066'];
  for (let i = 0; i < 14; i += 1) {
    const x = 60 + i * 64;
    const y = 120 + Math.sin(i * 0.7) * 8;
    parts.push(
      poly(
        [
          [x, y],
          [x + 18, y],
          [x + 9, y + 14],
        ],
        buntingColors[i % buntingColors.length] ?? '#ffb3c8',
        'opacity="0.8"',
      ),
    );
  }
  return parts.join('');
}

function easterBunny(x: number, base: number, p: Palette): string {
  return `<g transform="translate(${x} ${base})">${ellipse(0, 1, 12, 3, p.shadow)}${ellipse(
    0,
    -10,
    11,
    10,
    '#f4f0ff',
  )}${circle(0, -22, 7, '#f4f0ff')}${ellipse(-4, -32, 2.6, 8, '#f4f0ff')}${ellipse(
    4,
    -32,
    2.6,
    8,
    '#f4f0ff',
  )}${ellipse(-4, -32, 1.2, 5, '#ffb3c8')}${ellipse(4, -32, 1.2, 5, '#ffb3c8')}${circle(
    -2.5,
    -23,
    1,
    '#3a2a3a',
  )}${circle(2.5, -23, 1, '#3a2a3a')}${circle(0, -20, 1, '#ff8fb0')}${circle(0, -6, 3, '#ffb3c8')}</g>`;
}

function easterGround(rng: Rng, p: Palette): string {
  const parts: string[] = [];
  parts.push(easterBunny(842, 468, p));
  // A basket of eggs.
  parts.push(`<g transform="translate(45 468)">${poly(
    [
      [-16, -12],
      [16, -12],
      [12, 0],
      [-12, 0],
    ],
    '#c28450',
  )}${rect(-17, -14, 34, 3, '#9a6238')}${ellipse(-6, -16, 5, 6, '#ffb3c8')}${ellipse(
    5,
    -17,
    5,
    6,
    '#b07ae8',
  )}${ellipse(0, -21, 4, 5, '#7adf8a')}</g>`);
  const colors: Array<[string, string]> = [
    ['#ffb3c8', '#ffffff'],
    ['#b07ae8', '#ffe066'],
    ['#7adf8a', '#ffffff'],
    ['#ffe066', '#ffb3c8'],
    ['#8fd8e8', '#ffffff'],
  ];
  for (let i = 0; i < 18; i += 1) {
    const x = 30 + rng() * 900;
    const y = 458 + rng() * 9;
    const [color, stripe] = colors[i % colors.length] ?? colors[0]!;
    parts.push(eggShape(x, y, 0.5 + rng() * 0.35, color, stripe));
  }
  return parts.join('');
}

// ---------------------------------------------------------------------------
// Independence Day
// ---------------------------------------------------------------------------

function independenceBackdrop(rng: Rng, p: Palette): string {
  const parts: string[] = [];
  const bursts: Array<[number, number, string, number]> = [
    [180, 100, '#e63946', 0],
    [360, 64, '#f1faee', 0.6],
    [560, 120, '#4a8fe0', 1.2],
    [760, 78, '#e63946', 1.8],
    [900, 150, '#f1faee', 2.3],
  ];
  bursts.forEach(([x, y, color, delay]) => {
    parts.push(firework(x, y, color, delay, 0.75 + rng() * 0.5));
  });
  return parts.join('');
}

function independenceGround(rng: Rng, p: Palette): string {
  const parts: string[] = [];
  parts.push(flagShape(45, 468, 1.3, p));
  parts.push(flagShape(842, 468, 1.3, p));
  parts.push(flagShape(905, 468, 0.9, p));
  // Bunting along the front verge.
  const colors = ['#e63946', '#f1faee', '#4a8fe0'];
  for (let i = 0; i < 16; i += 1) {
    const x = 30 + i * 58;
    parts.push(
      poly(
        [
          [x, 458],
          [x + 14, 458],
          [x + 7, 466],
        ],
        colors[i % colors.length] ?? '#e63946',
        'opacity="0.8"',
      ),
    );
  }
  for (let i = 0; i < 10; i += 1) {
    const x = 30 + rng() * 900;
    const y = 462 + rng() * 6;
    parts.push(circle(x, y, 1.4, '#f1faee', 'opacity="0.75"'));
  }
  return parts.join('');
}

// ---------------------------------------------------------------------------
// Thanksgiving
// ---------------------------------------------------------------------------

function thanksgivingBackdrop(rng: Rng, p: Palette): string {
  const parts: string[] = [];
  const colors = ['#c0561f', '#e0a020', '#a86a2a', '#8a3a10', '#d9822b'];
  for (let i = 0; i < 14; i += 1) {
    const x = 40 + rng() * 880;
    const y = 60 + rng() * 250;
    parts.push(
      `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)})"><g class="holiday-leaf" style="animation-delay:-${(
        i * 0.53
      ).toFixed(2)}s">${leafShape(0, 0, 0.9 + rng() * 0.6, colors[i % colors.length] ?? '#c0561f', i % 2 === 0)}</g></g>`,
    );
  }
  return parts.join('');
}

function thanksgivingGround(rng: Rng, p: Palette): string {
  const parts: string[] = [];
  parts.push(jackOLantern(45, 468, 0.95, p));
  parts.push(jackOLantern(160, 468, 0.65, p));
  parts.push(jackOLantern(905, 468, 1.05, p));
  // Corn stalks.
  const stalk = (x: number, base: number): string =>
    `<g transform="translate(${x} ${base})">${rect(-1, -34, 2, 34, '#8a6a2a')}${poly(
      [
        [-1, -18],
        [-12, -26],
        [-2, -22],
      ],
      '#a89a4a',
    )}${poly(
      [
        [1, -22],
        [12, -30],
        [2, -26],
      ],
      '#a89a4a',
    )}${ellipse(-4, -30, 3, 7, '#ffd166')}${ellipse(4, -26, 3, 6, '#e0a020')}</g>`;
  parts.push(stalk(60, 468));
  parts.push(stalk(280, 468));
  parts.push(turkey(777, 468, p));
  for (let i = 0; i < 14; i += 1) {
    const x = 30 + rng() * 900;
    const y = 460 + rng() * 8;
    parts.push(leafShape(x, y, 0.4, ['#c0561f', '#e0a020', '#a86a2a'][i % 3] ?? '#c0561f', i % 2 === 0));
  }
  return parts.join('');
}

function turkey(x: number, base: number, p: Palette): string {
  const feathers = ['#c0561f', '#e0a020', '#a86a2a', '#8a3a10', '#d9822b'];
  const parts: string[] = [];
  feathers.forEach((color, index) => {
    const angle = -70 + index * 35;
    parts.push(
      `<g transform="rotate(${angle})">${ellipse(0, -18, 5, 14, color)}</g>`,
    );
  });
  parts.push(ellipse(0, -8, 12, 10, '#8a5a2a'));
  parts.push(ellipse(-2, -14, 6, 6, '#a86a2a'));
  parts.push(circle(6, -18, 4.5, '#8a5a2a'));
  parts.push(poly([[9, -20], [15, -18], [9, -16]], '#ffb347'));
  parts.push(circle(7, -19, 0.9, '#2a1a20'));
  parts.push(rect(-2, -1, 2, 4, '#ffb347'));
  parts.push(rect(3, -1, 2, 4, '#ffb347'));
  return `<g transform="translate(${x} ${base})">${ellipse(0, 1, 16, 3, p.shadow)}${parts.join('')}</g>`;
}
