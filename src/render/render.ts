import type { CivilizationState, ContributionHistory } from '../types.ts';
import { paletteFor } from './palette.ts';
import { applyHolidayPalette, resolveHoliday, type HolidayOption } from './holidays.ts';
import { renderScene } from './scene.ts';
import { renderHud } from './hud.ts';
import { escapeXml } from './svg.ts';
import { formatNumber } from '../util/date.ts';

export interface RenderOptions {
  /** Disable CSS animation (useful for deterministic screenshots/tests). */
  animation?: boolean;
  /**
   * Holiday theme. `auto` (the default) picks a widely shared holiday from the
   * last day of the contribution window, `all` also picks regional holidays,
   * `none` disables it, or pass an explicit id.
   */
  holiday?: HolidayOption;
}

export const CANVAS_WIDTH = 960;
export const CANVAS_HEIGHT = 660;

export function renderCivilization(
  state: CivilizationState,
  history: ContributionHistory,
  options: RenderOptions = {},
): string {
  const animation = options.animation ?? true;
  const holiday = resolveHoliday(options.holiday, history.to);
  const palette = applyHolidayPalette(paletteFor(state.age), holiday);
  const scene = renderScene(state, history, palette, animation, holiday);
  const hud = renderHud(state, palette);

  const holidayTitle = holiday ? `, ${holiday.name}` : '';
  const title = `Monkey Civilization - @${state.username}, ${state.age.name}${holidayTitle}, population ${state.population}, ${formatNumber(
    state.bananas,
  )} bananas`;
  const holidayGreeting = holiday ? `${holiday.greeting} ` : '';
  const description = `${holidayGreeting}${state.stats.activeDays} active days, ${formatNumber(
    state.totalContributions,
  )} contributions, ${state.milestones.buildings} buildings. A deterministic pixel-art civilization powered by GitHub contributions.`;
  const holidayClass = holiday ? ` holiday-${holiday.id}` : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}" viewBox="0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}" role="img" aria-labelledby="mc-title mc-desc" class="age-${state.age.id}${holidayClass}" preserveAspectRatio="xMidYMid meet">
