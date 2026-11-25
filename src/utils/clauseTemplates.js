// Utility Pengelola Template Klausula & Redaksional Akta Notaris
// Mendukung kustomisasi kalimat per bagian (Bagian 1 s.d. Bagian 6) untuk draf aktif

import { formatTanggalAkta, formatJamAkta, formatTanggalBiasa, formatTanggalTanpaAwalan, formatSaham, formatRupiah } from './terbilang.js';

export const SECTION_NAMES = {
  1: 'Kepala Akta & Notaris',
  2: 'Identitas Badan Usaha & Riwayat Legalitas',
  3: 'Data Penghadap & Keterangan Akta',
  4: 'Modal & Keputusan Sirkuler',
  5: 'Keputusan Susunan Pengurus Baru',
  6: 'Klausula Penutup, Saksi & Legalisir Salinan'
};

/**
 * Daftar Tag / Placeholder yang tersedia per Bagian
 */
export function getAvailablePlaceholders(sectionNum, tipe = 'PT', subTipe = 'SIRKULER_PENGURUS') {
  const commonBadanUsaha = [
    { tag: '{NAMA_ENTITAS}', label: 'Nama Perusahaan', desc: 'Nama PT / CV / Firma / UD' },
    { tag: '{KEDUDUKAN_ENTITAS}', label: 'Kedudukan', desc: 'Wilayah kota/kabupaten kedudukan' },
    { tag: '{SEBUTAN_ENTITAS}', label: 'Sebutan Entitas', desc: 'Contoh: perseroan terbatas / persekutuan komanditer' },
    { tag: '{SEBUTAN_ENTITAS_KAP}', label: 'Sebutan Huruf Besar', desc: 'Contoh: Perseroan / Persekutuan / Usaha Dagang' }
  ];

  if (sectionNum === 1) {
    return [
      { tag: '{NOMOR_AKTA}', label: 'Nomor Akta', desc: 'Nomor akta yang sedang dibuat' },
      { tag: '{HARI_TANGGAL_AKTA}', label: 'Hari & Tanggal Akta', desc: 'Format terbilang lengkap notaris' },
      { tag: '{JAM_AKTA}', label: 'Jam Pembuatan Akta', desc: 'Format terbilang jam WIB' },
      { tag: '{NAMA_NOTARIS}', label: 'Nama Notaris', desc: 'Nama lengkap tanpa gelar' },
      { tag: '{GELAR_PANJANG_NOTARIS}', label: 'Gelar Dieja (Komparisi)', desc: 'Contoh: Sarjana Hukum, Magister Kenotariatan' },
      { tag: '{WILAYAH_NOTARIS}', label: 'Wilayah Notaris', desc: 'Wilayah jabatan notaris' },
      ...commonBadanUsaha
    ];
  }

  if (sectionNum === 2) {
    return [
      { tag: '{JABATAN_PENGHADAP}', label: 'Jabatan Penghadap', desc: 'Direktur / Persero Pengurus / Pemilik' },
      ...commonBadanUsaha,
      { tag: '{NO_AKTA_PENDIRIAN}', label: 'No Akta Pendirian', desc: 'Nomor akta pendirian lama' },
      { tag: '{TGL_AKTA_PENDIRIAN}', label: 'Tgl Akta Pendirian', desc: 'Tanggal akta pendirian' },
      { tag: '{NOTARIS_PENDIRIAN}', label: 'Notaris Pendirian', desc: 'Nama notaris pembuat akta pendirian' },
      { tag: '{WILAYAH_NOTARIS_PENDIRIAN}', label: 'Wilayah Notaris Pendirian', desc: 'Wilayah notaris pendirian' },
      { tag: '{NO_SK_PENDIRIAN}', label: 'No SK Pengesahan', desc: 'Nomor SK Kemenkumham / NIB' },
      { tag: '{TGL_SK_PENDIRIAN}', label: 'Tgl SK Pengesahan', desc: 'Tanggal SK Kemenkumham / NIB' },
      { tag: '{NO_AKTA_PERUBAHAN}', label: 'No Akta Perubahan', desc: 'Nomor akta perubahan terakhir' },
      { tag: '{TGL_AKTA_PERUBAHAN}', label: 'Tgl Akta Perubahan', desc: 'Tanggal akta perubahan terakhir' },
      { tag: '{NOTARIS_PERUBAHAN_DENGAN_WILAYAH}', label: 'Notaris Perubahan', desc: 'Nama notaris & wilayah akta perubahan' },
      { tag: '{NO_SK_PERUBAHAN}', label: 'No SK Perubahan', desc: 'Nomor SK Persetujuan perubahan' },
      { tag: '{TGL_SK_PERUBAHAN}', label: 'Tgl SK Perubahan', desc: 'Tanggal SK Persetujuan perubahan' },
      { tag: '{NO_PEMBERITAHUAN_PERUBAHAN}', label: 'No Penerimaan AHU', desc: 'Nomor bukti penerimaan pemberitahuan AHU' }
    ];
  }

  if (sectionNum === 3) {
    return [
      { tag: '{SAPAAN_PENGHADAP}', label: 'Sapaan', desc: 'Tuan / Nyonya / Nona' },
      { tag: '{NAMA_PENGHADAP}', label: 'Nama Penghadap', desc: 'Nama lengkap penghadap' },
      { tag: '{TEMPAT_LAHIR_PENGHADAP}', label: 'Tempat Lahir', desc: 'Kota kelahiran penghadap' },
      { tag: '{TGL_LAHIR_PENGHADAP}', label: 'Tanggal Lahir', desc: 'Format terbilang tanggal lahir' },
      { tag: '{WN_PENGHADAP}', label: 'Kewarganegaraan', desc: 'Contoh: Indonesia' },
      { tag: '{PEKERJAAN_PENGHADAP}', label: 'Pekerjaan', desc: 'Profesi penghadap' },
      { tag: '{ALAMAT_PENGHADAP}', label: 'Alamat Tinggal', desc: 'Alamat lengkap domisili penghadap' },
      { tag: '{NIK_PENGHADAP}', label: 'Nomor KTP / NIK', desc: 'Nomor NIK KTP penghadap' },
      ...commonBadanUsaha
    ];
  }

  if (sectionNum === 4) {
    if (tipe === 'PT' && (subTipe === 'SIRKULER_MODAL' || subTipe === 'RUPS_MODAL')) {
      return [
        ...commonBadanUsaha,
        { tag: '{SAPAAN_PENGHADAP}', label: 'Sapaan', desc: 'Tuan / Nyonya / Nona' },
        { tag: '{NAMA_PENGHADAP}', label: 'Nama Penghadap', desc: 'Nama lengkap penghadap' },
        { tag: '{HARI_TANGGAL_RUPS}', label: 'Tanggal RUPS', desc: 'Hari & tanggal pelaksanaan RUPS' },
        { tag: '{JAM_RUPS}', label: 'Jam RUPS', desc: 'Jam pelaksanaan RUPS' },
        { tag: '{TEMPAT_RUPS}', label: 'Tempat RUPS', desc: 'Lokasi penyelenggaraan RUPS' },
        { tag: '{TOTAL_SAHAM_HADIR_RUPS}', label: 'Kuorum RUPS', desc: 'Jumlah saham hadir RUPS' },
        { tag: '{MODAL_SEMULA_SAHAM}', label: 'Saham Semula', desc: 'Jumlah saham sebelum peningkatan' },
        { tag: '{MODAL_SEMULA_NOMINAL}', label: 'Modal Semula', desc: 'Nominal modal sebelum peningkatan' },
        { tag: '{MODAL_MENJADI_NOMINAL}', label: 'Modal Menjadi', desc: 'Nominal modal setelah peningkatan' },
        { tag: '{JML_SAHAM_DIKELUARKAN}', label: 'Saham Simpanan Keluar', desc: 'Jumlah saham portepel dikeluarkan' },
        { tag: '{NOMINAL_SAHAM_DIKELUARKAN}', label: 'Nominal Saham Keluar', desc: 'Nilai nominal saham dikeluarkan' },
        { tag: '{NAMA_PENGAMBIL_BAGIAN}', label: 'Pengambil Saham', desc: 'Pihak penyetor saham simpanan' },
        { tag: '{NAMA_PELEPAS_HAK}', label: 'Pelepas Hak', desc: 'Pihak yang melepaskan pre-emptive rights' },
        { tag: '{PASAL_SIRKULER}', label: 'Pasal Sirkuler', desc: 'Contoh: 10 ayat (5)' }
      ];
    }
    return [
      ...commonBadanUsaha,
      { tag: '{SAPAAN_PENGHADAP}', label: 'Sapaan', desc: 'Tuan / Nyonya / Nona' },
      { tag: '{NAMA_PENGHADAP}', label: 'Nama Penghadap', desc: 'Nama lengkap penghadap' },
      { tag: '{LABEL_PEMBERI_KUASA}', label: 'Label Pemberi Kuasa', desc: 'Para Pemegang Saham / Para Pesero' },
      { tag: '{LABEL_SIRKULER}', label: 'Label Sirkuler', desc: 'Pemegang Saham / Para Pesero' },
      { tag: '{TOTAL_SAHAM_A}', label: 'Total Saham Seri-A', desc: 'Jumlah lembar saham A terbilang' },
      { tag: '{TOTAL_SAHAM_B}', label: 'Total Saham Seri-B', desc: 'Jumlah lembar saham B terbilang' },
      { tag: '{TOTAL_MODAL_INBRENG}', label: 'Total Modal Inbreng', desc: 'Format Rupiah modal CV/Firma' },
      { tag: '{PASAL_SIRKULER}', label: 'Pasal Sirkuler', desc: 'Contoh: 10 ayat (5)' }
    ];
  }

  if (sectionNum === 5) {
    if (tipe === 'PT' && (subTipe === 'SIRKULER_MODAL' || subTipe === 'RUPS_MODAL')) {
      return [
        ...commonBadanUsaha,
        { tag: '{TOTAL_SAHAM_MENJADI}', label: 'Total Saham Menjadi', desc: 'Total lembar saham Pasal 4 ayat (2)' },
        { tag: '{MODAL_MENJADI_NOMINAL}', label: 'Modal Menjadi', desc: 'Total nominal modal Pasal 4 ayat (2)' },
        { tag: '{RINCIAN_PEMEGANG_SAHAM_MODAL_KOLOM}', label: 'Rincian Pemegang Saham Baru', desc: 'Daftar penyetoran saham Pasal 4 ayat (2)' }
      ];
    }
    return [
      ...commonBadanUsaha,
      { tag: '{LABEL_ORGAN_LAMA}', label: 'Sebutan Organ Lama', desc: 'Direksi dan Dewan Komisaris lama' },
      { tag: '{LABEL_ORGAN_BARU}', label: 'Sebutan Organ Baru', desc: 'susunan Direksi dan Dewan Komisaris baru' },
      { tag: '{LABEL_PEMBERI_KUASA}', label: 'Label Pemberi Kuasa', desc: 'Para Pemegang Saham / Para Pesero' },
      { tag: '{LABEL_SIRKULER}', label: 'Label Sirkuler', desc: 'Pemegang Saham / Para Pesero' },
      { tag: '{MASA_JABATAN}', label: 'Masa Jabatan', desc: 'Contoh: 5 (lima)' },
      { tag: '{RINCIAN_SUSUNAN_PENGURUS_BARU}', label: 'Rincian Pengurus Baru', desc: 'Daftar pejabat dan identitas pengurus baru' },
      { tag: '{RINCIAN_DAFTAR_PEMEGANG_SAHAM_SEKUTU}', label: 'Daftar Pemegang Saham / Sekutu', desc: 'Daftar nama dan porsi modal yang di-generate otomatis' }
    ];
  }

  if (sectionNum === 6) {
    return [
      { tag: '{SAPAAN_PENGHADAP}', label: 'Sapaan Penghadap', desc: 'Tuan / Nyonya / Nona' },
      { tag: '{NAMA_PENGHADAP}', label: 'Nama Penghadap', desc: 'Nama lengkap penghadap' },
      { tag: '{WILAYAH_NOTARIS}', label: 'Wilayah Notaris', desc: 'Wilayah kedudukan kantor notaris' },
      { tag: '{WILAYAH_NOTARIS_KAP}', label: 'Wilayah Notaris Huruf Besar', desc: 'Contoh: KABUPATEN KUDUS' },
      { tag: '{NAMA_NOTARIS}', label: 'Nama Notaris', desc: 'Nama notaris tanpa gelar' },
      { tag: '{GELAR_SINGKAT_NOTARIS}', label: 'Gelar Singkat (Tanda Tangan)', desc: 'Contoh: S.H., M.Kn.' },
      { tag: '{SAKSI_1_LENGKAP}', label: 'Klausula Saksi 1', desc: 'Rincian identitas lengkap Saksi 1' },
      { tag: '{SAKSI_2_LENGKAP}', label: 'Klausula Saksi 2', desc: 'Rincian identitas lengkap Saksi 2' },
      ...commonBadanUsaha
    ];
  }

  return [];
}

