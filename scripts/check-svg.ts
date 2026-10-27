import { readFile } from 'node:fs/promises';
import { checkSvgCompatibility, formatCompatibilityReport } from '../src/compat.ts';

const path = process.argv[2] ?? 'examples/monkey-civilization.svg';
const svg = await readFile(path, 'utf8');
const report = checkSvgCompatibility(svg);
console.log(`Checked ${path}`);
console.log(formatCompatibilityReport(report));
if (!report.ok) process.exitCode = 1;
