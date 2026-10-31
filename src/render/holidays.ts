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

/**
 * `auto` picks only widely shared holidays, `all` also picks regional ones on
 * their dates, `none` disables themes, and an id forces that theme.
 */
export type HolidayOption = HolidayId | 'auto' | 'all' | 'none';

export interface HolidayDefinition {
  id: HolidayId;
  name: string;
  /**
   * Tied to one country or faith. Regional themes never appear with the
   * default `auto` option; users opt in with `all` or by id.
   */
  regional: boolean;
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
    regional: false,
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
    regional: false,
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
      nightOpacity: 0.22,
    },
    atmosphere: { color: '#ff8fb0', opacity: 0.08 },
  },
  {
    id: 'st-patricks',
    regional: true,
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
      nightOpacity: 0.18,
    },
    atmosphere: { color: '#2a9d4f', opacity: 0.05 },
  },
  {
    id: 'easter',
    regional: true,
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
      nightOpacity: 0.15,
    },
    atmosphere: { color: '#ffb3c8', opacity: 0.06 },
  },
  {
    id: 'independence',
    regional: true,
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
    regional: false,
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
    atmosphere: { color: '#5a1a6a', opacity: 0.14 },
  },
  {
    id: 'thanksgiving',
    regional: true,
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
      night: '#2a1008',
      nightOpacity: 0.3,
    },
    atmosphere: { color: '#e0a020', opacity: 0.07 },
  },
  {
    id: 'christmas',
    regional: false,
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
      grass: '#d8e6f0',
      grassLight: '#ffffff',
      grassDark: '#9ab4c8',
      dirt: '#b8cad8',
      dirtDark: '#8aa0b4',
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
  if (normalized === 'all') return 'all';
  if (normalized === 'none' || normalized === 'off') return 'none';
  if (isHolidayId(normalized)) return normalized;
  throw new Error(
    `Unknown holiday "${value}". Use auto, all, none, or one of: ${HOLIDAY_IDS.join(', ')}.`,
  );
}

/** Resolve a holiday option for a `YYYY-MM-DD` date. */
export function resolveHoliday(
  option: HolidayOption | undefined,
  dateString: string,
): HolidayDefinition | null {
  if (!option || option === 'auto') return holidayFor(dateString);
  if (option === 'all') return holidayFor(dateString, { includeRegional: true });
  if (option === 'none') return null;
  return HOLIDAYS.find((holiday) => holiday.id === option) ?? null;
}

/**
 * The holiday whose window contains the given `YYYY-MM-DD` date. Regional
 * holidays are skipped unless `includeRegional` is set.
 */
export function holidayFor(
  dateString: string,
  { includeRegional = false }: { includeRegional?: boolean } = {},
): HolidayDefinition | null {
  const date = parseDateString(dateString);
  if (Number.isNaN(date.getTime())) return null;
  const key = monthDay(date);
  for (const holiday of HOLIDAYS) {
    if (holiday.regional && !includeRegional) continue;
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
.holiday-fly{animation:holiday-fly 28s linear infinite}
.holiday-fog{animation:holiday-fog 14s ease-in-out infinite alternate}
.holiday-spider{animation:holiday-spider 5s ease-in-out infinite alternate}
.holiday-aurora{animation:holiday-aurora 7s ease-in-out infinite alternate}
.holiday-trail{animation:holiday-trail 3.2s ease-out infinite}
.holiday-coin{animation:holiday-confetti 7s linear infinite}
.holiday-flutter{transform-box:fill-box;transform-origin:center;animation:holiday-flutter .35s steps(2) infinite}
.holiday-hop{animation:holiday-hop 1.6s ease-in-out infinite}
.holiday-wave{transform-box:fill-box;transform-origin:left center;animation:holiday-wave 1.8s ease-in-out infinite alternate}
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
@keyframes holiday-fly{0%{transform:translateX(-640px)}100%{transform:translateX(980px)}}
@keyframes holiday-fog{from{transform:translateX(-26px)}to{transform:translateX(26px)}}
@keyframes holiday-spider{from{transform:translateY(0)}to{transform:translateY(-22px)}}
@keyframes holiday-aurora{from{opacity:.55;transform:translateX(-12px)}to{opacity:1;transform:translateX(12px)}}
@keyframes holiday-trail{0%{opacity:.9}20%{opacity:0}100%{opacity:0}}
@keyframes holiday-flutter{from{transform:scaleX(1)}to{transform:scaleX(.35)}}
@keyframes holiday-hop{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-6px)}}
@keyframes holiday-wave{from{transform:skewY(0)}to{transform:skewY(-6deg)}}
@media (prefers-reduced-motion: reduce){.bat,.ghost,.pumpkin-glow,.holiday-snow,.twinkle-light,.garland-bulb,.holiday-firework,.holiday-confetti,.heart-float,.holiday-petal,.shamrock-float,.holiday-sparkle,.holiday-leaf,.holiday-egg-float,.holiday-star,.holiday-fly,.holiday-fog,.holiday-spider,.holiday-aurora,.holiday-trail,.holiday-coin,.holiday-flutter,.holiday-hop,.holiday-wave{animation:none!important}}
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

/** Sky set pieces drawn behind the village. */
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

/** Ground cover drawn over the meadow, beneath buildings and monkeys. */
export function renderHolidayTerrain(holiday: HolidayDefinition, rng: Rng, p: Palette): string {
  switch (holiday.id) {
    case 'halloween':
      return scatter(rng, 26, 392, 462, (x, y, i) =>
        rect(x, y, 4 + (i % 3) * 2, 2, i % 2 === 0 ? '#3a2a4a' : '#2a3a28', 'opacity="0.55"'),
      );
    case 'christmas':
      return snowBlanket(rng);
    case 'new-year':
      return scatter(rng, 30, 392, 466, (x, y, i) =>
        rect(x, y, 3, 2, CONFETTI[i % CONFETTI.length] ?? '#ffd93d', 'opacity="0.7"'),
      );
    case 'valentines':
      return scatter(rng, 30, 392, 466, (x, y, i) =>
        heartShape(x, y, 0.3, ['#e63975', '#ff8fb0', '#ffffff'][i % 3] ?? '#ff8fb0', 'opacity="0.7"'),
      );
    case 'st-patricks':
      return scatter(rng, 46, 390, 466, (x, y, i) =>
        shamrockShape(x, y, 0.45 + (i % 3) * 0.12, i % 4 === 0 ? '#7ae08a' : '#2a9d4f', 'opacity="0.85"'),
      );
    case 'easter':
      return scatter(rng, 44, 390, 466, (x, y, i) => tulip(x, y, EASTER_COLORS[i % EASTER_COLORS.length] ?? '#ffb3c8'));
    case 'independence':
      return scatter(rng, 20, 392, 466, (x, y, i) =>
        circle(x, y, 1.2, ['#e63946', '#f1faee', '#4a8fe0'][i % 3] ?? '#f1faee', 'opacity="0.7"'),
      );
    case 'thanksgiving':
      return scatter(rng, 54, 390, 468, (x, y, i) =>
        leafShape(x, y, 0.45 + (i % 3) * 0.15, AUTUMN[i % AUTUMN.length] ?? '#c0561f', i % 2 === 0),
      );
  }
  return '';
}

/** Props standing in the gaps between buildings. */
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
      return newYearGround(rng, p);
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
  void dateString;
  return '';
}

/** Particles and tint drawn above the night overlay. */
export function renderHolidayOverlay(
  holiday: HolidayDefinition,
  rng: Rng,
  p: Palette,
  dateString: string,
): string {
  const tint = rect(0, 0, 960, 500, holiday.atmosphere.color, `opacity="${holiday.atmosphere.opacity}"`);
  switch (holiday.id) {
    case 'halloween':
      return `${tint}${groundFog('#b8a8e8', 0.1)}${fallingParticles(rng, 14, 'holiday-leaf', ['#ff7518', '#b45cff', '#7dff6b'], (color) =>
        rect(-2, -2, 4, 4, color, 'opacity="0.75"'),
      )}`;
    case 'christmas':
      return `${tint}${stringLights()}${fallingParticles(rng, 80, 'holiday-snow', ['#ffffff', '#eaf6ff', '#d8ecff'], (color, i) =>
        i % 9 === 0 ? snowflake(color) : rect(-(i % 2), -(i % 2), 2 + (i % 2), 2 + (i % 2), color, 'opacity="0.9"'),
      )}`;
    case 'new-year':
      return `${tint}${yearBanner(dateString)}${fallingParticles(rng, 56, 'holiday-confetti', CONFETTI, (color, i) =>
        i % 5 === 0
          ? rect(-1, -4, 2, 8, color, `transform="rotate(${(i * 53) % 180})"`)
          : rect(-1.5, -3, 3, 6, color, `transform="rotate(${(i * 37) % 90})"`),
      )}`;
    case 'valentines':
      return `${tint}${fallingParticles(rng, 26, 'holiday-petal', ['#e63975', '#ff8fb0', '#ffc2d4'], (color, i) =>
        i % 3 === 0 ? ellipse(0, 0, 2.4, 1.4, color, 'opacity="0.85"') : heartShape(0, 0, 0.55, color, 'opacity="0.85"'),
      )}`;
    case 'st-patricks':
      return `${tint}${irishBunting()}${fallingParticles(rng, 20, 'holiday-coin', ['#ffd93d', '#ffe066', '#e0b020'], (color) =>
        `${ellipse(0, 0, 2.6, 2.6, color)}${rect(-0.6, -1.6, 1.2, 3.2, '#fff3a8', 'opacity="0.8"')}`,
      )}`;
    case 'easter':
      return `${tint}${pastelBunting()}${fallingParticles(rng, 26, 'holiday-petal', EASTER_COLORS, (color) =>
        circle(0, 0, 2, color, 'opacity="0.85"'),
      )}`;
    case 'independence':
      return `${tint}${starSpangledSwags()}${fallingParticles(rng, 24, 'holiday-sparkle', ['#e63946', '#f1faee', '#4a8fe0'], (color, i) =>
        i % 3 === 1 ? star(0, 0, 3, color) : circle(0, 0, 1.6, color, 'opacity="0.9"'),
      )}`;
    case 'thanksgiving':
      return `${tint}${fallingParticles(rng, 26, 'holiday-leaf', AUTUMN, (color, i) => leafShape(0, 0, 1, color, i % 2 === 0))}`;
  }
  void p;
  return tint;
}

