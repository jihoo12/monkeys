import assert from 'node:assert/strict';
import test from 'node:test';
import { DEMO_PROFILES, demoHistory, type DemoProfile } from '../src/data/demo.ts';
import { makeHistory } from '../src/data/contributions.ts';
import { simulateCivilization } from '../src/sim/engine.ts';
import { renderCivilization } from '../src/render/render.ts';
import { checkSvgCompatibility } from '../src/compat.ts';
import type { ContributionDay } from '../src/types.ts';

const PROFILES = Object.keys(DEMO_PROFILES) as DemoProfile[];

function renderProfile(profile: DemoProfile, animation = true): string {
  const history = demoHistory(profile);
  const state = simulateCivilization(history);
  return renderCivilization(state, history, { animation });
}

test('rendered SVGs are deterministic, self-contained and GitHub-safe', () => {
  for (const profile of PROFILES) {
    const first = renderProfile(profile);
    const second = renderProfile(profile);
    assert.equal(first, second, `${profile} SVG is not deterministic`);

    assert.ok(first.startsWith('<svg xmlns="http://www.w3.org/2000/svg"'));
    assert.ok(first.includes('viewBox="0 0 960 660"'));
    assert.ok(first.includes('role="img"'));
    assert.ok(first.includes('<title id="mc-title">'));
    assert.ok(first.includes('<desc id="mc-desc">'));
    assert.ok(first.includes('aria-labelledby="mc-title mc-desc"'));
    assert.ok(!first.includes('<script'));
    assert.ok(!first.includes('<image'));
    assert.ok(!first.includes('<foreignObject'));
    assert.ok(!first.includes('<text'));
    assert.ok(!first.includes('@font-face'));
    assert.ok(!/href\s*=\s*"https?:/i.test(first));

    const report = checkSvgCompatibility(first);
    assert.equal(report.ok, true, `${profile} failed compatibility: ${JSON.stringify(report.issues)}`);
    assert.equal(report.issues.filter((issue) => issue.level === 'error').length, 0);
    assert.ok(report.stats.keyframes > 0, `${profile} should animate`);
    assert.ok(report.stats.animationDeclarations > 0);
    assert.ok(report.stats.gradients > 0);
    assert.ok(report.stats.elements > 500);
    assert.ok(report.stats.bytes < 500_000, `${profile} SVG is unexpectedly large`);
  }
});

test('all five ages render visibly different scenes', () => {
  const svgs = PROFILES.map((profile) => renderProfile(profile));
  assert.equal(new Set(svgs).size, svgs.length);
  for (let i = 0; i < svgs.length; i += 1) {
    const svg = svgs[i]!;
    const profile = PROFILES[i]!;
    const state = simulateCivilization(demoHistory(profile));
    assert.ok(svg.includes(`class="age-${state.age.id}"`));
    assert.ok(svg.includes(state.age.name));
    assert.ok(svg.includes(`@${state.username}`));
  }
});

test('monkey count in the SVG matches the visible population', () => {
  for (const profile of PROFILES) {
    const history = demoHistory(profile);
    const state = simulateCivilization(history);
    const svg = renderCivilization(state, history);
    const monkeyGroups = svg.match(/class="monkey(?:\s|")/g) ?? [];
    assert.equal(monkeyGroups.length, state.visibleMonkeys.length, `${profile} monkey count`);
    assert.ok(svg.includes('class="tail"'));
    assert.ok(svg.includes('class="leg leg-l"'));
    assert.ok(svg.includes('class="arm arm-r"'));
  }
});

test('static mode removes every animation while keeping the scene', () => {
  const animated = renderProfile('space', true);
  const staticSvg = renderProfile('space', false);

  assert.ok(animated.includes('@keyframes'));
  assert.ok(animated.includes('animation-name:'));
  assert.ok(animated.includes('prefers-reduced-motion'));

  assert.ok(!staticSvg.includes('@keyframes'));
  assert.ok(!staticSvg.includes('animation:'));
  assert.ok(!staticSvg.includes('animation-name:'));
  assert.ok(staticSvg.includes('.moon,.firefly,.shooting-star,.night{display:none}'));
  assert.ok(staticSvg.includes('Monkey Civilization'));
  assert.ok(staticSvg.includes('class="monkey'));

  const report = checkSvgCompatibility(staticSvg);
  assert.equal(report.ok, true);
  assert.ok(report.issues.some((issue) => issue.code === 'no-animation'));
});

test('scene labels and age-specific details are present', () => {
  const space = renderProfile('space');
  assert.ok(space.includes('class="planet"'));
  assert.ok(space.includes('class="tree-sway"'));
  assert.ok(space.includes('class="orbit"'));
  assert.ok(space.includes('class="energy-arc"'));
  assert.ok(space.includes('class="orbit-ring"'));
  assert.ok(space.includes('class="star"'));
  assert.ok(space.includes('class="shooting-star"'));
  assert.ok(space.includes('SPACE AGE'));

  const stone = renderProfile('stone');
  assert.ok(stone.includes('class="flame"'));
  assert.ok(stone.includes('class="tree-sway"'));
  assert.ok(stone.includes('opacity="0.85"'));
  assert.ok(stone.includes('STONE AGE'));
});

test('username text is escaped in the SVG metadata', () => {
  const days: ContributionDay[] = [
    { date: '2026-01-01', count: 1, level: 1 },
    { date: '2026-01-02', count: 0, level: 0 },
  ];
  const history = makeHistory({
    username: 'bad<&"monkey',
    days,
    from: '2026-01-01',
    to: '2026-01-02',
    source: 'demo',
  });
  const state = simulateCivilization(history);
  const svg = renderCivilization(state, history, { animation: false });
  assert.ok(svg.includes('@bad&lt;&amp;&quot;monkey'));
  assert.ok(!svg.includes('@bad<&"monkey'));
});
