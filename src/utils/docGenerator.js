// Generator Dokumen Word (.docx) untuk Akta Notaris (PT, CV, Firma, UD)
// Sesuai Standar Pasal 42 UUJN & Pengaturan Page Setup A4 Notaris Indonesia
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  UnderlineType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle
} from 'docx';
import fileSaver from 'file-saver';
const saveAs = fileSaver.saveAs || fileSaver;
import {
  formatTanggalAkta,
  formatTanggalBiasa,
  formatTanggalTanpaAwalan,
  formatJamAkta,
  formatSaham,
  formatRupiah
} from './terbilang.js';
import { substitutePlaceholders, renderTemplateTextToLines } from './clauseTemplates.js';

/**
 * Algoritma Penata Baris Akta Notaris (Line-by-line Wrap & Dash Filling)
 * Sesuai Pasal 42 ayat (2) UUJN:
 * "Ruang dan sela kosong dalam akta digaris dengan jelas sebelum akta ditandatangani."
 *
 * Pada font Courier New 12 pt dengan margin Left: 2.56" dan Right: 0.39" di kertas A4,
 * lebar bidang ketik pas memuat TEPAT 53 karakter per baris.
 * Setiap baris yang tidak penuh otomatis ditutup dengan garis hubung/strip ('---')
 * sehingga tepi kanan rata lurus sempurna dan jarak antar baris 100% konstan.
 */
export function formatTextToNotaryLines(rawText, maxChars = 53, options = {}) {
  if (!rawText || typeof rawText !== 'string') return [];

  // Tangkap spasi awal jika ada (misal alinea masuk "  Bahwa ...")
  const leadingMatch = rawText.match(/^\s+/);
  const leadingSpaces = leadingMatch ? leadingMatch[0] : '';

  // Bersihkan teks dari trailing dashes atau baris baru berlebih
  const stripped = rawText.replace(/[-–—\s]+$/, '').replace(/\r\n/g, '\n').replace(/\s+/g, ' ').trim();
  if (!stripped) return [];

  // Tentukan indentasi baris lanjutan (tab / hanging indent) sesuai standar salinanakta.pdf
  let continuationIndent = '';
  if (options && typeof options.continuationIndent === 'string') {
    continuationIndent = options.continuationIndent;
  } else if (maxChars > 35) {
    if (stripped.startsWith('- ') || stripped.startsWith('-\t') || stripped.startsWith('– ') || stripped.startsWith('— ')) {
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
  }

  const rawWords = stripped.split(' ');
  const words = [];
  
  // Amankan kata yang sangat panjang (melebihi maxChars) agar tidak merusak lebar baris
  for (const w of rawWords) {
    if (w.length > maxChars) {
      let rem = w;
      while (rem.length > maxChars) {
        words.push(rem.slice(0, maxChars - 1) + '-');
        rem = rem.slice(maxChars - 1);
      }
      if (rem) words.push(rem);
    } else {
      words.push(w);
    }
  }

  const lines = [];
  let currentWords = [];
  let currentLen = 0;
  let isFirstLine = true;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const prefix = (isFirstLine ? leadingSpaces : continuationIndent);
    const wordToPush = (currentWords.length === 0 && prefix)
      ? prefix + word
      : word;

    const testLen = currentWords.length === 0
      ? wordToPush.length
      : currentLen + 1 + word.length;

    if (testLen <= maxChars) {
      currentWords.push(wordToPush);
      currentLen = testLen;
    } else {
      let lineStr = currentWords.join(' ');
      const diff = maxChars - lineStr.length;
      if (diff > 0) {
        if (diff === 1) {
          lineStr += '-';
        } else {
          lineStr += ' ' + '-'.repeat(diff - 1);
        }
      }
      lines.push(lineStr);

      isFirstLine = false;
      const nextWord = continuationIndent ? continuationIndent + word : word;
      currentWords = [nextWord];
      currentLen = nextWord.length;
    }
  }

  // Baris terakhir dalam alinea/paragraf, tutup sisa ruang kosong dengan dashes
  if (currentWords.length > 0) {
    let lineStr = currentWords.join(' ');
    const diff = maxChars - lineStr.length;
    if (diff > 0) {
      if (diff === 1) {
        lineStr += '-';
      } else {
        lineStr += ' ' + '-'.repeat(diff - 1);
      }
    }
    lines.push(lineStr);
  }

  return lines;
}

// Helper membuat Paragraph Word ber-spasi konstan (Standar 2.0 Double Spacing, Spacing Before 0, After 0)
function createSingleLinePara(text, { bold = false, align = AlignmentType.LEFT, underline = null, spacing = {} } = {}, defaultLine = 480) {
  return new Paragraph({
    alignment: align,
    spacing: {
      before: spacing.before !== undefined ? spacing.before : 0,
      after: spacing.after !== undefined ? spacing.after : 0,
      line: spacing.line !== undefined ? spacing.line : defaultLine, // 480 dxa = 2.0 Double line spacing
      lineRule: 'auto'
    },
    children: [
      new TextRun({
        text,
        bold,
        underline: underline ? { type: underline } : undefined,
        font: 'Courier New',
        size: 24 // 12 pt (24 half-points)
      })
    ]
  });
}

/**
 * Format nama penomoran halaman standar akta notaris Indonesia
 * (Halaman Pertama., Halaman Kedua., dst.)
 */
export function getNamaHalaman(pageNum, isLastPage = false) {
  const ordinals = {
    1: 'Pertama',
    2: 'Kedua',
    3: 'Ketiga',
    4: 'Keempat',
    5: 'Kelima',
    6: 'Keenam',
    7: 'Ketujuh',
    8: 'Kedelapan',
    9: 'Kesembilan',
    10: 'Kesepuluh',
    11: 'Kesebelas',
    12: 'Kedua Belas',
    13: 'Ketiga Belas',
    14: 'Keempat Belas',
    15: 'Kelima Belas',
    16: 'Keenam Belas',
    17: 'Ketujuh Belas',
    18: 'Kedelapan Belas',
    19: 'Kesembilan Belas',
    20: 'Kedua Puluh'
  };
  const nama = ordinals[pageNum] || `Ke-${pageNum}`;
  if (isLastPage) {
    return `Halaman ${nama} dan terakhir.`;
  }
  return `Halaman ${nama}.`;
}

/**
 * Helper terpadu untuk membaca sub-tipe PT dan menormalkan field peningkatan modal
 */
function resolveSubTipe(data, fallback = 'SIRKULER_PENGURUS') {
  return data?.subTipe || data?.badanUsaha?.subTipe || fallback;
}

function resolveModalFields(data, isRups) {
  const pm = data?.peningkatanModal || {};
  const nominalPerSaham = Number(pm.nominalPerSaham || 1000000);
  const sahamKeluarJml = Number(pm.sahamSimpananDikeluarkanJml ?? pm.sahamDikeluarkanJml ?? (isRups ? 5000 : 609305));
  const sahamKeluarNominal = Number(pm.sahamSimpananDikeluarkanNominal ?? pm.sahamDikeluarkanNominal ?? (isRups ? 5000000000 : 609305000000));
  const modalSemulaNominal = Number(pm.modalSemulaNominal ?? (isRups ? 199000000000 : 353201000000));
  const modalSemulaSaham = Number(pm.modalSemulaSaham ?? (isRups ? 199000 : 353201));
  const modalMenjadiNominal = Number(pm.modalMenjadiNominal ?? (isRups ? 204000000000 : 962506000000));
  const modalMenjadiSaham = Number(pm.modalMenjadiSaham ?? (isRups ? 204000 : 962506));

  const defaultPmList = isRups
    ? [
        { nama: 'perseroan terbatas PT. CIPTA PERSADA INDONESIA', jumlahSaham: 203999, nominal: 203999000000 },
        { nama: 'perseroan terbatas PT. HARUM SEMERBAK', jumlahSaham: 1, nominal: 1000000 }
      ]
    : [
        { nama: 'perseroan terbatas PT. JAYA ABADI SELALU', jumlahSaham: 962505, nominal: 962505000000 },
        { nama: 'perseroan terbatas PT. PELITA JAYA SELALU', jumlahSaham: 1, nominal: 1000000 }
      ];

  const rawList = (Array.isArray(pm.pemegangSahamModal) && pm.pemegangSahamModal.length > 0)
    ? pm.pemegangSahamModal
    : defaultPmList;

  const pmList = rawList.map(ps => {
    const jml = Number(ps.jumlahSaham ?? ps.lembarSaham ?? 0);
    const nom = Number(ps.nominal ?? ps.totalNominal ?? (jml * nominalPerSaham));
    return {
      nama: ps.nama || '',
      jumlahSaham: jml,
      nominal: nom,
      nominalPerSaham: Number(ps.nominalPerSaham ?? nominalPerSaham),
      persentase: ps.persentase || ''
    };
  });

  return {
    nominalPerSaham,
    sahamKeluarJml,
    sahamKeluarNominal,
    modalSemulaNominal,
    modalSemulaSaham,
    modalMenjadiNominal,
    modalMenjadiSaham,
    pmList
  };
}

function joinParts(parts) {
  return parts.map(p => (p || '').trim()).filter(Boolean).join(', ');
}

/**
 * Menyusun seluruh baris isi akta (terformat 53 karakter per baris + garis '---')
 */
