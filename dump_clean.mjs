import fs from 'fs';

const orig = fs.readFileSync('c:/laragon/www/AKTE/contoh original.md', 'utf-8');
const gen = fs.readFileSync('c:/laragon/www/AKTE/hasil generate.md', 'utf-8');

function cleanLines(text) {
  return text.split(/\r?\n/)
    .filter(l => !l.match(/^Halaman\s+[A-Za-z\s]+[\.:]?$/i))
    .map(l => l.replace(/---+/g, ' ').replace(/\s+/g, ' ').trim())
    .filter(l => l.length > 0);
}

fs.writeFileSync('c:/laragon/www/AKTE/orig_clean.txt', cleanLines(orig).join('\n'));
fs.writeFileSync('c:/laragon/www/AKTE/gen_clean.txt', cleanLines(gen).join('\n'));

console.log("Written orig_clean.txt and gen_clean.txt");
