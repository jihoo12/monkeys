import assert from 'node:assert/strict';
import test from 'node:test';
import {
  computeStats,
  describeHistory,
  fetchContributionHistory,
  groupIntoWeeks,
  makeHistory,
} from '../src/data/contributions.ts';
import type { ContributionDay } from '../src/types.ts';

const DAYS: ContributionDay[] = [
  { date: '2026-01-01', count: 0, level: 0 },
  { date: '2026-01-02', count: 3, level: 1 },
  { date: '2026-01-03', count: 5, level: 2 },
  { date: '2026-01-04', count: 0, level: 0 },
  { date: '2026-01-05', count: 7, level: 3 },
  { date: '2026-01-06', count: 2, level: 1 },
];

test('computeStats totals, streaks, best day and weekday', () => {
  const stats = computeStats(DAYS);
  assert.equal(stats.total, 17);
  assert.equal(stats.activeDays, 4);
  assert.equal(stats.bestDay.date, '2026-01-05');
  assert.equal(stats.bestDay.count, 7);
  assert.equal(stats.longestStreak, 2);
  assert.equal(stats.currentStreak, 2);
  assert.equal(stats.busiestWeekday, 'Monday');
  assert.equal(stats.averagePerActiveDay, 17 / 4);
  assert.equal(stats.averagePerDay, 17 / 6);
});

test('computeStats handles an empty history', () => {
  const stats = computeStats([]);
  assert.equal(stats.total, 0);
  assert.equal(stats.activeDays, 0);
  assert.equal(stats.averagePerActiveDay, 0);
  assert.equal(stats.averagePerDay, 0);
  assert.equal(stats.longestStreak, 0);
  assert.equal(stats.currentStreak, 0);
  assert.equal(stats.bestDay.count, 0);
  assert.deepEqual(stats.weeks, []);
});

test('groupIntoWeeks starts on Sunday and preserves totals', () => {
  const weeks = groupIntoWeeks(DAYS);
  assert.equal(weeks.length, 2);
  assert.equal(weeks[0]?.start, '2025-12-28');
  assert.equal(weeks[0]?.total, 8);
  assert.equal(weeks[0]?.days.length, 3);
  assert.equal(weeks[1]?.start, '2026-01-04');
  assert.equal(weeks[1]?.total, 9);
  assert.equal(weeks[1]?.days.length, 3);
  assert.equal(
    weeks.reduce((sum, week) => sum + week.total, 0),
    17,
  );
});

test('makeHistory sorts days and derives totals', () => {
  const history = makeHistory({
    username: 'octocat',
    days: [...DAYS].reverse(),
    from: '2026-01-01',
    to: '2026-01-06',
    source: 'demo',
  });
  assert.equal(history.days[0]?.date, '2026-01-01');
  assert.equal(history.days[5]?.date, '2026-01-06');
  assert.equal(history.totalContributions, 17);
  assert.equal(history.stats.total, 17);
  assert.equal(describeHistory(history), '@octocat · 17 contributions · 4 active days · 2-day longest streak');
});

test('fetchContributionHistory normalizes a GraphQL response', async () => {
  let requestUrl = '';
  let requestInit: RequestInit | undefined;
  const payload = {
    data: {
      user: {
        login: 'octocat',
        contributionsCollection: {
          restrictedContributionsCount: 0,
          contributionCalendar: {
            totalContributions: 9,
            weeks: [
              {
                contributionDays: [
                  { date: '2026-01-01', contributionCount: 2, contributionLevel: 'FIRST_QUARTILE' },
                  { date: '2026-01-03', contributionCount: 5, contributionLevel: 'FOURTH_QUARTILE' },
                  { date: '2026-01-04', contributionCount: 9, contributionLevel: 'NONE' },
                ],
              },
            ],
          },
        },
      },
    },
  };
  const fetchImpl = (async (url: string | URL | Request, init?: RequestInit) => {
    requestUrl = String(url);
    requestInit = init;
    return {
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => payload,
      text: async () => JSON.stringify(payload),
    } as unknown as Response;
  }) as typeof fetch;

  const history = await fetchContributionHistory({
    username: 'octocat',
    token: 'secret',
    from: '2026-01-01',
    to: '2026-01-03',
    fetchImpl,
  });

  assert.equal(requestUrl, 'https://api.github.com/graphql');
  assert.equal(requestInit?.method, 'POST');
  assert.deepEqual(requestInit?.headers, {
    Authorization: 'bearer secret',
    'Content-Type': 'application/json',
    'User-Agent': 'monkey-civilization',
  });
  const body = JSON.parse(String(requestInit?.body)) as {
    variables: { login: string; from: string; to: string };
  };
  assert.equal(body.variables.login, 'octocat');
  assert.equal(body.variables.from, '2026-01-01T00:00:00Z');
  assert.equal(body.variables.to, '2026-01-03T23:59:59Z');

  assert.equal(history.username, 'octocat');
  assert.equal(history.source, 'graphql');
  assert.equal(history.days.length, 3);
  assert.deepEqual(
    history.days.map((day) => [day.date, day.count, day.level]),
    [
      ['2026-01-01', 2, 1],
      ['2026-01-02', 0, 0],
      ['2026-01-03', 5, 4],
    ],
  );
  assert.equal(history.totalContributions, 7);
  assert.equal(history.stats.activeDays, 2);
});

test('fetchContributionHistory rejects HTTP, GraphQL and missing-user errors', async () => {
  const makeFetch = (response: {
    ok: boolean;
    status: number;
    statusText: string;
    json?: () => Promise<unknown>;
    text?: () => Promise<string>;
  }): typeof fetch =>
    (async () =>
      ({
        ...response,
        json: response.json ?? (async () => ({})),
        text: response.text ?? (async () => ''),
      }) as unknown as Response) as typeof fetch;

  await assert.rejects(
    fetchContributionHistory({
      username: 'octocat',
      token: 'secret',
      from: '2026-01-01',
      to: '2026-01-02',
      fetchImpl: makeFetch({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: async () => 'bad credentials',
      }),
    }),
    /401 Unauthorized.*bad credentials/s,
  );

  await assert.rejects(
    fetchContributionHistory({
      username: 'octocat',
      token: 'secret',
      from: '2026-01-01',
      to: '2026-01-02',
      fetchImpl: makeFetch({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({ errors: [{ message: 'Something went wrong' }] }),
      }),
    }),
    /GitHub GraphQL error: Something went wrong/,
  );

  await assert.rejects(
    fetchContributionHistory({
      username: 'octocat',
      token: 'secret',
      from: '2026-01-01',
      to: '2026-01-02',
      fetchImpl: makeFetch({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({ data: { user: null } }),
      }),
    }),
    /was not found/,
  );
});

test('fetchContributionHistory validates the date range before fetching', async () => {
  let called = false;
  const fetchImpl = (async () => {
    called = true;
    throw new Error('should not be called');
  }) as typeof fetch;
  await assert.rejects(
    fetchContributionHistory({
      username: 'octocat',
      token: 'secret',
      from: '2026-02-01',
      to: '2026-01-01',
      fetchImpl,
    }),
    /Invalid contribution range/,
  );
  assert.equal(called, false);
});
