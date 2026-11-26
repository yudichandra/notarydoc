/**
 * Penata Baris & Sanitasi Teks Standar Akta Notaris (Pasal 42 UUJN)
 * Menjamin panjang setiap baris tidak pernah melebihi batas karakter (53 char default),
 * penutup garis hubung ('---') selalu rapi diawali spasi, dan input ekstrem/panjang tetap stabil.
 */

const INVISIBLE_CHARS_RE = /[\u200B-\u200D\uFEFF\u00AD]/g;
const UNICODE_SPACES_RE = /[\t\v\f\u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]/g;

/**
 * Membersihkan teks dari karakter tersembunyi, tab, NBSP, dan variasi baris baru.
 */
export function sanitizeNotaryText(rawText, { preserveNewlines = false } = {}) {
  if (rawText === null || rawText === undefined) return '';
  let text = String(rawText)
    .replace(INVISIBLE_CHARS_RE, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(UNICODE_SPACES_RE, ' ');

  if (!preserveNewlines) {
    return text.replace(/\n+/g, ' ');
  }
  return text;
}

/**
 * Membersihkan nilai isian inline (nama PT, nama orang, kedudukan, alamat, nomor)
 * agar Enter/Tab/spasi ganda dari hasil copy-paste tidak memutus struktur kalimat/judul.
 */
export function sanitizeInlineField(rawText) {
  return sanitizeNotaryText(rawText, { preserveNewlines: false })
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Membersihkan segmen nama berkas agar aman terhadap karakter ilegal Windows (/ \ : * ? " < > |)
 * dan membatasi panjang nama PT / nomor akta ekstrem supaya tidak melebihi batas path OS.
 */
export function sanitizeFilenameSegment(rawText, fallback = 'AKTA', maxLen = 60) {
  const clean = sanitizeInlineField(rawText)
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  if (!clean) return fallback;
  return clean.slice(0, Math.max(8, maxLen)).replace(/_+$/, '') || fallback;
}

/**
 * Mengonversi indeks berbasis-0 menjadi label huruf a..z, aa..az, ba.. dst.
 */
export function formatAlphaIndex(idx) {
  let n = Math.max(0, Math.floor(Number(idx) || 0));
  let label = '';
  do {
    label = String.fromCharCode(97 + (n % 26)) + label;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return label;
}

/**
 * Memecah satu fragmen tanpa spasi yang melebihi batas karakter baris.
 */
function sliceUnbreakableSegment(segment, maxLen) {
  if (!segment) return [];
  if (segment.length <= maxLen) return [segment];

  // Jangan menambahkan '-' pada deretan titik placeholder (mis. '....................')
  if (/^\.+$/.test(segment)) {
    const out = [];
    for (let i = 0; i < segment.length; i += maxLen) {
      out.push(segment.slice(i, i + maxLen));
    }
    return out;
  }

  const out = [];
  let rem = segment;
  const cutStep = Math.max(1, maxLen - 1);
  while (rem.length > maxLen) {
    out.push(rem.slice(0, cutStep) + '-');
    rem = rem.slice(cutStep);
  }
  if (rem) out.push(rem);
  return out;
}

/**
 * Memecah kata tanpa spasi menjadi token-token siap bungkus dengan dukungan
 * pemecahan alami pada pemisah '-', '/', '_' untuk kode SK / NIK / alamat panjang.
 */
function splitLongWordIntoTokens(word, maxLen) {
  if (!word) return [];

  // Kata pendek biasa tidak perlu dipecah (contoh tanggal 12-08-2010 atau RT.03/RW.04)
  if (word.length <= maxLen && word.length <= 16) {
    return [{ text: word, joinPrev: false }];
  }

  // Pisahkan di delimiter alami sambil mempertahankan delimiter di akhir potongan kiri
  const rawParts = word.split(/(?<=[-/_,;])/).filter(Boolean);

  // Jika kata punya beberapa segmen pemisah atau melebihi batas baris, rakit potongan yang muat
  if (rawParts.length > 1) {
    const tokens = [];
    let current = '';

    const pushChunk = (chunkStr) => {
      const sliced = sliceUnbreakableSegment(chunkStr, maxLen);
      sliced.forEach((piece) => {
        tokens.push({ text: piece, joinPrev: tokens.length > 0 });
      });
    };

    for (const part of rawParts) {
      // Jika panjang keseluruhan masih muat 16 huruf, jangan pecah
      if (!current) {
        if (part.length <= maxLen) {
          current = part;
        } else {
          pushChunk(part);
        }
      } else if (current.length + part.length <= Math.min(maxLen, 16)) {
        // Gabung potongan sangat pendek agar misalnya 'RT-01/' tidak terlalu terfragmentasi
        current += part;
      } else {
        pushChunk(current);
        if (part.length <= maxLen) {
          current = part;
        } else {
          pushChunk(part);
          current = '';
        }
      }
    }
    if (current) pushChunk(current);

    if (tokens.length > 0) return tokens;
  }

  // Kata panjang tunggal tanpa delimiter
  const sliced = sliceUnbreakableSegment(word, maxLen);
  return sliced.map((piece, idx) => ({ text: piece, joinPrev: idx > 0 }));
}

function finalizeNotaryLineWithDashes(lineStr, maxChars) {
  const diff = maxChars - lineStr.length;
  if (diff >= 2) {
    return lineStr + ' ' + '-'.repeat(diff - 1);
  }
  // Jika diff === 1 atau <= 0: jangan pernah menempelkan '-' tanpa spasi pada kata terakhir
  return lineStr;
}

/**
 * Algoritma Penata Baris Akta Notaris (Line-by-line Wrap & Dash Filling)
 * Sesuai Pasal 42 ayat (2) UUJN, menjamin setiap baris <= maxChars.
 */
export function formatTextToNotaryLines(rawText, maxChars = 53, options = {}) {
  if (!rawText || typeof rawText !== 'string') return [];
  const safeMax = Math.max(12, Math.floor(Number(maxChars) || 53));

  const cleanRaw = sanitizeNotaryText(rawText, { preserveNewlines: true });
  const leadingMatch = cleanRaw.match(/^ +/);
  const rawLeading = leadingMatch ? leadingMatch[0] : '';

  // Bersihkan hanya trailing whitespace atau penutup strip berulang (2+ dash atau spasi+dash),
  // sambil mempertahankan tanda '-' tunggal yang sah di akhir isian.
  const stripped = cleanRaw
    .replace(/\n+/g, ' ')
    .replace(/ +/g, ' ')
    .trim()
    .replace(/(?:\s+[-–—]+|[-–—]{2,})\s*$/, '')
    .trim();
  if (!stripped) return [];

  const maxAllowedIndent = Math.max(0, Math.floor(safeMax / 3));
  const leadingSpaces = rawLeading.slice(0, maxAllowedIndent);

  let continuationIndent = '';
  if (options && typeof options.continuationIndent === 'string') {
    continuationIndent = sanitizeNotaryText(options.continuationIndent).slice(0, maxAllowedIndent);
  } else if (safeMax > 35) {
    if (stripped.startsWith('- ') || stripped.startsWith('– ') || stripped.startsWith('— ')) {
      continuationIndent = leadingSpaces + '  ';
    } else if (/^\d+\)\s+/.test(stripped)) {
      const m = stripped.match(/^\d+\)\s+/);
      continuationIndent = leadingSpaces + ' '.repeat(m[0].length);
    } else if (/^\d+\.\s+/.test(stripped)) {
      const m = stripped.match(/^\d+\.\s+/);
      continuationIndent = leadingSpaces + (leadingSpaces ? '   ' : ' '.repeat(m[0].length));
    } else if (leadingSpaces) {
      continuationIndent = leadingSpaces;
    }
    if (continuationIndent.length > maxAllowedIndent) {
      continuationIndent = continuationIndent.slice(0, maxAllowedIndent);
    }
  }

  // Sisakan kapasitas token dengan memperhitungkan indentasi terpanjang
  const maxIndent = Math.max(leadingSpaces.length, continuationIndent.length);
  const maxTokenCap = Math.max(6, safeMax - maxIndent);

  const tokens = [];
  for (const w of stripped.split(' ')) {
    if (!w) continue;
    const splitTokens = splitLongWordIntoTokens(w, maxTokenCap);
    for (const t of splitTokens) tokens.push(t);
  }
  if (tokens.length === 0) return [];

  const lines = [];
  let isFirstLine = true;
  let currentLineTokens = [];
  let currentLineStr = '';

  const rebuildLineString = (lineTokens, prefix) => {
    if (lineTokens.length === 0) return '';
    let s = prefix + lineTokens[0].text;
    for (let k = 1; k < lineTokens.length; k++) {
      s += (lineTokens[k].joinPrev ? '' : ' ') + lineTokens[k].text;
    }
    return s;
  };

  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    const prefix = isFirstLine ? leadingSpaces : continuationIndent;

    if (currentLineTokens.length === 0) {
      currentLineTokens.push(tok);
      currentLineStr = prefix + tok.text;
      continue;
    }

    const sep = tok.joinPrev ? '' : ' ';
    const candidateLen = currentLineStr.length + sep.length + tok.text.length;

    if (candidateLen <= safeMax) {
      currentLineTokens.push(tok);
      currentLineStr += sep + tok.text;
    } else {
      // Hindari diff === 1 (sisa 1 spasi tanpa cukup ruang untuk ' -') bila baris punya >1 token
      if (safeMax - currentLineStr.length === 1 && currentLineTokens.length > 1) {
        const poppedTok = currentLineTokens.pop();
        const prevStr = rebuildLineString(currentLineTokens, prefix);
        lines.push(finalizeNotaryLineWithDashes(prevStr, safeMax));

        isFirstLine = false;
        const contPrefix = continuationIndent;
        currentLineTokens = [{ text: poppedTok.text, joinPrev: false }];
        currentLineStr = contPrefix + poppedTok.text;
        i--; // Uji ulang token saat ini pada baris baru
      } else {
        lines.push(finalizeNotaryLineWithDashes(currentLineStr, safeMax));
        isFirstLine = false;
        currentLineTokens = [{ text: tok.text, joinPrev: false }];
        currentLineStr = continuationIndent + tok.text;
      }
    }
  }

  // Baris terakhir dalam paragraf
  if (currentLineTokens.length > 0) {
    const prefix = isFirstLine ? leadingSpaces : continuationIndent;
    if (safeMax - currentLineStr.length === 1 && currentLineTokens.length > 1) {
      const lastTok = currentLineTokens.pop();
      const prevStr = rebuildLineString(currentLineTokens, prefix);
      lines.push(finalizeNotaryLineWithDashes(prevStr, safeMax));
      lines.push(finalizeNotaryLineWithDashes(continuationIndent + lastTok.text, safeMax));
    } else {
      lines.push(finalizeNotaryLineWithDashes(currentLineStr, safeMax));
    }
  }

  return lines;
}

/**
 * Menata teks rata tengah (judul akta, nama PT, kedudukan, penutup tanda tangan notaris)
 * dengan mendukung baris baru eksplisit (\n) serta memecah kata sangat panjang > maxChars.
 */
export function formatCenterNotaryLines(rawText, maxChars = 53) {
  if (!rawText || typeof rawText !== 'string') return [];
  const safeMax = Math.max(12, Math.floor(Number(maxChars) || 53));
  const cleaned = sanitizeNotaryText(rawText, { preserveNewlines: true });
  const rawLines = cleaned.split('\n');
  const result = [];

  for (const rawParagraph of rawLines) {
    const cleanP = rawParagraph.replace(/\s+/g, ' ').trim();
    if (!cleanP) continue;

    if (cleanP.length <= safeMax) {
      result.push(cleanP);
      continue;
    }

    const tokens = [];
    for (const w of cleanP.split(' ')) {
      if (!w) continue;
      for (const t of splitLongWordIntoTokens(w, safeMax)) {
        tokens.push(t);
      }
    }

    let curStr = '';
    for (const tok of tokens) {
      if (!curStr) {
        curStr = tok.text;
        continue;
      }
      const sep = tok.joinPrev ? '' : ' ';
      if (curStr.length + sep.length + tok.text.length <= safeMax) {
        curStr += sep + tok.text;
      } else {
        result.push(curStr);
        curStr = tok.text;
      }
    }
    if (curStr) result.push(curStr);
  }

  return result;
}

/**
 * Menata heading pemisah ber-garis hubung simetris (mis. ----- KEPUTUSAN SIRKULER ... -----)
 * dan otomatis fallback ke center multi-baris jika melebihi maxChars.
 */
export function formatDashedCenterHeading(title, maxChars = 53, minDashesEachSide = 3) {
  const safeMax = Math.max(12, Math.floor(Number(maxChars) || 53));
  const cleanTitle = sanitizeInlineField(title);
  if (!cleanTitle) return ['-'.repeat(safeMax)];

  const requiredWithDashes = cleanTitle.length + 2 + minDashesEachSide * 2;
  if (requiredWithDashes <= safeMax) {
    const diff = safeMax - cleanTitle.length - 2;
    const leftDashes = Math.floor(diff / 2);
    const rightDashes = diff - leftDashes;
    return [`${'-'.repeat(leftDashes)} ${cleanTitle} ${'-'.repeat(rightDashes)}`];
  }
  return formatCenterNotaryLines(cleanTitle, safeMax);
}

/**
 * Menata baris Susunan Pengurus Baru format 2-kolom notaris:
 * "- DIREKTUR ------------ : Tuan. NAMA, ..."
 * atau fallback paragraf penuh jika judul jabatan > 18 karakter / lebar tidak memadai.
 */
export function formatOfficerColumnLines(rawTitle, rawOfficerRight, maxChars = 53, formatFn = formatTextToNotaryLines) {
  const safeMax = Math.max(20, Math.floor(Number(maxChars) || 53));
  const cleanTitle = sanitizeInlineField(rawTitle || 'PENGURUS').toUpperCase() || 'PENGURUS';
  const cleanRight = sanitizeInlineField(rawOfficerRight);

  if (cleanTitle.length <= 18 && safeMax >= 40) {
    const col1Width = 25;
    const col2Width = safeMax - col1Width;
    const jabatanLabel = `- ${cleanTitle}`;
    const diff1 = col1Width - jabatanLabel.length - 3;
    const pad1 = diff1 > 0 ? ' ' + '-'.repeat(diff1 - 1) : '';
    const firstPrefix = (jabatanLabel + pad1 + ' : ').slice(0, col1Width).padEnd(col1Width, '-');
    const contPrefix = '-'.repeat(col1Width - 1) + ' ';

    const rightLines = formatFn(cleanRight, col2Width, { continuationIndent: '' });
    if (rightLines.length === 0) {
      return [{ text: firstPrefix + '-'.repeat(col2Width), align: 'left', bold: false }];
    }
    return rightLines.map((rLine, rIdx) => ({
      text: (rIdx === 0 ? firstPrefix : contPrefix) + rLine,
      align: 'left',
      bold: false
    }));
  }

  return formatFn(`- ${cleanTitle} : ${cleanRight}`, safeMax).map((l) => ({
    text: l,
    align: 'left',
    bold: false
  }));
}
