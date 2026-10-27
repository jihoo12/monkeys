import type {
  CivilizationState,
  ContributionDay,
  ContributionHistory,
  MonkeyRole,
  MonkeyState,
  SimEvent,
  SlotState,
} from '../types.ts';
import { ageForContributions, levelFor, nextAgeFor, progressForAge } from './ages.ts';
import { buildingName, SLOTS, slotById, type SlotCatalogEntry, upgradeCost } from './catalog.ts';
import { createRng, hashString, type Rng } from '../util/rng.ts';
import { shortDate } from '../util/date.ts';

const BASE_YIELD = 8;
const START_POPULATION = 2;
const START_BANANAS = 20;
const UPKEEP_PER_MONKEY = 0.5;
const BASE_CAPACITY = 4;
const MAX_VISIBLE_MONKEYS = 14;

const MONKEY_NAMES = [
  'Momo',
  'Kiki',
  'Bibi',
  'Nana',
  'Ook',
  'Peanut',
  'Coco',
  'Mango',
  'Tiko',
  'Zuzu',
  'Bongo',
  'Chiku',
  'Dodo',
  'Fizz',
  'Gogo',
  'Juju',
  'Koko',
  'Lulu',
  'Mimi',
  'Nono',
  'Pip',
  'Roro',
  'Sasa',
  'Toto',
  'Ubu',
  'Vivi',
  'Wowo',
  'Yoyo',
  'Zaza',
  'Boba',
  'Chip',
  'Dumpling',
  'Echo',
  'Fig',
  'Gizmo',
  'Hazel',
  'Iggy',
  'Jelly',
  'Kiwi',
  'Lychee',
  'Mochi',
  'Noodle',
  'Olive',
  'Pudding',
  'Quincy',
  'Ramen',
  'Sushi',
  'Tofu',
  'Udon',
  'Waffle',
] as const;

const ROLE_CYCLE: readonly MonkeyRole[] = [
  'elder',
  'farmer',
  'builder',
  'musician',
  'scholar',
  'chef',
  'walker',
  'farmer',
  'builder',
  'walker',
  'scholar',
  'walker',
];

const HUMOR_LINES = [
  'A monkey invents the wheel. It immediately rolls into the river.',
  'The banana reserves are audited. The auditor eats the evidence.',
  'A monkey stares at a cloud. The cloud stares back.',
  'Someone teaches the parrot to say LGTM. Productivity halts.',
  'The campfire is renamed production. Nobody notices a difference.',
  'A monkey discovers two bananas are better than one. Science advances.',
  'The tribe votes to migrate. They move the sacred rock two feet left.',
  'A monkey writes a haiku about semicolons. It does not compile.',
  'The elder claims the moon is a banana. Nobody argues.',
  'A monkey deploys on Friday. The jungle holds its breath.',
  'A committee is formed to investigate the mysterious banana disappearances.',
  'A monkey rebrands the puddle as a swimming pool. Morale improves.',
  'The watchtower is painted. Now everyone can see it is crooked.',
  'A monkey teaches the campfire to sing. It is terrible, but sincere.',
  'The banana count is off by one. A monkey is appointed to count harder.',
  'A monkey finds a shiny rock and declares a new age. It is still the old age.',
  'The tribe adopts a strict sprint schedule: nap, banana, nap.',
  'A monkey opens 47 browser tabs. The canopy gains a second sun.',
  'Mission Control loses the rocket. It is found behind the moon.',
  'The factory produces 10,000 bananas. 9,999 are eaten immediately.',
  'A knight attempts to joust a windmill. The windmill wins.',
  'A monkey discovers fire. Then sits on it.',
  'The wifi password is written on a leaf. The leaf blows away.',
  'A monkey claims the orbital ring is a very large donut. Funding doubles.',
  'The village clock is correct twice a day. The monkeys celebrate both times.',
] as const;

const AGE_HUMOR: Record<string, readonly string[]> = {
  stone: HUMOR_LINES.slice(0, 6),
  medieval: HUMOR_LINES.slice(4, 11),
  industrial: HUMOR_LINES.slice(9, 16),
  modern: HUMOR_LINES.slice(15, 21),
  space: HUMOR_LINES.slice(18),
};

