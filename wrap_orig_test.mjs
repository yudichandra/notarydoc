import fs from 'fs';
import { formatTextToNotaryLines } from './src/utils/docGenerator.js';

const origPages = fs.readFileSync('c:/laragon/www/AKTE/contoh original.md', 'utf-8')
  .split(/Halaman\s+[A-Za-z\s]+[\.:]?/i)
  .filter(p => p.trim().length > 0);

console.log("=== WRAPPING CONTOH ORIGINAL PAGES AT 53 CHARS ===");
let totalNotaryLines = 0;
origPages.forEach((p, idx) => {
  const rawLines = p.split(/\r?\n/).filter(l => l.trim().length > 0);
  let pageLinesCount = 0;
  for (let rl of rawLines) {
    if (rl.includes('---')) {
      // It already has dashes or partial line
      pageLinesCount++;
    } else {
      const wrapped = formatTextToNotaryLines(rl, 53);
      pageLinesCount += wrapped.length;
    }
  }
  totalNotaryLines += pageLinesCount;
  console.log(`Page ${idx+1} estimated lines: ${pageLinesCount}`);
});
console.log("Total estimated lines in original:", totalNotaryLines);