/** Small icon drawn beside the greeting in the scene header. */
export function holidayEmblem(holiday: HolidayDefinition, x: number, y: number): string {
  let icon = '';
  switch (holiday.id) {
    case 'halloween':
      icon = `${ellipse(0, 1, 7, 6, '#ff8c1a')}${ellipse(-3, 1, 3, 6, '#c2560a', 'opacity="0.5"')}${ellipse(
        3,
        1,
        3,
        6,
        '#c2560a',
        'opacity="0.5"',
      )}${rect(-1, -7, 2, 3, '#3f7a3a')}${poly(
        [
          [-4, -1],
          [-1, -1],
          [-2.5, 1.5],
        ],
        INK,
      )}${poly(
        [
          [4, -1],
          [1, -1],
          [2.5, 1.5],
        ],
        INK,
      )}${rect(-3, 3, 6, 1.5, INK)}`;
      break;
    case 'christmas':
      icon = `${poly(
        [
          [-7, 6],
          [7, 6],
          [0, -8],
        ],
        '#2a6f47',
      )}${rect(-1.5, 6, 3, 2, '#5a3a22')}${star(0, -8, 3, '#ffd166')}${circle(-3, 2, 1.2, '#e63946')}${circle(
        2.5,
        -1,
        1.2,
        '#6ee7f9',
      )}`;
      break;
    case 'new-year':
      icon = `${star(0, 0, 8, '#ffd93d')}${circle(0, 0, 2, '#ffffff')}`;
      break;
    case 'valentines':
      icon = heartShape(0, 3, 0.8, '#e63975');
      break;
    case 'st-patricks':
      icon = shamrockShape(0, 0, 1.1, '#2a9d4f');
      break;
    case 'easter':
      icon = eggShape(0, 0, 1.05, '#b07ae8', '#ffe066');
      break;
    case 'independence':
      icon = `${star(0, 0, 8, '#f1faee')}${star(0, 0, 4.5, '#e63946')}`;
      break;
    case 'thanksgiving':
      icon = leafShape(0, 1, 1.3, '#c0561f', false);
      break;
  }
  return `<g transform="translate(${x} ${y})">${icon}</g>`;
}

// ---------------------------------------------------------------------------
// Shared art
// ---------------------------------------------------------------------------

const CONFETTI = ['#ffd93d', '#6ee7f9', '#ff8fb0', '#7bd389', '#b388ff'] as const;
const EASTER_COLORS = ['#ffb3c8', '#b07ae8', '#7adf8a', '#ffe066', '#8fd8e8'] as const;
const AUTUMN = ['#c0561f', '#e0a020', '#a86a2a', '#8a3a10', '#d9822b'] as const;

function scatter(
  rng: Rng,
  count: number,
  top: number,
  bottom: number,
  shape: (x: number, y: number, index: number) => string,
): string {
  const parts: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const x = Math.round(8 + rng() * 944);
    const y = Math.round(top + rng() * (bottom - top));
    parts.push(shape(x, y, i));
  }
  return parts.join('');
}

function star(x: number, y: number, r: number, color: string, extra = ''): string {
  const points: Array<[number, number]> = [];
  for (let i = 0; i < 10; i += 1) {
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    const radius = i % 2 === 0 ? r : r * 0.45;
    points.push([x + Math.cos(angle) * radius, y + Math.sin(angle) * radius]);
  }
  return poly(points, color, extra);
}

function leafShape(x: number, y: number, scale: number, color: string, flip: boolean): string {
  const direction = flip ? -1 : 1;
  return `<g transform="translate(${x} ${y}) scale(${scale * direction} ${scale})">${path(
    'M0 4 C-6 2 -7 -4 0 -7 C7 -4 6 2 0 4 Z',
    color,
    'opacity="0.9"',
  )}${line(0, 4, 0, -6, shade(color, -0.25), 0.6)}</g>`;
}

/** Points along a sagging string between two anchors. */
function swag(x1: number, x2: number, top: number, sag: number, steps: number): Array<[number, number]> {
  const points: Array<[number, number]> = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    points.push([x1 + (x2 - x1) * t, top + Math.sin(t * Math.PI) * sag]);
  }
  return points;
}

/** Scalloped strings hung along the top edge of the scene. */
function topEdgeStrings(
  sag: number,
  stringColor: string,
  ornament: (x: number, y: number, index: number) => string,
  perSwag = 5,
): string {
  const parts: string[] = [];
  const width = 120;
  let index = 0;
  for (let x = 0; x < 960; x += width) {
    const points = swag(x, x + width, 0, sag, perSwag + 1);
    parts.push(
      `<polyline points="${points.map(([px, py]) => `${px.toFixed(1)},${py.toFixed(1)}`).join(' ')}" fill="none" stroke="${stringColor}" stroke-width="1.4"/>`,
    );
    points.slice(1, -1).forEach(([px, py]) => {
      parts.push(ornament(px, py, index));
      index += 1;
    });
  }
  return `<g class="holiday-strings">${parts.join('')}</g>`;
}

function groundFog(color: string, opacity: number): string {
  const banks: Array<[number, number, number, number]> = [
    [120, 490, 150, 9],
    [430, 494, 190, 8],
    [760, 488, 170, 10],
    [300, 482, 110, 6],
    [620, 492, 140, 7],
  ];
  return banks
    .map(
      ([x, y, rx, ry], index) =>
        `<g class="holiday-fog" style="animation-delay:-${(index * 2.7).toFixed(1)}s">${ellipse(
          x,
          y,
          rx,
          ry,
          color,
          `opacity="${opacity}"`,
        )}${ellipse(x + rx * 0.4, y - ry * 0.5, rx * 0.6, ry * 0.8, color, `opacity="${(opacity * 0.8).toFixed(2)}"`)}</g>`,
    )
    .join('');
}

/** Something that drifts across the sky; rests at (x, y) without CSS. */
function flier(x: number, y: number, content: string, duration: number, delay: number): string {
  return `<g transform="translate(${x} ${y})"><g class="holiday-fly" style="animation-duration:${duration}s;animation-delay:-${delay}s">${content}</g></g>`;
}

// ---------------------------------------------------------------------------
// Halloween
// ---------------------------------------------------------------------------

function halloweenBackdrop(rng: Rng, p: Palette): string {
  const parts: string[] = [];
  parts.push(harvestMoon(176, 178));
  parts.push(flier(150, 172, witch(), 26, 3));
  parts.push(spiderWeb());
  const bats: Array<[number, number]> = [
    [120, 96],
    [264, 112],
    [330, 150],
    [520, 82],
    [642, 112],
    [758, 64],
    [860, 142],
    [410, 54],
    [230, 220],
  ];
  bats.forEach(([x, y], index) => {
    parts.push(bat(x, y, 0.75 + rng() * 0.5, p.outline, index * 0.31));
  });
  const ghosts: Array<[number, number, number]> = [
    [470, 180, 1.2],
    [690, 200, 0.9],
    [580, 128, 0.75],
  ];
  ghosts.forEach(([x, y, scale], index) => {
    parts.push(ghost(x, y, scale, index * 0.9));
  });
  return parts.join('');
}

function harvestMoon(x: number, y: number): string {
  return `<g transform="translate(${x} ${y})">${circle(0, 0, 112, '#ffb347', 'opacity="0.06"')}${circle(
    0,
    0,
    86,
    '#ffb347',
    'opacity="0.1"',
  )}${circle(0, 0, 66, '#ffc874', 'opacity="0.18"')}${circle(0, 0, 56, '#ffe2a0')}${circle(
    8,
    6,
    52,
    '#ffcf7a',
    'opacity="0.55"',
  )}${circle(-18, -14, 9, '#e8b468', 'opacity="0.6"')}${circle(14, -22, 6, '#e8b468', 'opacity="0.5"')}${circle(
    22,
    16,
    11,
    '#e8b468',
    'opacity="0.5"',
  )}${circle(-10, 24, 5, '#e8b468', 'opacity="0.45"')}${circle(-30, 8, 4, '#e8b468', 'opacity="0.4"')}</g>`;
}

