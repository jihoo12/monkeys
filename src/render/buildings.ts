import type { AgeId, SlotId, SlotState } from '../types.ts';
import type { Palette } from './palette.ts';
import { shade } from './palette.ts';
import { circle, ellipse, line, poly, rect } from './svg.ts';
import { pixelText, pixelTextWidth } from './pixel-font.ts';
import { buildingName, slotById } from '../sim/catalog.ts';
import { createRng, type Rng } from '../util/rng.ts';
import {
  antenna,
  bananaBunch,
  bananaPlant,
  barrel,
  battlement,
  brickPattern,
  bush,
  chimney,
  crate,
  drone,
  firePit,
  flag,
  flowers,
  grassTuft,
  lampPost,
  pixelDoor,
  pixelWindow,
  pottedPlant,
  rockCluster,
  shingleRoof,
  signBoard,
  smallFence,
  smokePuff,
  stonePattern,
  thatchRoof,
  timberFrame,
  tree,
  waterTower,
  woodPlanks,
} from './art.ts';

export interface LightSource {
  x: number;
  y: number;
  radius: number;
  color: string;
}

export interface BuildingContext {
  palette: Palette;
  ageId: AgeId;
  lights: LightSource[];
  rng: Rng;
}

export function drawBuilding(
  slot: SlotState,
  baseline: number,
  palette: Palette,
  ageId: AgeId,
  lights: LightSource[] = [],
): string {
  const definition = slotById(slot.id);
  const cx = definition.x;
  const ctx: BuildingContext = {
    palette,
    ageId,
    lights,
    rng: createRng(`${slot.id}:${slot.level}:${ageId}:${definition.x}`),
  };

  if (!slot.unlocked || slot.level < 0) {
    return drawVacantPlot(definition.x, baseline, definition.width, palette, slot.id);
  }

  const art = drawSlot(slot.id, slot.level, cx, baseline, ctx);
  return `<g transform="translate(${cx} ${baseline})">${ellipse(
    0,
    1,
    definition.width * 0.44,
    3,
    palette.shadow,
  )}${ellipse(0, 1, definition.width * 0.26, 1.4, shade(palette.outline, 0.06), 'opacity="0.22"')}${art}</g>`;
}

export function drawVacantPlot(
  cx: number,
  baseline: number,
  width: number,
  palette: Palette,
  slotId: SlotId,
): string {
  const rng = createRng(`vacant:${slotId}`);
  const parts: string[] = [];
  parts.push(ellipse(cx, baseline + 1, width * 0.38, 2.4, palette.shadow));
  parts.push(rect(cx - width * 0.36, baseline - 5, width * 0.72, 5, palette.dirtDark, 'opacity="0.55"'));
  for (let i = 0; i < 7; i += 1) {
    const x = cx - width * 0.32 + rng() * width * 0.64;
    const h = 4 + Math.floor(rng() * 9);
    parts.push(rect(x, baseline - h, 3, h, palette.grassDark));
    parts.push(rect(x + 2, baseline - h + 2, 3, 2, palette.grass));
  }
  parts.push(rockCluster(cx - width * 0.28, baseline, 0.55, palette));
  parts.push(rockCluster(cx + width * 0.3, baseline - 1, 0.4, palette));
  // Survey stakes and twine give a sense of a plot waiting to be built.
  parts.push(rect(cx - width * 0.34, baseline - 22, 2, 22, palette.woodDark));
  parts.push(rect(cx + width * 0.32, baseline - 19, 2, 19, palette.woodDark));
  parts.push(rect(cx - width * 0.34, baseline - 19, width * 0.66, 1, palette.wood, 'opacity="0.8"'));
  parts.push(rect(cx - width * 0.34, baseline - 10, width * 0.66, 1, palette.wood, 'opacity="0.6"'));
  parts.push(rect(cx - 2, baseline - 28, 4, 28, palette.woodDark));
  parts.push(rect(cx - 14, baseline - 40, 28, 14, palette.wood));
  parts.push(rect(cx - 12, baseline - 38, 24, 10, palette.plaster));
  parts.push(pixelText('?', cx - 2, baseline - 36, 2, palette.outline));
  parts.push(pixelText('SOON', cx - 12, baseline - 48, 1, palette.hudDim));
  return `<g opacity="0.85">${parts.join('')}</g>`;
}

function drawSlot(slotId: SlotId, level: number, cx: number, base: number, ctx: BuildingContext): string {
  switch (slotId) {
    case 'dwellings':
      return drawDwellings(level, cx, base, ctx);
    case 'farm':
      return drawFarm(level, cx, base, ctx);
    case 'community':
      return drawCommunity(level, cx, base, ctx);
    case 'workshop':
      return drawWorkshop(level, cx, base, ctx);
    case 'culture':
      return drawCulture(level, cx, base, ctx);
    case 'wonder':
      return drawWonder(level, cx, base, ctx);
    case 'energy':
      return drawEnergy(level, cx, base, ctx);
    case 'spaceport':
      return drawSpaceport(level, cx, base, ctx);
    default:
      return '';
  }
}

// ---------------------------------------------------------------------------
// Dwellings
// ---------------------------------------------------------------------------