export function simulateCivilization(history: ContributionHistory): CivilizationState {
  const seedInput = `${history.username}|${history.from}|${history.to}|${history.days
    .map((day) => `${day.date}:${day.count}`)
    .join(',')}`;
  const seed = hashString(seedInput).toString(16).padStart(8, '0');
  const rng = createRng(`${seedInput}:sim`);
  const humorRng = createRng(`${seedInput}:humor`);

  const slots: SlotState[] = SLOTS.map((entry) => ({
    id: entry.id,
    unlocked: false,
    level: -1,
    builtOnDay: null,
    upgrades: 0,
  }));
  const slotMap = new Map(slots.map((slot) => [slot.id, slot]));

  // The first three plots are the founding settlement. Everything else has
  // to be earned with population and bananas.
  for (const id of ['dwellings', 'farm', 'community'] as const) {
    const slot = slotMap.get(id);
    if (slot) {
      slot.unlocked = true;
      slot.level = 0;
      slot.builtOnDay = 0;
    }
  }

  let population = START_POPULATION;
  let bananas = START_BANANAS;
  let total = 0;
  let ageIndex = 0;
  let age = ageForContributions(0);
  let lastGrowthDay = 0;
  let hungerDays = 0;
  let runningStreak = 0;
  let bananaIncome = 0;
  let bananaUpkeep = 0;
  let foodPerDay = 0;
  let spaceDay: number | null = null;
  let firstContributionDay: number | null = null;
  const events: SimEvent[] = [];
  const monkeys: MonkeyState[] = [];

  const addEvent = (day: number, date: string, type: SimEvent['type'], text: string): void => {
    events.push({ day, date, type, text: `DAY ${day}: ${text}` });
  };

  addEvent(0, history.from, 'humor', 'A tiny troop of monkeys settles under the great banana tree.');
  monkeys.push(createMonkey(0, age.id, 0, rng));
  monkeys.push(createMonkey(1, age.id, 0, rng));

  const initialCapacity = capacityFor(slotMap);
  if (population > initialCapacity) population = initialCapacity;

  history.days.forEach((day, index) => {
    const dayNumber = index + 1;
    total += day.count;

    const currentAge = ageForContributions(total);
    if (currentAge.index > ageIndex) {
      ageIndex = currentAge.index;
      age = currentAge;
      const windfall = Math.round(90 * ageIndex * (1 + population / 24));
      bananas += windfall;
      addEvent(dayNumber, day.date, 'age', `The monkeys enter the ${age.name}. ${age.tagline}`);
      if (age.id === 'space' && spaceDay === null) {
        spaceDay = dayNumber;
        addEvent(
          dayNumber,
          day.date,
          'space',
          'Liftoff! A banana-powered rocket scratches the sky. The monkeys wave with all four hands.',
        );
      }
    }

    runningStreak = day.count > 0 ? runningStreak + 1 : 0;
    const farm = slotMap.get('farm');
    const workshop = slotMap.get('workshop');
    const wonder = slotMap.get('wonder');
    const farmLevel = farm?.level ?? -1;
    const workshopLevel = workshop?.level ?? -1;
    const wonderLevel = wonder?.level ?? -1;
    foodPerDay = farmLevel >= 0 ? (slotById('farm').foodByLevel?.[farmLevel] ?? 0) : 0;
    const workshopBonus =
      workshopLevel >= 0 ? (slotById('workshop').yieldBonusByLevel?.[workshopLevel] ?? 0) : 0;
    const wonderBonus = wonderLevel >= 0 ? (slotById('wonder').yieldBonusByLevel?.[wonderLevel] ?? 0) : 0;
    const yieldMultiplier = age.yieldMultiplier * (1 + workshopBonus + wonderBonus);

    bananaIncome = day.count * BASE_YIELD * yieldMultiplier + foodPerDay * 0.5;
    bananaUpkeep = population * UPKEEP_PER_MONKEY;
    bananas += bananaIncome - bananaUpkeep;
    if (bananas < 0) bananas = 0;

    if (day.count > 0 && firstContributionDay === null) {
      firstContributionDay = dayNumber;
      addEvent(
        dayNumber,
        day.date,
        'windfall',
        'The first commit falls from the sky. The monkeys call it a banana.',
      );
    }

    if (day.count >= 20) {
      addEvent(
        dayNumber,
        day.date,
        'windfall',
        `A contribution meteor shower! ${day.count} commits in one day. The banana pile grows suspiciously tall.`,
      );
    }

    if (runningStreak === 7 || runningStreak === 30 || runningStreak === 100) {
      addEvent(
        dayNumber,
        day.date,
        'streak',
        `A ${runningStreak}-day streak! The monkeys light a very small ceremonial fire.`,
      );
    }

    // Build or upgrade at most one thing per plot per day. Dwellings come
    // first so that the population has somewhere to live.
    for (const entry of SLOTS) {
      const slot = slotMap.get(entry.id);
      if (!slot) continue;
      if (!slot.unlocked) {
        if (ageIndex >= entry.unlockAge && population >= entry.minPopulation) {
          const cost = upgradeCost(entry, ageIndex);
          if (bananas >= cost) {
            bananas -= cost;
            slot.unlocked = true;
            slot.level = ageIndex;
            slot.builtOnDay = dayNumber;
            addEvent(
              dayNumber,
              day.date,
              'build',
              `The monkeys build a ${buildingName(entry.id, ageIndex)}. It is mostly held together by bananas.`,
            );
          }
        }
        continue;
      }

      if (slot.level < ageIndex) {
        const targetLevel = slot.level + 1;
        const cost = upgradeCost(entry, targetLevel);
        if (bananas >= cost) {
          const previousName = buildingName(entry.id, slot.level);
          const nextName = buildingName(entry.id, targetLevel);
          bananas -= cost;
          slot.level = targetLevel;
          slot.upgrades += 1;
          slot.builtOnDay = dayNumber;
          addEvent(
            dayNumber,
            day.date,
            'build',
            `The ${previousName} becomes a ${nextName}. The monkeys applaud, then ask for bananas.`,
          );
        }
      }
    }

    const capacity = capacityFor(slotMap);
    const growthCost = Math.round(18 + population * 4);
    if (population < capacity && bananas >= growthCost && dayNumber - lastGrowthDay >= 2) {
      bananas -= growthCost;
      population += 1;
      lastGrowthDay = dayNumber;
      monkeys.push(createMonkey(population - 1, age.id, dayNumber, rng));
      if ([5, 10, 20, 30, 40, 50].includes(population)) {
        addEvent(
          dayNumber,
          day.date,
          'population',
          `Population reaches ${population}. The banana queue is now a traffic jam.`,
        );
      }
    }

    const upkeepAfterFood = Math.max(0, population * UPKEEP_PER_MONKEY - foodPerDay * 0.5);
    if (bananas <= 0 && bananaIncome < upkeepAfterFood) {
      hungerDays += 1;
      if (hungerDays >= 3 && population > 2) {
        hungerDays = 0;
        population -= 1;
        monkeys.pop();
        addEvent(
          dayNumber,
          day.date,
          'famine',
          'A monkey leaves to find bananas. The tribe pretends not to cry.',
        );
      }
    } else {
      hungerDays = 0;
    }

    if (humorRng() < 0.045) {
      const lines = AGE_HUMOR[age.id] ?? HUMOR_LINES;
      const line = lines[Math.floor(humorRng() * lines.length)] ?? HUMOR_LINES[0];
      addEvent(dayNumber, day.date, 'humor', `${line} ${shortDate(day.date)}.`);
    }
  });

  const finalAge = ageForContributions(total);
  if (finalAge.index > ageIndex) {
    ageIndex = finalAge.index;
    age = finalAge;
  }

  const finalCapacity = capacityFor(slotMap);
  if (population > finalCapacity) population = finalCapacity;
  while (monkeys.length > population) monkeys.pop();
  while (monkeys.length < population) {
    monkeys.push(createMonkey(monkeys.length, age.id, history.days.length, rng));
  }

  const finalDay = history.days[history.days.length - 1];
  if (finalDay && events[events.length - 1]?.day !== history.days.length) {
    addEvent(
      history.days.length,
      finalDay.date,
      'humor',
      'The future is bright and sticky. The bananas are proud.',
    );
  }

  const buildings = slots.filter((slot) => slot.unlocked).length;
  const wonders = slots.filter((slot) => slot.level >= 4).length;
  assignAgeRoles(monkeys, age);
  const visibleMonkeys = chooseVisibleMonkeys(monkeys, population);
  const lastEvent =
    events[events.length - 1] ??
    ({
      day: history.days.length,
      date: history.to,
      type: 'humor',
      text: 'The monkeys are suspiciously quiet.',
    } satisfies SimEvent);

  return {
    username: history.username,
    seed,
    days: history.days,
    totalContributions: total,
    age,
    ageIndex,
    ageProgress: progressForAge(total, age),
    nextAge: nextAgeFor(age),
    level: levelFor(total, age),
    bananas: Math.max(0, bananas),
    bananaIncome,
    bananaUpkeep,
    population,
    capacity: finalCapacity,
    foodPerDay,
    slots,
    monkeys,
    visibleMonkeys,
    events,
    lastEvent,
    stats: history.stats,
    milestones: {
      totalContributions: total,
      activeDays: history.stats.activeDays,
      longestStreak: history.stats.longestStreak,
      buildings,
      wonders,
      firstContributionDay,
      spaceDay,
    },
  };
}

