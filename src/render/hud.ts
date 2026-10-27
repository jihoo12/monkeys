import type { CivilizationState } from '../types.ts';
import type { Palette } from './palette.ts';
import { circle, poly, rect } from './svg.ts';
import {
  pixelText,
  pixelTextWidth,
  truncatePixelText,
} from './pixel-font.ts';
import {
  drawAgeIcon,
  drawBananaIcon,
  drawMonkeyFaceIcon,
} from './sprites.ts';
import { formatNumber, formatPercent } from '../util/date.ts';
import { AGES } from '../sim/ages.ts';

const PANEL_X = 8;
const PANEL_Y = 504;
const PANEL_W = 944;
const PANEL_H = 148;
const INNER_X = 24;
const INNER_W = 912;
const BAR_Y = 582;
const BAR_H = 12;
const SEGMENT_W = INNER_W / AGES.length;

export function renderHud(state: CivilizationState, palette: Palette): string {
  const parts: string[] = [];
  parts.push(rect(PANEL_X, PANEL_Y, PANEL_W, PANEL_H, palette.outline));
  parts.push(rect(PANEL_X + 2, PANEL_Y + 2, PANEL_W - 4, PANEL_H - 4, palette.hudBg));
  parts.push(rect(PANEL_X + 2, PANEL_Y + 2, PANEL_W - 4, 2, palette.hudBorder));
  parts.push(rect(PANEL_X + 2, PANEL_Y + PANEL_H - 5, PANEL_W - 4, 3, palette.hudBg2));
  for (const [x, y] of [
    [PANEL_X + 2, PANEL_Y + 2],
    [PANEL_X + PANEL_W - 10, PANEL_Y + 2],
    [PANEL_X + 2, PANEL_Y + PANEL_H - 10],
    [PANEL_X + PANEL_W - 10, PANEL_Y + PANEL_H - 10],
  ] as const) {
    parts.push(rect(x, y, 8, 8, palette.hudBorder));
  }

  const bananaValue = displayNumber(state.bananas);
  parts.push(drawBananaIcon(INNER_X, 518, 3, palette));
  parts.push(pixelText('BANANAS', INNER_X + 32, 518, 2, palette.hudDim));
  parts.push(pixelText(bananaValue, INNER_X + 32, 534, 3, palette.hudText));
  parts.push(
    pixelText(`+${displayNumber(state.bananaIncome)} / DAY`, INNER_X + 32, 560, 2, palette.hudAccent2),
  );

  parts.push(drawMonkeyFaceIcon(INNER_X + 236, 518, 3, palette));
  parts.push(pixelText('POPULATION', INNER_X + 268, 518, 2, palette.hudDim));
  parts.push(pixelText(String(state.population), INNER_X + 268, 534, 3, palette.hudText));
  parts.push(
    pixelText(`CAP ${state.capacity}`, INNER_X + 268, 560, 2, palette.hudAccent2),
  );

  parts.push(drawAgeIcon(state.age.id, INNER_X + 466, 518, 3, palette));
  parts.push(pixelText('CIVILIZATION', INNER_X + 500, 518, 2, palette.hudDim));
  parts.push(pixelText(state.age.name, INNER_X + 500, 534, 2, palette.hudAccent));
  const progressText =
    state.nextAge === null
      ? `LVL ${state.level} * MAX`
      : `LVL ${state.level} * ${formatPercent(state.ageProgress)}`;
  parts.push(pixelText(progressText, INNER_X + 500, 556, 2, palette.hudDim));

  parts.push(drawContributionIcon(INNER_X + 690, 518, 3, palette));
  parts.push(pixelText('CONTRIBUTIONS', INNER_X + 724, 518, 2, palette.hudDim));
  parts.push(pixelText(displayNumber(state.totalContributions), INNER_X + 724, 534, 3, palette.hudText));
  parts.push(
    pixelText(`${state.stats.activeDays} ACTIVE DAYS`, INNER_X + 724, 560, 2, palette.hudAccent2),
  );

  parts.push(renderProgressBar(state, palette));
  parts.push(renderTicker(state, palette));

  return parts.join('');
}

function renderProgressBar(state: CivilizationState, palette: Palette): string {
  const parts: string[] = [];
  parts.push(rect(INNER_X - 2, BAR_Y - 2, INNER_W + 4, BAR_H + 4, palette.outline));
  parts.push(rect(INNER_X, BAR_Y, INNER_W, BAR_H, palette.hudBg2));

  AGES.forEach((age, index) => {
    const x = INNER_X + index * SEGMENT_W;
    const completed = index < state.ageIndex;
    const current = index === state.ageIndex;
    const fill = completed ? 1 : current ? state.ageProgress : 0;
    parts.push(
      rect(
        x + 2,
        BAR_Y + 2,
        Math.max(0, (SEGMENT_W - 4) * fill),
        BAR_H - 4,
        completed ? age.accent2 : age.accent,
      ),
    );
    parts.push(rect(x, BAR_Y - 3, 2, BAR_H + 6, palette.hudBg));
    const labelWidth = pixelTextWidth(age.shortName, 2);
    const labelX = x + (SEGMENT_W - labelWidth) / 2;
    const labelColor = current ? palette.hudAccent : completed ? palette.hudAccent2 : palette.hudDim;
    parts.push(pixelText(age.shortName, labelX, BAR_Y + BAR_H + 4, 2, labelColor));
  });

  const markerX = INNER_X + state.ageIndex * SEGMENT_W + state.ageProgress * SEGMENT_W;
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
  return parts.join('');
}

function renderTicker(state: CivilizationState, palette: Palette): string {
  const text = truncatePixelText(state.lastEvent.text, INNER_W - 16, 2);
  return `${pixelText('>', INNER_X, 626, 2, palette.hudAccent)}${pixelText(
    text,
    INNER_X + 16,
    626,
    2,
    palette.hudText,
  )}`;
}

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

function displayNumber(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  }
  return formatNumber(value);
}