/**
 * Mendapatkan Template Standar UUJN per Bagian
 */
export function getDefaultClauseTemplate(sectionNum, tipe = 'PT', subTipe = 'SIRKULER_PENGURUS') {
  let labelPemberiKuasa = 'Para Pemegang Saham Perseroan';
  let labelSirkuler = 'Pemegang Saham';
  let labelOrganLama = 'seluruh anggota Direksi dan Dewan Komisaris Perseroan';
  let labelOrganBaru = 'susunan Direksi dan Dewan Komisaris Perseroan';
  let sebutanPihak = 'para pemegang saham';

  if (tipe === 'CV') {
    labelPemberiKuasa = 'Para Pesero Persekutuan';
    labelSirkuler = 'Para Pesero';
    labelOrganLama = 'susunan Persero Pengurus dan Persero Komanditer lama';
    labelOrganBaru = 'susunan Persero Pengurus dan Persero Komanditer baru';
    sebutanPihak = 'para pesero';
  } else if (tipe === 'FIRMA') {
    labelPemberiKuasa = 'Para Pesero Firma';
    labelSirkuler = 'Para Pesero';
    labelOrganLama = 'susunan Pesero Pengurus dan Pesero Firma lama';
    labelOrganBaru = 'susunan Pesero Pengurus dan Pesero Firma baru';
    sebutanPihak = 'para pesero';
  } else if (tipe === 'UD') {
    labelPemberiKuasa = 'Pemilik Usaha';
    labelSirkuler = 'Pemilik Usaha';
    labelOrganLama = 'pengurusan dan pengelolaan usaha sebelumnya';
    labelOrganBaru = 'susunan kepemilikan dan kuasa pengelola Usaha Dagang';
    sebutanPihak = 'pemilik usaha';
  }

  if (sectionNum === 1) {
    let j1 = 'AKTA PERNYATAAN KEPUTUSAN SIRKULER';
    let j2 = 'PARA PEMEGANG SAHAM PERSEROAN TERBATAS';
    if (tipe === 'PT' && subTipe === 'RUPS_MODAL') {
      j1 = 'AKTA PERNYATAAN KEPUTUSAN';
      j2 = 'RAPAT UMUM PEMEGANG SAHAM LUAR BIASA\nPERSEROAN TERBATAS';
    } else if (tipe === 'CV') {
      j1 = 'AKTA PERNYATAAN KEPUTUSAN PARA PESERO';
      j2 = 'PERSEKUTUAN KOMANDITER';
    } else if (tipe === 'FIRMA') {
      j1 = 'AKTA PERNYATAAN KEPUTUSAN PARA PESERO';
      j2 = 'FIRMA';
    } else if (tipe === 'UD') {
      j1 = 'AKTA PERNYATAAN KEPUTUSAN PEMILIK';
      j2 = 'PERUSAHAAN PERORANGAN / USAHA DAGANG';
    }

    return `${j1}
${j2}
“{NAMA_ENTITAS}”
BERKEDUDUKAN DI – {KEDUDUKAN_ENTITAS}
Nomor : {NOMOR_AKTA} .-

- Pada hari ini, {HARI_TANGGAL_AKTA}, {JAM_AKTA};
- Berhadapan dengan saya, {NAMA_NOTARIS}, {GELAR_PANJANG_NOTARIS}, Notaris di {WILAYAH_NOTARIS}, dengan dihadiri saksi-saksi, yang nama-namanya akan disebut pada bagian akhir akta ini:`;
  }

  if (sectionNum === 2) {
    if (tipe === 'PT' && subTipe === 'RUPS_MODAL') {
      return `- Menurut keterangannya, penghadap dalam hal ini bertindak dalam jabatannya selaku {JABATAN_PENGHADAP}, dari dan selaku demikian untuk dan atas nama {SEBUTAN_ENTITAS} “{NAMA_ENTITAS}”, berkedudukan di {KEDUDUKAN_ENTITAS} (selanjutnya akan disebut juga “{SEBUTAN_ENTITAS_KAP}”), yang Anggaran Dasarnya didirikan dengan Akta Pendirian tertanggal {TGL_AKTA_PENDIRIAN}, Nomor. {NO_AKTA_PENDIRIAN}, yang dibuat dihadapan {NOTARIS_PENDIRIAN}, Notaris di {WILAYAH_NOTARIS_PENDIRIAN}, akta mana telah mendapatkan {SK_PENDIRIAN_LABEL} pada tanggal {TGL_SK_PENDIRIAN}, Nomor. {NO_SK_PENDIRIAN}, akta mana telah beberapa kali mengalami perubahan, yang terakhir melalui Akta tertanggal {TGL_AKTA_PERUBAHAN}, Nomor. {NO_AKTA_PERUBAHAN}, yang dibuat dihadapan {NOTARIS_PERUBAHAN_DENGAN_WILAYAH} akta mana telah mendapatkan {SK_PERUBAHAN_LABEL} tertanggal {TGL_SK_PERUBAHAN}, Nomor. {NO_SK_PERUBAHAN} dan telah diberitahukan kepada Kementerian Hukum dan Hak Asasi Manusia Republik Indonesia, sebagaimana bukti penerimaan pemberitahuannya ternyata dari Penerimaan Pemberitahuan Perubahan Anggaran Dasar tertanggal {TGL_SK_PERUBAHAN}, Nomor. {NO_PEMBERITAHUAN_PERUBAHAN};`;
    }
    return `- menurut keterangannya, penghadap dalam hal ini bertindak dalam jabatannya selaku {JABATAN_PENGHADAP}, untuk dan oleh karenanya secara sah mewakili {SEBUTAN_ENTITAS} “{NAMA_ENTITAS}”, berkedudukan di {KEDUDUKAN_ENTITAS} (selanjutnya akan disebut juga “{SEBUTAN_ENTITAS_KAP}”), yang Anggaran Dasarnya didirikan dengan Akta Pendirian tertanggal {TGL_AKTA_PENDIRIAN}, Nomor. {NO_AKTA_PENDIRIAN}, yang dibuat dihadapan {NOTARIS_PENDIRIAN}, dahulu Notaris di {WILAYAH_NOTARIS_PENDIRIAN}, akta mana telah mendapatkan {SK_PENDIRIAN_LABEL} pada tanggal {TGL_SK_PENDIRIAN}, Nomor. {NO_SK_PENDIRIAN}, akta mana telah beberapa kali mengalami perubahan, yang terakhir melalui Akta tertanggal {TGL_AKTA_PERUBAHAN}, Nomor. {NO_AKTA_PERUBAHAN}, yang dibuat dihadapan {NOTARIS_PERUBAHAN_DENGAN_WILAYAH} akta mana telah mendapatkan {SK_PERUBAHAN_LABEL} tertanggal {TGL_SK_PERUBAHAN}, Nomor. {NO_SK_PERUBAHAN} dan telah diberitahukan kepada Menteri Hukum dan Hak Asasi Manusia Republik Indonesia, sebagaimana bukti penerimaan pemberitahuannya ternyata dari Penerimaan Pemberitahuan Perubahan Anggaran Dasar Kementerian Hukum dan Hak Asasi Manusia Republik – Indonesia tertanggal {TGL_SK_PERUBAHAN}, Nomor. {NO_PEMBERITAHUAN_PERUBAHAN};`;
  }

  if (sectionNum === 3) {
    if (tipe === 'PT' && subTipe === 'RUPS_MODAL') {
      return `- {SAPAAN_PENGHADAP}. {NAMA_PENGHADAP}, lahir di {TEMPAT_LAHIR_PENGHADAP}, pada {TGL_LAHIR_PENGHADAP}, Warga Negara {WN_PENGHADAP}, {PEKERJAAN_PENGHADAP}, bertempat tinggal di {ALAMAT_PENGHADAP}, pemegang Kartu Tanda Penduduk nomor: {NIK_PENGHADAP};
- Untuk keperluan dalam akta ini sementara waktu berada di Kudus;`;
    }
    return `- {SAPAAN_PENGHADAP}. {NAMA_PENGHADAP}, lahir di {TEMPAT_LAHIR_PENGHADAP}, pada {TGL_LAHIR_PENGHADAP}, Warga Negara {WN_PENGHADAP}, {PEKERJAAN_PENGHADAP}, bertempat tinggal di {ALAMAT_PENGHADAP}, pemegang Kartu Tanda Penduduk nomor: {NIK_PENGHADAP};`;
  }

  if (sectionNum === 4) {
    if (tipe === 'PT' && subTipe === 'RUPS_MODAL') {
      return `- Penghadap bertindak dalam kedudukannya tersebut diatas dengan ini menerangkan :
- Bahwa pada hari {HARI_TANGGAL_RUPS}, pukul {JAM_RUPS}, dengan mengambil tempat di {TEMPAT_RUPS}, telah diadakan Rapat Umum Pemegang Saham (RUPS) Luar Biasa perseroan terbatas “{NAMA_ENTITAS}”, berkedudukan di {KEDUDUKAN_ENTITAS};
- Bahwa dalam rapat tersebut telah hadir dan/atau diwakili sejumlah {TOTAL_SAHAM_HADIR_RUPS} lembar saham atau merupakan keseluruhan saham yang telah dikeluarkan oleh Perseroan;
- Bahwa surat-surat saham yang diwakili sampai sekarang belum dicetak, namun demikian penghadap menjamin keadaannya baik jumlah dan kepemilikan saham sesuai dengan keadaan yang sebenarnya;
- Bahwa dalam rapat tersebut penghadap {SAPAAN_PENGHADAP}. {NAMA_PENGHADAP} bertindak selaku Pimpinan Rapat;
- Bahwa hal-hal yang dibicarakan serta diputuskan dalam rapat tersebut telah dibuatkan Berita Acara Rapat di bawah tangan bermeterai cukup dan dilekatkan pada minuta akta ini;
- Bahwa berdasarkan kuasa yang diberikan dalam Rapat tersebut, penghadap diberi hak dan wewenang untuk menyatakan keputusan rapat dalam suatu akta Notaris;
- Berdasarkan apa yang diuraikan diatas, penghadap menyatakan Rapat Umum Pemegang Saham Luar Biasa dengan suara bulat telah memutuskan:
1) MENYETUJUI, Pengeluaran {JML_SAHAM_DIKELUARKAN} saham simpanan atau senilai {NOMINAL_SAHAM_DIKELUARKAN} yang diambil bagian dan disetor penuh oleh {NAMA_PENGAMBIL_BAGIAN}, sedangkan pemegang saham lainnya yaitu {NAMA_PELEPAS_HAK} menyatakan tidak ikut mengambil bagian atas saham simpanan tersebut serta mengesampingkan segala hak yang dimilikinya termasuk dan tidak terbatas pada hak untuk mendapatkan penawaran terlebih dahulu (pre-emptive rights);
2) MENYETUJUI, Peningkatan Modal Ditempatkan dan Disetor semula {MODAL_SEMULA_NOMINAL} menjadi {MODAL_MENJADI_NOMINAL};`;
    }

    if (tipe === 'PT' && subTipe === 'SIRKULER_MODAL') {
      return `- Penghadap bertindak dalam kedudukannya tersebut diatas dengan ini menerangkan :
- Bahwa para pemegang saham Perseroan telah mengambil keputusan sebagaimana ternyata dari –
----- KEPUTUSAN SIRKULER PARA PEMEGANG SAHAM -----
perseroan terbatas “{NAMA_ENTITAS}” yang dibuat secara dibawah tangan, ditandatangani oleh Para Pemegang Saham Perseroan dan telah dibubuhi materai cukup dan dilekatkan pada minuta akta ini;
- Bahwa Keputusan Sirkuler Pemegang Saham tersebut telah ditandatangani sebagai bentuk persetujuan oleh seluruh pemegang saham dengan jumlah {MODAL_SEMULA_SAHAM} lembar saham, jumlah mana merupakan keseluruhan saham yang telah dikeluarkan dan diambil bagian oleh para pemegang saham dalam perseroan;
- Bahwa surat-surat saham yang diwakili sampai sekarang belum dicetak, namun demikian penghadap menjamin keadaannya baik jumlah dan kepemilikan saham sesuai dengan keadaan yang sebenarnya;
- Bahwa Keputusan Sirkuler Para Pemegang Saham tersebut adalah harus dianggap sama dengan keputusan yang diambil dalam setiap rapat umum pemegang saham Perseroan berdasarkan Pasal {PASAL_SIRKULER} Anggaran Dasar Perseroan;
- Bahwa penghadap {SAPAAN_PENGHADAP}. {NAMA_PENGHADAP} yang bertindak dalam kedudukannya sebagaimana diatas dan dengan mempergunakan kekuatan kuasa yang diberikan oleh Para Pemegang Saham Perseroan berdasarkan Keputusan Sirkuler Pemegang Saham sekarang hendak menyatakan Keputusan Sirkuler Pemegang Saham tersebut dalam suatu akta Notaris.
- Berdasarkan dengan apa yang telah diuraikan diatas, penghadap menyatakan para pemegang saham Perseroan telah mengambil keputusan sebagai berikut:
1) MENYETUJUI, Pengeluaran {JML_SAHAM_DIKELUARKAN} saham simpanan atau senilai {NOMINAL_SAHAM_DIKELUARKAN} yang diambil bagian dan disetor penuh oleh {NAMA_PENGAMBIL_BAGIAN}, sedangkan pemegang saham lainnya yaitu {NAMA_PELEPAS_HAK} menyatakan tidak ikut mengambil bagian atas saham-saham yang dikeluarkan oleh Perseroan, serta mengesampingkan segala hak yang dimilikinya termasuk dan tidak terbatas pada hak untuk mendapatkan penawaran terlebih dahulu (pre-emptive rights);
2) MENYETUJUI, Meningkatkan Modal Ditempatkan dan Disetor Perseroan semula {MODAL_SEMULA_NOMINAL} menjadi {MODAL_MENJADI_NOMINAL};`;
    }

    const judulSirkuler = tipe === 'PT'
      ? '----- KEPUTUSAN SIRKULER PARA PEMEGANG SAHAM -----'
      : (tipe === 'UD' ? '------- KEPUTUSAN SIRKULER PEMILIK USAHA -------' : '------- KEPUTUSAN SIRKULER PARA PESERO -------');

    const modalText = tipe === 'PT'
      ? `- Bahwa Keputusan Sirkuler Pemegang Saham tersebut telah ditandatangani sebagai bentuk persetujuan oleh seluruh pemegang saham dengan jumlah {TOTAL_SAHAM_A} saham seri-A dan {TOTAL_SAHAM_B} saham seri-B, jumlah mana merupakan keseluruhan saham yang telah dikeluarkan dan diambil bagian oleh para pemegang saham dalam perseroan;
- Bahwa surat-surat saham yang diwakili sampai sekarang belum dicetak, namun demikian penghadap menjamin keadaannya baik jumlah dan kepemilikan saham sesuai dengan keadaan yang sebenarnya;
- Bahwa Keputusan Sirkuler Para Pemegang Saham tersebut adalah harus dianggap sama dengan keputusan yang diambil dalam setiap rapat umum pemegang saham Perseroan berdasarkan Pasal {PASAL_SIRKULER} Anggaran Dasar Perseroan. Oleh karena itu, seluruh keputusan yang diambil dalam Keputusan Sirkuler ini adalah sah dan mengikat;`
      : `- Bahwa modal yang ditempatkan dan disetor penuh dalam {SEBUTAN_ENTITAS} ini adalah sebesar {TOTAL_MODAL_INBRENG}, yang terbagi ke dalam bagian-bagian modal (inbreng) para pesero/pemilik secara sah;
- Bahwa keputusan ini adalah sah, mengikat, dan memiliki kekuatan hukum yang sempurna berdasarkan ketentuan Anggaran Dasar dan peraturan perundang-undangan yang berlaku di Republik Indonesia;`;

    return `- Penghadap bertindak dalam kedudukannya tersebut diatas dengan ini menerangkan :
- Bahwa ${sebutanPihak} {SEBUTAN_ENTITAS_KAP} telah mengambil keputusan sebagaimana ternyata dari –
${judulSirkuler}
{SEBUTAN_ENTITAS} “{NAMA_ENTITAS}” yang dibuat secara dibawah tangan, ditandatangani oleh ${labelPemberiKuasa} dan telah dibubuhi materai cukup dan dilekatkan pada minuta akta ini selanjutnya akan disebut juga “Keputusan Sirkuler ${labelSirkuler}”;
${modalText}
- Bahwa penghadap {SAPAAN_PENGHADAP}. {NAMA_PENGHADAP}, yang bertindak dalam kedudukannya sebagaimana diatas, dan dengan mempergunakan kekuatan kuasa yang diberikan oleh ${labelPemberiKuasa} berdasarkan Keputusan Sirkuler ${labelSirkuler} sekarang hendak menyatakan Keputusan Sirkuler ${labelSirkuler} tersebut dalam suatu akta Notaris.
- Berdasarkan dengan apa yang telah diuraikan diatas, penghadap {SAPAAN_PENGHADAP}. {NAMA_PENGHADAP}, menyatakan ${labelPemberiKuasa} telah mengambil keputusan sebagai berikut:`;
  }

  if (sectionNum === 5) {
    if (tipe === 'PT' && (subTipe === 'SIRKULER_MODAL' || subTipe === 'RUPS_MODAL')) {
      return `- Dengan demikian mengubah Pasal 4 ayat (2) Anggaran Dasar perseroan, sehingga untuk selanjutnya tertulis dan berbunyi sebagai berikut:
------------------- M O D A L -------------------
-------------------- Pasal 4 --------------------
2. Dari Modal Dasar tersebut telah ditempatkan dan disetor sebagian, sebanyak {TOTAL_SAHAM_MENJADI} saham dengan nilai nominal seluruhnya sebesar {MODAL_MENJADI_NOMINAL} oleh para pemegang saham yang telah mengambil bagian saham dengan rincian serta nilai nominal saham yang akan disebutkan pada akhir akta ini.
- Bahwa dengan adanya peningkatan modal pada keputusan ini, dan bertalian dengan Modal Ditempatkan dan Modal Disetor sebagaimana dimaksud dalam pasal 4 ayat (2), maka bagian akhir Anggaran Dasar Perseroan menjadi berbunyi sebagai berikut:
- Modal ditempatkan sebagaimana dimaksud dalam Pasal 4 ayat (2) telah disetor penuh dengan uang tunai melalui kas perseroan oleh para pemegang saham:
{RINCIAN_PEMEGANG_SAHAM_MODAL_KOLOM}`;
    }

    return `1) MENYETUJUI, untuk memberhentikan dengan hormat ${labelOrganLama} terhitung sejak tanggal Keputusan Sirkuler ini berlaku efektif dan memberikan pengesahan atas tindakan kepengurusan dan pengawasan ${labelOrganLama} dalam melakukan tindakan hukum atas nama {SEBUTAN_ENTITAS_KAP}, sepanjang tindakan-tindakan hukum dimaksud sesuai/tidak menyimpang dari ketentuan dalam Anggaran Dasar {SEBUTAN_ENTITAS_KAP} dan tercermin dalam laporan keuangan tahunan {SEBUTAN_ENTITAS_KAP}, berikut dengan memberikan pelepasan dan pelunasan (Acquit et Decharge) sepenuhnya atas pelaksanaan pengurusan dan pengawasan yang telah dijalankan;
   Mengubah susunan ${tipe === 'PT' ? 'Direksi dan Dewan Komisaris yang' : labelOrganBaru} baru sejak tanggal efektif keputusan ini sampai dengan {MASA_JABATAN} tahun mendatang, sehingga ${labelOrganBaru} menjadi sebagai berikut:
{RINCIAN_SUSUNAN_PENGURUS_BARU}
2) MENYETUJUI, bahwa terhitung sejak tanggal efektif pengangkatan ${tipe === 'PT' ? 'Direksi dan Dewan Komisaris tersebut diatas, kepada masing-masing Direktur dan Komisaris' : `${labelOrganBaru} tersebut diatas, kepada masing-masing pengurus`} diberikan kuasa, kewajiban, hak, dan kewenangan sesuai dengan tugas dan jabatan yang diemban menurut dan/atau berdasarkan Anggaran Dasar {SEBUTAN_ENTITAS_KAP} maupun Undang-Undang yang berlaku dengan tanpa ada yang dikecualikan.
- Demikian Keputusan Sirkuler ${labelSirkuler} ini, mempunyai kekuatan hukum yang sama dengan keputusan yang diambil secara sah dalam Rapat Umum Pemegang Saham Perseroan;
${labelPemberiKuasa}
materai sepuluh ribu rupiah
tanda tangan tidak terbaca
{RINCIAN_DAFTAR_PEMEGANG_SAHAM_SEKUTU}`;
  }

  if (sectionNum === 6) {
    return `- Kemudian penghadap {SAPAAN_PENGHADAP}. {NAMA_PENGHADAP} dengan ini memberi kuasa kepada saya, Notaris, untuk mengajukan permohonan dan/atau memberitahukan perubahan data {SEBUTAN_ENTITAS_KAP} tersebut kepada instansi yang berwenang dan untuk itu membuat pengubahan dan/atau tambahan dalam bentuk yang bagaimanapun juga yang diperlukan untuk memperoleh Surat Keputusan dan/atau Surat Penerimaan Pemberitahuan Perubahan Anggaran Dasar dan/atau Surat Penerimaan Pemberitahuan Perubahan Data {SEBUTAN_ENTITAS_KAP} dan untuk mengajukan dan menandatangani semua permohonan dan dokumen lain yang mungkin diperlukan.
- Penghadap dengan ini menjamin akan kebenaran identitas, dan/atau asli tandatangan atas dokumen-dokumen asli yang diserahkan oleh penghadap sesuai dengan dokumen-dokumen yang disampaikan kepada saya, Notaris, dan bertanggungjawab sepenuhnya atas hal-hal tersebut dan selanjutnya penghadap juga menyatakan telah mengetahui dan memahami seluruh isi akta ini, dan apabila di kemudian hari timbul tuntutan hukum mengenai hal tersebut yang menimbulkan suatu sengketa atas hal-hal tersebut karena sebab apapun juga, maka penghadap akan membebaskan Notaris dan saksi-saksi yang menandatangani akta ini dari segala tuntutan hukum.
- Penghadap telah dikenal oleh saya, Notaris.
---------------- DEMIKIANLAH AKTA INI ---------------
- Dibuat dan dilangsungkan di {WILAYAH_NOTARIS}, pada hari dan tanggal tersebut pada bagian awal akta ini dengan dihadiri oleh:
{SAKSI_1_LENGKAP}
{SAKSI_2_LENGKAP}
- Keduanya karyawan Notaris, yang Saya kenal, sebagai saksi-saksi.
- Segera setelah akta ini dibacakan oleh saya, Notaris kepada para penghadap dan saksi-saksi, maka akta ini ditanda tangani oleh para penghadap, saksi-saksi dan saya, Notaris, serta cap ibu jari oleh penghadap pada lembar kertas terpisah yang dilekatkan pada minuta akta ini.
- Dilangsungkan dengan tanpa tambahan, tanpa penggantian, dan tanpa coretan.
- Minuta akta ini telah ditandatangani dengan sempurna.
---- DIBERIKAN SEBAGAI SALINAN YANG SAMA BUNYINYA ---
NOTARIS DI - {WILAYAH_NOTARIS_KAP}

({NAMA_NOTARIS}, {GELAR_SINGKAT_NOTARIS})`;
  }

  return '';
}