function capacityFor(slotMap: Map<string, SlotState>): number {
  const dwellings = slotMap.get('dwellings');
  if (!dwellings || !dwellings.unlocked) return BASE_CAPACITY;
  const levels = slotById('dwellings').capacityByLevel;
  return levels?.[dwellings.level] ?? BASE_CAPACITY;
}

function createMonkey(index: number, ageId: string, day: number, rng: Rng): MonkeyState {
  const name = MONKEY_NAMES[index % MONKEY_NAMES.length] ?? `Monkey ${index + 1}`;
  let role = ROLE_CYCLE[index % ROLE_CYCLE.length] ?? 'walker';
  if (ageId === 'space' && index === 5) role = 'astronaut';
  if (ageId === 'space' && index === 8) role = 'astronaut';
  if (index === 0) role = 'elder';

  let accessory: MonkeyState['accessory'] = 'none';
  if (role === 'astronaut') accessory = 'helmet';
  else if (role === 'builder') accessory = 'hardhat';
  else if (role === 'farmer') accessory = 'leaf';
  else if (role === 'musician') accessory = 'bow';
  else if (role === 'elder') accessory = 'crown';
  else if (rng() > 0.82) accessory = 'leaf';

  return {
    id: index,
    name: index >= MONKEY_NAMES.length ? `${name} ${Math.floor(index / MONKEY_NAMES.length) + 1}` : name,
    role,
    color: Math.floor(rng() * 4),
    accessory,
    bornOnDay: day,
  };
}

