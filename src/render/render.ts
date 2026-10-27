import type { CivilizationState, ContributionHistory } from '../types.ts';
import { paletteFor } from './palette.ts';
import { renderScene, SCENE_HEIGHT, SCENE_WIDTH } from './scene.ts';
import { renderHud } from './hud.ts';
import { escapeXml } from './svg.ts';
import { formatNumber } from '../util/date.ts';

export interface RenderOptions {
  /** Disable CSS animation (useful for deterministic screenshots/tests). */
  animation?: boolean;
}

export const CANVAS_WIDTH = 960;
export const CANVAS_HEIGHT = 660;

export function renderCivilization(
  state: CivilizationState,
  history: ContributionHistory,
  options: RenderOptions = {},
): string {
  const animation = options.animation ?? true;
  const palette = paletteFor(state.age);
  const scene = renderScene(state, history, palette, animation);
  const hud = renderHud(state, palette);

  const title = `Monkey Civilization - @${state.username}, ${state.age.name}, population ${state.population}, ${formatNumber(
    state.bananas,
  )} bananas`;
  const description = `${state.stats.activeDays} active days, ${formatNumber(
    state.totalContributions,
  )} contributions, ${state.milestones.buildings} buildings. A deterministic pixel-art civilization powered by GitHub contributions.`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" viewBox="0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}" role="img" aria-labelledby="mc-title mc-desc" class="age-${state.age.id}" preserveAspectRatio="xMidYMid meet">
