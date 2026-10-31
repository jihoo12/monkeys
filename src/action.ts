import { appendFile } from 'node:fs/promises';
import { isAbsolute, relative, resolve } from 'node:path';
import { formatCompatibilityReport } from './compat.ts';
import { generateCivilization, type GenerateResult } from './generate.ts';
import { parseHolidayOption } from './render/holidays.ts';
import { formatNumber } from './util/date.ts';

const FALSE_VALUES = new Set(['false', '0', 'no', 'off']);

/**
 * GitHub Action entry point.
 *
 * The composite action in action.yml passes its inputs as INPUT_* environment
 * variables and runs this file from $GITHUB_ACTION_PATH, so imports resolve
 * inside the action checkout rather than the caller's repository.
 */
async function main(): Promise<void> {
  const workspace = process.env.GITHUB_WORKSPACE?.trim() || process.cwd();
  const token =
    readInput('GITHUB_TOKEN') ||
    process.env.GITHUB_TOKEN?.trim() ||
    process.env.MONKEY_TOKEN?.trim() ||
    '';
  const username = (
    readInput('USERNAME') ||
    process.env.GITHUB_REPOSITORY_OWNER?.trim() ||
    process.env.GITHUB_REPOSITORY?.split('/')[0]?.trim() ||
    ''
  ).replace(/^@/, '');
  const output = readInput('OUTPUT') || 'monkey-civilization.svg';
  const jsonOutput = readInput('JSON_OUTPUT');
  const animate = !FALSE_VALUES.has(readInput('ANIMATE').toLowerCase());
  const holiday = parseHolidayOption(readInput('HOLIDAY') || 'auto');

  if (!token) {
    fail(
      'github_token is required. Pass secrets.GITHUB_TOKEN, or a classic PAT with read:user if the automatic token cannot read the contribution calendar.',
    );
    return;
  }
  if (!username) {
    fail('username is required (or set GITHUB_REPOSITORY_OWNER in the environment).');
    return;
  }

  const result = await generateCivilization({
    username,
    token,
    out: resolveFromWorkspace(workspace, output),
    json: jsonOutput ? resolveFromWorkspace(workspace, jsonOutput) : undefined,
    animation: animate,
    holiday,
    endpoint: graphqlEndpoint(),
  });

  await publishResult(result, workspace);

  if (!result.report.ok) {
    fail(
      `Generated SVG failed the GitHub compatibility check: ${formatCompatibilityReport(
        result.report,
      )}`,
    );
  }
}

function readInput(name: string): string {
  return (process.env[`INPUT_${name}`] ?? '').trim();
}

function resolveFromWorkspace(workspace: string, path: string): string {
  return isAbsolute(path) ? path : resolve(workspace, path);
}

function displayPath(workspace: string, path: string): string {
  const relativePath = relative(workspace, path);
  if (relativePath && !relativePath.startsWith('..') && !isAbsolute(relativePath)) {
    return relativePath;
  }
  return path;
}

function graphqlEndpoint(): string | undefined {
  const override = process.env.MONKEY_GRAPHQL_URL?.trim();
  if (override) return override;
  const server = process.env.GITHUB_SERVER_URL?.trim();
  if (server && server !== 'https://github.com') {
    return `${server.replace(/\/$/, '')}/api/graphql`;
  }
  return undefined;
}

async function publishResult(result: GenerateResult, workspace: string): Promise<void> {
  const { state, report } = result;
  const svgPath = displayPath(workspace, result.outPath);
  const jsonPath = result.jsonPath ? displayPath(workspace, result.jsonPath) : '';

  console.log(`Monkey Civilization generated: ${result.outPath}`);
  console.log(
    `  @${state.username} · ${state.age.name} · population ${state.population} · ${formatNumber(
      state.bananas,
    )} bananas · ${formatNumber(state.totalContributions)} contributions`,
  );
  console.log(
    `  ${state.milestones.buildings} buildings · ${state.stats.activeDays} active days · seed ${state.seed}`,
  );
  if (result.holiday) console.log(`  Holiday theme: ${result.holiday.name}`);
  console.log(`  ${formatCompatibilityReport(report)}`);

  await setOutput('svg_path', result.outPath);
  await setOutput('json_path', result.jsonPath ?? '');
  await setOutput('age', state.age.name);
  await setOutput('population', String(state.population));
  await setOutput('contributions', String(state.totalContributions));
  await setOutput('buildings', String(state.milestones.buildings));
  await setOutput('holiday', result.holiday?.name ?? '');

  await writeSummary(
    [
      '## Monkey Civilization',
      '',
      `**${state.age.name}** · population **${state.population}** · ${formatNumber(
        state.bananas,
      )} bananas · ${formatNumber(state.totalContributions)} contributions`,
      '',
      `- SVG: \`${svgPath}\``,
      ...(jsonPath ? [`- JSON: \`${jsonPath}\``] : []),
      ...(result.holiday ? [`- Holiday theme: ${result.holiday.name}`] : []),
      `- Seed: \`${state.seed}\``,
      `- Compatibility: ${report.ok ? 'pass' : 'FAIL'}`,
      '',
    ].join('\n'),
  );
}

async function setOutput(name: string, value: string): Promise<void> {
  const outputFile = process.env.GITHUB_OUTPUT;
  if (!outputFile) return;
  await appendFile(outputFile, `${name}=${value}\n`, 'utf8');
}

async function writeSummary(markdown: string): Promise<void> {
  const summaryFile = process.env.GITHUB_STEP_SUMMARY;
  if (!summaryFile) return;
  await appendFile(summaryFile, markdown, 'utf8');
}

function fail(message: string): void {
  console.error(`::error::${escapeCommand(message)}`);
  process.exitCode = 1;
}

function escapeCommand(value: string): string {
  return value.replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  const hint =
    /\b(401|403|404)\b|not visible|Could not resolve|Resource not accessible|FORBIDDEN/i.test(
      message,
    )
      ? '\n\nHint: the token may not be able to read this contribution calendar. Use a classic PAT with read:user as github_token, and check that the username exists.'
      : '';
  fail(`${message}${hint}`);
});
