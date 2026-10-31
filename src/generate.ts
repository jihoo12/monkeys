import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { checkSvgCompatibility, type CompatibilityReport } from './compat.ts';
import { fetchContributionHistory } from './data/contributions.ts';
import { demoHistory, type DemoProfile } from './data/demo.ts';
import { renderCivilization } from './render/render.ts';
import { resolveHoliday, type HolidayDefinition, type HolidayOption } from './render/holidays.ts';
import { simulateCivilization } from './sim/engine.ts';
import type { CivilizationState, ContributionHistory } from './types.ts';

export interface GenerateOptions {
  /** Output SVG path. Resolved against the current working directory. */
  out: string;
  username?: string | null;
  token?: string | null;
  /** Use a reproducible demo history instead of the GitHub API. */
  demo?: DemoProfile | null;
  from?: string;
  to?: string;
  /** Optional path for a machine-readable summary. */
  json?: string;
  /** Set to false to emit a fully static SVG. Defaults to true. */
  animation?: boolean;
  /**
   * Holiday theme: `auto` (default) uses the last day of the window and only
   * widely shared holidays, `all` adds regional ones, `none` disables it, or
   * pass an explicit holiday id.
   */
  holiday?: HolidayOption;
  /** Override the GraphQL endpoint (GitHub Enterprise, tests). */
  endpoint?: string;
  fetchImpl?: typeof fetch;
}

export interface CivilizationSummary {
  username: string;
  seed: string;
  age: string;
  level: number;
  population: number;
  capacity: number;
  bananas: number;
  contributions: number;
  activeDays: number;
  buildings: Array<{ id: string; level: number; builtOnDay: number | null }>;
  holiday: string | null;
  lastEvent: string;
}

export interface GenerateResult {
  svg: string;
  state: CivilizationState;
  history: ContributionHistory;
  holiday: HolidayDefinition | null;
  report: CompatibilityReport;
  outPath: string;
  jsonPath?: string;
}

/**
 * Shared generation pipeline used by the CLI and the GitHub Action.
 *
 * Everything is written to paths resolved against the current working
 * directory, so callers can point the output at any workspace.
 */
export async function generateCivilization(options: GenerateOptions): Promise<GenerateResult> {
  const history = options.demo ? demoHistory(options.demo) : await loadHistory(options);
  const state = simulateCivilization(history);
  const holiday = resolveHoliday(options.holiday, history.to);
  const svg = renderCivilization(state, history, {
    animation: options.animation ?? true,
    holiday: holiday?.id ?? 'none',
  });
  const report = checkSvgCompatibility(svg);

  const outPath = resolve(options.out);
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, `${svg}\n`, 'utf8');

  let jsonPath: string | undefined;
  if (options.json) {
    jsonPath = resolve(options.json);
    await mkdir(dirname(jsonPath), { recursive: true });
    await writeFile(
      jsonPath,
      `${JSON.stringify(summarizeCivilization(state, holiday), null, 2)}\n`,
      'utf8',
    );
  }

  return { svg, state, history, holiday, report, outPath, jsonPath };
}

export function summarizeCivilization(
  state: CivilizationState,
  holiday: HolidayDefinition | null = null,
): CivilizationSummary {
  return {
    username: state.username,
    seed: state.seed,
    age: state.age.name,
    level: state.level,
    population: state.population,
    capacity: state.capacity,
    bananas: Math.round(state.bananas),
    contributions: state.totalContributions,
    activeDays: state.stats.activeDays,
    buildings: state.slots
      .filter((slot) => slot.unlocked)
      .map((slot) => ({
        id: slot.id,
        level: slot.level,
        builtOnDay: slot.builtOnDay,
      })),
    holiday: holiday?.name ?? null,
    lastEvent: state.lastEvent.text,
  };
}

async function loadHistory(options: GenerateOptions): Promise<ContributionHistory> {
  if (!options.username) {
    throw new Error(
      'A GitHub username is required. Use --user <login>, set GITHUB_USER, or run --demo.',
    );
  }
  if (!options.token) {
    throw new Error(
      'A GitHub token is required for the GraphQL API. Set GITHUB_TOKEN, or run --demo for reproducible demo data.',
    );
  }
  console.log(`Fetching contribution history for @${options.username}...`);
  return fetchContributionHistory({
    username: options.username,
    token: options.token,
    from: options.from,
    to: options.to,
    endpoint: options.endpoint,
    fetchImpl: options.fetchImpl,
  });
}
