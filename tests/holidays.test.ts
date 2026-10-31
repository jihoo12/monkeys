import assert from 'node:assert/strict';
import test from 'node:test';
import { demoHistory } from '../src/data/demo.ts';
import { simulateCivilization } from '../src/sim/engine.ts';
import { checkSvgCompatibility } from '../src/compat.ts';
import { renderCivilization } from '../src/render/render.ts';
import {
  HOLIDAYS,
  HOLIDAY_IDS,
  applyHolidayPalette,
  holidayFor,
  parseHolidayOption,
  resolveHoliday,
  type HolidayId,
} from '../src/render/holidays.ts';
import { paletteFor } from '../src/render/palette.ts';
import { escapeXml } from '../src/render/svg.ts';

const history = demoHistory('space');
const state = simulateCivilization(history);

test('holidays are selected from fixed calendar dates', () => {
  assert.equal(holidayFor('2026-10-31')?.id, 'halloween');
  assert.equal(holidayFor('2026-12-25')?.id, 'christmas');
  assert.equal(holidayFor('2026-12-24')?.id, 'christmas');
  assert.equal(holidayFor('2026-12-26')?.id, 'christmas');
  assert.equal(holidayFor('2026-12-31')?.id, 'new-year');
  assert.equal(holidayFor('2027-01-01')?.id, 'new-year');
  assert.equal(holidayFor('2027-02-14')?.id, 'valentines');
  assert.equal(holidayFor('2026-10-30'), null);
  assert.equal(holidayFor('2026-10-26'), null);
});

test('regional holidays are opt-in', () => {
  const all = { includeRegional: true };
  assert.equal(holidayFor('2027-03-17', all)?.id, 'st-patricks');
  assert.equal(holidayFor('2026-07-04', all)?.id, 'independence');
  for (const date of ['2027-03-17', '2026-07-04', '2026-04-05', '2026-11-26']) {
    assert.equal(holidayFor(date), null, `${date} should stay neutral with auto`);
  }
  assert.equal(resolveHoliday('auto', '2026-07-04'), null);
  assert.equal(resolveHoliday('all', '2026-07-04')?.id, 'independence');
  assert.equal(resolveHoliday('all', '2026-10-31')?.id, 'halloween');
  assert.equal(resolveHoliday('independence', '2026-10-31')?.id, 'independence');
  assert.deepEqual(
    HOLIDAYS.filter((holiday) => !holiday.regional).map((holiday) => holiday.id),
    ['new-year', 'valentines', 'halloween', 'christmas'],
  );
});

test('movable feasts resolve correctly', () => {
  const all = { includeRegional: true };
  // Easter Sunday, Gregorian computus.
  assert.equal(holidayFor('2026-04-05', all)?.id, 'easter');
  assert.equal(holidayFor('2025-04-20', all)?.id, 'easter');
  assert.equal(holidayFor('2027-03-28', all)?.id, 'easter');
  assert.equal(holidayFor('2026-04-04', all), null);

  // Thanksgiving is the fourth Thursday of November.
  assert.equal(holidayFor('2026-11-26', all)?.id, 'thanksgiving');
  assert.equal(holidayFor('2026-11-19', all), null);
  assert.equal(holidayFor('2027-11-25', all)?.id, 'thanksgiving');
});

test('holiday options parse and resolve', () => {
  assert.equal(parseHolidayOption('auto'), 'auto');
  assert.equal(parseHolidayOption(''), 'auto');
  assert.equal(parseHolidayOption('ALL'), 'all');
  assert.equal(parseHolidayOption('none'), 'none');
  assert.equal(parseHolidayOption('off'), 'none');
  assert.equal(parseHolidayOption('HALLOWEEN'), 'halloween');
  assert.throws(() => parseHolidayOption('festivus'), /Unknown holiday/);

  assert.equal(resolveHoliday('auto', '2026-10-31')?.id, 'halloween');
  assert.equal(resolveHoliday('none', '2026-10-31'), null);
  assert.equal(resolveHoliday('christmas', '2026-10-31')?.id, 'christmas');
});

test('every holiday changes the palette and renders deterministically', () => {
  const base = paletteFor(state.age);
  for (const id of HOLIDAY_IDS) {
    const holiday = resolveHoliday(id, '2026-01-01');
    assert.ok(holiday, `${id} should resolve`);
    const palette = applyHolidayPalette(base, holiday);
    assert.notEqual(palette.accent, base.accent, `${id} should override the accent`);

    const first = renderCivilization(state, history, { holiday: id });
    const second = renderCivilization(state, history, { holiday: id });
    assert.equal(first, second, `${id} should render deterministically`);
    assert.ok(first.includes(`holiday-${id}`), `${id} root class missing`);
    assert.ok(first.includes(holiday.greeting), `${id} greeting missing`);
    assert.ok(first.includes(escapeXml(holiday.name)), `${id} title missing`);

    const report = checkSvgCompatibility(first);
    assert.equal(report.ok, true, `${id} failed compatibility: ${JSON.stringify(report.issues)}`);
  }
});

test('holiday themes are visually distinct from one another', () => {
  const svgs = HOLIDAY_IDS.map((id) =>
    renderCivilization(state, history, { holiday: id as HolidayId }),
  );
  assert.equal(new Set(svgs).size, svgs.length);
});

test('monkeys dress up for holidays and only for holidays', () => {
  for (const id of HOLIDAY_IDS) {
    const svg = renderCivilization(state, history, { holiday: id as HolidayId });
    assert.ok(svg.includes('class="costume"'), `${id} monkeys should wear costumes`);
  }
  assert.ok(!renderCivilization(state, history, { holiday: 'none' }).includes('class="costume"'));
});

test('auto holiday uses the end of the contribution window', () => {
  const halloweenHistory = { ...history, to: '2026-10-31' };
  const auto = renderCivilization(state, halloweenHistory);
  assert.ok(auto.includes('holiday-halloween'));
  assert.ok(auto.includes('HAPPY HALLOWEEN!'));

  const disabled = renderCivilization(state, halloweenHistory, { holiday: 'none' });
  assert.ok(!disabled.includes('holiday-halloween'));
  assert.ok(!disabled.includes('HAPPY HALLOWEEN!'));

  // The checked-in demo window ends on 2026-10-26, so it stays neutral.
  const neutral = renderCivilization(state, history);
  assert.ok(!neutral.includes('holiday-'));
});

test('holiday decorations survive static mode without animations', () => {
  const svg = renderCivilization(state, history, { holiday: 'christmas', animation: false });
  assert.ok(svg.includes('holiday-christmas'));
  assert.ok(svg.includes('MERRY CHRISTMAS!'));
  assert.ok(svg.includes('twinkle-light'));
  assert.ok(!svg.includes('@keyframes'));
  assert.ok(!svg.includes('animation:'));
  const report = checkSvgCompatibility(svg);
  assert.equal(report.ok, true);
  assert.ok(report.issues.some((issue) => issue.code === 'no-animation'));
});