/**
 * Menghasilkan dictionary mapping placeholder {...} ke nilai data formulir
 */
export function buildPlaceholderMap(data, sectionNum, isPreview = false) {
  const tipe = (data.badanUsaha && data.badanUsaha.tipe) || 'PT';

  const val = (str, fallback = '....................') => {
    return (str && typeof str === 'string' && str.trim()) ? str.trim() : (isPreview ? fallback : '');
  };

  let sebutanEntitas = 'perseroan terbatas';
  let sebutanEntitasKap = 'Perseroan';
  let labelPemberiKuasa = 'Para Pemegang Saham Perseroan';
  let labelSirkuler = 'Pemegang Saham';
  let labelOrganLama = 'seluruh anggota Direksi dan Dewan Komisaris Perseroan';
  let labelOrganBaru = 'susunan Direksi dan Dewan Komisaris Perseroan';
  let sebutanPihak = 'pemegang saham';

  if (tipe === 'CV') {
    sebutanEntitas = 'persekutuan komanditer';
    sebutanEntitasKap = 'Persekutuan';
    labelPemberiKuasa = 'Para Pesero Persekutuan';
    labelSirkuler = 'Para Pesero';
    labelOrganLama = 'susunan Persero Pengurus dan Persero Komanditer lama';
    labelOrganBaru = 'susunan Persero Pengurus dan Persero Komanditer baru';
    sebutanPihak = 'para pesero';
  } else if (tipe === 'FIRMA') {
    sebutanEntitas = 'firma';
    sebutanEntitasKap = 'Firma';
    labelPemberiKuasa = 'Para Pesero Firma';
    labelSirkuler = 'Para Pesero';
    labelOrganLama = 'susunan Pesero Pengurus dan Pesero Firma lama';
    labelOrganBaru = 'susunan Pesero Pengurus dan Pesero Firma baru';
    sebutanPihak = 'para pesero';
  } else if (tipe === 'UD') {
    sebutanEntitas = 'usaha dagang';
    sebutanEntitasKap = 'Usaha Dagang';
    labelPemberiKuasa = 'Pemilik Usaha';
    labelSirkuler = 'Pemilik Usaha';
    labelOrganLama = 'pengurusan dan pengelolaan usaha sebelumnya';
    labelOrganBaru = 'susunan kepemilikan dan kuasa pengelola Usaha Dagang';
    sebutanPihak = 'pemilik usaha';
  }

  const rawNotarisNama = (data.notaris?.nama || '').trim();
  const notarisNamaClean = rawNotarisNama.includes(',') ? rawNotarisNama.split(',')[0].trim() : rawNotarisNama;
  const notarisNamaDisplay = notarisNamaClean ? notarisNamaClean.toUpperCase() : (isPreview ? '........................................' : 'GRENDI JAYA DARMAWAN');
  const notarisGelarPanjang = (data.notaris?.gelarPanjang && data.notaris.gelarPanjang.trim())
    ? data.notaris.gelarPanjang.trim()
    : 'Sarjana Hukum, Magister Kenotariatan';
  const notarisGelarSingkat = (data.notaris?.gelarSingkat && data.notaris.gelarSingkat.trim())
    ? data.notaris.gelarSingkat.trim()
    : (rawNotarisNama.includes(',') ? rawNotarisNama.substring(rawNotarisNama.indexOf(',') + 1).trim() : 'S.H., M.Kn.');
  const notarisWilayah = (data.notaris?.wilayah && data.notaris.wilayah.trim()) ? data.notaris.wilayah.trim().toUpperCase() : (isPreview ? '....................' : 'KABUPATEN KUDUS');

  const entitasNama = (data.pt?.nama && data.pt.nama.trim()) ? data.pt.nama.trim().toUpperCase() : (isPreview ? '..............................' : `USAHA ${tipe}`);
  const entitasKedudukan = (data.pt?.kedudukan && data.pt.kedudukan.trim()) ? data.pt.kedudukan.trim().toUpperCase() : (isPreview ? '....................' : 'KABUPATEN KUDUS');

  const tglAktaStr = (data.akta?.tanggal && data.akta.tanggal.trim()) 
    ? formatTanggalAkta(data.akta.tanggal) 
    : (isPreview ? '..................................................' : 'Selasa, tanggal lima belas bulan September tahun dua ribu dua puluh enam (15-09-2026)');
  const jamAktaStr = (data.akta?.jam && data.akta.jam.trim())
    ? formatJamAkta(data.akta.jam)
    : (isPreview ? 'pukul .............. Waktu Indonesia Barat' : 'pukul 11.00 WIB (sebelas Waktu Indonesia Bagian Barat)');

  const sA = Number(data.saham?.totalSeriA || 0);
  const sB = Number(data.saham?.totalSeriB || 0);
  const totalMod = Number(data.modal?.totalNominal || 0);

  const skPendirianLabel = tipe === 'PT' 
    ? 'Pengesahan Badan Hukum Perseroan dari Menteri Hukum dan Hak Asasi Manusia Republik Indonesia, satu dan lain sebagaimana ternyata dari Surat Keputusan Menteri Hukum dan Hak Asasi Manusia Republik Indonesia' 
    : (tipe === 'UD' ? 'NIB / OSS' : 'Kemenkumham RI (SABU) / Pengadilan');
  const skPerubLabel = tipe === 'PT' 
    ? 'Persetujuan Perubahan Anggaran Dasar Perseroan Terbatas dari Menteri Hukum dan Hak Asasi Manusia Republik Indonesia, satu dan lain sebagaimana ternyata dari Surat Keputusan Menteri Hukum dan Hak Asasi Manusia Republik Indonesia' 
    : (tipe === 'UD' ? 'Pembaruan NIB / Izin Usaha' : 'Kemenkumham RI (SABU)');

  // Rincian Daftar Pemegang Saham / Sekutu
  let rincianPemegangSahamText = '';
  if (tipe === 'PT') {
    if (Array.isArray(data.pemegangSaham) && data.pemegangSaham.length > 0) {
      rincianPemegangSahamText = data.pemegangSaham.map(ps => {
        const nm = val(ps.nama, '..............................');
        const psSA = Number(ps.sahamSeriA || 0);
        const psSB = Number(ps.sahamSeriB || 0);
        let sTxt = '';
        if (psSA > 0 && psSB > 0) sTxt = `selaku pemegang ${psSA.toLocaleString('id-ID')} saham Seri-A Perseroan dan pemegang ${psSB.toLocaleString('id-ID')} saham Seri-B Perseroan`;
        else if (psSB > 0) sTxt = `selaku pemegang ${psSB.toLocaleString('id-ID')} saham Seri-B Perseroan`;
        else if (psSA > 0) sTxt = `selaku pemegang ${psSA.toLocaleString('id-ID')} saham Seri-A Perseroan`;
        else sTxt = 'selaku pemegang .......... saham Perseroan';
        const dsc = ps.selaku ? `${ps.selaku} – ${sTxt}` : sTxt;
        return `${nm}\n${dsc}\nTanggal : ${val(ps.tanggalTtd, '....................')};`;
      }).join('\n');
    } else {
      rincianPemegangSahamText = `..............................\nselaku pemegang .......... saham Perseroan\nTanggal : ....................;`;
    }
  } else {
    if (Array.isArray(data.sekutu) && data.sekutu.length > 0) {
      rincianPemegangSahamText = data.sekutu.map(sk => {
        const nm = val(sk.nama, '..............................');
        const nom = Number(sk.nominalInbreng || 0);
        const nomStr = nom > 0 ? `Rp ${nom.toLocaleString('id-ID')},-` : 'Rp. ....................';
        return `${nm}\n${val(sk.statusSekutu, 'Sekutu')} – selaku penyetor modal inbreng sebesar ${nomStr} (${val(sk.persentase, '..')}%)\nTanggal : ${val(sk.tanggalTtd, '....................')};`;
      }).join('\n');
    } else {
      rincianPemegangSahamText = `..............................\nSekutu – selaku penyetor modal inbreng sebesar Rp. .................... (....%)\nTanggal : ....................;`;
    }
  }

  // Rincian Susunan Pengurus Baru
  let rincianPengurusText = '';
  if (Array.isArray(data.pengurusBaru) && data.pengurusBaru.length > 0) {
    rincianPengurusText = data.pengurusBaru.map(pejabat => {
      const rawTitle = val(pejabat.jabatan, 'PENGURUS').toUpperCase();
      const tglLahirStr = (pejabat.tanggalLahir && pejabat.tanggalLahir.trim()) ? formatTanggalBiasa(pejabat.tanggalLahir) : '....................';
      const sapaanO = val(pejabat.sapaan, 'Tuan');
      const namaO = val(pejabat.nama, '..............................');
      const tempatO = val(pejabat.tempatLahir, '....................');
      const wnO = val(pejabat.kewarganegaraan, 'Indonesia');
      const pekO = val(pejabat.pekerjaan, 'Karyawan Swasta');
      const alamatO = val(pejabat.alamat, '..................................................');
      const nikO = val(pejabat.nik, '................');
      return `- ${rawTitle} : ${sapaanO}. ${namaO}, lahir di ${tempatO}, pada ${tglLahirStr}, Warga Negara ${wnO}, ${pekO}, bertempat tinggal di ${alamatO}, pemegang Kartu Tanda Penduduk nomor: ${nikO};`;
    }).join('\n');
  } else {
    rincianPengurusText = `- PENGURUS BARU : Tuan. .............................., lahir di .........., pada ...................., Warga Negara Indonesia, Karyawan Swasta, bertempat tinggal di .................................................., pemegang Kartu Tanda Penduduk nomor: ................;`;
  }

  // Saksi 1 & 2
  const sk1Sapaan = val(data.saksi1?.sapaan, 'Nona');
  const sk1Nama = val(data.saksi1?.nama, '..............................');
  const sk1Tempat = val(data.saksi1?.tempatLahir, '..........');
  const sk1Tgl = (data.saksi1?.tanggalLahir && data.saksi1.tanggalLahir.trim()) ? formatTanggalBiasa(data.saksi1.tanggalLahir) : '....................';
  const sk1Wn = val(data.saksi1?.kewarganegaraan, 'Indonesia');
  const sk1Pek = val(data.saksi1?.pekerjaan, 'Karyawan Swasta');
  const sk1Alamat = val(data.saksi1?.alamat, '..................................................');
  const sk1Nik = val(data.saksi1?.nik, '................');
  const saksi1Lengkap = `1. ${sk1Sapaan}. ${sk1Nama}, lahir di ${sk1Tempat}, pada ${sk1Tgl}, Warga Negara ${sk1Wn}, ${sk1Pek}, bertempat tinggal di ${sk1Alamat}, pemegang Kartu Tanda Penduduk nomor: ${sk1Nik};`;

  const sk2Sapaan = val(data.saksi2?.sapaan, 'Nona');
  const sk2Nama = val(data.saksi2?.nama, '..............................');
  const sk2Tempat = val(data.saksi2?.tempatLahir, '..........');
  const sk2Tgl = (data.saksi2?.tanggalLahir && data.saksi2.tanggalLahir.trim()) ? formatTanggalBiasa(data.saksi2.tanggalLahir) : '....................';
  const sk2Wn = val(data.saksi2?.kewarganegaraan, 'Indonesia');
  const sk2Pek = val(data.saksi2?.pekerjaan, 'Karyawan Swasta');
  const sk2Alamat = val(data.saksi2?.alamat, '..................................................');
  const sk2Nik = val(data.saksi2?.nik, '................');
  const saksi2Lengkap = `2. ${sk2Sapaan}. ${sk2Nama}, lahir di ${sk2Tempat}, pada ${sk2Tgl}, Warga Negara ${sk2Wn}, ${sk2Pek}, bertempat tinggal di ${sk2Alamat}, pemegang Kartu Tanda Penduduk nomor: ${sk2Nik};`;

  return {
    '{NOMOR_AKTA}': val(data.akta?.nomor, '........'),
    '{HARI_TANGGAL_AKTA}': tglAktaStr,
    '{JAM_AKTA}': jamAktaStr,
    '{NAMA_NOTARIS}': notarisNamaDisplay,
    '{GELAR_PANJANG_NOTARIS}': notarisGelarPanjang,
    '{GELAR_SINGKAT_NOTARIS}': notarisGelarSingkat,
    '{WILAYAH_NOTARIS}': (data.notaris?.wilayah && data.notaris.wilayah.trim()) ? data.notaris.wilayah.trim() : (isPreview ? '....................' : 'Kabupaten Kudus'),
    '{WILAYAH_NOTARIS_KAP}': notarisWilayah,
    '{NAMA_ENTITAS}': entitasNama,
    '{KEDUDUKAN_ENTITAS}': entitasKedudukan,
    '{SEBUTAN_ENTITAS}': sebutanEntitas,
    '{SEBUTAN_ENTITAS_KAP}': sebutanEntitasKap,
    '{JABATAN_PENGHADAP}': val(data.penghadap?.jabatan, (tipe === 'PT' ? 'Direktur' : (tipe === 'UD' ? 'Pemilik' : 'Persero Pengurus'))),
    '{NO_AKTA_PENDIRIAN}': val(data.pt?.aktaPendirianNomor, '......'),
    '{TGL_AKTA_PENDIRIAN}': (data.pt?.aktaPendirianTgl && data.pt.aktaPendirianTgl.trim()) ? formatTanggalTanpaAwalan(data.pt.aktaPendirianTgl) : '....................',
    '{NOTARIS_PENDIRIAN}': val(data.pt?.aktaPendirianNotaris, '..............................'),
    '{WILAYAH_NOTARIS_PENDIRIAN}': val(data.pt?.aktaPendirianWilayah, '....................'),
    '{SK_PENDIRIAN_LABEL}': skPendirianLabel,
    '{NO_SK_PENDIRIAN}': val(data.pt?.skPendirianNomor, '..............................'),
    '{TGL_SK_PENDIRIAN}': (data.pt?.skPendirianTgl && data.pt.skPendirianTgl.trim()) ? formatTanggalTanpaAwalan(data.pt.skPendirianTgl) : '....................',
    '{NO_AKTA_PERUBAHAN}': val(data.pt?.aktaPerubahanNomor, '......'),
    '{TGL_AKTA_PERUBAHAN}': (data.pt?.aktaPerubahanTgl && data.pt.aktaPerubahanTgl.trim()) ? formatTanggalTanpaAwalan(data.pt.aktaPerubahanTgl) : '....................',
    '{NOTARIS_PERUBAHAN_DENGAN_WILAYAH}': (val(data.pt?.aktaPerubahanNotaris, '..............................').toLowerCase().startsWith('saya')
      ? `${val(data.pt?.aktaPerubahanNotaris, '..............................')},`
      : `${val(data.pt?.aktaPerubahanNotaris, '..............................')}, Notaris di ${val(data.pt?.aktaPerubahanWilayah, '....................')},`),
    '{NOTARIS_PERUBAHAN}': val(data.pt?.aktaPerubahanNotaris, '..............................'),
    '{WILAYAH_NOTARIS_PERUBAHAN}': val(data.pt?.aktaPerubahanWilayah, '....................'),
    '{SK_PERUBAHAN_LABEL}': skPerubLabel,
    '{NO_SK_PERUBAHAN}': val(data.pt?.skPerubahanNomor, '..............................'),
    '{TGL_SK_PERUBAHAN}': (data.pt?.skPerubahanTgl && data.pt.skPerubahanTgl.trim()) ? formatTanggalTanpaAwalan(data.pt.skPerubahanTgl) : '....................',
    '{NO_PEMBERITAHUAN_PERUBAHAN}': val(data.pt?.pemberitahuanPerubahanNomor, '..............................'),
    '{PASAL_SIRKULER}': val(data.pt?.pasalSirkuler, '10 ayat (5)'),
    '{SAPAAN_PENGHADAP}': val(data.penghadap?.sapaan, 'Tuan'),
    '{NAMA_PENGHADAP}': val(data.penghadap?.nama, '..............................'),
    '{TEMPAT_LAHIR_PENGHADAP}': val(data.penghadap?.tempatLahir, '....................'),
    '{TGL_LAHIR_PENGHADAP}': (data.penghadap?.tanggalLahir && data.penghadap.tanggalLahir.trim()) ? formatTanggalBiasa(data.penghadap.tanggalLahir) : '....................',
    '{WN_PENGHADAP}': val(data.penghadap?.kewarganegaraan, 'Indonesia'),
    '{PEKERJAAN_PENGHADAP}': val(data.penghadap?.pekerjaan, 'Karyawan Swasta'),
    '{ALAMAT_PENGHADAP}': val(data.penghadap?.alamat, '..................................................'),
    '{NIK_PENGHADAP}': val(data.penghadap?.nik, '................'),
    '{LABEL_PEMBERI_KUASA}': labelPemberiKuasa,
    '{LABEL_SIRKULER}': labelSirkuler,
    '{LABEL_SIRKULER_UPPER}': labelSirkuler.toUpperCase(),
    '{LABEL_ORGAN_LAMA}': labelOrganLama,
    '{LABEL_ORGAN_BARU}': labelOrganBaru,
    '{SEBUTAN_PIHAK}': sebutanPihak,
    '{TOTAL_SAHAM_A}': sA > 0 ? formatSaham(sA) : '..........',
    '{TOTAL_SAHAM_B}': sB > 0 ? formatSaham(sB) : '..........',
    '{TOTAL_MODAL_INBRENG}': totalMod > 0 ? `Rp ${totalMod.toLocaleString('id-ID')},-` : 'Rp. ....................',
    '{RINCIAN_DAFTAR_PEMEGANG_SAHAM_SEKUTU}': rincianPemegangSahamText,
    '{MASA_JABATAN}': val(data.keputusan?.masaJabatan, '5 (lima)'),
    '{RINCIAN_SUSUNAN_PENGURUS_BARU}': rincianPengurusText,
    '{SAKSI_1_LENGKAP}': saksi1Lengkap,
    '{SAKSI_2_LENGKAP}': saksi2Lengkap,

    // Placeholders Tambahan RUPS & Peningkatan Modal
    '{HARI_TANGGAL_RUPS}': (data.rups?.tanggal && data.rups.tanggal.trim()) ? formatTanggalAkta(data.rups.tanggal) : (isPreview ? '..................................................' : 'Jumat, tanggal dua puluh dua bulan November tahun dua ribu dua puluh empat (22-11-2024)'),
    '{JAM_RUPS}': val(data.rups?.jam, '08.00 WIB'),
    '{TEMPAT_RUPS}': val(data.rups?.tempat, 'Kantor Perseroan'),
    '{PIMPINAN_RUPS}': val(data.rups?.pimpinan, 'Pimpinan Rapat'),
    '{TOTAL_SAHAM_HADIR_RUPS}': Number(data.rups?.sahamHadir || 0) > 0 ? formatSaham(data.rups.sahamHadir) : '..........',
    '{MODAL_SEMULA_NOMINAL}': Number(data.peningkatanModal?.modalSemulaNominal || 0) > 0 ? formatRupiah(data.peningkatanModal.modalSemulaNominal) : 'Rp. ....................',
    '{MODAL_SEMULA_SAHAM}': Number(data.peningkatanModal?.modalSemulaSaham || 0) > 0 ? formatSaham(data.peningkatanModal.modalSemulaSaham) : '..........',
    '{MODAL_MENJADI_NOMINAL}': Number(data.peningkatanModal?.modalMenjadiNominal || 0) > 0 ? formatRupiah(data.peningkatanModal.modalMenjadiNominal) : 'Rp. ....................',
    '{MODAL_MENJADI_SAHAM}': Number(data.peningkatanModal?.modalMenjadiSaham || 0) > 0 ? formatSaham(data.peningkatanModal.modalMenjadiSaham) : '..........',
    '{TOTAL_SAHAM_MENJADI}': Number(data.peningkatanModal?.modalMenjadiSaham || 0) > 0 ? formatSaham(data.peningkatanModal.modalMenjadiSaham) : '..........',
    '{JML_SAHAM_DIKELUARKAN}': (() => {
      const v = Number(data.peningkatanModal?.sahamSimpananDikeluarkanJml ?? data.peningkatanModal?.sahamDikeluarkanJml ?? 0);
      return v > 0 ? formatSaham(v) : '..........';
    })(),
    '{NOMINAL_SAHAM_DIKELUARKAN}': (() => {
      const v = Number(data.peningkatanModal?.sahamSimpananDikeluarkanNominal ?? data.peningkatanModal?.sahamDikeluarkanNominal ?? 0);
      return v > 0 ? formatRupiah(v) : 'Rp. ....................';
    })(),
    '{NAMA_PENGAMBIL_BAGIAN}': val(data.peningkatanModal?.pengambilNama, '..............................'),
    '{NAMA_PELEPAS_HAK}': val(data.peningkatanModal?.pelepasanNama, '..............................'),
    '{RINCIAN_PEMEGANG_SAHAM_MODAL_KOLOM}': (Array.isArray(data.peningkatanModal?.pemegangSahamModal) && data.peningkatanModal.pemegangSahamModal.length > 0)
      ? data.peningkatanModal.pemegangSahamModal.map((ps, idx) => {
          const jml = Number(ps.jumlahSaham ?? ps.lembarSaham ?? 0);
          const nom = Number(ps.nominal ?? ps.totalNominal ?? 0);
          return `${idx + 1}. ${ps.nama || '....................'}, sebanyak ${formatSaham(jml)} saham atau senilai ${formatRupiah(nom)};`;
        }).join('\n')
      : '1. .............................., sebanyak .......... saham senilai Rp. ....................;'
  };
}