function drawDwellings(level: number, cx: number, base: number, ctx: BuildingContext): string {
  const p = ctx.palette;
  const parts: string[] = [];
  if (level === 0) {
    parts.push(rect(-33, -6, 66, 6, p.dirtDark));
    parts.push(rect(-29, -7, 58, 3, p.dirt));
    parts.push(rect(-29, -46, 4, 40, p.woodDark));
    parts.push(rect(25, -44, 4, 38, p.woodDark));
    parts.push(rect(-26, -39, 52, 34, p.plasterShade));
    parts.push(rect(-24, -37, 48, 31, p.plaster));
    parts.push(woodPlanks(-24, -37, 48, 31, p, 8));
    parts.push(thatchRoof(-61, -38, 33, p, p.roof));
    parts.push(rect(-34, -40, 68, 3, p.roofDark));
    // Leaf canopy draped over the shelter.
    parts.push(poly([[-40, -47], [-28, -55], [-14, -48], [-2, -57], [14, -49], [29, -57], [42, -46], [30, -40], [12, -45], [-2, -39], [-18, -45], [-30, -39]], p.leafDark));
    parts.push(poly([[-30, -48], [-18, -53], [-6, -47], [8, -52], [22, -47], [33, -51], [22, -43], [6, -47], [-9, -42], [-22, -46]], p.leaf));
    parts.push(pixelDoor(-8, -27, 16, 23, p, p.woodDark, true));
    parts.push(pixelWindow(10, -30, 8, 8, p, { lit: true, cross: false }));
    parts.push(rect(-18, -30, 6, 2, p.woodDark));
    parts.push(rect(-17, -31, 4, 1, p.woodLight, 'opacity="0.7"'));
    parts.push(bananaBunch(20, -20, 1.1, p));
    parts.push(rect(-32, -10, 8, 4, p.woodDark));
    parts.push(rect(24, -12, 7, 4, p.woodDark));
    parts.push(bush(-36, -2, 0.9, p));
    parts.push(bush(36, -1, 1.05, p, true));
    parts.push(smokePuff(-6, -68, 3.5, p, 0));
    parts.push(smokePuff(-1, -77, 2.6, p, 1.4));
    addLight(ctx, cx, base, 14, -26, 26, p.windowGlow);
    addLight(ctx, cx, base, -17, -13, 20, p.fire);
  } else if (level === 1) {
    parts.push(rect(-36, -8, 72, 8, p.stoneDark));
    parts.push(rect(-34, -10, 68, 4, p.stone));
    parts.push(rect(-32, -66, 64, 56, p.plasterShade));
    parts.push(rect(-30, -64, 60, 54, p.plaster));
    parts.push(timberFrame(-30, -64, 60, 54, p));
    parts.push(shingleRoof(-104, -64, 41, p, p.roof, p.roofDark, 4));
    parts.push(rect(-42, -66, 84, 3, p.woodDark));
    parts.push(chimney(22, -102, 10, 26, p, p.brick));
    parts.push(smokePuff(27, -110, 3.6, p, 0));
    parts.push(smokePuff(31, -120, 2.7, p, 1.5));
    parts.push(pixelDoor(-9, -34, 18, 34, p, p.wood, true));
    parts.push(rect(-12, -38, 24, 5, p.woodDark));
    parts.push(rect(-11, -37, 22, 3, p.wood));
    parts.push(pixelWindow(-25, -52, 10, 12, p, { lit: true, shutters: true, flowerBox: true }));
    parts.push(pixelWindow(15, -52, 10, 12, p, { lit: true, shutters: true, flowerBox: true }));
    parts.push(rect(-6, -30, 12, 1, p.woodDark, 'opacity="0.6"'));
    parts.push(rect(-5, -36, 10, 1, p.woodDark, 'opacity="0.6"'));
    // Awning and little shop sign.
    parts.push(rect(12, -32, 20, 3, p.roofDark));
    for (let i = 0; i < 4; i += 1) {
      parts.push(rect(12 + i * 5, -32, 3, 6, i % 2 === 0 ? '#e8d6b0' : p.roof));
    }
    parts.push(sign('HOME', -30, -17, 1, p, p.woodDark, p.bananaLight));
    parts.push(barrel(30, -3, p));
    parts.push(pottedPlant(29, -18, 0.9, p));
    parts.push(smallFence(-44, -2, 14, p));
    addLight(ctx, cx, base, -19, -45, 26, p.windowGlow);
    addLight(ctx, cx, base, 19, -45, 26, p.windowGlow);
    addLight(ctx, cx, base, 0, -24, 30, p.windowGlow);
  } else if (level === 2) {
    parts.push(rect(-38, -10, 76, 10, p.stoneDark));
    parts.push(rect(-36, -14, 72, 6, p.stone));
    parts.push(rect(-34, -124, 68, 110, p.brickDark));
    parts.push(rect(-32, -122, 64, 108, p.brick));
    parts.push(brickPattern(-32, -122, 64, 108, p, 9));
    parts.push(rect(-36, -126, 72, 5, p.brickDark));
    parts.push(rect(-28, -134, 18, 10, p.metalDark));
    parts.push(rect(-26, -132, 14, 6, p.metal));
    parts.push(chimney(20, -142, 11, 24, p, p.brickDark));
    parts.push(smokePuff(25, -149, 4, p, 0));
    parts.push(smokePuff(31, -160, 3, p, 1.7));
    parts.push(smokePuff(22, -170, 2.3, p, 3));
    for (let row = 0; row < 3; row += 1) {
      for (let col = 0; col < 3; col += 1) {
        parts.push(
          pixelWindow(-26 + col * 18, -108 + row * 28, 11, 14, p, {
            lit: (row + col) % 3 !== 0,
            sill: true,
          }),
        );
      }
    }
    // Fire escape.
    parts.push(rect(23, -104, 2, 86, p.metalDark));
    parts.push(rect(23, -104, 10, 2, p.metalDark));
    parts.push(rect(23, -76, 10, 2, p.metalDark));
    parts.push(rect(23, -48, 10, 2, p.metalDark));
    parts.push(line(25, -102, 31, -94, p.metalDark, 1.2));
    parts.push(rect(-38, -74, 4, 64, p.brickDark));
    // Ground-floor shop.
    parts.push(rect(-34, -30, 68, 3, p.metalDark));
    parts.push(pixelDoor(-26, -26, 16, 26, p, p.woodDark));
    parts.push(pixelWindow(-4, -24, 18, 12, p, { lit: true, sill: true }));
    parts.push(sign('BANANA CO', 10, -33, 1, p, p.woodDark, p.bananaLight));
    parts.push(rect(32, -24, 4, 24, p.metalDark));
    parts.push(barrel(-40, -2, p));
    parts.push(crate(38, -2, p, 0.8, true));
    addLight(ctx, cx, base, -16, -100, 26, p.windowGlow);
    addLight(ctx, cx, base, 6, -52, 26, p.windowGlow);
    addLight(ctx, cx, base, 8, -22, 24, p.windowGlow);
  } else if (level === 3) {
    parts.push(rect(-42, -12, 84, 12, p.stoneDark));
    parts.push(rect(-40, -16, 80, 6, p.stoneLight));
    parts.push(rect(-34, -168, 68, 154, p.metalDark));
    parts.push(rect(-32, -166, 64, 152, p.plaster));
    parts.push(rect(-30, -164, 60, 150, p.glass, 'opacity="0.78"'));
    for (let row = 0; row < 5; row += 1) {
      parts.push(rect(-30, -154 + row * 28, 60, 3, p.metalLight));
      parts.push(rect(-30, -124 + row * 28, 60, 2, p.metalDark, 'opacity="0.7"'));
      for (let col = 0; col < 4; col += 1) {
        parts.push(
          pixelWindow(-26 + col * 14, -148 + row * 28, 11, 17, p, {
            lit: (row + col) % 2 === 0,
            cross: false,
          }),
        );
      }
    }
    // Balconies on one side.
    for (let row = 0; row < 3; row += 1) {
      parts.push(rect(31, -140 + row * 28, 10, 3, p.stoneLight));
      parts.push(rect(31, -137 + row * 28, 1, 8, p.metalDark));
      parts.push(rect(39, -137 + row * 28, 1, 8, p.metalDark));
      parts.push(rect(32, -132 + row * 28, 3, 3, row % 2 === 0 ? p.leaf : p.accent));
    }
    parts.push(rect(-36, -172, 72, 6, p.metalLight));
    parts.push(rect(-28, -184, 24, 12, p.glass, 'opacity="0.75"'));
    parts.push(rect(-24, -182, 6, 4, p.grass));
    parts.push(rect(-16, -181, 5, 2, p.grassDark));
    parts.push(rect(-1, -186, 2, 14, p.metalDark));
    parts.push(circle(0, -188, 3, p.accent2, 'class="blink"'));
    parts.push(rect(20, -184, 4, 12, p.metalDark));
    parts.push(circle(22, -186, 3, p.accent));
    parts.push(pixelDoor(-10, -28, 20, 28, p, p.glassDark, false));
    parts.push(rect(-8, -26, 16, 26, p.glass));
    parts.push(rect(-8, -26, 16, 1, p.glassLight));
    parts.push(pottedPlant(-38, -2, 1, p));
    parts.push(pottedPlant(38, -2, 0.9, p));
    parts.push(bush(-46, -1, 0.6, p));
    addLight(ctx, cx, base, -14, -106, 34, p.windowGlow);
    addLight(ctx, cx, base, 18, -54, 30, p.windowGlow);
    addLight(ctx, cx, base, 0, -186, 26, p.accent2);
  } else {
    parts.push(rect(-42, -12, 84, 12, p.metalDark));
    parts.push(rect(-40, -16, 80, 6, p.metal));
    parts.push(rect(-38, -18, 76, 4, p.accent2, 'opacity="0.4"'));
    // Main habitat dome.
    parts.push(`<path d="M-34 -18 Q-34 -90 0 -96 Q34 -90 34 -18 Z" fill="${p.metalDark}"/>`);
    parts.push(`<path d="M-31 -18 Q-31 -86 0 -92 Q31 -86 31 -18 Z" fill="${p.glass}" opacity="0.82"/>`);
    parts.push(`<path d="M-31 -18 Q-31 -86 0 -92 Q31 -86 31 -18 Z" fill="none" stroke="${p.glassLight}" stroke-width="2" opacity="0.9"/>`);
    parts.push(`<path d="M-20 -18 Q-20 -66 0 -72 Q20 -66 20 -18" fill="none" stroke="${p.metalLight}" stroke-width="2" opacity="0.5"/>`);
    parts.push(rect(-28, -42, 56, 2, p.metalLight, 'opacity="0.5"'));
    parts.push(rect(-24, -66, 48, 2, p.metalLight, 'opacity="0.35"'));
    // Interior silhouettes: vines and homes.
    parts.push(rect(-24, -38, 12, 20, p.jungleDark));
    parts.push(rect(-21, -42, 6, 6, p.jungle));
    parts.push(rect(8, -34, 14, 16, p.metalDark));
    parts.push(rect(11, -31, 8, 10, p.window, 'opacity="0.8"'));
    parts.push(rect(-4, -50, 8, 32, p.metalDark));
    parts.push(rect(-2, -47, 4, 26, p.accent2, 'opacity="0.55"'));
    parts.push(pixelDoor(-8, -30, 16, 30, p, p.glassDark, true));
    // Side pod.
    parts.push(rect(34, -48, 16, 30, p.metalDark));
    parts.push(`<path d="M34 -48 Q42 -62 50 -48 Z" fill="${p.glass}" opacity="0.8"/>`);
    parts.push(rect(37, -14, 10, 14, p.metalDark));
    parts.push(rect(38, -12, 8, 8, p.accent2, 'opacity="0.65"'));
    // Solar petals.
    parts.push(rect(-40, -72, 2, 54, p.metalDark));
    parts.push(poly([[-42, -72], [-62, -80], [-42, -64]], p.accent2, 'opacity="0.75"'));
    parts.push(poly([[-40, -74], [-20, -82], [-40, -66]], p.accent2, 'opacity="0.55"'));
    parts.push(antenna(28, -96, 20, p, p.accent));
    parts.push(drone(-34, -104, p, 0.9));
    parts.push(grassTuft(-42, -6, 8, p));
    parts.push(flowers(40, -6, p, 0.9));
    addLight(ctx, cx, base, 0, -54, 44, p.accent2);
    addLight(ctx, cx, base, 40, -24, 24, p.accent2);
  }
  return parts.join('');
}

// ---------------------------------------------------------------------------
// Farm
// ---------------------------------------------------------------------------