function witch(): string {
  const ink = INK;
  return `<g transform="scale(1.3)">${line(-30, 6, 18, -2, '#4a2a1a', 2.2)}${poly(
    [
      [-30, 6],
      [-42, 0],
      [-44, 8],
      [-40, 14],
    ],
    '#7a5a2a',
  )}${line(-40, 2, -32, 6, '#4a3a1a', 0.8)}${line(-41, 9, -32, 7, '#4a3a1a', 0.8)}${poly(
    [
      [-14, 4],
      [2, 4],
      [-2, -10],
      [-10, -10],
    ],
    ink,
  )}${poly(
    [
      [-14, 4],
      [-26, 2],
      [-20, -4],
    ],
    ink,
  )}${circle(-6, -14, 5, ink)}${poly(
    [
      [-13, -17],
      [1, -17],
      [-3, -21],
      [-4, -32],
      [-8, -21],
    ],
    ink,
  )}${path('M-4 -2 Q4 -6 6 -12 Q8 -16 5 -16', 'none', `stroke="${ink}" stroke-width="1.6"`)}${rect(
    -6,
    4,
    3,
    5,
    ink,
  )}${rect(-11, -10, 4, 1, '#ff7518')}</g>`;
}

function spiderWeb(): string {
  const parts: string[] = [];
  const color = '#d8d0f0';
  const radius = 54;
  for (let i = 0; i <= 4; i += 1) {
    const angle = (i / 4) * (Math.PI / 2);
    parts.push(line(0, 0, Math.cos(angle) * radius, Math.sin(angle) * radius, color, 0.8, 'opacity="0.5"'));
  }
  for (let ring = 1; ring <= 4; ring += 1) {
    const r = ring * 12;
    const points: string[] = [];
    for (let i = 0; i <= 4; i += 1) {
      const angle = (i / 4) * (Math.PI / 2);
      points.push(`${(Math.cos(angle) * r).toFixed(1)},${(Math.sin(angle) * r).toFixed(1)}`);
    }
    parts.push(`<polyline points="${points.join(' ')}" fill="none" stroke="${color}" stroke-width="0.7" opacity="0.45"/>`);
  }
  const spider = `<g class="holiday-spider">${line(0, 0, 0, 64, color, 0.6, 'opacity="0.6"')}${ellipse(
    0,
    68,
    3.4,
    4,
    INK,
  )}${circle(0, 63, 2.4, INK)}${line(-6, 64, 6, 72, INK, 0.9)}${line(6, 64, -6, 72, INK, 0.9)}${line(
    -6,
    68,
    6,
    68,
    INK,
    0.9,
  )}${rect(-1.2, 62.4, 0.8, 0.8, '#ff4040')}${rect(0.4, 62.4, 0.8, 0.8, '#ff4040')}</g>`;
  return `<g transform="translate(940 0) scale(-1 1)">${parts.join('')}</g><g transform="translate(922 0)">${spider}</g>`;
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
  )}${rect(-1.6, -1.5, 1, 1.4, '#ffcc4d')}${rect(0.6, -1.5, 1, 1.4, '#ffcc4d')}</g></g>`;
}

function ghost(x: number, y: number, scale: number, delay: number): string {
  return `<g transform="translate(${x} ${y}) scale(${scale})"><g class="ghost" style="animation-delay:-${delay.toFixed(
    2,
  )}s">${ellipse(0, 0, 16, 16, '#eef0ff', 'opacity="0.12"')}${path(
    'M-9 6 Q-9 -9 0 -9 Q9 -9 9 6 L6 3 L3 6 L0 3 L-3 6 L-6 3 Z',
    '#eef0ff',
    'opacity="0.85"',
  )}${rect(-4, -3, 2, 3, '#2a1a3a')}${rect(2, -3, 2, 3, '#2a1a3a')}${ellipse(0, 2, 1.6, 2, '#2a1a3a')}</g></g>`;
}

function jackOLantern(x: number, base: number, scale: number, p: Palette): string {
  const orange = '#ff8c1a';
  const dark = '#c2560a';
  const ink = '#2a0f08';
  return `<g transform="translate(${x} ${base}) scale(${scale})">${ellipse(0, 1, 17, 3, p.shadow)}${circle(
    0,
    -13,
    20,
    '#ffb347',
    'opacity="0.14"',
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
  )}<g class="pumpkin-glow">${poly(
    [
      [-9, -14],
      [-6, -14],
      [-7.5, -11],
    ],
    '#ffd166',
  )}${poly(
    [
      [6, -14],
      [9, -14],
      [7.5, -11],
    ],
    '#ffd166',
  )}${rect(-6, -6, 12, 2, '#ffd166', 'opacity="0.8"')}</g></g>`;
}

function tombstone(x: number, base: number, scale: number, p: Palette): string {
  const stone = '#7a7488';
  return `<g transform="translate(${x} ${base}) scale(${scale})">${ellipse(0, 1, 13, 3, p.shadow)}${path(
    'M-9 0 L-9 -16 Q-9 -26 0 -26 Q9 -26 9 -16 L9 0 Z',
    stone,
  )}${path('M-9 0 L-9 -16 Q-9 -26 0 -26 L0 0 Z', '#8e88a0', 'opacity="0.6"')}${pixelText(
    'RIP',
    -6,
    -18,
    1,
    '#3a3448',
  )}${rect(-6, -9, 12, 1, '#3a3448', 'opacity="0.5"')}${rect(-6, -6, 9, 1, '#3a3448', 'opacity="0.5"')}${rect(
    -10,
    -2,
    5,
    2,
    '#3f5a3a',
  )}${rect(5, -2, 6, 2, '#3f5a3a')}</g>`;
}

function halloweenGround(rng: Rng, p: Palette): string {
  const parts: string[] = [];
  parts.push(tombstone(222, 468, 1, p));
  parts.push(tombstone(650, 468, 0.85, p));
  parts.push(jackOLantern(160, 468, 1.05, p));
  parts.push(jackOLantern(590, 468, 0.85, p));
  parts.push(jackOLantern(842, 468, 1.15, p));
  parts.push(jackOLantern(952, 468, 0.7, p));
  // Candy corn.
  for (let i = 0; i < 12; i += 1) {
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
        '#ff7518',
      )}${rect(-0.6, -8, 1.2, 1.6, '#fff8e8')}</g>`,
    );
  }
  // A bare, spooky tree with glowing eyes in its hollow.
  const bark = '#2a1a20';
  parts.push(`<g transform="translate(742 468)">${rect(-4, -40, 8, 40, bark)}${line(-2, -32, -20, -54, bark, 3)}${line(
    2,
    -28,
    20,
    -50,
    bark,
    3,
  )}${line(-12, -44, -26, -42, bark, 2)}${line(12, -42, 26, -40, bark, 2)}${line(0, -38, 4, -60, bark, 2.5)}${ellipse(
    0,
    -22,
    3,
    4,
    '#0a0410',
  )}${rect(-2, -23, 1, 1, '#ffd166')}${rect(1, -23, 1, 1, '#ffd166')}${circle(-20, -55, 2, '#b45cff', 'opacity="0.8"')}${circle(
    20,
    -51,
    2,
    '#7dff6b',
    'opacity="0.7"',
  )}</g>`);
  // Wrought-iron fence along the far verge.
  const fence: string[] = [rect(0, 452, 960, 1.5, '#1a1020', 'opacity="0.5"')];
  for (let x = 4; x < 960; x += 9) {
    fence.push(rect(x, 444, 1.5, 12, '#1a1020', 'opacity="0.5"'));
    fence.push(poly([[x - 1, 444], [x + 2.5, 444], [x + 0.75, 441]], '#1a1020', 'opacity="0.5"'));
  }
  return `${fence.join('')}${parts.join('')}`;
}

// ---------------------------------------------------------------------------
// Christmas
// ---------------------------------------------------------------------------

function christmasBackdrop(rng: Rng, p: Palette): string {
  const parts: string[] = [];
  parts.push(aurora());
  // North star.
  parts.push(`<g transform="translate(560 82)"><g class="holiday-star">${circle(0, 0, 22, '#fff3a8', 'opacity="0.12"')}${poly(
    [
      [0, -18],
      [4, -4],
      [16, 0],
      [4, 4],
      [0, 24],
      [-4, 4],
      [-16, 0],
      [-4, -4],
    ],
    '#fff3a8',
  )}${circle(0, 0, 5, '#ffffff', 'opacity="0.95"')}</g></g>`);
  parts.push(flier(380, 150, `<g transform="scale(1.5)">${sleigh()}</g>`, 30, 5));
  parts.push(ellipse(180, 96, 46, 15, p.cloud, 'opacity="0.5"'));
  parts.push(ellipse(206, 88, 30, 13, p.cloud, 'opacity="0.55"'));
  parts.push(ellipse(152, 90, 24, 11, p.cloudShade, 'opacity="0.45"'));
  void rng;
  return parts.join('');
}

function aurora(): string {
  const bands: Array<[string, string, number, number]> = [
    ['M-20 150 C120 70 260 190 420 110 S720 60 980 140', '#5cffc0', 34, 0],
    ['M-20 120 C160 170 300 60 480 130 S760 170 980 90', '#6ee7f9', 22, 1.6],
    ['M-20 180 C140 120 340 210 520 150 S820 110 980 170', '#b388ff', 18, 3.1],
  ];
  return bands
    .map(
      ([d, color, width, delay]) =>
        `<g class="holiday-aurora" style="animation-delay:-${delay}s">${path(
          d,
          'none',
          `stroke="${color}" stroke-width="${width}" opacity="0.12" stroke-linecap="round"`,
        )}${path(d, 'none', `stroke="${color}" stroke-width="${Math.round(width / 4)}" opacity="0.22" stroke-linecap="round"`)}</g>`,
    )
    .join('');
}

