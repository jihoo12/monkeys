import type { CivilizationState } from '../types.ts';
import type { Palette } from './palette.ts';
import { circle, poly, rect } from './svg.ts';
import { pixelText, pixelTextWidth, truncatePixelText } from './pixel-font.ts';
import { drawAgeIcon, drawBananaIcon, drawMonkeyFaceIcon } from './sprites.ts';
import { formatNumber, formatPercent } from '../util/date.ts';
import { AGES } from '../sim/ages.ts';

const PANEL_X = 8;
const PANEL_Y = 504;
const PANEL_W = 944;
const PANEL_H = 148;
const INNER_X = 24;
const INNER_W = 912;
const CARD_Y = 512;
const CARD_H = 54;
const CARD_GAP = 12;
const CARD_W = (INNER_W - CARD_GAP * 3) / 4;
const BAR_Y = 582;
const BAR_H = 12;
const SEGMENT_W = INNER_W / AGES.length;
const TICKER_Y = 626;

export function renderHud(state: CivilizationState, palette: Palette): string {
  const parts: string[] = [];

  parts.push(renderFrame(palette));
  parts.push(renderCards(state, palette));
  parts.push(renderProgressBar(state, palette));
  parts.push(renderTicker(state, palette));

  return parts.join('');
}

// ---------------------------------------------------------------------------
// Frame and cards
// ---------------------------------------------------------------------------

function renderFrame(palette: Palette): string {
  const parts: string[] = [];
  parts.push(rect(PANEL_X, PANEL_Y, PANEL_W, PANEL_H, palette.outline));
  parts.push(rect(PANEL_X + 2, PANEL_Y + 2, PANEL_W - 4, PANEL_H - 4, 'url(#hudPanelGradient)'));
  parts.push(rect(PANEL_X + 2, PANEL_Y + 2, PANEL_W - 4, 2, palette.hudBorder, 'opacity="0.8"'));
  parts.push(rect(PANEL_X + 2, PANEL_Y + PANEL_H - 5, PANEL_W - 4, 3, palette.hudInset));
  parts.push(rect(PANEL_X + 5, PANEL_Y + 5, PANEL_W - 10, 1, palette.hudPanelLight, 'opacity="0.7"'));

  // Corner brackets give the panel a chunky game-console silhouette.
  const corners: Array<[number, number, number, number]> = [
    [PANEL_X + 2, PANEL_Y + 2, 1, 1],
    [PANEL_X + PANEL_W - 12, PANEL_Y + 2, -1, 1],
    [PANEL_X + 2, PANEL_Y + PANEL_H - 12, 1, -1],
    [PANEL_X + PANEL_W - 12, PANEL_Y + PANEL_H - 12, -1, -1],
  ];
  for (const [x, y, sx, sy] of corners) {
    const left = sx > 0 ? x : x - 8;
    const top = sy > 0 ? y : y - 8;
    parts.push(rect(left, top, 10, 3, palette.hudBorder, 'opacity="0.9"'));
    parts.push(rect(left, top, 3, 10, palette.hudBorder, 'opacity="0.9"'));
    parts.push(circle(left + (sx > 0 ? 5 : 5), top + (sy > 0 ? 5 : 5), 1.5, palette.hudInset));
  }

  // Rivets along the top rail.
  for (let x = INNER_X + 6; x < INNER_X + INNER_W - 4; x += 54) {
    parts.push(rect(x, PANEL_Y + 4, 2, 2, palette.hudPanelLight, 'opacity="0.65"'));
  }
  return parts.join('');
}

function renderCards(state: CivilizationState, palette: Palette): string {
  const progressText =
    state.nextAge === null
      ? `LVL ${state.level} * MAX LEVEL`
      : `LVL ${state.level} * ${formatPercent(state.ageProgress)} NEXT`;

  const cards: Array<{
    icon: string;
    label: string;
    value: string;
    detail: string;
    accent: string;
    scale: number;
    iconX: number;
    iconY: number;
  }> = [
    {
      icon: drawBananaIcon(0, 0, 2.4, palette),
      label: 'BANANAS',
      value: displayNumber(state.bananas),
      detail: `+${displayNumber(state.bananaIncome)} / DAY`,
      accent: palette.banana,
      scale: 3,
      iconX: 12,
      iconY: 16,
    },
    {
      icon: drawMonkeyFaceIcon(0, 0, 2.4, palette),
      label: 'POPULATION',
      value: String(state.population),
      detail: `CAP ${state.capacity} * ${occupancyPercent(state)}% FULL`,
      accent: palette.accent,
      scale: 3,
      iconX: 11,
      iconY: 17,
    },
    {
      icon: drawAgeIcon(state.age.id, 0, 0, 2.4, palette),
      label: 'CIVILIZATION',
      value: state.age.name.replace(' AGE', ''),
      detail: progressText,
      accent: palette.hudBorder,
      scale: 2,
      iconX: 11,
      iconY: 15,
    },
    {
      icon: drawContributionIcon(0, 0, 1.8, palette),
      label: 'CONTRIBUTIONS',
      value: displayNumber(state.totalContributions),
      detail: `${state.milestones.buildings} BUILT * ${state.stats.activeDays}D`,
      accent: palette.accent2,
      scale: 3,
      iconX: 10,
      iconY: 14,
    },
  ];

  const parts: string[] = [];
  cards.forEach((card, index) => {
    const x = INNER_X + index * (CARD_W + CARD_GAP);
    const y = CARD_Y;
    parts.push(rect(x, y, CARD_W, CARD_H, palette.outline));
    parts.push(rect(x + 1, y + 1, CARD_W - 2, CARD_H - 2, 'url(#hudInsetGradient)'));
    parts.push(rect(x + 1, y + 1, CARD_W - 2, 1, palette.hudPanelLight, 'opacity="0.55"'));
    parts.push(rect(x + 1, y + 1, 3, CARD_H - 2, card.accent, 'opacity="0.85"'));

    // Icon plate.
    parts.push(rect(x + 8, y + 11, 32, 32, palette.outline));
    parts.push(rect(x + 9, y + 12, 30, 30, palette.hudPanel));
    parts.push(rect(x + 9, y + 12, 30, 1, card.accent, 'opacity="0.35"'));
    parts.push(rect(x + 11, y + 14, 26, 26, palette.hudInset, 'opacity="0.55"'));
    parts.push(
      `<g transform="translate(${x + card.iconX} ${y + card.iconY})" shape-rendering="crispEdges">${card.icon}</g>`,
    );

    const textX = x + 48;
    const maxText = CARD_W - 56;
    parts.push(pixelText(truncatePixelText(card.label, maxText, 2), textX, y + 6, 2, palette.hudDim));
    parts.push(
      pixelText(
        truncatePixelText(card.value, maxText, card.scale),
        textX,
        y + 21,
        card.scale,
        palette.hudText,
      ),
    );
    parts.push(
      pixelText(
        truncatePixelText(card.detail, maxText, 1.5),
        textX,
        y + 46,
        1.5,
        card.accent,
      ),
    );

    // A small status light in the top-right corner of each card.
    parts.push(circle(x + CARD_W - 10, y + 9, 2, card.accent, 'opacity="0.9"'));
    parts.push(circle(x + CARD_W - 10, y + 9, 4, card.accent, 'opacity="0.16"'));
  });
  return parts.join('');
}