export function buildDeedContentLines(data, maxChars = 53) {
  const lines = [];
  const tipe = (data?.badanUsaha && data.badanUsaha.tipe) || 'PT';
  const entitasNama = (data?.pt?.nama || `USAHA ${tipe}`).toUpperCase();
  const entitasKedudukan = (data?.pt?.kedudukan || 'KABUPATEN').toUpperCase();
  // Parsing data notaris: nama lengkap (tanpa gelar), gelar komparisi (panjang/dieja), dan gelar tanda tangan (singkat)
  const rawNotarisNama = (data?.notaris?.nama || 'GRENDI JAYA DARMAWAN').trim();
  const notarisNamaClean = (rawNotarisNama.includes(',') ? rawNotarisNama.split(',')[0].trim() : rawNotarisNama).toUpperCase();
  const notarisGelarPanjang = (data?.notaris?.gelarPanjang && data.notaris.gelarPanjang.trim())
    ? data.notaris.gelarPanjang.trim()
    : 'Sarjana Hukum, Magister Kenotariatan';
  const notarisGelarSingkat = (data?.notaris?.gelarSingkat && data.notaris.gelarSingkat.trim())
    ? data.notaris.gelarSingkat.trim()
    : (rawNotarisNama.includes(',') ? rawNotarisNama.substring(rawNotarisNama.indexOf(',') + 1).trim() : 'S.H., M.Kn.');
  const notarisWilayah = (data?.notaris?.wilayah && data.notaris.wilayah.trim()) ? data.notaris.wilayah.trim() : 'Kabupaten Kudus';
  const notarisWilayahKap = notarisWilayah.toUpperCase();

  const tglAktaStr = (data?.akta?.tanggal && data.akta.tanggal.trim()) ? formatTanggalAkta(data.akta.tanggal) : '....................';
  const jamAktaStr = (data?.akta?.jam && data.akta.jam.trim()) ? formatJamAkta(data.akta.jam) : '....................';

  const subTipe = resolveSubTipe(data, 'SIRKULER_PENGURUS');

  let judulBaris1 = 'AKTA PERNYATAAN KEPUTUSAN SIRKULER';
  let judulBaris2 = 'PARA PEMEGANG SAHAM PERSEROAN TERBATAS';
  let sebutanEntitas = 'perseroan terbatas';
  let sebutanEntitasKap = 'Perseroan';
  let labelPemberiKuasa = 'Para Pemegang Saham Perseroan';
  let labelSirkuler = 'Pemegang Saham';
  let labelOrganLama = 'seluruh anggota Direksi dan Dewan Komisaris Perseroan';
  let labelOrganBaru = 'susunan Direksi dan Dewan Komisaris Perseroan';

  if (tipe === 'PT' && subTipe === 'RUPS_MODAL') {
    judulBaris1 = 'AKTA PERNYATAAN KEPUTUSAN';
    judulBaris2 = 'RAPAT UMUM PEMEGANG SAHAM LUAR BIASA\nPERSEROAN TERBATAS';
  } else if (tipe === 'CV') {
    judulBaris1 = 'AKTA PERNYATAAN KEPUTUSAN PARA PESERO';
    judulBaris2 = 'PERSEKUTUAN KOMANDITER';
    sebutanEntitas = 'persekutuan komanditer';
    sebutanEntitasKap = 'Persekutuan';
    labelPemberiKuasa = 'Para Pesero Persekutuan';
    labelSirkuler = 'Para Pesero';
    labelOrganLama = 'susunan Persero Pengurus dan Persero Komanditer lama';
    labelOrganBaru = 'susunan Persero Pengurus dan Persero Komanditer baru';
  } else if (tipe === 'FIRMA') {
    judulBaris1 = 'AKTA PERNYATAAN KEPUTUSAN PARA PESERO';
    judulBaris2 = 'FIRMA';
    sebutanEntitas = 'firma';
    sebutanEntitasKap = 'Firma';
    labelPemberiKuasa = 'Para Pesero Firma';
    labelSirkuler = 'Para Pesero';
    labelOrganLama = 'susunan Pesero Pengurus dan Pesero Firma lama';
    labelOrganBaru = 'susunan Pesero Pengurus dan Pesero Firma baru';
  } else if (tipe === 'UD') {
    judulBaris1 = 'AKTA PERNYATAAN KEPUTUSAN PEMILIK';
    judulBaris2 = 'PERUSAHAAN PERORANGAN / USAHA DAGANG';
    sebutanEntitas = 'usaha dagang';
    sebutanEntitasKap = 'Usaha Dagang';
    labelPemberiKuasa = 'Pemilik Usaha';
    labelSirkuler = 'Pemilik Usaha';
    labelOrganLama = 'pengurusan dan pengelolaan usaha sebelumnya';
    labelOrganBaru = 'susunan kepemilikan dan kuasa pengelola Usaha Dagang';
  }

  const addCenterBlock = (rawText, opts = {}) => {
    if (!rawText) return;
    const clean = rawText.trim();
    if (clean.length <= maxChars) {
      lines.push({ text: clean, align: 'center', bold: opts.bold !== undefined ? opts.bold : true, underline: !!opts.underline });
    } else {
      const words = clean.split(' ');
      let cur = [];
      let curLen = 0;
      for (const w of words) {
        const nextLen = curLen === 0 ? w.length : curLen + 1 + w.length;
        if (nextLen <= maxChars) {
          cur.push(w);
          curLen = nextLen;
        } else {
          if (cur.length > 0) {
            lines.push({ text: cur.join(' '), align: 'center', bold: opts.bold !== undefined ? opts.bold : true, underline: !!opts.underline });
          }
          cur = [w];
          curLen = w.length;
        }
      }
      if (cur.length > 0) {
        lines.push({ text: cur.join(' '), align: 'center', bold: opts.bold !== undefined ? opts.bold : true, underline: !!opts.underline });
      }
    }
  };

  const appendBlock = (rawText) => {
    const formatted = formatTextToNotaryLines(rawText, maxChars);
    formatted.forEach(l => {
      lines.push({ text: l, align: 'left', bold: false });
    });
  };

  const appendCustomSectionOrFallback = (secNum, fallbackFn) => {
    if (data.customTemplates && data.customTemplates[`section${secNum}`]) {
      const substituted = substitutePlaceholders(data.customTemplates[`section${secNum}`], data, secNum, false);
      const sLines = renderTemplateTextToLines(substituted, maxChars, formatTextToNotaryLines);
      sLines.forEach(l => lines.push(l));
    } else {
      fallbackFn();
    }
  };

  // 1. Judul & Kepala Akta (Center, Bold) & Komparisi Waktu & Notaris
  appendCustomSectionOrFallback(1, () => {
    if (tipe === 'PT' && subTipe === 'RUPS_MODAL') {
      addCenterBlock('AKTA PERNYATAAN KEPUTUSAN');
      addCenterBlock('RAPAT UMUM PEMEGANG SAHAM LUAR BIASA');
      addCenterBlock(`PERSEROAN TERBATAS "${entitasNama}"`);
      addCenterBlock(`BERKEDUDUKAN DI - ${entitasKedudukan}`);
      addCenterBlock(`Nomor : ${data?.akta?.nomor || '4'} .-`);
    } else {
      addCenterBlock(judulBaris1);
      addCenterBlock(judulBaris2);
      addCenterBlock(`“${entitasNama}”`);
      addCenterBlock(`BERKEDUDUKAN DI – ${entitasKedudukan}`);
      addCenterBlock(`Nomor : ${data?.akta?.nomor || '1'} .-`);
    }
    appendBlock(`- Pada hari ini, ${tglAktaStr}, ${jamAktaStr};`);
    appendBlock(`- Berhadapan dengan saya, ${notarisNamaClean}, ${notarisGelarPanjang}, Notaris di ${notarisWilayah}, dengan dihadiri saksi-saksi, yang nama-namanya akan disebut pada bagian akhir akta ini:`);
  });

  // 3. Data Penghadap (Sesuai Pasal 38 UUJN & Contoh Original, langsung setelah Notaris)
  appendCustomSectionOrFallback(3, () => {
    const pSapaan = data?.penghadap?.sapaan || 'Tuan';
    const pNama = data?.penghadap?.nama || '..............................';
    const pTempat = data?.penghadap?.tempatLahir || '..........';
    const pTgl = (data?.penghadap?.tanggalLahir && data.penghadap.tanggalLahir.trim()) ? formatTanggalBiasa(data.penghadap.tanggalLahir) : '....................';
    const pWn = data?.penghadap?.kewarganegaraan || 'Indonesia';
    const pPek = data?.penghadap?.pekerjaan || 'Karyawan Swasta';
    const pAlamat = data?.penghadap?.alamat || '..................................................';
    const pNik = data?.penghadap?.nik || '................';
    appendBlock(`- ${pSapaan}. ${pNama}, lahir di ${pTempat}, pada ${pTgl}, Warga Negara ${pWn}, ${pPek}, bertempat tinggal di ${pAlamat}, pemegang Kartu Tanda Penduduk nomor: ${pNik};`);
    if (tipe === 'PT' && subTipe === 'RUPS_MODAL') {
      appendBlock(`- Untuk keperluan dalam akta ini sementara waktu berada di ${notarisWilayah.replace(/Kabupaten|Kota/i, '').trim() || 'Kudus'};`);
    }
  });

  // 2. Riwayat Perusahaan & Legalitas (Komparasi mewakili perseroan + Riwayat Pendirian & Perubahan)
  const skPendirianLabel = tipe === 'PT' ? 'Pengesahan Pendirian Badan Hukum Perseroan Terbatas dari Menteri Hukum dan Hak Asasi Manusia Republik Indonesia, satu dan lain sebagaimana ternyata dari Surat Keputusan Menteri Hukum dan Hak Asasi Manusia Republik Indonesia' : (tipe === 'UD' ? 'NIB / OSS' : 'Kemenkumham RI (SABU) / Pengadilan');
  const skPerubahanLabel = tipe === 'PT' ? 'persetujuan dari Menteri Hukum Republik Indonesia berupa Surat Keputusan Menteri Hukum Republik Indonesia' : (tipe === 'UD' ? 'Pembaruan NIB / Izin Usaha' : 'Kemenkumham RI (SABU)');

  const notarisPerubStr = (data?.pt?.aktaPerubahanNotaris || '').trim();
  const notarisPerubFormat = notarisPerubStr.toLowerCase().startsWith('saya')
    ? `${notarisPerubStr},`
    : `${notarisPerubStr}, Notaris di ${data?.pt?.aktaPerubahanWilayah || '..........'},`;

  const notarisPendStr = (data?.pt?.aktaPendirianNotaris || '').trim();
  const notarisPendFormat = notarisPendStr.toLowerCase().startsWith('saya')
    ? `${notarisPendStr},`
    : `${notarisPendStr}, Notaris di ${data?.pt?.aktaPendirianWilayah || '..........'},`;

  appendCustomSectionOrFallback(2, () => {
    const tglPend = (data?.pt?.aktaPendirianTgl && data.pt.aktaPendirianTgl.trim()) ? formatTanggalTanpaAwalan(data.pt.aktaPendirianTgl) : '..........';
    const noPend = data?.pt?.aktaPendirianNomor || '..........';
    const tglSkPend = (data?.pt?.skPendirianTgl && data.pt.skPendirianTgl.trim()) ? formatTanggalTanpaAwalan(data.pt.skPendirianTgl) : '..........';
    const noSkPend = data?.pt?.skPendirianNomor || '..........';
    const tglPerub = (data?.pt?.aktaPerubahanTgl && data.pt.aktaPerubahanTgl.trim()) ? formatTanggalTanpaAwalan(data.pt.aktaPerubahanTgl) : '..........';
    const noPerub = data?.pt?.aktaPerubahanNomor || '..........';
    const tglSkPerub = (data?.pt?.skPerubahanTgl && data.pt.skPerubahanTgl.trim()) ? formatTanggalTanpaAwalan(data.pt.skPerubahanTgl) : '..........';
    const noSkPerub = data?.pt?.skPerubahanNomor || '..........';
    const noPemberitahuan = data?.pt?.pemberitahuanPerubahanNomor || '-';

    if (tipe === 'PT' && (subTipe === 'SIRKULER_MODAL' || subTipe === 'RUPS_MODAL')) {
      const jabatanPenghadap = data?.penghadap?.jabatan || (subTipe === 'SIRKULER_MODAL' ? 'Direktur Utama' : 'Direktur');
      appendBlock(`- Menurut keterangannya, penghadap dalam hal ini bertindak dalam jabatannya selaku ${jabatanPenghadap}, dari dan selaku demikian untuk dan atas nama perseroan terbatas ${entitasNama}, berkedudukan di ${entitasKedudukan} (selanjutnya akan disebut juga “${sebutanEntitasKap}”), yang Anggaran Dasarnya didirikan dengan Akta Pendirian tertanggal ${tglPend}, Nomor. ${noPend}, yang dibuat dihadapan ${notarisPendFormat} akta mana telah mendapatkan ${skPendirianLabel} pada tanggal ${tglSkPend}, Nomor. ${noSkPend}, Akta mana telah mengalami perubahan sebagaimana ternyata melalui Akta tertanggal ${tglPerub}, Nomor. ${noPerub}, yang dibuat dihadapan ${notarisPerubFormat} akta mana telah mendapatkan ${skPerubahanLabel} tertanggal ${tglSkPerub}, Nomor. ${noSkPerub} dan Penerimaan Pemberitahuan Perubahan Anggaran Dasar Kementerian Hukum Republik Indonesia tertanggal ${tglSkPerub}, Nomor. ${noPemberitahuan};`);
    } else {
      const jabatanPenghadap = data?.penghadap?.jabatan || (tipe === 'PT' ? 'Direktur' : (tipe === 'UD' ? 'Pemilik' : 'Persero Pengurus'));
      const notarisPendDahulu = data?.pt?.aktaPendirianNotaris || '..........';
      const wilayahPendDahulu = data?.pt?.aktaPendirianWilayah || '..........';
      const riwayatText = `- menurut keterangannya, penghadap dalam hal ini bertindak dalam jabatannya selaku ${jabatanPenghadap}, untuk dan oleh karenanya secara sah mewakili ${sebutanEntitas} “${entitasNama}”, berkedudukan di ${entitasKedudukan} (selanjutnya akan disebut juga “${sebutanEntitasKap}”), yang Anggaran Dasarnya didirikan dengan Akta Pendirian tertanggal ${tglPend}, Nomor. ${noPend}, yang dibuat dihadapan ${notarisPendDahulu}, dahulu Notaris di ${wilayahPendDahulu}, akta mana telah mendapatkan ${skPendirianLabel} pada tanggal ${tglSkPend}, Nomor. ${noSkPend}, akta mana telah beberapa kali mengalami perubahan, yang terakhir melalui Akta tertanggal ${tglPerub}, Nomor. ${noPerub}, yang dibuat dihadapan ${notarisPerubFormat} akta mana telah mendapatkan ${skPerubahanLabel} tertanggal ${tglSkPerub}, Nomor. ${noSkPerub} dan telah diberitahukan kepada Menteri Hukum dan Hak Asasi Manusia Republik Indonesia, sebagaimana bukti penerimaan pemberitahuannya ternyata dari Penerimaan Pemberitahuan Perubahan Anggaran Dasar Kementerian Hukum dan Hak Asasi Manusia Republik – Indonesia tertanggal ${tglSkPerub}, Nomor. ${noPemberitahuan};`;
      appendBlock(riwayatText);
    }
  });

  // 4. Modal & Dokumen Sirkuler / RUPS
  appendCustomSectionOrFallback(4, () => {
    appendBlock(`- Penghadap bertindak dalam kedudukannya tersebut diatas dengan ini menerangkan :`);

    if (tipe === 'PT' && subTipe === 'RUPS_MODAL') {
      const mf = resolveModalFields(data, true);
      const tglRupsStr = formatTanggalAkta(data.rups?.tanggal || '2024-11-22');
      const jamRupsStr = data.rups?.jam || '08.00 WIB';
      const tempatRupsStr = data.rups?.tempat || 'Kantor Perseroan';
      const kuorumSaham = Number(data.rups?.sahamHadir || mf.modalSemulaSaham);
      const strKuorum = formatSaham(kuorumSaham);
      const pengambilText = joinParts([
        data.peningkatanModal?.pengambilNama || 'perseroan terbatas PT. CIPTA PERSADA INDONESIA',
        data.peningkatanModal?.pengambilKedudukan ? `berkedudukan di ${data.peningkatanModal.pengambilKedudukan}` : '',
        data.peningkatanModal?.pengambilAktaPendirian,
        data.peningkatanModal?.pengambilAktaPerubahan
      ]);
      const pelepasText = joinParts([
        data.peningkatanModal?.pelepasanNama || 'perseroan terbatas PT. HARUM SEMERBAK',
        `berkedudukan di ${data.peningkatanModal?.pelepasanKedudukan || 'Kabupaten Kudus'}`,
        data.peningkatanModal?.pelepasanLegalitas
      ]);

      appendBlock(`- Bahwa pada hari ${tglRupsStr}, pukul ${jamRupsStr}, dengan mengambil tempat di ${tempatRupsStr}, telah diadakan Rapat Umum Pemegang Saham (RUPS) Luar Biasa perseroan terbatas ${entitasNama}, berkedudukan di ${entitasKedudukan}.`);
      appendBlock(`Acara Rapat Umum Pemegang Saham :`);
      appendBlock(`1. Pengeluaran ${formatSaham(mf.sahamKeluarJml)} lembar saham dalam simpanan atau senilai ${formatRupiah(mf.sahamKeluarNominal)};`);
      appendBlock(`2. Peningkatan Modal Disetor semula ${formatRupiah(mf.modalSemulaNominal)} menjadi ${formatRupiah(mf.modalMenjadiNominal)};`);
      appendBlock(`- Bahwa dalam rapat tersebut telah hadir dan/atau diwakili sejumlah ${strKuorum} saham yang merupakan keseluruhan saham yang telah dikeluarkan oleh Perseroan;`);
      appendBlock(`- Bahwa surat-surat saham yang diwakili sampai sekarang belum dicetak, namun demikian penghadap menjamin keadaannya baik jumlah dan kepemilikan saham sesuai dengan keadaan yang sebenarnya;`);
      appendBlock(`- Bahwa dalam rapat tersebut penghadap ${data?.penghadap?.sapaan || 'Tuan'}. ${data?.penghadap?.nama || '....................'} bertindak selaku Pimpinan Rapat;`);
      appendBlock(`- Bahwa hal-hal yang dibicarakan serta diputuskan dalam rapat tersebut telah dibuatkan Berita Acara Rapat di bawah tangan bermeterai cukup dan dilekatkan pada minuta akta ini;`);
      appendBlock(`- Bahwa berdasarkan kuasa yang diberikan dalam Rapat tersebut, penghadap diberi hak dan wewenang untuk menyatakan keputusan rapat dalam suatu akta Notaris;`);
      appendBlock(`- Berdasarkan apa yang diuraikan diatas, penghadap menyatakan Rapat Umum Pemegang Saham Luar Biasa dengan suara bulat telah memutuskan:`);
      appendBlock(`1) MENYETUJUI, pengeluaran ${formatSaham(mf.sahamKeluarJml)} saham dalam simpanan atau senilai ${formatRupiah(mf.sahamKeluarNominal)} yang diambil bagian dan disetor penuh oleh ${pengambilText}, sedangkan pemegang saham lainnya, yaitu ${pelepasText}, menyatakan tidak ikut mengambil bagian atas saham-saham yang dikeluarkan oleh Perseroan, serta mengesampingkan segala hak yang dimilikinya termasuk dan tidak terbatas pada hak untuk mendapatkan penawaran terlebih dahulu (pre-emptive rights);`);
      appendBlock(`2) MENYETUJUI, peningkatan Modal Ditempatkan dan Disetor semula ${formatRupiah(mf.modalSemulaNominal)} menjadi ${formatRupiah(mf.modalMenjadiNominal)};`);
      appendBlock(`- Sehingga susunan kepemilikan saham perseroan terbatas ${entitasNama}, tersebut diatas adalah sebagai berikut :`);
    } else if (tipe === 'PT' && subTipe === 'SIRKULER_MODAL') {
      const mf = resolveModalFields(data, false);
      const pengambilText = joinParts([
        data?.peningkatanModal?.pengambilNama || 'perseroan terbatas PT. JAYA ABADI SELALU',
        data?.peningkatanModal?.pengambilKedudukan ? `berkedudukan di ${data.peningkatanModal.pengambilKedudukan}` : '',
        data?.peningkatanModal?.pengambilAktaPendirian,
        data?.peningkatanModal?.pengambilAktaPerubahan
      ]);
      const pelepasText = joinParts([
        data?.peningkatanModal?.pelepasanNama || 'perseroan terbatas PT. PELITA JAYA SELALU',
        `berkedudukan di ${data?.peningkatanModal?.pelepasanKedudukan || 'Kabupaten Kudus'}`,
        data?.peningkatanModal?.pelepasanLegalitas
      ]);

      appendBlock(`- Bahwa para pemegang saham Perseroan telah mengambil keputusan sebagaimana ternyata dari –`);
      lines.push({ text: '----- KEPUTUSAN SIRKULER PARA PEMEGANG SAHAM -----', align: 'center', bold: true });
      appendBlock(`perseroan terbatas ${entitasNama} yang dibuat secara dibawah tangan, ditandatangani oleh para pemegang saham Perseroan dan telah dibubuhi materai cukup dan dilekatkan pada minuta akta ini;`);
      const totalSahamAwal = Number(mf.modalSemulaSaham || data?.saham?.totalSeriA || 353201);
      appendBlock(`- Bahwa Keputusan Sirkuler Pemegang Saham tersebut telah ditandatangani sebagai bentuk persetujuan oleh seluruh pemegang saham dengan jumlah ${formatSaham(totalSahamAwal)} lembar saham, jumlah mana merupakan keseluruhan saham yang telah dikeluarkan dan diambil bagian oleh para pemegang saham dalam perseroan;`);
      appendBlock(`- Bahwa surat-surat saham yang diwakili sampai sekarang belum dicetak, namun demikian penghadap menjamin keadaannya baik jumlah dan kepemilikan saham sesuai dengan keadaan yang sebenarnya;`);
      appendBlock(`- Bahwa Keputusan Sirkuler Para Pemegang Saham tersebut adalah harus dianggap sama dengan keputusan yang diambil dalam setiap rapat umum pemegang saham Perseroan berdasarkan Pasal ${data?.pt?.pasalSirkuler || '10 ayat (5)'} dan oleh karenanya sah serta mengikat sesuai dengan ketentuan yang termaktub dalam Anggaran Dasar Perseroan;`);
      appendBlock(`- Bahwa penghadap ${data?.penghadap?.sapaan || 'Tuan'}. ${data?.penghadap?.nama || '....................'} yang bertindak dalam kedudukannya sebagaimana diatas dan dengan mempergunakan kekuatan kuasa yang diberikan oleh Para Pemegang Saham Perseroan berdasarkan Keputusan Sirkuler Pemegang Saham sekarang hendak menyatakan Keputusan Sirkuler Pemegang Saham tersebut dalam suatu akta Notaris.`);
      appendBlock(`- Berdasarkan dengan apa yang telah diuraikan diatas, penghadap menyatakan para pemegang saham Perseroan telah mengambil keputusan sebagai berikut:`);
      appendBlock(`1) MENYETUJUI, Pengeluaran ${formatSaham(mf.sahamKeluarJml)} saham simpanan atau senilai ${formatRupiah(mf.sahamKeluarNominal)} yang diambil bagian dan disetor penuh oleh ${pengambilText}, sedangkan pemegang saham lainnya, yaitu ${pelepasText}, menyatakan tidak ikut mengambil bagian atas saham-saham yang dikeluarkan oleh Perseroan, serta mengesampingkan segala hak yang dimilikinya termasuk dan tidak terbatas pada hak untuk mendapatkan penawaran terlebih dahulu (pre-emptive rights);`);
      appendBlock(`2) MENYETUJUI, Meningkatkan Modal Ditempatkan dan Disetor Perseroan semula ${formatRupiah(mf.modalSemulaNominal)} menjadi ${formatRupiah(mf.modalMenjadiNominal)};`);
      appendBlock(`- Sehingga susunan kepemilikan saham perseroan terbatas ${entitasNama} adalah sebagai berikut:`);
    } else {
      appendBlock(`- Bahwa ${tipe === 'PT' ? 'para pemegang saham' : (tipe === 'UD' ? 'pemilik usaha' : 'para pesero')} ${sebutanEntitasKap} telah mengambil keputusan sebagaimana ternyata dari –`);

      const rawJudulSirkuler = `KEPUTUSAN SIRKULER ${tipe === 'PT' ? 'PARA PEMEGANG SAHAM' : (tipe === 'UD' ? 'PEMILIK USAHA' : 'PARA PESERO')}`;
      if (rawJudulSirkuler.length + 8 <= maxChars) {
        const diff = maxChars - rawJudulSirkuler.length - 2;
        const leftDashes = Math.floor(diff / 2);
        const rightDashes = diff - leftDashes;
        lines.push({ text: '-'.repeat(leftDashes) + ' ' + rawJudulSirkuler + ' ' + '-'.repeat(rightDashes), align: 'center', bold: true });
      } else {
        addCenterBlock(rawJudulSirkuler);
      }

      appendBlock(`${sebutanEntitas} “${entitasNama}” yang dibuat secara dibawah tangan, ditandatangani oleh ${labelPemberiKuasa} dan telah dibubuhi materai cukup dan dilekatkan pada minuta akta ini selanjutnya akan disebut juga “Keputusan Sirkuler ${labelSirkuler}”;`);

      if (tipe === 'PT') {
        appendBlock(`- Bahwa Keputusan Sirkuler Pemegang Saham tersebut telah ditandatangani sebagai bentuk persetujuan oleh seluruh pemegang saham dengan jumlah ${formatSaham(data?.saham?.totalSeriA || 0)} saham seri-A dan ${formatSaham(data?.saham?.totalSeriB || 0)} saham seri-B, jumlah mana merupakan keseluruhan saham yang telah dikeluarkan dan diambil bagian oleh para pemegang saham dalam perseroan;`);
        appendBlock(`- Bahwa surat-surat saham yang diwakili sampai sekarang belum dicetak, namun demikian penghadap menjamin keadaannya baik jumlah dan kepemilikan saham sesuai dengan keadaan yang sebenarnya;`);
        appendBlock(`- Bahwa Keputusan Sirkuler Para Pemegang Saham tersebut adalah harus dianggap sama dengan keputusan yang diambil dalam setiap rapat umum pemegang saham Perseroan berdasarkan Pasal ${data?.pt?.pasalSirkuler || '10 ayat (5)'} Anggaran Dasar Perseroan. Oleh karena itu, seluruh keputusan yang diambil dalam Keputusan Sirkuler ini adalah sah dan mengikat;`);
      } else {
        const totalModalStr = formatRupiah(data?.modal ? data.modal.totalNominal : 0);
        appendBlock(`- Bahwa modal yang ditempatkan dan disetor penuh dalam ${sebutanEntitas} ini adalah sebesar ${totalModalStr}, yang terbagi ke dalam bagian-bagian modal (inbreng) para pesero/pemilik secara sah;`);
        appendBlock(`- Bahwa keputusan ini adalah sah, mengikat, dan memiliki kekuatan hukum yang sempurna berdasarkan ketentuan Anggaran Dasar dan peraturan perundang-undangan yang berlaku di Republik Indonesia;`);
      }

      appendBlock(`- Bahwa penghadap ${data?.penghadap?.sapaan || 'Tuan'}. ${data?.penghadap?.nama || '....................'}, yang bertindak dalam kedudukannya sebagaimana diatas, dan dengan mempergunakan kekuatan kuasa yang diberikan oleh ${labelPemberiKuasa} berdasarkan Keputusan Sirkuler ${labelSirkuler} sekarang hendak menyatakan Keputusan Sirkuler ${labelSirkuler} tersebut dalam suatu akta Notaris.`);
      appendBlock(`- Berdasarkan dengan apa yang telah diuraikan diatas, penghadap ${data?.penghadap?.sapaan || 'Tuan'}. ${data?.penghadap?.nama || '....................'}, menyatakan ${labelPemberiKuasa} telah mengambil keputusan sebagai berikut:`);
    }
  });

  // 5. Susunan Pengurus Baru ATAU Perubahan Pasal 4 Anggaran Dasar (Peningkatan Modal)
  appendCustomSectionOrFallback(5, () => {
    if (tipe === 'PT' && (subTipe === 'SIRKULER_MODAL' || subTipe === 'RUPS_MODAL')) {
      const isRups = subTipe === 'RUPS_MODAL';
      const mf = resolveModalFields(data, isRups);
      const pmList = mf.pmList;

      // Daftar rincian susunan pemegang saham baru
      pmList.forEach((ps, idx) => {
        const pLabel = `${String.fromCharCode(97 + idx)}. `;
        const rawPsNama = ps.nama ? (ps.nama.toLowerCase().startsWith('perseroan') ? ps.nama : `perseroan terbatas ${ps.nama}`) : 'perseroan terbatas ....................';
        appendBlock(`${pLabel}${rawPsNama}, tersebut diatas sebanyak ${formatSaham(ps.jumlahSaham)} saham atau senilai ${formatRupiah(ps.nominal)};`);
      });

      const totalSahamSemua = mf.modalMenjadiSaham;
      const totalNominalSemua = mf.modalMenjadiNominal;
      if (totalSahamSemua > 0 && totalNominalSemua > 0) {
        appendBlock(`- Sehingga total seluruhnya adalah sebanyak ${formatSaham(totalSahamSemua)} saham atau senilai ${formatRupiah(totalNominalSemua)};`);
      }

      appendBlock(`- Dengan demikian mengubah Pasal 4 ayat (2) Anggaran Dasar perseroan, sehingga untuk selanjutnya tertulis dan berbunyi sebagai berikut:`);
      lines.push({ text: '------------------- M O D A L -------------------', align: 'center', bold: true });
      lines.push({ text: '-------------------- Pasal 4 --------------------', align: 'center', bold: true });
      appendBlock(`2. Dari Modal Dasar tersebut telah ditempatkan dan disetor sebagian, sebanyak ${formatSaham(totalSahamSemua)} saham dengan nilai nominal seluruhnya sebesar ${formatRupiah(totalNominalSemua)} oleh para pemegang saham yang telah mengambil bagian saham dengan rincian serta nilai nominal saham yang akan disebutkan pada akhir akta ini.`);
      appendBlock(`- Bahwa dengan adanya peningkatan modal pada keputusan ini, dan bertalian dengan Modal Ditempatkan dan Modal Disetor sebagaimana dimaksud dalam pasal 4 ayat (2), maka bagian akhir Anggaran Dasar Perseroan menjadi berbunyi sebagai berikut:`);
      appendBlock(`- Modal ditempatkan sebagaimana dimaksud dalam Pasal 4 ayat (2) telah disetor penuh dengan uang tunai melalui kas perseroan oleh para pemegang saham:`);

      // Rincian Penyetoran Saham format Kolom Notaris
      pmList.forEach((ps, idx) => {
        const psNum = `${idx + 1}. `;
        const rawPsNama = ps.nama ? (ps.nama.toLowerCase().startsWith('perseroan') ? ps.nama : `perseroan terbatas ${ps.nama}`) : 'perseroan terbatas ....................';
        appendBlock(`${psNum}${rawPsNama}, tersebut diatas, sebanyak ${formatSaham(ps.jumlahSaham)} saham, dengan nilai nominal ${formatRupiah(ps.nominalPerSaham)} per saham, atau seluruhnya sebesar ${formatRupiah(ps.nominal)};`);
      });

      if (totalSahamSemua > 0 && totalNominalSemua > 0) {
        appendBlock(`- Sehingga seluruhnya berjumlah ${formatSaham(totalSahamSemua)} saham dengan nilai nominal seluruhnya sebesar ${formatRupiah(totalNominalSemua)};`);
      }

      const docTglStr = (isRups && data?.rups?.tanggal)
        ? formatTanggalBiasa(data.rups.tanggal)
        : ((data?.akta?.tanggal && data.akta.tanggal.trim()) ? formatTanggalBiasa(data.akta.tanggal) : '....................');
      const kotaTtd = notarisWilayah.replace(/Kabupaten|Kota/i, '').trim() || 'Kudus';

      const ttdList = (Array.isArray(data?.pemegangSaham) && data.pemegangSaham.length > 0)
        ? data.pemegangSaham
        : pmList.map(ps => ({ nama: ps.nama, selaku: `Pemegang ${ps.jumlahSaham.toLocaleString('id-ID')} saham Perseroan` }));

      if (isRups) {
        appendBlock(`- Demikian Berita Acara Rapat Umum Pemegang Saham ini, disahkan dan ditandatangani oleh Para Pemegang Saham sebagai bentuk persetujuan;`);
        appendBlock(`${kotaTtd}, ${docTglStr}`);
        appendBlock(`Para Pemegang Saham Perseroan`);
        appendBlock(`materai sepuluh ribu rupiah`);
        appendBlock(`tanda tangan tidak terbaca`);
        appendBlock(`${data?.penghadap?.sapaan || 'Tuan'}. ${data?.penghadap?.nama || '....................'}`);
        appendBlock(`Pimpinan Rapat;`);
      } else {
        appendBlock(`- Demikian Keputusan Sirkuler Para Pemegang Saham ini, disahkan dan ditandatangani oleh Para Pemegang Saham sebagai bentuk persetujuan;`);
        appendBlock(`${kotaTtd}, ${docTglStr}`);
        appendBlock(`Para Pemegang Saham Perseroan`);
        appendBlock(`materai sepuluh ribu rupiah`);
        appendBlock(`tanda tangan tidak terbaca`);
      }
      ttdList.forEach(ps => {
        appendBlock(ps.nama);
        appendBlock(`${ps.selaku || 'Pemegang Saham Perseroan'};`);
      });
    } else {
      appendBlock(`1) MENYETUJUI, untuk memberhentikan dengan hormat ${labelOrganLama} terhitung sejak tanggal Keputusan Sirkuler ini berlaku efektif dan memberikan pengesahan atas tindakan kepengurusan dan pengawasan ${labelOrganLama} dalam melakukan tindakan hukum atas nama ${sebutanEntitasKap}, sepanjang tindakan-tindakan hukum dimaksud sesuai/tidak menyimpang dari ketentuan dalam Anggaran Dasar ${sebutanEntitasKap} dan tercermin dalam laporan keuangan tahunan ${sebutanEntitasKap}, berikut dengan memberikan pelepasan dan pelunasan (Acquit et Decharge) sepenuhnya atas pelaksanaan pengurusan dan pengawasan yang telah dijalankan; Mengubah susunan ${tipe === 'PT' ? 'Direksi dan Dewan Komisaris yang' : labelOrganBaru} baru sejak tanggal efektif keputusan ini sampai dengan ${data?.keputusan?.masaJabatan || '5 (lima)'} tahun mendatang, sehingga ${labelOrganBaru} menjadi sebagai berikut:`);

      if (Array.isArray(data?.pengurusBaru)) {
        data.pengurusBaru.forEach(pejabat => {
          const rawTitle = (pejabat.jabatan || 'PENGURUS').toUpperCase();
          const tglLahirStr = formatTanggalBiasa(pejabat.tanggalLahir);
          const rawOfficerRight = `${pejabat.sapaan || 'Tuan'}. ${pejabat.nama}, lahir di ${pejabat.tempatLahir}, pada ${tglLahirStr}, Warga Negara ${pejabat.kewarganegaraan || 'Indonesia'}, ${pejabat.pekerjaan || 'Karyawan Swasta'}, bertempat tinggal di ${pejabat.alamat}, pemegang Kartu Tanda Penduduk nomor: ${pejabat.nik};`;

          if (rawTitle.length <= 18) {
            const col1Width = 25;
            const col2Width = maxChars - col1Width;
            const jabatanLabel = `- ${rawTitle}`;
            const diff1 = col1Width - jabatanLabel.length - 3;
            const pad1 = diff1 > 0 ? ' ' + '-'.repeat(diff1 - 1) : '';
            const firstPrefix = (jabatanLabel + pad1 + ' : ').padEnd(col1Width, '-');
            const contPrefix = '-'.repeat(col1Width - 1) + ' ';

            const rightLines = formatTextToNotaryLines(rawOfficerRight, col2Width);
            rightLines.forEach((rLine, rIdx) => {
              const prefix = rIdx === 0 ? firstPrefix : contPrefix;
              lines.push({ text: prefix + rLine, align: 'left', bold: false });
            });
          } else {
            appendBlock(`- ${rawTitle} : ${rawOfficerRight}`);
          }
        });
      }

      appendBlock(`2) MENYETUJUI, bahwa terhitung sejak tanggal efektif pengangkatan ${tipe === 'PT' ? 'Direksi dan Dewan Komisaris tersebut diatas, kepada masing-masing Direktur dan Komisaris' : `${labelOrganBaru} tersebut diatas, kepada masing-masing pengurus`} diberikan kuasa, kewajiban, hak, dan kewenangan sesuai dengan tugas dan jabatan yang diemban menurut dan/atau berdasarkan Anggaran Dasar ${sebutanEntitasKap} maupun Undang-Undang yang berlaku dengan tanpa ada yang dikecualikan.`);

      appendBlock(`- Demikian Keputusan Sirkuler ${labelSirkuler} ini, mempunyai kekuatan hukum yang sama dengan keputusan yang diambil secara sah dalam Rapat Umum Pemegang Saham Perseroan;`);

      appendBlock(labelPemberiKuasa);
      appendBlock('materai sepuluh ribu rupiah');
      appendBlock('tanda tangan tidak terbaca');

      if (tipe === 'PT' && Array.isArray(data?.pemegangSaham)) {
        data.pemegangSaham.forEach((ps) => {
          appendBlock(ps.nama);
          const sA = Number(ps.sahamSeriA || 0);
          const sB = Number(ps.sahamSeriB || 0);
          let sahamText = '';
          if (sA > 0 && sB > 0) {
            sahamText = `selaku pemegang ${sA.toLocaleString('id-ID')} saham Seri-A Perseroan dan pemegang ${sB.toLocaleString('id-ID')} saham Seri-B Perseroan`;
          } else if (sB > 0) {
            sahamText = `selaku pemegang ${sB.toLocaleString('id-ID')} saham Seri-B Perseroan`;
          } else {
            sahamText = `selaku pemegang ${sA.toLocaleString('id-ID')} saham Seri-A Perseroan`;
          }

          const desc = ps.selaku ? `${ps.selaku} – ${sahamText}` : sahamText;
          appendBlock(desc);
          appendBlock(`Tanggal : ${ps.tanggalTtd || '-'};`);
        });
      } else if (Array.isArray(data?.sekutu)) {
        data.sekutu.forEach((sk) => {
          appendBlock(sk.nama);
          const nominalStr = formatRupiah(sk.nominalInbreng || 0);
          appendBlock(`${sk.statusSekutu || 'Sekutu'} – selaku penyetor modal inbreng sebesar ${nominalStr} (${sk.persentase || '0'}%)`);
          appendBlock(`Tanggal : ${sk.tanggalTtd || '-'};`);
        });
      }
    }
  });

  // 6. Penutup, Saksi & Legalisir Salinan
  appendCustomSectionOrFallback(6, () => {
    const pSapaan = data?.penghadap?.sapaan || 'Tuan';
    const pNama = data?.penghadap?.nama || '....................';
    appendBlock(`- Kemudian penghadap ${pSapaan}. ${pNama} dengan ini memberi kuasa kepada saya, Notaris, untuk mengajukan permohonan dan/atau memberitahukan perubahan data ${sebutanEntitasKap} tersebut kepada instansi yang berwenang dan untuk itu membuat pengubahan dan/atau tambahan dalam bentuk yang bagaimanapun juga yang diperlukan untuk memperoleh Surat Keputusan dan/atau Surat Penerimaan Pemberitahuan Perubahan Anggaran Dasar dan/atau Surat Penerimaan Pemberitahuan Perubahan Data ${sebutanEntitasKap} dan untuk mengajukan dan menandatangani semua permohonan dan dokumen lain yang mungkin diperlukan.`);
    appendBlock(`- Penghadap dengan ini menjamin akan kebenaran identitas, dan/atau asli tandatangan atas dokumen-dokumen asli yang diserahkan oleh penghadap sesuai dengan dokumen-dokumen yang disampaikan kepada saya, Notaris, dan bertanggungjawab sepenuhnya atas hal-hal tersebut dan selanjutnya penghadap juga menyatakan telah mengetahui dan memahami seluruh isi akta ini, dan apabila di kemudian hari timbul tuntutan hukum mengenai hal tersebut yang menimbulkan suatu sengketa atas hal-hal tersebut karena sebab apapun juga, maka penghadap akan membebaskan Notaris dan saksi-saksi yang menandatangani akta ini dari segala tuntutan hukum.`);
    appendBlock(`- Penghadap telah dikenal oleh saya, Notaris.`);

    lines.push({ text: '---------------- DEMIKIANLAH AKTA INI ---------------', align: 'center', bold: true });

    appendBlock(`- Dibuat dan dilangsungkan di ${notarisWilayah}, pada hari dan tanggal tersebut pada bagian awal akta ini dengan dihadiri oleh:`);
    const sk1Sapaan = data?.saksi1?.sapaan || 'Nona';
    const sk1Nama = data?.saksi1?.nama || '..............................';
    const sk1Tempat = data?.saksi1?.tempatLahir || '..........';
    const sk1Tgl = (data?.saksi1?.tanggalLahir && data.saksi1.tanggalLahir.trim()) ? formatTanggalBiasa(data.saksi1.tanggalLahir) : '....................';
    const sk1Wn = data?.saksi1?.kewarganegaraan || 'Indonesia';
    const sk1Pek = data?.saksi1?.pekerjaan || 'Karyawan Swasta';
    const sk1Alamat = data?.saksi1?.alamat || '..................................................';
    const sk1Nik = data?.saksi1?.nik || '................';

    const sk2Sapaan = data?.saksi2?.sapaan || 'Nona';
    const sk2Nama = data?.saksi2?.nama || '..............................';
    const sk2Tempat = data?.saksi2?.tempatLahir || '..........';
    const sk2Tgl = (data?.saksi2?.tanggalLahir && data.saksi2.tanggalLahir.trim()) ? formatTanggalBiasa(data.saksi2.tanggalLahir) : '....................';
    const sk2Wn = data?.saksi2?.kewarganegaraan || 'Indonesia';
    const sk2Pek = data?.saksi2?.pekerjaan || 'Karyawan Swasta';
    const sk2Alamat = data?.saksi2?.alamat || '..................................................';
    const sk2Nik = data?.saksi2?.nik || '................';

    appendBlock(`1. ${sk1Sapaan}. ${sk1Nama}, lahir di ${sk1Tempat}, pada ${sk1Tgl}, Warga Negara ${sk1Wn}, ${sk1Pek}, bertempat tinggal di ${sk1Alamat}, pemegang Kartu Tanda Penduduk nomor: ${sk1Nik};`);
    appendBlock(`2. ${sk2Sapaan}. ${sk2Nama}, lahir di ${sk2Tempat}, pada ${sk2Tgl}, Warga Negara ${sk2Wn}, ${sk2Pek}, bertempat tinggal di ${sk2Alamat}, pemegang Kartu Tanda Penduduk nomor: ${sk2Nik};`);
    appendBlock(`- Keduanya karyawan Notaris, yang Saya kenal, sebagai saksi-saksi.`);
    appendBlock(`- Segera setelah akta ini dibacakan oleh saya, Notaris kepada para penghadap dan saksi-saksi, maka akta ini ditanda tangani oleh para penghadap, saksi-saksi dan saya, Notaris, serta cap ibu jari oleh penghadap pada lembar kertas terpisah yang dilekatkan pada minuta akta ini.`);
    appendBlock(`- Dilangsungkan dengan tanpa tambahan, tanpa penggantian, dan tanpa coretan.`);
    appendBlock(`- Minuta akta ini telah ditandatangani dengan sempurna.`);

    lines.push({ text: '---- DIBERIKAN SEBAGAI SALINAN YANG SAMA BUNYINYA ---', align: 'center', bold: true });
    addCenterBlock(`NOTARIS DI - ${notarisWilayahKap}`);
    lines.push({ text: '', align: 'center', bold: false, isSignatureSpace: true });
    addCenterBlock(`(${notarisNamaClean}, ${notarisGelarSingkat})`, { underline: true });
  });

  return lines;
}