function drawFarm(level: number, cx: number, base: number, ctx: BuildingContext): string {
  const p = ctx.palette;
  const parts: string[] = [];
  if (level === 0) {
    parts.push(rect(-48, -6, 96, 6, p.dirtDark));
    parts.push(rect(-44, -8, 88, 4, p.dirt));
    for (let i = 0; i < 4; i += 1) {
      parts.push(bananaPlant(-36 + i * 24, -4, 0.95 + (i % 2) * 0.18, p));
    }
    parts.push(smallFence(-48, -4, 22, p));
    parts.push(smallFence(26, -4, 22, p));
    parts.push(crate(-4, -3, p, 0.85, true));
    parts.push(rockCluster(42, -2, 0.5, p));
    parts.push(grassTuft(-20, -2, 7, p));
    parts.push(flowers(20, -2, p, 0.9));
    parts.push(bush(-46, -1, 0.7, p, true));
  } else if (level === 1) {
    parts.push(rect(-50, -7, 100, 7, p.dirtDark));
    parts.push(rect(-46, -9, 92, 4, p.dirt));
    for (let row = 0; row < 3; row += 1) {
      const y = -10 - row * 7;
      parts.push(rect(-45, y, 58, 6, row % 2 === 0 ? p.dirt : p.grassDark));
      for (let x = -41; x < 9; x += 7) {
        parts.push(rect(x, y - 5, 2, 5, p.banana));
        parts.push(rect(x + 1, y - 6, 1, 2, p.leaf));
        if (row === 1 && x % 14 === 0) {
          parts.push(rect(x - 1, y - 7, 4, 1, p.bananaLight, 'opacity="0.8"'));
        }
      }
    }
    parts.push(rect(16, -70, 32, 66, p.wood));
    parts.push(shingleRoof(-96, -68, 24, p, p.roof, p.roofDark, 3));
    parts.push(rect(21, -54, 22, 5, p.woodDark));
    parts.push(pixelDoor(23, -34, 14, 30, p, p.woodDark, true));
    parts.push(pixelWindow(34, -52, 9, 10, p, { lit: true, cross: false }));
    parts.push(rect(12, -26, 4, 22, p.woodDark));
    parts.push(rect(49, -24, 3, 20, p.woodDark));
    parts.push(sign('FARM', 34, -27, 1, p, p.woodDark, p.bananaLight));
    parts.push(rect(8, -18, 3, 18, p.woodDark));
    parts.push(rect(4, -22, 11, 5, p.accent));
    parts.push(rect(5, -21, 9, 3, p.plaster));
    parts.push(rect(6, -20, 1, 1, p.outline));
    parts.push(rect(10, -20, 1, 1, p.outline));
    parts.push(rect(-50, -8, 4, 8, p.woodDark));
    parts.push(barrel(-46, -2, p));
    parts.push(crate(-39, -2, p, 0.8, true));
    parts.push(hayBale(-30, -2, p));
    parts.push(flowers(6, -2, p, 0.9));
    addLight(ctx, cx, base, 30, -46, 24, p.windowGlow);
  } else if (level === 2) {
    parts.push(rect(-50, -8, 100, 8, p.dirtDark));
    parts.push(rect(-46, -12, 92, 5, p.dirt));
    parts.push(rect(-48, -22, 58, 12, p.grassDark));
    for (let i = 0; i < 7; i += 1) {
      parts.push(rect(-45 + i * 8, -27, 3, 5, p.banana));
      parts.push(rect(-44 + i * 8, -29, 1, 2, p.leaf));
    }
    // Processing silo.
    parts.push(rect(6, -78, 24, 70, p.metalDark));
    parts.push(rect(8, -76, 20, 70, p.metal));
    parts.push(rect(8, -76, 2, 70, p.metalLight, 'opacity="0.6"'));
    parts.push(poly([[6, -76], [18, -94], [30, -76]], p.metalDark));
    parts.push(rect(9, -62, 18, 2, p.metalDark));
    parts.push(rect(9, -44, 18, 2, p.metalDark));
    parts.push(rect(9, -26, 18, 2, p.metalDark));
    parts.push(rect(14, -72, 8, 4, p.accent2, 'opacity="0.8"'));
    parts.push(smokePuff(20, -100, 3.5, p, 0));
    parts.push(smokePuff(24, -110, 2.6, p, 1.5));
    // Brick barn with sawtooth roof.
    parts.push(rect(-46, -66, 44, 62, p.brickDark));
    parts.push(rect(-44, -64, 40, 60, p.brick));
    parts.push(brickPattern(-44, -64, 40, 60, p, 8));
    parts.push(poly([[-48, -64], [-38, -78], [-28, -64], [-18, -78], [-8, -64], [-4, -64], [-4, -60], [-48, -60]], p.metalDark));
    parts.push(rect(-44, -64, 40, 3, p.metalLight));
    parts.push(pixelDoor(-30, -30, 14, 28, p, p.woodDark));
    parts.push(pixelWindow(-24, -48, 10, 9, p, { lit: true, cross: false }));
    parts.push(rect(-46, -36, 4, 34, p.metalDark));
    parts.push(rect(-46, -36, 4, 2, p.metal));
    parts.push(sign('AGRO', -26, -19, 1, p, p.woodDark, p.bananaLight));
    parts.push(tractor(-44, -2, p));
    parts.push(crate(32, -2, p, 0.9, true));
    parts.push(crate(42, -2, p, 0.7, false));
    parts.push(barrel(27, -2, p));
    addLight(ctx, cx, base, 20, -52, 26, p.windowGlow);
    addLight(ctx, cx, base, 14, -30, 24, p.accent2);
  } else if (level === 3) {
    parts.push(rect(-50, -10, 100, 10, p.dirtDark));
    parts.push(rect(-46, -14, 92, 6, p.stone));
    // Vertical hydroponic tower.
    parts.push(rect(-38, -132, 76, 120, p.metalDark));
    parts.push(rect(-35, -129, 70, 117, p.plaster));
    parts.push(rect(-32, -126, 64, 112, p.glass, 'opacity="0.72"'));
    for (let row = 0; row < 5; row += 1) {
      const y = -118 + row * 21;
      parts.push(rect(-34, y, 68, 3, p.metalDark));
      for (let i = 0; i < 6; i += 1) {
        parts.push(rect(-30 + i * 10, y - 8, 5, 8, p.grass));
        parts.push(rect(-29 + i * 10, y - 10, 3, 2, p.grassLight));
        parts.push(rect(-28 + i * 10, y - 6, 2, 2, p.banana, 'opacity="0.8"'));
      }
      parts.push(rect(-34, y + 3, 68, 1, p.accent2, 'opacity="0.6"'));
    }
    parts.push(rect(-40, -138, 80, 6, p.metalLight));
    parts.push(rect(-40, -138, 80, 2, p.accent2, 'opacity="0.55"'));
    parts.push(antenna(28, -138, 26, p, p.accent2));
    parts.push(pixelDoor(-10, -28, 20, 28, p, p.glassDark, false));
    parts.push(rect(-8, -26, 16, 26, p.glass));
    parts.push(rect(-8, -26, 16, 1, p.glassLight));
    parts.push(rect(-44, -16, 4, 16, p.metalDark));
    parts.push(rect(40, -16, 4, 16, p.metalDark));
    parts.push(pottedPlant(-44, -2, 0.9, p));
    parts.push(pottedPlant(44, -2, 0.9, p));
    parts.push(drone(-26, -146, p, 1));
    parts.push(drone(24, -154, p, 0.8));
    parts.push(pixelText('O2', -8, -46, 2, p.accent2));
    addLight(ctx, cx, base, 0, -76, 40, '#8ae08a');
    addLight(ctx, cx, base, 0, -140, 26, p.accent2);
  } else {
    parts.push(rect(-48, -12, 96, 12, p.metalDark));
    parts.push(rect(-46, -16, 92, 6, p.metal));
    parts.push(rect(-44, -18, 88, 3, p.accent2, 'opacity="0.35"'));
    parts.push(`<path d="M-40 -18 Q-40 -106 0 -116 Q40 -106 40 -18 Z" fill="${p.metalDark}"/>`);
    parts.push(`<path d="M-37 -18 Q-37 -102 0 -112 Q37 -102 37 -18 Z" fill="${p.glass}" opacity="0.8"/>`);
    parts.push(`<path d="M-26 -18 Q-26 -84 0 -94 Q26 -84 26 -18" fill="none" stroke="${p.metalLight}" stroke-width="2" opacity="0.55"/>`);
    parts.push(rect(-30, -54, 60, 2, p.metalLight, 'opacity="0.5"'));
    for (let i = 0; i < 4; i += 1) {
      const x = -27 + i * 18;
      parts.push(rect(x, -34, 4, 18, p.grassDark));
      parts.push(rect(x + 1, -50, 2, 16, p.grass));
      parts.push(rect(x + 1, -58, 2, 8, p.grassLight));
      parts.push(rect(x + 1, -60, 2, 2, p.banana));
    }
    parts.push(pixelDoor(-9, -26, 18, 26, p, p.glassDark, true));
    parts.push(rect(-46, -16, 6, 16, p.metalDark));
    parts.push(rect(40, -16, 6, 16, p.metalDark));
    parts.push(antenna(-34, -112, 22, p, p.accent));
    parts.push(drone(28, -126, p, 1));
    parts.push(drone(-20, -136, p, 0.8));
    parts.push(grassTuft(-44, -6, 8, p));
    parts.push(flowers(40, -6, p, 0.9));
    parts.push(pixelText('HYDRO', -18, -48, 1, p.accent2));
    addLight(ctx, cx, base, 0, -70, 46, '#8ae08a');
    addLight(ctx, cx, base, 0, -16, 28, p.accent2);
  }
  return parts.join('');
}

// ---------------------------------------------------------------------------
// Community
// ---------------------------------------------------------------------------

function drawCommunity(level: number, cx: number, base: number, ctx: BuildingContext): string {
  const p = ctx.palette;
  const parts: string[] = [];
  if (level === 0) {
    parts.push(ellipse(0, -4, 30, 8, p.dirtDark));
    parts.push(firePit(0, -3, 1.1, p));
    parts.push(rockCluster(-28, -2, 0.7, p));
    parts.push(rockCluster(28, -2, 0.55, p));
    parts.push(rect(-34, -9, 14, 3, p.woodDark));
    parts.push(rect(20, -9, 14, 3, p.woodDark));
    parts.push(bananaBunch(24, -14, 1, p));
    parts.push(bananaBunch(-28, -14, 0.9, p));
    parts.push(grassTuft(-20, -2, 7, p));
    parts.push(flowers(18, -2, p, 0.8));
    // A small hide tent at the edge.
    parts.push(poly([[-42, -4], [-34, -30], [-24, -4]], p.plasterShade));
    parts.push(poly([[-40, -4], [-34, -27], [-27, -4]], p.plaster));
    parts.push(rect(-34, -25, 1, 18, p.woodDark));
    parts.push(poly([[-42, -30], [-34, -40], [-25, -30], [-33, -26]], p.roof));
    addLight(ctx, cx, base, 0, -18, 52, p.fire);
    addLight(ctx, cx, base, 0, -28, 26, p.fireLight);
  } else if (level === 1) {
    parts.push(rect(-44, -8, 88, 8, p.stoneDark));
    parts.push(rect(-42, -10, 84, 4, p.stone));
    parts.push(rect(-38, -66, 76, 56, p.plasterShade));
    parts.push(rect(-36, -64, 72, 54, p.plaster));
    parts.push(timberFrame(-36, -64, 72, 54, p));
    parts.push(shingleRoof(-102, -64, 46, p, p.roof, p.roofDark, 4));
    parts.push(chimney(-34, -96, 10, 28, p, p.brick));
    parts.push(smokePuff(-29, -104, 3.6, p, 0));
    parts.push(smokePuff(-24, -115, 2.7, p, 1.6));
    parts.push(pixelDoor(-12, -34, 24, 34, p, p.wood, true));
    parts.push(rect(-16, -38, 32, 5, p.woodDark));
    parts.push(rect(-14, -37, 28, 3, p.wood));
    parts.push(pixelWindow(-32, -50, 11, 12, p, { lit: true, shutters: true }));
    parts.push(pixelWindow(21, -50, 11, 12, p, { lit: true, shutters: true }));
    parts.push(sign('BANANA', 0, -27, 1, p, p.woodDark, p.bananaLight));
    parts.push(rect(-8, -48, 16, 6, p.woodDark));
    parts.push(rect(-7, -47, 14, 4, p.wood));
    parts.push(rect(-5, -46, 3, 2, p.banana));
    parts.push(barrel(-44, -2, p));
    parts.push(barrel(36, -2, p));
    parts.push(rect(30, -26, 3, 24, p.woodDark));
    parts.push(rect(27, -30, 9, 5, p.banana));
    parts.push(marketStall(20, -2, p));
    parts.push(pottedPlant(-36, -18, 0.8, p));
    addLight(ctx, cx, base, -28, -42, 28, p.windowGlow);
    addLight(ctx, cx, base, 25, -42, 28, p.windowGlow);
    addLight(ctx, cx, base, 0, -20, 30, p.windowGlow);
  } else if (level === 2) {
    parts.push(rect(-46, -12, 92, 12, p.stoneDark));
    parts.push(rect(-44, -16, 88, 6, p.stone));
    parts.push(rect(-42, -76, 84, 60, p.stone));
    parts.push(stonePattern(-42, -76, 84, 60, p, 10));
    parts.push(rect(-46, -80, 92, 5, p.stoneLight));
    parts.push(rect(-50, -84, 100, 4, p.stoneLight));
    parts.push(poly([[-50, -84], [0, -104], [50, -84]], p.roof));
    parts.push(poly([[-44, -88], [0, -100], [44, -88]], p.roofDark));
    for (let i = 0; i < 4; i += 1) {
      parts.push(rect(-32 + i * 22, -66, 7, 50, p.stoneLight));
      parts.push(rect(-32 + i * 22, -66, 7, 3, p.stone));
      parts.push(rect(-30 + i * 22, -48, 3, 22, p.stoneDark, 'opacity="0.35"'));
    }
    parts.push(pixelDoor(-10, -38, 20, 38, p, p.wood, true));
    parts.push(rect(-14, -42, 28, 5, p.stoneLight));
    parts.push(rect(-16, -6, 32, 6, p.stoneDark));
    parts.push(rect(-20, -2, 40, 2, p.stoneLight));
    parts.push(pixelWindow(-38, -62, 9, 14, p, { lit: true, arch: true }));
    parts.push(pixelWindow(29, -62, 9, 14, p, { lit: true, arch: true }));
    oddsAndEndsBanner(0, -86, p);
    parts.push(flag(-42, -86, p, p.accent));
    parts.push(flag(42, -86, p, p.accent2));
    parts.push(lampPost(-50, -2, p, 30));
    parts.push(lampPost(50, -2, p, 30));
    parts.push(pixelText('TOWN HALL', -28, -96, 1, p.stoneLight));
    addLight(ctx, cx, base, -42, -30, 24, p.windowGlow);
    addLight(ctx, cx, base, 42, -30, 24, p.windowGlow);
    addLight(ctx, cx, base, 0, -50, 28, p.windowGlow);
  } else if (level === 3) {
    parts.push(rect(-46, -14, 92, 14, p.stoneDark));
    parts.push(rect(-44, -18, 88, 6, p.metalLight));
    parts.push(rect(-42, -74, 84, 56, p.metalDark));
    parts.push(poly([[-40, -74], [-26, -108], [26, -108], [40, -74]], p.glass, 'opacity="0.75"'));
    parts.push(poly([[-26, -108], [0, -122], [26, -108]], p.glassLight, 'opacity="0.7"'));
    parts.push(rect(-34, -70, 68, 3, p.metalLight));
    for (let i = 0; i < 4; i += 1) {
      parts.push(rect(-32 + i * 19, -66, 4, 44, p.metalDark));
      parts.push(pixelWindow(-30 + i * 19, -60, 12, 10, p, { lit: true, cross: false }));
    }
    parts.push(pixelDoor(-11, -34, 22, 34, p, p.glassDark, false));
    parts.push(rect(-9, -32, 18, 32, p.glass));
    parts.push(rect(-9, -32, 18, 1, p.glassLight));
    parts.push(rect(-10, -76, 20, 4, p.accent2, 'opacity="0.8"'));
    parts.push(pixelText('HELLO', -16, -88, 1, p.accent2));
    // Holographic fountain.
    parts.push(ellipse(0, -8, 18, 5, p.stoneDark));
    parts.push(ellipse(0, -9, 14, 3, p.water));
    parts.push(rect(-2, -28, 4, 18, p.metalLight));
    parts.push(circle(0, -30, 5, p.accent2, 'opacity="0.35"'));
    parts.push(circle(0, -30, 2, p.accent2, 'class="blink"'));
    parts.push(flag(28, -108, p, p.accent));
    parts.push(flag(-28, -108, p, p.accent2));
    parts.push(pottedPlant(-42, -2, 1, p));
    parts.push(pottedPlant(42, -2, 0.9, p));
    addLight(ctx, cx, base, -20, -57, 30, p.accent2);
    addLight(ctx, cx, base, 20, -57, 30, p.accent2);
    addLight(ctx, cx, base, 0, -28, 34, p.accent2);
  } else {
    // Space elevator: a slim luminous ribbon rising out of the skyline.
    parts.push(rect(-40, -14, 80, 14, p.metalDark));
    parts.push(rect(-38, -18, 76, 6, p.metal));
    parts.push(rect(-34, -22, 68, 4, p.accent2, 'opacity="0.45"'));
    parts.push(rect(-4, -300, 8, 284, p.glass, 'opacity="0.35"'));
    parts.push(rect(-2, -300, 4, 284, p.accent, 'opacity="0.8"'));
    parts.push(rect(-1, -300, 2, 284, '#ffffff', 'opacity="0.45"'));
    for (let i = 0; i < 7; i += 1) {
      parts.push(rect(-6, -60 - i * 34, 12, 2, p.accent2, 'opacity="0.55"'));
    }
    // Base terminal.
    parts.push(rect(-30, -68, 60, 50, p.metalDark));
    parts.push(rect(-27, -65, 54, 47, p.metal));
    parts.push(rect(-24, -62, 48, 24, p.glass, 'opacity="0.75"'));
    parts.push(rect(-24, -62, 48, 2, p.accent2, 'opacity="0.7"'));
    parts.push(pixelDoor(-10, -34, 20, 34, p, p.glassDark, true));
    parts.push(rect(-8, -32, 16, 32, p.glass));
    parts.push(rect(-8, -32, 16, 1, p.glassLight));
    parts.push(rect(-36, -92, 72, 6, p.metalLight));
    parts.push(rect(-32, -110, 64, 18, p.metalDark));
    parts.push(rect(-28, -106, 56, 10, p.glass));
    parts.push(rect(-28, -106, 56, 2, p.accent2));
    parts.push(pixelText('ORBIT', -18, -118, 1, p.accent2));
    parts.push(rect(-44, -22, 5, 22, p.metalDark));
    parts.push(rect(39, -22, 5, 22, p.metalDark));
    parts.push(circle(0, -300, 7, p.accent, 'opacity="0.35"'));
    parts.push(circle(0, -300, 3, p.accent2, 'class="blink"'));
    parts.push(`<g class="orbit">${ellipse(0, -300, 68, 14, 'none', `stroke="${p.accent}" stroke-width="1.5" opacity="0.5"`)}</g>`);
    parts.push(antenna(-44, -22, 26, p, p.accent));
    parts.push(antenna(44, -22, 26, p, p.accent2));
    parts.push(grassTuft(-42, -6, 9, p));
    parts.push(flowers(40, -6, p, 0.9));
    addLight(ctx, cx, base, 0, -64, 44, p.accent2);
    addLight(ctx, cx, base, 0, -106, 30, p.accent);
    addLight(ctx, cx, base, 0, -300, 42, p.accent);
  }
  return parts.join('');
}

