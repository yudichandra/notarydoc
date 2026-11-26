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
  TableLayoutType,
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
import { substitutePlaceholders, renderTemplateTextToLines, renderCustomTemplateSectionToLines } from './clauseTemplates.js';
import {
  formatTextToNotaryLines,
  formatCenterNotaryLines,
  formatDashedCenterHeading,
  formatOfficerColumnLines,
  sanitizeInlineField,
  sanitizeFilenameSegment,
  formatAlphaIndex,
  formatPtShareholderLabel,
  formatRupsJamText,
  extractCityFromWilayah
} from './notaryLineFormatter.js';

export { formatTextToNotaryLines };

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
  const rawNominalPerSaham = Number(pm.nominalPerSaham);
  const nominalPerSaham = (Number.isFinite(rawNominalPerSaham) && rawNominalPerSaham > 0) ? rawNominalPerSaham : 1000000;
  const sahamKeluarJml = Math.max(0, Number(pm.sahamSimpananDikeluarkanJml ?? pm.sahamDikeluarkanJml ?? 0) || 0);
  const sahamKeluarNominal = Math.max(0, Number(pm.sahamSimpananDikeluarkanNominal ?? pm.sahamDikeluarkanNominal ?? 0) || 0);
  const modalSemulaNominal = Math.max(0, Number(pm.modalSemulaNominal ?? 0) || 0);
  const modalSemulaSaham = Math.max(0, Number(pm.modalSemulaSaham ?? 0) || 0);
  const modalMenjadiNominal = Math.max(0, Number(pm.modalMenjadiNominal ?? 0) || 0);
  const modalMenjadiSaham = Math.max(0, Number(pm.modalMenjadiSaham ?? 0) || 0);

  const rawList = Array.isArray(pm.pemegangSahamModal) ? pm.pemegangSahamModal : [];

  const pmList = rawList.map(ps => {
    const jml = Math.max(0, Number(ps.jumlahSaham ?? ps.lembarSaham ?? 0) || 0);
    const nomRaw = ps.nominal ?? ps.totalNominal;
    const nom = nomRaw !== undefined && nomRaw !== '' ? Math.max(0, Number(nomRaw) || 0) : (jml * nominalPerSaham);
    return {
      nama: ps.nama || '',
      jumlahSaham: jml,
      nominal: nom,
      nominalPerSaham: (Number(ps.nominalPerSaham) > 0) ? Number(ps.nominalPerSaham) : nominalPerSaham,
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
  return parts.map(p => sanitizeInlineField(p)).filter(Boolean).join(', ');
}

/**
 * Menyusun seluruh baris isi akta (terformat 53 karakter per baris + garis '---')
 */
export function buildDeedContentLines(data, maxChars = 53, options = {}) {
  const isPreview = Boolean(options?.isPreview);
  const lines = [];
  const fmtSahamVal = (n) => (Number(n) > 0 ? formatSaham(n) : '..........');
  const fmtRupiahVal = (n) => (Number(n) > 0 ? formatRupiah(n) : 'Rp. ....................');
  const val = (str, fallback = '....................') => {
    const cleaned = sanitizeInlineField(str);
    return cleaned || fallback;
  };

  const tipe = (data?.badanUsaha && data.badanUsaha.tipe) || 'PT';
  const rawEntitasNama = sanitizeInlineField(data?.pt?.nama);
  const entitasNama = rawEntitasNama
    ? rawEntitasNama.toUpperCase()
    : (isPreview ? '..............................' : `USAHA ${tipe}`);
  const rawEntitasKedudukan = sanitizeInlineField(data?.pt?.kedudukan);
  const entitasKedudukan = rawEntitasKedudukan
    ? rawEntitasKedudukan.toUpperCase()
    : (isPreview ? '....................' : 'KABUPATEN');
  // Parsing data notaris: nama lengkap (tanpa gelar), gelar komparisi (panjang/dieja), dan gelar tanda tangan (singkat)
  const rawNotarisNamaClean = sanitizeInlineField(data?.notaris?.nama);
  const rawNotarisNama = rawNotarisNamaClean || (isPreview ? '' : 'GRENDI JAYA DARMAWAN');
  const notarisNamaClean = rawNotarisNama
    ? (rawNotarisNama.includes(',') ? rawNotarisNama.split(',')[0].trim() : rawNotarisNama).toUpperCase()
    : '........................................';
  const notarisGelarPanjang = sanitizeInlineField(data?.notaris?.gelarPanjang) || 'Sarjana Hukum, Magister Kenotariatan';
  const notarisGelarSingkat = sanitizeInlineField(data?.notaris?.gelarSingkat) ||
    (rawNotarisNama.includes(',') ? rawNotarisNama.substring(rawNotarisNama.indexOf(',') + 1).trim() : 'S.H., M.Kn.');
  const notarisWilayah = sanitizeInlineField(data?.notaris?.wilayah) ||
    (isPreview ? '....................' : 'Kabupaten Kudus');
  const notarisWilayahKap = notarisWilayah.toUpperCase();

  const tglAktaStr = (data?.akta?.tanggal && data.akta.tanggal.trim())
    ? formatTanggalAkta(data.akta.tanggal)
    : (isPreview ? '..................................................' : '....................');
  const jamAktaStr = (data?.akta?.jam && data.akta.jam.trim())
    ? formatJamAkta(data.akta.jam)
    : (isPreview ? 'pukul .............. Waktu Indonesia Barat' : '....................');

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

  let activeSectionNum = 1;
  let sectionStarted = false;

  const pushTrackedLine = (lineObj, fieldKeys = []) => {
    const entry = {
      ...lineObj,
      sectionNum: activeSectionNum,
      fieldKeys: lineObj.fieldKeys && lineObj.fieldKeys.length > 0 ? lineObj.fieldKeys : fieldKeys
    };
    if (!sectionStarted) {
      entry.isSectionStart = true;
      sectionStarted = true;
    }
    lines.push(entry);
  };

  const addCenterBlock = (rawText, opts = {}, fieldKeys = []) => {
    const centerLines = formatCenterNotaryLines(rawText, maxChars);
    centerLines.forEach(text => {
      pushTrackedLine({ text, align: 'center', bold: opts.bold !== undefined ? opts.bold : true, underline: !!opts.underline }, fieldKeys);
    });
  };

  const addDashedHeading = (title, fieldKeys = []) => {
    formatDashedCenterHeading(title, maxChars).forEach(text => {
      pushTrackedLine({ text, align: 'center', bold: true }, fieldKeys);
    });
  };

  const appendBlock = (rawText, fieldKeys = []) => {
    const formatted = formatTextToNotaryLines(rawText, maxChars);
    formatted.forEach(l => {
      pushTrackedLine({ text: l, align: 'left', bold: false }, fieldKeys);
    });
  };

  const appendCustomSectionOrFallback = (secNum, fallbackFn) => {
    activeSectionNum = secNum;
    sectionStarted = false;
    if (data.customTemplates && data.customTemplates[`section${secNum}`]) {
      const sLines = renderCustomTemplateSectionToLines(
        data.customTemplates[`section${secNum}`],
        data,
        secNum,
        maxChars,
        formatTextToNotaryLines,
        isPreview
      );
      sLines.forEach(l => pushTrackedLine(l));
    } else {
      fallbackFn();
    }
  };

  // 1. Judul & Kepala Akta (Center, Bold) & Komparisi Waktu & Notaris
  appendCustomSectionOrFallback(1, () => {
    if (tipe === 'PT' && subTipe === 'RUPS_MODAL') {
      addCenterBlock('AKTA PERNYATAAN KEPUTUSAN');
      addCenterBlock('RAPAT UMUM PEMEGANG SAHAM LUAR BIASA');
      addCenterBlock(`PERSEROAN TERBATAS "${entitasNama}"`, {}, ['ptNama']);
      addCenterBlock(`BERKEDUDUKAN DI - ${entitasKedudukan}`, {}, ['ptKedudukan']);
      addCenterBlock(`Nomor : ${val(data?.akta?.nomor, isPreview ? '........' : '4')} .-`, {}, ['aktaNomor']);
    } else {
      addCenterBlock(judulBaris1);
      addCenterBlock(judulBaris2);
      addCenterBlock(`“${entitasNama}”`, {}, ['ptNama']);
      addCenterBlock(`BERKEDUDUKAN DI – ${entitasKedudukan}`, {}, ['ptKedudukan']);
      addCenterBlock(`Nomor : ${val(data?.akta?.nomor, isPreview ? '........' : '1')} .-`, {}, ['aktaNomor']);
    }
    appendBlock(`- Pada hari ini, ${tglAktaStr}, ${jamAktaStr};`, ['aktaTanggal', 'aktaJam']);
    appendBlock(`- Berhadapan dengan saya, ${notarisNamaClean}, ${notarisGelarPanjang}, Notaris di ${notarisWilayah}, dengan dihadiri saksi-saksi, yang nama-namanya akan disebut pada bagian akhir akta ini:`, ['notarisNama', 'notarisGelarPanjang', 'notarisWilayah']);
  });

  // 3. Data Penghadap (Sesuai Pasal 38 UUJN & Contoh Original, langsung setelah Notaris)
  appendCustomSectionOrFallback(3, () => {
    const pSapaan = data?.penghadap?.sapaan || 'Tuan';
    const pNama = val(data?.penghadap?.nama, '..............................');
    const pTempat = val(data?.penghadap?.tempatLahir, isPreview ? '....................' : '..........');
    const pTgl = (data?.penghadap?.tanggalLahir && data.penghadap.tanggalLahir.trim()) ? formatTanggalBiasa(data.penghadap.tanggalLahir) : '....................';
    const pWn = val(data?.penghadap?.kewarganegaraan, 'Indonesia');
    const pPek = val(data?.penghadap?.pekerjaan, 'Karyawan Swasta');
    const pAlamat = val(data?.penghadap?.alamat, '..................................................');
    const pNik = val(data?.penghadap?.nik, '................');
    appendBlock(
      `- ${pSapaan}. ${pNama}, lahir di ${pTempat}, pada ${pTgl}, Warga Negara ${pWn}, ${pPek}, bertempat tinggal di ${pAlamat}, pemegang Kartu Tanda Penduduk nomor: ${pNik};`,
      ['penghadapSapaan', 'penghadapNama', 'penghadapTempatLahir', 'penghadapTanggalLahir', 'penghadapWn', 'penghadapPekerjaan', 'penghadapAlamat', 'penghadapNik']
    );
    if (tipe === 'PT' && subTipe === 'RUPS_MODAL') {
      appendBlock(`- Untuk keperluan dalam akta ini sementara waktu berada di ${extractCityFromWilayah(notarisWilayah, '....................')};`, ['notarisWilayah']);
    }
  });

  // 2. Riwayat Perusahaan & Legalitas (Komparasi mewakili perseroan + Riwayat Pendirian & Perubahan)
  const skPendirianLabel = tipe === 'PT' ? 'Pengesahan Pendirian Badan Hukum Perseroan Terbatas dari Menteri Hukum dan Hak Asasi Manusia Republik Indonesia, satu dan lain sebagaimana ternyata dari Surat Keputusan Menteri Hukum dan Hak Asasi Manusia Republik Indonesia' : (tipe === 'UD' ? 'NIB / OSS' : 'Kemenkumham RI (SABU) / Pengadilan');
  const skPerubahanLabel = tipe === 'PT' ? 'persetujuan dari Menteri Hukum Republik Indonesia berupa Surat Keputusan Menteri Hukum Republik Indonesia' : (tipe === 'UD' ? 'Pembaruan NIB / Izin Usaha' : 'Kemenkumham RI (SABU)');

  const notarisPerubStr = val(data?.pt?.aktaPerubahanNotaris, isPreview ? '..............................' : '....................');
  const notarisPerubWil = val(data?.pt?.aktaPerubahanWilayah, '....................');
  const notarisPerubFormat = notarisPerubStr.toLowerCase().startsWith('saya')
    ? `${notarisPerubStr},`
    : `${notarisPerubStr}, Notaris di ${notarisPerubWil},`;

  const notarisPendStr = val(data?.pt?.aktaPendirianNotaris, isPreview ? '..............................' : '....................');
  const notarisPendWil = val(data?.pt?.aktaPendirianWilayah, '....................');
  const notarisPendFormat = notarisPendStr.toLowerCase().startsWith('saya')
    ? `${notarisPendStr},`
    : `${notarisPendStr}, Notaris di ${notarisPendWil},`;

  appendCustomSectionOrFallback(2, () => {
    const tglPend = (data?.pt?.aktaPendirianTgl && data.pt.aktaPendirianTgl.trim()) ? formatTanggalTanpaAwalan(data.pt.aktaPendirianTgl) : (isPreview ? '....................' : '..........');
    const noPend = val(data?.pt?.aktaPendirianNomor, isPreview ? '......' : '..........');
    const tglSkPend = (data?.pt?.skPendirianTgl && data.pt.skPendirianTgl.trim()) ? formatTanggalTanpaAwalan(data.pt.skPendirianTgl) : (isPreview ? '....................' : '..........');
    const noSkPend = val(data?.pt?.skPendirianNomor, isPreview ? '..............................' : '..........');
    const tglPerub = (data?.pt?.aktaPerubahanTgl && data.pt.aktaPerubahanTgl.trim()) ? formatTanggalTanpaAwalan(data.pt.aktaPerubahanTgl) : (isPreview ? '....................' : '..........');
    const noPerub = val(data?.pt?.aktaPerubahanNomor, isPreview ? '......' : '..........');
    const tglSkPerub = (data?.pt?.skPerubahanTgl && data.pt.skPerubahanTgl.trim()) ? formatTanggalTanpaAwalan(data.pt.skPerubahanTgl) : (isPreview ? '....................' : '..........');
    const noSkPerub = val(data?.pt?.skPerubahanNomor, isPreview ? '..............................' : '..........');
    const noPemberitahuan = val(data?.pt?.pemberitahuanPerubahanNomor, isPreview ? '..............................' : '-');

    const section2FieldKeys = [
      'penghadapJabatan', 'ptNama', 'ptKedudukan',
      'ptAktaPendirianTgl', 'ptAktaPendirianNomor', 'ptAktaPendirianNotaris', 'ptAktaPendirianWilayah',
      'ptSkPendirianTgl', 'ptSkPendirianNomor',
      'ptAktaPerubahanTgl', 'ptAktaPerubahanNomor', 'ptAktaPerubahanNotaris', 'ptAktaPerubahanWilayah',
      'ptSkPerubahanTgl', 'ptSkPerubahanNomor', 'ptPemberitahuanPerubahanNomor'
    ];

    if (tipe === 'PT' && (subTipe === 'SIRKULER_MODAL' || subTipe === 'RUPS_MODAL')) {
      const jabatanPenghadap = val(data?.penghadap?.jabatan, subTipe === 'SIRKULER_MODAL' ? 'Direktur Utama' : 'Direktur');
      appendBlock(`- Menurut keterangannya, penghadap dalam hal ini bertindak dalam jabatannya selaku ${jabatanPenghadap}, dari dan selaku demikian untuk dan atas nama perseroan terbatas ${entitasNama}, berkedudukan di ${entitasKedudukan} (selanjutnya akan disebut juga “${sebutanEntitasKap}”), yang Anggaran Dasarnya didirikan dengan Akta Pendirian tertanggal ${tglPend}, Nomor. ${noPend}, yang dibuat dihadapan ${notarisPendFormat} akta mana telah mendapatkan ${skPendirianLabel} pada tanggal ${tglSkPend}, Nomor. ${noSkPend}, Akta mana telah mengalami perubahan sebagaimana ternyata melalui Akta tertanggal ${tglPerub}, Nomor. ${noPerub}, yang dibuat dihadapan ${notarisPerubFormat} akta mana telah mendapatkan ${skPerubahanLabel} tertanggal ${tglSkPerub}, Nomor. ${noSkPerub} dan Penerimaan Pemberitahuan Perubahan Anggaran Dasar Kementerian Hukum Republik Indonesia tertanggal ${tglSkPerub}, Nomor. ${noPemberitahuan};`, section2FieldKeys);
    } else {
      const jabatanPenghadap = val(data?.penghadap?.jabatan, tipe === 'PT' ? 'Direktur' : (tipe === 'UD' ? 'Pemilik' : 'Persero Pengurus'));
      const notarisPendDahulu = val(data?.pt?.aktaPendirianNotaris, isPreview ? '..............................' : '..........');
      const wilayahPendDahulu = val(data?.pt?.aktaPendirianWilayah, isPreview ? '....................' : '..........');
      const riwayatText = `- menurut keterangannya, penghadap dalam hal ini bertindak dalam jabatannya selaku ${jabatanPenghadap}, untuk dan oleh karenanya secara sah mewakili ${sebutanEntitas} “${entitasNama}”, berkedudukan di ${entitasKedudukan} (selanjutnya akan disebut juga “${sebutanEntitasKap}”), yang Anggaran Dasarnya didirikan dengan Akta Pendirian tertanggal ${tglPend}, Nomor. ${noPend}, yang dibuat dihadapan ${notarisPendDahulu}, dahulu Notaris di ${wilayahPendDahulu}, akta mana telah mendapatkan ${skPendirianLabel} pada tanggal ${tglSkPend}, Nomor. ${noSkPend}, akta mana telah beberapa kali mengalami perubahan, yang terakhir melalui Akta tertanggal ${tglPerub}, Nomor. ${noPerub}, yang dibuat dihadapan ${notarisPerubFormat} akta mana telah mendapatkan ${skPerubahanLabel} tertanggal ${tglSkPerub}, Nomor. ${noSkPerub} dan telah diberitahukan kepada Menteri Hukum dan Hak Asasi Manusia Republik Indonesia, sebagaimana bukti penerimaan pemberitahuannya ternyata dari Penerimaan Pemberitahuan Perubahan Anggaran Dasar Kementerian Hukum dan Hak Asasi Manusia Republik – Indonesia tertanggal ${tglSkPerub}, Nomor. ${noPemberitahuan};`;
      appendBlock(riwayatText, section2FieldKeys);
    }
  });

  // 4. Modal & Dokumen Sirkuler / RUPS
  appendCustomSectionOrFallback(4, () => {
    appendBlock(`- Penghadap bertindak dalam kedudukannya tersebut diatas dengan ini menerangkan :`);

    if (tipe === 'PT' && subTipe === 'RUPS_MODAL') {
      const mf = resolveModalFields(data, true);
      const tglRupsStr = (data?.rups?.tanggal && data.rups.tanggal.trim())
        ? formatTanggalAkta(data.rups.tanggal)
        : '..................................................';
      const jamRupsStr = formatRupsJamText(data?.rups?.jam, '.............. WIB');
      const tempatRupsStr = val(data?.rups?.tempat, 'Kantor Perseroan');
      const kuorumSaham = Number(data?.rups?.sahamHadir || mf.modalSemulaSaham);
      const strKuorum = fmtSahamVal(kuorumSaham);
      const defaultPimpinan = `${data?.penghadap?.sapaan || 'Tuan'}. ${val(data?.penghadap?.nama, '....................')}`;
      const pimpinanRupsStr = val(data?.rups?.pimpinan, defaultPimpinan);
      const pengambilText = joinParts([
        val(data?.peningkatanModal?.pengambilNama, 'perseroan terbatas ....................'),
        data?.peningkatanModal?.pengambilKedudukan ? `berkedudukan di ${data.peningkatanModal.pengambilKedudukan}` : '',
        data?.peningkatanModal?.pengambilAktaPendirian,
        data?.peningkatanModal?.pengambilAktaPerubahan
      ]);
      const pelepasText = joinParts([
        val(data?.peningkatanModal?.pelepasanNama, 'perseroan terbatas ....................'),
        data?.peningkatanModal?.pelepasanKedudukan ? `berkedudukan di ${data.peningkatanModal.pelepasanKedudukan}` : '',
        data?.peningkatanModal?.pelepasanLegalitas
      ]);

      appendBlock(`- Bahwa pada hari ${tglRupsStr}, pukul ${jamRupsStr}, dengan mengambil tempat di ${tempatRupsStr}, telah diadakan Rapat Umum Pemegang Saham (RUPS) Luar Biasa perseroan terbatas ${entitasNama}, berkedudukan di ${entitasKedudukan}.`, ['rupsTanggal', 'rupsJam', 'rupsTempat', 'ptNama', 'ptKedudukan']);
      appendBlock(`Acara Rapat Umum Pemegang Saham :`);
      appendBlock(`1. Pengeluaran ${fmtSahamVal(mf.sahamKeluarJml)} lembar saham dalam simpanan atau senilai ${fmtRupiahVal(mf.sahamKeluarNominal)};`, ['sahamSimpananDikeluarkanJml', 'sahamSimpananDikeluarkanNominal']);
      appendBlock(`2. Peningkatan Modal Disetor semula ${fmtRupiahVal(mf.modalSemulaNominal)} menjadi ${fmtRupiahVal(mf.modalMenjadiNominal)};`, ['modalSemulaNominal', 'modalMenjadiNominal']);
      appendBlock(`- Bahwa dalam rapat tersebut telah hadir dan/atau diwakili sejumlah ${strKuorum} saham yang merupakan keseluruhan saham yang telah dikeluarkan oleh Perseroan;`, ['rupsSahamHadir', 'modalSemulaSaham']);
      appendBlock(`- Bahwa surat-surat saham yang diwakili sampai sekarang belum dicetak, namun demikian penghadap menjamin keadaannya baik jumlah dan kepemilikan saham sesuai dengan keadaan yang sebenarnya;`);
      appendBlock(`- Bahwa dalam rapat tersebut ${pimpinanRupsStr} bertindak selaku Pimpinan Rapat;`, ['penghadapSapaan', 'penghadapNama', 'rupsPimpinan']);
      appendBlock(`- Bahwa hal-hal yang dibicarakan serta diputuskan dalam rapat tersebut telah dibuatkan Berita Acara Rapat di bawah tangan bermeterai cukup dan dilekatkan pada minuta akta ini;`);
      appendBlock(`- Bahwa berdasarkan kuasa yang diberikan dalam Rapat tersebut, penghadap diberi hak dan wewenang untuk menyatakan keputusan rapat dalam suatu akta Notaris;`);
      appendBlock(`- Berdasarkan apa yang diuraikan diatas, penghadap menyatakan Rapat Umum Pemegang Saham Luar Biasa dengan suara bulat telah memutuskan:`);
      appendBlock(`1) MENYETUJUI, pengeluaran ${fmtSahamVal(mf.sahamKeluarJml)} saham dalam simpanan atau senilai ${fmtRupiahVal(mf.sahamKeluarNominal)} yang diambil bagian dan disetor penuh oleh ${pengambilText}, sedangkan pemegang saham lainnya, yaitu ${pelepasText}, menyatakan tidak ikut mengambil bagian atas saham-saham yang dikeluarkan oleh Perseroan, serta mengesampingkan segala hak yang dimilikinya termasuk dan tidak terbatas pada hak untuk mendapatkan penawaran terlebih dahulu (pre-emptive rights);`, ['sahamSimpananDikeluarkanJml', 'sahamSimpananDikeluarkanNominal', 'pengambilNama', 'pengambilKedudukan', 'pengambilAktaPendirian', 'pengambilAktaPerubahan', 'pelepasanNama', 'pelepasanKedudukan', 'pelepasanLegalitas']);
      appendBlock(`2) MENYETUJUI, peningkatan Modal Ditempatkan dan Disetor semula ${fmtRupiahVal(mf.modalSemulaNominal)} menjadi ${fmtRupiahVal(mf.modalMenjadiNominal)};`, ['modalSemulaNominal', 'modalMenjadiNominal']);
      appendBlock(`- Sehingga susunan kepemilikan saham perseroan terbatas ${entitasNama}, tersebut diatas adalah sebagai berikut :`, ['ptNama']);
    } else if (tipe === 'PT' && subTipe === 'SIRKULER_MODAL') {
      const mf = resolveModalFields(data, false);
      const pengambilText = joinParts([
        val(data?.peningkatanModal?.pengambilNama, 'perseroan terbatas ....................'),
        data?.peningkatanModal?.pengambilKedudukan ? `berkedudukan di ${data.peningkatanModal.pengambilKedudukan}` : '',
        data?.peningkatanModal?.pengambilAktaPendirian,
        data?.peningkatanModal?.pengambilAktaPerubahan
      ]);
      const pelepasText = joinParts([
        val(data?.peningkatanModal?.pelepasanNama, 'perseroan terbatas ....................'),
        data?.peningkatanModal?.pelepasanKedudukan ? `berkedudukan di ${data.peningkatanModal.pelepasanKedudukan}` : '',
        data?.peningkatanModal?.pelepasanLegalitas
      ]);

      appendBlock(`- Bahwa para pemegang saham Perseroan telah mengambil keputusan sebagaimana ternyata dari –`);
      addDashedHeading('KEPUTUSAN SIRKULER PARA PEMEGANG SAHAM');
      appendBlock(`perseroan terbatas ${entitasNama} yang dibuat secara dibawah tangan, ditandatangani oleh para pemegang saham Perseroan dan telah dibubuhi materai cukup dan dilekatkan pada minuta akta ini;`, ['ptNama']);
      const totalSahamAwal = Number(mf.modalSemulaSaham || data?.saham?.totalSeriA || 0);
      appendBlock(`- Bahwa Keputusan Sirkuler Pemegang Saham tersebut telah ditandatangani sebagai bentuk persetujuan oleh seluruh pemegang saham dengan jumlah ${fmtSahamVal(totalSahamAwal)} lembar saham, jumlah mana merupakan keseluruhan saham yang telah dikeluarkan dan diambil bagian oleh para pemegang saham dalam perseroan;`, ['modalSemulaSaham']);
      appendBlock(`- Bahwa surat-surat saham yang diwakili sampai sekarang belum dicetak, namun demikian penghadap menjamin keadaannya baik jumlah dan kepemilikan saham sesuai dengan keadaan yang sebenarnya;`);
      appendBlock(`- Bahwa Keputusan Sirkuler Para Pemegang Saham tersebut adalah harus dianggap sama dengan keputusan yang diambil dalam setiap rapat umum pemegang saham Perseroan berdasarkan Pasal ${val(data?.pt?.pasalSirkuler, '10 ayat (5)')} dan oleh karenanya sah serta mengikat sesuai dengan ketentuan yang termaktub dalam Anggaran Dasar Perseroan;`, ['ptPasalSirkuler']);
      appendBlock(`- Bahwa penghadap ${data?.penghadap?.sapaan || 'Tuan'}. ${val(data?.penghadap?.nama, '....................')} yang bertindak dalam kedudukannya sebagaimana diatas dan dengan mempergunakan kekuatan kuasa yang diberikan oleh Para Pemegang Saham Perseroan berdasarkan Keputusan Sirkuler Pemegang Saham sekarang hendak menyatakan Keputusan Sirkuler Pemegang Saham tersebut dalam suatu akta Notaris.`, ['penghadapSapaan', 'penghadapNama']);
      appendBlock(`- Berdasarkan dengan apa yang telah diuraikan diatas, penghadap menyatakan para pemegang saham Perseroan telah mengambil keputusan sebagai berikut:`);
      appendBlock(`1) MENYETUJUI, Pengeluaran ${fmtSahamVal(mf.sahamKeluarJml)} saham simpanan atau senilai ${fmtRupiahVal(mf.sahamKeluarNominal)} yang diambil bagian dan disetor penuh oleh ${pengambilText}, sedangkan pemegang saham lainnya, yaitu ${pelepasText}, menyatakan tidak ikut mengambil bagian atas saham-saham yang dikeluarkan oleh Perseroan, serta mengesampingkan segala hak yang dimilikinya termasuk dan tidak terbatas pada hak untuk mendapatkan penawaran terlebih dahulu (pre-emptive rights);`, ['sahamSimpananDikeluarkanJml', 'sahamSimpananDikeluarkanNominal', 'pengambilNama', 'pengambilKedudukan', 'pengambilAktaPendirian', 'pengambilAktaPerubahan', 'pelepasanNama', 'pelepasanKedudukan', 'pelepasanLegalitas']);
      appendBlock(`2) MENYETUJUI, Meningkatkan Modal Ditempatkan dan Disetor Perseroan semula ${fmtRupiahVal(mf.modalSemulaNominal)} menjadi ${fmtRupiahVal(mf.modalMenjadiNominal)};`, ['modalSemulaNominal', 'modalMenjadiNominal']);
      appendBlock(`- Sehingga susunan kepemilikan saham perseroan terbatas ${entitasNama} adalah sebagai berikut:`, ['ptNama']);
    } else {
      appendBlock(`- Bahwa ${tipe === 'PT' ? 'para pemegang saham' : (tipe === 'UD' ? 'pemilik usaha' : 'para pesero')} ${sebutanEntitasKap} telah mengambil keputusan sebagaimana ternyata dari –`);

      const rawJudulSirkuler = `KEPUTUSAN SIRKULER ${tipe === 'PT' ? 'PARA PEMEGANG SAHAM' : (tipe === 'UD' ? 'PEMILIK USAHA' : 'PARA PESERO')}`;
      addDashedHeading(rawJudulSirkuler);

      appendBlock(`${sebutanEntitas} “${entitasNama}” yang dibuat secara dibawah tangan, ditandatangani oleh ${labelPemberiKuasa} dan telah dibubuhi materai cukup dan dilekatkan pada minuta akta ini selanjutnya akan disebut juga “Keputusan Sirkuler ${labelSirkuler}”;`, ['ptNama']);

      if (tipe === 'PT') {
        const sA = Number(data?.saham?.totalSeriA || 0);
        const sB = Number(data?.saham?.totalSeriB || 0);
        const strSA = (sA > 0 || !isPreview) ? formatSaham(sA) : '..........';
        const strSB = (sB > 0 || !isPreview) ? formatSaham(sB) : '..........';
        appendBlock(`- Bahwa Keputusan Sirkuler Pemegang Saham tersebut telah ditandatangani sebagai bentuk persetujuan oleh seluruh pemegang saham dengan jumlah ${strSA} saham seri-A dan ${strSB} saham seri-B, jumlah mana merupakan keseluruhan saham yang telah dikeluarkan dan diambil bagian oleh para pemegang saham dalam perseroan;`, ['totalSahamSeriA', 'totalSahamSeriB']);
        appendBlock(`- Bahwa surat-surat saham yang diwakili sampai sekarang belum dicetak, namun demikian penghadap menjamin keadaannya baik jumlah dan kepemilikan saham sesuai dengan keadaan yang sebenarnya;`);
        appendBlock(`- Bahwa Keputusan Sirkuler Para Pemegang Saham tersebut adalah harus dianggap sama dengan keputusan yang diambil dalam setiap rapat umum pemegang saham Perseroan berdasarkan Pasal ${val(data?.pt?.pasalSirkuler, '10 ayat (5)')} Anggaran Dasar Perseroan. Oleh karena itu, seluruh keputusan yang diambil dalam Keputusan Sirkuler ini adalah sah dan mengikat;`, ['ptPasalSirkuler']);
      } else {
        const totalMod = Number(data?.modal ? data.modal.totalNominal : 0);
        const totalModalStr = (totalMod > 0 || !isPreview) ? formatRupiah(totalMod) : 'Rp. ....................';
        appendBlock(`- Bahwa modal yang ditempatkan dan disetor penuh dalam ${sebutanEntitas} ini adalah sebesar ${totalModalStr}, yang terbagi ke dalam bagian-bagian modal (inbreng) para pesero/pemilik secara sah;`, ['totalModalNominal']);
        appendBlock(`- Bahwa keputusan ini adalah sah, mengikat, dan memiliki kekuatan hukum yang sempurna berdasarkan ketentuan Anggaran Dasar dan peraturan perundang-undangan yang berlaku di Republik Indonesia;`);
      }

      appendBlock(`- Bahwa penghadap ${data?.penghadap?.sapaan || 'Tuan'}. ${val(data?.penghadap?.nama, '....................')}, yang bertindak dalam kedudukannya sebagaimana diatas, dan dengan mempergunakan kekuatan kuasa yang diberikan oleh ${labelPemberiKuasa} berdasarkan Keputusan Sirkuler ${labelSirkuler} sekarang hendak menyatakan Keputusan Sirkuler ${labelSirkuler} tersebut dalam suatu akta Notaris.`, ['penghadapSapaan', 'penghadapNama']);
      appendBlock(`- Berdasarkan dengan apa yang telah diuraikan diatas, penghadap ${data?.penghadap?.sapaan || 'Tuan'}. ${val(data?.penghadap?.nama, '....................')}, menyatakan ${labelPemberiKuasa} telah mengambil keputusan sebagai berikut:`, ['penghadapSapaan', 'penghadapNama']);
    }
  });

  // 5. Susunan Pengurus Baru ATAU Perubahan Pasal 4 Anggaran Dasar (Peningkatan Modal)
  appendCustomSectionOrFallback(5, () => {
    if (tipe === 'PT' && (subTipe === 'SIRKULER_MODAL' || subTipe === 'RUPS_MODAL')) {
      const isRups = subTipe === 'RUPS_MODAL';
      const mf = resolveModalFields(data, isRups);
      const pmList = mf.pmList;

      // Daftar rincian susunan pemegang saham baru
      if (pmList.length > 0) {
        pmList.forEach((ps, idx) => {
          const pLabel = `${formatAlphaIndex(idx)}. `;
          const rawPsNama = formatPtShareholderLabel(ps.nama, 'perseroan terbatas ....................');
          appendBlock(`${pLabel}${rawPsNama}, tersebut diatas sebanyak ${fmtSahamVal(ps.jumlahSaham)} saham atau senilai ${fmtRupiahVal(ps.nominal)};`, ['pemegangSahamModal']);
        });
      } else {
        appendBlock(`a. perseroan terbatas ...................., tersebut diatas sebanyak .......... saham atau senilai Rp. ....................;`, ['pemegangSahamModal']);
      }

      const totalSahamSemua = mf.modalMenjadiSaham;
      const totalNominalSemua = mf.modalMenjadiNominal;
      if (totalSahamSemua > 0 && totalNominalSemua > 0) {
        appendBlock(`- Sehingga total seluruhnya adalah sebanyak ${formatSaham(totalSahamSemua)} saham atau senilai ${formatRupiah(totalNominalSemua)};`, ['modalMenjadiSaham', 'modalMenjadiNominal']);
      }

      appendBlock(`- Dengan demikian mengubah Pasal 4 ayat (2) Anggaran Dasar perseroan, sehingga untuk selanjutnya tertulis dan berbunyi sebagai berikut:`);
      addDashedHeading('M O D A L');
      addDashedHeading('Pasal 4');
      appendBlock(`2. Dari Modal Dasar tersebut telah ditempatkan dan disetor sebagian, sebanyak ${fmtSahamVal(totalSahamSemua)} saham dengan nilai nominal seluruhnya sebesar ${fmtRupiahVal(totalNominalSemua)} oleh para pemegang saham yang telah mengambil bagian saham dengan rincian serta nilai nominal saham yang akan disebutkan pada akhir akta ini.`, ['modalMenjadiSaham', 'modalMenjadiNominal']);
      appendBlock(`- Bahwa dengan adanya peningkatan modal pada keputusan ini, dan bertalian dengan Modal Ditempatkan dan Modal Disetor sebagaimana dimaksud dalam pasal 4 ayat (2), maka bagian akhir Anggaran Dasar Perseroan menjadi berbunyi sebagai berikut:`);
      appendBlock(`- Modal ditempatkan sebagaimana dimaksud dalam Pasal 4 ayat (2) telah disetor penuh dengan uang tunai melalui kas perseroan oleh para pemegang saham:`);

      // Rincian Penyetoran Saham format Kolom Notaris
      if (pmList.length > 0) {
        pmList.forEach((ps, idx) => {
          const psNum = `${idx + 1}. `;
          const rawPsNama = formatPtShareholderLabel(ps.nama, 'perseroan terbatas ....................');
          appendBlock(`${psNum}${rawPsNama}, tersebut diatas, sebanyak ${fmtSahamVal(ps.jumlahSaham)} saham, dengan nilai nominal ${fmtRupiahVal(ps.nominalPerSaham)} per saham, atau seluruhnya sebesar ${fmtRupiahVal(ps.nominal)};`, ['pemegangSahamModal', 'nominalPerSaham']);
        });
      } else {
        appendBlock(`1. perseroan terbatas ...................., tersebut diatas, sebanyak .......... saham, dengan nilai nominal ${fmtRupiahVal(mf.nominalPerSaham)} per saham, atau seluruhnya sebesar Rp. ....................;`, ['pemegangSahamModal', 'nominalPerSaham']);
      }

      if (totalSahamSemua > 0 && totalNominalSemua > 0) {
        appendBlock(`- Sehingga seluruhnya berjumlah ${formatSaham(totalSahamSemua)} saham dengan nilai nominal seluruhnya sebesar ${formatRupiah(totalNominalSemua)};`, ['modalMenjadiSaham', 'modalMenjadiNominal']);
      }

      const docTglStr = (isRups && data?.rups?.tanggal)
        ? formatTanggalBiasa(data.rups.tanggal)
        : ((data?.akta?.tanggal && data.akta.tanggal.trim()) ? formatTanggalBiasa(data.akta.tanggal) : '....................');
      const kotaTtd = extractCityFromWilayah(notarisWilayah, '....................');

      const ttdList = (Array.isArray(data?.pemegangSaham) && data.pemegangSaham.length > 0)
        ? data.pemegangSaham
        : (pmList.length > 0
          ? pmList.map(ps => ({ nama: ps.nama, selaku: `Pemegang ${ps.jumlahSaham.toLocaleString('id-ID')} saham Perseroan` }))
          : [{ nama: '..............................', selaku: 'Pemegang .......... saham Perseroan' }]);

      if (isRups) {
        const ttdPimpinan = val(data?.rups?.pimpinan, `${data?.penghadap?.sapaan || 'Tuan'}. ${val(data?.penghadap?.nama, '....................')}`);
        appendBlock(`- Demikian Berita Acara Rapat Umum Pemegang Saham ini, disahkan dan ditandatangani oleh Para Pemegang Saham sebagai bentuk persetujuan;`);
        appendBlock(`${kotaTtd}, ${docTglStr}`, ['notarisWilayah', 'rupsTanggal', 'aktaTanggal']);
        appendBlock(`Para Pemegang Saham Perseroan`);
        appendBlock(`materai sepuluh ribu rupiah`);
        appendBlock(`tanda tangan tidak terbaca`);
        appendBlock(ttdPimpinan, ['penghadapSapaan', 'penghadapNama', 'rupsPimpinan']);
        appendBlock(`Pimpinan Rapat;`);
      } else {
        appendBlock(`- Demikian Keputusan Sirkuler Para Pemegang Saham ini, disahkan dan ditandatangani oleh Para Pemegang Saham sebagai bentuk persetujuan;`);
        appendBlock(`${kotaTtd}, ${docTglStr}`, ['notarisWilayah', 'aktaTanggal']);
        appendBlock(`Para Pemegang Saham Perseroan`);
        appendBlock(`materai sepuluh ribu rupiah`);
        appendBlock(`tanda tangan tidak terbaca`);
      }
      ttdList.forEach(ps => {
        appendBlock(val(ps.nama, '..............................'), ['pemegangSaham', 'pemegangSahamModal']);
        appendBlock(`${val(ps.selaku, 'Pemegang Saham Perseroan')};`, ['pemegangSaham', 'pemegangSahamModal']);
      });
    } else {
      appendBlock(`1) MENYETUJUI, untuk memberhentikan dengan hormat ${labelOrganLama} terhitung sejak tanggal Keputusan Sirkuler ini berlaku efektif dan memberikan pengesahan atas tindakan kepengurusan dan pengawasan ${labelOrganLama} dalam melakukan tindakan hukum atas nama ${sebutanEntitasKap}, sepanjang tindakan-tindakan hukum dimaksud sesuai/tidak menyimpang dari ketentuan dalam Anggaran Dasar ${sebutanEntitasKap} dan tercermin dalam laporan keuangan tahunan ${sebutanEntitasKap}, berikut dengan memberikan pelepasan dan pelunasan (Acquit et Decharge) sepenuhnya atas pelaksanaan pengurusan dan pengawasan yang telah dijalankan; Mengubah susunan ${tipe === 'PT' ? 'Direksi dan Dewan Komisaris yang' : labelOrganBaru} baru sejak tanggal efektif keputusan ini sampai dengan ${val(data?.keputusan?.masaJabatan, isPreview ? '..........' : '5 (lima)')} tahun mendatang, sehingga ${labelOrganBaru} menjadi sebagai berikut:`, ['masaJabatan', 'tglEfektif']);

      if (Array.isArray(data?.pengurusBaru) && data.pengurusBaru.length > 0) {
        data.pengurusBaru.forEach(pejabat => {
          const rawTitle = val(pejabat.jabatan, 'PENGURUS').toUpperCase();
          const tglLahirStr = (pejabat.tanggalLahir && pejabat.tanggalLahir.trim()) ? formatTanggalBiasa(pejabat.tanggalLahir) : (isPreview ? '....................' : '');
          const pSap = val(pejabat.sapaan, 'Tuan');
          const pNm = val(pejabat.nama, '....................');
          const pTmp = val(pejabat.tempatLahir, '....................');
          const pWn = val(pejabat.kewarganegaraan, 'Indonesia');
          const pPek = val(pejabat.pekerjaan, 'Karyawan Swasta');
          const pAlm = val(pejabat.alamat, '....................');
          const pNik = val(pejabat.nik, '................');
          const rawOfficerRight = `${pSap}. ${pNm}, lahir di ${pTmp}, pada ${tglLahirStr}, Warga Negara ${pWn}, ${pPek}, bertempat tinggal di ${pAlm}, pemegang Kartu Tanda Penduduk nomor: ${pNik};`;

          formatOfficerColumnLines(rawTitle, rawOfficerRight, maxChars, formatTextToNotaryLines).forEach(lineObj => {
            pushTrackedLine(lineObj, ['pengurusBaru']);
          });
        });
      } else if (isPreview) {
        formatOfficerColumnLines(
          'PENGURUS BARU',
          'Tuan. ......................., lahir di .........., pada ...................., Warga Negara Indonesia, Karyawan Swasta, bertempat tinggal di ...................., pemegang Kartu Tanda Penduduk nomor: ................;',
          maxChars,
          formatTextToNotaryLines
        ).forEach(lineObj => {
          pushTrackedLine(lineObj, ['pengurusBaru']);
        });
      }

      appendBlock(`2) MENYETUJUI, bahwa terhitung sejak tanggal efektif pengangkatan ${tipe === 'PT' ? 'Direksi dan Dewan Komisaris tersebut diatas, kepada masing-masing Direktur dan Komisaris' : `${labelOrganBaru} tersebut diatas, kepada masing-masing pengurus`} diberikan kuasa, kewajiban, hak, dan kewenangan sesuai dengan tugas dan jabatan yang diemban menurut dan/atau berdasarkan Anggaran Dasar ${sebutanEntitasKap} maupun Undang-Undang yang berlaku dengan tanpa ada yang dikecualikan.`);

      appendBlock(`- Demikian Keputusan Sirkuler ${labelSirkuler} ini, mempunyai kekuatan hukum yang sama dengan keputusan yang diambil secara sah dalam Rapat Umum Pemegang Saham Perseroan;`);

      appendBlock(labelPemberiKuasa);
      appendBlock('materai sepuluh ribu rupiah');
      appendBlock('tanda tangan tidak terbaca');

      if (tipe === 'PT' && Array.isArray(data?.pemegangSaham) && data.pemegangSaham.length > 0) {
        data.pemegangSaham.forEach((ps) => {
          appendBlock(val(ps.nama, '..............................'), ['pemegangSaham']);
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
          appendBlock(desc, ['pemegangSaham']);
          appendBlock(`Tanggal : ${ps.tanggalTtd || (isPreview ? '....................' : '-')};`, ['pemegangSaham']);
        });
      } else if (tipe !== 'PT' && Array.isArray(data?.sekutu) && data.sekutu.length > 0) {
        data.sekutu.forEach((sk) => {
          appendBlock(val(sk.nama, '..............................'), ['sekutu']);
          const nominalVal = Number(sk.nominalInbreng || 0);
          const nominalStr = (nominalVal > 0 || !isPreview) ? formatRupiah(nominalVal) : 'Rp. ....................';
          appendBlock(`${sk.statusSekutu || 'Sekutu'} – selaku penyetor modal inbreng sebesar ${nominalStr} (${sk.persentase || '0'}%)`, ['sekutu']);
          appendBlock(`Tanggal : ${sk.tanggalTtd || (isPreview ? '....................' : '-')};`, ['sekutu']);
        });
      } else if (isPreview) {
        appendBlock('..............................', [tipe === 'PT' ? 'pemegangSaham' : 'sekutu']);
        appendBlock(tipe === 'PT' ? 'selaku pemegang .......... saham Perseroan' : 'Sekutu – selaku penyetor modal inbreng sebesar Rp. .................... (....%)', [tipe === 'PT' ? 'pemegangSaham' : 'sekutu']);
        appendBlock('Tanggal : ....................;', [tipe === 'PT' ? 'pemegangSaham' : 'sekutu']);
      }
    }
  });

  // 6. Penutup, Saksi & Legalisir Salinan
  appendCustomSectionOrFallback(6, () => {
    const pSapaan = data?.penghadap?.sapaan || 'Tuan';
    const pNama = val(data?.penghadap?.nama, '..............................');
    appendBlock(`- Kemudian penghadap ${pSapaan}. ${pNama} dengan ini memberi kuasa kepada saya, Notaris, untuk mengajukan permohonan dan/atau memberitahukan perubahan data ${sebutanEntitasKap} tersebut kepada instansi yang berwenang dan untuk itu membuat pengubahan dan/atau tambahan dalam bentuk yang bagaimanapun juga yang diperlukan untuk memperoleh Surat Keputusan dan/atau Surat Penerimaan Pemberitahuan Perubahan Anggaran Dasar dan/atau Surat Penerimaan Pemberitahuan Perubahan Data ${sebutanEntitasKap} dan untuk mengajukan dan menandatangani semua permohonan dan dokumen lain yang mungkin diperlukan.`, ['penghadapSapaan', 'penghadapNama']);
    appendBlock(`- Penghadap dengan ini menjamin akan kebenaran identitas, dan/atau asli tandatangan atas dokumen-dokumen asli yang diserahkan oleh penghadap sesuai dengan dokumen-dokumen yang disampaikan kepada saya, Notaris, dan bertanggungjawab sepenuhnya atas hal-hal tersebut dan selanjutnya penghadap juga menyatakan telah mengetahui dan memahami seluruh isi akta ini, dan apabila di kemudian hari timbul tuntutan hukum mengenai hal tersebut yang menimbulkan suatu sengketa atas hal-hal tersebut karena sebab apapun juga, maka penghadap akan membebaskan Notaris dan saksi-saksi yang menandatangani akta ini dari segala tuntutan hukum.`);
    appendBlock(`- Penghadap telah dikenal oleh saya, Notaris.`);

    addDashedHeading('DEMIKIANLAH AKTA INI');

    appendBlock(`- Dibuat dan dilangsungkan di ${notarisWilayah}, pada hari dan tanggal tersebut pada bagian awal akta ini dengan dihadiri oleh:`, ['notarisWilayah']);
    const sk1Sapaan = data?.saksi1?.sapaan || 'Nona';
    const sk1Nama = val(data?.saksi1?.nama, '..............................');
    const sk1Tempat = val(data?.saksi1?.tempatLahir, '..........');
    const sk1Tgl = (data?.saksi1?.tanggalLahir && data.saksi1.tanggalLahir.trim()) ? formatTanggalBiasa(data.saksi1.tanggalLahir) : '....................';
    const sk1Wn = val(data?.saksi1?.kewarganegaraan, 'Indonesia');
    const sk1Pek = val(data?.saksi1?.pekerjaan, 'Karyawan Swasta');
    const sk1Alamat = val(data?.saksi1?.alamat, '..................................................');
    const sk1Nik = val(data?.saksi1?.nik, '................');

    const sk2Sapaan = data?.saksi2?.sapaan || 'Nona';
    const sk2Nama = val(data?.saksi2?.nama, '..............................');
    const sk2Tempat = val(data?.saksi2?.tempatLahir, '..........');
    const sk2Tgl = (data?.saksi2?.tanggalLahir && data.saksi2.tanggalLahir.trim()) ? formatTanggalBiasa(data.saksi2.tanggalLahir) : '....................';
    const sk2Wn = val(data?.saksi2?.kewarganegaraan, 'Indonesia');
    const sk2Pek = val(data?.saksi2?.pekerjaan, 'Karyawan Swasta');
    const sk2Alamat = val(data?.saksi2?.alamat, '..................................................');
    const sk2Nik = val(data?.saksi2?.nik, '................');

    appendBlock(`1. ${sk1Sapaan}. ${sk1Nama}, lahir di ${sk1Tempat}, pada ${sk1Tgl}, Warga Negara ${sk1Wn}, ${sk1Pek}, bertempat tinggal di ${sk1Alamat}, pemegang Kartu Tanda Penduduk nomor: ${sk1Nik};`, ['saksi1']);
    appendBlock(`2. ${sk2Sapaan}. ${sk2Nama}, lahir di ${sk2Tempat}, pada ${sk2Tgl}, Warga Negara ${sk2Wn}, ${sk2Pek}, bertempat tinggal di ${sk2Alamat}, pemegang Kartu Tanda Penduduk nomor: ${sk2Nik};`, ['saksi2']);
    appendBlock(`- Keduanya karyawan Notaris, yang Saya kenal, sebagai saksi-saksi.`);
    appendBlock(`- Segera setelah akta ini dibacakan oleh saya, Notaris kepada para penghadap dan saksi-saksi, maka akta ini ditanda tangani oleh para penghadap, saksi-saksi dan saya, Notaris, serta cap ibu jari oleh penghadap pada lembar kertas terpisah yang dilekatkan pada minuta akta ini.`);
    appendBlock(`- Dilangsungkan dengan tanpa tambahan, tanpa penggantian, dan tanpa coretan.`);
    appendBlock(`- Minuta akta ini telah ditandatangani dengan sempurna.`);

    addDashedHeading('DIBERIKAN SEBAGAI SALINAN YANG SAMA BUNYINYA');
    addCenterBlock(`NOTARIS DI - ${notarisWilayahKap}`, {}, ['notarisWilayah']);
    pushTrackedLine({ text: '', align: 'center', bold: false, isSignatureSpace: true });
    const notarisTtdDisplay = rawNotarisNama
      ? `${notarisNamaClean}, ${notarisGelarSingkat}`
      : '........................................';
    addCenterBlock(`(${notarisTtdDisplay})`, { underline: true }, ['notarisNama', 'notarisGelarSingkat']);
  });

  return lines;
}

/**
 * Menyusun baris klausula khusus per bagian (Tab 1 s.d. Tab 6) untuk Live Preview Terfokus
 * Sesuai Pasal 42 UUJN: Jika kolom kosong, menampilkan tanda titik '....' sebagai penanda ruang tunggu input,
 * dan otomatis diformat 53 karakter per baris dengan penutup garis '---'.
 */
export function buildSectionDeedLines(sectionNum, data, maxChars = 53) {
  return buildDeedContentLines(data, maxChars, { isPreview: true }).filter(
    (line) => line.sectionNum === sectionNum
  );
}

/**
 * Membagi seluruh isi akta menjadi halaman-halaman A4 (Standar 30 baris per halaman)
 */
export function generateNotaryPages(data, maxChars = 53, linesPerPage = 30, options = {}) {
  const contentLines = buildDeedContentLines(data, maxChars, options);
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
              top: 400,   // ~0.28" * 1440 = 400 dxa (ruang vertikal aman tepat 30 baris)
              bottom: 200,// ~0.14" * 1440 = 200 dxa
              left: 3686, // 2.56" * 1440 = 3686 dxa (Lajur Renvoi / Ruang Catatan Pinggir Akta)
              right: 450  // ~0.31" * 1440 = 450 dxa (ruang horizontal aman agar 53 char + '---' tidak turun baris di Word)
            }
          }
        },
        children: docParagraphs
      }
    ]
  });

  const blob = await Packer.toBlob(doc);
  const cleanEntitasName = sanitizeFilenameSegment(entitasNama, 'AKTA', 60);
  const cleanNomorAkta = sanitizeFilenameSegment(data.akta?.nomor, '1', 20);
  const filename = `Salinan_Akta_No_${cleanNomorAkta}_${tipe}_${cleanEntitasName}.docx`;
  if (typeof window !== 'undefined' && typeof saveAs === 'function' && !window.__TAURI__?.core?.invoke) {
    saveAs(blob, filename);
  }

  return { filename, blob };
}

