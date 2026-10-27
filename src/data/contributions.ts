import type {
  ContributionDay,
  ContributionHistory,
  ContributionLevel,
  ContributionStats,
  ContributionWeek,
} from '../types.ts';
import {
  addDays,
  daysBetween,
  enumerateDays,
  formatNumber,
  startOfWeek,
  weekdayName,
} from '../util/date.ts';

const GITHUB_GRAPHQL_URL = 'https://api.github.com/graphql';

const CONTRIBUTIONS_QUERY = `
query MonkeyCivilizationContributions($login: String!, $from: DateTime!, $to: DateTime!) {
  user(login: $login) {
    login
    contributionsCollection(from: $from, to: $to) {
      contributionCalendar {
        totalContributions
        weeks {
          contributionDays {
            date
            contributionCount
            contributionLevel
          }
        }
      }
      totalCommitContributions
      totalIssueContributions
      totalPullRequestContributions
      totalPullRequestReviewContributions
      restrictedContributionsCount
    }
  }
}
`;

interface GraphQlContributionDay {
  date: string;
  contributionCount: number;
  contributionLevel:
    | 'NONE'
    | 'FIRST_QUARTILE'
    | 'SECOND_QUARTILE'
    | 'THIRD_QUARTILE'
    | 'FOURTH_QUARTILE';
}

interface GraphQlResponse {
  data?: {
    user: {
      login: string;
      contributionsCollection: {
        contributionCalendar: {
          totalContributions: number;
          weeks: Array<{ contributionDays: GraphQlContributionDay[] }>;
        };
        restrictedContributionsCount: number;
      };
    } | null;
  };
  errors?: Array<{ message: string; type?: string }>;
}

export interface FetchContributionsOptions {
  username: string;
  token: string;
  /** Inclusive UTC date, `YYYY-MM-DD`. Defaults to 364 days before `to`. */
  from?: string;
  /** Inclusive UTC date, `YYYY-MM-DD`. Defaults to today in UTC. */
  to?: string;
  fetchImpl?: typeof fetch;
  endpoint?: string;
}

const LEVEL_MAP: Record<GraphQlContributionDay['contributionLevel'], ContributionLevel> = {
  NONE: 0,
  FIRST_QUARTILE: 1,
  SECOND_QUARTILE: 2,
  THIRD_QUARTILE: 3,
  FOURTH_QUARTILE: 4,
};

export async function fetchContributionHistory(
  options: FetchContributionsOptions,
): Promise<ContributionHistory> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const to = options.to ?? new Date().toISOString().slice(0, 10);
  const from = options.from ?? addDays(to, -364);
  if (daysBetween(from, to) < 0) {
    throw new Error(`Invalid contribution range: ${from} is after ${to}`);
  }

  const response = await fetchImpl(options.endpoint ?? GITHUB_GRAPHQL_URL, {
    method: 'POST',
    headers: {
      Authorization: `bearer ${options.token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'monkey-civilization',
    },
    body: JSON.stringify({
      query: CONTRIBUTIONS_QUERY,
      variables: {
        login: options.username,
        from: `${from}T00:00:00Z`,
        to: `${to}T23:59:59Z`,
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `GitHub GraphQL request failed (${response.status} ${response.statusText}): ${body.slice(0, 400)}`,
    );
  }

  const payload = (await response.json()) as GraphQlResponse;
  if (payload.errors?.length) {
    throw new Error(`GitHub GraphQL error: ${payload.errors.map((error) => error.message).join('; ')}`);
  }
  const user = payload.data?.user;
  if (!user) {
    throw new Error(`GitHub user "${options.username}" was not found (or is not visible to this token).`);
  }

  const rawDays = user.contributionsCollection.contributionCalendar.weeks.flatMap(
    (week) => week.contributionDays,
  );
  const byDate = new Map<string, ContributionDay>();
  for (const day of rawDays) {
    if (day.date < from || day.date > to) continue;
    byDate.set(day.date, {
      date: day.date,
      count: day.contributionCount,
      level: LEVEL_MAP[day.contributionLevel],
    });
  }

  const days = enumerateDays(from, to).map((date) => {
    const found = byDate.get(date);
    return found ?? { date, count: 0, level: 0 as ContributionLevel };
  });

  return makeHistory({
    username: user.login,
    days,
    from,
    to,
    source: 'graphql',
  });
}

export interface MakeHistoryOptions {
  username: string;
  days: ContributionDay[];
  from: string;
  to: string;
  source: 'graphql' | 'demo';
}

export function makeHistory(options: MakeHistoryOptions): ContributionHistory {
  const days = [...options.days].sort((a, b) => a.date.localeCompare(b.date));
  const stats = computeStats(days);
  return {
    username: options.username,
    days,
    totalContributions: stats.total,
    stats,
    from: options.from,
    to: options.to,
    source: options.source,
  };
}

export function computeStats(days: ContributionDay[]): ContributionStats {
  const total = days.reduce((sum, day) => sum + day.count, 0);
  const activeDays = days.filter((day) => day.count > 0).length;
  const bestDay = days.reduce<ContributionDay>(
    (best, day) => (day.count > best.count ? day : best),
    days[0] ?? { date: '1970-01-01', count: 0, level: 0 },
  );

  let longestStreak = 0;
  let running = 0;
  for (const day of days) {
    if (day.count > 0) {
      running += 1;
      longestStreak = Math.max(longestStreak, running);
    } else {
      running = 0;
    }
  }

  let currentStreak = 0;
  for (let i = days.length - 1; i >= 0; i -= 1) {
    const day = days[i];
    if (day && day.count > 0) {
      currentStreak += 1;
    } else {
      break;
    }
  }

  const weekdayTotals = new Map<string, number>();
  for (const day of days) {
    const name = weekdayName(day.date);
    weekdayTotals.set(name, (weekdayTotals.get(name) ?? 0) + day.count);
  }
  let busiestWeekday = 'Monday';
  let busiestTotal = -1;
  for (const [name, value] of weekdayTotals) {
    if (value > busiestTotal) {
      busiestWeekday = name;
      busiestTotal = value;
    }
  }

  return {
    total,
    activeDays,
    averagePerActiveDay: activeDays === 0 ? 0 : total / activeDays,
    averagePerDay: days.length === 0 ? 0 : total / days.length,
    bestDay,
    currentStreak,
    longestStreak,
    busiestWeekday,
    weeks: groupIntoWeeks(days),
  };
}

export function groupIntoWeeks(days: ContributionDay[]): ContributionWeek[] {
  if (days.length === 0) return [];
  const first = days[0];
  const last = days[days.length - 1];
  if (!first || !last) return [];

  const byDate = new Map(days.map((day) => [day.date, day]));
  const weeks: ContributionWeek[] = [];
  let cursor = startOfWeek(first.date);
  while (cursor <= last.date) {
    const weekDays: ContributionDay[] = [];
    for (let i = 0; i < 7; i += 1) {
      const date = addDays(cursor, i);
      const day = byDate.get(date);
      if (day) weekDays.push(day);
    }
    weeks.push({
      start: cursor,
      days: weekDays,
      total: weekDays.reduce((sum, day) => sum + day.count, 0),
    });
    cursor = addDays(cursor, 7);
  }
  return weeks;
}

export function describeHistory(history: ContributionHistory): string {
  return [
    `@${history.username}`,
    `${formatNumber(history.totalContributions)} contributions`,
    `${history.stats.activeDays} active days`,
    `${history.stats.longestStreak}-day longest streak`,
  ].join(' · ');
}
