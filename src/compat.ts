import { readFile } from 'node:fs/promises';

export interface CompatibilityIssue {
  level: 'error' | 'warning';
  code: string;
  message: string;
}

export interface CompatibilityReport {
  ok: boolean;
  issues: CompatibilityIssue[];
  stats: {
    bytes: number;
    elements: number;
    keyframes: number;
    animationDeclarations: number;
    gradients: number;
    externalReferences: number;
  };
}

/**
 * Checks the subset of SVG that GitHub reliably renders inside an <img>.
 * This is intentionally conservative: everything must be inline, script-free,
 * and readable as a static image.
 */
export function checkSvgCompatibility(svg: string): CompatibilityReport {
  const issues: CompatibilityIssue[] = [];
  const bytes = Buffer.byteLength(svg, 'utf8');

  if (bytes > 2_000_000) {
    issues.push({
      level: 'error',
      code: 'size',
      message: `SVG is ${(bytes / 1024 / 1024).toFixed(2)} MB; GitHub image proxies may reject very large files.`,
    });
  } else if (bytes > 500_000) {
    issues.push({
      level: 'warning',
      code: 'size',
      message: `SVG is ${(bytes / 1024).toFixed(0)} KB. It should render, but smaller is safer for READMEs.`,
    });
  }

  const required: Array<[RegExp, string, string]> = [
    [/^<svg\b/, 'svg-root', 'The document must start with an <svg> root element.'],
    [/xmlns="http:\/\/www\.w3\.org\/2000\/svg"/, 'xmlns', 'The SVG namespace is missing.'],
    [/viewBox="[^"]+"/, 'viewbox', 'A viewBox is required for responsive scaling.'],
    [/role="img"/, 'role', 'role="img" helps screen readers treat the scene as an image.'],
    [/<title\b/, 'title', 'A <title> is required for accessibility.'],
    [/<desc\b/, 'desc', 'A <desc> is required for accessibility.'],
  ];
  for (const [pattern, code, message] of required) {
    if (!pattern.test(svg)) {
      issues.push({ level: 'error', code, message });
    }
  }

  const forbidden: Array<[RegExp, string, string]> = [
    [/<script\b/i, 'script', 'GitHub strips scripts; remove <script>.'],
    [/<foreignObject\b/i, 'foreign-object', 'foreignObject is not supported by GitHub image rendering.'],
    [/<iframe\b/i, 'iframe', 'iframes are not allowed inside README images.'],
    [/<object\b/i, 'object', 'embedded objects are not allowed.'],
    [/<embed\b/i, 'embed', 'embedded objects are not allowed.'],
    [/<image\b/i, 'image', 'External or embedded raster images are not self-contained.'],
    [/<audio\b/i, 'audio', 'Audio is not supported in README images.'],
    [/<video\b/i, 'video', 'Video is not supported in README images.'],
    [/\son[a-z]+\s*=/i, 'event-handler', 'Inline event handlers are stripped by GitHub.'],
    [/javascript:/i, 'javascript-url', 'javascript: URLs are stripped by GitHub.'],
    [/\bhref\s*=\s*"https?:/i, 'external-href', 'External hrefs are not reliable inside README images.'],
    [/\bxlink:href\s*=\s*"https?:/i, 'external-xlink', 'External xlink:hrefs are not reliable.'],
    [/@import\b/i, 'css-import', 'External CSS imports are blocked by the image proxy.'],
    [/url\(\s*["']?https?:/i, 'external-css-url', 'External CSS URLs are blocked by the image proxy.'],
    [/@font-face\b/i, 'font-face', 'External fonts are not available in the README image context.'],
  ];
  for (const [pattern, code, message] of forbidden) {
    if (pattern.test(svg)) {
      issues.push({ level: 'error', code, message });
    }
  }

  const keyframes = (svg.match(/@keyframes\b/g) ?? []).length;
  const animationDeclarations = (svg.match(/\banimation(?:-name)?\s*:/g) ?? []).length;
  const gradients = (svg.match(/<(?:linear|radial)Gradient\b/g) ?? []).length;
  const elements = (svg.match(/<[a-zA-Z][^>]*>/g) ?? []).length;
  const externalReferences =
    (svg.match(/\b(?:href|xlink:href)\s*=\s*"(?!#)[^"]*"/g) ?? []).length +
    (svg.match(/url\(\s*["']?(?!#)[^)]+\)/g) ?? []).length;

  if (keyframes === 0) {
    issues.push({
      level: 'warning',
      code: 'no-animation',
      message: 'No CSS keyframes found. The scene will still render, but without motion.',
    });
  }
  if (externalReferences > 0) {
    issues.push({
      level: 'error',
      code: 'external-reference',
      message: 'The SVG references something outside itself; GitHub may block or break it.',
    });
  }
  if (/<text\b/i.test(svg)) {
    issues.push({
      level: 'warning',
      code: 'text-element',
      message: 'The SVG uses <text>; external fonts are unreliable. The generated UI uses paths instead.',
    });
  }
  if (/\bfilter\s*=/i.test(svg)) {
    issues.push({
      level: 'warning',
      code: 'filter',
      message: 'SVG filters can be expensive or inconsistent in GitHub image rendering.',
    });
  }

  return {
    ok: !issues.some((issue) => issue.level === 'error'),
    issues,
    stats: {
      bytes,
      elements,
      keyframes,
      animationDeclarations,
      gradients,
      externalReferences,
    },
  };
}

export function formatCompatibilityReport(report: CompatibilityReport): string {
  const lines: string[] = [];
  lines.push(
    `SVG compatibility: ${report.ok ? 'PASS' : 'FAIL'} · ${(report.stats.bytes / 1024).toFixed(
      0,
    )} KB · ${report.stats.elements} elements · ${report.stats.keyframes} keyframes`,
  );
  for (const issue of report.issues) {
    lines.push(`  [${issue.level}] ${issue.code}: ${issue.message}`);
  }
  if (report.issues.length === 0) {
    lines.push('  No GitHub-specific red flags found.');
  }
  return lines.join('\n');
}

export async function checkSvgFile(path: string): Promise<CompatibilityReport> {
  const svg = await readFile(path, 'utf8');
  return checkSvgCompatibility(svg);
}