// ---------------------------------------------------------------------------
// Workshop
// ---------------------------------------------------------------------------

function drawWorkshop(level: number, cx: number, base: number, ctx: BuildingContext): string {
  const p = ctx.palette;
  const parts: string[] = [];
  if (level === 0) {
    parts.push(rect(-38, -6, 76, 6, p.dirtDark));
    parts.push(rect(-42, -44, 4, 38, p.woodDark));
    parts.push(rect(38, -44, 4, 38, p.woodDark));
    parts.push(rect(-40, -48, 80, 4, p.wood));
    parts.push(poly([[-46, -48], [0, -70], [46, -48]], p.roof));
    parts.push(poly([[-38, -52], [0, -64], [38, -52]], p.roofDark));
    parts.push(woodPlanks(-38, -46, 76, 4, p, 10));
    // Open-side workshop silhouette.
    parts.push(rect(-30, -20, 22, 16, p.stone));
    parts.push(rect(-26, -24, 14, 4, p.stoneDark));
    parts.push(rect(-24, -28, 10, 4, p.stoneLight));
    parts.push(rect(8, -28, 4, 24, p.woodDark));
    parts.push(rect(5, -32, 10, 5, p.metalDark));
    parts.push(rect(-10, -12, 16, 3, p.woodDark));
    parts.push(rect(-8, -16, 12, 3, p.wood));
    parts.push(rect(24, -12, 8, 8, p.wood));
    parts.push(rect(22, -14, 12, 3, p.woodLight));
    parts.push(rockCluster(-42, -1, 0.6, p));
    parts.push(rockCluster(44, -1, 0.45, p));
    parts.push(pixelText('FLINT', -14, -34, 1, p.woodLight));
    parts.push(grassTuft(16, -2, 7, p));
    parts.push(flowers(-36, -2, p, 0.8));
    addLight(ctx, cx, base, -8, -18, 22, p.fire);
  } else if (level === 1) {
    parts.push(rect(-38, -8, 76, 8, p.stoneDark));
    parts.push(rect(-36, -10, 72, 4, p.stone));
    parts.push(rect(-30, -82, 60, 72, p.stone));
    parts.push(stonePattern(-30, -82, 60, 72, p, 11));
    parts.push(rect(-34, -86, 68, 5, p.stoneLight));
    parts.push(shingleRoof(-116, -86, 37, p, p.roof, p.roofDark, 3));
    parts.push(rect(-9, -32, 18, 30, p.woodDark));
    parts.push(rect(-7, -30, 14, 28, p.wood));
    parts.push(pixelWindow(-24, -62, 10, 12, p, { lit: true, arch: true }));
    parts.push(pixelWindow(14, -62, 10, 12, p, { lit: true, arch: true }));
    parts.push(rect(-1, -92, 3, 28, p.metalDark));
    parts.push(rect(-4, -94, 9, 3, p.metal));
    parts.push(`<g transform="translate(0 -94)"><g class="windmill" style="animation-delay:-3s">${windmillSails(
      p,
    )}</g></g>`);
    parts.push(rect(-40, -10, 10, 8, p.wood));
    parts.push(rect(-42, -14, 14, 4, p.bananaDark));
    parts.push(crate(-42, -2, p, 0.8, true));
    parts.push(crate(34, -2, p, 0.9, false));
    parts.push(barrel(42, -2, p));
    parts.push(sign('MILL', 0, -40, 1, p, p.woodDark, p.bananaLight));
    parts.push(flowers(24, -2, p, 0.9));
    addLight(ctx, cx, base, -18, -54, 26, p.windowGlow);
    addLight(ctx, cx, base, 18, -54, 26, p.windowGlow);
  } else if (level === 2) {
    parts.push(rect(-40, -10, 80, 10, p.stoneDark));
    parts.push(rect(-38, -14, 76, 6, p.stone));
    parts.push(rect(-38, -96, 76, 84, p.brickDark));
    parts.push(rect(-36, -94, 72, 82, p.brick));
    parts.push(brickPattern(-36, -94, 72, 82, p, 9));
    // Sawtooth factory roof.
    for (let i = 0; i < 3; i += 1) {
      parts.push(poly([[-38 + i * 26, -94], [-24 + i * 26, -112], [-10 + i * 26, -94]], p.metalDark));
      parts.push(poly([[-34 + i * 26, -96], [-24 + i * 26, -108], [-14 + i * 26, -96]], p.glass, 'opacity="0.65"'));
    }
    parts.push(rect(-40, -96, 80, 4, p.metalLight));
    parts.push(chimney(-30, -118, 11, 28, p, p.brickDark));
    parts.push(chimney(22, -126, 12, 36, p, p.brickDark));
    parts.push(smokePuff(-25, -126, 4, p, 0));
    parts.push(smokePuff(-21, -138, 3, p, 1.5));
    parts.push(smokePuff(28, -136, 4, p, 0.7));
    parts.push(smokePuff(34, -150, 3, p, 2.2));
    for (let i = 0; i < 3; i += 1) {
      parts.push(pixelWindow(-28 + i * 21, -76, 12, 14, p, { lit: i !== 1, sill: true }));
      parts.push(pixelWindow(-28 + i * 21, -50, 12, 14, p, { lit: i === 1, sill: true }));
    }
    parts.push(pixelDoor(-10, -30, 20, 30, p, p.metalDark, false));
    parts.push(sign('BANANA CO', 0, -37, 1, p, p.woodDark, p.bananaLight));
    parts.push(rect(26, -22, 3, 22, p.metalDark));
    parts.push(`<g class="gear">${circle(32, -24, 6, p.metalDark)}${circle(
      32,
      -24,
      3,
      p.metal,
    )}${rect(30, -32, 4, 16, p.metalDark)}${rect(24, -26, 16, 4, p.metalDark)}</g>`);
    parts.push(pipeRun(40, -14, 18, p));
    parts.push(crate(-38, -2, p, 0.9, false));
    parts.push(crate(-28, -2, p, 0.7, true));
    addLight(ctx, cx, base, -18, -60, 28, p.windowGlow);
    addLight(ctx, cx, base, 32, -24, 24, p.fire);
    addLight(ctx, cx, base, 0, -20, 22, p.windowGlow);
  } else if (level === 3) {
    parts.push(rect(-40, -12, 80, 12, p.stoneDark));
    parts.push(rect(-38, -16, 76, 6, p.metalLight));
    parts.push(rect(-34, -104, 68, 90, p.metalDark));
    parts.push(rect(-32, -102, 64, 88, p.plaster));
    parts.push(rect(-28, -96, 56, 42, p.glass, 'opacity="0.8"'));
    parts.push(rect(-28, -96, 56, 2, p.accent2, 'opacity="0.7"'));
    parts.push(rect(-28, -54, 56, 3, p.metalDark));
    for (let i = 0; i < 3; i += 1) {
      parts.push(pixelWindow(-25 + i * 18, -88, 12, 12, p, { lit: true, cross: false }));
    }
    parts.push(pixelDoor(-10, -30, 20, 30, p, p.glassDark, false));
    parts.push(rect(-8, -28, 16, 28, p.glass));
    parts.push(rect(-8, -28, 16, 1, p.glassLight));
    parts.push(rect(-38, -110, 76, 6, p.metalLight));
    parts.push(rect(-26, -120, 24, 12, p.glass, 'opacity="0.75"'));
    parts.push(antenna(26, -110, 26, p, p.accent2));
    parts.push(`<g class="robotic-arm">${rect(-2, -22, 4, 20, p.metalDark)}${rect(
      -4,
      -24,
      8,
      4,
      p.accent,
    )}${rect(-1, -36, 2, 12, p.metal)}${rect(-4, -38, 8, 3, p.metalLight)}${rect(-2, -38, 4, 1, p.accent2)}</g>`);
    parts.push(rect(22, -18, 14, 18, p.metalDark));
    parts.push(rect(24, -16, 10, 14, p.glass));
    parts.push(rect(24, -16, 10, 1, p.glassLight));
    parts.push(pixelText('LAB', -12, -48, 1, p.accent));
    parts.push(drone(-30, -132, p, 0.9));
    parts.push(drone(30, -140, p, 0.7));
    parts.push(pottedPlant(-38, -2, 0.9, p));
    addLight(ctx, cx, base, 0, -36, 36, p.accent2);
    addLight(ctx, cx, base, 0, -96, 30, p.accent2);
  } else {
    parts.push(rect(-40, -14, 80, 14, p.metalDark));
    parts.push(rect(-38, -18, 76, 6, p.metal));
    parts.push(rect(-36, -20, 72, 3, p.accent, 'opacity="0.4"'));
    parts.push(rect(-34, -100, 68, 82, p.metalDark));
    parts.push(rect(-31, -98, 62, 80, p.metal));
    parts.push(rect(-28, -94, 56, 34, p.metalDark));
    parts.push(circle(0, -76, 22, p.accent, 'opacity="0.18"'));
    parts.push(circle(0, -76, 14, p.accent, 'opacity="0.35"'));
    parts.push(circle(0, -76, 8, p.accent2));
    parts.push(circle(0, -76, 4, '#ffffff'));
    parts.push(circle(0, -76, 2, p.accent2, 'class="blink"'));
    for (let i = 0; i < 4; i += 1) {
      parts.push(rect(-26 + i * 18, -50, 4, 30, p.metalDark));
      parts.push(rect(-26 + i * 18, -50, 4, 1, p.accent2, 'opacity="0.5"'));
    }
    parts.push(rect(-10, -32, 20, 32, p.metalDark));
    parts.push(rect(-8, -30, 16, 30, p.glass));
    parts.push(rect(-8, -30, 16, 1, p.glassLight));
    parts.push(rect(-40, -22, 5, 22, p.metalDark));
    parts.push(rect(35, -22, 5, 22, p.metalDark));
    parts.push(`<g class="energy-arc">${poly(
      [[-18, -76], [-10, -84], [-4, -76], [4, -86], [10, -76], [18, -84]],
      'none',
      `stroke="${p.accent2}" stroke-width="2" opacity="0.8"`,
    )}</g>`);
    parts.push(drone(-30, -118, p, 0.9));
    parts.push(drone(30, -128, p, 0.8));
    parts.push(pixelText('NANO', -12, -60, 1, p.accent2));
    parts.push(pottedPlant(-36, -4, 0.8, p));
    addLight(ctx, cx, base, 0, -76, 52, p.accent);
    addLight(ctx, cx, base, 0, -20, 30, p.accent2);
  }
  return parts.join('');
}

