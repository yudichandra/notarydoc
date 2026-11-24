import fs from 'fs';

const orig = fs.readFileSync('c:/laragon/www/AKTE/contoh original.md', 'utf-8');
const gen = fs.readFileSync('c:/laragon/www/AKTE/hasil generate.md', 'utf-8');

function extractParagraphs(text) {
  const lines = text.split(/\r?\n/).filter(l => !l.match(/^Halaman (Pertama|Kedua|Ketiga|Keempat|Kelima|Keenam|Ketujuh|Kedelapan|Kesembilan|Kesepuluh)/i));
  const full = lines.join('\n');
  
  // Split on paragraph boundaries: lines starting with '-' or '1)' or '2)' or 'AKTA' or 'PARA' or '“PT' or 'BERKEDUDUKAN' or 'Nomor :' or '------' or 'Para Pemegang' or 'DIBERIKAN'
  // Or simply split where there are distinct dashes / bullets
  return lines.map(l => l.replace(/---+/g, '').trim()).filter(l => l.length > 0);
}

// Let's do a better breakdown by notary clauses:
// In notary deeds, each clause starts with '-' or a title or numbered item '1)', '2)', etc.
function getClauses(raw) {
  const lines = raw.split(/\r?\n/).filter(l => !l.trim().match(/^Halaman\s+[A-Za-z\s]+[\.:]?$/i));
  const clauses = [];
  let current = [];
  
  for (let line of lines) {
    let trimmed = line.trim();
    // remove trailing/leading dashes
    let clean = trimmed.replace(/---+/g, ' ').replace(/\s+/g, ' ').trim();
    if (!clean) continue;
    
    // Check if new clause starts
    if (trimmed.startsWith('-') || trimmed.match(/^(AKTA|PARA|“PT|BERKEDUDUKAN|Nomor\s*:|Para Pemegang|materai|tanda tangan|Tuan\.|Nona\.|DIREKTUR|KOMISARIS|1\)|2\)|1\.|2\.|DIBERIKAN|NOTARIS|\()/i)) {
      if (current.length > 0) {
        clauses.push(current.join(' ').replace(/\s+/g, ' ').trim());
        current = [];
      }
    }
    current.push(clean);
  }
  if (current.length > 0) {
    clauses.push(current.join(' ').replace(/\s+/g, ' ').trim());
  }
  return clauses;
}

const cOrig = getClauses(orig);
const cGen = getClauses(gen);

console.log("Original clauses count:", cOrig.length);
console.log("Generated clauses count:", cGen.length);

console.log("\n--- ORIGINAL CLAUSES (First 15) ---");
cOrig.slice(0, 15).forEach((c, i) => console.log(`[${i+1}] ${c.substring(0, 80)}...`));

console.log("\n--- GENERATED CLAUSES (First 15) ---");
cGen.slice(0, 15).forEach((c, i) => console.log(`[${i+1}] ${c.substring(0, 80)}...`));