/**
 * Menyusun baris klausula khusus per bagian (Tab 1 s.d. Tab 6) untuk Live Preview Terfokus
 * Sesuai Pasal 42 UUJN: Jika kolom kosong, menampilkan tanda titik '....' sebagai penanda ruang tunggu input,
 * dan otomatis diformat 53 karakter per baris dengan penutup garis '---'.
 */
export function buildSectionDeedLines(sectionNum, data, maxChars = 53) {
  const lines = [];
  const tipe = (data.badanUsaha && data.badanUsaha.tipe) || 'PT';

  const val = (str, fallback = '....................') => {
    return (str && typeof str === 'string' && str.trim()) ? str.trim() : fallback;
  };

  const addCenter = (rawText, opts = {}) => {
    if (!rawText) return;
    const clean = rawText.trim();
    if (clean.length <= maxChars) {
      lines.push({ text: clean, align: 'center', bold: opts.bold !== undefined ? opts.bold : true, underline: !!opts.underline });
    } else {
      const words = clean.split(' ');
      let cur = [];
      let curLen = 0;
      for (const w of words) {
        const nextLen = curLen === 0 ? w.length : curLen + 1 + w.length;
        if (nextLen <= maxChars) {
          cur.push(w);
          curLen = nextLen;
        } else {
          if (cur.length > 0) {
            lines.push({ text: cur.join(' '), align: 'center', bold: opts.bold !== undefined ? opts.bold : true, underline: !!opts.underline });
          }
          cur = [w];
          curLen = w.length;
        }
      }
      if (cur.length > 0) {
        lines.push({ text: cur.join(' '), align: 'center', bold: opts.bold !== undefined ? opts.bold : true, underline: !!opts.underline });
      }
    }
  };

  const appendBlock = (rawText) => {
    const formatted = formatTextToNotaryLines(rawText, maxChars);
    formatted.forEach(l => {
      lines.push({ text: l, align: 'left', bold: false });
    });
  };

  const subTipe = resolveSubTipe(data, 'SIRKULER_PENGURUS');

  let judulBaris1 = 'AKTA PERNYATAAN KEPUTUSAN SIRKULER';
  let judulBaris2 = 'PARA PEMEGANG SAHAM PERSEROAN TERBATAS';
  let sebutanEntitas = 'perseroan terbatas';
  let sebutanEntitasKap = 'Perseroan';
  let labelPemberiKuasa = 'Para Pemegang Saham Perseroan';
  let labelSirkuler = 'Pemegang Saham';
  let labelOrganLama = 'seluruh anggota Direksi dan Dewan Komisaris Perseroan';
  let labelOrganBaru = 'susunan Direksi dan Dewan Komisaris Perseroan';

  if (tipe === 'PT' && subTipe === 'RUPS_MODAL') {
    judulBaris1 = 'AKTA PERNYATAAN KEPUTUSAN';
    judulBaris2 = 'RAPAT UMUM PEMEGANG SAHAM LUAR BIASA\nPERSEROAN TERBATAS';
  } else if (tipe === 'CV') {
    judulBaris1 = 'AKTA PERNYATAAN KEPUTUSAN PARA PESERO';
    judulBaris2 = 'PERSEKUTUAN KOMANDITER';
    sebutanEntitas = 'persekutuan komanditer';
    sebutanEntitasKap = 'Persekutuan';
    labelPemberiKuasa = 'Para Pesero Persekutuan';
    labelSirkuler = 'Para Pesero';
    labelOrganLama = 'susunan Persero Pengurus dan Persero Komanditer lama';
    labelOrganBaru = 'susunan Persero Pengurus dan Persero Komanditer baru';
  } else if (tipe === 'FIRMA') {
    judulBaris1 = 'AKTA PERNYATAAN KEPUTUSAN PARA PESERO';
    judulBaris2 = 'FIRMA';
    sebutanEntitas = 'firma';
    sebutanEntitasKap = 'Firma';
    labelPemberiKuasa = 'Para Pesero Firma';
    labelSirkuler = 'Para Pesero';
    labelOrganLama = 'susunan Pesero Pengurus dan Pesero Firma lama';
    labelOrganBaru = 'susunan Pesero Pengurus dan Pesero Firma baru';
  } else if (tipe === 'UD') {
    judulBaris1 = 'AKTA PERNYATAAN KEPUTUSAN PEMILIK';
    judulBaris2 = 'PERUSAHAAN PERORANGAN / USAHA DAGANG';
    sebutanEntitas = 'usaha dagang';
    sebutanEntitasKap = 'Usaha Dagang';
    labelPemberiKuasa = 'Pemilik Usaha';
    labelSirkuler = 'Pemilik Usaha';
    labelOrganLama = 'pengurusan dan pengelolaan usaha sebelumnya';
    labelOrganBaru = 'susunan kepemilikan dan kuasa pengelola Usaha Dagang';
  }

  const entitasNama = (data.pt?.nama && data.pt.nama.trim()) ? data.pt.nama.trim().toUpperCase() : '..............................';
  const entitasKedudukan = (data.pt?.kedudukan && data.pt.kedudukan.trim()) ? data.pt.kedudukan.trim().toUpperCase() : '....................';
  const rawNotarisNama = (data.notaris?.nama || '').trim();
  const notarisNamaClean = rawNotarisNama.includes(',') ? rawNotarisNama.split(',')[0].trim() : rawNotarisNama;
  const notarisNamaDisplay = notarisNamaClean ? notarisNamaClean.toUpperCase() : '........................................';
  const notarisGelarPanjang = (data.notaris?.gelarPanjang && data.notaris.gelarPanjang.trim())
    ? data.notaris.gelarPanjang.trim()
    : 'Sarjana Hukum, Magister Kenotariatan';
  const notarisGelarSingkat = (data.notaris?.gelarSingkat && data.notaris.gelarSingkat.trim())
    ? data.notaris.gelarSingkat.trim()
    : (rawNotarisNama.includes(',') ? rawNotarisNama.substring(rawNotarisNama.indexOf(',') + 1).trim() : 'S.H., M.Kn.');
  const notarisWilayah = (data.notaris?.wilayah && data.notaris.wilayah.trim()) ? data.notaris.wilayah.trim() : '....................';
  const notarisWilayahKap = notarisWilayah.toUpperCase();

  // Jika bagian ini memiliki template kustom per-draf, terapkan template kustom tersebut
  if (data.customTemplates && data.customTemplates[`section${sectionNum}`]) {
    const substituted = substitutePlaceholders(data.customTemplates[`section${sectionNum}`], data, sectionNum, true);
    return renderTemplateTextToLines(substituted, maxChars, formatTextToNotaryLines);
  }

  // SECTION 1: DATA AKTA & NOTARIS
  if (sectionNum === 1) {
    const noAkta = val(data.akta?.nomor, '........');
    const tglAktaStr = (data.akta?.tanggal && data.akta.tanggal.trim()) 
      ? formatTanggalAkta(data.akta.tanggal) 
      : '..................................................';
    const jamAktaStr = (data.akta?.jam && data.akta.jam.trim())
      ? formatJamAkta(data.akta.jam)
      : 'pukul .............. Waktu Indonesia Barat';

    if (tipe === 'PT' && subTipe === 'RUPS_MODAL') {
      addCenter('AKTA PERNYATAAN KEPUTUSAN');
      addCenter('RAPAT UMUM PEMEGANG SAHAM LUAR BIASA');
      addCenter(`PERSEROAN TERBATAS "${entitasNama}"`);
      addCenter(`BERKEDUDUKAN DI - ${entitasKedudukan}`);
      addCenter(`Nomor : ${noAkta} .-`);
    } else {
      addCenter(judulBaris1);
      addCenter(judulBaris2);
      addCenter(`“${entitasNama}”`);
      addCenter(`BERKEDUDUKAN DI – ${entitasKedudukan}`);
      addCenter(`Nomor : ${noAkta} .-`);
    }
    appendBlock(`- Pada hari ini, ${tglAktaStr}, ${jamAktaStr};`);
    appendBlock(`- Berhadapan dengan saya, ${notarisNamaDisplay}, ${notarisGelarPanjang}, Notaris di ${notarisWilayah}, dengan dihadiri saksi-saksi, yang nama-namanya akan disebut pada bagian akhir akta ini:`);
    return lines;
  }

  // SECTION 2: IDENTITAS PERUSAHAAN & LEGALITAS
  if (sectionNum === 2) {
    const noPend = val(data.pt?.aktaPendirianNomor, '......');
    const tglPend = (data.pt?.aktaPendirianTgl && data.pt.aktaPendirianTgl.trim()) ? formatTanggalTanpaAwalan(data.pt.aktaPendirianTgl) : '....................';
    const notarisPend = val(data.pt?.aktaPendirianNotaris, '..............................');
    const wilPend = val(data.pt?.aktaPendirianWilayah, '....................');
    
    const skPendLabel = tipe === 'PT' 
      ? 'Pengesahan Pendirian Badan Hukum Perseroan Terbatas dari Menteri Hukum dan Hak Asasi Manusia Republik Indonesia, satu dan lain sebagaimana ternyata dari Surat Keputusan Menteri Hukum dan Hak Asasi Manusia Republik Indonesia' 
      : (tipe === 'UD' ? 'NIB / OSS' : 'Kemenkumham RI (SABU) / Pengadilan');
    const noSkPend = val(data.pt?.skPendirianNomor, '..............................');
    const tglSkPend = (data.pt?.skPendirianTgl && data.pt.skPendirianTgl.trim()) ? formatTanggalTanpaAwalan(data.pt.skPendirianTgl) : '....................';

    const noPerub = val(data.pt?.aktaPerubahanNomor, '......');
    const tglPerub = (data.pt?.aktaPerubahanTgl && data.pt.aktaPerubahanTgl.trim()) ? formatTanggalTanpaAwalan(data.pt.aktaPerubahanTgl) : '....................';
    const notarisPerub = val(data.pt?.aktaPerubahanNotaris, '..............................');
    const wilPerub = val(data.pt?.aktaPerubahanWilayah, '....................');

    const notarisPerubFormat = notarisPerub.toLowerCase().startsWith('saya')
      ? `${notarisPerub},`
      : `${notarisPerub}, Notaris di ${wilPerub},`;

    const notarisPendFormat = notarisPend.toLowerCase().startsWith('saya')
      ? `${notarisPend},`
      : `${notarisPend}, Notaris di ${wilPend},`;

    const skPerubLabel = tipe === 'PT' 
      ? 'persetujuan dari Menteri Hukum Republik Indonesia berupa Surat Keputusan Menteri Hukum Republik Indonesia' 
      : (tipe === 'UD' ? 'Pembaruan NIB / Izin Usaha' : 'Kemenkumham RI (SABU)');
    const noSkPerub = val(data.pt?.skPerubahanNomor, '..............................');
    const tglSkPerub = (data.pt?.skPerubahanTgl && data.pt.skPerubahanTgl.trim()) ? formatTanggalTanpaAwalan(data.pt.skPerubahanTgl) : '....................';
    const noPemberitahuan = val(data.pt?.pemberitahuanPerubahanNomor, '..............................');

    const jabatanPenghadap = val(data.penghadap?.jabatan, (tipe === 'PT' ? (subTipe === 'SIRKULER_MODAL' ? 'Direktur Utama' : 'Direktur') : (tipe === 'UD' ? 'Pemilik' : 'Persero Pengurus')));

    if (tipe === 'PT' && (subTipe === 'SIRKULER_MODAL' || subTipe === 'RUPS_MODAL')) {
      appendBlock(`- Menurut keterangannya, penghadap dalam hal ini bertindak dalam jabatannya selaku ${jabatanPenghadap}, dari dan selaku demikian untuk dan atas nama perseroan terbatas ${entitasNama}, berkedudukan di ${entitasKedudukan} (selanjutnya akan disebut juga “${sebutanEntitasKap}”), yang Anggaran Dasarnya didirikan dengan Akta Pendirian tertanggal ${tglPend}, Nomor. ${noPend}, yang dibuat dihadapan ${notarisPendFormat} akta mana telah mendapatkan ${skPendLabel} pada tanggal ${tglSkPend}, Nomor. ${noSkPend}, Akta mana telah mengalami perubahan sebagaimana ternyata melalui Akta tertanggal ${tglPerub}, Nomor. ${noPerub}, yang dibuat dihadapan ${notarisPerubFormat} akta mana telah mendapatkan ${skPerubLabel} tertanggal ${tglSkPerub}, Nomor. ${noSkPerub} dan Penerimaan Pemberitahuan Perubahan Anggaran Dasar Kementerian Hukum Republik Indonesia tertanggal ${tglSkPerub}, Nomor. ${noPemberitahuan};`);
    } else {
      appendBlock(`- menurut keterangannya, penghadap dalam hal ini bertindak dalam jabatannya selaku ${jabatanPenghadap}, untuk dan oleh karenanya secara sah mewakili ${sebutanEntitas} “${entitasNama}”, berkedudukan di ${entitasKedudukan} (selanjutnya akan disebut juga “${sebutanEntitasKap}”), yang Anggaran Dasarnya didirikan dengan Akta Pendirian tertanggal ${tglPend}, Nomor. ${noPend}, yang dibuat dihadapan ${notarisPend}, dahulu Notaris di ${wilPend}, akta mana telah mendapatkan ${skPendLabel} pada tanggal ${tglSkPend}, Nomor. ${noSkPend}, akta mana telah beberapa kali mengalami perubahan, yang terakhir melalui Akta tertanggal ${tglPerub}, Nomor. ${noPerub}, yang dibuat dihadapan ${notarisPerubFormat} akta mana telah mendapatkan ${skPerubLabel} tertanggal ${tglSkPerub}, Nomor. ${noSkPerub} dan telah diberitahukan kepada Menteri Hukum dan Hak Asasi Manusia Republik Indonesia, sebagaimana bukti penerimaan pemberitahuannya ternyata dari Penerimaan Pemberitahuan Perubahan Anggaran Dasar Kementerian Hukum dan Hak Asasi Manusia Republik – Indonesia tertanggal ${tglSkPerub}, Nomor. ${noPemberitahuan};`);
    }

    return lines;
  }

  // SECTION 3: PENGHADAP
  if (sectionNum === 3) {
    const sapaanP = val(data.penghadap?.sapaan, 'Tuan');
    const namaP = val(data.penghadap?.nama, '..............................');
    const tempatLahirP = val(data.penghadap?.tempatLahir, '....................');
    const tglLahirP = (data.penghadap?.tanggalLahir && data.penghadap.tanggalLahir.trim()) ? formatTanggalBiasa(data.penghadap.tanggalLahir) : '....................';
    const wnP = val(data.penghadap?.kewarganegaraan, 'Indonesia');
    const pekP = val(data.penghadap?.pekerjaan, '....................');
    const alamatP = val(data.penghadap?.alamat, '..................................................');
    const nikP = val(data.penghadap?.nik, '................');

    appendBlock(`- ${sapaanP}. ${namaP}, lahir di ${tempatLahirP}, pada ${tglLahirP}, Warga Negara ${wnP}, ${pekP}, bertempat tinggal di ${alamatP}, pemegang Kartu Tanda Penduduk nomor: ${nikP};`);
    if (tipe === 'PT' && subTipe === 'RUPS_MODAL') {
      appendBlock(`- Untuk keperluan dalam akta ini sementara waktu berada di ${notarisWilayah.replace(/Kabupaten|Kota/i, '').trim() || 'Kudus'};`);
    }
    return lines;
  }

  // SECTION 4: MODAL & KEPUTUSAN SIRKULER / RUPS
  if (sectionNum === 4) {
    const sapaanP = val(data.penghadap?.sapaan, 'Tuan');
    const namaP = val(data.penghadap?.nama, '..............................');
    const pasalSirkuler = val(data.pt?.pasalSirkuler, '10 ayat (5)');

    appendBlock(`- Penghadap bertindak dalam kedudukannya tersebut diatas dengan ini menerangkan :`);

    if (tipe === 'PT' && subTipe === 'RUPS_MODAL') {
      const mf = resolveModalFields(data, true);
      const tglRupsStr = (data.rups?.tanggal && data.rups.tanggal.trim()) ? formatTanggalAkta(data.rups.tanggal) : '..................................................';
      const jamRupsStr = val(data.rups?.jam, '08.00 WIB');
      const tempatRupsStr = val(data.rups?.tempat, 'Kantor Perseroan');
      const kuorumSaham = Number(data.rups?.sahamHadir || mf.modalSemulaSaham);
      const strKuorum = kuorumSaham > 0 ? formatSaham(kuorumSaham) : '..........';
      const pengambilText = joinParts([
        val(data.peningkatanModal?.pengambilNama, 'perseroan terbatas PT. CIPTA PERSADA INDONESIA'),
        data.peningkatanModal?.pengambilKedudukan ? `berkedudukan di ${data.peningkatanModal.pengambilKedudukan}` : '',
        data.peningkatanModal?.pengambilAktaPendirian,
        data.peningkatanModal?.pengambilAktaPerubahan
      ]);
      const pelepasText = joinParts([
        val(data.peningkatanModal?.pelepasanNama, 'perseroan terbatas PT. HARUM SEMERBAK'),
        `berkedudukan di ${val(data.peningkatanModal?.pelepasanKedudukan, 'Kabupaten Kudus')}`,
        data.peningkatanModal?.pelepasanLegalitas
      ]);

      appendBlock(`- Bahwa pada hari ${tglRupsStr}, pukul ${jamRupsStr}, dengan mengambil tempat di ${tempatRupsStr}, telah diadakan Rapat Umum Pemegang Saham (RUPS) Luar Biasa perseroan terbatas ${entitasNama}, berkedudukan di ${entitasKedudukan}.`);
      appendBlock(`Acara Rapat Umum Pemegang Saham :`);
      appendBlock(`1. Pengeluaran ${formatSaham(mf.sahamKeluarJml)} lembar saham dalam simpanan atau senilai ${formatRupiah(mf.sahamKeluarNominal)};`);
      appendBlock(`2. Peningkatan Modal Disetor semula ${formatRupiah(mf.modalSemulaNominal)} menjadi ${formatRupiah(mf.modalMenjadiNominal)};`);
      appendBlock(`- Bahwa dalam rapat tersebut telah hadir dan/atau diwakili sejumlah ${strKuorum} saham yang merupakan keseluruhan saham yang telah dikeluarkan oleh Perseroan;`);
      appendBlock(`- Bahwa surat-surat saham yang diwakili sampai sekarang belum dicetak, namun demikian penghadap menjamin keadaannya baik jumlah dan kepemilikan saham sesuai dengan keadaan yang sebenarnya;`);
      appendBlock(`- Bahwa dalam rapat tersebut penghadap ${sapaanP}. ${namaP} bertindak selaku Pimpinan Rapat;`);
      appendBlock(`- Bahwa hal-hal yang dibicarakan serta diputuskan dalam rapat tersebut telah dibuatkan Berita Acara Rapat di bawah tangan bermeterai cukup dan dilekatkan pada minuta akta ini;`);
      appendBlock(`- Bahwa berdasarkan kuasa yang diberikan dalam Rapat tersebut, penghadap diberi hak dan wewenang untuk menyatakan keputusan rapat dalam suatu akta Notaris;`);
      appendBlock(`- Berdasarkan apa yang diuraikan diatas, penghadap menyatakan Rapat Umum Pemegang Saham Luar Biasa dengan suara bulat telah memutuskan:`);
      appendBlock(`1) MENYETUJUI, pengeluaran ${formatSaham(mf.sahamKeluarJml)} saham dalam simpanan atau senilai ${formatRupiah(mf.sahamKeluarNominal)} yang diambil bagian dan disetor penuh oleh ${pengambilText}, sedangkan pemegang saham lainnya, yaitu ${pelepasText}, menyatakan tidak ikut mengambil bagian atas saham-saham yang dikeluarkan oleh Perseroan, serta mengesampingkan segala hak yang dimilikinya termasuk dan tidak terbatas pada hak untuk mendapatkan penawaran terlebih dahulu (pre-emptive rights);`);
      appendBlock(`2) MENYETUJUI, peningkatan Modal Ditempatkan dan Disetor semula ${formatRupiah(mf.modalSemulaNominal)} menjadi ${formatRupiah(mf.modalMenjadiNominal)};`);
      appendBlock(`- Sehingga susunan kepemilikan saham perseroan terbatas ${entitasNama}, tersebut diatas adalah sebagai berikut :`);
    } else if (tipe === 'PT' && subTipe === 'SIRKULER_MODAL') {
      const mf = resolveModalFields(data, false);
      const pengambilText = joinParts([
        val(data.peningkatanModal?.pengambilNama, 'perseroan terbatas PT. JAYA ABADI SELALU'),
        data.peningkatanModal?.pengambilKedudukan ? `berkedudukan di ${data.peningkatanModal.pengambilKedudukan}` : '',
        data.peningkatanModal?.pengambilAktaPendirian,
        data.peningkatanModal?.pengambilAktaPerubahan
      ]);
      const pelepasText = joinParts([
        val(data.peningkatanModal?.pelepasanNama, 'perseroan terbatas PT. PELITA JAYA SELALU'),
        `berkedudukan di ${val(data.peningkatanModal?.pelepasanKedudukan, 'Kabupaten Kudus')}`,
        data.peningkatanModal?.pelepasanLegalitas
      ]);

      appendBlock(`- Bahwa para pemegang saham Perseroan telah mengambil keputusan sebagaimana ternyata dari –`);
      lines.push({ text: '----- KEPUTUSAN SIRKULER PARA PEMEGANG SAHAM -----', align: 'center', bold: true });
      appendBlock(`perseroan terbatas ${entitasNama} yang dibuat secara dibawah tangan, ditandatangani oleh para pemegang saham Perseroan dan telah dibubuhi materai cukup dan dilekatkan pada minuta akta ini;`);
      const totalSahamAwal = Number(mf.modalSemulaSaham || data.saham?.totalSeriA || 353201);
      appendBlock(`- Bahwa Keputusan Sirkuler Pemegang Saham tersebut telah ditandatangani sebagai bentuk persetujuan oleh seluruh pemegang saham dengan jumlah ${formatSaham(totalSahamAwal)} lembar saham, jumlah mana merupakan keseluruhan saham yang telah dikeluarkan dan diambil bagian oleh para pemegang saham dalam perseroan;`);
      appendBlock(`- Bahwa surat-surat saham yang diwakili sampai sekarang belum dicetak, namun demikian penghadap menjamin keadaannya baik jumlah dan kepemilikan saham sesuai dengan keadaan yang sebenarnya;`);
      appendBlock(`- Bahwa Keputusan Sirkuler Para Pemegang Saham tersebut adalah harus dianggap sama dengan keputusan yang diambil dalam setiap rapat umum pemegang saham Perseroan berdasarkan Pasal ${pasalSirkuler} dan oleh karenanya sah serta mengikat sesuai dengan ketentuan yang termaktub dalam Anggaran Dasar Perseroan;`);
      appendBlock(`- Bahwa penghadap ${sapaanP}. ${namaP} yang bertindak dalam kedudukannya sebagaimana diatas dan dengan mempergunakan kekuatan kuasa yang diberikan oleh Para Pemegang Saham Perseroan berdasarkan Keputusan Sirkuler Pemegang Saham sekarang hendak menyatakan Keputusan Sirkuler Pemegang Saham tersebut dalam suatu akta Notaris.`);
      appendBlock(`- Berdasarkan dengan apa yang telah diuraikan diatas, penghadap menyatakan para pemegang saham Perseroan telah mengambil keputusan sebagai berikut:`);
      appendBlock(`1) MENYETUJUI, Pengeluaran ${formatSaham(mf.sahamKeluarJml)} saham simpanan atau senilai ${formatRupiah(mf.sahamKeluarNominal)} yang diambil bagian dan disetor penuh oleh ${pengambilText}, sedangkan pemegang saham lainnya, yaitu ${pelepasText}, menyatakan tidak ikut mengambil bagian atas saham-saham yang dikeluarkan oleh Perseroan, serta mengesampingkan segala hak yang dimilikinya termasuk dan tidak terbatas pada hak untuk mendapatkan penawaran terlebih dahulu (pre-emptive rights);`);
      appendBlock(`2) MENYETUJUI, Meningkatkan Modal Ditempatkan dan Disetor Perseroan semula ${formatRupiah(mf.modalSemulaNominal)} menjadi ${formatRupiah(mf.modalMenjadiNominal)};`);
      appendBlock(`- Sehingga susunan kepemilikan saham perseroan terbatas ${entitasNama} adalah sebagai berikut:`);
    } else {
      appendBlock(`- Bahwa ${tipe === 'PT' ? 'para pemegang saham' : (tipe === 'UD' ? 'pemilik usaha' : 'para pesero')} ${sebutanEntitasKap} telah mengambil keputusan sebagaimana ternyata dari –`);

      const rawJudulSirkuler = `KEPUTUSAN SIRKULER ${tipe === 'PT' ? 'PARA PEMEGANG SAHAM' : (tipe === 'UD' ? 'PEMILIK USAHA' : 'PARA PESERO')}`;
      if (rawJudulSirkuler.length + 8 <= maxChars) {
        const diff = maxChars - rawJudulSirkuler.length - 2;
        const leftDashes = Math.floor(diff / 2);
        const rightDashes = diff - leftDashes;
        lines.push({ text: '-'.repeat(leftDashes) + ' ' + rawJudulSirkuler + ' ' + '-'.repeat(rightDashes), align: 'center', bold: true });
      } else {
        addCenter(rawJudulSirkuler);
      }

      appendBlock(`${sebutanEntitas} “${entitasNama}” yang dibuat secara dibawah tangan, ditandatangani oleh ${labelPemberiKuasa} dan telah dibubuhi materai cukup dan dilekatkan pada minuta akta ini selanjutnya akan disebut juga “Keputusan Sirkuler ${labelSirkuler}”;`);

      if (tipe === 'PT') {
        const sA = Number(data.saham?.totalSeriA || 0);
        const sB = Number(data.saham?.totalSeriB || 0);
        const strSA = sA > 0 ? formatSaham(sA) : '..........';
        const strSB = sB > 0 ? formatSaham(sB) : '..........';
        appendBlock(`- Bahwa Keputusan Sirkuler Pemegang Saham tersebut telah ditandatangani sebagai bentuk persetujuan oleh seluruh pemegang saham dengan jumlah ${strSA} saham seri-A dan ${strSB} saham seri-B, jumlah mana merupakan keseluruhan saham yang telah dikeluarkan dan diambil bagian oleh para pemegang saham dalam perseroan;`);
        appendBlock(`- Bahwa surat-surat saham yang diwakili sampai sekarang belum dicetak, namun demikian penghadap menjamin keadaannya baik jumlah dan kepemilikan saham sesuai dengan keadaan yang sebenarnya;`);
        appendBlock(`- Bahwa Keputusan Sirkuler Para Pemegang Saham tersebut adalah harus dianggap sama dengan keputusan yang diambil dalam setiap rapat umum pemegang saham Perseroan berdasarkan Pasal ${pasalSirkuler} Anggaran Dasar Perseroan. Oleh karena itu, seluruh keputusan yang diambil dalam Keputusan Sirkuler ini adalah sah dan mengikat;`);
      } else {
        const totalMod = Number(data.modal?.totalNominal || 0);
        const totalModStr = totalMod > 0 ? formatRupiah(totalMod) : 'Rp. ....................';
        appendBlock(`- Bahwa modal yang ditempatkan dan disetor penuh dalam ${sebutanEntitas} ini adalah sebesar ${totalModStr}, yang terbagi ke dalam bagian-bagian modal (inbreng) para pesero/pemilik secara sah;`);
        appendBlock(`- Bahwa keputusan ini adalah sah, mengikat, dan memiliki kekuatan hukum yang sempurna berdasarkan ketentuan Anggaran Dasar dan peraturan perundang-undangan yang berlaku di Republik Indonesia;`);
      }

      appendBlock(`- Bahwa penghadap ${sapaanP}. ${namaP}, yang bertindak dalam kedudukannya sebagaimana diatas, dan dengan mempergunakan kekuatan kuasa yang diberikan oleh ${labelPemberiKuasa} berdasarkan Keputusan Sirkuler ${labelSirkuler} sekarang hendak menyatakan Keputusan Sirkuler ${labelSirkuler} tersebut dalam suatu akta Notaris.`);
      appendBlock(`- Berdasarkan dengan apa yang telah diuraikan diatas, penghadap ${sapaanP}. ${namaP}, menyatakan ${labelPemberiKuasa} telah mengambil keputusan sebagai berikut:`);
    }

    return lines;
  }

  // SECTION 5: SUSUNAN PENGURUS BARU / PERUBAHAN PASAL 4 (MODAL)
  if (sectionNum === 5) {
    if (tipe === 'PT' && (subTipe === 'SIRKULER_MODAL' || subTipe === 'RUPS_MODAL')) {
      const isRups = subTipe === 'RUPS_MODAL';
      const mf = resolveModalFields(data, isRups);
      const pmList = mf.pmList;

      pmList.forEach((ps, idx) => {
        const pLabel = `${String.fromCharCode(97 + idx)}. `;
        const rawPsNama = ps.nama ? (ps.nama.toLowerCase().startsWith('perseroan') ? ps.nama : `perseroan terbatas ${ps.nama}`) : 'perseroan terbatas ....................';
        appendBlock(`${pLabel}${rawPsNama}, tersebut diatas sebanyak ${formatSaham(ps.jumlahSaham)} saham atau senilai ${formatRupiah(ps.nominal)};`);
      });

      const totalSahamSemua = mf.modalMenjadiSaham;
      const totalNominalSemua = mf.modalMenjadiNominal;
      if (totalSahamSemua > 0 && totalNominalSemua > 0) {
        appendBlock(`- Sehingga total seluruhnya adalah sebanyak ${formatSaham(totalSahamSemua)} saham atau senilai ${formatRupiah(totalNominalSemua)};`);
      }

      appendBlock(`- Dengan demikian mengubah Pasal 4 ayat (2) Anggaran Dasar perseroan, sehingga untuk selanjutnya tertulis dan berbunyi sebagai berikut:`);
      lines.push({ text: '------------------- M O D A L -------------------', align: 'center', bold: true });
      lines.push({ text: '-------------------- Pasal 4 --------------------', align: 'center', bold: true });
      appendBlock(`2. Dari Modal Dasar tersebut telah ditempatkan dan disetor sebagian, sebanyak ${formatSaham(totalSahamSemua)} saham dengan nilai nominal seluruhnya sebesar ${formatRupiah(totalNominalSemua)} oleh para pemegang saham yang telah mengambil bagian saham dengan rincian serta nilai nominal saham yang akan disebutkan pada akhir akta ini.`);
      appendBlock(`- Bahwa dengan adanya peningkatan modal pada keputusan ini, dan bertalian dengan Modal Ditempatkan dan Modal Disetor sebagaimana dimaksud dalam pasal 4 ayat (2), maka bagian akhir Anggaran Dasar Perseroan menjadi berbunyi sebagai berikut:`);
      appendBlock(`- Modal ditempatkan sebagaimana dimaksud dalam Pasal 4 ayat (2) telah disetor penuh dengan uang tunai melalui kas perseroan oleh para pemegang saham:`);

      pmList.forEach((ps, idx) => {
        const psNum = `${idx + 1}. `;
        const rawPsNama = ps.nama ? (ps.nama.toLowerCase().startsWith('perseroan') ? ps.nama : `perseroan terbatas ${ps.nama}`) : 'perseroan terbatas ....................';
        appendBlock(`${psNum}${rawPsNama}, tersebut diatas, sebanyak ${formatSaham(ps.jumlahSaham)} saham, dengan nilai nominal ${formatRupiah(ps.nominalPerSaham)} per saham, atau seluruhnya sebesar ${formatRupiah(ps.nominal)};`);
      });

      if (totalSahamSemua > 0 && totalNominalSemua > 0) {
        appendBlock(`- Sehingga seluruhnya berjumlah ${formatSaham(totalSahamSemua)} saham dengan nilai nominal seluruhnya sebesar ${formatRupiah(totalNominalSemua)};`);
      }

      const docTglStr = (isRups && data.rups?.tanggal)
        ? formatTanggalBiasa(data.rups.tanggal)
        : formatTanggalBiasa(data.akta.tanggal);
      const kotaTtd = notarisWilayah.replace(/Kabupaten|Kota/i, '').trim() || 'Kudus';

      const ttdList = (Array.isArray(data.pemegangSaham) && data.pemegangSaham.length > 0)
        ? data.pemegangSaham
        : pmList.map(ps => ({ nama: ps.nama, selaku: `Pemegang ${ps.jumlahSaham.toLocaleString('id-ID')} saham Perseroan` }));

      if (isRups) {
        appendBlock(`- Demikian Berita Acara Rapat Umum Pemegang Saham ini, disahkan dan ditandatangani oleh Para Pemegang Saham sebagai bentuk persetujuan;`);
        appendBlock(`${kotaTtd}, ${docTglStr}`);
        appendBlock(`Para Pemegang Saham Perseroan`);
        appendBlock(`materai sepuluh ribu rupiah`);
        appendBlock(`tanda tangan tidak terbaca`);
        appendBlock(`${val(data.penghadap?.sapaan, 'Tuan')}. ${val(data.penghadap?.nama, '..............................')}`);
        appendBlock(`Pimpinan Rapat;`);
      } else {
        appendBlock(`- Demikian Keputusan Sirkuler Para Pemegang Saham ini, disahkan dan ditandatangani oleh Para Pemegang Saham sebagai bentuk persetujuan;`);
        appendBlock(`${kotaTtd}, ${docTglStr}`);
        appendBlock(`Para Pemegang Saham Perseroan`);
        appendBlock(`materai sepuluh ribu rupiah`);
        appendBlock(`tanda tangan tidak terbaca`);
      }
      ttdList.forEach(ps => {
        appendBlock(ps.nama);
        appendBlock(`${ps.selaku || 'Pemegang Saham Perseroan'};`);
      });
      return lines;
    }

    const masaJab = val(data.keputusan?.masaJabatan, '..........');
    appendBlock(`1) MENYETUJUI, untuk memberhentikan dengan hormat ${labelOrganLama} terhitung sejak tanggal Keputusan Sirkuler ini berlaku efektif dan memberikan pengesahan atas tindakan kepengurusan dan pengawasan ${labelOrganLama} dalam melakukan tindakan hukum atas nama ${sebutanEntitasKap}, sepanjang tindakan-tindakan hukum dimaksud sesuai/tidak menyimpang dari ketentuan dalam Anggaran Dasar ${sebutanEntitasKap} dan tercermin dalam laporan keuangan tahunan ${sebutanEntitasKap}, berikut dengan memberikan pelepasan dan pelunasan (Acquit et Decharge) sepenuhnya atas pelaksanaan pengurusan dan pengawasan yang telah dijalankan; Mengubah susunan ${tipe === 'PT' ? 'Direksi dan Dewan Komisaris yang' : labelOrganBaru} baru sejak tanggal efektif keputusan ini sampai dengan ${masaJab} tahun mendatang, sehingga ${labelOrganBaru} menjadi sebagai berikut:`);

    if (Array.isArray(data.pengurusBaru) && data.pengurusBaru.length > 0) {
      data.pengurusBaru.forEach(pejabat => {
        const rawTitle = val(pejabat.jabatan, 'PENGURUS').toUpperCase();
        const tglLahirStr = (pejabat.tanggalLahir && pejabat.tanggalLahir.trim()) ? formatTanggalBiasa(pejabat.tanggalLahir) : '....................';
        const sapaanO = val(pejabat.sapaan, 'Tuan');
        const namaO = val(pejabat.nama, '..............................');
        const tempatO = val(pejabat.tempatLahir, '....................');
        const wnO = val(pejabat.kewarganegaraan, 'Indonesia');
        const pekO = val(pejabat.pekerjaan, 'Karyawan Swasta');
        const alamatO = val(pejabat.alamat, '..................................................');
        const nikO = val(pejabat.nik, '................');

        const rawOfficerRight = `${sapaanO}. ${namaO}, lahir di ${tempatO}, pada ${tglLahirStr}, Warga Negara ${wnO}, ${pekO}, bertempat tinggal di ${alamatO}, pemegang Kartu Tanda Penduduk nomor: ${nikO};`;

        if (rawTitle.length <= 18) {
          const col1Width = 25;
          const col2Width = maxChars - col1Width;
          const jabatanLabel = `- ${rawTitle}`;
          const diff1 = col1Width - jabatanLabel.length - 3;
          const pad1 = diff1 > 0 ? ' ' + '-'.repeat(diff1 - 1) : '';
          const firstPrefix = (jabatanLabel + pad1 + ' : ').padEnd(col1Width, '-');
          const contPrefix = '-'.repeat(col1Width - 1) + ' ';

          const rightLines = formatTextToNotaryLines(rawOfficerRight, col2Width);
          rightLines.forEach((rLine, rIdx) => {
            const prefix = rIdx === 0 ? firstPrefix : contPrefix;
            lines.push({ text: prefix + rLine, align: 'left', bold: false });
          });
        } else {
          appendBlock(`- ${rawTitle} : ${rawOfficerRight}`);
        }
      });
    } else {
      appendBlock(`- PENGURUS BARU : Tuan. .............................., lahir di .........., pada ...................., Warga Negara Indonesia, Karyawan Swasta, bertempat tinggal di .................................................., pemegang Kartu Tanda Penduduk nomor: ................;`);
    }

    appendBlock(`2) MENYETUJUI, bahwa terhitung sejak tanggal efektif pengangkatan ${tipe === 'PT' ? 'Direksi dan Dewan Komisaris tersebut diatas, kepada masing-masing Direktur dan Komisaris' : `${labelOrganBaru} tersebut diatas, kepada masing-masing pengurus`} diberikan kuasa, kewajiban, hak, dan kewenangan sesuai dengan tugas dan jabatan yang diemban menurut dan/atau berdasarkan Anggaran Dasar ${sebutanEntitasKap} maupun Undang-Undang yang berlaku dengan tanpa ada yang dikecualikan.`);

    appendBlock(`- Demikian Keputusan Sirkuler ${labelSirkuler} ini, mempunyai kekuatan hukum yang sama dengan keputusan yang diambil secara sah dalam Rapat Umum Pemegang Saham Perseroan;`);
    appendBlock(labelPemberiKuasa);
    appendBlock('materai sepuluh ribu rupiah');
    appendBlock('tanda tangan tidak terbaca');

    if (tipe === 'PT') {
      if (Array.isArray(data.pemegangSaham) && data.pemegangSaham.length > 0) {
        data.pemegangSaham.forEach(ps => {
          const nm = val(ps.nama, '..............................');
          appendBlock(nm);
          const sA = Number(ps.sahamSeriA || 0);
          const sB = Number(ps.sahamSeriB || 0);
          let sahamText = '';
          if (sA > 0 && sB > 0) {
            sahamText = `selaku pemegang ${sA.toLocaleString('id-ID')} saham Seri-A Perseroan dan pemegang ${sB.toLocaleString('id-ID')} saham Seri-B Perseroan`;
          } else if (sB > 0) {
            sahamText = `selaku pemegang ${sB.toLocaleString('id-ID')} saham Seri-B Perseroan`;
          } else if (sA > 0) {
            sahamText = `selaku pemegang ${sA.toLocaleString('id-ID')} saham Seri-A Perseroan`;
          } else {
            sahamText = 'selaku pemegang .......... saham Perseroan';
          }
          const desc = ps.selaku ? `${ps.selaku} – ${sahamText}` : sahamText;
          appendBlock(desc);
          appendBlock(`Tanggal : ${val(ps.tanggalTtd, '....................')};`);
        });
      } else {
        appendBlock('..............................');
        appendBlock('selaku pemegang .......... saham Perseroan');
        appendBlock('Tanggal : ....................;');
      }
    } else {
      if (Array.isArray(data.sekutu) && data.sekutu.length > 0) {
        data.sekutu.forEach(sk => {
          appendBlock(val(sk.nama, '..............................'));
          const nom = Number(sk.nominalInbreng || 0);
          const nomStr = nom > 0 ? formatRupiah(nom) : 'Rp. ....................';
          appendBlock(`${val(sk.statusSekutu, 'Sekutu')} – selaku penyetor modal inbreng sebesar ${nomStr} (${val(sk.persentase, '..')}%)`);
          appendBlock(`Tanggal : ${val(sk.tanggalTtd, '....................')};`);
        });
      } else {
        appendBlock('..............................');
        appendBlock('Sekutu – selaku penyetor modal inbreng sebesar Rp. .................... (....%)');
        appendBlock('Tanggal : ....................;');
      }
    }
    return lines;
  }

  // SECTION 6: SAKSI & PENUTUP
  if (sectionNum === 6) {
    const sapaanP = val(data.penghadap?.sapaan, 'Tuan');
    const namaP = val(data.penghadap?.nama, '..............................');
    appendBlock(`- Kemudian penghadap ${sapaanP}. ${namaP} dengan ini memberi kuasa kepada saya, Notaris, untuk mengajukan permohonan dan/atau memberitahukan perubahan data ${sebutanEntitasKap} tersebut kepada instansi yang berwenang dan untuk itu membuat pengubahan dan/atau tambahan dalam bentuk yang bagaimanapun juga yang diperlukan untuk memperoleh Surat Keputusan dan/atau Surat Penerimaan Pemberitahuan Perubahan Anggaran Dasar dan/atau Surat Penerimaan Pemberitahuan Perubahan Data ${sebutanEntitasKap} dan untuk mengajukan dan menandatangani semua permohonan dan dokumen lain yang mungkin diperlukan.`);
    appendBlock(`- Penghadap dengan ini menjamin akan kebenaran identitas, dan/atau asli tandatangan atas dokumen-dokumen asli yang diserahkan oleh penghadap sesuai dengan dokumen-dokumen yang disampaikan kepada saya, Notaris, dan bertanggungjawab sepenuhnya atas hal-hal tersebut dan selanjutnya penghadap juga menyatakan telah mengetahui dan memahami seluruh isi akta ini, dan apabila di kemudian hari timbul tuntutan hukum mengenai hal tersebut yang menimbulkan suatu sengketa atas hal-hal tersebut karena sebab apapun juga, maka penghadap akan membebaskan Notaris dan saksi-saksi yang menandatangani akta ini dari segala tuntutan hukum.`);
    appendBlock(`- Penghadap telah dikenal oleh saya, Notaris.`);

    lines.push({ text: '---------------- DEMIKIANLAH AKTA INI ---------------', align: 'center', bold: true });

    appendBlock(`- Dibuat dan dilangsungkan di ${notarisWilayah}, pada hari dan tanggal tersebut pada bagian awal akta ini dengan dihadiri oleh:`);

    const sk1Sapaan = val(data.saksi1?.sapaan, 'Nona');
    const sk1Nama = val(data.saksi1?.nama, '..............................');
    const sk1Tempat = val(data.saksi1?.tempatLahir, '..........');
    const sk1Tgl = (data.saksi1?.tanggalLahir && data.saksi1.tanggalLahir.trim()) ? formatTanggalBiasa(data.saksi1.tanggalLahir) : '....................';
    const sk1Wn = val(data.saksi1?.kewarganegaraan, 'Indonesia');
    const sk1Pek = val(data.saksi1?.pekerjaan, 'Karyawan Swasta');
    const sk1Alamat = val(data.saksi1?.alamat, '..................................................');
    const sk1Nik = val(data.saksi1?.nik, '................');
    appendBlock(`1. ${sk1Sapaan}. ${sk1Nama}, lahir di ${sk1Tempat}, pada ${sk1Tgl}, Warga Negara ${sk1Wn}, ${sk1Pek}, bertempat tinggal di ${sk1Alamat}, pemegang Kartu Tanda Penduduk nomor: ${sk1Nik};`);

    const sk2Sapaan = val(data.saksi2?.sapaan, 'Nona');
    const sk2Nama = val(data.saksi2?.nama, '..............................');
    const sk2Tempat = val(data.saksi2?.tempatLahir, '..........');
    const sk2Tgl = (data.saksi2?.tanggalLahir && data.saksi2.tanggalLahir.trim()) ? formatTanggalBiasa(data.saksi2.tanggalLahir) : '....................';
    const sk2Wn = val(data.saksi2?.kewarganegaraan, 'Indonesia');
    const sk2Pek = val(data.saksi2?.pekerjaan, 'Karyawan Swasta');
    const sk2Alamat = val(data.saksi2?.alamat, '..................................................');
    const sk2Nik = val(data.saksi2?.nik, '................');
    appendBlock(`2. ${sk2Sapaan}. ${sk2Nama}, lahir di ${sk2Tempat}, pada ${sk2Tgl}, Warga Negara ${sk2Wn}, ${sk2Pek}, bertempat tinggal di ${sk2Alamat}, pemegang Kartu Tanda Penduduk nomor: ${sk2Nik};`);

    appendBlock(`- Keduanya karyawan Notaris, yang Saya kenal, sebagai saksi-saksi.`);
    appendBlock(`- Segera setelah akta ini dibacakan oleh saya, Notaris kepada para penghadap dan saksi-saksi, maka akta ini ditanda tangani oleh para penghadap, saksi-saksi dan saya, Notaris, serta cap ibu jari oleh penghadap pada lembar kertas terpisah yang dilekatkan pada minuta akta ini.`);
    appendBlock(`- Dilangsungkan dengan tanpa tambahan, tanpa penggantian, dan tanpa coretan.`);
    appendBlock(`- Minuta akta ini telah ditandatangani dengan sempurna.`);

    const notarisTtdDisplay = notarisNamaClean ? `${notarisNamaClean.toUpperCase()}, ${notarisGelarSingkat}` : '........................................';
    lines.push({ text: '---- DIBERIKAN SEBAGAI SALINAN YANG SAMA BUNYINYA ---', align: 'center', bold: true });
    addCenter(`NOTARIS DI - ${notarisWilayahKap}`);
    lines.push({ text: '', align: 'center', bold: false, isSignatureSpace: true });
    addCenter(`(${notarisTtdDisplay})`, { underline: true });
    return lines;
  }

  return lines;
}

