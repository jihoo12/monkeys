import type { AgeId, SlotId, SlotState } from '../types.ts';
import type { Palette } from './palette.ts';
import { circle, ellipse, line, poly, rect } from './svg.ts';
import { pixelText, pixelTextWidth } from './pixel-font.ts';
import { buildingName, slotById } from '../sim/catalog.ts';
import { createRng, type Rng } from '../util/rng.ts';

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
    definition.width * 0.42,
    2.5,
    palette.shadow,
  )}${art}</g>`;
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
  parts.push(ellipse(cx, baseline + 1, width * 0.36, 2, palette.shadow));
  for (let i = 0; i < 4; i += 1) {
    const x = cx - width * 0.3 + rng() * width * 0.6;
    const h = 4 + Math.floor(rng() * 8);
    parts.push(rect(x, baseline - h, 3, h, palette.grassDark));
    parts.push(rect(x + 2, baseline - h + 2, 3, 2, palette.grass));
  }
  parts.push(rect(cx - 2, baseline - 10, 4, 10, palette.woodDark));
  parts.push(rect(cx - 12, baseline - 22, 24, 12, palette.wood));
  parts.push(rect(cx - 10, baseline - 20, 20, 8, palette.plaster));
  parts.push(pixelText('?', cx - 2, baseline - 19, 1, palette.outline));
  parts.push(pixelText('SOON', cx - 12, baseline - 34, 1, palette.hudDim));
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

function drawDwellings(level: number, cx: number, base: number, ctx: BuildingContext): string {
  const p = ctx.palette;
  const parts: string[] = [];
  if (level === 0) {
    parts.push(rect(-30, -50, 4, 50, p.woodDark));
    parts.push(rect(26, -50, 4, 50, p.woodDark));
    parts.push(rect(-26, -44, 52, 44, p.plasterShade));
    parts.push(rect(-24, -42, 48, 40, p.plaster));
    parts.push(poly([[-42, -48], [0, -78], [42, -48]], p.roof));
    parts.push(poly([[-34, -52], [0, -72], [34, -52]], p.roofDark));
    for (let i = -30; i <= 30; i += 10) {
      parts.push(rect(i, -55 - Math.abs(i) * 0.18, 6, 2, p.jungleDark));
    }
    parts.push(rect(-9, -30, 18, 30, p.woodDark));
    parts.push(rect(-6, -34, 12, 4, p.woodDark));
    parts.push(rect(-7, -26, 3, 3, p.woodLight));
    parts.push(win(12, -34, 10, 10, p, true));
    parts.push(rect(11, -35, 12, 1, p.woodDark));
    parts.push(rect(11, -24, 12, 1, p.woodDark));
    parts.push(bananaBunch(21, -26, 1, p));
    parts.push(smokePuff(8, -86, 4, p, 0));
    parts.push(smokePuff(13, -94, 3, p, 1.4));
    addLight(ctx, cx, base, 17, -29, 26, p.windowGlow);
    addLight(ctx, cx, base, -1, -18, 32, p.fire);
  } else if (level === 1) {
    parts.push(rect(-34, -20, 68, 20, p.stone));
    parts.push(rect(-32, -62, 64, 42, p.plaster));
    for (let x = -30; x <= 28; x += 14) {
      parts.push(rect(x, -62, 2, 42, p.woodDark));
    }
    parts.push(rect(-32, -44, 64, 2, p.woodDark));
    parts.push(poly([[-40, -62], [0, -92], [40, -62]], p.roof));
    parts.push(poly([[-34, -66], [0, -86], [34, -66]], p.roofDark));
    parts.push(rect(20, -96, 10, 28, p.brick));
    parts.push(rect(19, -98, 12, 3, p.brickDark));
    parts.push(smokePuff(25, -106, 4, p, 0));
    parts.push(smokePuff(29, -116, 3, p, 2));
    parts.push(rect(-8, -34, 16, 34, p.woodDark));
    parts.push(rect(-6, -32, 12, 30, p.wood));
    parts.push(rect(2, -20, 2, 2, p.banana));
    parts.push(win(-24, -38, 12, 12, p, true));
    parts.push(win(13, -38, 12, 12, p, true));
    parts.push(rect(-26, -24, 16, 2, p.woodDark));
    parts.push(rect(12, -24, 16, 2, p.woodDark));
    parts.push(flowerBox(-24, -22, p));
    parts.push(flowerBox(12, -22, p));
    addLight(ctx, cx, base, 0, -26, 34, p.windowGlow);
    addLight(ctx, cx, base, -20, -34, 20, p.windowGlow);
  } else if (level === 2) {
    parts.push(rect(-38, -112, 76, 112, p.brick));
    parts.push(rect(-42, -116, 84, 5, p.brickDark));
    parts.push(rect(-34, -124, 8, 8, p.brickDark));
    parts.push(rect(18, -130, 10, 20, p.brickDark));
    parts.push(smokePuff(23, -138, 4, p, 0));
    parts.push(smokePuff(27, -148, 3, p, 1.8));
    for (let row = 0; row < 3; row += 1) {
      for (let col = 0; col < 3; col += 1) {
        const x = -29 + col * 21;
        const y = -98 + row * 27;
        parts.push(win(x, y, 12, 15, p, (row + col) % 3 !== 0));
      }
    }
    parts.push(rect(-9, -30, 18, 30, p.woodDark));
    parts.push(rect(-7, -28, 14, 28, p.wood));
    parts.push(rect(7, -16, 2, 2, p.banana));
    parts.push(rect(-42, -72, 4, 4, p.metalDark));
    parts.push(rect(38, -86, 4, 4, p.metalDark));
    parts.push(line(-38, -70, 38, -84, p.metalDark, 1));
    for (let i = -30; i < 30; i += 12) {
      parts.push(rect(i, -70 - (i + 30) * 0.14, 6, 8, i % 24 === 0 ? '#e85d75' : '#4aa3df'));
    }
    parts.push(rect(-44, -14, 4, 14, p.brickDark));
    parts.push(rect(40, -14, 4, 14, p.brickDark));
    addLight(ctx, cx, base, -16, -90, 28, p.windowGlow);
    addLight(ctx, cx, base, 20, -62, 24, p.windowGlow);
  } else if (level === 3) {
    parts.push(rect(-40, -132, 80, 132, p.metalDark));
    parts.push(rect(-36, -128, 72, 124, p.metal));
    for (let row = 0; row < 4; row += 1) {
      for (let col = 0; col < 3; col += 1) {
        const x = -28 + col * 20;
        const y = -112 + row * 26;
        parts.push(win(x, y, 14, 16, p, (row + col) % 2 === 0));
        parts.push(rect(x - 2, y + 16, 18, 3, p.metalDark));
      }
    }
    parts.push(rect(-42, -136, 84, 4, p.metalLight));
    parts.push(rect(-30, -146, 26, 10, p.glass, 'opacity="0.8"'));
    parts.push(rect(-26, -150, 8, 4, p.grass));
    parts.push(rect(-16, -148, 6, 2, p.grassDark));
    parts.push(rect(20, -146, 3, 18, p.metalDark));
    parts.push(rect(18, -152, 7, 6, p.accent2));
    parts.push(rect(-9, -30, 18, 30, p.glassDark));
    parts.push(rect(-7, -28, 14, 28, p.glass));
    parts.push(rect(7, -16, 2, 2, p.banana));
    parts.push(rect(-44, -18, 4, 18, p.metalDark));
    parts.push(rect(40, -18, 4, 18, p.metalDark));
    addLight(ctx, cx, base, -12, -96, 30, p.windowGlow);
    addLight(ctx, cx, base, 14, -44, 26, p.windowGlow);
  } else {
    parts.push(rect(-44, -22, 88, 22, p.metalDark));
    parts.push(rect(-40, -20, 80, 16, p.metal));
    for (let i = 0; i < 5; i += 1) {
      const w = 78 - i * 14;
      parts.push(rect(-w / 2, -20 - i * 16, w, 16, p.glass, 'opacity="0.65"'));
      parts.push(rect(-w / 2 + 2, -20 - i * 16, 2, 16, p.glassLight, 'opacity="0.7"'));
    }
    parts.push(rect(-12, -98, 24, 4, p.metalLight));
    parts.push(rect(-8, -26, 16, 26, p.metalDark));
    parts.push(rect(-6, -24, 12, 24, p.glass));
    parts.push(rect(-20, -12, 8, 12, p.grassDark));
    parts.push(rect(-18, -18, 4, 6, p.grass));
    parts.push(rect(12, -12, 8, 12, p.grassDark));
    parts.push(rect(14, -18, 4, 6, p.grass));
    parts.push(rect(28, -50, 3, 28, p.metalDark));
    parts.push(circle(29, -52, 3, p.accent2));
    parts.push(rect(-34, -4, 68, 2, p.metalLight));
    addLight(ctx, cx, base, 0, -32, 44, p.accent2);
    addLight(ctx, cx, base, -16, -14, 24, p.grassLight);
  }
  return parts.join('');
}

function drawFarm(level: number, cx: number, base: number, ctx: BuildingContext): string {
  const p = ctx.palette;
  const parts: string[] = [];
  if (level === 0) {
    parts.push(rect(-42, -4, 84, 4, p.dirtDark));
    for (let i = 0; i < 3; i += 1) {
      parts.push(bananaPlant(-28 + i * 28, -4, 1 + (i % 2) * 0.15, p));
    }
    parts.push(fence(-42, -18, 20, p));
    parts.push(fence(22, -18, 20, p));
    parts.push(rect(-8, -12, 16, 8, p.woodDark));
    parts.push(rect(-6, -11, 12, 6, p.bananaDark));
    parts.push(rect(-4, -10, 8, 2, p.banana));
    parts.push(rect(32, -10, 12, 10, p.wood));
    parts.push(rect(34, -8, 8, 2, p.woodDark));
  } else if (level === 1) {
    parts.push(rect(-44, -5, 88, 5, p.dirtDark));
    for (let i = 0; i < 4; i += 1) {
      parts.push(rect(-38, -14 - i * 8, 50, 6, i % 2 === 0 ? p.dirt : p.grassDark));
      for (let x = -34; x < 8; x += 8) {
        parts.push(rect(x, -18 - i * 8, 2, 4, p.banana));
      }
    }
    parts.push(rect(18, -42, 26, 38, p.wood));
    parts.push(poly([[14, -42], [31, -58], [48, -42]], p.roof));
    parts.push(rect(26, -30, 10, 26, p.woodDark));
    parts.push(rect(20, -38, 8, 8, p.window));
    parts.push(rect(34, -38, 8, 8, p.window));
    parts.push(scarecrow(6, -24, p));
    parts.push(fence(-44, -12, 14, p));
    addLight(ctx, cx, base, 24, -34, 24, p.windowGlow);
  } else if (level === 2) {
    parts.push(rect(-46, -6, 92, 6, p.dirtDark));
    parts.push(rect(-44, -18, 62, 12, p.grassDark));
    for (let i = 0; i < 7; i += 1) {
      parts.push(rect(-42 + i * 9, -22, 3, 4, p.banana));
    }
    parts.push(rect(8, -56, 22, 50, p.metal));
    parts.push(rect(10, -58, 18, 4, p.metalLight));
    parts.push(poly([[8, -58], [19, -72], [30, -58]], p.metalDark));
    parts.push(rect(12, -44, 14, 2, p.metalDark));
    parts.push(rect(12, -30, 14, 2, p.metalDark));
    parts.push(rect(-38, -46, 38, 34, p.brick));
    parts.push(poly([[-42, -46], [-19, -62], [4, -46]], p.roof));
    parts.push(rect(-28, -30, 14, 18, p.woodDark));
    parts.push(rect(-26, -28, 10, 16, p.wood));
    parts.push(rect(-8, -34, 8, 8, p.window));
    parts.push(smokePuff(25, -80, 4, p, 0));
    parts.push(smokePuff(29, -92, 3, p, 1.5));
    parts.push(tractor(-30, -10, p));
    addLight(ctx, cx, base, 24, -40, 26, p.windowGlow);
  } else if (level === 3) {
    parts.push(rect(-46, -6, 92, 6, p.dirtDark));
    parts.push(rect(-38, -110, 76, 104, p.metalDark));
    parts.push(rect(-34, -106, 68, 98, p.glass, 'opacity="0.65"'));
    for (let row = 0; row < 4; row += 1) {
      const y = -96 + row * 22;
      parts.push(rect(-30, y, 60, 4, p.metalDark));
      for (let i = 0; i < 6; i += 1) {
        parts.push(rect(-28 + i * 10, y - 8, 5, 8, p.grass));
        parts.push(rect(-27 + i * 10, y - 10, 3, 2, p.grassLight));
      }
      parts.push(rect(-30, y + 4, 60, 1, p.accent2, 'opacity="0.7"'));
    }
    parts.push(rect(-38, -116, 76, 4, p.metalLight));
    parts.push(rect(24, -128, 3, 14, p.metalDark));
    parts.push(circle(25, -130, 3, p.accent2));
    parts.push(rect(-10, -26, 20, 26, p.metalDark));
    parts.push(rect(-8, -24, 16, 22, p.glass));
    parts.push(rect(-42, -16, 4, 16, p.metalDark));
    parts.push(rect(38, -16, 4, 16, p.metalDark));
    parts.push(drone(-22, -124, p));
    addLight(ctx, cx, base, -12, -70, 36, '#ff6ec7');
    addLight(ctx, cx, base, 16, -40, 28, p.accent2);
  } else {
    parts.push(rect(-44, -22, 88, 22, p.metalDark));
    parts.push(rect(-40, -20, 80, 16, p.metal));
    for (let i = 0; i < 5; i += 1) {
      const w = 78 - i * 14;
      parts.push(rect(-w / 2, -20 - i * 16, w, 16, p.glass, 'opacity="0.6"'));
    }
    for (let i = 0; i < 4; i += 1) {
      parts.push(rect(-26 + i * 14, -30, 6, 16, p.grassDark));
      parts.push(rect(-24 + i * 14, -42, 4, 14, p.grass));
      parts.push(rect(-24 + i * 14, -50, 4, 6, p.grassLight));
    }
    parts.push(rect(-10, -24, 20, 24, p.glass));
    parts.push(rect(-8, -22, 16, 20, p.glassLight, 'opacity="0.6"'));
    parts.push(rect(28, -60, 3, 38, p.metalDark));
    parts.push(circle(29, -62, 3, p.accent2));
    parts.push(rect(-30, -98, 60, 4, p.metalLight));
    parts.push(pixelText('O2', -8, -90, 2, p.accent2));
    parts.push(drone(-26, -104, p));
    addLight(ctx, cx, base, 0, -40, 44, p.accent2);
    addLight(ctx, cx, base, -18, -24, 24, p.grassLight);
  }
  return parts.join('');
}

function drawCommunity(level: number, cx: number, base: number, ctx: BuildingContext): string {
  const p = ctx.palette;
  const parts: string[] = [];
  if (level === 0) {
    parts.push(ellipse(0, -4, 22, 6, p.dirtDark));
    for (let i = 0; i < 8; i += 1) {
      const angle = (i / 8) * Math.PI * 2;
      parts.push(rect(Math.cos(angle) * 18 - 2, -6 + Math.sin(angle) * 5, 5, 4, p.stone));
    }
    parts.push(rect(-12, -6, 24, 3, p.woodDark));
    parts.push(rect(-6, -8, 12, 2, p.wood));
    parts.push(fire(-4, -10, 1, p));
    parts.push(rect(-30, -8, 10, 3, p.woodDark));
    parts.push(rect(20, -8, 10, 3, p.woodDark));
    parts.push(bananaBunch(16, -14, 1, p));
    addLight(ctx, cx, base, 0, -16, 48, p.fire);
    addLight(ctx, cx, base, 0, -26, 22, p.fireLight);
  } else if (level === 1) {
    parts.push(rect(-36, -62, 72, 62, p.wood));
    parts.push(rect(-34, -60, 68, 58, p.plaster));
    for (let x = -30; x <= 26; x += 14) {
      parts.push(rect(x, -60, 2, 58, p.woodDark));
    }
    parts.push(poly([[-42, -62], [0, -86], [42, -62]], p.roof));
    parts.push(poly([[-36, -66], [0, -82], [36, -66]], p.roofDark));
    parts.push(rect(-10, -32, 20, 32, p.woodDark));
    parts.push(rect(-8, -30, 16, 30, p.wood));
    parts.push(win(-26, -46, 12, 12, p, true));
    parts.push(win(14, -46, 12, 12, p, true));
    parts.push(rect(20, -88, 6, 26, p.brick));
    parts.push(smokePuff(23, -96, 4, p, 0));
    parts.push(sign('BANANA', 0, -70, 1, p, p.woodDark, p.banana));
    parts.push(barrel(-40, -16, p));
    parts.push(barrel(34, -14, p));
    parts.push(rect(28, -26, 3, 10, p.woodDark));
    parts.push(rect(26, -28, 7, 5, p.banana));
    addLight(ctx, cx, base, -20, -40, 26, p.windowGlow);
    addLight(ctx, cx, base, 20, -40, 26, p.windowGlow);
    addLight(ctx, cx, base, 0, -18, 24, p.fire);
  } else if (level === 2) {
    parts.push(rect(-44, -58, 88, 58, p.stone));
    parts.push(rect(-48, -62, 96, 5, p.stoneLight));
    parts.push(poly([[-50, -62], [0, -82], [50, -62]], p.roof));
    parts.push(poly([[-44, -66], [0, -78], [44, -66]], p.roofDark));
    for (let i = 0; i < 4; i += 1) {
      parts.push(rect(-30 + i * 20, -50, 6, 40, p.stoneLight));
      parts.push(rect(-30 + i * 20, -50, 6, 3, p.stone));
    }
    parts.push(rect(-10, -36, 20, 36, p.woodDark));
    parts.push(rect(-8, -34, 16, 34, p.wood));
    parts.push(rect(-14, -6, 28, 6, p.stoneDark));
    parts.push(rect(-18, -2, 36, 2, p.stoneLight));
    parts.push(win(-36, -50, 6, 14, p, true));
    parts.push(win(30, -50, 6, 14, p, true));
    parts.push(flag(0, -84, p, p.accent));
    parts.push(pixelText('TOWN HALL', -30, -76, 1, p.stoneLight));
    parts.push(lamp(-42, -24, p));
    parts.push(lamp(42, -24, p));
    addLight(ctx, cx, base, -36, -24, 24, p.windowGlow);
    addLight(ctx, cx, base, 36, -24, 24, p.windowGlow);
  } else if (level === 3) {
    parts.push(rect(-46, -20, 92, 20, p.metalDark));
    parts.push(rect(-42, -18, 84, 14, p.metal));
    parts.push(poly([[-40, -20], [-30, -64], [30, -64], [40, -20]], p.glass, 'opacity="0.75"'));
    parts.push(poly([[-30, -64], [0, -78], [30, -64]], p.glassLight, 'opacity="0.7"'));
    parts.push(rect(-30, -60, 60, 2, p.metalLight));
    for (let i = 0; i < 4; i += 1) {
      parts.push(rect(-30 + i * 18, -52, 4, 32, p.metalDark));
      parts.push(win(-28 + i * 18, -48, 12, 8, p, true));
    }
    parts.push(rect(-10, -30, 20, 30, p.glassDark));
    parts.push(rect(-8, -28, 16, 28, p.glass));
    parts.push(rect(-48, -12, 8, 12, p.stone));
    parts.push(rect(40, -12, 8, 12, p.stone));
    parts.push(flag(0, -80, p, p.accent2));
    parts.push(pixelText('HELLO', -16, -74, 1, p.accent2));
    parts.push(ellipse(0, -6, 14, 4, p.glassDark));
    parts.push(rect(-2, -16, 4, 10, p.metalLight));
    parts.push(circle(0, -18, 4, p.glassLight, 'opacity="0.7"'));
    addLight(ctx, cx, base, -18, -40, 34, p.accent2);
    addLight(ctx, cx, base, 18, -40, 34, p.accent2);
    addLight(ctx, cx, base, 0, -14, 26, p.windowGlow);
  } else {
    parts.push(rect(-34, -70, 68, 70, p.metalDark));
    parts.push(rect(-30, -66, 60, 66, p.metal));
    for (let i = 0; i < 4; i += 1) {
      parts.push(win(-24 + i * 14, -56, 9, 12, p, true));
    }
    parts.push(rect(-10, -34, 20, 34, p.glassDark));
    parts.push(rect(-8, -32, 16, 32, p.glass));
    parts.push(rect(-3, -300, 6, 266, p.glass, 'opacity="0.45"'));
    parts.push(rect(-4, -300, 2, 266, p.accent2, 'opacity="0.8"'));
    parts.push(rect(-22, -96, 44, 6, p.metalLight));
    parts.push(rect(-18, -112, 36, 16, p.metalDark));
    parts.push(rect(-14, -108, 28, 10, p.glass));
    parts.push(rect(-18, -108, 28, 2, p.accent2));
    parts.push(pixelText('ORBIT', -18, -88, 1, p.accent2));
    parts.push(rect(-36, -18, 6, 18, p.metalDark));
    parts.push(rect(30, -18, 6, 18, p.metalDark));
    parts.push(circle(0, -300, 6, p.accent, 'opacity="0.8"'));
    addLight(ctx, cx, base, 0, -50, 40, p.accent2);
    addLight(ctx, cx, base, 0, -108, 28, p.accent);
    addLight(ctx, cx, base, 0, -300, 30, p.accent);
  }
  return parts.join('');
}

function drawWorkshop(level: number, cx: number, base: number, ctx: BuildingContext): string {
  const p = ctx.palette;
  const parts: string[] = [];
  if (level === 0) {
    parts.push(rect(-34, -40, 4, 40, p.woodDark));
    parts.push(rect(30, -40, 4, 40, p.woodDark));
    parts.push(poly([[-40, -40], [0, -62], [40, -40]], p.roof));
    parts.push(rect(-30, -36, 60, 2, p.woodDark));
    parts.push(rect(-24, -10, 20, 10, p.stone));
    parts.push(rect(-20, -14, 12, 4, p.stoneDark));
    parts.push(rect(8, -16, 4, 16, p.woodDark));
    parts.push(rect(6, -20, 8, 4, p.metalDark));
    parts.push(rect(-30, -4, 60, 4, p.dirtDark));
    parts.push(rect(20, -8, 8, 8, p.wood));
    parts.push(pixelText('FLINT', -16, -30, 1, p.woodLight));
  } else if (level === 1) {
    parts.push(rect(-28, -72, 56, 72, p.stone));
    parts.push(poly([[-34, -72], [0, -96], [34, -72]], p.roof));
    parts.push(poly([[-28, -76], [0, -90], [28, -76]], p.roofDark));
    parts.push(rect(-10, -30, 20, 30, p.woodDark));
    parts.push(rect(-8, -28, 16, 28, p.wood));
    parts.push(win(-22, -52, 10, 12, p, true));
    parts.push(win(12, -52, 10, 12, p, true));
    parts.push(`<g transform="translate(0 -86)"><g class="windmill" style="animation-delay:-3s">${windmillSails(
      p,
    )}</g></g>`);
    parts.push(rect(-36, -8, 12, 8, p.wood));
    parts.push(rect(-38, -12, 16, 4, p.bananaDark));
    parts.push(rect(26, -10, 12, 10, p.wood));
    addLight(ctx, cx, base, -18, -46, 24, p.windowGlow);
    addLight(ctx, cx, base, 18, -46, 24, p.windowGlow);
  } else if (level === 2) {
    parts.push(rect(-42, -78, 84, 78, p.brick));
    parts.push(poly([[-44, -78], [-24, -92], [-4, -78], [16, -92], [36, -78], [44, -78]], p.brickDark));
    parts.push(rect(-34, -112, 10, 36, p.brickDark));
    parts.push(rect(24, -118, 10, 42, p.brickDark));
    parts.push(smokePuff(-29, -120, 4, p, 0));
    parts.push(smokePuff(-25, -132, 3, p, 1.5));
    parts.push(smokePuff(29, -126, 4, p, 0.8));
    parts.push(smokePuff(33, -138, 3, p, 2.2));
    for (let i = 0; i < 3; i += 1) {
      parts.push(win(-28 + i * 22, -60, 12, 12, p, i !== 1));
      parts.push(win(-28 + i * 22, -38, 12, 12, p, i === 1));
    }
    parts.push(rect(-10, -32, 20, 32, p.metalDark));
    parts.push(rect(-8, -30, 16, 30, p.metal));
    parts.push(rect(-20, -20, 8, 8, p.windowGlow, 'class="window"'));
    parts.push(`<g class="gear" style="transform-origin: 26px -18px">${circle(26, -18, 6, p.metalDark)}${circle(
      26,
      -18,
      3,
      p.metal,
    )}${rect(24, -26, 4, 16, p.metalDark)}${rect(18, -20, 16, 4, p.metalDark)}</g>`);
    parts.push(pixelText('BANANA CO', -30, -70, 1, p.bananaLight));
    addLight(ctx, cx, base, -16, -20, 28, p.windowGlow);
    addLight(ctx, cx, base, 28, -18, 24, p.fire);
  } else if (level === 3) {
    parts.push(rect(-38, -88, 76, 88, p.metalDark));
    parts.push(rect(-34, -84, 68, 84, p.plaster));
    parts.push(rect(-30, -78, 60, 34, p.glass));
    parts.push(rect(-30, -42, 60, 3, p.metalDark));
    parts.push(rect(-10, -30, 20, 30, p.glassDark));
    parts.push(rect(-8, -28, 16, 28, p.glass));
    for (let i = 0; i < 3; i += 1) {
      parts.push(win(-26 + i * 20, -70, 12, 10, p, true));
    }
    parts.push(rect(-40, -92, 80, 4, p.metalLight));
    parts.push(rect(-28, -102, 20, 10, p.glass, 'opacity="0.7"'));
    parts.push(rect(20, -102, 3, 14, p.metalDark));
    parts.push(circle(21, -104, 3, p.accent2));
    parts.push(`<g class="robotic-arm" style="transform-origin: 0px -20px">${rect(
      -2,
      -20,
      4,
      18,
      p.metalDark,
    )}${rect(-4, -22, 8, 4, p.accent)}${rect(-1, -34, 2, 12, p.metal)}${rect(
      -4,
      -36,
      8,
      3,
      p.metalLight,
    )}</g>`);
    parts.push(rect(18, -16, 14, 16, p.metalDark));
    parts.push(rect(20, -14, 10, 12, p.glass));
    parts.push(pixelText('LAB', -10, -50, 1, p.accent));
    addLight(ctx, cx, base, 0, -30, 36, p.accent2);
    addLight(ctx, cx, base, 24, -10, 22, p.windowGlow);
  } else {
    parts.push(rect(-38, -92, 76, 92, p.metalDark));
    parts.push(rect(-34, -88, 68, 88, p.metal));
    parts.push(rect(-28, -82, 56, 36, p.metalDark));
    parts.push(circle(0, -64, 14, p.accent, 'opacity="0.35"'));
    parts.push(circle(0, -64, 8, p.accent2));
    parts.push(circle(0, -64, 4, '#ffffff'));
    for (let i = 0; i < 4; i += 1) {
      parts.push(rect(-30 + i * 18, -40, 4, 24, p.metalDark));
    }
    parts.push(rect(-10, -30, 20, 30, p.metalDark));
    parts.push(rect(-8, -28, 16, 28, p.glass));
    parts.push(rect(-42, -20, 6, 20, p.metalDark));
    parts.push(rect(36, -20, 6, 20, p.metalDark));
    parts.push(drone(-30, -110, p));
    parts.push(drone(28, -118, p));
    parts.push(pixelText('NANO', -12, -52, 1, p.accent2));
    addLight(ctx, cx, base, 0, -64, 46, p.accent);
    addLight(ctx, cx, base, 0, -20, 28, p.accent2);
  }
  return parts.join('');
}

function drawCulture(level: number, cx: number, base: number, ctx: BuildingContext): string {
  const p = ctx.palette;
  const parts: string[] = [];
  if (level === 0) {
    parts.push(rect(-6, -84, 12, 84, p.wood));
    parts.push(rect(-8, -6, 16, 6, p.stoneDark));
    parts.push(poly([[-10, -84], [-22, -96], [-10, -76]], p.accent));
    parts.push(poly([[10, -84], [22, -96], [10, -76]], p.accent));
    parts.push(faceCarving(0, -70, p));
    parts.push(faceCarving(0, -48, p));
    parts.push(faceCarving(0, -26, p));
    parts.push(bananaBunch(0, -90, 1, p));
    addLight(ctx, cx, base, 0, -64, 20, p.accent);
  } else if (level === 1) {
    parts.push(rect(-24, -96, 48, 96, p.stone));
    parts.push(rect(-28, -100, 56, 5, p.stoneLight));
    parts.push(poly([[-28, -100], [0, -122], [28, -100]], p.roof));
    parts.push(rect(-8, -24, 16, 24, p.woodDark));
    parts.push(rect(-6, -22, 12, 22, p.wood));
    parts.push(win(-16, -70, 8, 18, p, true));
    parts.push(win(8, -70, 8, 18, p, true));
    parts.push(rect(-4, -110, 8, 2, p.metalDark));
    parts.push(`<g class="bell" style="transform-origin: 0px -108px">${rect(-6, -108, 12, 8, p.accent)}${rect(
      -4,
      -100,
      8,
      2,
      p.accentDark,
    )}${circle(0, -98, 2, p.accentDark)}</g>`);
    parts.push(flag(0, -124, p, p.accent2));
    parts.push(pixelText('BELL', -12, -84, 1, p.stoneLight));
    addLight(ctx, cx, base, -12, -60, 24, p.windowGlow);
    addLight(ctx, cx, base, 12, -60, 24, p.windowGlow);
  } else if (level === 2) {
    parts.push(rect(-26, -132, 52, 132, p.brick));
    parts.push(rect(-30, -136, 60, 5, p.brickDark));
    parts.push(poly([[-30, -136], [0, -156], [30, -136]], p.roof));
    parts.push(rect(-18, -126, 36, 36, p.plaster));
    parts.push(circle(0, -108, 14, p.stoneLight));
    parts.push(circle(0, -108, 12, p.plaster));
    parts.push(`<g transform="translate(0 -108)">${rect(-1, -10, 2, 10, p.outline)}${rect(
      0,
      -1,
      7,
      2,
      p.outline,
    )}${rect(-2, -2, 4, 4, p.outline)}${rect(-1, -1, 2, 2, p.accent)}</g>`);
    parts.push(rect(-8, -24, 16, 24, p.woodDark));
    parts.push(win(-18, -76, 8, 16, p, true));
    parts.push(win(10, -76, 8, 16, p, true));
    parts.push(rect(-24, -60, 48, 2, p.brickDark));
    parts.push(rect(24, -156, 3, 20, p.metalDark));
    parts.push(circle(25, -158, 3, p.accent));
    parts.push(pixelText('TIME', -10, -50, 1, p.plaster));
    addLight(ctx, cx, base, -14, -64, 26, p.windowGlow);
    addLight(ctx, cx, base, 14, -64, 26, p.windowGlow);
    addLight(ctx, cx, base, 0, -108, 18, p.accent);
  } else if (level === 3) {
    parts.push(rect(-30, -20, 60, 20, p.metalDark));
    parts.push(rect(-26, -18, 52, 16, p.metal));
    parts.push(rect(-8, -30, 16, 30, p.metalDark));
    for (let i = 0; i < 7; i += 1) {
      const w = 34 - i * 4;
      parts.push(rect(-w / 2, -44 - i * 18, w, 3, p.metal));
      parts.push(rect(-w / 2, -44 - i * 18, 2, 18, p.metalDark));
      parts.push(rect(w / 2 - 2, -44 - i * 18, 2, 18, p.metalDark));
    }
    parts.push(rect(-4, -184, 8, 8, p.accent, 'class="blink"'));
    parts.push(circle(0, -180, 8, p.accent, 'opacity="0.25"'));
    parts.push(`<g class="dish" style="transform-origin: 0px -60px">${ellipse(
      0,
      -60,
      14,
      6,
      p.metalLight,
    )}${line(0, -60, 0, -48, p.metalDark, 2)}</g>`);
    parts.push(pixelText('5G', -8, -34, 2, p.accent2));
    for (let i = 0; i < 3; i += 1) {
      parts.push(
        `<path d="M${-18 - i * 5} ${-120 - i * 8} q${18 + i * 5} ${-18 - i * 8} ${36 + i * 10} 0" fill="none" stroke="${p.accent2}" stroke-width="2" class="radio-wave" style="animation-delay:-${i * 0.8}s"/>`,
      );
    }
    addLight(ctx, cx, base, 0, -180, 34, p.accent);
    addLight(ctx, cx, base, 0, -60, 24, p.accent2);
  } else {
    parts.push(rect(-36, -30, 72, 30, p.metalDark));
    parts.push(rect(-32, -28, 64, 24, p.metal));
    parts.push(poly([[-36, -30], [-20, -80], [20, -80], [36, -30]], p.glass, 'opacity="0.7"'));
    parts.push(poly([[-20, -80], [0, -96], [20, -80]], p.glassLight, 'opacity="0.6"'));
    parts.push(rect(-10, -28, 20, 28, p.glassDark));
    parts.push(rect(-8, -26, 16, 26, p.glass));
    parts.push(`<g class="telescope" style="transform-origin: 0px -58px">${rect(
      -4,
      -66,
      8,
      18,
      p.metalLight,
    )}${rect(-6, -72, 12, 8, p.accent2)}${rect(0, -58, 3, 22, p.metalDark)}</g>`);
    parts.push(circle(0, -58, 4, p.accent));
    parts.push(rect(-40, -20, 8, 20, p.metalDark));
    parts.push(rect(32, -20, 8, 20, p.metalDark));
    parts.push(pixelText('SETI', -12, -44, 1, p.accent2));
    parts.push(
      `<circle cx="0" cy="-58" r="18" fill="none" stroke="${p.accent2}" stroke-width="1" opacity="0.5" class="orbit-ring"/>`,
    );
    addLight(ctx, cx, base, 0, -58, 40, p.accent2);
  }
  return parts.join('');
}

function drawWonder(level: number, cx: number, base: number, ctx: BuildingContext): string {
  const p = ctx.palette;
  const parts: string[] = [];
  if (level === 0) {
    parts.push(ellipse(0, -3, 38, 6, p.dirtDark));
    parts.push(rect(-28, -58, 14, 58, p.stone));
    parts.push(rect(-26, -60, 10, 4, p.stoneLight));
    parts.push(rect(-4, -74, 14, 74, p.stoneDark));
    parts.push(rect(-2, -76, 10, 4, p.stoneLight));
    parts.push(rect(22, -50, 12, 50, p.stone));
    parts.push(rect(24, -52, 8, 4, p.stoneLight));
    parts.push(bananaGlyph(0, -44, p));
    parts.push(pixelText('OOK', -20, -34, 1, p.accent));
    parts.push(fire(-34, -8, 0.7, p));
    addLight(ctx, cx, base, 0, -40, 26, p.accent);
    addLight(ctx, cx, base, -34, -10, 22, p.fire);
  } else if (level === 1) {
    parts.push(rect(-44, -74, 88, 74, p.stone));
    parts.push(rect(-48, -78, 96, 6, p.stoneLight));
    for (let i = 0; i < 4; i += 1) {
      parts.push(rect(-44 + i * 24, -92, 12, 16, p.stone));
      parts.push(rect(-42 + i * 24, -94, 8, 4, p.stoneLight));
    }
    parts.push(rect(-26, -110, 18, 38, p.stone));
    parts.push(rect(8, -110, 18, 38, p.stone));
    parts.push(rect(-28, -114, 22, 5, p.stoneLight));
    parts.push(rect(6, -114, 22, 5, p.stoneLight));
    parts.push(flag(-17, -116, p, p.accent));
    parts.push(flag(17, -116, p, p.accent2));
    parts.push(rect(-10, -40, 20, 40, p.woodDark));
    parts.push(rect(-8, -38, 16, 38, p.wood));
    parts.push(rect(-20, -56, 8, 8, p.window));
    parts.push(rect(12, -56, 8, 8, p.window));
    parts.push(pixelText('KEEP', -12, -66, 1, p.stoneLight));
    parts.push(lamp(-36, -20, p));
    parts.push(lamp(36, -20, p));
    addLight(ctx, cx, base, -16, -52, 26, p.windowGlow);
    addLight(ctx, cx, base, 16, -52, 26, p.windowGlow);
    addLight(ctx, cx, base, -36, -20, 22, p.fire);
  } else if (level === 2) {
    parts.push(rect(-46, -24, 92, 24, p.stoneDark));
    parts.push(rect(-40, -20, 80, 16, p.stone));
    parts.push(poly([[-30, -20], [0, -54], [30, -20]], p.metalLight));
    parts.push(rect(-24, -18, 48, 14, p.glass, 'opacity="0.7"'));
    parts.push(rect(-6, -18, 12, 14, p.accent));
    parts.push(`<g transform="translate(0 -84)"><g class="ferris" style="animation-delay:-2s">${ferrisWheel(
      p,
    )}</g></g>`);
    parts.push(rect(-4, -84, 8, 58, p.metalDark));
    parts.push(rect(-8, -90, 16, 8, p.metalLight));
    parts.push(pixelText('FAIR', -12, -10, 1, p.plaster));
    parts.push(lamp(-42, -12, p));
    parts.push(lamp(42, -12, p));
    addLight(ctx, cx, base, -30, -10, 26, p.accent);
    addLight(ctx, cx, base, 30, -10, 26, p.accent2);
    addLight(ctx, cx, base, 0, -84, 34, p.accent);
  } else if (level === 3) {
    parts.push(rect(-46, -20, 92, 20, p.stoneLight));
    parts.push(poly([[-44, -20], [-30, -70], [30, -70], [44, -20]], p.glass, 'opacity="0.75"'));
    parts.push(poly([[-30, -70], [0, -86], [30, -70]], p.glassLight, 'opacity="0.7"'));
    parts.push(rect(-10, -30, 20, 30, p.glassDark));
    parts.push(rect(-8, -28, 16, 28, p.glass));
    parts.push(giantBanana(0, -46, 1, p));
    parts.push(rect(-42, -8, 8, 8, p.stone));
    parts.push(rect(34, -8, 8, 8, p.stone));
    parts.push(pixelText('MUSEUM', -26, -16, 1, p.accent));
    parts.push(rect(-38, -84, 3, 14, p.metalDark));
    parts.push(circle(-36, -86, 3, p.accent2));
    addLight(ctx, cx, base, 0, -50, 44, p.accent);
    addLight(ctx, cx, base, -36, -86, 20, p.accent2);
  } else {
    parts.push(rect(-4, -150, 8, 150, p.accent2, 'opacity="0.35"'));
    parts.push(rect(-2, -150, 4, 150, p.accent, 'opacity="0.8"'));
    parts.push(`<g transform="translate(0 -190)"><g class="orbit" style="animation-delay:-4s">${orbitalRing(
      p,
    )}</g></g>`);
    parts.push(pixelText('ORBITAL BANANA', -42, -250, 1, p.accent2));
    parts.push(circle(0, -190, 18, p.accent, 'opacity="0.15"'));
    addLight(ctx, cx, base, 0, -190, 70, p.accent);
    addLight(ctx, cx, base, 0, -250, 30, p.accent2);
  }
  return parts.join('');
}

function drawEnergy(level: number, cx: number, base: number, ctx: BuildingContext): string {
  const p = ctx.palette;
  const parts: string[] = [];
  if (level <= 1) {
    return '';
  }
  if (level === 2) {
    parts.push(rect(-40, -18, 80, 18, p.stoneDark));
    parts.push(rect(-36, -16, 72, 14, p.stone));
    parts.push(rect(-30, -62, 30, 46, p.brick));
    parts.push(rect(-34, -66, 38, 5, p.brickDark));
    parts.push(rect(-24, -86, 10, 22, p.brickDark));
    parts.push(smokePuff(-19, -94, 4, p, 0));
    parts.push(smokePuff(-15, -106, 3, p, 1.4));
    parts.push(rect(10, -58, 22, 42, p.brick));
    parts.push(rect(8, -62, 26, 5, p.brickDark));
    parts.push(rect(16, -80, 10, 20, p.brickDark));
    parts.push(smokePuff(21, -88, 4, p, 0.6));
    parts.push(smokePuff(25, -100, 3, p, 2));
    parts.push(win(-22, -48, 10, 10, p, true));
    parts.push(win(16, -46, 10, 10, p, true));
    parts.push(rect(-38, -10, 20, 10, p.metalDark));
    parts.push(rect(-36, -14, 16, 4, p.metal));
    parts.push(rect(28, -12, 10, 12, p.metalDark));
    parts.push(pixelText('POWER', -16, -34, 1, p.plaster));
    parts.push(line(-44, -40, -58, -40, p.metalDark, 2));
    parts.push(line(-58, -40, -58, -70, p.metalDark, 2));
    addLight(ctx, cx, base, -16, -44, 30, p.windowGlow);
    addLight(ctx, cx, base, 20, -40, 24, p.fire);
  } else if (level === 3) {
    parts.push(rect(-42, -10, 84, 10, p.dirtDark));
    for (let i = 0; i < 4; i += 1) {
      const x = -36 + i * 20;
      parts.push(
        `<g transform="translate(${x} -10)">${rect(-8, -4, 16, 3, p.metalDark)}${poly(
          [[-8, -4], [8, -4], [6, -16], [-6, -16]],
          p.glassDark,
        )}${poly([[-6, -16], [6, -16], [5, -20], [-5, -20]], p.glassLight)}</g>`,
      );
    }
    parts.push(rect(-4, -24, 8, 14, p.metalDark));
    parts.push(rect(-2, -22, 4, 12, p.accent2));
    parts.push(`<g transform="translate(32 -34)"><g class="turbine" style="animation-delay:-2s">${turbineBlades(
      p,
    )}</g></g>`);
    parts.push(rect(30, -34, 4, 24, p.metalLight));
    parts.push(rect(26, -12, 12, 12, p.metalDark));
    parts.push(rect(28, -10, 8, 8, p.accent2));
    parts.push(pixelText('CLEAN', -20, -30, 1, p.accent2));
    addLight(ctx, cx, base, 0, -18, 26, p.accent2);
    addLight(ctx, cx, base, 32, -30, 22, p.accent2);
  } else {
    parts.push(rect(-38, -20, 76, 20, p.metalDark));
    parts.push(rect(-34, -18, 68, 16, p.metal));
    parts.push(circle(0, -48, 24, p.accent, 'opacity="0.25"'));
    parts.push(circle(0, -48, 14, p.metalDark));
    parts.push(circle(0, -48, 9, p.accent2));
    parts.push(circle(0, -48, 4, '#ffffff'));
    parts.push(rect(-10, -48, 20, 2, p.metalLight));
    parts.push(rect(-2, -60, 4, 24, p.metalLight));
    parts.push(rect(-38, -66, 10, 46, p.brick));
    parts.push(rect(28, -66, 10, 46, p.brick));
    parts.push(rect(-40, -70, 14, 5, p.brickDark));
    parts.push(rect(26, -70, 14, 5, p.brickDark));
    parts.push(smokePuff(-33, -78, 3, p, 0));
    parts.push(smokePuff(33, -78, 3, p, 1.2));
    parts.push(pixelText('FUSION', -22, -32, 1, p.accent2));
    parts.push(
      `<path d="M-14 -48 q14 -24 28 0" fill="none" stroke="${p.accent2}" stroke-width="1.5" class="energy-arc"/>`,
    );
    addLight(ctx, cx, base, 0, -48, 56, p.accent);
    addLight(ctx, cx, base, -33, -78, 20, p.fire);
    addLight(ctx, cx, base, 33, -78, 20, p.fire);
  }
  return parts.join('');
}

function drawSpaceport(level: number, cx: number, base: number, ctx: BuildingContext): string {
  const p = ctx.palette;
  const parts: string[] = [];
  if (level <= 2) {
    return '';
  }
  if (level === 3) {
    parts.push(rect(-36, -14, 72, 14, p.stoneDark));
    parts.push(rect(-32, -12, 64, 10, p.stone));
    parts.push(rect(-28, -56, 40, 44, p.metalDark));
    parts.push(rect(-24, -54, 32, 40, p.plaster));
    for (let i = 0; i < 3; i += 1) {
      parts.push(win(-20 + i * 10, -48, 7, 8, p, true));
    }
    parts.push(rect(-10, -26, 16, 26, p.glassDark));
    parts.push(rect(-8, -24, 12, 24, p.glass));
    parts.push(`<g class="dish" style="transform-origin: 0px -70px">${ellipse(
      0,
      -70,
      16,
      7,
      p.metalLight,
    )}${line(0, -70, 0, -58, p.metalDark, 2)}</g>`);
    parts.push(rect(20, -50, 3, 36, p.metalDark));
    parts.push(circle(21, -52, 3, p.accent));
    parts.push(pixelText('MISSION', -26, -66, 1, p.accent2));
    parts.push(pixelText('CTRL', -12, -58, 1, p.accent2));
    addLight(ctx, cx, base, -14, -44, 30, p.accent2);
    addLight(ctx, cx, base, 0, -70, 24, p.accent);
  } else {
    parts.push(rect(-40, -12, 80, 12, p.stoneDark));
    parts.push(rect(-36, -10, 72, 8, p.stone));
    parts.push(rect(-30, -14, 60, 4, p.metalDark));
    parts.push(rect(-4, -214, 8, 200, p.metalLight));
    parts.push(poly([[-12, -214], [0, -246], [12, -214]], p.accent));
    parts.push(rect(-12, -214, 24, 8, p.accentDark));
    parts.push(rect(-10, -206, 20, 42, p.plaster));
    parts.push(rect(-8, -204, 16, 40, p.metalLight));
    parts.push(rect(-8, -204, 4, 40, p.accent2, 'opacity="0.5"'));
    parts.push(rect(-8, -196, 16, 4, p.accent));
    parts.push(rect(-8, -172, 16, 4, p.accent));
    parts.push(rect(-8, -148, 16, 4, p.accent));
    parts.push(pixelText('BANANA', -16, -188, 1, p.accentDark));
    parts.push(poly([[-18, -206], [-12, -206], [-14, -218]], p.accent2));
    parts.push(poly([[18, -206], [12, -206], [14, -218]], p.accent2));
    parts.push(rect(20, -190, 4, 178, p.metalDark));
    parts.push(rect(16, -190, 12, 4, p.metal));
    parts.push(rect(16, -160, 12, 4, p.metal));
    parts.push(rect(16, -130, 12, 4, p.metal));
    parts.push(rect(24, -196, 8, 6, p.accent));
    parts.push(rect(-38, -20, 12, 10, p.metalDark));
    parts.push(rect(-36, -18, 8, 6, p.windowGlow, 'class="window"'));
    parts.push(pixelText('T-3', -10, -244, 1, p.accent2));
    parts.push(rocketFlame(-1, -12, 1.1, p));
    parts.push(smokePuff(-8, -6, 6, p, 0));
    parts.push(smokePuff(8, -4, 5, p, 1.2));
    parts.push(smokePuff(0, 4, 4, p, 2.4));
    addLight(ctx, cx, base, 0, -20, 60, p.fire);
    addLight(ctx, cx, base, -32, -18, 26, p.windowGlow);
    addLight(ctx, cx, base, 0, -230, 34, p.accent);
  }
  return parts.join('');
}

// ---------------------------------------------------------------------------
// Reusable details
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

function win(x: number, y: number, w: number, h: number, p: Palette, lit: boolean): string {
  return `${rect(x, y, w, h, p.outline)}${rect(
    x + 1,
    y + 1,
    w - 2,
    h - 2,
    lit ? p.window : p.glassDark,
    lit ? 'class="window"' : '',
  )}${rect(x + 1, y + 1, w - 2, 1, lit ? p.windowGlow : p.glass)}`;
}

function smokePuff(x: number, y: number, size: number, p: Palette, delay: number): string {
  return `<g class="smoke" style="animation-delay:-${delay}s">${circle(
    x,
    y,
    size,
    p.smoke,
    'opacity="0.65"',
  )}${circle(x + size * 0.8, y - size * 0.6, size * 0.7, p.smokeLight, 'opacity="0.5"')}</g>`;
}

function fire(x: number, y: number, scale: number, p: Palette): string {
  return `<g transform="translate(${x} ${y}) scale(${scale})"><g class="fire">${poly(
    [[-6, 0], [-4, -12], [0, -20], [4, -12], [6, 0]],
    p.fire,
  )}${poly([[-3, 0], [-1, -9], [1, -14], [3, -7], [4, 0]], p.fireLight)}${rect(
    -2,
    -5,
    4,
    5,
    '#fff3a8',
  )}</g></g>`;
}

function flame(x: number, y: number, scale: number, p: Palette): string {
  return `<g transform="translate(${x} ${y}) scale(${scale})"><g class="flame">${poly(
    [[-10, 0], [-7, -14], [-2, -24], [3, -14], [10, 0]],
    p.fire,
  )}${poly([[-5, 0], [-3, -10], [1, -18], [5, -8], [6, 0]], p.fireLight)}${poly(
    [[-2, 0], [0, -8], [2, -4], [3, 0]],
    '#fff3a8',
  )}</g></g>`;
}

function rocketFlame(x: number, y: number, scale: number, p: Palette): string {
  return `<g transform="translate(${x} ${y}) scale(${scale})"><g class="flame">${poly(
    [[-9, 0], [-6, 10], [-2, 22], [2, 22], [6, 10], [9, 0]],
    p.fire,
  )}${poly([[-5, 0], [-3, 8], [0, 16], [3, 8], [5, 0]], p.fireLight)}${poly(
    [[-2, 0], [0, 6], [2, 2], [3, 0]],
    '#fff3a8',
  )}</g></g>`;
}

function bananaBunch(x: number, y: number, scale: number, p: Palette): string {
  return `<g transform="translate(${x} ${y}) scale(${scale})">${rect(
    -3,
    0,
    6,
    2,
    p.bananaDark,
  )}${rect(-2, -1, 4, 1, p.banana)}${rect(-5, 2, 3, 1, p.banana)}${rect(
    2,
    2,
    3,
    1,
    p.banana,
  )}${rect(-4, 3, 2, 1, p.bananaDark)}${rect(3, 3, 2, 1, p.bananaDark)}</g>`;
}

function bananaPlant(x: number, y: number, scale: number, p: Palette): string {
  return `<g transform="translate(${x} ${y}) scale(${scale})">${rect(
    -2,
    -24,
    4,
    24,
    p.woodDark,
  )}${rect(-1, -24, 2, 24, p.wood)}${poly([[-2, -22], [-18, -30], [-6, -16]], p.leafDark)}${poly(
    [[2, -20], [18, -30], [7, -14]],
    p.leaf,
  )}${poly([[-1, -18], [-14, -12], [-2, -10]], p.leaf)}${poly(
    [[1, -16], [14, -10], [2, -8]],
    p.leafDark,
  )}${bananaBunch(0, -20, 1, p)}${rect(-2, -6, 4, 6, p.grassDark)}</g>`;
}

function fence(x: number, y: number, width: number, p: Palette): string {
  const parts: string[] = [];
  for (let i = 0; i <= width; i += 8) {
    parts.push(rect(x + i, y - 14, 2, 14, p.wood));
  }
  parts.push(rect(x, y - 10, width + 2, 2, p.woodDark));
  parts.push(rect(x, y - 4, width + 2, 2, p.woodDark));
  return parts.join('');
}

function flowerBox(x: number, y: number, p: Palette): string {
  return `${rect(x, y, 16, 4, p.woodDark)}${rect(x + 1, y - 1, 2, 2, p.accent)}${rect(
    x + 5,
    y - 2,
    2,
    3,
    p.accent2,
  )}${rect(x + 10, y - 1, 2, 2, p.accent)}`;
}

function barrel(x: number, y: number, p: Palette): string {
  return `${rect(x, y - 14, 12, 14, p.woodDark)}${rect(x + 1, y - 13, 10, 12, p.wood)}${rect(
    x + 1,
    y - 11,
    10,
    2,
    p.metalDark,
  )}${rect(x + 1, y - 5, 10, 2, p.metalDark)}`;
}

function lamp(x: number, y: number, p: Palette): string {
  return `${rect(x - 1, y - 22, 2, 22, p.metalDark)}${rect(x - 5, y - 26, 10, 6, p.metal)}${rect(
    x - 3,
    y - 24,
    6,
    3,
    p.window,
    'class="window"',
  )}`;
}

function flag(x: number, y: number, p: Palette, color: string): string {
  return `${rect(x - 1, y - 30, 2, 30, p.metalDark)}${poly(
    [[x + 1, y - 30], [x + 18, y - 25], [x + 1, y - 20]],
    color,
    'class="flag"',
  )}`;
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
  const width = pixelTextWidth(text, scale) + 8;
  return `${rect(x - width / 2, y - 2, width, 7 * scale + 4, bg)}${pixelText(
    text,
    x - width / 2 + 4,
    y,
    scale,
    fg,
  )}`;
}

function faceCarving(x: number, y: number, p: Palette): string {
  return `${rect(x - 8, y - 8, 16, 16, p.woodDark)}${rect(x - 6, y - 6, 12, 12, p.wood)}${rect(
    x - 4,
    y - 4,
    2,
    2,
    p.accent,
  )}${rect(x + 2, y - 4, 2, 2, p.accent)}${rect(x - 3, y + 2, 6, 2, p.woodDark)}`;
}

function bananaGlyph(x: number, y: number, p: Palette): string {
  return `${rect(x - 2, y - 2, 4, 1, p.accent)}${rect(x + 1, y - 1, 1, 4, p.accent)}${rect(
    x - 2,
    y + 2,
    3,
    1,
    p.accent,
  )}${rect(x - 3, y - 1, 1, 2, p.accentDark)}`;
}

function scarecrow(x: number, y: number, p: Palette): string {
  return `${rect(x - 1, y - 24, 2, 24, p.woodDark)}${rect(x - 8, y - 18, 16, 2, p.woodDark)}${rect(
    x - 5,
    y - 26,
    10,
    6,
    p.plaster,
  )}${rect(x - 3, y - 24, 2, 2, p.outline)}${rect(x + 1, y - 24, 2, 2, p.outline)}${rect(
    x - 6,
    y - 20,
    12,
    8,
    p.accent,
  )}`;
}

function tractor(x: number, y: number, p: Palette): string {
  return `<g transform="translate(${x} ${y})">${rect(0, -12, 20, 8, p.accent2)}${rect(
    4,
    -18,
    10,
    6,
    p.glass,
  )}${circle(4, -2, 4, p.outline)}${circle(4, -2, 2, p.metal)}${circle(16, -2, 5, p.outline)}${circle(
    16,
    -2,
    3,
    p.metal,
  )}</g>`;
}

function drone(x: number, y: number, p: Palette): string {
  return `<g transform="translate(${x} ${y})"><g class="drone">${rect(-3, -2, 6, 4, p.metalDark)}${rect(
    -5,
    -3,
    10,
    2,
    p.metalLight,
  )}${rect(-10, -4, 6, 1, p.metal)}${rect(4, -4, 6, 1, p.metal)}${circle(0, 0, 1, p.accent2)}</g></g>`;
}

function windmillSails(p: Palette): string {
  const parts: string[] = [];
  parts.push(circle(0, 0, 3, p.woodDark));
  for (let i = 0; i < 4; i += 1) {
    parts.push(
      `<g transform="rotate(${i * 90})">${rect(-2, -28, 4, 26, p.woodLight)}${rect(
        -7,
        -28,
        14,
        18,
        p.plaster,
        'opacity="0.9"',
      )}${rect(-6, -26, 2, 14, p.woodDark)}</g>`,
    );
  }
  return parts.join('');
}

function ferrisWheel(p: Palette): string {
  const parts: string[] = [];
  parts.push(circle(0, 0, 30, p.metalDark, 'opacity="0.4"'));
  parts.push(circle(0, 0, 28, 'none', `stroke="${p.metalLight}" stroke-width="2"`));
  parts.push(circle(0, 0, 4, p.accent));
  for (let i = 0; i < 8; i += 1) {
    const angle = (i / 8) * Math.PI * 2;
    const x = Math.cos(angle) * 26;
    const y = Math.sin(angle) * 26;
    parts.push(line(0, 0, x, y, p.metalLight, 1));
    parts.push(rect(x - 3, y - 2, 6, 5, i % 2 === 0 ? p.accent : p.accent2));
  }
  return parts.join('');
}

function turbineBlades(p: Palette): string {
  return `${circle(0, 0, 2, p.metalDark)}${rect(-1, -18, 2, 18, p.metalLight)}${rect(
    -18,
    -1,
    18,
    2,
    p.metalLight,
  )}${rect(-1, 0, 2, 18, p.metalLight)}`;
}

function giantBanana(x: number, y: number, scale: number, p: Palette): string {
  return `<g transform="translate(${x} ${y}) scale(${scale})">${rect(
    -2,
    -24,
    4,
    4,
    p.bananaDark,
  )}${rect(-10, -22, 16, 6, p.banana)}${rect(-14, -16, 12, 6, p.banana)}${rect(
    -12,
    -10,
    8,
    4,
    p.bananaDark,
  )}${rect(-8, -22, 6, 2, p.bananaLight)}</g>`;
}

function orbitalRing(p: Palette): string {
  const parts: string[] = [];
  parts.push(ellipse(0, 0, 46, 18, 'none', `stroke="${p.accent}" stroke-width="4"`));
  parts.push(ellipse(0, 0, 46, 18, 'none', `stroke="${p.accent2}" stroke-width="1"`));
  parts.push(ellipse(0, 0, 40, 14, 'none', `stroke="${p.metalDark}" stroke-width="2"`));
  for (let i = 0; i < 6; i += 1) {
    const angle = (i / 6) * Math.PI * 2;
    parts.push(rect(Math.cos(angle) * 46 - 2, Math.sin(angle) * 18 - 2, 4, 4, p.accent2));
  }
  parts.push(giantBanana(0, 4, 1.1, p));
  parts.push(rect(-3, -24, 6, 8, p.metalLight));
  parts.push(circle(0, -26, 3, p.accent2));
  return parts.join('');
}