// ---------------------------------------------------------------------------
// Culture
// ---------------------------------------------------------------------------

function drawCulture(level: number, cx: number, base: number, ctx: BuildingContext): string {
  const p = ctx.palette;
  const parts: string[] = [];
  if (level === 0) {
    parts.push(ellipse(0, -3, 26, 5, p.dirtDark));
    parts.push(rect(-7, -86, 14, 86, p.wood));
    parts.push(woodPlanks(-7, -86, 14, 86, p, 6));
    parts.push(rect(-9, -8, 18, 8, p.stoneDark));
    parts.push(poly([[-9, -86], [-24, -102], [-9, -72]], p.accent));
    parts.push(poly([[9, -86], [24, -102], [9, -72]], p.accent));
    parts.push(poly([[-9, -76], [-20, -90], [-9, -64]], p.accent2));
    parts.push(poly([[9, -76], [20, -90], [9, -64]], p.accent2));
    parts.push(faceCarving(0, -72, p));
    parts.push(faceCarving(0, -50, p));
    parts.push(faceCarving(0, -28, p));
    parts.push(bananaBunch(0, -90, 1.2, p));
    parts.push(rockCluster(-30, -2, 0.7, p));
    parts.push(rockCluster(30, -2, 0.6, p));
    parts.push(firePit(28, -2, 0.7, p));
    parts.push(flowers(-24, -2, p, 0.8));
    addLight(ctx, cx, base, 0, -64, 24, p.accent);
    addLight(ctx, cx, base, 28, -12, 22, p.fire);
  } else if (level === 1) {
    parts.push(rect(-28, -10, 56, 10, p.stoneDark));
    parts.push(rect(-26, -12, 52, 4, p.stone));
    parts.push(rect(-24, -104, 48, 94, p.stone));
    parts.push(stonePattern(-24, -104, 48, 94, p, 10));
    parts.push(rect(-28, -108, 56, 5, p.stoneLight));
    parts.push(shingleRoof(-140, -108, 31, p, p.roof, p.roofDark, 3));
    parts.push(rect(-4, -146, 8, 8, p.metalDark));
    parts.push(flag(0, -146, p, p.accent2));
    parts.push(pixelDoor(-8, -28, 16, 26, p, p.woodDark, true));
    parts.push(pixelWindow(-16, -76, 8, 18, p, { lit: true, arch: true }));
    parts.push(pixelWindow(8, -76, 8, 18, p, { lit: true, arch: true }));
    parts.push(ellipse(0, -68, 14, 5, p.stoneDark));
    parts.push(ellipse(0, -68, 11, 3, p.stoneLight));
    parts.push(`<g class="bell" style="transform-origin:0px -70px">${poly(
      [[-6, -70], [-4, -60], [4, -60], [6, -70]],
      p.accent,
    )}${rect(-6, -60, 12, 2, p.accentDark)}${circle(0, -57, 2, p.accentDark)}${rect(
      -1,
      -74,
      2,
      4,
      p.metalDark,
    )}</g>`);
    parts.push(rect(-30, -12, 8, 10, p.wood));
    parts.push(rect(-32, -16, 12, 4, p.bananaDark));
    parts.push(pixelText('BELL', -14, -44, 1, p.stoneLight));
    parts.push(lampPost(-32, -2, p, 26));
    parts.push(lampPost(32, -2, p, 26));
    parts.push(flowers(22, -2, p, 0.8));
    addLight(ctx, cx, base, -12, -66, 24, p.windowGlow);
    addLight(ctx, cx, base, 12, -66, 24, p.windowGlow);
    addLight(ctx, cx, base, 0, -66, 18, p.accent);
  } else if (level === 2) {
    parts.push(rect(-30, -12, 60, 12, p.stoneDark));
    parts.push(rect(-28, -14, 56, 4, p.stone));
    parts.push(rect(-26, -140, 52, 126, p.brickDark));
    parts.push(rect(-24, -138, 48, 124, p.brick));
    parts.push(brickPattern(-24, -138, 48, 124, p, 9));
    parts.push(rect(-30, -142, 60, 5, p.brickDark));
    parts.push(shingleRoof(-172, -142, 35, p, p.roof, p.roofDark, 3));
    parts.push(rect(-4, -178, 8, 8, p.metalDark));
    parts.push(flag(0, -178, p, p.accent));
    // Clock face.
    parts.push(circle(0, -112, 17, p.outline));
    parts.push(circle(0, -112, 15, p.plaster));
    parts.push(circle(0, -112, 14, p.stoneLight, 'opacity="0.45"'));
    for (let i = 0; i < 12; i += 1) {
      const angle = (i / 12) * Math.PI * 2;
      parts.push(rect(Math.cos(angle) * 11, -112 + Math.sin(angle) * 11, 2, 2, p.outline));
    }
    parts.push(rect(-1, -124, 2, 13, p.outline));
    parts.push(rect(0, -113, 8, 2, p.outline));
    parts.push(circle(0, -112, 2, p.accent));
    parts.push(rect(-18, -140, 36, 3, p.brickDark));
    parts.push(pixelDoor(-9, -30, 18, 28, p, p.woodDark, true));
    parts.push(pixelWindow(-16, -80, 8, 14, p, { lit: true, arch: true }));
    parts.push(pixelWindow(8, -80, 8, 14, p, { lit: true, arch: true }));
    parts.push(pixelText('TIME', -10, -50, 1, p.plaster));
    parts.push(rect(24, -174, 3, 22, p.metalDark));
    parts.push(circle(25, -176, 3, p.accent));
    parts.push(lampPost(-30, -2, p, 24));
    parts.push(lampPost(30, -2, p, 24));
    addLight(ctx, cx, base, -14, -70, 26, p.windowGlow);
    addLight(ctx, cx, base, 14, -70, 26, p.windowGlow);
    addLight(ctx, cx, base, 0, -112, 20, p.accent);
  } else if (level === 3) {
    parts.push(rect(-34, -14, 68, 14, p.stoneDark));
    parts.push(rect(-32, -18, 64, 6, p.metalLight));
    parts.push(rect(-28, -22, 56, 8, p.metal));
    // Lattice broadcast tower.
    for (let i = 0; i < 7; i += 1) {
      const w = 30 - i * 3.6;
      const y = -28 - i * 22;
      parts.push(rect(-w / 2, y, 2, 22, p.metalDark));
      parts.push(rect(w / 2 - 2, y, 2, 22, p.metalDark));
      parts.push(line(-w / 2, y, w / 2, y + 22, p.metalDark, 1, 'opacity="0.7"'));
      parts.push(line(w / 2, y, -w / 2, y + 22, p.metalDark, 1, 'opacity="0.45"'));
    }
    parts.push(rect(-6, -190, 12, 12, p.metalDark));
    parts.push(rect(-4, -188, 8, 8, p.accent, 'class="blink"'));
    parts.push(circle(0, -184, 12, p.accent, 'opacity="0.18"'));
    parts.push(`<g class="dish">${ellipse(18, -74, 15, 6, p.metalLight)}${ellipse(
      18,
      -74,
      9,
      3,
      p.metalDark,
    )}${line(18, -74, 18, -62, p.metalDark, 2)}</g>`);
    parts.push(rect(-28, -36, 56, 3, p.accent2, 'opacity="0.6"'));
    parts.push(pixelText('5G', -8, -42, 2, p.accent2));
    for (let i = 0; i < 3; i += 1) {
      parts.push(
        `<path d="M${-14 - i * 6} ${-126 - i * 8} q${18 + i * 6} ${-18 - i * 8} ${36 + i * 12} 0" fill="none" stroke="${p.accent2}" stroke-width="2" class="radio-wave" style="animation-delay:-${i * 0.8}s" opacity="0.8"/>`,
      );
    }
    parts.push(pixelDoor(-9, -28, 18, 28, p, p.glassDark, false));
    parts.push(rect(-8, -26, 16, 26, p.glass));
    parts.push(rect(-8, -26, 16, 1, p.glassLight));
    parts.push(pottedPlant(-30, -14, 0.9, p));
    parts.push(pottedPlant(30, -14, 0.9, p));
    addLight(ctx, cx, base, 0, -184, 40, p.accent);
    addLight(ctx, cx, base, 0, -70, 28, p.accent2);
  } else {
    parts.push(rect(-36, -16, 72, 16, p.metalDark));
    parts.push(rect(-34, -20, 68, 6, p.metal));
    parts.push(rect(-32, -22, 64, 3, p.accent2, 'opacity="0.5"'));
    // Observatory base.
    parts.push(rect(-32, -72, 64, 52, p.metalDark));
    parts.push(rect(-30, -70, 60, 50, p.plaster));
    parts.push(rect(-30, -70, 60, 2, p.accent2, 'opacity="0.5"'));
    parts.push(pixelDoor(-10, -34, 20, 34, p, p.glassDark, true));
    parts.push(rect(-8, -32, 16, 32, p.glass));
    for (let i = 0; i < 3; i += 1) {
      parts.push(pixelWindow(-24 + i * 20, -60, 11, 11, p, { lit: true, cross: false }));
    }
    // Dome.
    parts.push(`<path d="M-34 -72 Q-34 -114 0 -118 Q34 -114 34 -72 Z" fill="${p.metalDark}"/>`);
    parts.push(`<path d="M-31 -72 Q-31 -110 0 -114 Q31 -110 31 -72 Z" fill="${p.metalLight}"/>`);
    parts.push(`<path d="M-18 -72 Q-18 -104 0 -108 Q18 -104 18 -72" fill="none" stroke="${p.metalDark}" stroke-width="2" opacity="0.5"/>`);
    parts.push(rect(-2, -118, 4, 8, p.metalDark));
    parts.push(`<g class="telescope">${rect(-4, -96, 8, 24, p.plaster)}${rect(-6, -104, 12, 10, p.metalDark)}${rect(-9, -112, 18, 10, p.accent2)}${circle(-9, -107, 4, p.glassLight)}${rect(-1, -116, 2, 5, p.metalLight)}</g>`);
    parts.push(`<g class="orbit-ring">${ellipse(0, -96, 26, 9, 'none', `stroke="${p.accent2}" stroke-width="1" opacity="0.5"`)}</g>`);
    parts.push(circle(0, -96, 5, p.accent, 'opacity="0.3"'));
    parts.push(pixelText('SETI', -12, -46, 1, p.accent2));
    parts.push(antenna(-28, -114, 28, p, p.accent));
    parts.push(drone(26, -128, p, 0.8));
    addLight(ctx, cx, base, 0, -96, 44, p.accent2);
    addLight(ctx, cx, base, 0, -40, 26, p.accent2);
  }
  return parts.join('');
}

