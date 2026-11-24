import fs from 'fs';

const orig = fs.readFileSync('c:/laragon/www/AKTE/contoh original.md', 'utf-8');
const gen = fs.readFileSync('c:/laragon/www/AKTE/hasil generate.md', 'utf-8');

// Print original line by line with their semantic labels
console.log("=== CONTOH ORIGINAL STRUCTURE ===");
const origLines = orig.split(/\r?\n/).filter(l => l.trim().length > 0);
origLines.forEach((l, idx) => {
  if (l.startsWith('Halaman')) {
    console.log(`\n--- [ORIG ${l}] ---`);
  } else {
    console.log(`[L${idx+1}] ${l.substring(0, 95)}`);
  }
});
