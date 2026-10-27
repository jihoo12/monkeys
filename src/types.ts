/**
 * Shared data contracts for Monkey Civilization.
 *
 * Everything in the simulation is plain data so that a given contribution
 * history always produces exactly the same civilization.
 */

export type ContributionLevel = 0 | 1 | 2 | 3 | 4;

export interface ContributionDay {
  /** UTC date, `YYYY-MM-DD`. */
  date: string;
  count: number;
  level: ContributionLevel;
}

export interface ContributionWeek {
  /** Date of the first day in the week (usually Sunday). */
  start: string;
  days: ContributionDay[];
  total: number;
}

export interface ContributionStats {
  total: number;
  activeDays: number;
  averagePerActiveDay: number;
  averagePerDay: number;
  bestDay: ContributionDay;
  currentStreak: number;
  longestStreak: number;
  busiestWeekday: string;
  weeks: ContributionWeek[];
}

export interface ContributionHistory {
  username: string;
  days: ContributionDay[];
  totalContributions: number;
  stats: ContributionStats;
  from: string;
  to: string;
  source: 'graphql' | 'demo';
}

export type AgeId = 'stone' | 'medieval' | 'industrial' | 'modern' | 'space';

export interface AgeDefinition {
  id: AgeId;
  index: number;
  name: string;
  shortName: string;
  minContributions: number;
  tagline: string;
  /** Banana yield multiplier for contributions made during this age. */
  yieldMultiplier: number;
  accent: string;
  accent2: string;
  skyTop: string;
  skyBottom: string;
}

export type SlotId =
  | 'dwellings'
  | 'farm'
  | 'community'
  | 'workshop'
  | 'culture'
  | 'wonder'
  | 'energy'
  | 'spaceport';

export interface SlotDefinition {
  id: SlotId;
  name: string;
  /** Horizontal centre in the 960px scene. */
  x: number;
  /** Maximum artwork width before scaling. */
  width: number;
  minPopulation: number;
  /** First age index in which this plot can be developed. */
  unlockAge: number;
  baseCost: number;
}

export interface SlotState {
  id: SlotId;
  unlocked: boolean;
  /** Age index of the currently standing building. -1 while locked. */
  level: number;
  builtOnDay: number | null;
  upgrades: number;
}

export type MonkeyRole =
  | 'elder'
  | 'farmer'
  | 'builder'
  | 'scholar'
  | 'musician'
  | 'astronaut'
  | 'chef'
  | 'walker';

export interface MonkeyState {
  id: number;
  name: string;
  role: MonkeyRole;
  color: number;
  accessory: 'none' | 'leaf' | 'hardhat' | 'helmet' | 'bow' | 'crown';
  bornOnDay: number;
}

export type SimEventType =
  | 'age'
  | 'build'
  | 'population'
  | 'streak'
  | 'windfall'
  | 'humor'
  | 'famine'
  | 'space';

export interface SimEvent {
  day: number;
  date: string;
  type: SimEventType;
  text: string;
}

export interface CivilizationState {
  username: string;
  seed: string;
  days: ContributionDay[];
  totalContributions: number;
  age: AgeDefinition;
  ageIndex: number;
  /** 0..1 progress toward the next age; 1 in the space age. */
  ageProgress: number;
  nextAge: AgeDefinition | null;
  level: number;
  bananas: number;
  bananaIncome: number;
  bananaUpkeep: number;
  population: number;
  capacity: number;
  foodPerDay: number;
  slots: SlotState[];
  monkeys: MonkeyState[];
  visibleMonkeys: MonkeyState[];
  events: SimEvent[];
  lastEvent: SimEvent;
  stats: ContributionStats;
  milestones: {
    totalContributions: number;
    activeDays: number;
    longestStreak: number;
    buildings: number;
    wonders: number;
    firstContributionDay: number | null;
    spaceDay: number | null;
  };
}