// ---------------------------------------------------------------------------
// Wonder
// ---------------------------------------------------------------------------

function drawWonder(level: number, cx: number, base: number, ctx: BuildingContext): string {
  const p = ctx.palette;
  const parts: string[] = [];
  if (level === 0) {
    parts.push(ellipse(0, -3, 42, 7, p.dirtDark));
    parts.push(rect(-34, -64, 16, 64, p.stone));
    parts.push(rect(-32, -66, 12, 4, p.stoneLight));
    parts.push(rect(-6, -82, 16, 82, p.stoneDark));
    parts.push(rect(-4, -84, 12, 4, p.stoneLight));
    parts.push(rect(26, -56, 14, 56, p.stone));
    parts.push(rect(28, -58, 10, 4, p.stoneLight));
    parts.push(rect(-34, -52, 74, 5, p.stoneDark));
    parts.push(rect(-30, -50, 66, 4, p.stone));
    parts.push(bananaGlyph(0, -46, p));
    parts.push(pixelText('OOK', -20, -36, 1, p.accent));
    parts.push(firePit(-40, -2, 0.7, p));
    parts.push(rockCluster(42, -2, 0.65, p));
    parts.push(grassTuft(20, -2, 8, p));
    parts.push(flowers(-20, -2, p, 0.8));
    addLight(ctx, cx, base, 0, -42, 28, p.accent);
    addLight(ctx, cx, base, -40, -12, 24, p.fire);
  } else if (level === 1) {
    parts.push(rect(-48, -14, 96, 14, p.stoneDark));
    parts.push(rect(-46, -18, 92, 6, p.stone));
    parts.push(rect(-44, -86, 88, 68, p.stone));
    parts.push(stonePattern(-44, -86, 88, 68, p, 10));
    parts.push(rect(-48, -90, 96, 6, p.stoneLight));
    // Twin towers.
    parts.push(rect(-30, -128, 20, 42, p.stone));
    parts.push(rect(10, -128, 20, 42, p.stone));
    parts.push(battlement(-32, -128, 24, p, p.stoneLight, 8));
    parts.push(battlement(8, -128, 24, p, p.stoneLight, 8));
    parts.push(battlement(-50, -90, 100, p, p.stoneLight, 8));
    parts.push(flag(-20, -132, p, p.accent));
    parts.push(flag(20, -132, p, p.accent2));
    parts.push(pixelDoor(-12, -42, 24, 42, p, p.woodDark, true));
    parts.push(rect(-16, -46, 32, 5, p.stoneLight));
    parts.push(pixelWindow(-40, -70, 9, 14, p, { lit: true, arch: true }));
    parts.push(pixelWindow(31, -70, 9, 14, p, { lit: true, arch: true }));
    parts.push(pixelWindow(-22, -108, 7, 12, p, { lit: true, arch: true }));
    parts.push(pixelWindow(15, -108, 7, 12, p, { lit: true, arch: true }));
    parts.push(pixelText('KEEP', -12, -76, 1, p.stoneLight));
    parts.push(lampPost(-46, -2, p, 30));
    parts.push(lampPost(46, -2, p, 30));
    parts.push(smallFence(-56, -2, 14, p));
    addLight(ctx, cx, base, -18, -56, 28, p.windowGlow);
    addLight(ctx, cx, base, 18, -56, 28, p.windowGlow);
    addLight(ctx, cx, base, 0, -26, 30, p.windowGlow);
  } else if (level === 2) {
    parts.push(rect(-52, -16, 104, 16, p.stoneDark));
    parts.push(rect(-48, -20, 96, 6, p.stone));
    parts.push(rect(-40, -24, 80, 8, p.stoneLight));
    // Ferris wheel.
    parts.push(`<g transform="translate(0 -108)"><g class="ferris" style="animation-delay:-2s">${ferrisWheel(
      p,
    )}</g></g>`);
    parts.push(rect(-5, -108, 10, 88, p.metalDark));
    parts.push(rect(-9, -116, 18, 8, p.metalLight));
    parts.push(rect(-8, -114, 16, 4, p.accent));
    parts.push(rect(-5, -112, 10, 2, p.accent2));
    // Fair pavilion.
    parts.push(rect(-38, -56, 30, 32, p.plaster));
    parts.push(poly([[-42, -56], [-23, -74], [-4, -56]], p.accent));
    parts.push(rect(-31, -46, 12, 22, p.woodDark));
    parts.push(rect(-29, -44, 8, 18, p.wood));
    parts.push(rect(18, -54, 26, 30, p.plaster));
    parts.push(poly([[14, -54], [31, -70], [48, -54]], p.accent2));
    parts.push(rect(24, -44, 14, 20, p.woodDark));
    parts.push(rect(26, -42, 10, 16, p.wood));
    for (let i = 0; i < 7; i += 1) {
      parts.push(rect(-48 + i * 14, -34, 3, 3, i % 2 === 0 ? p.accent : p.accent2));
    }
    parts.push(pixelText('FAIR', -12, -12, 1, p.plaster));
    parts.push(lampPost(-44, -2, p, 24));
    parts.push(lampPost(44, -2, p, 24));
    parts.push(flowers(-14, -2, p, 0.8));
    addLight(ctx, cx, base, -30, -12, 26, p.accent);
    addLight(ctx, cx, base, 30, -12, 26, p.accent2);
    addLight(ctx, cx, base, 0, -108, 44, p.accent);
  } else if (level === 3) {
    parts.push(rect(-50, -16, 100, 16, p.stoneLight));
    parts.push(rect(-46, -20, 92, 6, p.stone));
    // Classical museum.
    parts.push(rect(-44, -76, 88, 56, p.plaster));
    parts.push(rect(-48, -80, 96, 5, p.stoneLight));
    parts.push(poly([[-48, -80], [0, -102], [48, -80]], p.plasterShade));
    parts.push(poly([[-42, -82], [0, -98], [42, -82]], p.roof));
    for (let i = 0; i < 5; i += 1) {
      parts.push(rect(-36 + i * 18, -74, 8, 46, p.stoneLight));
      parts.push(rect(-36 + i * 18, -74, 8, 3, p.stone));
      parts.push(rect(-34 + i * 18, -58, 4, 28, p.stoneDark, 'opacity="0.35"'));
    }
    parts.push(rect(-14, -38, 28, 30, p.stoneDark));
    parts.push(rect(-12, -36, 24, 28, p.woodDark));
    parts.push(pixelWindow(24, -62, 9, 14, p, { lit: true, arch: true }));
    parts.push(pixelWindow(-33, -62, 9, 14, p, { lit: true, arch: true }));
    // Giant banana sculpture.
    parts.push(giantBanana(0, -50, 1.25, p));
    parts.push(rect(-12, -38, 24, 3, p.stoneLight));
    parts.push(pixelText('MUSEUM', -27, -12, 1, p.accent));
    parts.push(flag(-40, -104, p, p.accent));
    parts.push(flag(40, -104, p, p.accent2));
    parts.push(pottedPlant(-50, -2, 0.9, p));
    parts.push(pottedPlant(50, -2, 0.9, p));
    addLight(ctx, cx, base, 0, -54, 46, p.accent);
    addLight(ctx, cx, base, -36, -18, 24, p.windowGlow);
    addLight(ctx, cx, base, 36, -18, 24, p.windowGlow);
  } else {
    // Orbital Banana: a floating ring around a glowing banana.
    parts.push(rect(-46, -18, 92, 18, p.metalDark));
    parts.push(rect(-44, -22, 88, 6, p.metal));
    parts.push(rect(-40, -24, 80, 3, p.accent2, 'opacity="0.5"'));
    parts.push(rect(-4, -180, 8, 158, p.accent2, 'opacity="0.25"'));
    parts.push(rect(-2, -180, 4, 158, p.accent, 'opacity="0.7"'));
    parts.push(`<g transform="translate(0 -214)"><g class="orbit" style="animation-delay:-4s">${orbitalRing(
      p,
    )}</g></g>`);
    parts.push(circle(0, -214, 30, p.accent, 'opacity="0.12"'));
    parts.push(circle(0, -214, 18, p.accent, 'opacity="0.18"'));
    parts.push(rect(-18, -222, 36, 4, p.metalLight));
    parts.push(rect(-14, -238, 28, 16, p.metalDark));
    parts.push(rect(-11, -235, 22, 10, p.glass));
    parts.push(rect(-11, -235, 22, 2, p.accent2));
    parts.push(pixelText('ORBITAL', -21, -250, 1, p.accent2));
    parts.push(pixelText('BANANA', -18, -242, 1, p.accent2));
    parts.push(rect(-40, -44, 8, 26, p.metalDark));
    parts.push(rect(32, -44, 8, 26, p.metalDark));
    parts.push(circle(-36, -46, 3, p.accent2, 'class="blink"'));
    parts.push(circle(36, -46, 3, p.accent, 'class="blink"'));
    parts.push(antenna(-46, -24, 30, p, p.accent));
    parts.push(antenna(46, -24, 30, p, p.accent2));
    parts.push(pottedPlant(-48, -2, 0.8, p));
    parts.push(pottedPlant(48, -2, 0.8, p));
    addLight(ctx, cx, base, 0, -214, 80, p.accent);
    addLight(ctx, cx, base, 0, -44, 34, p.accent2);
  }
  return parts.join('');
}

