import fs from 'fs';

const origLines = fs.readFileSync('c:/laragon/www/AKTE/orig_clean.txt', 'utf-8').split('\n');
const genLines = fs.readFileSync('c:/laragon/www/AKTE/gen_clean.txt', 'utf-8').split('\n');

console.log("Original non-empty lines:", origLines.length);
console.log("Generated non-empty lines:", genLines.length);

// Let's read the raw text of both
const origText = origLines.join(' ');
const genText = genLines.join(' ');

// Check for specific phrases in orig that are missing in gen
const sentencesInOrig = origText.split(/(?<=[;.\-:])\s+/);

const missing = [];
for (let s of sentencesInOrig) {
  let sClean = s.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  if (sClean.length < 15) continue;
  let genClean = genText.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  if (!genClean.includes(sClean)) {
    missing.push(s);
  }
}

console.log("=== MISSING SENTENCES FROM ORIGINAL ===");
console.log("Count:", missing.length);
missing.forEach((m, idx) => {
  console.log(`\n[${idx+1}]`, m);
});
