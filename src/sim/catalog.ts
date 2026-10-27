import type { SlotDefinition, SlotId } from '../types.ts';

export interface SlotCatalogEntry extends SlotDefinition {
  names: readonly [string, string, string, string, string];
  capacityByLevel?: readonly [number, number, number, number, number];
  foodByLevel?: readonly [number, number, number, number, number];
  yieldBonusByLevel?: readonly [number, number, number, number, number];
}

/**
 * Eight plots make up the village. Each plot has one building per age, so
 * the skyline visibly changes when the civilization advances.
 */
export const SLOTS: readonly SlotCatalogEntry[] = [
  {
    id: 'dwellings',
    name: 'Dwellings',
    x: 66,
    width: 92,
    minPopulation: 2,
    unlockAge: 0,
    baseCost: 40,
    names: ['Lean-to', 'Timber Cottage', 'Brick Tenement', 'Apartment Block', 'Habitat Dome'],
    capacityByLevel: [4, 8, 14, 22, 32],
  },
  {
    id: 'farm',
    name: 'Banana Farm',
    x: 188,
    width: 100,
    minPopulation: 2,
    unlockAge: 0,
    baseCost: 36,
    names: ['Wild Banana Grove', 'Terraced Farm', 'Agro-Industry', 'Vertical Farm', 'Hydroponic Dome'],
    foodByLevel: [4, 9, 16, 26, 40],
  },
  {
    id: 'community',
    name: 'Community',
    x: 312,
    width: 94,
    minPopulation: 2,
    unlockAge: 0,
    baseCost: 44,
    names: ['Campfire', 'Tavern', 'Town Hall', 'Civic Center', 'Space Elevator'],
  },
  {
    id: 'workshop',
    name: 'Workshop',
    x: 438,
    width: 96,
    minPopulation: 4,
    unlockAge: 0,
    baseCost: 60,
    names: ['Flint Workshop', 'Windmill', 'Factory', 'Robotics Lab', 'Nano-Forge'],
    yieldBonusByLevel: [0, 0.04, 0.08, 0.12, 0.18],
  },
  {
    id: 'culture',
    name: 'Culture',
    x: 562,
    width: 86,
    minPopulation: 7,
    unlockAge: 0,
    baseCost: 90,
    names: ['Totem Pole', 'Bell Tower', 'Clock Tower', 'Broadcast Tower', 'Observatory'],
  },
  {
    id: 'wonder',
    name: 'Wonder',
    x: 684,
    width: 106,
    minPopulation: 12,
    unlockAge: 0,
    baseCost: 150,
    names: ['Standing Stones', 'Castle Keep', "World's Fair", 'Banana Museum', 'Orbital Banana'],
    yieldBonusByLevel: [0, 0.02, 0.05, 0.08, 0.15],
  },
  {
    id: 'energy',
    name: 'Energy',
    x: 806,
    width: 92,
    minPopulation: 12,
    unlockAge: 2,
    baseCost: 180,
    names: ['', '', 'Coal Plant', 'Solar Array', 'Fusion Reactor'],
    foodByLevel: [0, 0, 0, 6, 14],
  },
  {
    id: 'spaceport',
    name: 'Spaceport',
    x: 914,
    width: 84,
    minPopulation: 22,
    unlockAge: 3,
    baseCost: 320,
    names: ['', '', '', 'Mission Control', 'Rocket Pad'],
  },
] as const;

export function slotById(id: SlotId): SlotCatalogEntry {
  const slot = SLOTS.find((candidate) => candidate.id === id);
  if (!slot) throw new Error(`Unknown slot: ${id}`);
  return slot;
}

export function buildingName(slot: SlotId, level: number): string {
  const entry = slotById(slot);
  return entry.names[Math.max(0, Math.min(4, level))] ?? entry.name;
}

export function upgradeCost(entry: SlotCatalogEntry, targetLevel: number): number {
  return Math.round(entry.baseCost * (targetLevel + 1) * 1.2);
}