// ---------------------------------------------------------------------------
// Energy
// ---------------------------------------------------------------------------

function drawEnergy(level: number, cx: number, base: number, ctx: BuildingContext): string {
  const p = ctx.palette;
  const parts: string[] = [];
  if (level <= 1) return '';
  if (level === 2) {
    parts.push(rect(-44, -16, 88, 16, p.stoneDark));
    parts.push(rect(-42, -20, 84, 6, p.stone));
    // Coal plant: two brick halls, chimneys, conveyors.
    parts.push(rect(-34, -70, 34, 50, p.brickDark));
    parts.push(rect(-32, -68, 30, 48, p.brick));
    parts.push(poly([[-36, -70], [-26, -84], [-16, -70]], p.metalDark));
    parts.push(rect(-30, -112, 11, 42, p.brickDark));
    parts.push(rect(-28, -110, 7, 40, p.brick));
    parts.push(rect(-31, -116, 13, 5, p.brickDark));
    parts.push(smokePuff(-25, -124, 4, p, 0));
    parts.push(smokePuff(-20, -136, 3, p, 1.6));
    parts.push(rect(2, -58, 32, 38, p.brickDark));
    parts.push(rect(4, -56, 28, 36, p.brick));
    parts.push(rect(10, -92, 10, 34, p.brickDark));
    parts.push(rect(12, -90, 6, 32, p.brick));
    parts.push(rect(9, -96, 12, 5, p.brickDark));
    parts.push(smokePuff(15, -104, 4, p, 0.7));
    parts.push(smokePuff(20, -116, 3, p, 2.2));
    for (let i = 0; i < 2; i += 1) {
      parts.push(pixelWindow(-28 + i * 16, -56, 9, 10, p, { lit: true, cross: false }));
      parts.push(pixelWindow(10 + i * 14, -48, 9, 10, p, { lit: i === 0, cross: false }));
    }
    parts.push(rect(-38, -18, 20, 12, p.metalDark));
    parts.push(rect(-36, -22, 16, 4, p.metal));
    parts.push(pipeRun(34, -20, 26, p));
    parts.push(coalPile(-42, -2, p));
    parts.push(pixelText('POWER', -16, -38, 1, p.plaster));
    parts.push(line(-44, -56, -56, -56, p.metalDark, 2));
    parts.push(line(-56, -56, -56, -84, p.metalDark, 2));
    addLight(ctx, cx, base, -24, -52, 28, p.windowGlow);
    addLight(ctx, cx, base, 14, -44, 24, p.fire);
  } else if (level === 3) {
    parts.push(rect(-44, -14, 88, 14, p.dirtDark));
    parts.push(rect(-42, -18, 84, 6, p.stone));
    // Solar array.
    for (let i = 0; i < 4; i += 1) {
      const x = -36 + i * 20;
      parts.push(`<g transform="translate(${x} -18)">${rect(-9, -4, 18, 4, p.metalDark)}${poly(
        [[-9, -4], [9, -4], [6, -18], [-6, -18]],
        p.glassDark,
      )}${poly([[-6, -18], [6, -18], [5, -23], [-5, -23]], p.glassLight)}${rect(
        -7,
        -13,
        14,
        1,
        p.glassDark,
      )}${rect(-6, -8, 12, 1, p.glassDark)}</g>`);
    }
    parts.push(rect(-4, -26, 8, 14, p.metalDark));
    parts.push(rect(-2, -24, 4, 12, p.accent2));
    parts.push(`<g transform="translate(30 -34)"><g class="turbine" style="animation-delay:-2s">${turbineBlades(
      p,
    )}</g></g>`);
    parts.push(rect(28, -34, 4, 24, p.metalLight));
    parts.push(rect(24, -12, 12, 12, p.metalDark));
    parts.push(rect(26, -10, 8, 8, p.accent2));
    parts.push(rect(-38, -20, 18, 6, p.metalDark));
    parts.push(rect(-36, -18, 14, 3, p.metalLight));
    parts.push(circle(-36, -16, 1.5, p.accent2, 'class="blink"'));
    parts.push(pixelText('CLEAN', -22, -32, 1, p.accent2));
    parts.push(grassTuft(-42, -2, 8, p));
    parts.push(flowers(20, -2, p, 0.9));
    addLight(ctx, cx, base, 0, -20, 30, p.accent2);
    addLight(ctx, cx, base, 30, -34, 24, p.accent2);
  } else {
    parts.push(rect(-42, -16, 84, 16, p.metalDark));
    parts.push(rect(-40, -20, 80, 6, p.metal));
    parts.push(rect(-38, -22, 76, 3, p.accent2, 'opacity="0.45"'));
    // Fusion core.
    parts.push(circle(0, -62, 30, p.accent, 'opacity="0.16"'));
    parts.push(circle(0, -62, 20, p.accent, 'opacity="0.24"'));
    parts.push(circle(0, -62, 13, p.metalDark));
    parts.push(circle(0, -62, 9, p.accent2));
    parts.push(circle(0, -62, 5, '#ffffff'));
    parts.push(circle(0, -62, 2, p.accent));
    parts.push(rect(-12, -62, 24, 3, p.metalLight));
    parts.push(rect(-2, -76, 4, 28, p.metalLight));
    parts.push(rect(-42, -84, 12, 64, p.brick));
    parts.push(rect(30, -84, 12, 64, p.brick));
    parts.push(rect(-44, -88, 16, 5, p.brickDark));
    parts.push(rect(28, -88, 16, 5, p.brickDark));
    parts.push(smokePuff(-38, -96, 3, p, 0));
    parts.push(smokePuff(38, -96, 3, p, 1.2));
    for (let i = 0; i < 4; i += 1) {
      parts.push(rect(-30 + i * 20, -34, 4, 14, p.metalDark));
    }
    parts.push(pixelText('FUSION', -22, -36, 1, p.accent2));
    parts.push(`<path d="M-16 -62 q16 -28 32 0" fill="none" stroke="${p.accent2}" stroke-width="2" class="energy-arc"/>`);
    parts.push(drone(-30, -108, p, 0.8));
    parts.push(drone(32, -114, p, 0.7));
    addLight(ctx, cx, base, 0, -62, 64, p.accent);
    addLight(ctx, cx, base, -38, -96, 20, p.fire);
    addLight(ctx, cx, base, 38, -96, 20, p.fire);
  }
  return parts.join('');
}

// ---------------------------------------------------------------------------
// Spaceport
// ---------------------------------------------------------------------------

function drawSpaceport(level: number, cx: number, base: number, ctx: BuildingContext): string {
  const p = ctx.palette;
  const parts: string[] = [];
  if (level <= 2) return '';
  if (level === 3) {
    parts.push(rect(-40, -14, 80, 14, p.stoneDark));
    parts.push(rect(-38, -18, 76, 6, p.stone));
    parts.push(rect(-34, -64, 64, 46, p.metalDark));
    parts.push(rect(-32, -62, 60, 44, p.plaster));
    parts.push(rect(-32, -62, 60, 2, p.accent2, 'opacity="0.6"'));
    for (let i = 0; i < 3; i += 1) {
      parts.push(pixelWindow(-24 + i * 19, -56, 13, 10, p, { lit: true, cross: false }));
    }
    parts.push(pixelDoor(-10, -32, 20, 32, p, p.glassDark, true));
    parts.push(rect(-8, -30, 16, 30, p.glass));
    parts.push(rect(-8, -30, 16, 1, p.glassLight));
    parts.push(`<g class="dish">${ellipse(
      0,
      -84,
      18,
      7,
      p.metalLight,
    )}${ellipse(0, -84, 11, 4, p.metalDark)}${line(0, -84, 0, -66, p.metalDark, 2)}</g>`);
    parts.push(rect(24, -56, 3, 38, p.metalDark));
    parts.push(circle(25, -58, 3, p.accent, 'class="blink"'));
    parts.push(pixelText('MISSION', -26, -72, 1, p.accent2));
    parts.push(pixelText('CTRL', -12, -64, 1, p.accent2));
    parts.push(antenna(-30, -62, 28, p, p.accent));
    parts.push(pottedPlant(-40, -2, 0.9, p));
    parts.push(pottedPlant(38, -2, 0.9, p));
    addLight(ctx, cx, base, -14, -48, 30, p.accent2);
    addLight(ctx, cx, base, 0, -84, 26, p.accent);
  } else {
    // Launch complex.
    parts.push(rect(-42, -16, 84, 16, p.stoneDark));
    parts.push(rect(-40, -20, 80, 6, p.stone));
    parts.push(rect(-36, -24, 72, 4, p.metalDark));
    // Gantry.
    parts.push(rect(22, -210, 4, 192, p.metalDark));
    parts.push(rect(18, -210, 12, 4, p.metal));
    for (let y = -196; y < -28; y += 24) {
      parts.push(rect(16, y, 16, 3, p.metal));
      parts.push(line(16, y + 3, 28, y + 21, p.metalDark, 1, 'opacity="0.7"'));
    }
    parts.push(rect(14, -198, 20, 3, p.accent));
    // Rocket.
    parts.push(rect(-6, -204, 12, 180, p.metalDark));
    parts.push(rect(-4, -202, 8, 176, p.metalLight));
    parts.push(poly([[-6, -204], [0, -244], [6, -204]], p.accent));
    parts.push(poly([[-4, -206], [0, -238], [4, -206]], p.accentDark));
    parts.push(rect(-4, -238, 8, 3, '#ffffff', 'opacity="0.8"'));
    parts.push(rect(-4, -186, 8, 18, p.accent));
    parts.push(rect(-4, -166, 8, 4, p.accent));
    parts.push(rect(-4, -144, 8, 4, p.accent));
    parts.push(rect(-4, -122, 8, 4, p.accent));
    parts.push(circle(0, -172, 4, p.glassLight));
    parts.push(circle(0, -172, 2, p.glassDark));
    parts.push(poly([[-11, -204], [-6, -204], [-8, -222]], p.accent2));
    parts.push(poly([[11, -204], [6, -204], [8, -222]], p.accent2));
    parts.push(poly([[-8, -26], [-4, -26], [-5, -40]], p.accent2));
    parts.push(poly([[8, -26], [4, -26], [5, -40]], p.accent2));
    parts.push(pixelText('BANANA', -17, -194, 1, p.accentDark));
    parts.push(pixelText('T-3', -10, -246, 1, p.accent2));
    parts.push(rocketFlame(-1, -24, 1.1, p));
    parts.push(smokePuff(-8, -18, 6, p, 0));
    parts.push(smokePuff(8, -16, 5, p, 1.2));
    parts.push(smokePuff(0, -8, 4, p, 2.4));
    parts.push(smokePuff(-14, -10, 3.5, p, 3.2));
    // Fuel tanks and pad details.
    parts.push(rect(-32, -42, 14, 26, p.metalDark));
    parts.push(rect(-30, -40, 10, 24, p.metal));
    parts.push(rect(-30, -34, 10, 2, p.accent2));
    parts.push(rect(-30, -26, 10, 2, p.accent2));
    parts.push(rect(-40, -28, 10, 12, p.metalDark));
    parts.push(rect(-38, -26, 6, 8, p.windowGlow, 'class="window"'));
    parts.push(pixelText('PAD 07', -18, -10, 1, p.accent2));
    addLight(ctx, cx, base, 0, -24, 64, p.fire);
    addLight(ctx, cx, base, 0, -160, 30, p.accent);
    addLight(ctx, cx, base, -36, -22, 26, p.windowGlow);
  }
  return parts.join('');
}