function sleigh(): string {
  const ink = '#1a2436';
  const deer = (x: number, nose: string): string =>
    `<g transform="translate(${x} 0)">${rect(-6, -4, 12, 5, ink)}${rect(4, -9, 4, 6, ink)}${rect(6, -11, 5, 3, ink)}${rect(
      -5,
      1,
      1.5,
      5,
      ink,
    )}${rect(4, 1, 1.5, 5, ink)}${line(5, -11, 3, -16, ink, 1)}${line(7, -11, 9, -16, ink, 1)}${line(4, -14, 2, -15, ink, 1)}${circle(
      11.5,
      -9.5,
      1.4,
      nose,
    )}</g>`;
  const reins = line(-12, -6, 70, -6, '#c8a050', 0.6);
  return `${reins}${deer(30, ink)}${deer(52, ink)}${deer(74, '#ff3344')}${circle(85.5, -9.5, 4, '#ff3344', 'opacity="0.3"')}${path(
    'M-30 2 L-8 2 L-6 -8 L-22 -8 Q-30 -8 -30 -2 Z',
    '#c0282e',
  )}${path('M-34 6 L-4 6 Q0 6 0 2', 'none', 'stroke="#ffd166" stroke-width="1.4"')}${rect(-26, -14, 10, 7, '#7a4a26')}${rect(
    -16,
    -16,
    7,
    9,
    '#d62839',
  )}${circle(-12.5, -18, 3, '#bd7f45')}${rect(-16, -22, 7, 3, '#d62839')}${rect(-16, -19, 7, 1, '#f4faff')}${circle(
    -10,
    -23,
    1.4,
    '#f4faff',
  )}`;
}

function christmasTree(x: number, base: number, p: Palette): string {
  const greens = ['#1e5a3a', '#2a6f47', '#358a56', '#40a366'];
  const tiers = [
    [-30, -14, -50],
    [-25, -32, -66],
    [-19, -49, -82],
    [-13, -64, -96],
  ];
  const parts: string[] = [];
  parts.push(ellipse(0, 1, 28, 4, p.shadow));
  parts.push(rect(-5, -18, 10, 18, '#5a3a22'));
  tiers.forEach((tier, index) => {
    const [left, top, peak] = tier as [number, number, number];
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
          [left, top],
          [-left, top],
          [-left - 4, top - 3],
          [left + 4, top - 3],
        ],
        '#f4faff',
        'opacity="0.85"',
      ),
    );
  });
  // Tinsel.
  parts.push(line(-22, -24, 18, -40, '#ffd166', 1.2, 'opacity="0.8"'));
  parts.push(line(-16, -44, 14, -58, '#ffd166', 1.2, 'opacity="0.8"'));
  parts.push(`<g class="holiday-star">${circle(0, -105, 9, '#fff3a8', 'opacity="0.25"')}${star(0, -105, 9, '#ffd166')}</g>`);
  const ornaments: Array<[number, number, string]> = [
    [-16, -22, '#e63946'],
    [14, -26, '#ffd166'],
    [-20, -40, '#6ee7f9'],
    [18, -44, '#e63946'],
    [-10, -56, '#ffd166'],
    [10, -62, '#6ee7f9'],
    [-6, -76, '#e63946'],
    [5, -84, '#ffd166'],
  ];
  ornaments.forEach(([ox, oy, color], index) => {
    parts.push(
      `<circle class="twinkle-light" cx="${ox}" cy="${oy}" r="2.8" fill="${color}" style="animation-delay:-${(
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
  )}${rect(-w / 2, -h, w, 2, shade(color, 0.2))}${rect(w / 2 - 3, -h, 3, h, shade(color, -0.2))}${rect(
    -1.5,
    -h,
    3,
    h,
    ribbon,
  )}${rect(-w / 2, -h / 2 - 1.5, w, 3, ribbon)}${poly(
    [
      [0, -h],
      [-7, -h - 5],
      [-6, -h],
    ],
    ribbon,
  )}${poly(
    [
      [0, -h],
      [7, -h - 5],
      [6, -h],
    ],
    ribbon,
  )}</g>`;
}

function snowman(x: number, base: number, p: Palette): string {
  return `<g transform="translate(${x} ${base})">${ellipse(0, 1, 14, 3, p.shadow)}${circle(
    0,
    -8,
    9,
    '#f4faff',
  )}${circle(0, -22, 7, '#f4faff')}${circle(0, -33, 5.5, '#f4faff')}${circle(3, -6, 7, '#c8dce8', 'opacity="0.5"')}${rect(
    -6,
    -40,
    12,
    2,
    '#2a1a20',
  )}${rect(-4, -48, 8, 8, '#2a1a20')}${rect(-4, -43, 8, 2, '#e63946')}${circle(-2, -34, 1, '#2a1a20')}${circle(
    2,
    -34,
    1,
    '#2a1a20',
  )}${poly(
    [
      [0, -32],
      [6, -31],
      [0, -30],
    ],
    '#ff8c1a',
  )}${rect(-6, -27, 12, 3, '#e63946')}${rect(2, -27, 3, 8, '#e63946')}${rect(2, -21, 3, 1, '#ffd166')}${circle(
    0,
    -18,
    1,
    '#2a1a20',
  )}${circle(0, -12, 1, '#2a1a20')}${line(-6, -20, -14, -26, '#5a3a22', 1.5)}${line(6, -20, 14, -26, '#5a3a22', 1.5)}${line(
    -12,
    -24,
    -14,
    -22,
    '#5a3a22',
    1,
  )}</g>`;
}

function snowBlanket(rng: Rng): string {
  const parts: string[] = [];
  // A soft, lumpy crust along the horizon.
  for (let x = -10; x < 970; x += 22) {
    parts.push(ellipse(x, 384, 16 + rng() * 8, 5 + rng() * 3, '#ffffff', 'opacity="0.95"'));
  }
  for (let i = 0; i < 34; i += 1) {
    const x = 10 + rng() * 940;
    const y = 396 + rng() * 64;
    parts.push(ellipse(x, y, 10 + rng() * 18, 2 + rng() * 3, '#ffffff', 'opacity="0.6"'));
    parts.push(ellipse(x + 3, y + 1.5, 8 + rng() * 10, 1.4, '#b8cad8', 'opacity="0.5"'));
  }
  return parts.join('');
}

function snowflake(color: string): string {
  return `${line(-3, 0, 3, 0, color, 0.8)}${line(0, -3, 0, 3, color, 0.8)}${line(-2, -2, 2, 2, color, 0.8)}${line(
    -2,
    2,
    2,
    -2,
    color,
    0.8,
  )}`;
}

function stringLights(): string {
  const colors = ['#e63946', '#ffd166', '#2a9d8f', '#6ee7f9', '#ff8fb0'];
  return topEdgeStrings(12, '#1e3a2a', (x, y, index) => {
    const color = colors[index % colors.length] ?? '#ffd166';
    return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)})">${rect(-1, 0, 2, 3, '#1e3a2a')}<g class="garland-bulb" style="animation-delay:-${(
      (index * 0.37) %
      2.4
    ).toFixed(2)}s">${circle(0, 6, 6, color, 'opacity="0.22"')}${ellipse(0, 6, 2.4, 3.4, color)}</g></g>`;
  });
}

function christmasGround(rng: Rng, p: Palette): string {
  const parts: string[] = [];
  parts.push(christmasTree(45, 468, p));
  parts.push(present(150, 468, 18, 14, '#e63946', '#ffd166'));
  parts.push(present(172, 468, 12, 10, '#2a9d8f', '#f4faff'));
  parts.push(present(226, 468, 14, 18, '#ffd166', '#e63946'));
  parts.push(snowman(842, 468, p));
  parts.push(present(905, 468, 20, 15, '#b45cff', '#ffd166'));
  parts.push(present(925, 468, 11, 9, '#e63946', '#f4faff'));
  // Candy canes.
  [596, 660, 780].forEach((x) => {
    parts.push(
      `<g transform="translate(${x} 468)">${path('M0 0 L0 -18 Q0 -24 5 -24 Q10 -24 10 -18', 'none', 'stroke="#f4faff" stroke-width="3"')}${path(
        'M0 -2 L0 -6 M0 -10 L0 -14 M1 -20 L3 -23 M7 -23.5 L9.5 -20',
        'none',
        'stroke="#e63946" stroke-width="3.2"',
      )}</g>`,
    );
  });
  void rng;
  return parts.join('');
}

// ---------------------------------------------------------------------------
// New Year
// ---------------------------------------------------------------------------

type BurstStyle = 'peony' | 'ring' | 'willow' | 'crossette';

