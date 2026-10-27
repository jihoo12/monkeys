import assert from 'node:assert/strict';
import test from 'node:test';
import { checkSvgCompatibility, formatCompatibilityReport } from '../src/compat.ts';
import { demoHistory } from '../src/data/demo.ts';
import { simulateCivilization } from '../src/sim/engine.ts';
import { renderCivilization } from '../src/render/render.ts';

const MINIMAL = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10" role="img" aria-labelledby="t d"><title id="t">t</title><desc id="d">d</desc><rect width="10" height="10" fill="#000"/></svg>`;

test('a minimal self-contained SVG passes', () => {
  const report = checkSvgCompatibility(MINIMAL);
  assert.equal(report.ok, true);
  assert.equal(report.stats.keyframes, 0);
  assert.ok(report.issues.some((issue) => issue.code === 'no-animation'));
  assert.equal(report.stats.externalReferences, 0);
  assert.equal(report.stats.gradients, 0);
});

test('scripts, external assets and event handlers are rejected', () => {
  const cases: Array<[string, string]> = [
    [MINIMAL.replace('</svg>', '<script>alert(1)</script></svg>'), 'script'],
    [MINIMAL.replace('</svg>', '<image href="https://example.com/a.png"/></svg>'), 'image'],
    [MINIMAL.replace('</svg>', '<foreignObject/></svg>'), 'foreign-object'],
    [MINIMAL.replace('</svg>', '<a href="https://example.com">x</a></svg>'), 'external-href'],
    [MINIMAL.replace('</svg>', '<rect onclick="x()"/></svg>'), 'event-handler'],
    [MINIMAL.replace('</svg>', '<style>@import url(https://example.com/a.css);</style></svg>'), 'css-import'],
    [MINIMAL.replace('</svg>', '<style>@font-face{font-family:x;src:url(https://x/y.woff)}</style></svg>'), 'font-face'],
  ];
  for (const [svg, code] of cases) {
    const report = checkSvgCompatibility(svg);
    assert.equal(report.ok, false, `${code} should fail`);
    assert.ok(
      report.issues.some((issue) => issue.code === code && issue.level === 'error'),
      `${code} was not reported: ${JSON.stringify(report.issues)}`,
    );
  }
});

test('missing accessibility and root metadata is reported', () => {
  const report = checkSvgCompatibility('<svg><rect width="1" height="1"/></svg>');
  assert.equal(report.ok, false);
  const codes = report.issues.map((issue) => issue.code);
  for (const code of ['xmlns', 'viewbox', 'role', 'title', 'desc']) {
    assert.ok(codes.includes(code), `missing ${code}`);
  }
});

test('size and text/filter warnings are non-fatal', () => {
  const padded = MINIMAL.replace('</svg>', `<desc>${'x'.repeat(510_000)}</desc></svg>`);
  const report = checkSvgCompatibility(padded);
  assert.equal(report.ok, true);
  assert.ok(report.issues.some((issue) => issue.code === 'size' && issue.level === 'warning'));

  const huge = MINIMAL.replace('</svg>', `<desc>${'x'.repeat(2_100_000)}</desc></svg>`);
  const hugeReport = checkSvgCompatibility(huge);
  assert.equal(hugeReport.ok, false);
  assert.ok(hugeReport.issues.some((issue) => issue.code === 'size' && issue.level === 'error'));

  const withText = MINIMAL.replace('</svg>', '<text x="1" y="1">hi</text></svg>');
  const textReport = checkSvgCompatibility(withText);
  assert.equal(textReport.ok, true);
  assert.ok(textReport.issues.some((issue) => issue.code === 'text-element'));

  const withFilter = MINIMAL.replace('</svg>', '<rect filter="url(#f)"/></svg>');
  const filterReport = checkSvgCompatibility(withFilter);
  assert.equal(filterReport.ok, true);
  assert.ok(filterReport.issues.some((issue) => issue.code === 'filter'));
});

test('the generated demo SVG passes without errors', () => {
  const history = demoHistory('space');
  const state = simulateCivilization(history);
  const svg = renderCivilization(state, history);
  const report = checkSvgCompatibility(svg);
  assert.equal(report.ok, true);
  assert.equal(report.issues.filter((issue) => issue.level === 'error').length, 0);
  assert.ok(report.stats.bytes > 10_000);
  assert.ok(report.stats.keyframes > 0);
  assert.ok(report.stats.animationDeclarations > 0);
  assert.ok(report.stats.gradients >= 1);
  assert.equal(report.stats.externalReferences, 0);
});

test('formatCompatibilityReport is readable', () => {
  const pass = formatCompatibilityReport(checkSvgCompatibility(MINIMAL));
  assert.match(pass, /SVG compatibility: PASS/);
  assert.match(pass, /no-animation/);

  const fail = formatCompatibilityReport(
    checkSvgCompatibility(MINIMAL.replace('</svg>', '<script/></svg>')),
  );
  assert.match(fail, /SVG compatibility: FAIL/);
  assert.match(fail, /script/);
});