// ---------------------------------------------------------------------------
// Reusable local details
// ---------------------------------------------------------------------------

function addLight(
  ctx: BuildingContext,
  cx: number,
  base: number,
  x: number,
  y: number,
  radius: number,
  color: string,
): void {
  ctx.lights.push({ x: cx + x, y: base + y, radius, color });
}

function sign(
  text: string,
  x: number,
  y: number,
  scale: number,
  p: Palette,
  bg: string,
  fg: string,
): string {
  return signBoard(text, x, y, scale, p, bg, fg, pixelText, pixelTextWidth);
}

function faceCarving(x: number, y: number, p: Palette): string {
  return `${rect(x - 9, y - 9, 18, 18, p.outline)}${rect(x - 8, y - 8, 16, 16, p.wood)}${brickPattern(
    x - 8,
    y - 8,
    16,
    16,
    p,
    4,
  )}${rect(x - 5, y - 4, 3, 3, p.accent)}${rect(x + 2, y - 4, 3, 3, p.accent)}${rect(
    x - 4,
    y + 3,
    8,
    2,
    p.woodDark,
  )}${rect(x - 1, y - 1, 2, 2, p.accentDark)}`;
}

function bananaGlyph(x: number, y: number, p: Palette): string {
  return `${rect(x - 3, y - 3, 6, 2, p.accent)}${rect(x + 1, y - 1, 2, 5, p.accent)}${rect(
    x - 4,
    y + 2,
    4,
    2,
    p.accent,
  )}${rect(x - 4, y - 1, 1, 3, p.accentDark)}${rect(x + 2, y - 2, 1, 1, p.bananaLight)}`;
}

function hayBale(x: number, base: number, p: Palette): string {
  return `<g transform="translate(${x} ${base})">${ellipse(0, 1, 10, 2, p.shadow)}${rect(
    -9,
    -12,
    18,
    12,
    p.bananaDark,
  )}${rect(-8, -11, 16, 9, p.banana)}${rect(-8, -8, 16, 1, p.bananaDark, 'opacity="0.5"')}${rect(
    -8,
    -5,
    16,
    1,
    p.bananaDark,
    'opacity="0.5"',
  )}${line(-9, -10, 9, -2, p.bananaDark, 1, 'opacity="0.6"')}</g>`;
}

function tractor(x: number, base: number, p: Palette): string {
  return `<g transform="translate(${x} ${base})">${ellipse(0, 1, 17, 2, p.shadow)}${rect(
    0,
    -14,
    18,
    8,
    p.accent2,
  )}${rect(4, -21, 10, 7, p.glass)}${rect(4, -21, 10, 2, p.glassLight)}${circle(
    4,
    -3,
    4,
    p.outline,
  )}${circle(4, -3, 2, p.metal)}${circle(16, -4, 6, p.outline)}${circle(
    16,
    -4,
    4,
    p.metal,
  )}${circle(16, -4, 1.5, p.metalDark)}${rect(16, -16, 2, 9, p.metalDark)}</g>`;
}

function marketStall(x: number, base: number, p: Palette): string {
  return `<g transform="translate(${x} ${base})">${rect(-18, -22, 3, 20, p.woodDark)}${rect(
    15,
    -22,
    3,
    20,
    p.woodDark,
  )}${rect(-20, -26, 40, 4, p.wood)}${poly([[-22, -26], [-16, -34], [16, -34], [22, -26]], p.accent)}${rect(
    -16,
    -34,
    10,
    8,
    p.accent2,
  )}${rect(-6, -34, 12, 8, p.bananaLight, 'opacity="0.8"')}${rect(-18, -22, 36, 2, p.woodDark)}${bananaBunch(
    -8,
    -25,
    1,
    p,
  )}${rect(-2, -26, 8, 3, p.wood)}${rect(8, -25, 5, 2, p.banana)}</g>`;
}

function oddsAndEndsBanner(x: number, y: number, p: Palette): string {
  return `${rect(x - 2, y - 18, 4, 18, p.metalDark)}${poly(
    [[x - 12, y - 18], [x + 12, y - 18], [x + 9, y - 10], [x + 12, y - 2], [x - 12, y - 2], [x - 9, y - 10]],
    p.accent,
  )}${circle(x, y - 12, 3, p.accent2)}`;
}

function pipeRun(x: number, y: number, height: number, p: Palette): string {
  return `${rect(x, y - height, 4, height, p.metalDark)}${rect(x + 1, y - height, 2, height, p.metal)}${rect(
    x - 2,
    y - height * 0.66,
    8,
    3,
    p.metalDark,
  )}${rect(x - 2, y - height * 0.26, 8, 3, p.metalDark)}`;
}

function coalPile(x: number, base: number, p: Palette): string {
  return `<g transform="translate(${x} ${base})">${ellipse(0, 1, 13, 2, p.shadow)}${poly(
    [[-12, 0], [-8, -8], [-2, -12], [5, -9], [12, 0]],
    p.outline,
  )}${poly([[-9, 0], [-6, -6], [-1, -9], [3, -6], [8, 0]], p.metalDark)}${circle(-3, -6, 2, p.metal)}${circle(
    3,
    -4,
    2,
    p.metal,
  )}</g>`;
}

function windmillSails(p: Palette): string {
  const parts: string[] = [];
  parts.push(circle(0, 0, 3, p.woodDark));
  for (let i = 0; i < 4; i += 1) {
    parts.push(
      `<g transform="rotate(${i * 90})">${rect(-2, -30, 4, 28, p.woodLight)}${rect(
        -8,
        -30,
        16,
        20,
        p.plaster,
        'opacity="0.92"',
      )}${rect(-7, -28, 2, 16, p.woodDark)}${rect(-8, -30, 16, 2, p.wood)}</g>`,
    );
  }
  return parts.join('');
}

function ferrisWheel(p: Palette): string {
  const parts: string[] = [];
  parts.push(circle(0, 0, 36, p.metalDark, 'opacity="0.35"'));
  parts.push(circle(0, 0, 34, 'none', `stroke="${p.metalLight}" stroke-width="2"`));
  parts.push(circle(0, 0, 29, 'none', `stroke="${p.metalDark}" stroke-width="1" opacity="0.7"`));
  parts.push(circle(0, 0, 4, p.accent));
  for (let i = 0; i < 8; i += 1) {
    const angle = (i / 8) * Math.PI * 2;
    const x = Math.cos(angle) * 32;
    const y = Math.sin(angle) * 32;
    parts.push(line(0, 0, x, y, p.metalLight, 1));
    parts.push(rect(x - 4, y - 3, 8, 7, i % 2 === 0 ? p.accent : p.accent2));
    parts.push(rect(x - 3, y - 2, 6, 5, i % 2 === 0 ? p.bananaLight : p.plaster, 'opacity="0.75"'));
  }
  return parts.join('');
}

function turbineBlades(p: Palette): string {
  return `${circle(0, 0, 2, p.metalDark)}${rect(-1, -20, 2, 20, p.metalLight)}${rect(
    -20,
    -1,
    20,
    2,
    p.metalLight,
  )}${rect(-1, 0, 2, 20, p.metalLight)}${rect(-1, -1, 1, 1, p.accent2)}`;
}

function giantBanana(x: number, y: number, scale: number, p: Palette): string {
  return `<g transform="translate(${x} ${y}) scale(${scale})">${rect(
    -3,
    -28,
    6,
    6,
    p.bananaDark,
  )}${rect(-12, -24, 18, 7, p.banana)}${rect(-17, -17, 14, 7, p.banana)}${rect(
    -14,
    -10,
    10,
    5,
    p.bananaDark,
  )}${rect(-9, -24, 7, 2, p.bananaLight)}${rect(-13, -18, 5, 1, p.bananaLight, 'opacity="0.75"')}</g>`;
}

function orbitalRing(p: Palette): string {
  const parts: string[] = [];
  parts.push(ellipse(0, 0, 52, 20, 'none', `stroke="${p.accent}" stroke-width="4"`));
  parts.push(ellipse(0, 0, 52, 20, 'none', `stroke="${p.accent2}" stroke-width="1"`));
  parts.push(ellipse(0, 0, 44, 15, 'none', `stroke="${p.metalDark}" stroke-width="2"`));
  for (let i = 0; i < 8; i += 1) {
    const angle = (i / 8) * Math.PI * 2;
    parts.push(rect(Math.cos(angle) * 52 - 2, Math.sin(angle) * 20 - 2, 4, 4, p.accent2));
  }
  parts.push(giantBanana(0, 4, 1.15, p));
  parts.push(rect(-4, -30, 8, 8, p.metalLight));
  parts.push(circle(0, -32, 3, p.accent2, 'class="blink"'));
  parts.push(rect(-1, -38, 2, 6, p.accent));
  return parts.join('');
}

function rocketFlame(x: number, y: number, scale: number, p: Palette): string {
  return `<g transform="translate(${x} ${y}) scale(${scale})"><g class="flame">${poly(
    [[-10, 0], [-7, 12], [-2, 26], [2, 26], [7, 12], [10, 0]],
    p.fire,
  )}${poly([[-6, 0], [-4, 10], [0, 20], [4, 10], [6, 0]], p.fireLight)}${poly(
    [[-3, 0], [0, 8], [2, 3], [4, 0]],
    '#fff3a8',
  )}</g></g>`;
}