function newYearBackdrop(rng: Rng, p: Palette): string {
  const bursts: Array<[number, number, string, string, number, BurstStyle]> = [
    [150, 112, '#ffd93d', '#ffffff', 0, 'peony'],
    [420, 210, '#6ee7f9', '#ffffff', 0.7, 'ring'],
    [690, 150, '#ff8fb0', '#ffd93d', 1.3, 'willow'],
    [880, 92, '#b388ff', '#6ee7f9', 1.9, 'crossette'],
    [290, 230, '#7bd389', '#ffd93d', 2.4, 'ring'],
    [600, 70, '#ffd93d', '#ff8fb0', 2.9, 'peony'],
  ];
  void p;
  return bursts
    .map(([x, y, color, core, delay, style]) => `${rocketTrail(x, y, color, delay)}${firework(x, y, color, core, delay, 1.05 + rng() * 0.6, style)}`)
    .join('');
}

function rocketTrail(x: number, y: number, color: string, delay: number): string {
  return `<g class="holiday-trail" style="animation-delay:-${delay.toFixed(2)}s">${line(
    x,
    y + 18,
    x - 4,
    y + 120,
    color,
    1.2,
    'opacity="0.35" stroke-dasharray="3 4"',
  )}</g>`;
}

function firework(
  x: number,
  y: number,
  color: string,
  core: string,
  delay: number,
  scale: number,
  style: BurstStyle = 'peony',
): string {
  const parts: string[] = [circle(0, 0, 30, color, 'opacity="0.08"')];
  const rays = style === 'ring' ? 18 : 14;
  for (let i = 0; i < rays; i += 1) {
    const angle = (i / rays) * Math.PI * 2;
    const cx = Math.cos(angle);
    const cy = Math.sin(angle);
    if (style === 'ring') {
      parts.push(circle(cx * 24, cy * 24, 1.7, color));
      parts.push(circle(cx * 14, cy * 14, 1.1, core, 'opacity="0.8"'));
    } else if (style === 'willow') {
      const ex = cx * 22;
      const ey = cy * 22;
      parts.push(path(`M0 0 Q${(ex * 1.1).toFixed(1)} ${(ey * 0.8).toFixed(1)} ${ex.toFixed(1)} ${(ey + 16).toFixed(1)}`, 'none', `stroke="${color}" stroke-width="1.2" opacity="0.85"`));
      parts.push(circle(ex, ey + 16, 1.2, core));
    } else if (style === 'crossette') {
      parts.push(line(0, 0, cx * 18, cy * 18, color, 1.4, 'opacity="0.9"'));
      if (i % 2 === 0) {
        parts.push(line(cx * 18, cy * 18, cx * 18 + cy * 6, cy * 18 - cx * 6, core, 1));
        parts.push(line(cx * 18, cy * 18, cx * 18 - cy * 6, cy * 18 + cx * 6, core, 1));
      }
    } else {
      parts.push(line(cx * 6, cy * 6, cx * 24, cy * 24, color, 1.6, 'opacity="0.9"'));
      parts.push(circle(cx * 27, cy * 27, 1.5, core));
    }
  }
  parts.push(circle(0, 0, 3, core));
  return `<g transform="translate(${x} ${y}) scale(${scale.toFixed(2)})"><g class="holiday-firework" style="animation-delay:-${delay.toFixed(
    2,
  )}s">${parts.join('')}</g></g>`;
}

function yearBanner(dateString: string): string {
  const date = parseDateString(dateString);
  const year = Number.isNaN(date.getTime())
    ? 2026
    : date.getUTCMonth() === 11
      ? date.getUTCFullYear() + 1
      : date.getUTCFullYear();
  const label = String(year);
  const scale = 4;
  const width = pixelTextWidth(label, scale) + 36;
  const height = 44;
  const x = 480 - width / 2;
  const y = 92;
  const parts: string[] = [];
  parts.push(line(x + 12, 0, x + 12, y, '#ffd93d', 1, 'opacity="0.6"'));
  parts.push(line(x + width - 12, 0, x + width - 12, y, '#ffd93d', 1, 'opacity="0.6"'));
  parts.push(rect(x - 3, y - 3, width + 6, height + 6, '#a87916'));
  parts.push(rect(x, y, width, height, '#120a24'));
  for (let bx = x + 4; bx < x + width - 2; bx += 8) {
    const index = Math.round((bx - x) / 8);
    parts.push(
      `<circle class="garland-bulb" cx="${bx.toFixed(1)}" cy="${y - 1.5}" r="1.6" fill="#ffe066" style="animation-delay:-${((index * 0.3) % 2.4).toFixed(2)}s"/>`,
      `<circle class="garland-bulb" cx="${bx.toFixed(1)}" cy="${y + height + 1.5}" r="1.6" fill="#ffe066" style="animation-delay:-${((index * 0.3 + 1.2) % 2.4).toFixed(2)}s"/>`,
    );
  }
  parts.push(pixelText(label, x + 20, y + 10, scale, '#a87916'));
  parts.push(pixelText(label, x + 18, y + 8, scale, '#ffd93d'));
  return `<g>${parts.join('')}</g>`;
}

function newYearGround(rng: Rng, p: Palette): string {
  const parts: string[] = [];
  const glasses: Array<[number, number, number]> = [
    [45, 468, 1.4],
    [160, 468, 1],
    [905, 468, 1.4],
  ];
  glasses.forEach(([x, y, scale]) => {
    parts.push(`<g transform="translate(${x} ${y}) scale(${scale})">${ellipse(0, 1, 8, 2, p.shadow)}${poly(
      [
        [-5, -22],
        [5, -22],
        [3, -10],
        [-3, -10],
      ],
      '#d8f0ff',
      'opacity="0.55"',
    )}${poly(
      [
        [-4.4, -19],
        [4.4, -19],
        [3, -11],
        [-3, -11],
      ],
      '#ffd93d',
      'opacity="0.85"',
    )}${rect(-0.8, -10, 1.6, 8, '#d8f0ff')}${rect(-4, -2, 8, 2, '#d8f0ff')}${circle(-1.5, -16, 0.9, '#ffffff')}${circle(
      1.5,
      -13,
      0.7,
      '#ffffff',
    )}${circle(0, -24, 1, '#ffffff', 'opacity="0.8"')}</g>`);
  });
  // Champagne bottle mid-pop.
  parts.push(`<g transform="translate(842 468) rotate(-18)">${ellipse(0, 1, 8, 2, p.shadow)}${rect(-5, -22, 10, 22, '#1e4a34')}${rect(
    -3,
    -30,
    6,
    8,
    '#1e4a34',
  )}${rect(-3, -34, 6, 4, '#ffd93d')}${rect(-5, -16, 10, 8, '#f4e8c8')}${rect(-3, -14, 6, 1, '#a87916')}${rect(
    -2,
    -40,
    4,
    4,
    '#c8a070',
  )}${circle(-1, -46, 2, '#fff8e8', 'opacity="0.8"')}${circle(2, -50, 1.6, '#fff8e8', 'opacity="0.7"')}${circle(
    -2,
    -54,
    1.3,
    '#fff8e8',
    'opacity="0.6"',
  )}</g>`);
  // Party poppers with streamers.
  [226, 650].forEach((x, index) => {
    parts.push(`<g transform="translate(${x} 468)">${poly(
      [
        [-3, 0],
        [3, 0],
        [0, -12],
      ],
      index === 0 ? '#ff8fb0' : '#6ee7f9',
    )}${path('M0 -12 Q-8 -22 -2 -30 Q4 -36 -4 -44', 'none', 'stroke="#ffd93d" stroke-width="1.4"')}${path(
      'M0 -12 Q8 -20 6 -30',
      'none',
      'stroke="#7bd389" stroke-width="1.4"',
    )}${path('M0 -12 Q2 -24 12 -28', 'none', 'stroke="#b388ff" stroke-width="1.4"')}</g>`);
  });
  void rng;
  return parts.join('');
}

// ---------------------------------------------------------------------------
// Valentine's Day
// ---------------------------------------------------------------------------

function valentinesBackdrop(rng: Rng, p: Palette): string {
  const parts: string[] = [];
  // Heart-shaped clouds.
  [
    [140, 120, 3.6],
    [880, 210, 2.6],
    [360, 250, 2.2],
  ].forEach(([x, y, scale]) => {
    parts.push(heartShape(x!, y!, scale!, p.cloud, 'opacity="0.55"'));
  });
  const colors = ['#e63975', '#ff8fb0', '#ffc2d4'];
  for (let i = 0; i < 10; i += 1) {
    const x = 60 + rng() * 840;
    const y = 80 + rng() * 220;
    const scale = 0.6 + rng() * 1.1;
    parts.push(
      `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)})"><g class="heart-float" style="animation-delay:-${(
        i * 0.41
      ).toFixed(2)}s">${heartShape(0, 0, scale, colors[i % colors.length] ?? '#e63975', 'opacity="0.85"')}</g></g>`,
    );
  }
  parts.push(heartBalloonRide(560, 150));
  parts.push(flier(250, 128, cupid(), 34, 8));
  // Love letters.
  [
    [470, 230],
    [780, 260],
  ].forEach(([x, y], index) => {
    parts.push(
      `<g transform="translate(${x} ${y})"><g class="holiday-egg-float" style="animation-delay:-${index * 1.7}s">${rect(
        -8,
        -5,
        16,
        11,
        '#fff4f8',
      )}${poly(
        [
          [-8, -5],
          [8, -5],
          [0, 2],
        ],
        '#ffd6e4',
      )}${heartShape(0, 1, 0.3, '#e63975')}</g></g>`,
    );
  });
  return parts.join('');
}

