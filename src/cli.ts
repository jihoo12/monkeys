import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fetchContributionHistory } from './data/contributions.ts';
import { DEMO_PROFILES, demoHistory, type DemoProfile } from './data/demo.ts';
import { simulateCivilization } from './sim/engine.ts';
import { renderCivilization } from './render/render.ts';
import { checkSvgCompatibility, formatCompatibilityReport } from './compat.ts';
import { formatNumber } from './util/date.ts';

interface CliOptions {
  demo: DemoProfile | null;
  user: string | null;
  token: string | null;
  out: string;
  from?: string;
  to?: string;
  json?: string;
  animation: boolean;
  help: boolean;
}

const HELP = `Monkey Civilization - a GitHub contribution-powered pixel civilization

Usage:
  npm run generate -- --user <github-login> [options]
  npm run generate -- --demo [profile] [options]

Options:
  -u, --user <login>       GitHub username (or GITHUB_USER)
      --token <token>      GitHub token (or GITHUB_TOKEN / GH_TOKEN)
      --demo [profile]     Use reproducible demo data. Profiles:
                           stone, medieval, industrial, modern, space (default: space)
  -o, --out <path>         Output SVG path (default: monkey-civilization.svg)
      --from <YYYY-MM-DD>  First day of the contribution window
      --to <YYYY-MM-DD>    Last day of the contribution window (default: today UTC)
      --json <path>        Also write a small simulation summary as JSON
      --no-animation       Emit a static SVG (animations are progressive enhancement)
  -h, --help               Show this help

Examples:
  npm run generate -- --demo --out examples/monkey-civilization.svg
  GITHUB_TOKEN=ghp_... npm run generate -- --user octocat --out monkey-civilization.svg

The generated SVG is self-contained. It uses only inline shapes, paths and CSS.`;

export async function main(argv = process.argv.slice(2)): Promise<number> {
  const options = parseArgs(argv);
  if (options.help) {
    console.log(HELP);
    return 0;
  }

  const history = options.demo
    ? demoHistory(options.demo)
    : await loadRealHistory(options);
  const state = simulateCivilization(history);
  const svg = renderCivilization(state, history, { animation: options.animation });
  const report = checkSvgCompatibility(svg);

  const outPath = resolve(options.out);
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, `${svg}\n`, 'utf8');

  if (options.json) {
    const jsonPath = resolve(options.json);
    await mkdir(dirname(jsonPath), { recursive: true });
    await writeFile(
      jsonPath,
      `${JSON.stringify(
        {
          username: state.username,
          seed: state.seed,
          age: state.age.name,
          level: state.level,
          population: state.population,
          capacity: state.capacity,
          bananas: Math.round(state.bananas),
          contributions: state.totalContributions,
          activeDays: state.stats.activeDays,
          buildings: state.slots.filter((slot) => slot.unlocked).map((slot) => ({
            id: slot.id,
            level: slot.level,
            builtOnDay: slot.builtOnDay,
          })),
          lastEvent: state.lastEvent.text,
        },
        null,
        2,
      )}\n`,
      'utf8',
    );
  }

  console.log(`Monkey Civilization generated: ${outPath}`);
  console.log(
    `  @${state.username} · ${state.age.name} · population ${state.population} · ${formatNumber(
      state.bananas,
    )} bananas · ${formatNumber(state.totalContributions)} contributions`,
  );
  console.log(
    `  ${state.milestones.buildings} buildings · ${state.stats.activeDays} active days · seed ${state.seed}`,
  );
  console.log(`  ${formatCompatibilityReport(report)}`);
  return report.ok ? 0 : 1;
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    demo: null,
    user: process.env.GITHUB_USER ?? null,
    token: process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN ?? process.env.MONKEY_TOKEN ?? null,
    out: 'monkey-civilization.svg',
    animation: true,
    help: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg) continue;
    if (arg === '-h' || arg === '--help') {
      options.help = true;
      continue;
    }
    if (arg === '--no-animation') {
      options.animation = false;
      continue;
    }
    if (arg === '--demo' || arg.startsWith('--demo=')) {
      const value = arg.includes('=') ? arg.split('=')[1] : argv[i + 1];
      if (value && !value.startsWith('-') && isDemoProfile(value)) {
        options.demo = value;
        if (!arg.includes('=')) i += 1;
      } else {
        options.demo = 'space';
      }
      continue;
    }
    const [flag, inlineValue] = arg.includes('=') ? arg.split('=', 2) : [arg, undefined];
    const value = inlineValue ?? argv[i + 1];
    switch (flag) {
      case '-u':
      case '--user':
        if (!value) throw new Error(`${flag} requires a value`);
        options.user = value;
        if (!inlineValue) i += 1;
        break;
      case '--token':
        if (!value) throw new Error('--token requires a value');
        options.token = value;
        if (!inlineValue) i += 1;
        break;
      case '-o':
      case '--out':
        if (!value) throw new Error(`${flag} requires a value`);
        options.out = value;
        if (!inlineValue) i += 1;
        break;
      case '--from':
        if (!value) throw new Error('--from requires a value');
        options.from = value;
        if (!inlineValue) i += 1;
        break;
      case '--to':
        if (!value) throw new Error('--to requires a value');
        options.to = value;
        if (!inlineValue) i += 1;
        break;
      case '--json':
        if (!value) throw new Error('--json requires a value');
        options.json = value;
        if (!inlineValue) i += 1;
        break;
      default:
        throw new Error(`Unknown option: ${arg}\n\n${HELP}`);
    }
  }
  return options;
}

async function loadRealHistory(options: CliOptions) {
  if (!options.user) {
    throw new Error(
      'A GitHub username is required. Use --user <login>, set GITHUB_USER, or run --demo.',
    );
  }
  if (!options.token) {
    throw new Error(
      'A GitHub token is required for the GraphQL API. Set GITHUB_TOKEN, or run --demo for reproducible demo data.',
    );
  }
  console.log(`Fetching contribution history for @${options.user}...`);
  return fetchContributionHistory({
    username: options.user,
    token: options.token,
    from: options.from,
    to: options.to,
  });
}

function isDemoProfile(value: string): value is DemoProfile {
  return Object.prototype.hasOwnProperty.call(DEMO_PROFILES, value);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main()
    .then((code) => {
      process.exitCode = code;
    })
    .catch((error: unknown) => {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    });
}