/**
 * Membagi seluruh isi akta menjadi halaman-halaman A4 (Standar 30 baris per halaman)
 */
export function generateNotaryPages(data, maxChars = 53, linesPerPage = 30) {
  const contentLines = buildDeedContentLines(data, maxChars);
  const pages = [];
  
  // Baris pertama di setiap halaman dialokasikan untuk tanda "Halaman Ke-N."
  // Jadi baris konten yang tersedia di setiap lembar = linesPerPage - 1 (misal 29 baris)
  const availableContentLinesPerPage = linesPerPage - 1;
  
  let currentLines = [];
  let pageNumber = 1;

  for (let i = 0; i < contentLines.length; i++) {
    currentLines.push(contentLines[i]);
    if (currentLines.length >= availableContentLinesPerPage) {
      pages.push({
        pageNumber,
        headerMark: '',
        lines: currentLines
      });
      pageNumber++;
      currentLines = [];
    }
  }

  if (currentLines.length > 0) {
    pages.push({
      pageNumber,
      headerMark: '',
      lines: currentLines
    });
  }

  // Format header mark untuk setiap lembar (misal: "Halaman Pertama.", ..., "Halaman Kesepuluh dan terakhir.")
  const totalPages = pages.length;
  pages.forEach((p, idx) => {
    const isLast = (idx === totalPages - 1);
    p.headerMark = getNamaHalaman(p.pageNumber, isLast);
  });

  return pages;
}

