import { readFile, writeFile } from 'node:fs/promises';
import { Resvg } from '@resvg/resvg-js';

const input = process.argv[2] ?? 'examples/monkey-civilization.svg';
const output = process.argv[3] ?? 'examples/monkey-civilization.png';
const width = Number(process.argv[4] ?? 1920);

const svg = await readFile(input);
const resvg = new Resvg(svg, {
  fitTo: { mode: 'width', value: width },
  font: { loadSystemFonts: false },
});
const png = resvg.render().asPng();
await writeFile(output, png);
console.log(`Rendered ${input} -> ${output} (${width}px wide, ${(png.length / 1024).toFixed(0)} KB)`);