function assignAgeRoles(monkeys: MonkeyState[], age: ReturnType<typeof ageForContributions>): void {
  if (age.id !== 'space') return;
  // Existing monkeys keep the role they were born with, so promote a couple of
  // curious walkers/scholars when the tribe reaches space. This guarantees the
  // final scene always has astronauts in it.
  let promoted = 0;
  for (const monkey of monkeys) {
    if (promoted >= 2) break;
    if (monkey.role === 'walker' || monkey.role === 'scholar') {
      monkey.role = 'astronaut';
      monkey.accessory = 'helmet';
      promoted += 1;
    }
  }
  if (promoted === 0) {
    const candidate = monkeys.find((monkey) => monkey.role !== 'elder');
    if (candidate) {
      candidate.role = 'astronaut';
      candidate.accessory = 'helmet';
    }
  }
}

function chooseVisibleMonkeys(monkeys: MonkeyState[], population: number): MonkeyState[] {
  const count = Math.min(monkeys.length, MAX_VISIBLE_MONKEYS, Math.max(3, Math.ceil(population / 2)));
  const priority: MonkeyRole[] = [
    'elder',
    'astronaut',
    'farmer',
    'builder',
    'musician',
    'scholar',
    'chef',
    'walker',
  ];
  const chosen: MonkeyState[] = [];
  const add = (monkey: MonkeyState | undefined): void => {
    if (monkey && chosen.length < count && !chosen.includes(monkey)) chosen.push(monkey);
  };
  for (const role of priority) add(monkeys.find((monkey) => monkey.role === role));

  // Fill any remaining places with walkers first, then whoever is left. This
  // keeps the scene busy without turning it into a pile of overlapping farmers.
  const rest = monkeys
    .filter((monkey) => !chosen.includes(monkey))
    .sort((a, b) => {
      const walkerDiff = Number(b.role === 'walker') - Number(a.role === 'walker');
      return walkerDiff !== 0 ? walkerDiff : a.id - b.id;
    });
  for (const monkey of rest) {
    if (chosen.length >= count) break;
    chosen.push(monkey);
  }
  return chosen.sort((a, b) => a.id - b.id);
}

/** A tiny helper for scripts and tests that only have raw day data. */
export function daysFromCounts(
  counts: number[],
  from: string,
  to: string,
  levelForCount: (count: number) => ContributionDay['level'] = (count) => (count > 0 ? 1 : 0),
): ContributionDay[] {
  const days: ContributionDay[] = [];
  const start = new Date(`${from}T00:00:00Z`);
  for (let i = 0; i < counts.length; i += 1) {
    const date = new Date(start);
    date.setUTCDate(date.getUTCDate() + i);
    const iso = date.toISOString().slice(0, 10);
    if (iso > to) break;
    const count = counts[i] ?? 0;
    days.push({ date: iso, count, level: levelForCount(count) });
  }
  return days;
}

export type { SlotCatalogEntry };
