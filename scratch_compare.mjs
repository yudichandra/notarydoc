import fs from 'fs';

const orig = fs.readFileSync('c:/laragon/www/AKTE/contoh original.md', 'utf-8');
const gen = fs.readFileSync('c:/laragon/www/AKTE/hasil generate.md', 'utf-8');

// Function to clean text: remove line wraps and trailing dashes and page headers
function cleanBlocks(text) {
  // Remove "Halaman Pertama.", "Halaman Kedua.", etc.
  const lines = text.split(/\r?\n/).filter(l => !l.match(/^Halaman (Pertama|Kedua|Ketiga|Keempat|Kelima|Keenam|Ketujuh|Kedelapan|Kesembilan|Kesepuluh)/i));
  const fullText = lines.join(' ');
  // Split by bullet point '-' or numbered items like '1)', '2)', etc.
  return fullText
    .replace(/---+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

console.log("=== ORIGINAL LENGTH ===", orig.length);
console.log("=== GENERATED LENGTH ===", gen.length);

fs.writeFileSync('c:/laragon/www/AKTE/scratch_compare.json', JSON.stringify({
  cleanOrig: cleanBlocks(orig),
  cleanGen: cleanBlocks(gen)
}, null, 2));

console.log("Saved scratch_compare.json");
