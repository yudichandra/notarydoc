import fs from 'fs';
import { generateNotaryPages } from './src/utils/docGenerator.js';

// Let's load DEMO_DATA_PT
const mainJs = fs.readFileSync('./src/main.js', 'utf-8');
const demoMatch = mainJs.match(/const DEMO_DATA_PT = ({[\s\S]*?\n};\n)/);
let DEMO_DATA_PT;
eval('DEMO_DATA_PT = ' + demoMatch[1]);

// Let's test with default generator first
const origPages = fs.readFileSync('c:/laragon/www/AKTE/contoh original.md', 'utf-8')
  .split(/Halaman\s+[A-Za-z\s]+[\.:]?/i)
  .filter(p => p.trim().length > 0);

console.log("Original doc has pages:", origPages.length);
origPages.forEach((p, idx) => {
  const lineCount = p.split(/\r?\n/).filter(l => l.trim().length > 0).length;
  console.log(`Page ${idx+1} lines in original:`, lineCount);
});
