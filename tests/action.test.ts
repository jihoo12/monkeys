import assert from 'node:assert/strict';
import test from 'node:test';
import { execFile } from 'node:child_process';
import { createServer } from 'node:http';
import { cp, mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { parse } from 'yaml';
import { addDays } from '../src/util/date.ts';

const execFileAsync = promisify(execFile);
const ROOT = fileURLToPath(new URL('..', import.meta.url));
const FIXTURE = join(ROOT, 'tests', 'fixtures', 'consumer');

interface FakeGitHub {
  url: string;
  requests: Array<{
    authorization: string | undefined;
    login: string;
    from: string;
    to: string;
  }>;
  close: () => Promise<void>;
}

async function startFakeGitHub(status = 200): Promise<FakeGitHub> {
  const requests: FakeGitHub['requests'] = [];
  const server = createServer((request, response) => {
    let body = '';
    request.on('data', (chunk) => {
      body += String(chunk);
    });
    request.on('end', () => {
      const payload = JSON.parse(body) as {
        variables: { login: string; from: string; to: string };
      };
      const { login, from, to } = payload.variables;
      requests.push({
        authorization: request.headers.authorization,
        login,
        from,
        to,
      });

      if (status !== 200) {
        response.writeHead(status, { 'content-type': 'application/json' });
        response.end(JSON.stringify({ message: 'Bad credentials' }));
        return;
      }

      const start = from.slice(0, 10);
      const end = to.slice(0, 10);
      const days: Array<{
        date: string;
        contributionCount: number;
        contributionLevel: string;
      }> = [];
      let date = start;
      let index = 0;
      while (date <= end) {
        const count = index % 7 === 0 ? 0 : (index % 5) + 1;
        days.push({
          date,
          contributionCount: count,
          contributionLevel: count === 0 ? 'NONE' : 'FIRST_QUARTILE',
        });
        date = addDays(date, 1);
        index += 1;
      }

      response.writeHead(200, { 'content-type': 'application/json' });
      response.end(
        JSON.stringify({
          data: {
            user: {
              login,
              contributionsCollection: {
                contributionCalendar: {
                  totalContributions: days.reduce((sum, day) => sum + day.contributionCount, 0),
                  weeks: [{ contributionDays: days }],
                },
                totalCommitContributions: 0,
                totalIssueContributions: 0,
                totalPullRequestContributions: 0,
                totalPullRequestReviewContributions: 0,
                restrictedContributionsCount: 0,
              },
            },
          },
        }),
      );
    });
  });

  await new Promise<void>((resolvePromise) => {
    server.listen(0, '127.0.0.1', resolvePromise);
  });
  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Failed to start fake GitHub server');
  }

  return {
    url: `http://127.0.0.1:${address.port}/graphql`,
    requests,
    close: () =>
      new Promise<void>((resolvePromise, rejectPromise) => {
        server.close((error) => (error ? rejectPromise(error) : resolvePromise()));
      }),
  };
}

/**
 * Simulates the runner layout: the action lives in one directory (like
 * _actions/jihoo12/monkeys/v1) and the caller's repository lives in another.
 */
async function prepareRunner(
  useFixture = true,
): Promise<{ root: string; actionDir: string; workspace: string }> {
  const root = await mkdtemp(join(tmpdir(), 'monkey-action-'));
  const actionDir = join(root, '_actions', 'jihoo12', 'monkeys', 'v1');
  const workspace = join(root, 'consumer-repo');

  await cp(join(ROOT, 'src'), join(actionDir, 'src'), { recursive: true });
  await cp(join(ROOT, 'package.json'), join(actionDir, 'package.json'));
  await cp(join(ROOT, 'action.yml'), join(actionDir, 'action.yml'));
  if (useFixture) {
    await cp(FIXTURE, workspace, { recursive: true });
  } else {
    await mkdir(workspace, { recursive: true });
  }

  return { root, actionDir, workspace };
}

function cleanEnvironment(): NodeJS.ProcessEnv {
  const env = { ...process.env };
  for (const key of [
    'GITHUB_TOKEN',
    'GH_TOKEN',
    'MONKEY_TOKEN',
    'GITHUB_USER',
    'GITHUB_REPOSITORY',
    'GITHUB_REPOSITORY_OWNER',
    'GITHUB_OUTPUT',
    'GITHUB_STEP_SUMMARY',
    'GITHUB_SERVER_URL',
    'MONKEY_GRAPHQL_URL',
    'INPUT_GITHUB_TOKEN',
    'INPUT_USERNAME',
    'INPUT_OUTPUT',
    'INPUT_JSON_OUTPUT',
    'INPUT_ANIMATE',
    'INPUT_HOLIDAY',
  ]) {
    delete env[key];
  }
  return env;
}

