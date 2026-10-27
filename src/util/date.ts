/** Date + number helpers used by both data fetching and rendering. */

const DAY_MS = 24 * 60 * 60 * 1000;

export function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function parseDateString(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

export function addDays(dateString: string, days: number): string {
  const date = parseDateString(dateString);
  date.setUTCDate(date.getUTCDate() + days);
  return toDateString(date);
}

export function daysBetween(from: string, to: string): number {
  return Math.round((parseDateString(to).getTime() - parseDateString(from).getTime()) / DAY_MS);
}

export function enumerateDays(from: string, to: string): string[] {
  const count = daysBetween(from, to);
  const days: string[] = [];
  for (let i = 0; i <= count; i += 1) {
    days.push(addDays(from, i));
  }
  return days;
}

export function formatNumber(value: number): string {
  return Math.round(value).toLocaleString('en-US');
}

export function formatCompact(value: number): string {
  const rounded = Math.round(value);
  if (Math.abs(rounded) >= 1_000_000) {
    return `${trimZero(rounded / 1_000_000)}M`;
  }
  if (Math.abs(rounded) >= 10_000) {
    return `${trimZero(rounded / 1_000)}K`;
  }
  return formatNumber(rounded);
}

function trimZero(value: number): string {
  return value.toFixed(1).replace(/\.0$/, '');
}

export function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function weekdayName(dateString: string): string {
  return new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: 'UTC' }).format(
    parseDateString(dateString),
  );
}

export function shortDate(dateString: string): string {
  const date = parseDateString(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
    .format(date)
    .toUpperCase();
}

export function startOfWeek(dateString: string): string {
  const date = parseDateString(dateString);
  const day = date.getUTCDay();
  return addDays(dateString, -day);
}