// ---------------------------------------------------------------------------
// Age progress
// ---------------------------------------------------------------------------

function renderProgressBar(state: CivilizationState, palette: Palette): string {
  const parts: string[] = [];
  parts.push(rect(INNER_X - 2, BAR_Y - 2, INNER_W + 4, BAR_H + 4, palette.outline));
  parts.push(rect(INNER_X, BAR_Y, INNER_W, BAR_H, palette.hudInset));

  AGES.forEach((age, index) => {
    const x = INNER_X + index * SEGMENT_W;
    const completed = index < state.ageIndex;
    const current = index === state.ageIndex;
    const fill = completed ? 1 : current ? state.ageProgress : 0;
    const fillWidth = Math.max(0, (SEGMENT_W - 4) * fill);

    if (fillWidth > 0) {
      parts.push(rect(x + 2, BAR_Y + 2, fillWidth, BAR_H - 4, completed ? age.accent2 : age.accent));
      parts.push(rect(x + 2, BAR_Y + 2, fillWidth, 2, age.accent, 'opacity="0.55"'));
    }
    parts.push(rect(x + 1, BAR_Y + 2, 1, BAR_H - 4, palette.hudBg2, 'opacity="0.75"'));
    parts.push(rect(x, BAR_Y - 3, 2, BAR_H + 6, palette.hudBg));

    const labelWidth = pixelTextWidth(age.shortName, 2);
    const labelX = x + (SEGMENT_W - labelWidth) / 2;
    const labelColor = current ? palette.hudAccent : completed ? palette.hudAccent2 : palette.hudDim;
    parts.push(pixelText(age.shortName, labelX, BAR_Y + BAR_H + 4, 2, labelColor));
    if (!current && !completed) {
      parts.push(circle(x + SEGMENT_W / 2, BAR_Y + BAR_H + 9, 1.2, palette.hudDim, 'opacity="0.55"'));
    }
  });

  const markerX = INNER_X + state.ageIndex * SEGMENT_W + state.ageProgress * SEGMENT_W;
  parts.push(rect(markerX - 1, BAR_Y - 5, 2, 5, palette.hudAccent));
  parts.push(
    poly(
      [
        [markerX - 5, BAR_Y - 8],
        [markerX + 5, BAR_Y - 8],
        [markerX, BAR_Y - 2],
      ],
      palette.hudAccent,
    ),
  );
  parts.push(circle(markerX, BAR_Y - 10, 2, palette.hudAccent));
  parts.push(circle(markerX, BAR_Y - 10, 4, palette.hudAccent, 'opacity="0.18"'));
  return parts.join('');
}

// ---------------------------------------------------------------------------
// Chronicle ticker
// ---------------------------------------------------------------------------

function renderTicker(state: CivilizationState, palette: Palette): string {
  const text = truncatePixelText(state.lastEvent.text, INNER_W - 30, 2);
  return `${rect(INNER_X, TICKER_Y - 5, INNER_W, 1, palette.hudPanelLight, 'opacity="0.5"')}${poly(
    [
      [INNER_X, TICKER_Y - 1],
      [INNER_X + 5, TICKER_Y + 3],
      [INNER_X, TICKER_Y + 7],
    ],
    palette.hudAccent,
  )}${pixelText(text, INNER_X + 12, TICKER_Y, 2, palette.hudText)}`;
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function drawContributionIcon(x: number, y: number, scale: number, palette: Palette): string {
  const shades = [palette.grassDark, palette.grass, palette.accent2, palette.accent];
  const parts: string[] = [];
  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 3; col += 1) {
      const index = (row * 3 + col) % shades.length;
      parts.push(
        rect(
          x + col * 5 * scale,
          y + row * 5 * scale,
          4 * scale,
          4 * scale,
          shades[index] ?? palette.accent,
          index === 8 ? 'opacity="0.7"' : '',
        ),
      );
    }
  }
  return parts.join('');
}

function occupancyPercent(state: CivilizationState): number {
  if (state.capacity <= 0) return 0;
  return Math.min(100, Math.round((state.population / state.capacity) * 100));
}

function displayNumber(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  }
  return formatNumber(value);
}