function heartBalloonRide(x: number, y: number): string {
  return `<g transform="translate(${x} ${y})"><g class="holiday-egg-float">${heartShape(0, 0, 5, '#e63975')}${path(
    'M0 25 C-16 15 -24 3 -24 -12',
    'none',
    'stroke="#ff8fb0" stroke-width="3" opacity="0.7"',
  )}${ellipse(-14, -30, 4, 8, '#ffffff', 'opacity="0.35"')}${line(-8, 22, -7, 40, '#7a4a62', 1)}${line(
    8,
    22,
    7,
    40,
    '#7a4a62',
    1,
  )}${rect(-9, 40, 18, 10, '#a86a3a')}${rect(-9, 40, 18, 2, '#c88a5a')}${circle(0, 36, 4.5, '#8b5a2b')}${rect(
    -2.5,
    34,
    5,
    4,
    '#f4c995',
  )}${rect(-1.5, 35, 1, 1, '#241a20')}${rect(0.5, 35, 1, 1, '#241a20')}${rect(-6, 36, 2, 1, '#8b5a2b')}${rect(-7, 34, 1, 2, '#8b5a2b')}</g></g>`;
}

function cupid(): string {
  const fur = '#a9713a';
  return `<g transform="scale(1.4)">${ellipse(-10, -6, 7, 4, '#ffffff', 'opacity="0.9"')}${ellipse(
    -9,
    -2,
    6,
    3,
    '#ffeef4',
    'opacity="0.9"',
  )}${rect(-5, -6, 9, 10, fur)}${circle(0, -10, 5, fur)}${rect(-2, -12, 5, 4, '#f9d6a4')}${rect(-1, -11, 1, 1, '#241a20')}${rect(
    1,
    -11,
    1,
    1,
    '#241a20',
  )}${rect(-5, 0, 9, 3, '#ffffff')}${path('M10 -14 Q16 -4 10 6', 'none', 'stroke="#a86a2a" stroke-width="1.4"')}${line(
    10,
    -14,
    10,
    6,
    '#fff0f6',
    0.5,
  )}${line(2, -4, 20, -4, '#7a4a26', 1)}${poly(
    [
      [20, -6],
      [24, -4],
      [20, -2],
    ],
    '#e63975',
  )}${rect(4, -5, 6, 2, fur)}</g>`;
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
  [
    [222, 468],
    [590, 468],
    [777, 468],
  ].forEach(([x, y]) => {
    parts.push(`<g transform="translate(${x} ${y})">${ellipse(0, -8, 16, 10, '#3f6a3f')}${ellipse(-4, -10, 10, 6, '#4f8a4f')}${circle(
      -8,
      -10,
      3.2,
      '#d62860',
    )}${circle(5, -14, 3.2, '#e63975')}${circle(0, -6, 3.2, '#d62860')}${circle(10, -7, 2.6, '#ffc2d4')}${circle(
      -2,
      -15,
      2.4,
      '#ff8fb0',
    )}${rect(-9, -11, 2, 1, '#8a1040', 'opacity="0.6"')}${rect(4, -15, 2, 1, '#8a1040', 'opacity="0.6"')}</g>`);
  });
  // A heart-shaped arch.
  parts.push(`<g transform="translate(650 468)">${rect(-12, -26, 2, 26, '#f4f0f4')}${rect(10, -26, 2, 26, '#f4f0f4')}${heartShape(
    0,
    -26,
    1.6,
    '#e63975',
  )}${heartShape(0, -26, 0.9, '#ffc2d4')}</g>`);
  void rng;
  return parts.join('');
}

// ---------------------------------------------------------------------------
// St. Patrick's Day
// ---------------------------------------------------------------------------