interface ActionRun {
  code: number;
  stdout: string;
  stderr: string;
}

async function runAction(
  actionDir: string,
  workspace: string,
  env: NodeJS.ProcessEnv,
): Promise<ActionRun> {
  try {
    const result = await execFileAsync(process.execPath, [join(actionDir, 'src', 'action.ts')], {
      cwd: workspace,
      env,
      timeout: 60_000,
    });
    return { code: 0, stdout: result.stdout, stderr: result.stderr };
  } catch (error) {
    const failure = error as { code?: number; stdout?: string; stderr?: string };
    return {
      code: failure.code ?? 1,
      stdout: failure.stdout ?? '',
      stderr: failure.stderr ?? '',
    };
  }
}

async function exists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

test('action generates into a separate consumer workspace', async () => {
  const github = await startFakeGitHub();
  const { root, actionDir, workspace } = await prepareRunner();
  const outputFile = join(root, 'github-output.txt');
  const summaryFile = join(root, 'step-summary.md');
  const originalManifest = await readFile(join(workspace, 'package.json'), 'utf8');
  await writeFile(join(workspace, '.env'), 'GITHUB_TOKEN=from-dotenv\nGITHUB_USER=from-dotenv\n');

  try {
    const run = await runAction(actionDir, workspace, {
      ...cleanEnvironment(),
      GITHUB_ACTION_PATH: actionDir,
      GITHUB_WORKSPACE: workspace,
      GITHUB_OUTPUT: outputFile,
      GITHUB_STEP_SUMMARY: summaryFile,
      GITHUB_REPOSITORY_OWNER: 'consumer-owner',
      INPUT_GITHUB_TOKEN: 'test-token',
      INPUT_USERNAME: 'fake-user',
      INPUT_OUTPUT: 'art/monkeys.svg',
      INPUT_JSON_OUTPUT: 'art/monkeys.json',
      INPUT_ANIMATE: 'true',
      INPUT_HOLIDAY: 'halloween',
      MONKEY_GRAPHQL_URL: github.url,
    });

    assert.equal(run.code, 0, run.stderr);
    assert.match(run.stdout, /Monkey Civilization generated:/);
    assert.match(run.stdout, /SVG compatibility: PASS/);

    const svgPath = join(workspace, 'art', 'monkeys.svg');
    const jsonPath = join(workspace, 'art', 'monkeys.json');
    assert.ok(await exists(svgPath), 'SVG should be written into the caller workspace');
    assert.ok(await exists(jsonPath), 'JSON should be written into the caller workspace');

    const svg = await readFile(svgPath, 'utf8');
    assert.ok(svg.startsWith('<svg '));
    assert.ok(svg.includes('@keyframes'));

    const summary = JSON.parse(await readFile(jsonPath, 'utf8')) as {
      username: string;
      age: string;
      population: number;
      contributions: number;
      holiday: string | null;
    };
    assert.equal(summary.username, 'fake-user');
    assert.ok(summary.population > 0);
    assert.ok(summary.contributions > 0);
    assert.equal(summary.holiday, 'Halloween');

    const outputs = await readFile(outputFile, 'utf8');
    assert.match(outputs, new RegExp(`^svg_path=${escapeRegExp(svgPath)}$`, 'm'));
    assert.match(outputs, new RegExp(`^json_path=${escapeRegExp(jsonPath)}$`, 'm'));
    assert.match(outputs, new RegExp(`^age=${escapeRegExp(summary.age)}$`, 'm'));
    assert.match(outputs, /^population=\d+$/m);
    assert.match(outputs, /^contributions=\d+$/m);
    assert.match(outputs, /^buildings=\d+$/m);
    assert.match(outputs, /^holiday=Halloween$/m);

    const stepSummary = await readFile(summaryFile, 'utf8');
    assert.match(stepSummary, /## Monkey Civilization/);
    assert.match(stepSummary, new RegExp(escapeRegExp(summary.age)));

    assert.equal(github.requests.length, 1);
    assert.equal(github.requests[0]?.authorization, 'bearer test-token');
    assert.equal(github.requests[0]?.login, 'fake-user');
    assert.match(github.requests[0]?.from ?? '', /T00:00:00Z$/);
    assert.match(github.requests[0]?.to ?? '', /T23:59:59Z$/);

    // The action checkout must stay untouched, and the caller's project must
    // not gain dependencies or modified manifests.
    assert.ok(!(await exists(join(actionDir, 'monkeys.svg'))));
    assert.ok(!(await exists(join(actionDir, 'art'))));
    assert.equal(await readFile(join(workspace, 'package.json'), 'utf8'), originalManifest);
    assert.ok(!(await exists(join(workspace, 'node_modules'))));
  } finally {
    await github.close();
    await rm(root, { recursive: true, force: true });
  }
});

test('action falls back to the repository owner and supports static mode', async () => {
  const github = await startFakeGitHub();
  const { root, actionDir, workspace } = await prepareRunner();

  try {
    const run = await runAction(actionDir, workspace, {
      ...cleanEnvironment(),
      GITHUB_ACTION_PATH: actionDir,
      GITHUB_WORKSPACE: workspace,
      GITHUB_REPOSITORY_OWNER: 'octo-owner',
      INPUT_GITHUB_TOKEN: 'test-token',
      INPUT_ANIMATE: 'false',
      MONKEY_GRAPHQL_URL: github.url,
    });

    assert.equal(run.code, 0, run.stderr);

    const svgPath = join(workspace, 'monkey-civilization.svg');
    assert.ok(await exists(svgPath), 'default output should be monkey-civilization.svg');
    const svg = await readFile(svgPath, 'utf8');
    assert.ok(!svg.includes('@keyframes'));
    assert.ok(!svg.includes('animation:'));
    assert.ok(!(await exists(join(workspace, 'monkey-civilization.json'))));
    assert.equal(github.requests[0]?.login, 'octo-owner');
  } finally {
    await github.close();
    await rm(root, { recursive: true, force: true });
  }
});

test('action works in a bare repository with no package.json (GHES endpoint)', async () => {
  const github = await startFakeGitHub();
  const { root, actionDir, workspace } = await prepareRunner(false);
  await writeFile(join(workspace, 'README.md'), '# Profile\n', 'utf8');

  try {
    const run = await runAction(actionDir, workspace, {
      ...cleanEnvironment(),
      GITHUB_ACTION_PATH: actionDir,
      GITHUB_WORKSPACE: workspace,
      GITHUB_SERVER_URL: new URL(github.url).origin,
      GITHUB_REPOSITORY_OWNER: 'profile-owner',
      INPUT_GITHUB_TOKEN: 'test-token',
      INPUT_OUTPUT: 'monkeys.svg',
    });

    assert.equal(run.code, 0, run.stderr);
    assert.ok(await exists(join(workspace, 'monkeys.svg')));
    assert.ok(!(await exists(join(workspace, 'package.json'))));
    assert.ok(!(await exists(join(workspace, 'node_modules'))));
    assert.equal(github.requests.length, 1);
    assert.equal(github.requests[0]?.login, 'profile-owner');
  } finally {
    await github.close();
    await rm(root, { recursive: true, force: true });
  }
});

test('action fails clearly when github_token is missing', async () => {
  const { root, actionDir, workspace } = await prepareRunner();

  try {
    const run = await runAction(actionDir, workspace, {
      ...cleanEnvironment(),
      GITHUB_ACTION_PATH: actionDir,
      GITHUB_WORKSPACE: workspace,
      INPUT_USERNAME: 'fake-user',
      INPUT_OUTPUT: 'missing-token.svg',
    });

    assert.equal(run.code, 1);
    assert.match(run.stderr, /::error::/);
    assert.match(run.stderr, /github_token is required/);
    assert.ok(!(await exists(join(workspace, 'missing-token.svg'))));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('action fails clearly when no username can be resolved', async () => {
  const { root, actionDir, workspace } = await prepareRunner();

  try {
    const run = await runAction(actionDir, workspace, {
      ...cleanEnvironment(),
      GITHUB_ACTION_PATH: actionDir,
      GITHUB_WORKSPACE: workspace,
      INPUT_GITHUB_TOKEN: 'test-token',
      INPUT_OUTPUT: 'missing-user.svg',
    });

    assert.equal(run.code, 1);
    assert.match(run.stderr, /::error::/);
    assert.match(run.stderr, /username is required/);
    assert.ok(!(await exists(join(workspace, 'missing-user.svg'))));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('action explains token failures with an actionable hint', async () => {
  const github = await startFakeGitHub(401);
  const { root, actionDir, workspace } = await prepareRunner();

  try {
    const run = await runAction(actionDir, workspace, {
      ...cleanEnvironment(),
      GITHUB_ACTION_PATH: actionDir,
      GITHUB_WORKSPACE: workspace,
      GITHUB_REPOSITORY_OWNER: 'octo-owner',
      INPUT_GITHUB_TOKEN: 'bad-token',
      MONKEY_GRAPHQL_URL: github.url,
    });

    assert.equal(run.code, 1);
    assert.match(run.stderr, /::error::/);
    assert.match(run.stderr, /401/);
    assert.match(run.stderr, /classic PAT with read:user/);
  } finally {
    await github.close();
    await rm(root, { recursive: true, force: true });
  }
});

test('action.yml is a composite action with the documented contract', async () => {
  const action = parse(await readFile(join(ROOT, 'action.yml'), 'utf8')) as {
    runs: {
      using: string;
      steps: Array<{
        uses?: string;
        shell?: string;
        run?: string;
        with?: Record<string, unknown>;
        env?: Record<string, string>;
      }>;
    };
    inputs: Record<string, { required?: boolean; default?: string }>;
    outputs: Record<string, { value?: string }>;
  };

  assert.equal(action.runs.using, 'composite');
  assert.deepEqual(Object.keys(action.inputs), [
    'github_token',
    'username',
    'output',
    'json_output',
    'animate',
    'holiday',
  ]);
  assert.equal(action.inputs.github_token?.required, true);
  assert.equal(action.inputs.output?.default, 'monkey-civilization.svg');
  assert.equal(action.inputs.animate?.default, 'true');
  assert.equal(action.inputs.holiday?.default, 'auto');

  const setup = action.runs.steps[0];
  assert.equal(setup?.uses, 'actions/setup-node@v4');
  assert.equal(setup?.with?.['node-version'], '24');

  const generate = action.runs.steps.find((step) => step.run);
  assert.ok(generate, 'a generation step is required');
  assert.equal(generate.shell, 'bash');
  assert.match(generate.run ?? '', /\$GITHUB_ACTION_PATH\/src\/action\.ts/);
  assert.equal(generate.env?.INPUT_GITHUB_TOKEN, '${{ inputs.github_token }}');
  assert.equal(generate.env?.INPUT_USERNAME, '${{ inputs.username }}');
  assert.equal(generate.env?.INPUT_OUTPUT, '${{ inputs.output }}');
  assert.equal(generate.env?.INPUT_JSON_OUTPUT, '${{ inputs.json_output }}');
  assert.equal(generate.env?.INPUT_ANIMATE, '${{ inputs.animate }}');
  assert.equal(generate.env?.INPUT_HOLIDAY, '${{ inputs.holiday }}');

  for (const output of Object.values(action.outputs)) {
    assert.match(output.value ?? '', /steps\.generate\.outputs\./);
  }

  const serialized = JSON.stringify(action.runs.steps);
  assert.ok(!/npm (ci|install)/.test(serialized), 'the action must not install dependencies');
});

test('the example consumer workflow is complete and copy-pasteable', async () => {
  const workflow = parse(
    await readFile(join(ROOT, 'examples', 'consumer-workflow.yml'), 'utf8'),
  ) as {
    on: Record<string, unknown>;
    permissions?: { contents?: string };
    jobs: Record<string, { steps: Array<{ uses?: string; with?: Record<string, string>; run?: string }> }>;
  };

  assert.ok(workflow.on.schedule);
  assert.ok('workflow_dispatch' in workflow.on);
  assert.equal(workflow.permissions?.contents, 'write');

  const steps = Object.values(workflow.jobs)[0]?.steps ?? [];
  const actionStep = steps.find((step) => step.uses === 'jihoo12/monkeys@v1');
  assert.ok(actionStep, 'the workflow must use jihoo12/monkeys@v1');
  assert.equal(actionStep.with?.github_token, '${{ secrets.GITHUB_TOKEN }}');
  assert.equal(actionStep.with?.username, '${{ github.repository_owner }}');
  assert.ok(
    steps.some((step) => step.run?.includes('git commit')),
    'the workflow must commit the generated SVG',
  );
});

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
