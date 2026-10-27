import assert from 'node:assert/strict';
import test from 'node:test';
import { DEMO_PROFILES, DEMO_END, DEMO_START, demoHistory, type DemoProfile } from '../src/data/demo.ts';
import { makeHistory } from '../src/data/contributions.ts';
import { simulateCivilization, daysFromCounts } from '../src/sim/engine.ts';
import { AGES, ageForContributions, nextAgeFor, progressForAge } from '../src/sim/ages.ts';
import type { ContributionDay } from '../src/types.ts';

const PROFILES = Object.keys(DEMO_PROFILES) as DemoProfile[];

test('demo profiles are reproducible and land on their advertised totals', () => {
  assert.equal(DEMO_END, '2026-10-26');
  assert.equal(DEMO_START, '2025-10-27');

  for (const profile of PROFILES) {
    const first = demoHistory(profile);
    const second = demoHistory(profile);
    assert.deepEqual(first, second, `${profile} demo history is not deterministic`);
    assert.equal(first.days.length, 365, `${profile} should cover 365 days`);
    assert.equal(first.totalContributions, DEMO_PROFILES[profile].target);
    assert.equal(first.from, DEMO_START);
    assert.equal(first.to, DEMO_END);
    assert.equal(first.source, 'demo');
    assert.equal(first.stats.total, first.totalContributions);
  }
});

test('age thresholds are inclusive and stable', () => {
  const cases: Array<[number, string]> = [
    [-1, 'stone'],
    [0, 'stone'],
    [74, 'stone'],
    [75, 'medieval'],
    [299, 'medieval'],
    [300, 'industrial'],
    [799, 'industrial'],
    [800, 'modern'],
    [1799, 'modern'],
    [1800, 'space'],
    [999_999, 'space'],
  ];
  for (const [total, id] of cases) {
    assert.equal(ageForContributions(total).id, id, `age for ${total}`);
  }
  assert.deepEqual(
    AGES.map((age) => age.index),
    [0, 1, 2, 3, 4],
  );
  assert.equal(nextAgeFor(AGES[0]!)?.id, 'medieval');
  assert.equal(nextAgeFor(AGES[4]!), null);
});

test('age progress is clamped and reaches 100% in the space age', () => {
  const stone = AGES[0]!;
  const medieval = AGES[1]!;
  const space = AGES[4]!;
  assert.equal(progressForAge(0, stone), 0);
  assert.ok(progressForAge(37, stone) > 0.49 && progressForAge(37, stone) < 0.5);
  assert.equal(progressForAge(75, medieval), 0);
  assert.equal(progressForAge(0, medieval), 0);
  assert.equal(progressForAge(10_000, space), 1);
  assert.equal(progressForAge(10_000, stone), 1);
});

test('simulation is deterministic for the same history', () => {
  for (const profile of PROFILES) {
    const history = demoHistory(profile);
    const first = simulateCivilization(history);
    const second = simulateCivilization(history);
    assert.deepEqual(first, second, `${profile} simulation is not deterministic`);
  }
});

test('demo civilizations satisfy simulation invariants', () => {
  for (const profile of PROFILES) {
    const history = demoHistory(profile);
    const state = simulateCivilization(history);

    assert.equal(state.totalContributions, history.totalContributions);
    assert.equal(state.age.id, ageForContributions(history.totalContributions).id);
    assert.equal(state.ageIndex, state.age.index);
    assert.ok(state.ageProgress >= 0 && state.ageProgress <= 1);
    assert.ok(state.population >= 2, `${profile} population should be at least 2`);
    assert.ok(
      state.population <= state.capacity,
      `${profile} population ${state.population} exceeds capacity ${state.capacity}`,
    );
    assert.ok(state.capacity >= 4);
    assert.ok(state.bananas >= 0);
    assert.ok(Number.isFinite(state.bananas));
    assert.ok(state.bananaIncome >= 0);
    assert.ok(state.bananaUpkeep >= 0);
    assert.equal(state.slots.length, 8);
    assert.equal(state.monkeys.length, state.population);

    assert.ok(state.visibleMonkeys.length >= 2);
    assert.ok(state.visibleMonkeys.length <= 14);
    assert.ok(state.visibleMonkeys.length <= state.population);
    for (const monkey of state.visibleMonkeys) {
      assert.ok(
        state.monkeys.some((candidate) => candidate.id === monkey.id),
        `${profile} visible monkey ${monkey.id} is not part of the population`,
      );
    }

    for (const slot of state.slots) {
      if (slot.unlocked) {
        assert.ok(slot.level >= 0);
        assert.ok(slot.level <= state.ageIndex);
        assert.ok(slot.builtOnDay !== null);
      } else {
        assert.equal(slot.level, -1);
      }
    }

    assert.equal(state.milestones.buildings, state.slots.filter((slot) => slot.unlocked).length);
    assert.equal(state.milestones.wonders, state.slots.filter((slot) => slot.level >= 4).length);
    assert.ok(state.events.length > 0);
    assert.ok(state.lastEvent.text.length > 0);
    assert.ok(state.seed.length >= 8);
  }
});

test('the space demo reaches every plot and includes astronauts', () => {
  const history = demoHistory('space');
  const state = simulateCivilization(history);
  assert.equal(state.age.id, 'space');
  assert.equal(state.slots.filter((slot) => slot.unlocked).length, 8);
  assert.ok(state.slots.every((slot) => slot.level === 4));
  assert.ok(state.monkeys.some((monkey) => monkey.role === 'astronaut'));
  assert.ok(state.visibleMonkeys.some((monkey) => monkey.role === 'astronaut'));
  assert.ok(state.milestones.wonders >= 4);
  assert.ok(state.milestones.buildings === 8);
});

test('a tiny history still produces a playable stone-age village', () => {
  const days: ContributionDay[] = Array.from({ length: 30 }, (_, index) => ({
    date: `2026-01-${String(index + 1).padStart(2, '0')}`,
    count: 0,
    level: 0,
  }));
  const history = makeHistory({
    username: 'quiet-monkey',
    days,
    from: '2026-01-01',
    to: '2026-01-30',
    source: 'demo',
  });
  const state = simulateCivilization(history);
  assert.equal(state.totalContributions, 0);
  assert.equal(state.age.id, 'stone');
  assert.ok(state.population >= 2);
  assert.ok(state.population <= state.capacity);
  assert.ok(state.visibleMonkeys.length <= state.population);
  assert.equal(state.slots.filter((slot) => slot.unlocked).length, 3);
  assert.ok(state.bananas >= 0);
});

test('daysFromCounts fills a contiguous date range', () => {
  const days = daysFromCounts([1, 0, 3, 4], '2026-02-01', '2026-02-03');
  assert.deepEqual(
    days.map((day) => [day.date, day.count, day.level]),
    [
      ['2026-02-01', 1, 1],
      ['2026-02-02', 0, 0],
      ['2026-02-03', 3, 1],
    ],
  );
});
