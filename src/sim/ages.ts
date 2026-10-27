import type { AgeDefinition, AgeId } from '../types.ts';
import { clamp } from '../util/rng.ts';

export const AGES: readonly AgeDefinition[] = [
  {
    id: 'stone',
    index: 0,
    name: 'STONE AGE',
    shortName: 'STONE',
    minContributions: 0,
    tagline: 'Ook. Fire good.',
    yieldMultiplier: 1,
    accent: '#ffcc4d',
    accent2: '#7bd389',
    skyTop: '#6fc3df',
    skyBottom: '#ffe3a3',
  },
  {
    id: 'medieval',
    index: 1,
    name: 'MEDIEVAL AGE',
    shortName: 'MEDIEVAL',
    minContributions: 75,
    tagline: 'The banana trade routes open.',
    yieldMultiplier: 1.15,
    accent: '#f0a35e',
    accent2: '#b7d36b',
    skyTop: '#7fb7d9',
    skyBottom: '#ffd9a0',
  },
  {
    id: 'industrial',
    index: 2,
    name: 'INDUSTRIAL AGE',
    shortName: 'INDUSTRIAL',
    minContributions: 300,
    tagline: 'Steam-powered banana peels.',
    yieldMultiplier: 1.4,
    accent: '#e0a020',
    accent2: '#b87333',
    skyTop: '#9aa9ad',
    skyBottom: '#e8cfa4',
  },
  {
    id: 'modern',
    index: 3,
    name: 'MODERN AGE',
    shortName: 'MODERN',
    minContributions: 800,
    tagline: 'Wi-Fi reaches the canopy.',
    yieldMultiplier: 1.7,
    accent: '#4aa3df',
    accent2: '#7bd389',
    skyTop: '#5fa8e8',
    skyBottom: '#c9f0ff',
  },
  {
    id: 'space',
    index: 4,
    name: 'SPACE AGE',
    shortName: 'SPACE',
    minContributions: 1800,
    tagline: 'To the moon, one banana at a time.',
    yieldMultiplier: 2.2,
    accent: '#b388ff',
    accent2: '#6ee7f9',
    skyTop: '#120a26',
    skyBottom: '#3b1f5e',
  },
] as const;

export function ageForContributions(total: number): AgeDefinition {
  let result = AGES[0] as AgeDefinition;
  for (const age of AGES) {
    if (total >= age.minContributions) result = age;
  }
  return result;
}

export function ageById(id: AgeId): AgeDefinition {
  const age = AGES.find((candidate) => candidate.id === id);
  if (!age) throw new Error(`Unknown age: ${id}`);
  return age;
}

export function nextAgeFor(age: AgeDefinition): AgeDefinition | null {
  return AGES[age.index + 1] ?? null;
}

export function progressForAge(total: number, age: AgeDefinition): number {
  const next = nextAgeFor(age);
  if (!next) return 1;
  const span = next.minContributions - age.minContributions;
  if (span <= 0) return 1;
  return clamp((total - age.minContributions) / span, 0, 1);
}

export function levelFor(total: number, age: AgeDefinition): number {
  const progress = progressForAge(total, age);
  return age.index * 10 + 1 + Math.floor(progress * 9);
}

export function contributionGoalFor(age: AgeDefinition): number | null {
  return nextAgeFor(age)?.minContributions ?? null;
}