/**
 * Menyusun model konten Dokumen Internal (dipakai bersama oleh Live Preview dan Export .docx)
 */
export function buildInternalDocModel(data) {
  const tipe = (data?.badanUsaha && data.badanUsaha.tipe) || 'PT';
  const subTipe = resolveSubTipe(data, 'SIRKULER_MODAL');
  const rawEntitasNama = sanitizeInlineField(data?.pt?.nama);
  const entitasNama = (rawEntitasNama || '..............................').toUpperCase();
  const entitasKedudukan = sanitizeInlineField(data?.pt?.kedudukan) || '....................';
  const cleanEntitasName = sanitizeFilenameSegment(rawEntitasNama || `PT_${tipe}`, `PT_${tipe}`, 60);

  const isRups = subTipe === 'RUPS_MODAL';
  const mf = resolveModalFields(data, isRups);
  const fontName = isRups ? 'Georgia' : 'Bookman Old Style';
  const fmtSahamVal = (n) => (Number(n) > 0 ? formatSaham(n) : '..........');
  const fmtRupiahVal = (n) => (Number(n) > 0 ? formatRupiah(n) : 'Rp. ....................');

  const titleLines = isRups
    ? [
        { text: 'BERITA ACARA', size: 26, after: 40, fieldKeys: [] },
        { text: 'RAPAT UMUM PEMEGANG SAHAM (RUPS) LUAR BIASA', size: 24, after: 40, fieldKeys: [] },
        { text: entitasNama, size: 24, after: 40, fieldKeys: ['ptNama'] },
        { text: `BERKEDUDUKAN DI - ${entitasKedudukan.toUpperCase()}`, size: 22, after: 240, fieldKeys: ['ptKedudukan'] }
      ]
    : [
        { text: 'KEPUTUSAN SIRKULER PARA PEMEGANG SAHAM', size: 26, after: 40, fieldKeys: [] },
        { text: entitasNama, size: 24, after: 40, fieldKeys: ['ptNama'] },
        { text: `Berkedudukan di - ${entitasKedudukan}`, size: 22, after: 240, fieldKeys: ['ptKedudukan'] }
      ];

  const introParagraphs = [];
  const defaultSignatories = [{ nama: '..............................', selaku: 'Pemegang Saham Perseroan' }];
  const hadirList = (Array.isArray(data?.pemegangSaham) && data.pemegangSaham.length > 0)
    ? data.pemegangSaham
    : (mf.pmList.length > 0
      ? mf.pmList.map(ps => ({ nama: ps.nama, selaku: `Pemegang ${ps.jumlahSaham.toLocaleString('id-ID')} saham Perseroan` }))
      : defaultSignatories);

  if (isRups) {
    const tglRups = (data?.rups?.tanggal && data.rups.tanggal.trim()) ? formatTanggalAkta(data.rups.tanggal) : '..................................................';
    const jamRups = formatRupsJamText(data?.rups?.jam, '.............. WIB');
    const tempatRups = sanitizeInlineField(data?.rups?.tempat) || 'Kantor Perseroan';
    const pNamaI = sanitizeInlineField(data?.penghadap?.nama) || '..............................';
    const pTmpI = sanitizeInlineField(data?.penghadap?.tempatLahir) || '..........';
    const pTglI = (data?.penghadap?.tanggalLahir && data.penghadap.tanggalLahir.trim()) ? formatTanggalBiasa(data.penghadap.tanggalLahir) : '....................';
    const pWnI = sanitizeInlineField(data?.penghadap?.kewarganegaraan) || 'Indonesia';
    const pPekI = sanitizeInlineField(data?.penghadap?.pekerjaan) || 'Karyawan Swasta';
    const pAlmI = sanitizeInlineField(data?.penghadap?.alamat) || '..................................................';
    const pNikI = sanitizeInlineField(data?.penghadap?.nik) || '................';
    const pJabI = sanitizeInlineField(data?.penghadap?.jabatan) || 'Direktur';

    introParagraphs.push({ text: `- Pada hari ini, ${tglRups}, pukul ${jamRups}, dengan mengambil tempat di ${tempatRups}, telah diadakan Rapat Umum Pemegang Saham (RUPS) Luar Biasa perseroan terbatas ${entitasNama}, berkedudukan di ${entitasKedudukan}.`, fieldKeys: ['rupsTanggal', 'rupsJam', 'rupsTempat', 'ptNama', 'ptKedudukan'] });
    introParagraphs.push({ text: 'Acara Rapat Umum Pemegang Saham :', bold: true, before: 120, after: 60, fieldKeys: [] });
    introParagraphs.push({ text: `1. Pengeluaran ${fmtSahamVal(mf.sahamKeluarJml)} lembar saham dalam simpanan atau senilai ${fmtRupiahVal(mf.sahamKeluarNominal)};`, fieldKeys: ['sahamSimpananDikeluarkanJml', 'sahamSimpananDikeluarkanNominal'] });
    introParagraphs.push({ text: `2. Peningkatan Modal Disetor semula ${fmtRupiahVal(mf.modalSemulaNominal)} menjadi ${fmtRupiahVal(mf.modalMenjadiNominal)};`, fieldKeys: ['modalSemulaNominal', 'modalMenjadiNominal'] });
    introParagraphs.push({ text: 'Daftar Kehadiran Rapat Umum Pemegang Saham:', bold: true, before: 120, after: 60, fieldKeys: [] });
    introParagraphs.push({ text: `1. ${data?.penghadap?.sapaan || 'Tuan'}. ${pNamaI}, lahir di ${pTmpI}, pada ${pTglI}, Warga Negara ${pWnI}, ${pPekI}, bertempat tinggal di ${pAlmI}, pemegang KTP nomor: ${pNikI}, bertindak selaku: ${pJabI} Perseroan;`, fieldKeys: ['penghadapSapaan', 'penghadapNama', 'penghadapTempatLahir', 'penghadapTanggalLahir', 'penghadapWn', 'penghadapPekerjaan', 'penghadapAlamat', 'penghadapNik', 'penghadapJabatan'] });
    hadirList.forEach((ps, idx) => {
      introParagraphs.push({ text: `${idx + 2}. ${sanitizeInlineField(ps.nama) || '....................'}, selaku: ${sanitizeInlineField(ps.selaku) || 'Pemegang Saham Perseroan'};`, fieldKeys: ['pemegangSaham', 'pemegangSahamModal'] });
    });
    introParagraphs.push({ text: 'Bahwa sehubungan dengan penambahan setoran modal, pemegang saham telah melakukan setoran ke Rekening Perseroan dengan rincian bukti setor sebagai berikut:', before: 120, fieldKeys: [] });
  } else {
    introParagraphs.push({ text: `- Mengambil Keputusan diluar Rapat Umum Pemegang Saham, sebagaimana dimaksud pada Pasal ${sanitizeInlineField(data?.pt?.pasalSirkuler) || '10 ayat (5)'} Anggaran Dasar Perseroan, oleh Para Pemegang Saham sebagai berikut:`, fieldKeys: ['ptPasalSirkuler'] });
    hadirList.forEach((ps) => {
      introParagraphs.push({ text: `- ${sanitizeInlineField(ps.nama) || '....................'}, dalam hal ini bertindak selaku: ${sanitizeInlineField(ps.selaku) || 'Pemegang Saham Perseroan'};`, fieldKeys: ['pemegangSaham', 'pemegangSahamModal'] });
    });
    introParagraphs.push({ text: `- Bahwa sehubungan dengan perkembangan usaha dan kebutuhan operasional Perseroan, maka perlu dilakukan penambahan modal kerja Perseroan sejumlah ${fmtRupiahVal(mf.sahamKeluarNominal)}.`, fieldKeys: ['sahamSimpananDikeluarkanNominal'] });
    introParagraphs.push({ text: `- Bahwa sehubungan dengan kebutuhan tersebut diatas, maka Perseroan berkehendak untuk mengeluarkan sisa saham dalam simpanan sejumlah ${fmtSahamVal(mf.sahamKeluarJml)} saham dalam simpanan atau senilai ${fmtRupiahVal(mf.sahamKeluarNominal)}.`, fieldKeys: ['sahamSimpananDikeluarkanJml', 'sahamSimpananDikeluarkanNominal'] });
    introParagraphs.push({ text: '- Bahwa sehubungan dengan itu, telah dilakukan setoran ke Rekening Perseroan dengan rincian sebagai berikut:', before: 120, fieldKeys: [] });
  }

  const customBuktiSetor = Array.isArray(data?.peningkatanModal?.buktiSetor) && data.peningkatanModal.buktiSetor.length > 0
    ? data.peningkatanModal.buktiSetor
    : null;
  const bankTableRows = customBuktiSetor || (isRups
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
      ]);

  const ttdKota = extractCityFromWilayah(sanitizeInlineField(data?.notaris?.wilayah), '....................');
  const ttdTgl = (isRups && data?.rups?.tanggal)
    ? formatTanggalBiasa(data.rups.tanggal)
    : ((data?.akta?.tanggal && data.akta.tanggal.trim()) ? formatTanggalBiasa(data.akta.tanggal) : '....................');

  const ttdSignatories = (Array.isArray(data?.pemegangSaham) && data.pemegangSaham.length > 0)
    ? data.pemegangSaham
    : (mf.pmList.length > 0
      ? mf.pmList.map(ps => ({ nama: ps.nama, selaku: `Pemegang ${ps.jumlahSaham.toLocaleString('id-ID')} saham Perseroan` }))
      : defaultSignatories);

  const rupsPimpinanClean = sanitizeInlineField(data?.rups?.pimpinan);
  const pimpinanText = rupsPimpinanClean
    ? `( ${rupsPimpinanClean} )`
    : `( ${data?.penghadap?.sapaan || 'Tuan'}. ${sanitizeInlineField(data?.penghadap?.nama) || '....................'} )`;

  return {
    isRups,
    fontName,
    cleanEntitasName,
    titleLines,
    introParagraphs,
    bankTableRows,
    pmList: mf.pmList,
    totalSahamSemua: mf.modalMenjadiSaham,
    totalNominalSemua: mf.modalMenjadiNominal,
    ttdKota,
    ttdTgl,
    pimpinanText,
    ttdSignatories
  };
}