/**
 * Menyubstitusi placeholder {...} dalam teks template dengan nilai data
 */
export function substitutePlaceholders(templateStr, data, sectionNum, isPreview = false) {
  if (!templateStr) return '';
  const map = buildPlaceholderMap(data, sectionNum, isPreview);
  let result = templateStr;
  for (const [tag, replacement] of Object.entries(map)) {
    // Ganti seluruh kemunculan tag secara global
    result = result.split(tag).join(replacement);
  }
  return result;
}

/**
 * Mengonversi teks template yang sudah disubstitusi menjadi baris-baris objek akta notaris (53 karakter)
 */
export function renderTemplateTextToLines(renderedText, maxChars = 53, formatTextToNotaryLinesFn) {
  const lines = [];
  if (!renderedText) return lines;

  const paragraphs = renderedText.split('\n');

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

  for (let i = 0; i < paragraphs.length; i++) {
    const rawP = paragraphs[i].trim();
    if (!rawP) continue;

    // Deteksi baris yang perlu perataan tengah (Center/Bold)
    const isHeading = rawP.startsWith('AKTA PERNYATAAN') ||
      rawP.startsWith('PARA PEMEGANG SAHAM') ||
      rawP.startsWith('RAPAT UMUM PEMEGANG SAHAM') ||
      rawP.startsWith('PERSEROAN TERBATAS') ||
      rawP.startsWith('PERSEKUTUAN KOMANDITER') ||
      rawP.startsWith('FIRMA') ||
      rawP.startsWith('PERUSAHAAN PERORANGAN') ||
      rawP.startsWith('BERKEDUDUKAN DI') ||
      rawP.startsWith('Nomor :') ||
      rawP.startsWith('----') ||
      rawP.startsWith('NOTARIS DI') ||
      (rawP.startsWith('(') && rawP.endsWith(')'));

    if (isHeading) {
      const isUnderlined = rawP.startsWith('(') && rawP.endsWith(')');
      addCenterBlock(rawP, { bold: true, underline: isUnderlined });
    } else if (rawP.startsWith('- ') && rawP.includes(' : ')) {
      const colonIdx = rawP.indexOf(' : ');
      const rawTitle = rawP.substring(2, colonIdx).trim().toUpperCase();
      const rawOfficerRight = rawP.substring(colonIdx + 3).trim();

      if (rawTitle.length <= 18) {
        const col1Width = 25;
        const col2Width = maxChars - col1Width;
        const jabatanLabel = `- ${rawTitle}`;
        const diff1 = col1Width - jabatanLabel.length - 3;
        const pad1 = diff1 > 0 ? ' ' + '-'.repeat(diff1 - 1) : '';
        const firstPrefix = (jabatanLabel + pad1 + ' : ').padEnd(col1Width, '-');
        const contPrefix = '-'.repeat(col1Width - 1) + ' ';

        const rightLines = formatTextToNotaryLinesFn(rawOfficerRight, col2Width);
        rightLines.forEach((rLine, rIdx) => {
          const prefix = rIdx === 0 ? firstPrefix : contPrefix;
          lines.push({ text: prefix + rLine, align: 'left', bold: false });
        });
      } else {
        const formatted = formatTextToNotaryLinesFn(rawP, maxChars);
        formatted.forEach(l => lines.push({ text: l, align: 'left', bold: false }));
      }
    } else {
      const formatted = formatTextToNotaryLinesFn(rawP, maxChars);
      formatted.forEach(l => lines.push({ text: l, align: 'left', bold: false }));
    }
  }

  return lines;
}