<title id="mc-title">${escapeXml(title)}</title>
<desc id="mc-desc">${escapeXml(description)}</desc>
<defs>
<linearGradient id="skyGradient" x1="0" y1="0" x2="0" y2="1">
<stop offset="0%" stop-color="${palette.skyTop}"/>
<stop offset="100%" stop-color="${palette.skyBottom}"/>
</linearGradient>
<style>${animation ? `${BASE_CSS}${scene.css}` : STATIC_CSS}</style>
</defs>
<g shape-rendering="geometricPrecision">
${scene.svg}
${hud}
<rect x="2" y="2" width="${CANVAS_WIDTH - 4}" height="${CANVAS_HEIGHT - 4}" fill="none" stroke="${palette.outline}" stroke-width="3"/>
</g>
</svg>`;
}

const BASE_CSS = `
.sun{animation:sun-fade 120s ease-in-out infinite}
.moon{opacity:0;animation:moon-rise 120s ease-in-out infinite}
.night{opacity:0;animation:nightfall 120s ease-in-out infinite}
.star{opacity:.12;animation:star-night 120s ease-in-out infinite}
.age-space .star{opacity:.82;animation:twinkle 3.2s ease-in-out infinite alternate}
.lamp{opacity:.2;animation:lamp-glow 120s ease-in-out infinite}
.firefly{opacity:0;animation:firefly 120s ease-in-out infinite}
.window{animation:window-glow 120s ease-in-out infinite}
.cloud{animation:cloud-bob 18s ease-in-out infinite alternate}
.bird{animation:bird-drift 10s ease-in-out infinite alternate}
.monkey-idle{animation:monkey-bob 2.6s ease-in-out infinite}
.celebrate{animation:monkey-jump 1.6s ease-in-out infinite}
.leg{transform-box:fill-box;transform-origin:50% 0%}
.walker .leg-l{animation:leg-swing .8s steps(2) infinite}
.walker .leg-r{animation:leg-swing .8s steps(2) infinite reverse}
.tail{transform-box:fill-box;transform-origin:0% 50%;animation:tail-wag 2.2s ease-in-out infinite}
.walk{transform-box:fill-box;transform-origin:center}
.working .arm-r{transform-box:fill-box;transform-origin:50% 0%;animation:work-swing 1.1s steps(2) infinite}
.working .tool{transform-box:fill-box;transform-origin:0% 50%;animation:tool-swing 1.1s steps(2) infinite}
.windmill{transform-box:fill-box;transform-origin:center;animation:spin 18s linear infinite}
.ferris{transform-box:fill-box;transform-origin:center;animation:spin 26s linear infinite}
.turbine{transform-box:fill-box;transform-origin:center;animation:spin 6s linear infinite}
.orbit{transform-box:fill-box;transform-origin:center;animation:spin 30s linear infinite}
.gear{transform-box:fill-box;transform-origin:center;animation:spin 8s linear infinite reverse}
.dish{transform-box:fill-box;transform-origin:50% 100%;animation:dish-sweep 8s ease-in-out infinite alternate}
.telescope{transform-box:fill-box;transform-origin:50% 100%;animation:telescope-sweep 12s ease-in-out infinite alternate}
.robotic-arm{transform-box:fill-box;transform-origin:50% 100%;animation:arm-sweep 4s ease-in-out infinite alternate}
.flag{transform-box:fill-box;transform-origin:0% 50%;animation:flag-wave 2s ease-in-out infinite alternate}
.fire,.flame{animation:flicker .45s steps(2) infinite}
.tree-sway{transform-box:fill-box;transform-origin:50% 100%;animation:tree-sway 7s ease-in-out infinite alternate}
.smoke{animation:smoke-rise 4s ease-out infinite}
.blink{animation:blink 1.2s steps(2) infinite}
.radio-wave{animation:radio 2s ease-out infinite}
.energy-arc{animation:arc 1.2s steps(2) infinite}
.drone{animation:drone-float 3s ease-in-out infinite}
.speech{opacity:0;animation:speech-pop 14s ease-in-out infinite}
.shooting-star{opacity:0;animation:shoot 9s ease-in-out infinite}
@keyframes sun-fade{0%,30%{opacity:1}45%,75%{opacity:0}92%,100%{opacity:1}}
@keyframes moon-rise{0%,30%{opacity:0}45%,75%{opacity:1}92%,100%{opacity:0}}
@keyframes nightfall{0%,30%{opacity:0}45%,75%{opacity:var(--night-opacity,.68)}92%,100%{opacity:0}}
@keyframes star-night{0%,30%{opacity:.08}45%,75%{opacity:.85}92%,100%{opacity:.08}}
@keyframes twinkle{from{opacity:.55}to{opacity:1}}
@keyframes lamp-glow{0%,30%{opacity:.2}45%,75%{opacity:.95}92%,100%{opacity:.2}}
@keyframes window-glow{0%,30%{opacity:.7}45%,75%{opacity:1}92%,100%{opacity:.7}}
@keyframes firefly{0%,30%{opacity:0;transform:translateY(0)}45%,75%{opacity:1;transform:translateY(-4px)}92%,100%{opacity:0;transform:translateY(0)}}
@keyframes cloud-bob{from{transform:translateX(-10px)}to{transform:translateX(14px)}}
@keyframes bird-drift{from{transform:translateX(-6px)}to{transform:translateX(10px)}}
@keyframes monkey-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-1.5px)}}
@keyframes monkey-jump{0%,100%{transform:translateY(0)}35%{transform:translateY(-7px)}60%{transform:translateY(0)}}
@keyframes leg-swing{0%,100%{transform:rotate(-10deg)}50%{transform:rotate(10deg)}}
@keyframes tail-wag{0%,100%{transform:rotate(-6deg)}50%{transform:rotate(8deg)}}
@keyframes work-swing{0%,100%{transform:rotate(-18deg)}50%{transform:rotate(12deg)}}
@keyframes tool-swing{0%,100%{transform:rotate(0deg)}50%{transform:rotate(-20deg)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes dish-sweep{from{transform:rotate(-12deg)}to{transform:rotate(12deg)}}
@keyframes telescope-sweep{from{transform:rotate(-8deg)}to{transform:rotate(8deg)}}
@keyframes arm-sweep{from{transform:rotate(-10deg)}to{transform:rotate(20deg)}}
@keyframes flag-wave{from{transform:skewY(0deg)}to{transform:skewY(6deg)}}
@keyframes flicker{0%,100%{transform:scaleY(1);opacity:1}50%{transform:scaleY(1.08);opacity:.9}}
@keyframes tree-sway{from{transform:rotate(-1.1deg)}to{transform:rotate(1.1deg)}}
@keyframes smoke-rise{0%{transform:translateY(0);opacity:.65}100%{transform:translateY(-14px);opacity:0}}
@keyframes blink{0%,45%{opacity:1}50%,100%{opacity:.15}}
@keyframes radio{0%{opacity:0}50%{opacity:1}100%{opacity:0}}
@keyframes arc{0%,100%{opacity:.3}50%{opacity:1}}
@keyframes drone-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
@keyframes speech-pop{0%,10%{opacity:0;transform:translateY(3px)}14%,28%{opacity:1;transform:translateY(0)}34%,100%{opacity:0;transform:translateY(3px)}}
@keyframes shoot{0%,70%{opacity:0;transform:translate(-40px,-20px)}75%{opacity:1}85%{opacity:0;transform:translate(80px,40px)}100%{opacity:0}}
@media (prefers-reduced-motion: reduce){.sun,.moon,.night,.star,.lamp,.firefly,.window,.cloud,.bird,.monkey-idle,.celebrate,.walk,.leg,.tail,.arm,.tool,.windmill,.ferris,.turbine,.orbit,.gear,.dish,.telescope,.robotic-arm,.flag,.fire,.flame,.smoke,.blink,.radio-wave,.energy-arc,.drone,.speech,.shooting-star,.tree-sway{animation:none!important}}
`;

const STATIC_CSS = `
.moon,.firefly,.shooting-star,.night{display:none}
.star{opacity:.12}
.age-space .star{opacity:.82}
.sun{opacity:1}
.lamp{opacity:.2}
.window{opacity:1}
.speech{opacity:1}
`;