/**
 * Export Dokumen Internal Perusahaan (.docx)
 * Untuk Kasus RUPS: Font Georgia 11pt, judul "BERITA ACARA RUPS LUAR BIASA", tabel setoran bank & kepemilikan saham.
 * Untuk Kasus Sirkuler: Font Bookman Old Style 11pt, judul "KEPUTUSAN SIRKULER PARA PEMEGANG SAHAM", tabel setoran bank & kepemilikan saham.
 */
export async function exportInternalDocx(data) {
  const m = buildInternalDocModel(data);
  const docxParagraphs = [];

  const createRun = (text, opts = {}) => {
    return new TextRun({
      text: text || '',
      font: m.fontName,
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

  m.titleLines.forEach(t => {
    docxParagraphs.push(createP(t.text, { align: AlignmentType.CENTER, bold: true, size: t.size, after: t.after }));
  });

  m.introParagraphs.forEach(p => {
    docxParagraphs.push(createP(p.text, { bold: p.bold, before: p.before, after: p.after }));
  });

  const bankColWidths = [720, 2340, 1980, 1800, 2186]; // Total 9026 dxa (Lebar A4 minus margin 1")
  const cellMarginStd = { top: 80, bottom: 80, left: 100, right: 100 };

  // TABEL 1: Rincian Bukti Setor Bank
  const headerCells = ['No.', 'Jumlah Setoran', 'Tanggal Setoran', 'Nama Bank', 'Nomor Bukti Setor'].map((title, colIdx) =>
    new TableCell({
      width: { size: bankColWidths[colIdx], type: WidthType.DXA },
      margins: cellMarginStd,
      shading: { fill: 'F3F4F6' },
      children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [createRun(title, { bold: true, size: 20 })] })]
    })
  );

  const bodyRows = m.bankTableRows.map(r =>
    new TableRow({
      cantSplit: true,
      children: [
        new TableCell({ width: { size: bankColWidths[0], type: WidthType.DXA }, margins: cellMarginStd, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [createRun(r.no, { size: 20 })] })] }),
        new TableCell({ width: { size: bankColWidths[1], type: WidthType.DXA }, margins: cellMarginStd, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [createRun(r.nominal, { size: 20 })] })] }),
        new TableCell({ width: { size: bankColWidths[2], type: WidthType.DXA }, margins: cellMarginStd, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [createRun(r.tgl, { size: 20 })] })] }),
        new TableCell({ width: { size: bankColWidths[3], type: WidthType.DXA }, margins: cellMarginStd, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [createRun(r.bank, { size: 20 })] })] }),
        new TableCell({ width: { size: bankColWidths[4], type: WidthType.DXA }, margins: cellMarginStd, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [createRun(r.ref, { size: 20 })] })] })
      ]
    })
  );

  const bankTable = new Table({
    layout: TableLayoutType.FIXED,
    width: { size: 9026, type: WidthType.DXA },
    columnWidths: bankColWidths,
    rows: [new TableRow({ cantSplit: true, tableHeader: true, children: headerCells }), ...bodyRows]
  });

  docxParagraphs.push(bankTable);
  docxParagraphs.push(createP('', { after: 120 }));

  // TABEL 2: Susunan Pemegang Saham Baru
  docxParagraphs.push(createP('Susunan Kepemilikan Saham Perseroan Setelah Peningkatan Modal:', { bold: true, before: 120, after: 60 }));

  const shareColWidths = [720, 3406, 2250, 2650]; // Total 9026 dxa
  const shareHeaderCells = ['No.', 'Nama Pemegang Saham', 'Jumlah Saham (Lembar)', 'Nilai Nominal (Rp)'].map((title, colIdx) =>
    new TableCell({
      width: { size: shareColWidths[colIdx], type: WidthType.DXA },
      margins: cellMarginStd,
      shading: { fill: 'F3F4F6' },
      children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [createRun(title, { bold: true, size: 20 })] })]
    })
  );

  const shareRows = m.pmList.map((ps, idx) =>
    new TableRow({
      cantSplit: true,
      children: [
        new TableCell({ width: { size: shareColWidths[0], type: WidthType.DXA }, margins: cellMarginStd, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [createRun(`${idx + 1}.`, { size: 20 })] })] }),
        new TableCell({ width: { size: shareColWidths[1], type: WidthType.DXA }, margins: cellMarginStd, children: [new Paragraph({ children: [createRun(sanitizeInlineField(ps.nama) || '....................', { size: 20 })] })] }),
        new TableCell({ width: { size: shareColWidths[2], type: WidthType.DXA }, margins: cellMarginStd, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [createRun(formatSaham(ps.jumlahSaham), { size: 20 })] })] }),
        new TableCell({ width: { size: shareColWidths[3], type: WidthType.DXA }, margins: cellMarginStd, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [createRun(formatRupiah(ps.nominal), { size: 20 })] })] })
      ]
    })
  );

  shareRows.push(
    new TableRow({
      cantSplit: true,
      children: [
        new TableCell({ width: { size: shareColWidths[0] + shareColWidths[1], type: WidthType.DXA }, margins: cellMarginStd, columnSpan: 2, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [createRun('TOTAL KESELURUHAN', { bold: true, size: 20 })] })] }),
        new TableCell({ width: { size: shareColWidths[2], type: WidthType.DXA }, margins: cellMarginStd, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [createRun(formatSaham(m.totalSahamSemua), { bold: true, size: 20 })] })] }),
        new TableCell({ width: { size: shareColWidths[3], type: WidthType.DXA }, margins: cellMarginStd, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [createRun(formatRupiah(m.totalNominalSemua), { bold: true, size: 20 })] })] })
      ]
    })
  );

  const shareTable = new Table({
    layout: TableLayoutType.FIXED,
    width: { size: 9026, type: WidthType.DXA },
    columnWidths: shareColWidths,
    rows: [new TableRow({ cantSplit: true, tableHeader: true, children: shareHeaderCells }), ...shareRows]
  });

  docxParagraphs.push(shareTable);

  // Penutup & Tanda Tangan
  docxParagraphs.push(createP(`Demikian dokumen ini disahkan dan ditandatangani oleh Para Pemegang Saham sebagai bentuk persetujuan.`, { before: 180, after: 120 }));
  docxParagraphs.push(createP(`${m.ttdKota}, ${m.ttdTgl}`, { after: 40 }));
  docxParagraphs.push(createP('Para Pemegang Saham Perseroan:', { bold: true, after: 360 }));

  if (m.isRups) {
    docxParagraphs.push(createP(m.pimpinanText, { underline: true, bold: true, after: 40 }));
    docxParagraphs.push(createP('Pimpinan Rapat', { after: 180 }));
  }

  m.ttdSignatories.forEach(ps => {
    const cleanName = sanitizeInlineField(ps.nama) || '..............................';
    docxParagraphs.push(createP(`( ${cleanName} )`, { underline: true, bold: true, after: 40 }));
    docxParagraphs.push(createP(sanitizeInlineField(ps.selaku) || 'Pemegang Saham', { after: 180 }));
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
  const prefixName = m.isRups ? 'BA_RUPS_Modal' : 'Keputusan_Sirkuler_Modal';
  const filename = `${prefixName}_${m.cleanEntitasName}.docx`;
  if (typeof window !== 'undefined' && typeof saveAs === 'function' && !window.__TAURI__?.core?.invoke) {
    saveAs(blob, filename);
  }

  return { filename, blob };
}
