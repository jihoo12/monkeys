import type { ContributionDay, ContributionHistory, ContributionLevel } from '../types.ts';
import { addDays, enumerateDays } from '../util/date.ts';
import { createRng, type Rng } from '../util/rng.ts';
import { makeHistory } from './contributions.ts';

/**
 * The demo ends on a fixed date so that `npm run generate:demo` is fully
 * reproducible. Real generations use the last 365 days from the GraphQL API.
 */
export const DEMO_END = '2026-10-26';
export const DEMO_START = addDays(DEMO_END, -364);

export type DemoProfile = 'stone' | 'medieval' | 'industrial' | 'modern' | 'space';

interface DemoConfig {
  seed: number;
  target: number;
  activeChance: number;
  maxPerDay: number;
  weekendFactor: number;
  vacationFactor: number;
  hackathonFactor: number;
  label: string;
}

export const DEMO_PROFILES: Record<DemoProfile, DemoConfig> = {
  stone: {
    seed: 0x5704e,
    target: 44,
    activeChance: 0.12,
    maxPerDay: 2,
    weekendFactor: 0.35,
    vacationFactor: 0.1,
    hackathonFactor: 1.2,
    label: 'A quiet little troop',
  },
  medieval: {
    seed: 0x6ed1,
    target: 205,
    activeChance: 0.34,
    maxPerDay: 4,
    weekendFactor: 0.55,
    vacationFactor: 0.18,
    hackathonFactor: 1.5,
    label: 'Banana trade routes open',
  },
  industrial: {
    seed: 0x1d057,
    target: 620,
    activeChance: 0.55,
    maxPerDay: 6,
    weekendFactor: 0.7,
    vacationFactor: 0.25,
    hackathonFactor: 1.8,
    label: 'Steam-powered banana peels',
  },
  modern: {
    seed: 0x30de2,
    target: 1320,
    activeChance: 0.71,
    maxPerDay: 9,
    weekendFactor: 0.78,
    vacationFactor: 0.3,
    hackathonFactor: 2.1,
    label: 'Wi-Fi reaches the canopy',
  },
  space: {
    seed: 0x5ace2,
    target: 2380,
    activeChance: 0.82,
    maxPerDay: 14,
    weekendFactor: 0.85,
    vacationFactor: 0.35,
    hackathonFactor: 2.4,
    label: 'To the moon, one banana at a time',
  },
};

export function demoHistory(profile: DemoProfile = 'space'): ContributionHistory {
  const config = DEMO_PROFILES[profile];
  const dates = enumerateDays(DEMO_START, DEMO_END);
  const rng = createRng(config.seed);
  const raw: number[] = dates.map((_, index) => rawDay(rng, index, config));

  const rawTotal = raw.reduce((sum, value) => sum + value, 0);
  const scale = rawTotal === 0 ? 0 : config.target / rawTotal;
  const counts = raw.map((value) => Math.max(0, Math.round(value * scale)));

  // Make the profile land on its advertised total exactly. This keeps the
  // gallery stable and makes age thresholds easy to demonstrate.
  let total = counts.reduce((sum, value) => sum + value, 0);
  let guard = 0;
  while (total !== config.target && guard < 100_000) {
    guard += 1;
    const index = Math.floor(rng() * counts.length);
    const current = counts[index] ?? 0;
    if (total < config.target) {
      counts[index] = current + 1;
      total += 1;
    } else if (current > 0) {
      counts[index] = current - 1;
      total -= 1;
    }
  }

  const max = Math.max(1, ...counts);
  const days: ContributionDay[] = dates.map((date, index) => {
    const count = counts[index] ?? 0;
    return { date, count, level: levelForCount(count, max) };
  });

  return makeHistory({
    username: `demo-${profile}`,
    days,
    from: DEMO_START,
    to: DEMO_END,
    source: 'demo',
  });
}

function rawDay(rng: Rng, index: number, config: DemoConfig): number {
  const date = new Date(`${DEMO_START}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + index);
  const weekday = date.getUTCDay();
  const isWeekend = weekday === 0 || weekday === 6;

  // Long seasons, a summer break, a conference week, a hackathon and a
  // late-year sprint. These are cosmetic but make the history feel human.
  const season = 0.82 + 0.28 * Math.sin((index / 365) * Math.PI * 2 - 0.8);
  const monthly = 0.9 + 0.12 * Math.sin((index / 30.4) * Math.PI * 2 + 1.7);
  const vacation = index >= 78 && index <= 94 ? config.vacationFactor : 1;
  const conference = index >= 118 && index <= 125 ? 0.35 : 1;
  const hackathon = index >= 246 && index <= 261 ? config.hackathonFactor : 1;
  const sprint = index >= 300 && index <= 338 ? 1.28 : 1;
  const weekend = isWeekend ? config.weekendFactor : 1;
  const noise = 0.55 + rng() * 0.9;

  const activity =
    config.activeChance * season * monthly * vacation * conference * hackathon * sprint * weekend;
  if (rng() > Math.min(0.98, activity)) {
    return 0;
  }

  const magnitude =
    1 + Math.floor(rng() * Math.max(1, config.maxPerDay) * season * hackathon * noise);
  return magnitude;
}

export function levelForCount(count: number, max: number): ContributionLevel {
  if (count <= 0) return 0;
  const ratio = count / Math.max(1, max);
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
}
