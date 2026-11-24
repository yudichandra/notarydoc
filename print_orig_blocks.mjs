import fs from 'fs';

const orig = fs.readFileSync('c:/laragon/www/AKTE/contoh original.md', 'utf-8');

// Split orig by page or major notary paragraph
const lines = orig.split(/\r?\n/).filter(l => !l.match(/^Halaman\s+[A-Za-z\s]+[\.:]?$/i));

// Reconstruct by bullet '-' or headers
let blocks = [];
let cur = [];
for (let l of lines) {
  let trimmed = l.trim();
  if (!trimmed) continue;
  let clean = trimmed.replace(/---+/g, ' ').replace(/\s+/g, ' ').trim();
  
  if (trimmed.startsWith('-') || 
      trimmed.startsWith('AKTA') || 
      trimmed.startsWith('PARA') || 
      trimmed.startsWith('“PT') || 
      trimmed.startsWith('BERKEDUDUKAN') || 
      trimmed.startsWith('Nomor :') || 
      trimmed.startsWith('Para Pemegang') || 
      trimmed.startsWith('materai') || 
      trimmed.startsWith('tanda tangan') || 
      trimmed.startsWith('Tuan. BINTANG') || 
      trimmed.startsWith('Tuan. MATAHARI') || 
      trimmed.startsWith('Tuan. BULAN SABIT\r') || 
      trimmed.startsWith('Tuan. BULAN SABIT\n') || 
      trimmed.startsWith('Tuan. BULAN SABIT ') || 
      trimmed.startsWith('1)') || 
      trimmed.startsWith('2)') || 
      trimmed.startsWith('1.') || 
      trimmed.startsWith('2.') || 
      trimmed.startsWith('---- DIBERIKAN') || 
      trimmed.startsWith('NOTARIS DI') || 
      trimmed.startsWith('(')) {
    if (cur.length > 0) {
      blocks.push(cur.join(' ').replace(/\s+/g, ' ').trim());
      cur = [];
    }
  }
  cur.push(clean);
}
if (cur.length > 0) blocks.push(cur.join(' ').replace(/\s+/g, ' ').trim());

console.log("=== EXACT CHRONOLOGICAL BLOCKS IN CONTOH ORIGINAL ===");
blocks.forEach((b, i) => {
  console.log(`\n[BLOCK ${i+1}]`);
  console.log(b);
});