function stPatricksBackdrop(rng: Rng, p: Palette): string {
  const parts: string[] = [];
  const cx = 330;
  const cy = 360;
  const colors = ['#e63946', '#ff9f1c', '#ffd93d', '#2a9d4f', '#4a8fe0', '#8a4bff'];
  colors.forEach((color, index) => {
    const radius = 250 - index * 11;
    parts.push(
      `<path d="M${cx - radius} ${cy} A${radius} ${radius} 0 0 1 ${cx + radius} ${cy}" fill="none" stroke="${color}" stroke-width="11" opacity="0.72"/>`,
    );
  });
  parts.push(
    `<path d="M${cx - 252} ${cy} A252 252 0 0 1 ${cx + 252} ${cy}" fill="none" stroke="#ffffff" stroke-width="2" opacity="0.4"/>`,
  );
  // Clouds hide where the rainbow ends, and gold spills from one end.
  parts.push(puffyCloud(cx - 194, cy - 10, 1.3, p));
  parts.push(goldHoard(cx + 194, cy - 12));
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

function puffyCloud(x: number, y: number, scale: number, p: Palette): string {
  return `<g transform="translate(${x} ${y}) scale(${scale})">${ellipse(0, 6, 34, 10, p.cloudShade)}${circle(-16, 0, 13, '#ffffff')}${circle(
    2,
    -6,
    17,
    '#ffffff',
  )}${circle(20, 1, 12, '#ffffff')}${ellipse(0, 8, 32, 7, '#e8f4ff')}</g>`;
}

function goldHoard(x: number, y: number): string {
  const coins: Array<[number, number]> = [
    [-14, 6],
    [-6, 2],
    [2, -2],
    [10, 3],
    [16, 8],
    [-2, 8],
    [6, 8],
    [-10, -4],
    [0, -8],
    [12, -4],
  ];
  return `<g transform="translate(${x} ${y})">${circle(0, 0, 34, '#ffd93d', 'opacity="0.18"')}${coins
    .map(([cx, cy]) => `${ellipse(cx, cy, 5, 4, '#e0b020')}${ellipse(cx, cy - 1, 4, 3, '#ffd93d')}${rect(cx - 1, cy - 2, 2, 1, '#fff3a8')}`)
    .join('')}<g class="holiday-sparkle">${star(-4, -16, 4, '#ffffff')}</g><g class="holiday-sparkle" style="animation-delay:-1.3s">${star(
    14,
    -12,
    3,
    '#fff3a8',
  )}</g></g>`;
}

function irishBunting(): string {
  const colors = ['#169b62', '#ffffff', '#ff883e'];
  return topEdgeStrings(12, '#1a6b34', (x, y, index) =>
    poly(
      [
        [x - 6, y],
        [x + 6, y],
        [x, y + 12],
      ],
      colors[index % colors.length] ?? '#169b62',
      'opacity="0.95"',
    ),
  );
}

function potOfGold(x: number, base: number, p: Palette): string {
  return `<g transform="translate(${x} ${base})">${ellipse(0, 1, 18, 3, p.shadow)}${circle(0, -22, 22, '#ffd93d', 'opacity="0.16"')}${poly(
    [
      [-15, -16],
      [15, -16],
      [12, 0],
      [-12, 0],
    ],
    '#2a2420',
  )}${rect(-11, -12, 4, 8, '#ffffff', 'opacity="0.08"')}${rect(-17, -20, 34, 5, '#3a3430')}${ellipse(0, -20, 15, 4, '#ffd93d')}${circle(
    -7,
    -22,
    4,
    '#ffd93d',
  )}${circle(2, -25, 4, '#ffd93d')}${circle(9, -21, 3.5, '#ffd166')}${circle(-2, -20, 3.5, '#ffe066')}${circle(
    -8,
    -24,
    1.2,
    '#fff8d6',
  )}${circle(3, -27, 1.2, '#fff8d6')}<g class="holiday-sparkle">${star(-10, -32, 3, '#ffffff')}</g></g>`;
}

function stPatricksGround(rng: Rng, p: Palette): string {
  const parts: string[] = [];
  parts.push(potOfGold(905, 468, p));
  const clusters: Array<[number, number]> = [
    [45, 468],
    [160, 468],
    [590, 468],
    [777, 468],
  ];
  clusters.forEach(([x, y], index) => {
    parts.push(
      `<g transform="translate(${x} ${y})">${shamrockShape(0, -4, 1.4 + (index % 2) * 0.4, '#2a9d4f')}${shamrockShape(
        12,
        0,
        0.9,
        '#4abf6a',
      )}${shamrockShape(-11, 0, 0.8, '#1e7a3e')}</g>`,
    );
  });
  // A leprechaun hat on a tree stump.
  parts.push(`<g transform="translate(260 468)">${ellipse(0, 1, 18, 3, p.shadow)}${rect(-10, -10, 20, 10, '#7a5a3a')}${ellipse(
    0,
    -10,
    10,
    3,
    '#c8a070',
  )}${rect(-16, -16, 32, 5, '#1a6b34')}${poly(
    [
      [-11, -16],
      [11, -16],
      [12, -36],
      [-12, -36],
    ],
    '#2a9d4f',
  )}${rect(-13, -38, 26, 3, '#1a6b34')}${rect(-11, -22, 22, 4, '#1a1020')}${rect(-4, -24, 8, 8, '#ffd93d')}${rect(
    -2,
    -22,
    4,
    4,
    '#1a1020',
  )}${shamrockShape(8, -31, 0.6, '#7ae08a')}</g>`);
  // A harp.
  parts.push(`<g transform="translate(650 468)">${path('M-8 0 L-8 -30 Q4 -34 10 -22 L4 0 Z', 'none', 'stroke="#ffd93d" stroke-width="2.4"')}${line(
    -6,
    -26,
    -6,
    -2,
    '#fff3a8',
    0.6,
  )}${line(-2, -28, -2, -2, '#fff3a8', 0.6)}${line(2, -27, 2, -2, '#fff3a8', 0.6)}${line(6, -22, 5, -3, '#fff3a8', 0.6)}</g>`);
  void rng;
  return parts.join('');
}

// ---------------------------------------------------------------------------
// Easter
// ---------------------------------------------------------------------------

function easterBackdrop(rng: Rng, p: Palette): string {
  const parts: string[] = [];
  for (let i = 0; i < 8; i += 1) {
    const x = 50 + rng() * 860;
    const y = 90 + rng() * 210;
    parts.push(
      `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)})"><g class="holiday-egg-float" style="animation-delay:-${(
        i * 0.43
      ).toFixed(2)}s">${eggShape(0, 0, 0.9 + rng() * 0.5, EASTER_COLORS[i % EASTER_COLORS.length] ?? '#ffb3c8', '#ffffff')}</g></g>`,
    );
  }
  parts.push(eggBalloon(600, 168));
  parts.push(eggBalloon(240, 230, 0.6, ['#7adf8a', '#ffe066', '#8fd8e8']));
  parts.push(flier(420, 120, butterfly('#ffb3c8'), 22, 2));
  parts.push(flier(700, 260, butterfly('#ffe066'), 26, 11));
  void p;
  return parts.join('');
}

function eggBalloon(x: number, y: number, scale = 1, colors: readonly string[] = ['#b07ae8', '#ffb3c8', '#ffe066']): string {
  const [a = '#b07ae8', b = '#ffb3c8', c = '#ffe066'] = colors;
  return `<g transform="translate(${x} ${y}) scale(${scale})"><g class="holiday-egg-float">${ellipse(0, 0, 30, 38, a)}${path(
    'M-30 -8 Q0 -2 30 -8 L29 4 Q0 10 -29 4 Z',
    b,
  )}${path('M-27 16 Q0 22 27 16 L23 24 Q0 30 -23 24 Z', c)}${path(
    'M-26 -20 L-18 -26 L-10 -20 L-2 -26 L6 -20 L14 -26 L22 -20 L28 -22 L26 -16 L-28 -16 Z',
    c,
    'opacity="0.9"',
  )}${ellipse(-12, -16, 6, 12, '#ffffff', 'opacity="0.3"')}${line(-12, 34, -8, 48, '#7a5a3a', 1)}${line(
    12,
    34,
    8,
    48,
    '#7a5a3a',
    1,
  )}${rect(-10, 48, 20, 12, '#c28450')}${rect(-10, 48, 20, 2, '#9a6238')}${rect(-10, 53, 20, 1, '#9a6238')}${ellipse(
    -3,
    45,
    5,
    6,
    '#f8f4ff',
  )}${ellipse(-5, 36, 1.6, 5, '#f8f4ff')}${ellipse(-1, 36, 1.6, 5, '#f8f4ff')}${rect(-4, 44, 1, 1, '#3a2a3a')}</g></g>`;
}

function butterfly(color: string): string {
  return `<g class="holiday-flutter">${ellipse(-4, -2, 4, 3, color)}${ellipse(4, -2, 4, 3, color)}${ellipse(
    -3,
    2,
    3,
    2,
    shade(color, -0.15),
  )}${ellipse(3, 2, 3, 2, shade(color, -0.15))}</g>${rect(-0.6, -4, 1.2, 8, '#3a2a3a')}`;
}

function tulip(x: number, y: number, color: string): string {
  return `<g transform="translate(${x} ${y})">${rect(-0.5, -6, 1, 6, '#3f8a4a')}${poly(
    [
      [-0.5, -2],
      [-3, -5],
      [-0.5, -4],
    ],
    '#4f9a5a',
  )}${rect(-2, -9, 4, 3, color)}${rect(-2, -10, 1, 1, color)}${rect(1, -10, 1, 1, color)}</g>`;
}

function pastelBunting(): string {
  return topEdgeStrings(13, '#c8a8d8', (x, y, index) =>
    `${poly(
      [
        [x - 6, y],
        [x + 6, y],
        [x, y + 13],
      ],
      EASTER_COLORS[index % EASTER_COLORS.length] ?? '#ffb3c8',
    )}${rect(x - 3, y + 3, 6, 1, '#ffffff', 'opacity="0.7"')}`,
  );
}

function easterBunny(x: number, base: number, p: Palette): string {
  const white = '#f4f0ff';
  return `<g transform="translate(${x} ${base})">${ellipse(0, 1, 13, 3, p.shadow)}<g class="holiday-hop">${ellipse(
    0,
    -10,
    11,
    10,
    white,
  )}${circle(0, -22, 7, white)}${ellipse(-4, -33, 2.6, 8.5, white)}${ellipse(4, -34, 2.6, 8.5, white, 'transform="rotate(14 4 -34)"')}${ellipse(
    -4,
    -33,
    1.2,
    5.5,
    '#ffb3c8',
  )}${circle(-2.5, -23, 1.1, '#3a2a3a')}${circle(2.5, -23, 1.1, '#3a2a3a')}${circle(0, -20, 1, '#ff8fb0')}${circle(
    -10,
    -6,
    3.4,
    white,
  )}${rect(-4, -15, 8, 2, '#b07ae8')}${rect(-1, -16, 2, 4, '#9a5ad8')}${eggShape(8, -8, 0.6, '#ffe066', '#b07ae8')}</g></g>`;
}

function eggBasket(x: number, base: number): string {
  return `<g transform="translate(${x} ${base})">${path('M-14 -12 Q0 -34 14 -12', 'none', 'stroke="#9a6238" stroke-width="2.2"')}${ellipse(
    -6,
    -15,
    5,
    6,
    '#ffb3c8',
  )}${ellipse(5, -16, 5, 6, '#b07ae8')}${ellipse(0, -20, 4, 5, '#7adf8a')}${ellipse(9, -13, 4, 5, '#ffe066')}${poly(
    [
      [-16, -12],
      [16, -12],
      [12, 0],
      [-12, 0],
    ],
    '#c28450',
  )}${rect(-17, -14, 34, 3, '#9a6238')}${rect(-14, -8, 28, 1, '#9a6238')}${rect(-13, -4, 26, 1, '#9a6238')}</g>`;
}

function easterGround(rng: Rng, p: Palette): string {
  const parts: string[] = [];
  parts.push(easterBunny(842, 468, p));
  parts.push(easterBunny(222, 468, p));
  parts.push(eggBasket(45, 468));
  parts.push(eggBasket(905, 468));
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
    parts.push(eggShape(x, y, 0.55 + rng() * 0.35, color, stripe));
  }
  return parts.join('');
}

// ---------------------------------------------------------------------------
// Independence Day
// ---------------------------------------------------------------------------

function independenceBackdrop(rng: Rng, p: Palette): string {
  const bursts: Array<[number, number, string, string, number, BurstStyle]> = [
    [170, 130, '#e63946', '#f1faee', 0, 'peony'],
    [380, 92, '#f1faee', '#4a8fe0', 0.6, 'willow'],
    [560, 170, '#4a8fe0', '#f1faee', 1.2, 'ring'],
    [760, 110, '#e63946', '#4a8fe0', 1.8, 'crossette'],
    [900, 200, '#f1faee', '#e63946', 2.3, 'peony'],
    [270, 230, '#4a8fe0', '#e63946', 2.8, 'ring'],
  ];
  void p;
  return bursts
    .map(([x, y, color, core, delay, style]) => `${rocketTrail(x, y, color, delay)}${firework(x, y, color, core, delay, 1.2 + rng() * 0.7, style)}`)
    .join('');
}

/** Pleated red, white and blue swags along the top edge. */
function starSpangledSwags(): string {
  const parts: string[] = [];
  const width = 160;
  const bands: Array<[string, number]> = [
    ['#e63946', 20],
    ['#f1faee', 14],
    ['#1d3557', 8],
  ];
  for (let x = 0; x < 960; x += width) {
    bands.forEach(([color, depth]) => {
      parts.push(path(`M${x} 0 Q${x + width / 2} ${depth * 2} ${x + width} 0 Z`, color));
    });
    parts.push(circle(x, 3, 7, '#1d3557'));
    parts.push(star(x, 3, 5, '#f1faee'));
  }
  parts.push(circle(960, 3, 7, '#1d3557'), star(960, 3, 5, '#f1faee'));
  return `<g opacity="0.95">${parts.join('')}</g>`;
}

function flagPole(x: number, base: number, scale: number, p: Palette): string {
  const stripes: string[] = [];
  for (let i = 0; i < 7; i += 1) {
    stripes.push(rect(2, -40 + i * 4, 30, 2, '#e63946'));
  }
  const stars: string[] = [];
  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 4; col += 1) {
      stars.push(rect(4 + col * 3 + (row % 2), -38 + row * 3, 1, 1, '#f1faee'));
    }
  }
  return `<g transform="translate(${x} ${base}) scale(${scale})">${rect(-1, -44, 2, 44, p.metalLight)}${circle(0, -45, 2, '#ffd93d')}<g class="holiday-wave">${rect(
    2,
    -40,
    30,
    18,
    '#f1faee',
  )}${stripes.join('')}${rect(2, -40, 13, 10, '#1d3557')}${stars.join('')}</g></g>`;
}

