import fs from 'fs';

const origParas = JSON.parse(fs.readFileSync('c:/laragon/www/AKTE/orig_paras.json', 'utf-8'));
const genParas = JSON.parse(fs.readFileSync('c:/laragon/www/AKTE/gen_paras.json', 'utf-8'));

function similarity(s1, s2) {
  const w1 = new Set(s1.toLowerCase().split(/\s+/));
  const w2 = new Set(s2.toLowerCase().split(/\s+/));
  let match = 0;
  for (let w of w1) {
    if (w2.has(w)) match++;
  }
  return match / Math.max(w1.size, w2.size);
}

console.log("=== MATCHING ORIGINAL PARAGRAPHS TO GENERATED ===");
origParas.forEach((op, oIdx) => {
  let bestMatch = -1;
  let bestScore = 0;
  genParas.forEach((gp, gIdx) => {
    let score = similarity(op, gp);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = gIdx;
    }
  });

  if (bestScore > 0.4) {
    console.log(`[ORIG ${oIdx+1}] -> [GEN ${bestMatch+1}] (Score: ${bestScore.toFixed(2)})`);
    console.log(`   ORIG: ${op.substring(0, 90)}...`);
    if (bestScore < 0.95) {
      console.log(`   GEN:  ${genParas[bestMatch].substring(0, 90)}...`);
    }
  } else {
    console.log(`\n*** [ORIG ${oIdx+1}] NOT FOUND IN GENERATED! ***`);
    console.log(`   TEXT: ${op}\n`);
  }
});