export async function generateAktaWord(data) {
  const tipe = (data?.badanUsaha && data.badanUsaha.tipe) || 'PT';
  const entitasNama = (data?.pt?.nama || `USAHA ${tipe}`).toUpperCase();

  // Pengaturan Spasi Baris & Paragraf (Default 2.0 Double Spacing per Standar Minuta/Salinan Akta)
  const lineSpacingMult = (data.layout && data.layout.spacing) ? parseFloat(data.layout.spacing) : 2.0;
  const lineDxa = Math.round(lineSpacingMult * 240); // 2.0 * 240 = 480 dxa

  // Dapatkan seluruh lembar halaman A4 (masing-masing memuat tepat 30 baris)
  const pages = generateNotaryPages(data, 53, 30);
  const docParagraphs = [];

  pages.forEach((page) => {
    // 1. Tanda Pojok Kanan Atas: "Halaman Ke-N." (dengan pageBreakBefore untuk halaman 2, 3, dst.)
    docParagraphs.push(
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        pageBreakBefore: page.pageNumber > 1, // Memulai lembar halaman baru persis seperti di Word!
        spacing: { before: 0, after: 0, line: lineDxa, lineRule: 'auto' },
        children: [
          new TextRun({
            text: page.headerMark,
            underline: { type: UnderlineType.SINGLE },
            font: 'Courier New',
            size: 24 // 12 pt
          })
        ]
      })
    );

    // 2. Baris-baris isi halaman tersebut (Tepat 29 baris atau sisa pada halaman penutup)
    page.lines.forEach((lineItem) => {
      let align = AlignmentType.LEFT;
      if (lineItem.align === 'center') align = AlignmentType.CENTER;
      else if (lineItem.align === 'right') align = AlignmentType.RIGHT;

      docParagraphs.push(
        new Paragraph({
          alignment: align,
          spacing: {
            before: 0,
            after: lineItem.isSignatureSpace ? lineDxa : 0,
            line: lineDxa,
            lineRule: 'auto'
          },
          children: [
            new TextRun({
              text: lineItem.text,
              bold: !!lineItem.bold,
              underline: lineItem.underline ? { type: UnderlineType.SINGLE } : undefined,
              font: 'Courier New',
              size: 24 // 12 pt
            })
          ]
        })
      );
    });
  });

  // Rakit Dokumen Word (.docx) dengan Page Setup Sesuai Standar Akta Notaris Indonesia
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: 'Courier New',
            size: 24, // 12 pt
            color: '000000'
          },
          paragraph: {
            alignment: AlignmentType.LEFT,
            spacing: {
              line: lineDxa, // 480 dxa = 2.0 Double line spacing
              lineRule: 'auto',
              before: 0,
              after: 0
            }
          }
        }
      }
    },
    sections: [
      {
        properties: {
          page: {
            size: {
              width: 11906, // Kertas A4: Lebar 210mm (8.267 in * 1440)
              height: 16838 // Kertas A4: Tinggi 297mm (11.693 in * 1440)
            },
            margin: {
              top: 432,   // 0.3" * 1440 = 432 dxa
              bottom: 274,// 0.19" * 1440 = 274 dxa
              left: 3686, // 2.56" * 1440 = 3686 dxa (Lajur Renvoi / Ruang Catatan Pinggir Akta)
              right: 562  // 0.39" * 1440 = 562 dxa
            }
          }
        },
        children: docParagraphs
      }
    ]
  });

  const blob = await Packer.toBlob(doc);
  const cleanEntitasName = entitasNama.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `Salinan_Akta_No_${data.akta?.nomor || '1'}_${tipe}_${cleanEntitasName}.docx`;
  if (typeof window !== 'undefined' && typeof saveAs === 'function' && !window.__TAURI__?.core?.invoke) {
    saveAs(blob, filename);
  }

  return { filename, blob };
}

