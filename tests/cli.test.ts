import assert from 'node:assert/strict';
import test from 'node:test';
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const ROOT = fileURLToPath(new URL('..', import.meta.url));

test('CLI generates a demo SVG and JSON summary', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'monkey-cli-'));
  try {
    const svgPath = join(dir, 'monkey.svg');
    const jsonPath = join(dir, 'monkey.json');
    const { stdout } = await execFileAsync(
      process.execPath,
      ['src/cli.ts', '--demo', 'medieval', '--out', svgPath, '--json', jsonPath],
      { cwd: ROOT, timeout: 60_000 },
    );

    assert.match(stdout, /Monkey Civilization generated:/);
    assert.match(stdout, /MEDIEVAL AGE/);
    assert.match(stdout, /SVG compatibility: PASS/);

    const svg = await readFile(svgPath, 'utf8');
    assert.ok(svg.startsWith('<svg '));
    assert.ok(svg.includes('@keyframes'));
    assert.ok(svg.includes('MEDIEVAL AGE'));

    const summary = JSON.parse(await readFile(jsonPath, 'utf8')) as {
      username: string;
      age: string;
      population: number;
      contributions: number;
      buildings: Array<{ id: string; level: number }>;
      lastEvent: string;
    };
    assert.equal(summary.username, 'demo-medieval');
    assert.equal(summary.age, 'MEDIEVAL AGE');
    assert.equal(summary.contributions, 205);
    assert.ok(summary.population > 0);
    assert.ok(summary.buildings.length >= 3);
    assert.ok(summary.lastEvent.length > 0);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('CLI static mode removes animations', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'monkey-cli-static-'));
  try {
    const svgPath = join(dir, 'static.svg');
    await execFileAsync(
      process.execPath,
      ['src/cli.ts', '--demo=stone', '--no-animation', '--out', svgPath],
      { cwd: ROOT, timeout: 60_000 },
    );
    const svg = await readFile(svgPath, 'utf8');
    assert.ok(!svg.includes('@keyframes'));
    assert.ok(!svg.includes('animation:'));
    assert.ok(svg.includes('STONE AGE'));
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('CLI help and error handling', async () => {
  const help = await execFileAsync(process.execPath, ['src/cli.ts', '--help'], {
    cwd: ROOT,
    timeout: 30_000,
  });
  assert.match(help.stdout, /Usage:/);
  assert.match(help.stdout, /--demo \[profile\]/);

  await assert.rejects(
    execFileAsync(process.execPath, ['src/cli.ts', '--not-a-real-flag'], {
      cwd: ROOT,
      timeout: 30_000,
    }),
    (error: unknown) => {
      const execError = error as { code?: number; stderr?: string };
      assert.equal(execError.code, 1);
      assert.match(execError.stderr ?? '', /Unknown option/);
      return true;
    },
  );
});