<title id="mc-title">${escapeXml(title)}</title>
<desc id="mc-desc">${escapeXml(description)}</desc>
<defs>
<linearGradient id="skyGradient" x1="0" y1="0" x2="0" y2="1">
<stop offset="0%" stop-color="${palette.skyTop}"/>
<stop offset="58%" stop-color="${palette.skyTop}"/>
<stop offset="88%" stop-color="${palette.skyBottom}"/>
<stop offset="100%" stop-color="${palette.haze}"/>
</linearGradient>
<radialGradient id="skyGlow" cx="0.74" cy="0.2" r="0.72">
<stop offset="0%" stop-color="${palette.sunGlow}" stop-opacity="0.24"/>
<stop offset="52%" stop-color="${palette.sunGlow}" stop-opacity="0.06"/>
<stop offset="100%" stop-color="${palette.sunGlow}" stop-opacity="0"/>
</radialGradient>
<linearGradient id="hudPanelGradient" x1="0" y1="0" x2="0" y2="1">
<stop offset="0%" stop-color="${palette.hudPanelLight}"/>
<stop offset="46%" stop-color="${palette.hudPanel}"/>
<stop offset="100%" stop-color="${palette.hudBg}"/>
</linearGradient>
<linearGradient id="hudInsetGradient" x1="0" y1="0" x2="0" y2="1">
<stop offset="0%" stop-color="${palette.hudInset}"/>
<stop offset="100%" stop-color="${palette.hudPanel}"/>
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
.sun{animation:sun-arc 120s ease-in-out infinite}
.moon{animation:moon-rise 120s ease-in-out infinite}
.night{animation:nightfall 120s ease-in-out infinite}
.star{opacity:.12;animation:star-night 120s ease-in-out infinite}
.age-space .star{opacity:.8;animation:twinkle 3.6s ease-in-out infinite alternate}
.planet{transform-box:fill-box;transform-origin:center;animation:planet-drift 9s ease-in-out infinite alternate}
.firefly{opacity:0;animation:firefly 120s ease-in-out infinite}
.lamp{opacity:.22;animation:lamp-glow 120s ease-in-out infinite}
.window{animation:window-glow 120s ease-in-out infinite}
.cloud{animation:cloud-drift 26s ease-in-out infinite alternate}
.bird{animation:bird-drift 12s ease-in-out infinite alternate}
.balloon{transform-box:fill-box;transform-origin:center;animation:float-slow 11s ease-in-out infinite alternate}
.airship{transform-box:fill-box;transform-origin:center;animation:float-slow 15s ease-in-out infinite alternate-reverse}
.heli{transform-box:fill-box;transform-origin:center;animation:heli-hover 7s ease-in-out infinite alternate}
.satellite{transform-box:fill-box;transform-origin:center;animation:satellite-drift 18s ease-in-out infinite alternate}
.leaves{animation:leaf-fall 7s linear infinite}
.aurora{animation:aurora-shift 14s ease-in-out infinite alternate}
.monkey-idle{animation:monkey-bob 2.8s ease-in-out infinite}
.celebrate{animation:monkey-jump 1.8s ease-in-out infinite}
.eye{transform-box:fill-box;transform-origin:center;animation:blink 6.4s steps(1) infinite}
.head{transform-box:fill-box;transform-origin:50% 100%;animation:head-nod 4.2s ease-in-out infinite}
.tail{transform-box:fill-box;transform-origin:0% 100%;animation:tail-wag 2.2s ease-in-out infinite}
.leg{transform-box:fill-box;transform-origin:50% 0%}
.walker .leg-l{animation:leg-swing .8s ease-in-out infinite}
.walker .leg-r{animation:leg-swing .8s ease-in-out infinite reverse}
.walker .arm-l{animation:arm-swing .8s ease-in-out infinite reverse}
.walker .arm-r{animation:arm-swing .8s ease-in-out infinite}
.arm{transform-box:fill-box;transform-origin:50% 0%}
.monkey-idle .arm-l{animation:arm-breathe 3.4s ease-in-out infinite}
.walk{transform-box:fill-box;transform-origin:center}
.working .arm-l{transform-box:fill-box;transform-origin:50% 0%;animation:work-swing 1.15s steps(2) infinite}
.working .tool{transform-box:fill-box;animation:tool-tap 1.15s ease-in-out infinite}
.working .tool-hoe,.working .tool-hammer,.working .tool-banjo{transform-origin:0% 100%}
.working .tool-book,.working .tool-scanner{transform-origin:0% 0%}
.working .tool-pan{transform-origin:0% 50%}
.carry{transform-box:fill-box;transform-origin:0% 50%;animation:carry-bob 2.4s ease-in-out infinite}
.windmill{transform-box:fill-box;transform-origin:center;animation:spin 16s linear infinite}
.ferris{transform-box:fill-box;transform-origin:center;animation:spin 24s linear infinite}
.turbine{transform-box:fill-box;transform-origin:center;animation:spin 7s linear infinite}
.orbit{transform-box:fill-box;transform-origin:center;animation:spin 34s linear infinite}
.gear{transform-box:fill-box;transform-origin:center;animation:spin 9s linear infinite reverse}
.dish{transform-box:fill-box;transform-origin:50% 100%;animation:dish-sweep 9s ease-in-out infinite alternate}
.telescope{transform-box:fill-box;transform-origin:50% 100%;animation:telescope-sweep 13s ease-in-out infinite alternate}
.robotic-arm{transform-box:fill-box;transform-origin:50% 100%;animation:arm-sweep 5s ease-in-out infinite alternate}
.flag{transform-box:fill-box;transform-origin:0% 50%;animation:flag-wave 1.8s ease-in-out infinite alternate}
.path-flag{transform-box:fill-box;transform-origin:0% 100%;animation:flag-wave 2.4s ease-in-out infinite alternate}
.fire,.flame{transform-box:fill-box;transform-origin:50% 100%;animation:flicker .55s steps(2) infinite}
.tree-sway{transform-box:fill-box;transform-origin:50% 100%;animation:tree-sway 7s ease-in-out infinite alternate}
.smoke{animation:smoke-rise 5s ease-out infinite}
.steam{animation:steam-rise 3.6s ease-out infinite}
.blink{animation:blink-pulse 1.4s steps(2) infinite}
.radio-wave{animation:radio 2.2s ease-out infinite}
.energy-arc{animation:arc 1.3s steps(2) infinite}
.drone{transform-box:fill-box;transform-origin:center;animation:drone-float 3.2s ease-in-out infinite}
.speech{opacity:0;animation:speech-pop 15s ease-in-out infinite}
.dust{animation:dust-puff 2.8s ease-out infinite}
.note{animation:note-rise 4.2s ease-out infinite}
.sparkle{transform-box:fill-box;transform-origin:center;animation:sparkle 2.2s ease-in-out infinite}
.holo{animation:holo-flicker 3.4s steps(2) infinite}
.shooting-star{opacity:0;animation:shoot 11s ease-in-out infinite}
.header{animation:header-in 1.1s ease-out both}
@keyframes sun-arc{0%,28%{opacity:1}44%,78%{opacity:0}92%,100%{opacity:1}}
@keyframes moon-rise{0%,28%{opacity:0}44%,78%{opacity:1}92%,100%{opacity:0}}
@keyframes nightfall{0%,28%{opacity:0}44%,78%{opacity:var(--night-opacity,.68)}92%,100%{opacity:0}}
@keyframes star-night{0%,28%{opacity:.08}44%,78%{opacity:.85}92%,100%{opacity:.08}}
@keyframes twinkle{from{opacity:.5}to{opacity:1}}
@keyframes lamp-glow{0%,28%{opacity:.22}44%,78%{opacity:.95}92%,100%{opacity:.22}}
@keyframes window-glow{0%,28%{opacity:.62}44%,78%{opacity:1}92%,100%{opacity:.62}}
@keyframes firefly{0%,28%{opacity:0;transform:translateY(0)}44%,62%{opacity:.95;transform:translateY(-4px)}78%,100%{opacity:0;transform:translateY(0)}}
@keyframes cloud-drift{from{transform:translateX(-9px)}to{transform:translateX(13px)}}
@keyframes bird-drift{from{transform:translate(-6px,1px)}to{transform:translate(10px,-2px)}}
@keyframes float-slow{from{transform:translateY(0)}to{transform:translateY(-5px)}}
@keyframes heli-hover{from{transform:translate(0,0)}to{transform:translate(5px,-3px)}}
@keyframes satellite-drift{from{transform:translate(-3px,1px) rotate(-2deg)}to{transform:translate(4px,-3px) rotate(2deg)}}
@keyframes leaf-fall{0%{transform:translate(0,-2px);opacity:0}12%{opacity:.8}100%{transform:translate(-12px,20px);opacity:0}}
@keyframes aurora-shift{from{opacity:.28;transform:translateX(-8px)}to{opacity:.62;transform:translateX(8px)}}
@keyframes planet-drift{from{transform:translateY(-2px)}to{transform:translateY(3px)}}
@keyframes monkey-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-1.5px)}}
@keyframes monkey-jump{0%,100%{transform:translateY(0)}32%{transform:translateY(-7px)}58%{transform:translateY(0)}}
@keyframes head-nod{0%,100%{transform:rotate(0)}50%{transform:rotate(1.4deg)}}
@keyframes blink{0%,44%{transform:scaleY(1)}46%,49%{transform:scaleY(.12)}51%,100%{transform:scaleY(1)}}
@keyframes blink-pulse{0%,100%{opacity:.35}50%{opacity:1}}
@keyframes leg-swing{0%,100%{transform:rotate(-11deg)}50%{transform:rotate(11deg)}}
@keyframes arm-swing{0%,100%{transform:rotate(-9deg)}50%{transform:rotate(9deg)}}
@keyframes arm-breathe{0%,100%{transform:rotate(0)}50%{transform:rotate(-2deg)}}
@keyframes tail-wag{0%,100%{transform:rotate(-7deg)}50%{transform:rotate(9deg)}}
@keyframes work-swing{0%,100%{transform:rotate(-20deg)}50%{transform:rotate(14deg)}}
@keyframes carry-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-1px)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes dish-sweep{from{transform:rotate(-13deg)}to{transform:rotate(13deg)}}
@keyframes telescope-sweep{from{transform:rotate(-9deg)}to{transform:rotate(9deg)}}
@keyframes arm-sweep{from{transform:rotate(-12deg)}to{transform:rotate(22deg)}}
@keyframes flag-wave{from{transform:skewY(0deg)}to{transform:skewY(7deg)}}
@keyframes flicker{0%,100%{transform:scaleY(1) scaleX(1);opacity:1}50%{transform:scaleY(1.1) scaleX(.95);opacity:.88}}
@keyframes tree-sway{from{transform:rotate(-1.2deg)}to{transform:rotate(1.2deg)}}
@keyframes smoke-rise{0%{transform:translateY(0);opacity:.6}100%{transform:translateY(-15px);opacity:0}}
@keyframes steam-rise{0%{transform:translateY(0);opacity:.5}100%{transform:translateY(-11px);opacity:0}}
@keyframes radio{0%{opacity:0}45%{opacity:1}100%{opacity:0}}
@keyframes arc{0%,100%{opacity:.3}50%{opacity:1}}
@keyframes drone-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
@keyframes speech-pop{0%,8%{opacity:0;transform:translateY(3px)}12%,26%{opacity:1;transform:translateY(0)}32%,100%{opacity:0;transform:translateY(3px)}}
@keyframes dust-puff{0%{transform:translate(0,0) scale(.6);opacity:0}30%{opacity:.5}100%{transform:translate(5px,-8px) scale(1.2);opacity:0}}
@keyframes note-rise{0%{transform:translate(0,2px);opacity:0}25%{opacity:.9}100%{transform:translate(3px,-14px);opacity:0}}
@keyframes sparkle{0%,100%{transform:scale(.5);opacity:.25}50%{transform:scale(1);opacity:1}}
@keyframes holo-flicker{0%,100%{opacity:.82}48%{opacity:.86}52%{opacity:.55}}
@keyframes shoot{0%,72%{opacity:0;transform:translate(-40px,-20px)}76%{opacity:1}86%{opacity:0;transform:translate(80px,40px)}100%{opacity:0}}
@keyframes header-in{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}
@media (prefers-reduced-motion: reduce){.sun{opacity:1}.moon,.night,.firefly,.shooting-star{display:none}.star{opacity:.12}.age-space .star{opacity:.82}.lamp{opacity:.2}.window,.speech{opacity:1}.aurora{opacity:.5}.sun,.moon,.night,.star,.planet,.lamp,.firefly,.window,.cloud,.bird,.balloon,.airship,.heli,.satellite,.leaves,.aurora,.monkey-idle,.celebrate,.eye,.head,.tail,.leg,.arm,.carry,.tool,.walk,.windmill,.ferris,.turbine,.orbit,.gear,.dish,.telescope,.robotic-arm,.flag,.path-flag,.fire,.flame,.smoke,.steam,.blink,.radio-wave,.energy-arc,.drone,.speech,.dust,.note,.sparkle,.holo,.shooting-star,.tree-sway,.header{animation:none!important}}
`;

const STATIC_CSS = `
.moon,.firefly,.shooting-star,.night{display:none}
.star{opacity:.12}
.age-space .star{opacity:.82}
.sun,.planet{opacity:1}
.lamp{opacity:.2}
.window{opacity:1}
.speech{opacity:1}
`;
