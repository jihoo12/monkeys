/** Tiny SVG string builders. Keeping the output compact matters for READMEs. */

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function num(value: number): string {
  if (!Number.isFinite(value)) return '0';
  const rounded = Math.round(value * 100) / 100;
  return `${rounded}`;
}

export function rect(
  x: number,
  y: number,
  width: number,
  height: number,
  fill: string,
  extra = '',
): string {
  return `<rect x="${num(x)}" y="${num(y)}" width="${num(width)}" height="${num(height)}" fill="${fill}"${extra ? ` ${extra}` : ''}/>`;
}

export function poly(points: Array<[number, number]>, fill: string, extra = ''): string {
  const value = points.map(([x, y]) => `${num(x)},${num(y)}`).join(' ');
  return `<polygon points="${value}" fill="${fill}"${extra ? ` ${extra}` : ''}/>`;
}

export function circle(cx: number, cy: number, radius: number, fill: string, extra = ''): string {
  return `<circle cx="${num(cx)}" cy="${num(cy)}" r="${num(radius)}" fill="${fill}"${extra ? ` ${extra}` : ''}/>`;
}

export function ellipse(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  fill: string,
  extra = '',
): string {
  return `<ellipse cx="${num(cx)}" cy="${num(cy)}" rx="${num(rx)}" ry="${num(ry)}" fill="${fill}"${extra ? ` ${extra}` : ''}/>`;
}

export function line(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  stroke: string,
  width = 1,
  extra = '',
): string {
  return `<line x1="${num(x1)}" y1="${num(y1)}" x2="${num(x2)}" y2="${num(y2)}" stroke="${stroke}" stroke-width="${num(width)}"${extra ? ` ${extra}` : ''}/>`;
}

export function path(d: string, fill: string, extra = ''): string {
  return `<path d="${d}" fill="${fill}"${extra ? ` ${extra}` : ''}/>`;
}

export function group(content: string, attrs = ''): string {
  return `<g${attrs ? ` ${attrs}` : ''}>${content}</g>`;
}

export function svgElement(width: number, height: number, content: string, attrs = ''): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"${attrs ? ` ${attrs}` : ''}>${content}</svg>`;
}