/**
 * Export Dokumen Internal Perusahaan (.docx)
 * Untuk Kasus RUPS: Font Georgia 11pt, judul "BERITA ACARA RUPS LUAR BIASA", tabel setoran bank & kepemilikan saham.
 * Untuk Kasus Sirkuler: Font Bookman Old Style 11pt, judul "KEPUTUSAN SIRKULER PARA PEMEGANG SAHAM", tabel setoran bank & kepemilikan saham.
 */
export async function exportInternalDocx(data) {
  const tipe = (data.badanUsaha && data.badanUsaha.tipe) || 'PT';
  const subTipe = resolveSubTipe(data, 'SIRKULER_MODAL');
  const entitasNama = (data.pt?.nama || `PT. ${tipe}`).toUpperCase();
  const entitasKedudukan = data.pt?.kedudukan || 'Kabupaten Kudus';
  const cleanEntitasName = entitasNama.replace(/[^a-zA-Z0-9]/g, '_');

  const isRups = subTipe === 'RUPS_MODAL';
  const mf = resolveModalFields(data, isRups);
  const fontName = isRups ? 'Georgia' : 'Bookman Old Style';
  const docxParagraphs = [];

  const createRun = (text, opts = {}) => {
    return new TextRun({
      text: text || '',
      font: fontName,
      size: opts.size || 22, // 11pt
      bold: !!opts.bold,
      italics: !!opts.italics,
      underline: opts.underline ? { type: UnderlineType.SINGLE } : undefined
    });
  };

  const createP = (text, opts = {}) => {
    return new Paragraph({
      alignment: opts.align || AlignmentType.LEFT,
      spacing: {
        line: 276, // 1.15 line spacing
        lineRule: 'auto',
        before: opts.before !== undefined ? opts.before : 0,
        after: opts.after !== undefined ? opts.after : 120
      },
      children: Array.isArray(text) ? text : [createRun(text, opts)]
    });
  };

  // Header Title
  if (isRups) {
    docxParagraphs.push(createP('BERITA ACARA', { align: AlignmentType.CENTER, bold: true, size: 26, after: 40 }));
    docxParagraphs.push(createP('RAPAT UMUM PEMEGANG SAHAM (RUPS) LUAR BIASA', { align: AlignmentType.CENTER, bold: true, size: 24, after: 40 }));
    docxParagraphs.push(createP(entitasNama, { align: AlignmentType.CENTER, bold: true, size: 24, after: 40 }));
    docxParagraphs.push(createP(`BERKEDUDUKAN DI - ${entitasKedudukan.toUpperCase()}`, { align: AlignmentType.CENTER, bold: true, size: 22, after: 240 }));

    const tglRups = (data.rups?.tanggal && data.rups.tanggal.trim()) ? formatTanggalAkta(data.rups.tanggal) : 'Jumat, tanggal dua puluh dua bulan November tahun dua ribu dua puluh empat (22-11-2024)';
    const jamRups = data.rups?.jam || '08.00 WIB';
    const tempatRups = data.rups?.tempat || 'Kantor Perseroan';

    docxParagraphs.push(createP(`- Pada hari ini, ${tglRups}, pukul ${jamRups}, dengan mengambil tempat di ${tempatRups}, telah diadakan Rapat Umum Pemegang Saham (RUPS) Luar Biasa perseroan terbatas ${entitasNama}, berkedudukan di ${entitasKedudukan}.`));
    docxParagraphs.push(createP('Acara Rapat Umum Pemegang Saham :', { bold: true, before: 120, after: 60 }));
    docxParagraphs.push(createP(`1. Pengeluaran ${formatSaham(mf.sahamKeluarJml)} lembar saham dalam simpanan atau senilai ${formatRupiah(mf.sahamKeluarNominal)};`));
    docxParagraphs.push(createP(`2. Peningkatan Modal Disetor semula ${formatRupiah(mf.modalSemulaNominal)} menjadi ${formatRupiah(mf.modalMenjadiNominal)};`));
    docxParagraphs.push(createP('Daftar Kehadiran Rapat Umum Pemegang Saham:', { bold: true, before: 120, after: 60 }));

    docxParagraphs.push(createP(`1. ${data.penghadap?.sapaan || 'Tuan'}. ${data.penghadap?.nama || ''}, lahir di ${data.penghadap?.tempatLahir || ''}, pada ${formatTanggalBiasa(data.penghadap?.tanggalLahir)}, Warga Negara ${data.penghadap?.kewarganegaraan || 'Indonesia'}, ${data.penghadap?.pekerjaan || 'Karyawan Swasta'}, bertempat tinggal di ${data.penghadap?.alamat || ''}, pemegang KTP nomor: ${data.penghadap?.nik || ''}, bertindak selaku: Direktur Perseroan;`));
    const hadirList = (Array.isArray(data.pemegangSaham) && data.pemegangSaham.length > 0)
      ? data.pemegangSaham
      : mf.pmList.map(ps => ({ nama: ps.nama, selaku: `Pemegang ${ps.jumlahSaham.toLocaleString('id-ID')} saham Perseroan` }));
    hadirList.forEach((ps, idx) => {
      docxParagraphs.push(createP(`${idx + 2}. ${ps.nama}, selaku: ${ps.selaku || 'Pemegang Saham Perseroan'};`));
    });

    docxParagraphs.push(createP('Bahwa sehubungan dengan penambahan setoran modal, pemegang saham telah melakukan setoran ke Rekening Perseroan dengan rincian bukti setor sebagai berikut:', { before: 120 }));
  } else {
    docxParagraphs.push(createP('KEPUTUSAN SIRKULER PARA PEMEGANG SAHAM', { align: AlignmentType.CENTER, bold: true, size: 26, after: 40 }));
    docxParagraphs.push(createP(entitasNama, { align: AlignmentType.CENTER, bold: true, size: 24, after: 40 }));
    docxParagraphs.push(createP(`Berkedudukan di - ${entitasKedudukan}`, { align: AlignmentType.CENTER, bold: true, size: 22, after: 240 }));

    docxParagraphs.push(createP(`- Mengambil Keputusan diluar Rapat Umum Pemegang Saham, sebagaimana dimaksud pada Pasal ${data.pt?.pasalSirkuler || '10 ayat (5)'} Anggaran Dasar Perseroan, oleh Para Pemegang Saham sebagai berikut:`));
    const hadirList = (Array.isArray(data.pemegangSaham) && data.pemegangSaham.length > 0)
      ? data.pemegangSaham
      : mf.pmList.map(ps => ({ nama: ps.nama, selaku: `Pemegang ${ps.jumlahSaham.toLocaleString('id-ID')} saham Perseroan` }));
    hadirList.forEach((ps) => {
      docxParagraphs.push(createP(`- ${ps.nama}, dalam hal ini bertindak selaku: ${ps.selaku || 'Pemegang Saham Perseroan'};`));
    });

    docxParagraphs.push(createP(`- Bahwa sehubungan dengan perkembangan usaha dan kebutuhan operasional Perseroan, maka perlu dilakukan penambahan modal kerja Perseroan sejumlah ${formatRupiah(mf.sahamKeluarNominal)}.`));
    docxParagraphs.push(createP(`- Bahwa sehubungan dengan kebutuhan tersebut diatas, maka Perseroan berkehendak untuk mengeluarkan sisa saham dalam simpanan sejumlah ${formatSaham(mf.sahamKeluarJml)} saham dalam simpanan atau senilai ${formatRupiah(mf.sahamKeluarNominal)}.`));
    docxParagraphs.push(createP('- Bahwa sehubungan dengan itu, telah dilakukan setoran ke Rekening Perseroan dengan rincian sebagai berikut:', { before: 120 }));
  }

  // TABEL 1: Rincian Bukti Setor Bank
  const tableData = isRups
    ? [
        { no: '1.', nominal: 'Rp 1.000.000.000,-', tgl: '24 April 2024', bank: 'Bank Mandiri', ref: 'BM 001' },
        { no: '2.', nominal: 'Rp 1.000.000.000,-', tgl: '15 Mei 2024', bank: 'Bank Mandiri', ref: 'BM 002' },
        { no: '3.', nominal: 'Rp 1.000.000.000,-', tgl: '20 Juni 2024', bank: 'Bank Mandiri', ref: 'BM 003' },
        { no: '4.', nominal: 'Rp 1.000.000.000,-', tgl: '18 Juli 2024', bank: 'Bank Mandiri', ref: 'BM 004' },
        { no: '5.', nominal: 'Rp 1.000.000.000,-', tgl: '22 Agustus 2024', bank: 'Bank Mandiri', ref: 'BM 005' }
      ]
    : [
        { no: '1.', nominal: 'Rp 700.000.000,-', tgl: '13 Januari 2025', bank: 'BCA', ref: 'M01H01' },
        { no: '2.', nominal: 'Rp 12.000.000.000,-', tgl: '24 Januari 2025', bank: 'Bank Mandiri', ref: 'MASTP 00001' },
        { no: '3.', nominal: 'Rp 41.500.000.000,-', tgl: '12 Februari 2025', bank: 'Bank Mandiri', ref: 'MASTP 01000' },
        { no: '4.', nominal: 'Rp 3.105.000.000,-', tgl: '17 Maret 2025', bank: 'Bank Mandiri', ref: 'MASTP 20200' },
        { no: '5.', nominal: 'Rp 29.000.000.000,-', tgl: '24 Maret 2025', bank: 'Bank Mandiri', ref: 'MASTP 111345' },
        { no: '6.', nominal: 'Rp 57.000.000.000,-', tgl: '28 April 2025', bank: 'Bank Mandiri', ref: 'MASTP 123456' },
        { no: '7.', nominal: 'Rp 1.000.000.000,-', tgl: '17 Juli 2025', bank: 'Bank Mandiri', ref: 'MASTP 7892101' },
        { no: '8.', nominal: 'Rp 36.500.000.000,-', tgl: '27 Agustus 2025', bank: 'Bank Mandiri', ref: 'MASTP 090801' },
        { no: '9.', nominal: 'Rp 77.500.000.000,-', tgl: '27 Oktober 2025', bank: 'Bank Mandiri', ref: 'MASTP 990123' }
      ];

  const headerCells = ['No.', 'Jumlah Setoran', 'Tanggal Setoran', 'Nama Bank', 'Nomor Bukti Setor'].map(title =>
    new TableCell({
      shading: { fill: 'F3F4F6' },
      children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [createRun(title, { bold: true, size: 20 })] })]
    })
  );

  const bodyRows = tableData.map(r =>
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [createRun(r.no, { size: 20 })] })] }),
        new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [createRun(r.nominal, { size: 20 })] })] }),
        new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [createRun(r.tgl, { size: 20 })] })] }),
        new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [createRun(r.bank, { size: 20 })] })] }),
        new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [createRun(r.ref, { size: 20 })] })] })
      ]
    })
  );

  const bankTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [new TableRow({ children: headerCells }), ...bodyRows]
  });

  docxParagraphs.push(bankTable);
  docxParagraphs.push(createP('', { after: 120 }));

  // TABEL 2: Susunan Pemegang Saham Baru
  docxParagraphs.push(createP('Susunan Kepemilikan Saham Perseroan Setelah Peningkatan Modal:', { bold: true, before: 120, after: 60 }));
  const pmList = mf.pmList;

  const shareHeaderCells = ['No.', 'Nama Pemegang Saham', 'Jumlah Saham (Lembar)', 'Nilai Nominal (Rp)'].map(title =>
    new TableCell({
      shading: { fill: 'F3F4F6' },
      children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [createRun(title, { bold: true, size: 20 })] })]
    })
  );

  const shareRows = pmList.map((ps, idx) =>
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [createRun(`${idx + 1}.`, { size: 20 })] })] }),
        new TableCell({ children: [new Paragraph({ children: [createRun(ps.nama, { size: 20 })] })] }),
        new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [createRun(formatSaham(ps.jumlahSaham), { size: 20 })] })] }),
        new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [createRun(formatRupiah(ps.nominal), { size: 20 })] })] })
      ]
    })
  );

  const totalSahamSemua = mf.modalMenjadiSaham;
  const totalNominalSemua = mf.modalMenjadiNominal;

  shareRows.push(
    new TableRow({
      children: [
        new TableCell({ columnSpan: 2, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [createRun('TOTAL KESELURUHAN', { bold: true, size: 20 })] })] }),
        new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [createRun(formatSaham(totalSahamSemua), { bold: true, size: 20 })] })] }),
        new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [createRun(formatRupiah(totalNominalSemua), { bold: true, size: 20 })] })] })
      ]
    })
  );

  const shareTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [new TableRow({ children: shareHeaderCells }), ...shareRows]
  });

  docxParagraphs.push(shareTable);

  // Penutup & Tanda Tangan
  const ttdKota = data?.notaris?.wilayah?.replace(/Kabupaten|Kota/i, '').trim() || 'Kudus';
  const ttdTgl = (isRups && data?.rups?.tanggal) ? formatTanggalBiasa(data.rups.tanggal) : ((data?.akta?.tanggal && data.akta.tanggal.trim()) ? formatTanggalBiasa(data.akta.tanggal) : '....................');

  docxParagraphs.push(createP(`Demikian dokumen ini disahkan dan ditandatangani oleh Para Pemegang Saham sebagai bentuk persetujuan.`, { before: 180, after: 120 }));
  docxParagraphs.push(createP(`${ttdKota}, ${ttdTgl}`, { after: 40 }));
  docxParagraphs.push(createP('Para Pemegang Saham Perseroan:', { bold: true, after: 360 }));

  if (isRups) {
    docxParagraphs.push(createP(`( ${data.penghadap?.sapaan || 'Tuan'}. ${data.penghadap?.nama || ''} )`, { underline: true, bold: true, after: 40 }));
    docxParagraphs.push(createP('Pimpinan Rapat', { after: 180 }));
  }

  const ttdSignatories = (Array.isArray(data.pemegangSaham) && data.pemegangSaham.length > 0)
    ? data.pemegangSaham
    : pmList.map(ps => ({ nama: ps.nama, selaku: `Pemegang ${ps.jumlahSaham.toLocaleString('id-ID')} saham Perseroan` }));

  ttdSignatories.forEach(ps => {
    docxParagraphs.push(createP(`( ${ps.nama} )`, { underline: true, bold: true, after: 40 }));
    docxParagraphs.push(createP(ps.selaku || 'Pemegang Saham', { after: 180 }));
  });

  // Assemble document
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 }, // A4
            margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } // Standard 1 inch
          }
        },
        children: docxParagraphs
      }
    ]
  });

  const blob = await Packer.toBlob(doc);
  const prefixName = isRups ? 'BA_RUPS_Modal' : 'Keputusan_Sirkuler_Modal';
  const filename = `${prefixName}_${cleanEntitasName}.docx`;
  if (typeof window !== 'undefined' && typeof saveAs === 'function' && !window.__TAURI__?.core?.invoke) {
    saveAs(blob, filename);
  }

  return { filename, blob };
}