function independenceGround(rng: Rng, p: Palette): string {
  const parts: string[] = [];
  parts.push(flagPole(45, 468, 1.4, p));
  parts.push(flagPole(842, 468, 1.2, p));
  parts.push(flagShape(905, 468, 0.9, p));
  parts.push(flagShape(160, 468, 0.8, p));
  // Picnic: checkered blanket, watermelon and a grill.
  const blanket: string[] = [];
  for (let i = 0; i < 6; i += 1) {
    for (let j = 0; j < 2; j += 1) {
      blanket.push(rect(-18 + i * 6, -4 + j * 3, 6, 3, (i + j) % 2 === 0 ? '#e63946' : '#f1faee'));
    }
  }
  parts.push(`<g transform="translate(240 468)">${blanket.join('')}${path('M-10 -4 A8 8 0 0 1 6 -4 Z', '#3a8a3a')}${path(
    'M-8.5 -4 A6.5 6.5 0 0 1 4.5 -4 Z',
    '#ff5a6a',
  )}${rect(-5, -7, 1, 1, '#1a1020')}${rect(0, -8, 1, 1, '#1a1020')}</g>`);
  parts.push(`<g transform="translate(650 468)">${rect(-1, -10, 2, 10, '#3a3a48')}${rect(-6, -10, 2, 10, '#3a3a48')}${rect(
    4,
    -10,
    2,
    10,
    '#3a3a48',
  )}${path('M-10 -12 A10 7 0 0 0 10 -12 Z', '#1a1a24')}${rect(-10, -13, 20, 1.5, '#5a5a68')}${rect(-6, -15, 6, 2, '#8a4a2a')}${rect(
    2,
    -15,
    5,
    2,
    '#8a4a2a',
  )}<g class="steam">${circle(-2, -22, 3, '#c8c8d8', 'opacity="0.35"')}${circle(2, -28, 2.4, '#c8c8d8', 'opacity="0.25"')}</g></g>`);
  void rng;
  return parts.join('');
}

// ---------------------------------------------------------------------------
// Thanksgiving
// ---------------------------------------------------------------------------

function thanksgivingBackdrop(rng: Rng, p: Palette): string {
  const parts: string[] = [];
  // Sunset bands warm the horizon.
  const bands: Array<[number, number, string, number]> = [
    [250, 40, '#ffb347', 0.12],
    [290, 40, '#ff8c42', 0.14],
    [330, 52, '#e85d3a', 0.12],
  ];
  bands.forEach(([y, h, color, opacity]) => parts.push(rect(0, y, 960, h, color, `opacity="${opacity}"`)));
  for (let i = 0; i < 10; i += 1) {
    const x = 40 + rng() * 880;
    const y = 80 + rng() * 230;
    parts.push(
      `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)})"><g class="holiday-leaf" style="animation-delay:-${(
        i * 0.53
      ).toFixed(2)}s">${leafShape(0, 0, 0.9 + rng() * 0.6, AUTUMN[i % AUTUMN.length] ?? '#c0561f', i % 2 === 0)}</g></g>`,
    );
  }
  parts.push(flier(420, 150, geese(), 32, 6));
  parts.push(flier(700, 220, `<g transform="scale(0.6)">${geese()}</g>`, 40, 21));
  void p;
  return parts.join('');
}

function geese(): string {
  const goose = (x: number, y: number): string =>
    `<g transform="translate(${x} ${y})"><g class="bat">${path('M-8 -3 Q-4 -6 0 0 Q4 -6 8 -3', 'none', 'stroke="#3a2418" stroke-width="1.8"')}</g>${rect(
      -1,
      -1,
      4,
      2,
      '#3a2418',
    )}</g>`;
  const birds: Array<[number, number]> = [
    [0, 0],
    [-14, -9],
    [-28, -18],
    [-14, 9],
    [-28, 18],
    [-42, 27],
  ];
  return birds.map(([x, y]) => goose(x, y)).join('');
}

function pumpkin(x: number, base: number, scale: number, color: string, p: Palette): string {
  return `<g transform="translate(${x} ${base}) scale(${scale})">${ellipse(0, 1, 17, 3, p.shadow)}${ellipse(0, -11, 16, 12, color)}${ellipse(
    -8,
    -11,
    7,
    12,
    shade(color, -0.2),
    'opacity="0.6"',
  )}${ellipse(8, -11, 7, 12, shade(color, -0.2), 'opacity="0.6"')}${ellipse(-3, -15, 3, 5, '#ffffff', 'opacity="0.15"')}${rect(
    -2,
    -25,
    4,
    6,
    '#5a7a3a',
  )}${path('M2 -22 Q8 -26 10 -20', 'none', 'stroke="#5a7a3a" stroke-width="1.2"')}</g>`;
}

function cornucopia(x: number, base: number, p: Palette): string {
  return `<g transform="translate(${x} ${base})">${ellipse(0, 1, 26, 3, p.shadow)}${path(
    'M20 -2 Q10 -26 -10 -22 Q-24 -18 -30 -4 Q-34 2 -26 0 Q-20 -10 -10 -10 Q4 -10 20 -2 Z',
    '#c28450',
  )}${path('M-10 -22 Q-24 -18 -30 -4', 'none', 'stroke="#9a6238" stroke-width="1.4"')}${path(
    'M2 -24 Q-6 -10 6 -6 M10 -18 Q2 -8 14 -4',
    'none',
    'stroke="#9a6238" stroke-width="1"',
  )}${circle(-30, -2, 3, '#9a6238')}${circle(18, -10, 6, '#c0282e')}${circle(26, -6, 5, '#e0a020')}${ellipse(
    12,
    -3,
    7,
    4,
    '#ff8c1a',
  )}${circle(22, -16, 3, '#8a3a9a')}${circle(25, -18, 3, '#8a3a9a')}${circle(23, -20, 3, '#9a4aaa')}${poly(
    [
      [30, -2],
      [40, -8],
      [38, 0],
    ],
    '#ffd166',
  )}${rect(16, -17, 2, 3, '#5a7a3a')}</g>`;
}

function wheatSheaf(x: number, base: number): string {
  const parts: string[] = [];
  for (let i = -3; i <= 3; i += 1) {
    parts.push(line(0, 0, i * 4, -32, '#c8a050', 1.2));
    parts.push(ellipse(i * 4, -34, 2, 5, '#e0b860', `transform="rotate(${i * 7} ${i * 4} -34)"`));
  }
  parts.push(rect(-5, -14, 10, 3, '#8a5a2a'));
  return `<g transform="translate(${x} ${base})">${parts.join('')}</g>`;
}

function thanksgivingGround(rng: Rng, p: Palette): string {
  const parts: string[] = [];
  parts.push(cornucopia(160, 468, p));
  parts.push(pumpkin(45, 468, 0.95, '#ff8c1a', p));
  parts.push(pumpkin(70, 468, 0.6, '#f4ece0', p));
  parts.push(pumpkin(905, 468, 1.05, '#e07a1a', p));
  parts.push(pumpkin(590, 468, 0.7, '#d9a03a', p));
  parts.push(wheatSheaf(260, 468));
  parts.push(wheatSheaf(650, 468));
  parts.push(turkey(777, 468, p));
  // Hay bale.
  parts.push(`<g transform="translate(842 468)">${ellipse(0, 1, 18, 3, p.shadow)}${rect(-16, -14, 32, 14, '#d9b860')}${rect(-16, -14, 32, 2, '#f0d080')}${rect(
    -10,
    -14,
    2,
    14,
    '#a8883a',
  )}${rect(8, -14, 2, 14, '#a8883a')}${rect(-14, -8, 4, 1, '#f0d080')}${rect(2, -5, 5, 1, '#f0d080')}</g>`);
  void rng;
  return parts.join('');
}

function turkey(x: number, base: number, p: Palette): string {
  const feathers = ['#8a3a10', '#c0561f', '#e0a020', '#c0561f', '#8a3a10', '#d9822b', '#a86a2a'];
  const parts: string[] = [];
  feathers.forEach((color, index) => {
    const angle = -84 + index * 28;
    parts.push(`<g transform="translate(-2 -10) rotate(${angle})">${ellipse(0, -14, 5, 13, color)}${ellipse(0, -22, 3, 4, '#fff0d0', 'opacity="0.35"')}</g>`);
  });
  parts.push(ellipse(0, -8, 12, 10, '#6a4020'));
  parts.push(ellipse(-2, -10, 7, 6, '#8a5a2a'));
  parts.push(rect(5, -24, 5, 14, '#6a4020'));
  parts.push(circle(8, -24, 4.5, '#8a5a2a'));
  parts.push(poly([[11, -26], [16, -24], [11, -22]], '#ffb347'));
  parts.push(rect(10, -23, 2, 5, '#d62839'));
  parts.push(circle(8, -25, 0.9, '#2a1a20'));
  parts.push(rect(-2, -1, 2, 4, '#ffb347'));
  parts.push(rect(3, -1, 2, 4, '#ffb347'));
  return `<g transform="translate(${x} ${base})">${ellipse(0, 1, 18, 3, p.shadow)}${parts.join('')}</g>`;
}
