import {
  terbilang,
  formatTanggalAkta,
  formatTanggalBiasa,
  formatTanggalTanpaAwalan,
  formatJamAkta,
  formatSaham,
  formatRupiah
} from './utils/terbilang.js';
import {
  validasiDataAkta
} from './utils/spellcheck.js';
import {
  generateAktaWord,
  exportInternalDocx,
  generateNotaryPages,
  buildInternalDocModel
} from './utils/docGenerator.js';
import {
  SECTION_NAMES,
  DEED_SECTION_ORDER,
  getAvailablePlaceholders,
  getDefaultClauseTemplate
} from './utils/clauseTemplates.js';
import { DEMO_CONFIG } from './demoConfig.js';
import { initDemoTrial } from './utils/demoTrial.js';
import fileSaver from 'file-saver';
const saveAs = fileSaver.saveAs || fileSaver;

// State Aplikasi
const state = {
  entityType: 'PT', // 'PT' | 'CV' | 'FIRMA' | 'UD'
  ptSubType: 'SIRKULER_PENGURUS', // 'SIRKULER_PENGURUS' | 'SIRKULER_MODAL' | 'RUPS_MODAL'
  pemegangSaham: [],
  pemegangSahamModal: [],
  sekutu: [],
  pengurusBaru: [],
  currentDraftFilePath: null, // Jalur berkas draf yang sedang aktif di disk
  customTemplates: {}, // Template redaksional khusus draf aktif: { section1: "...", ... }
  currentModalSection: null,
  previousView: 'dashboard', // 'dashboard' | 'editor'
  activeFieldKey: null, // Kunci field input yang sedang difokuskan / disorot
  activeFieldLabel: null, // Label input yang sedang disorot
  previewMode: 'deed', // 'deed' | 'internal'
  previewZoomMode: 'fit', // 'fit' | '0.85' | '1'
  isPreviewExpanded: false // Mode perbesar panel preview kanan
};

// 1. DATA DEMO PT (Sesuai File Asli Notaris Klien - Perubahan Pengurus)
const DEMO_DATA_PT = {
  badanUsaha: { tipe: 'PT' },
  subTipe: 'SIRKULER_PENGURUS',
  akta: {
    nomor: '23',
    tanggal: '2026-09-15',
    jam: '11:00'
  },
  notaris: {
    nama: 'GRENDI JAYA DARMAWAN',
    gelarPanjang: 'Sarjana Hukum, Magister Kenotariatan',
    gelarSingkat: 'S.H., M.Kn.',
    wilayah: 'Kabupaten Kudus'
  },
  pt: {
    nama: 'PT. SEHAT DAN BAHAGIA SELALU',
    kedudukan: 'Kabupaten Kudus',
    aktaPendirianNomor: '27',
    aktaPendirianTgl: '2010-08-12',
    aktaPendirianNotaris: 'Apriliana Dewi Yuwono, Sarjana Hukum, Magister Kenotariatan',
    aktaPendirianWilayah: 'Kabupaten Kudus',
    skPendirianNomor: 'AHU-45831.AH.01.01.Tahun 2010',
    skPendirianTgl: '2010-09-28',
    aktaPerubahanNomor: '14',
    aktaPerubahanTgl: '2023-12-18',
    aktaPerubahanNotaris: 'Saya, Notaris',
    aktaPerubahanWilayah: 'Kabupaten Kudus',
    skPerubahanNomor: 'AHU-0079724.AH.01.02.Tahun 2023',
    skPerubahanTgl: '2023-12-19',
    pemberitahuanPerubahanNomor: 'AHU-AH.01.03-0158964',
    pasalSirkuler: '10 ayat (5)'
  },
  penghadap: {
    sapaan: 'Tuan',
    nama: 'BULAN SABIT',
    tempatLahir: 'Temanggung',
    tanggalLahir: '1977-06-30',
    nik: '6666611001020001',
    pekerjaan: 'Karyawan Swasta',
    kewarganegaraan: 'Indonesia',
    jabatan: 'Direktur',
    alamat: 'Kabupaten Kudus, Provinsi Jawa Tengah, Perumahan Lestari Jaya, Rukun Tetangga 004, Rukun Warga 004, Kecamatan Kayu, Kelurahan Bintang'
  },
  saham: {
    totalSeriA: 293100,
    totalSeriB: 147383
  },
  modal: {
    totalNominal: 0
  },
  keputusan: {
    masaJabatan: '5 (lima)',
    tglEfektif: '2026-09-10'
  },
  pemegangSaham: [
    {
      nama: 'Tuan. BINTANG BULAN',
      selaku: 'Direktur perseroan terbatas “PT. ANUGERAH LANCAR JAYA”',
      sahamSeriA: 149481,
      sahamSeriB: 765,
      tanggalTtd: '10 September 2026'
    },
    {
      nama: 'Tuan. MATAHARI TERBIT',
      selaku: 'Direktur perseroan terbatas “PT. BUMI ITU BULAT”',
      sahamSeriA: 143619,
      sahamSeriB: 735,
      tanggalTtd: '10 September 2026'
    },
    {
      nama: 'Tuan. BULAN SABIT',
      selaku: 'Direktur perseroan terbatas “PT. LESTARI JAYA ABADI”',
      sahamSeriA: 0,
      sahamSeriB: 145883,
      tanggalTtd: '10 September 2026'
    }
  ],
  sekutu: [],
  pengurusBaru: [
    {
      jabatan: 'Direktur Utama',
      sapaan: 'Tuan',
      nama: 'PANGERAN KELINCI',
      tempatLahir: 'Semarang',
      tanggalLahir: '1980-07-30',
      kewarganegaraan: 'Indonesia',
      pekerjaan: 'Karyawan Swasta',
      nik: '3333399900000111',
      alamat: 'Kota Tangerang Selatan, Provinsi Banten, Jalan Sutera Delima I Nomor. 23, Rukun Tetangga 003, Rukun Warga 010, Kecamatan Serpong Utara, Kelurahan Pondok Jagung'
    },
    {
      jabatan: 'Direktur',
      sapaan: 'Tuan',
      nama: 'BUKAN SEMBARANGAN',
      tempatLahir: 'Rembang',
      tanggalLahir: '1970-01-28',
      kewarganegaraan: 'Indonesia',
      pekerjaan: 'Karyawan Swasta',
      nik: '3434555500011111',
      alamat: 'Kota Surabaya, Provinsi Jawa Timur, Darmo Baru Timur 100, Rukun Tetangga 001, Rukun Warga 004, Kecamatan Sukomanunggal, Kelurahan Sono Kwijenan'
    },
    {
      jabatan: 'Komisaris',
      sapaan: 'Tuan',
      nama: 'TERNYATA KAMULAH',
      tempatLahir: 'Surabaya',
      tanggalLahir: '1971-10-18',
      kewarganegaraan: 'Indonesia',
      pekerjaan: 'Karyawan Swasta',
      nik: '3333336667777111',
      alamat: 'Kabupaten Kudus, Provinsi Jawa Tengah, Perumahan Jati Permai Nomor. 24, Rukun Tetangga 009, Rukun Warga 003, Kecamatan Jati, Kelurahan Getaspejaten'
    }
  ],
  saksi1: {
    sapaan: 'Nona',
    nama: 'INDAH YUNI RETNONINGTYAS',
    tempatLahir: 'Kudus',
    tanggalLahir: '1999-06-09',
    nik: '3319014906990003',
    pekerjaan: 'Swasta',
    alamat: 'Kabupaten Kudus, Provinsi Jawa Tengah, Kedungdowo, Rukun Tetangga 003, Rukun Warga 007, Kecamatan Kaliwungu, Kelurahan Kedungdowo'
  },
  saksi2: {
    sapaan: 'Nona',
    nama: 'MEILIANI PRAVITA SARI',
    tempatLahir: 'Kudus',
    tanggalLahir: '1995-05-26',
    nik: '3319026605950002',
    pekerjaan: 'Karyawan Swasta',
    alamat: 'Kabupaten Kudus, Provinsi Jawa Tengah, Singocandi, Rukun Tetangga 004, Rukun Warga 004, Kecamatan Kota Kudus, Kelurahan Singocandi'
  }
};

// 1B. DATA DEMO PT SIRKULER PENINGKATAN MODAL (PT. BERKAH SELALU - Akta No. 17)
const DEMO_DATA_PT_SIRKULER_MODAL = {
  badanUsaha: { tipe: 'PT' },
  subTipe: 'SIRKULER_MODAL',
  akta: {
    nomor: '17',
    tanggal: '2025-12-26',
    jam: '15:00'
  },
  notaris: {
    nama: 'GRENDI JAYA DARMAWAN',
    gelarPanjang: 'Sarjana Hukum, Magister Kenotariatan',
    gelarSingkat: 'S.H., M.Kn.',
    wilayah: 'Kabupaten Kudus'
  },
  pt: {
    nama: 'PT. BERKAH SELALU',
    kedudukan: 'Kabupaten Kudus',
    aktaPendirianNomor: '08',
    aktaPendirianTgl: '2023-10-18',
    aktaPendirianNotaris: 'GRENDI JAYA DARMAWAN, Sarjana Hukum, Magister Kenotariatan',
    aktaPendirianWilayah: 'Kabupaten Kudus',
    skPendirianNomor: 'AHU-0076269.AH.01.01.TAHUN 2023',
    skPendirianTgl: '2023-10-19',
    aktaPerubahanNomor: '07',
    aktaPerubahanTgl: '2025-12-09',
    aktaPerubahanNotaris: 'Saya, Notaris',
    aktaPerubahanWilayah: 'Kabupaten Kudus',
    skPerubahanNomor: 'AHU-0081299.AH.01.02.TAHUN 2025',
    skPerubahanTgl: '2025-12-10',
    pemberitahuanPerubahanNomor: 'AHU-AH.01.09-0365191',
    pasalSirkuler: '10 ayat (5)'
  },
  penghadap: {
    sapaan: 'Tuan',
    nama: 'BUDI BERKAH YANTO',
    tempatLahir: 'Kudus',
    tanggalLahir: '1987-10-09',
    nik: '3319080910870001',
    pekerjaan: 'Karyawan Swasta',
    kewarganegaraan: 'Indonesia',
    jabatan: 'Direktur Utama',
    alamat: 'Kabupaten Kudus, Provinsi Jawa Tengah, Desa Rendeng, Rukun Tetangga 004, Rukun Warga 002, Kecamatan Kota Kudus'
  },
  saham: {
    totalSeriA: 0,
    totalSeriB: 0
  },
  modal: {
    totalNominal: 0
  },
  peningkatanModal: {
    modalSemulaNominal: 353201000000,
    modalSemulaSaham: 353201,
    nominalPerSaham: 1000000,
    modalMenjadiNominal: 962506000000,
    modalMenjadiSaham: 962506,
    sahamSimpananDikeluarkanJml: 609305,
    sahamSimpananDikeluarkanNominal: 609305000000,
    pengambilNama: 'perseroan terbatas PT. JAYA ABADI SELALU',
    pengambilKedudukan: 'Kabupaten Kudus',
    pengambilAktaPendirian: 'Akta Pendirian No. 24 tgl 27-12-2016 Notaris Lindawati Kudus, SK Menkumham tgl 29-12-2016 No. AHU-0058025.AH.01.01.Tahun 2016',
    pengambilAktaPerubahan: 'Akta Perubahan No. 11 tgl 22-12-2025 Notaris Saya, Notaris, SK tgl 24-12-2025 No. AHU-0085097.AH.01.02.Tahun 2025 & AHU-AH.01.03-0257678',
    pelepasanNama: 'perseroan terbatas PT. PELITA JAYA SELALU',
    pelepasanKedudukan: 'Kabupaten Kudus',
    pelepasanLegalitas: 'Akta Pendirian No. 2 tgl 02-11-2018 Notaris Lindawati Kudus, SK AHU-0052955; Akta Perubahan No. 3 tgl 09-12-2025 Notaris Saya, Penerimaan AHU-AH.01.09-0365211',
    pemegangSahamModal: [
      {
        nama: 'PT. JAYA ABADI SELALU',
        jumlahSaham: 962505,
        nominal: 962505000000,
        persentase: '99,999'
      },
      {
        nama: 'PT. PELITA JAYA SELALU',
        jumlahSaham: 1,
        nominal: 1000000,
        persentase: '0,001'
      }
    ]
  },
  keputusan: {
    masaJabatan: '5 (lima)',
    tglEfektif: '2025-12-26'
  },
  pemegangSaham: [],
  sekutu: [],
  pengurusBaru: [],
  saksi1: {
    sapaan: 'Nona',
    nama: 'INDAH YUNI RETNONINGTYAS',
    tempatLahir: 'Kudus',
    tanggalLahir: '1999-06-09',
    nik: '3319014906990003',
    pekerjaan: 'Swasta',
    alamat: 'Kabupaten Kudus, Provinsi Jawa Tengah, Kedungdowo, Rukun Tetangga 003, Rukun Warga 007, Kecamatan Kaliwungu, Kelurahan Kedungdowo'
  },
  saksi2: {
    sapaan: 'Nona',
    nama: 'MEILIANI PRAVITA SARI',
    tempatLahir: 'Kudus',
    tanggalLahir: '1995-05-26',
    nik: '3319026605950002',
    pekerjaan: 'Karyawan Swasta',
    alamat: 'Kabupaten Kudus, Provinsi Jawa Tengah, Singocandi, Rukun Tetangga 004, Rukun Warga 004, Kecamatan Kota Kudus, Kelurahan Singocandi'
  }
};

// 1C. DATA DEMO PT RUPS PENINGKATAN MODAL (PT. CIPTA INDAH KELUARGA - Akta No. 4)
const DEMO_DATA_PT_RUPS_MODAL = {
  badanUsaha: { tipe: 'PT' },
  subTipe: 'RUPS_MODAL',
  akta: {
    nomor: '04',
    tanggal: '2024-11-25',
    jam: '09:00'
  },
  notaris: {
    nama: 'GRENDI JAYA DARMAWAN',
    gelarPanjang: 'Sarjana Hukum, Magister Kenotariatan',
    gelarSingkat: 'S.H., M.Kn.',
    wilayah: 'Kabupaten Kudus'
  },
  pt: {
    nama: 'PT. CIPTA INDAH KELUARGA',
    kedudukan: 'Kabupaten Kudus',
    aktaPendirianNomor: '01',
    aktaPendirianTgl: '2021-09-01',
    aktaPendirianNotaris: 'GRENDI JAYA DARMAWAN, Sarjana Hukum, Magister Kenotariatan',
    aktaPendirianWilayah: 'Kabupaten Kudus',
    skPendirianNomor: 'AHU-0056123.AH.01.01.TAHUN 2021',
    skPendirianTgl: '2021-09-02',
    aktaPerubahanNomor: '03',
    aktaPerubahanTgl: '2023-05-15',
    aktaPerubahanNotaris: 'Saya, Notaris',
    aktaPerubahanWilayah: 'Kabupaten Kudus',
    skPerubahanNomor: 'AHU-0034112.AH.01.02.TAHUN 2023',
    skPerubahanTgl: '2023-05-16',
    pemberitahuanPerubahanNomor: 'AHU-AH.01.09-0123456',
    pasalSirkuler: '10 ayat (5)'
  },
  penghadap: {
    sapaan: 'Tuan',
    nama: 'TEJO PERSADA',
    tempatLahir: 'Kudus',
    tanggalLahir: '1975-04-12',
    nik: '3319011204750002',
    pekerjaan: 'Swasta',
    kewarganegaraan: 'Indonesia',
    jabatan: 'Direktur',
    alamat: 'Kabupaten Kudus, Provinsi Jawa Tengah, Desa Wergu Wetan, Rukun Tetangga 002, Rukun Warga 003, Kecamatan Kota Kudus'
  },
  rups: {
    tanggal: '2024-11-22',
    jam: '08.00 WIB',
    tempat: 'Kantor Perseroan di Jalan Tanjung Karang nomor. 11, Kelurahan Jati Kulon, Kecamatan Jati, Kabupaten Kudus',
    pimpinan: 'Tuan TEJO PERSADA',
    sahamHadir: 199000
  },
  saham: {
    totalSeriA: 0,
    totalSeriB: 0
  },
  modal: {
    totalNominal: 0
  },
  peningkatanModal: {
    modalSemulaNominal: 199000000000,
    modalSemulaSaham: 199000,
    nominalPerSaham: 1000000,
    modalMenjadiNominal: 204000000000,
    modalMenjadiSaham: 204000,
    sahamSimpananDikeluarkanJml: 5000,
    sahamSimpananDikeluarkanNominal: 5000000000,
    pengambilNama: 'perseroan terbatas PT. CIPTA PERSADA INDONESIA',
    pengambilKedudukan: 'Kabupaten Kudus',
    pengambilAktaPendirian: 'Akta Pendirian No. 10 tgl 15-03-2015 Notaris Lindawati Kudus, SK Menkumham tgl 18-03-2015 No. AHU-0012345.AH.01.01.Tahun 2015',
    pengambilAktaPerubahan: 'Akta Perubahan No. 05 tgl 10-10-2024 Notaris Saya, Notaris, SK tgl 12-10-2024 No. AHU-0065432.AH.01.02.Tahun 2024',
    pelepasanNama: 'perseroan terbatas PT. HARUM SEMERBAK',
    pelepasanKedudukan: 'Kabupaten Kudus',
    pelepasanLegalitas: 'Akta Pendirian No. 5 tgl 12-08-2017 Notaris Lindawati Kudus, SK AHU-0034567; Akta Perubahan No. 2 tgl 15-09-2024 Notaris Saya, Penerimaan AHU-AH.01.09-0234567',
    pemegangSahamModal: [
      {
        nama: 'PT. CIPTA PERSADA INDONESIA',
        jumlahSaham: 203999,
        nominal: 203999000000,
        persentase: '99,999'
      },
      {
        nama: 'PT. HARUM SEMERBAK',
        jumlahSaham: 1,
        nominal: 1000000,
        persentase: '0,001'
      }
    ]
  },
  keputusan: {
    masaJabatan: '5 (lima)',
    tglEfektif: '2024-11-22'
  },
  pemegangSaham: [],
  sekutu: [],
  pengurusBaru: [],
  saksi1: {
    sapaan: 'Nona',
    nama: 'INDAH YUNI RETNONINGTYAS',
    tempatLahir: 'Kudus',
    tanggalLahir: '1999-06-09',
    nik: '3319014906990003',
    pekerjaan: 'Swasta',
    alamat: 'Kabupaten Kudus, Provinsi Jawa Tengah, Kedungdowo, Rukun Tetangga 003, Rukun Warga 007, Kecamatan Kaliwungu, Kelurahan Kedungdowo'
  },
  saksi2: {
    sapaan: 'Nona',
    nama: 'MEILIANI PRAVITA SARI',
    tempatLahir: 'Kudus',
    tanggalLahir: '1995-05-26',
    nik: '3319026605950002',
    pekerjaan: 'Karyawan Swasta',
    alamat: 'Kabupaten Kudus, Provinsi Jawa Tengah, Singocandi, Rukun Tetangga 004, Rukun Warga 004, Kecamatan Kota Kudus, Kelurahan Singocandi'
  }
};

// 2. DATA DEMO CV (Persekutuan Komanditer)
const DEMO_DATA_CV = {
  badanUsaha: { tipe: 'CV' },
  akta: {
    nomor: '12',
    tanggal: '2026-10-15',
    jam: '10:00'
  },
  notaris: {
    nama: 'GRENDI JAYA DARMAWAN',
    gelarPanjang: 'Sarjana Hukum, Magister Kenotariatan',
    gelarSingkat: 'S.H., M.Kn.',
    wilayah: 'Kabupaten Kudus'
  },
  pt: {
    nama: 'CV. MAJU BERSAMA JAYA',
    kedudukan: 'Kabupaten Kudus',
    aktaPendirianNomor: '08',
    aktaPendirianTgl: '2018-04-10',
    aktaPendirianNotaris: 'Apriliana Dewi Yuwono, S.H., M.Kn.',
    aktaPendirianWilayah: 'Kabupaten Kudus',
    skPendirianNomor: 'AHU-0012345.AH.02.01.TAHUN 2018 (SABU)',
    skPendirianTgl: '2018-04-20',
    aktaPerubahanNomor: '05',
    aktaPerubahanTgl: '2024-02-14',
    aktaPerubahanNotaris: 'Saya, Notaris',
    aktaPerubahanWilayah: 'Kabupaten Kudus',
    skPerubahanNomor: 'AHU-0005432.AH.02.02.TAHUN 2024',
    skPerubahanTgl: '2024-02-18',
    pemberitahuanPerubahanNomor: 'AHU-SABU.01-009821',
    pasalSirkuler: '8 ayat (2)'
  },
  penghadap: {
    sapaan: 'Tuan',
    nama: 'H. AHMAD FAUZI',
    tempatLahir: 'Kudus',
    tanggalLahir: '1982-03-14',
    nik: '3319011403820005',
    pekerjaan: 'Wiraswasta',
    kewarganegaraan: 'Indonesia',
    jabatan: 'Persero Pengurus (Direktur)',
    alamat: 'Kabupaten Kudus, Provinsi Jawa Tengah, Desa Demaan RT 002, RW 001, Kecamatan Kota Kudus'
  },
  saham: { totalSeriA: 0, totalSeriB: 0 },
  modal: {
    totalNominal: 500000000
  },
  keputusan: {
    masaJabatan: '5 (lima)',
    tglEfektif: '2026-10-12'
  },
  pemegangSaham: [],
  sekutu: [
    {
      nama: 'Tuan. H. AHMAD FAUZI',
      statusSekutu: 'Persero Pengurus',
      nominalInbreng: 300000000,
      persentase: '60',
      tanggalTtd: '12 Oktober 2026'
    },
    {
      nama: 'Nyonya. SITI RAHMAWATI',
      statusSekutu: 'Persero Komanditer',
      nominalInbreng: 200000000,
      persentase: '40',
      tanggalTtd: '12 Oktober 2026'
    }
  ],
  pengurusBaru: [
    {
      jabatan: 'Persero Pengurus (Direktur)',
      sapaan: 'Tuan',
      nama: 'H. AHMAD FAUZI',
      tempatLahir: 'Kudus',
      tanggalLahir: '1982-03-14',
      kewarganegaraan: 'Indonesia',
      pekerjaan: 'Wiraswasta',
      nik: '3319011403820005',
      alamat: 'Kabupaten Kudus, Desa Demaan RT 002, RW 001, Kecamatan Kota Kudus'
    },
    {
      jabatan: 'Persero Komanditer',
      sapaan: 'Nyonya',
      nama: 'SITI RAHMAWATI',
      tempatLahir: 'Semarang',
      tanggalLahir: '1985-08-22',
      kewarganegaraan: 'Indonesia',
      pekerjaan: 'Wiraswasta',
      nik: '3374026208850001',
      alamat: 'Kabupaten Kudus, Desa Krandon RT 003, RW 002, Kecamatan Kota Kudus'
    }
  ],
  saksi1: {
    sapaan: 'Nona',
    nama: 'INDAH YUNI RETNONINGTYAS',
    tempatLahir: 'Kudus',
    tanggalLahir: '1999-06-09',
    nik: '3319014906990003',
    pekerjaan: 'Karyawan Swasta',
    alamat: 'Kabupaten Kudus, Kedungdowo RT 003 RW 007, Kaliwungu'
  },
  saksi2: {
    sapaan: 'Nona',
    nama: 'MEILIANI PRAVITA SARI',
    tempatLahir: 'Kudus',
    tanggalLahir: '1995-05-26',
    nik: '3319026605950002',
    pekerjaan: 'Karyawan Swasta',
    alamat: 'Kabupaten Kudus, Singocandi RT 004 RW 004, Kota Kudus'
  }
};

// 3. DATA DEMO FIRMA (Persekutuan Perdata / Fa)
const DEMO_DATA_FIRMA = {
  badanUsaha: { tipe: 'FIRMA' },
  akta: {
    nomor: '07',
    tanggal: '2026-10-16',
    jam: '09:30'
  },
  notaris: {
    nama: 'GRENDI JAYA DARMAWAN',
    gelarPanjang: 'Sarjana Hukum, Magister Kenotariatan',
    gelarSingkat: 'S.H., M.Kn.',
    wilayah: 'Kabupaten Kudus'
  },
  pt: {
    nama: 'FIRMA KONSULTAN WIJAYA & REKAN',
    kedudukan: 'Kabupaten Kudus',
    aktaPendirianNomor: '03',
    aktaPendirianTgl: '2019-06-11',
    aktaPendirianNotaris: 'Apriliana Dewi Yuwono, S.H., M.Kn.',
    aktaPendirianWilayah: 'Kabupaten Kudus',
    skPendirianNomor: 'AHU-0003321.AH.02.01.TAHUN 2019 (SABU)',
    skPendirianTgl: '2019-06-25',
    aktaPerubahanNomor: '02',
    aktaPerubahanTgl: '2023-08-10',
    aktaPerubahanNotaris: 'Saya, Notaris',
    aktaPerubahanWilayah: 'Kabupaten Kudus',
    skPerubahanNomor: 'AHU-0002110.AH.02.02.TAHUN 2023',
    skPerubahanTgl: '2023-08-15',
    pemberitahuanPerubahanNomor: 'AHU-SABU.01-004312',
    pasalSirkuler: '7 ayat (1)'
  },
  penghadap: {
    sapaan: 'Tuan',
    nama: 'WIJAYA KUSUMA',
    tempatLahir: 'Kudus',
    tanggalLahir: '1979-11-20',
    nik: '3319012011790002',
    pekerjaan: 'Konsultan Hukum',
    kewarganegaraan: 'Indonesia',
    jabatan: 'Pesero Pengurus',
    alamat: 'Kabupaten Kudus, Jalan Sunan Kudus Nomor. 45, RT 001 RW 003, Kecamatan Kota Kudus'
  },
  saham: { totalSeriA: 0, totalSeriB: 0 },
  modal: {
    totalNominal: 300000000
  },
  keputusan: {
    masaJabatan: '5 (lima)',
    tglEfektif: '2026-10-15'
  },
  pemegangSaham: [],
  sekutu: [
    {
      nama: 'Tuan. WIJAYA KUSUMA',
      statusSekutu: 'Pesero Pengurus',
      nominalInbreng: 150000000,
      persentase: '50',
      tanggalTtd: '15 Oktober 2026'
    },
    {
      nama: 'Tuan. HENDRA GUNAWAN',
      statusSekutu: 'Pesero Firma',
      nominalInbreng: 150000000,
      persentase: '50',
      tanggalTtd: '15 Oktober 2026'
    }
  ],
  pengurusBaru: [
    {
      jabatan: 'Pesero Pengurus',
      sapaan: 'Tuan',
      nama: 'WIJAYA KUSUMA',
      tempatLahir: 'Kudus',
      tanggalLahir: '1979-11-20',
      kewarganegaraan: 'Indonesia',
      pekerjaan: 'Konsultan Hukum',
      nik: '3319012011790002',
      alamat: 'Kabupaten Kudus, Jalan Sunan Kudus Nomor. 45, RT 001 RW 003'
    },
    {
      jabatan: 'Pesero Firma',
      sapaan: 'Tuan',
      nama: 'HENDRA GUNAWAN',
      tempatLahir: 'Pati',
      tanggalLahir: '1981-05-12',
      kewarganegaraan: 'Indonesia',
      pekerjaan: 'Advokat / Konsultan',
      nik: '3318021205810004',
      alamat: 'Kabupaten Pati, Jalan Pemuda Nomor. 12, RT 002 RW 005'
    }
  ],
  saksi1: {
    sapaan: 'Nona',
    nama: 'INDAH YUNI RETNONINGTYAS',
    tempatLahir: 'Kudus',
    tanggalLahir: '1999-06-09',
    nik: '3319014906990003',
    pekerjaan: 'Karyawan Swasta',
    alamat: 'Kabupaten Kudus, Kedungdowo RT 003 RW 007'
  },
  saksi2: {
    sapaan: 'Nona',
    nama: 'MEILIANI PRAVITA SARI',
    tempatLahir: 'Kudus',
    tanggalLahir: '1995-05-26',
    nik: '3319026605950002',
    pekerjaan: 'Karyawan Swasta',
    alamat: 'Kabupaten Kudus, Singocandi RT 004 RW 004'
  }
};

// 4. DATA DEMO UD (Usaha Dagang / Perorangan)
const DEMO_DATA_UD = {
  badanUsaha: { tipe: 'UD' },
  akta: {
    nomor: '04',
    tanggal: '2026-10-16',
    jam: '14:00'
  },
  notaris: {
    nama: 'GRENDI JAYA DARMAWAN',
    gelarPanjang: 'Sarjana Hukum, Magister Kenotariatan',
    gelarSingkat: 'S.H., M.Kn.',
    wilayah: 'Kabupaten Kudus'
  },
  pt: {
    nama: 'UD. SUMBER REJEKI ABADI',
    kedudukan: 'Kabupaten Kudus',
    aktaPendirianNomor: '01',
    aktaPendirianTgl: '2015-02-10',
    aktaPendirianNotaris: 'Apriliana Dewi Yuwono, S.H., M.Kn.',
    aktaPendirianWilayah: 'Kabupaten Kudus',
    skPendirianNomor: 'NIB 9120001234567 (OSS RBA)',
    skPendirianTgl: '2015-03-01',
    aktaPerubahanNomor: '02',
    aktaPerubahanTgl: '2022-07-15',
    aktaPerubahanNotaris: 'Saya, Notaris',
    aktaPerubahanWilayah: 'Kabupaten Kudus',
    skPerubahanNomor: 'Pembaruan NIB 9120001234567-001',
    skPerubahanTgl: '2022-07-20',
    pemberitahuanPerubahanNomor: 'OSS-20220720-0012',
    pasalSirkuler: '-'
  },
  penghadap: {
    sapaan: 'Tuan',
    nama: 'BAMBANG SUTRISNO',
    tempatLahir: 'Kudus',
    tanggalLahir: '1975-09-18',
    nik: '3319011809750001',
    pekerjaan: 'Pedagang',
    kewarganegaraan: 'Indonesia',
    jabatan: 'Pemilik Usaha',
    alamat: 'Kabupaten Kudus, Jalan Ahmad Yani Nomor. 88, RT 003 RW 002, Kecamatan Kota Kudus'
  },
  saham: { totalSeriA: 0, totalSeriB: 0 },
  modal: {
    totalNominal: 250000000
  },
  keputusan: {
    masaJabatan: '5 (lima)',
    tglEfektif: '2026-10-16'
  },
  pemegangSaham: [],
  sekutu: [
    {
      nama: 'Tuan. BAMBANG SUTRISNO',
      statusSekutu: 'Pemilik Usaha',
      nominalInbreng: 250000000,
      persentase: '100',
      tanggalTtd: '16 Oktober 2026'
    }
  ],
  pengurusBaru: [
    {
      jabatan: 'Pemilik Usaha',
      sapaan: 'Tuan',
      nama: 'BAMBANG SUTRISNO',
      tempatLahir: 'Kudus',
      tanggalLahir: '1975-09-18',
      kewarganegaraan: 'Indonesia',
      pekerjaan: 'Pedagang',
      nik: '3319011809750001',
      alamat: 'Kabupaten Kudus, Jalan Ahmad Yani Nomor. 88, RT 003 RW 002'
    },
    {
      jabatan: 'Kuasa Pengelola Usaha',
      sapaan: 'Nyonya',
      nama: 'DEWI LESTARI',
      tempatLahir: 'Kudus',
      tanggalLahir: '1980-04-10',
      kewarganegaraan: 'Indonesia',
      pekerjaan: 'Karyawan Swasta',
      nik: '3319015004800003',
      alamat: 'Kabupaten Kudus, Jalan Ahmad Yani Nomor. 88, RT 003 RW 002'
    }
  ],
  saksi1: {
    sapaan: 'Nona',
    nama: 'INDAH YUNI RETNONINGTYAS',
    tempatLahir: 'Kudus',
    tanggalLahir: '1999-06-09',
    nik: '3319014906990003',
    pekerjaan: 'Karyawan Swasta',
    alamat: 'Kabupaten Kudus, Kedungdowo RT 003 RW 007'
  },
  saksi2: {
    sapaan: 'Nona',
    nama: 'MEILIANI PRAVITA SARI',
    tempatLahir: 'Kudus',
    tanggalLahir: '1995-05-26',
    nik: '3319026605950002',
    pekerjaan: 'Karyawan Swasta',
    alamat: 'Kabupaten Kudus, Singocandi RT 004 RW 004'
  }
};

// ==================== DASHBOARD & STATE MANAJEMEN ====================
async function initDefaultDownloadsDir() {
  const curDir = getDefaultDownloadsDir();
  const arcInput = document.getElementById('settingDirArchive');
  if (arcInput) arcInput.value = curDir;
}

function getDefaultDownloadsDir() {
  return localStorage.getItem('setting_dir_archive') ||
    localStorage.getItem('setting_dir_progress') ||
    localStorage.getItem('setting_dir_word') || '';
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Modern Custom Modal Dialog (menggantikan alert & confirm bawaan webview)
 * Fitur: Pop-up di tengah layar, background belakang blur (frosted), kartu modern, ikon status, detail data.
 */
function showAppDialog({
  type = 'info',
  title = 'Pemberitahuan',
  message = '',
  details = null,
  confirmText = 'OK',
  confirmType = 'primary',
  showCancel = false,
  cancelText = 'Batal'
}) {
  return new Promise((resolve) => {
    const overlay = document.getElementById('appModalOverlay');
    const iconBadge = document.getElementById('appModalIcon');
    const titleEl = document.getElementById('appModalTitle');
    const msgEl = document.getElementById('appModalMessage');
    const detailsEl = document.getElementById('appModalDetails');
    const btnConfirm = document.getElementById('appModalBtnConfirm');
    const btnCancel = document.getElementById('appModalBtnCancel');
    const backdrop = document.getElementById('appModalBackdrop');

    if (!overlay || !btnConfirm) {
      if (showCancel) resolve(window.confirm(`${title}\n\n${message}`));
      else { window.alert(`${title}\n\n${message}`); resolve(true); }
      return;
    }

    // Set Icon Badge
    iconBadge.className = `app-modal-icon-badge ${type}`;
    if (type === 'success') {
      iconBadge.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    } else if (type === 'error') {
      iconBadge.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
    } else if (type === 'warning') {
      iconBadge.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;
    } else {
      iconBadge.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
    }

    // Set Title & Message
    titleEl.textContent = title;
    msgEl.textContent = message;
    msgEl.style.display = message ? 'block' : 'none';

    // Set Structured Details
    if (details && (typeof details === 'object' || Array.isArray(details))) {
      detailsEl.style.display = 'flex';
      let html = '';
      if (Array.isArray(details)) {
        html = details.map(d => `<div class="modal-detail-row"><span class="modal-detail-val">${escapeHtml(d)}</span></div>`).join('');
      } else {
        html = Object.entries(details).map(([k, v]) => `
          <div class="modal-detail-row">
            <span class="modal-detail-label">${escapeHtml(k)}</span>
            <span class="modal-detail-val">${escapeHtml(v)}</span>
          </div>
        `).join('');
      }
      detailsEl.innerHTML = html;
    } else if (typeof details === 'string' && details.trim()) {
      detailsEl.style.display = 'flex';
      detailsEl.innerHTML = `<div class="modal-detail-row"><span class="modal-detail-val">${escapeHtml(details)}</span></div>`;
    } else {
      detailsEl.style.display = 'none';
      detailsEl.innerHTML = '';
    }

    // Set Buttons
    btnConfirm.textContent = confirmText;
    btnConfirm.className = `btn-modal-confirm ${confirmType === 'danger' ? 'danger' : ''}`;
    btnCancel.style.display = showCancel ? 'inline-block' : 'none';
    btnCancel.textContent = cancelText;

    // Show Overlay
    overlay.style.display = 'flex';
    setTimeout(() => btnConfirm.focus(), 50);

    const cleanup = () => {
      overlay.style.display = 'none';
      document.removeEventListener('keydown', keyHandler);
      btnConfirm.onclick = null;
      btnCancel.onclick = null;
      if (backdrop) backdrop.onclick = null;
    };

    const handleConfirm = () => {
      cleanup();
      resolve(true);
    };

    const handleCancel = () => {
      cleanup();
      resolve(false);
    };

    const keyHandler = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (showCancel) handleCancel();
        else handleConfirm();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleConfirm();
      }
    };

    btnConfirm.onclick = handleConfirm;
    btnCancel.onclick = handleCancel;
    if (backdrop) {
      backdrop.onclick = () => {
        if (showCancel) handleCancel();
        else handleConfirm();
      };
    }
    document.addEventListener('keydown', keyHandler);
  });
}

// Override default window.alert with custom modal dialog and automatic intelligent text parsing
window.alert = function (msg) {
  const str = String(msg || '');
  let type = 'info';
  let title = 'Pemberitahuan';
  let message = str;
  let details = null;

  if (str.startsWith('✓') || str.toLowerCase().includes('berhasil')) {
    type = 'success';
    title = 'Berhasil';
  } else if (str.toLowerCase().includes('gagal') || str.toLowerCase().includes('kesalahan') || str.toLowerCase().includes('error')) {
    type = 'error';
    title = 'Terjadi Kesalahan';
  } else if (str.toLowerCase().includes('peringatan') || str.toLowerCase().includes('perhatian')) {
    type = 'warning';
    title = 'Peringatan';
  }

  if (str.includes('\n')) {
    const lines = str.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length > 0) {
      title = lines[0].replace(/^[✓⚠️❌ℹ️]\s*/, '');
      const detailObj = {};
      const msgLines = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes(':')) {
          const colonIdx = line.indexOf(':');
          const k = line.substring(0, colonIdx).trim();
          const v = line.substring(colonIdx + 1).trim();
          if (k && v) {
            detailObj[k] = v;
            continue;
          }
        }
        msgLines.push(line);
      }
      message = msgLines.join(' ');
      if (Object.keys(detailObj).length > 0) {
        details = detailObj;
      }
    }
  }

  return showAppDialog({
    type,
    title,
    message,
    details,
    confirmText: 'OK'
  });
};

function resetFormFields(keepNotaris = true) {
  const form = document.getElementById('aktaForm');
  if (form) form.reset();
  const psC = document.getElementById('pemegangSahamContainer');
  const psmC = document.getElementById('pemegangSahamModalContainer');
  const skC = document.getElementById('sekutuContainer');
  const pgC = document.getElementById('pengurusContainer');
  if (psC) psC.innerHTML = '';
  if (psmC) psmC.innerHTML = '';
  if (skC) skC.innerHTML = '';
  if (pgC) pgC.innerHTML = '';

  if (keepNotaris) {
    const defNama = (DEMO_CONFIG?.LOCK_NOTARY_NAME && DEMO_CONFIG?.LOCKED_NOTARY_NAME)
      ? DEMO_CONFIG.LOCKED_NOTARY_NAME
      : localStorage.getItem('notaris_default_nama');
    const defWil = localStorage.getItem('notaris_default_wilayah');
    const defGelarP = localStorage.getItem('notaris_default_gelar_panjang');
    const defGelarS = localStorage.getItem('notaris_default_gelar_singkat');
    if (defNama && document.getElementById('notarisNama')) document.getElementById('notarisNama').value = defNama;
    if (defWil && document.getElementById('notarisWilayah')) document.getElementById('notarisWilayah').value = defWil;
    if (defGelarP && document.getElementById('notarisGelarPanjang')) document.getElementById('notarisGelarPanjang').value = defGelarP;
    if (defGelarS && document.getElementById('notarisGelarSingkat')) document.getElementById('notarisGelarSingkat').value = defGelarS;
  }
  applyNotaryNameLock();
  state.customTemplates = {};
  updateCustomClauseBadges();
  checkOverallConsistency();
  renderAllSectionPreviews();
}

function switchView(viewName) {
  applyNotaryNameLock();
  const vDash = document.getElementById('view-dashboard');
  const vEdit = document.getElementById('view-editor');
  const vSett = document.getElementById('view-settings');
  if (viewName === 'dashboard') {
    document.body.style.overflow = '';
    if (vDash) vDash.style.display = 'block';
    if (vEdit) vEdit.style.display = 'none';
    if (vSett) vSett.style.display = 'none';
    state.previousView = 'dashboard';
    refreshDashboardDrafts();
  } else if (viewName === 'editor') {
    document.body.style.overflow = 'hidden';
    if (vDash) vDash.style.display = 'none';
    if (vEdit) vEdit.style.display = 'flex';
    if (vSett) vSett.style.display = 'none';
    state.previousView = 'editor';
    requestAnimationFrame(() => {
      renderLivePreview();
      applyPreviewZoom();
    });
  } else if (viewName === 'settings') {
    document.body.style.overflow = '';
    if (vDash) vDash.style.display = 'none';
    if (vEdit) vEdit.style.display = 'none';
    if (vSett) vSett.style.display = 'block';
    const btnBackText = document.getElementById('btnBackFromSettingsText');
    if (btnBackText) {
      btnBackText.textContent = state.previousView === 'editor' ? 'Kembali ke Draf' : 'Beranda';
    }
  }
}

function updateActiveDraftUI(filePath = null) {
  state.currentDraftFilePath = filePath;
  const labelEl = document.getElementById('activeDraftFileNameText');
  const chipEl = document.getElementById('activeDraftFileLabel');
  if (labelEl) {
    if (filePath) {
      const filename = filePath.split(/[\\/]/).pop();
      labelEl.textContent = filename;
      labelEl.title = filePath;
      labelEl.style.color = '';
      if (chipEl) {
        chipEl.classList.add('has-file');
        chipEl.title = `Berkas tersimpan aktif: ${filePath}`;
      }
    } else {
      labelEl.textContent = 'Draf Baru (Belum Disimpan)';
      labelEl.title = 'Draf belum disimpan ke berkas disk';
      labelEl.style.color = '';
      if (chipEl) {
        chipEl.classList.remove('has-file');
        chipEl.title = 'Draf belum disimpan ke berkas disk';
      }
    }
  }
}

function resetSplitPreviewState() {
  state.activeFieldKey = null;
  state.activeFieldLabel = null;
  state.previewMode = 'deed';
  state.isPreviewExpanded = false;
  const viewEditor = document.getElementById('view-editor');
  if (viewEditor) viewEditor.classList.remove('preview-expanded');
  const btnExpand = document.getElementById('btnToggleExpandPreview');
  if (btnExpand) btnExpand.textContent = '⤢';
  const scrollEl = document.getElementById('previewPaneScroll');
  if (scrollEl) scrollEl.scrollTop = 0;
}

function startNewDraft(entityType, subType = null) {
  resetFormFields(true);
  resetSplitPreviewState();
  if (entityType === 'PT') {
    state.ptSubType = subType || 'SIRKULER_PENGURUS';
  }
  switchEntityType(entityType, false, subType);
  if (entityType === 'PT') {
    if (state.ptSubType === 'SIRKULER_MODAL') {
      loadDataToForm(DEMO_DATA_PT_SIRKULER_MODAL);
    } else if (state.ptSubType === 'RUPS_MODAL') {
      loadDataToForm(DEMO_DATA_PT_RUPS_MODAL);
    } else {
      loadDataToForm(DEMO_DATA_PT);
    }
  }
  updateActiveDraftUI(null);
  renderLivePreview();
  setDraftSavedStatus(false);
  switchView('editor');
  switchToTab('tab-akta');
}

async function openDraftFromPath(filePath) {
  if (!filePath) return;
  try {
    let jsonContent = '';
    if (window.__TAURI__?.core?.invoke) {
      jsonContent = await window.__TAURI__.core.invoke('read_text_file', { filePath });
    }
    if (!jsonContent) throw new Error('Berkas kosong atau tidak dapat diakses.');
    const parsed = JSON.parse(jsonContent);
    resetSplitPreviewState();
    loadDataToForm(parsed);
    updateActiveDraftUI(filePath);
    setDraftSavedStatus(true);
    switchView('editor');
    switchToTab('tab-akta');
  } catch (err) {
    await showAppDialog({
      type: 'error',
      title: 'Gagal Memuat Berkas Draf',
      message: err.message || String(err),
      details: { 'Jalur Berkas': filePath }
    });
  }
}

// State Draf Akta Tersimpan (Pencarian, Pengurutan, & Pagination 20 per halaman)
const dashboardDraftsState = {
  rawDrafts: [],
  searchQuery: '',
  sortOrder: 'time-desc', // 'time-desc' | 'time-asc' | 'alpha-asc' | 'alpha-desc'
  currentPage: 1,
  pageSize: 20
};

function getFilteredAndSortedDrafts() {
  const q = (dashboardDraftsState.searchQuery || '').trim().toLowerCase();
  let list = dashboardDraftsState.rawDrafts.filter(item => {
    if (!q) return true;
    const name = (item.entity_name || '').toLowerCase();
    const filename = (item.filename || '').toLowerCase();
    const nomor = (item.akta_nomor || '').toLowerCase();
    const type = (item.entity_type || '').toLowerCase();
    return name.includes(q) || filename.includes(q) || nomor.includes(q) || type.includes(q);
  });

  list.sort((a, b) => {
    const sort = dashboardDraftsState.sortOrder;
    if (sort === 'time-desc') {
      return (b.modified_time || 0) - (a.modified_time || 0);
    } else if (sort === 'time-asc') {
      return (a.modified_time || 0) - (b.modified_time || 0);
    } else if (sort === 'alpha-asc') {
      const nameA = (a.entity_name && a.entity_name !== '-' ? a.entity_name : a.filename || '').toLowerCase();
      const nameB = (b.entity_name && b.entity_name !== '-' ? b.entity_name : b.filename || '').toLowerCase();
      return nameA.localeCompare(nameB, 'id', { sensitivity: 'base', numeric: true });
    } else if (sort === 'alpha-desc') {
      const nameA = (a.entity_name && a.entity_name !== '-' ? a.entity_name : a.filename || '').toLowerCase();
      const nameB = (b.entity_name && b.entity_name !== '-' ? b.entity_name : b.filename || '').toLowerCase();
      return nameB.localeCompare(nameA, 'id', { sensitivity: 'base', numeric: true });
    }
    return 0;
  });

  return list;
}

function getPageNumbers(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, '...', totalPages];
  }
  if (currentPage >= totalPages - 3) {
    return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }
  return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
}

function renderDashboardDraftsView() {
  const listContainer = document.getElementById('dashboardDraftsList');
  const toolbar = document.getElementById('dashboardDraftsToolbar');
  const footer = document.getElementById('dashboardPaginationFooter');
  const infoEl = document.getElementById('draftsPaginationInfo');
  const controlsEl = document.getElementById('draftsPaginationControls');
  const btnClear = document.getElementById('draftsSearchClear');

  if (!listContainer) return;

  const totalRaw = dashboardDraftsState.rawDrafts.length;
  if (totalRaw === 0) {
    if (toolbar) toolbar.style.display = 'none';
    if (footer) footer.style.display = 'none';
    listContainer.innerHTML = `
      <div class="drafts-empty-state">
        <div class="drafts-empty-icon">📂</div>
        <div class="drafts-empty-title">Belum Ada Draf Akta di Folder Ini</div>
        <p class="drafts-empty-desc">Folder arsip saat ini belum memiliki berkas draf (.akta). Klik salah satu kartu badan usaha di atas (+ Buat Akta PT/CV/Firma) untuk mulai membuat draf baru.</p>
      </div>
    `;
    return;
  }

  // Tampilkan toolbar bila ada berkas di direktori
  if (toolbar) toolbar.style.display = 'flex';
  if (btnClear) {
    btnClear.style.display = dashboardDraftsState.searchQuery.trim() ? 'flex' : 'none';
  }

  const filtered = getFilteredAndSortedDrafts();
  const totalFiltered = filtered.length;

  if (totalFiltered === 0) {
    if (footer) footer.style.display = 'none';
    listContainer.innerHTML = `
      <div class="drafts-empty-state">
        <div class="drafts-empty-icon">🔍</div>
        <div class="drafts-empty-title">Draf Tidak Ditemukan</div>
        <p class="drafts-empty-desc">Tidak ada berkas draf yang cocok dengan kata kunci "<strong>${escapeHtml(dashboardDraftsState.searchQuery)}</strong>". Silakan periksa ejaan atau bersihkan pencarian.</p>
        <button type="button" class="btn btn-secondary btn-sm" id="btnResetSearchEmpty" style="margin-top: 14px; padding: 7px 16px; border-radius: 6px; cursor: pointer;">
          ↺ Bersihkan Pencarian
        </button>
      </div>
    `;
    const btnResetEmpty = document.getElementById('btnResetSearchEmpty');
    if (btnResetEmpty) {
      btnResetEmpty.addEventListener('click', () => {
        const searchInput = document.getElementById('draftsSearchInput');
        if (searchInput) searchInput.value = '';
        dashboardDraftsState.searchQuery = '';
        dashboardDraftsState.currentPage = 1;
        renderDashboardDraftsView();
      });
    }
    return;
  }

  // Hitung Pagination
  const pageSize = dashboardDraftsState.pageSize;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  if (dashboardDraftsState.currentPage > totalPages) {
    dashboardDraftsState.currentPage = totalPages;
  }
  if (dashboardDraftsState.currentPage < 1) {
    dashboardDraftsState.currentPage = 1;
  }

  const curPage = dashboardDraftsState.currentPage;
  const startIdx = (curPage - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, totalFiltered);
  const pageDrafts = filtered.slice(startIdx, endIdx);

  // Render Kartu Draf Halaman Ini
  listContainer.innerHTML = pageDrafts.map(item => {
    const typeBadgeClass = `badge-${(item.entity_type || 'PT').toLowerCase()}`;
    const modifiedStr = item.modified_time
      ? new Date(item.modified_time * 1000).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
      : '-';
    const sizeKb = (item.size_bytes / 1024).toFixed(1) + ' KB';
    const displayName = item.entity_name && item.entity_name !== '-' ? item.entity_name : item.filename;

    return `
      <div class="draft-card" data-path="${escapeHtml(item.full_path)}">
        <div class="draft-card-top">
          <div>
            <span class="entity-card-badge ${typeBadgeClass}">${escapeHtml(item.entity_type || 'PT')}</span>
            <h4 class="draft-card-name" style="margin-top: 6px;">${escapeHtml(displayName)}</h4>
          </div>
        </div>
        <div class="draft-card-meta">
          <span>No: <strong>${escapeHtml(item.akta_nomor || '-')}</strong></span>
          <span>Tgl: <strong>${escapeHtml(item.akta_tanggal || '-')}</strong></span>
          <span>Diubah: <strong>${escapeHtml(modifiedStr)}</strong></span>
          <span>${escapeHtml(sizeKb)}</span>
        </div>
        <div class="draft-card-file" title="${escapeHtml(item.full_path)}">📄 ${escapeHtml(item.filename)}</div>
        <div class="draft-card-actions">
          <button type="button" class="btn-draft-open" data-path="${escapeHtml(item.full_path)}">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
            Buka &amp; Lanjutkan
          </button>
          <button type="button" class="btn-draft-delete" data-path="${escapeHtml(item.full_path)}" title="Hapus berkas draf ini">
            Hapus
          </button>
        </div>
      </div>
    `;
  }).join('');

  // Event handlers untuk membuka dan menghapus kartu draf
  listContainer.querySelectorAll('.btn-draft-open').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      openDraftFromPath(btn.dataset.path);
    });
  });

  listContainer.querySelectorAll('.btn-draft-delete').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const filePath = btn.dataset.path;
      const filename = filePath.split(/[\\/]/).pop();
      const ok = await showAppDialog({
        type: 'warning',
        title: 'Hapus Berkas Draf?',
        message: `Apakah Anda yakin ingin menghapus berkas draf "${filename}" secara permanen dari komputer? Tindakan ini tidak dapat dibatalkan.`,
        details: {
          'Nama Berkas': filename,
          'Lokasi Penyimpanan': filePath
        },
        showCancel: true,
        cancelText: 'Batal',
        confirmText: 'Ya, Hapus',
        confirmType: 'danger'
      });
      if (ok) {
        if (window.__TAURI__?.core?.invoke) {
          try {
            await window.__TAURI__.core.invoke('delete_file', { filePath });
            refreshDashboardDrafts();
          } catch (err) {
            await showAppDialog({
              type: 'error',
              title: 'Gagal Menghapus Berkas',
              message: err.message || String(err)
            });
          }
        }
      }
    });
  });

  // Render Pagination Info & Controls
  if (footer && infoEl && controlsEl) {
    footer.style.display = 'flex';

    let filterText = '';
    if (dashboardDraftsState.searchQuery.trim()) {
      filterText = ` (difilter dari total ${totalRaw} draf)`;
    }
    infoEl.innerHTML = `Menampilkan <strong>${startIdx + 1}–${endIdx}</strong> dari <strong>${totalFiltered}</strong> draf${filterText}`;

    // Buat Tombol Pagination
    controlsEl.innerHTML = '';

    // Tombol Sebelumnya
    const btnPrev = document.createElement('button');
    btnPrev.type = 'button';
    btnPrev.className = 'btn-page btn-page-prev';
    btnPrev.textContent = '‹ Sebelumnya';
    btnPrev.disabled = curPage === 1;
    btnPrev.addEventListener('click', () => {
      if (curPage > 1) {
        dashboardDraftsState.currentPage = curPage - 1;
        renderDashboardDraftsView();
        listContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
    controlsEl.appendChild(btnPrev);

    // Nomor Halaman
    const pageNumbers = getPageNumbers(curPage, totalPages);
    pageNumbers.forEach(p => {
      if (p === '...') {
        const el = document.createElement('span');
        el.className = 'pagination-ellipsis';
        el.textContent = '…';
        controlsEl.appendChild(el);
      } else {
        const btnNum = document.createElement('button');
        btnNum.type = 'button';
        btnNum.className = `btn-page btn-page-num ${p === curPage ? 'active' : ''}`;
        btnNum.textContent = String(p);
        btnNum.addEventListener('click', () => {
          if (p !== curPage) {
            dashboardDraftsState.currentPage = p;
            renderDashboardDraftsView();
            listContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        });
        controlsEl.appendChild(btnNum);
      }
    });

    // Tombol Selanjutnya
    const btnNext = document.createElement('button');
    btnNext.type = 'button';
    btnNext.className = 'btn-page btn-page-next';
    btnNext.textContent = 'Selanjutnya ›';
    btnNext.disabled = curPage === totalPages;
    btnNext.addEventListener('click', () => {
      if (curPage < totalPages) {
        dashboardDraftsState.currentPage = curPage + 1;
        renderDashboardDraftsView();
        listContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
    controlsEl.appendChild(btnNext);
  }
}

async function refreshDashboardDrafts() {
  const listContainer = document.getElementById('dashboardDraftsList');
  const toolbar = document.getElementById('dashboardDraftsToolbar');
  const footer = document.getElementById('dashboardPaginationFooter');
  const dirLabel = document.getElementById('dashboardCurrentDirLabel');
  const targetDir = getDefaultDownloadsDir();
  if (dirLabel) {
    dirLabel.textContent = targetDir || '(Belum ditentukan - Otomatis diminta saat simpan draf)';
  }
  if (!listContainer) return;

  if (!targetDir) {
    if (toolbar) toolbar.style.display = 'none';
    if (footer) footer.style.display = 'none';
    listContainer.innerHTML = `
      <div class="drafts-empty-state">
        <div class="drafts-empty-icon">📂</div>
        <div class="drafts-empty-title">Folder Penyimpanan Draf Belum Ditentukan</div>
        <p class="drafts-empty-desc">Folder penyimpanan akan otomatis diminta melalui Windows File Explorer saat Anda pertama kali mengklik <strong>Simpan Draf (.akta)</strong> di dalam formulir akta. Atau Anda dapat memilih folder arsip sekarang:</p>
        <button type="button" class="btn btn-primary" id="btnPickDirFromEmpty" style="margin-top: 14px; display: inline-flex; align-items: center; gap: 8px; cursor: pointer; padding: 8px 18px; border-radius: 6px;">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
          Pilih Folder Arsip Sekarang
        </button>
      </div>
    `;
    const btnPick = document.getElementById('btnPickDirFromEmpty');
    if (btnPick) {
      btnPick.addEventListener('click', async () => {
        if (window.__TAURI__?.core?.invoke) {
          try {
            const selected = await window.__TAURI__.core.invoke('pick_folder', {
              title: 'Pilih Folder Direktori Arsip Draf Akta (.akta)'
            });
            if (selected) {
              localStorage.setItem('setting_dir_archive', selected);
              localStorage.setItem('setting_dir_progress', selected);
              localStorage.setItem('setting_dir_word', selected);
              const pInput = document.getElementById('settingDirArchive');
              if (pInput) pInput.value = selected;
              refreshDashboardDrafts();
            }
          } catch (err) {
            console.error('Gagal memilih folder:', err);
          }
        }
      });
    }
    return;
  }

  listContainer.innerHTML = '<div style="text-align: center; color: var(--ink-muted-48); padding: 30px; grid-column: 1 / -1;">Memindai berkas draf tersimpan...</div>';

  let drafts = [];
  if (window.__TAURI__?.core?.invoke) {
    try {
      drafts = await window.__TAURI__.core.invoke('list_draft_files', { folderPath: targetDir });
    } catch (err) {
      console.error('Gagal memindai draf:', err);
    }
  }

  dashboardDraftsState.rawDrafts = Array.isArray(drafts) ? drafts : [];
  renderDashboardDraftsView();
}

function setupDashboard() {
  // Tombol buat baru per badan usaha di dashboard
  document.querySelectorAll('.btn-card-create').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const entity = btn.dataset.entity;
      const subtype = btn.dataset.subtype || null;
      startNewDraft(entity, subtype);
    });
  });

  document.querySelectorAll('.entity-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.btn-card-create')) return;
      const entity = card.dataset.entity;
      startNewDraft(entity, entity === 'PT' ? 'SIRKULER_PENGURUS' : null);
    });
  });

  // Tombol Kembali ke Dashboard dari Editor
  const btnBack = document.getElementById('btnBackToDashboard');
  if (btnBack) {
    btnBack.addEventListener('click', () => {
      // Auto-save sebelum kembali ke dashboard
      try {
        const data = kumpulkanDataForm();
        localStorage.setItem('akta_autosave_draft_data', JSON.stringify(data));
      } catch (e) { }
      switchView('dashboard');
    });
  }

  // Tombol Pengaturan dari Dashboard
  const btnDashSet = document.getElementById('btnDashboardSettings');
  if (btnDashSet) {
    btnDashSet.addEventListener('click', () => {
      state.previousView = 'dashboard';
      switchView('settings');
    });
  }

  // Tombol Kembali dari Pengaturan
  const btnBackSettings = document.getElementById('btnBackFromSettings');
  if (btnBackSettings) {
    btnBackSettings.addEventListener('click', () => {
      switchView(state.previousView || 'dashboard');
    });
  }

  // Tombol Buka Folder Arsip dari Dashboard
  const btnDashOpenDir = document.getElementById('btnDashboardOpenDir');
  if (btnDashOpenDir) {
    btnDashOpenDir.addEventListener('click', async () => {
      let p = localStorage.getItem('setting_dir_progress') || '';
      if (!p) {
        const ok = await showAppDialog({
          type: 'info',
          title: 'Folder Arsip Belum Ditentukan',
          message: 'Folder penyimpanan draf belum ditentukan. Apakah Anda ingin memilih folder penyimpanan draf sekarang melalui Windows File Explorer?',
          showCancel: true,
          cancelText: 'Nanti Saja',
          confirmText: 'Pilih Folder'
        });
        if (ok) {
          if (window.__TAURI__?.core?.invoke) {
            try {
              const selected = await window.__TAURI__.core.invoke('pick_folder', {
                title: 'Pilih Folder Direktori Arsip Draf Akta (.akta)'
              });
              if (selected) {
                p = selected;
                localStorage.setItem('setting_dir_archive', p);
                localStorage.setItem('setting_dir_progress', p);
                localStorage.setItem('setting_dir_word', p);
                const pInput = document.getElementById('settingDirArchive');
                if (pInput) pInput.value = p;
                refreshDashboardDrafts();
                await window.__TAURI__.core.invoke('plugin:opener|open_path', { path: p });
              }
            } catch (err) {
              await showAppDialog({
                type: 'error',
                title: 'Gagal Membuka File Explorer',
                message: err.message || String(err)
              });
            }
          }
        }
        return;
      }
      if (window.__TAURI__?.core?.invoke) {
        try {
          await window.__TAURI__.core.invoke('plugin:opener|open_path', { path: p });
        } catch (err) {
          await showAppDialog({
            type: 'info',
            title: 'Folder Direktori Target',
            message: `Jalur folder:\n${p}\n\n${err.message || ''}`,
            confirmText: 'OK'
          });
        }
      } else {
        await showAppDialog({
          type: 'info',
          title: 'Folder Direktori Target',
          details: { 'Lokasi Folder': p },
          confirmText: 'OK'
        });
      }
    });
  }

  // Tombol Segarkan Dashboard
  const btnDashRef = document.getElementById('btnDashboardRefresh');
  if (btnDashRef) {
    btnDashRef.addEventListener('click', () => {
      refreshDashboardDrafts();
    });
  }

  // Setup Input Pencarian Draf Dashboard
  const searchInput = document.getElementById('draftsSearchInput');
  const btnClearSearch = document.getElementById('draftsSearchClear');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      dashboardDraftsState.searchQuery = searchInput.value;
      dashboardDraftsState.currentPage = 1;
      renderDashboardDraftsView();
    });
  }
  if (btnClearSearch) {
    btnClearSearch.addEventListener('click', () => {
      if (searchInput) {
        searchInput.value = '';
        searchInput.focus();
      }
      dashboardDraftsState.searchQuery = '';
      dashboardDraftsState.currentPage = 1;
      renderDashboardDraftsView();
    });
  }

  // Setup Dropdown Pengurutan (Sort)
  const sortSelect = document.getElementById('draftsSortSelect');
  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      dashboardDraftsState.sortOrder = sortSelect.value;
      dashboardDraftsState.currentPage = 1;
      renderDashboardDraftsView();
    });
  }

  // Tombol Buka File Lain dari Dashboard
  const btnDashOpenFile = document.getElementById('btnDashboardOpenOtherFile');
  const dashFilePicker = document.getElementById('filePickerDashboard');
  if (btnDashOpenFile && dashFilePicker) {
    btnDashOpenFile.addEventListener('click', () => {
      dashFilePicker.click();
    });

    dashFilePicker.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const parsed = JSON.parse(event.target.result);
          if (!parsed.badanUsaha && !parsed.akta) {
            throw new Error('Struktur berkas tidak cocok dengan format draf akta.');
          }
          loadDataToForm(parsed);
          updateActiveDraftUI(file.name);
          setDraftSavedStatus(true);
          switchView('editor');
          switchToTab('tab-akta');
        } catch (err) {
          await showAppDialog({
            type: 'error',
            title: 'Gagal Memuat Berkas Draf',
            message: err.message || String(err),
            details: 'Pastikan berkas berformat .akta atau .json yang valid.'
          });
        } finally {
          dashFilePicker.value = '';
        }
      };
      reader.readAsText(file);
    });
  }
}

// Inisialisasi Event & DOM
window.addEventListener('DOMContentLoaded', async () => {
  // 0. Inisialisasi Sistem Pengawasan Mode Demo / Trial
  const demoStatus = initDemoTrial();
  if (demoStatus.isLocked) {
    return; // Aplikasi langsung terkunci di overlay blur jika masa demo telah habis
  }

  setupEntitySelector();
  setupTabNavigation();
  setupLiveTerbilangListeners();
  setupDynamicRowActions();
  setupActionButtons();
  setupProgressSaveAndLoad();
  setupDirectorySettings();
  setupSplitPreviewControls();
  setupSectionLivePreviewListeners();
  setupClauseCustomizationModal();
  setupDashboard();

  await initDefaultDownloadsDir();

  // Muat data draf terakhir ke form sebagai persiapan
  const savedAutoDraft = localStorage.getItem('akta_autosave_draft_data');
  if (savedAutoDraft) {
    try {
      const parsed = JSON.parse(savedAutoDraft);
      if (parsed && (parsed.akta || parsed.badanUsaha)) {
        loadDataToForm(parsed);
      } else {
        loadDataToForm(DEMO_DATA_PT);
      }
    } catch {
      loadDataToForm(DEMO_DATA_PT);
    }
  } else {
    loadDataToForm(DEMO_DATA_PT);
  }
  updateCustomClauseBadges();
  applyNotaryNameLock();
  renderAllSectionPreviews();

  // Awali tampilan aplikasi di Beranda Draf (Dashboard)
  switchView('dashboard');
});

// Setup Selector Bentuk Badan Usaha
function setupEntitySelector() {
  // Pemilihan bentuk badan usaha ditentukan saat memilih kartu di Beranda Draf
}

function setActiveQuickDemo(activeId) { }

// Beralih Antara PT, CV, FIRMA, dan UD
function switchEntityType(type, autoLoadDemo = false, subType = null) {
  state.entityType = type;
  if (subType) {
    state.ptSubType = subType;
  } else if (type === 'PT' && !state.ptSubType) {
    state.ptSubType = 'SIRKULER_PENGURUS';
  }

  // Update tombol dokumen internal (hanya untuk PT Peningkatan Modal & RUPS)
  const isModalOrRups = type === 'PT' && (state.ptSubType === 'SIRKULER_MODAL' || state.ptSubType === 'RUPS_MODAL');
  const btnExportInternalDoc = document.getElementById('btnExportInternalDoc');
  if (btnExportInternalDoc) {
    btnExportInternalDoc.style.display = isModalOrRups ? 'inline-flex' : 'none';
  }
  const previewModeSwitcher = document.getElementById('previewDocModeSwitcher');
  if (previewModeSwitcher) {
    previewModeSwitcher.style.display = isModalOrRups ? 'inline-flex' : 'none';
    if (!isModalOrRups && state.previewMode === 'internal') {
      state.previewMode = 'deed';
    }
    previewModeSwitcher.querySelectorAll('.preview-mode-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.mode === state.previewMode);
    });
  }

  // Update badge jenis badan usaha aktif di header form
  const entityBadge = document.getElementById('currentEntityBadge');
  if (entityBadge) {
    entityBadge.textContent = type;
    entityBadge.className = `entity-card-badge badge-${type.toLowerCase()}`;
  }

  const subtitle = document.getElementById('headerSubtitle');
  const sectionTitle = document.getElementById('ptSectionTitle');
  const namaLabel = document.getElementById('ptNamaLabel');
  const skPendirianLabel = document.getElementById('labelSkPendirianNomor');
  const skPerubahanLabel = document.getElementById('labelSkPerubahanNomor');
  const pemberitahuanLabel = document.getElementById('labelPemberitahuanNomor');
  const groupPasal = document.getElementById('groupPasalSirkuler');

  const sectionSahamPT = document.getElementById('sectionSahamPT');
  const sectionModalPeningkatanPT = document.getElementById('sectionModalPeningkatanPT');
  const subcardRupsMetadata = document.getElementById('subcardRupsMetadata');
  const infoPeningkatanModalPengurus = document.getElementById('infoPeningkatanModalPengurus');
  const sectionModalNonPT = document.getElementById('sectionModalNonPT');
  const tab4Title = document.getElementById('tab4Title');
  const tab4Desc = document.getElementById('tab4Desc');
  const labelTotalModalNominal = document.getElementById('labelTotalModalNominal');
  const labelDaftarSekutu = document.getElementById('labelDaftarSekutu');
  const tab5Title = document.getElementById('tab5Title');
  const tab5Desc = document.getElementById('tab5Desc');

  if (type === 'PT') {
    if (state.ptSubType === 'RUPS_MODAL') {
      if (subtitle) subtitle.textContent = 'Pembuat Akta Berita Acara / Pernyataan Keputusan RUPS Peningkatan Modal PT';
      if (tab4Title) tab4Title.textContent = 'Bagian 4: RUPS & Peningkatan Modal Ditempatkan dan Disetor PT';
      if (tab4Desc) tab4Desc.textContent = 'Mencakup data penyelenggaraan RUPS, peningkatan modal dari saham simpanan, dan pelepasan hak pemegang saham.';
      if (sectionSahamPT) sectionSahamPT.style.display = 'none';
      if (sectionModalPeningkatanPT) sectionModalPeningkatanPT.style.display = 'block';
      if (subcardRupsMetadata) subcardRupsMetadata.style.display = 'block';
      if (infoPeningkatanModalPengurus) infoPeningkatanModalPengurus.style.display = 'block';
    } else if (state.ptSubType === 'SIRKULER_MODAL') {
      if (subtitle) subtitle.textContent = 'Pembuat Akta Pernyataan Keputusan Sirkuler Peningkatan Modal PT';
      if (tab4Title) tab4Title.textContent = 'Bagian 4: Keputusan Sirkuler & Peningkatan Modal Saham PT';
      if (tab4Desc) tab4Desc.textContent = 'Mencakup pengeluaran saham simpanan (portepel), penyetoran pihak pengambil, dan perubahan Pasal 4 ayat (2).';
      if (sectionSahamPT) sectionSahamPT.style.display = 'none';
      if (sectionModalPeningkatanPT) sectionModalPeningkatanPT.style.display = 'block';
      if (subcardRupsMetadata) subcardRupsMetadata.style.display = 'none';
      if (infoPeningkatanModalPengurus) infoPeningkatanModalPengurus.style.display = 'block';
    } else { // SIRKULER_PENGURUS
      if (subtitle) subtitle.textContent = 'Pembuat Akta Pernyataan Keputusan Sirkuler Perubahan Pengurus PT';
      if (tab4Title) tab4Title.textContent = 'Bagian 4: Komposisi Modal Saham & Keputusan Sirkuler';
      if (tab4Desc) tab4Desc.textContent = 'Sistem otomatis mencocokkan total saham PT dengan jumlah saham pemegang yang menandatangani sirkuler.';
      if (sectionSahamPT) sectionSahamPT.style.display = 'block';
      if (sectionModalPeningkatanPT) sectionModalPeningkatanPT.style.display = 'none';
      if (subcardRupsMetadata) subcardRupsMetadata.style.display = 'none';
      if (infoPeningkatanModalPengurus) infoPeningkatanModalPengurus.style.display = 'none';
    }

    if (sectionTitle) sectionTitle.textContent = 'Bagian 2: Identitas Perseroan Terbatas & Riwayat Legalitas (Anggaran Dasar)';
    if (namaLabel) namaLabel.innerHTML = 'Nama Perseroan Terbatas (PT) <span class="req">*</span>';
    if (skPendirianLabel) skPendirianLabel.textContent = 'Nomor SK Menkumham Pengesahan PT';
    if (skPerubahanLabel) skPerubahanLabel.textContent = 'Nomor SK Persetujuan Menkumham';
    if (pemberitahuanLabel) pemberitahuanLabel.textContent = 'Nomor Penerimaan Pemberitahuan (AHU)';
    if (groupPasal) {
      if (state.ptSubType === 'RUPS_MODAL') {
        groupPasal.classList.add('hidden');
      } else {
        groupPasal.classList.remove('hidden');
      }
    }

    if (sectionModalNonPT) sectionModalNonPT.classList.add('hidden');
    if (tab5Title) tab5Title.textContent = 'Bagian 5: Susunan Direksi & Dewan Komisaris';
    if (tab5Desc) tab5Desc.textContent = (state.ptSubType === 'SIRKULER_PENGURUS')
      ? 'Pejabat yang diangkat dalam Keputusan Sirkuler Pemegang Saham.'
      : 'Susunan pengurus PT (tetap tidak berubah pada akta peningkatan modal).';
    setActiveQuickDemo('btnDemoPT');
  } else if (type === 'CV') {
    if (sectionSahamPT) sectionSahamPT.style.display = 'none';
    if (sectionModalPeningkatanPT) sectionModalPeningkatanPT.style.display = 'none';
    if (subcardRupsMetadata) subcardRupsMetadata.style.display = 'none';
    if (infoPeningkatanModalPengurus) infoPeningkatanModalPengurus.style.display = 'none';
    if (subtitle) subtitle.textContent = 'Pembuat Akta Pernyataan Keputusan Para Pesero Persekutuan Komanditer (CV)';
    if (sectionTitle) sectionTitle.textContent = 'Bagian 2: Identitas CV & Riwayat Pendaftaran (SABU Kemenkumham / Pengadilan)';
    if (namaLabel) namaLabel.innerHTML = 'Nama Persekutuan Komanditer (CV) <span class="req">*</span>';
    if (skPendirianLabel) skPendirianLabel.textContent = 'Nomor Pendaftaran SKT SABU AHU / Register PN';
    if (skPerubahanLabel) skPerubahanLabel.textContent = 'Nomor SKT Perubahan SABU AHU';
    if (pemberitahuanLabel) pemberitahuanLabel.textContent = 'Nomor Bukti Penerimaan SABU AHU';
    if (groupPasal) groupPasal.classList.remove('hidden');

    if (sectionModalNonPT) sectionModalNonPT.classList.remove('hidden');
    if (tab4Title) tab4Title.textContent = 'Bagian 4: Modal Pemasukan (Inbreng) & Keputusan Para Pesero';
    if (tab4Desc) tab4Desc.textContent = 'Sistem otomatis mencocokkan total modal CV dengan jumlah inbreng masing-masing sekutu pengurus & komanditer.';
    if (labelTotalModalNominal) labelTotalModalNominal.innerHTML = 'Total Modal Pemasukan / Inbreng CV (Rp) <span class="req">*</span>';
    if (labelDaftarSekutu) labelDaftarSekutu.textContent = 'Daftar Para Pesero / Sekutu CV Penandatangan Keputusan';
    if (tab5Title) tab5Title.textContent = 'Bagian 5: Susunan Persero Pengurus & Persero Komanditer Baru';
    if (tab5Desc) tab5Desc.textContent = 'Sekutu pengurus (direktur) dan sekutu komanditer yang diangkat.';
    setActiveQuickDemo('btnDemoCV');
  } else if (type === 'FIRMA') {
    if (sectionSahamPT) sectionSahamPT.style.display = 'none';
    if (sectionModalPeningkatanPT) sectionModalPeningkatanPT.style.display = 'none';
    if (subcardRupsMetadata) subcardRupsMetadata.style.display = 'none';
    if (infoPeningkatanModalPengurus) infoPeningkatanModalPengurus.style.display = 'none';
    if (subtitle) subtitle.textContent = 'Pembuat Akta Pernyataan Keputusan Para Pesero Firma (Fa)';
    if (sectionTitle) sectionTitle.textContent = 'Bagian 2: Identitas Firma & Riwayat Pendaftaran (SABU / PN)';
    if (namaLabel) namaLabel.innerHTML = 'Nama Firma (Fa) <span class="req">*</span>';
    if (skPendirianLabel) skPendirianLabel.textContent = 'Nomor Pendaftaran SKT SABU AHU / Register PN';
    if (skPerubahanLabel) skPerubahanLabel.textContent = 'Nomor SKT Perubahan SABU AHU';
    if (pemberitahuanLabel) pemberitahuanLabel.textContent = 'Nomor Bukti Penerimaan SABU AHU';
    if (groupPasal) groupPasal.classList.remove('hidden');

    if (sectionModalNonPT) sectionModalNonPT.classList.remove('hidden');
    if (tab4Title) tab4Title.textContent = 'Bagian 4: Modal Inbreng Para Pesero Firma';
    if (tab4Desc) tab4Desc.textContent = 'AI otomatis mencocokkan total modal Firma dengan jumlah modal inbreng para sekutu.';
    if (labelTotalModalNominal) labelTotalModalNominal.innerHTML = 'Total Modal Inbreng Firma (Rp) <span class="req">*</span>';
    if (labelDaftarSekutu) labelDaftarSekutu.textContent = 'Daftar Para Pesero Firma Penandatangan Keputusan';
    if (tab5Title) tab5Title.textContent = 'Bagian 5: Susunan Pesero Pengurus & Pesero Firma Baru';
    if (tab5Desc) tab5Desc.textContent = 'Sekutu pengurus dan sekutu perdata yang ditetapkan dalam akta.';
    setActiveQuickDemo('btnDemoFirma');
  } else if (type === 'UD') {
    if (sectionSahamPT) sectionSahamPT.style.display = 'none';
    if (sectionModalPeningkatanPT) sectionModalPeningkatanPT.style.display = 'none';
    if (subcardRupsMetadata) subcardRupsMetadata.style.display = 'none';
    if (infoPeningkatanModalPengurus) infoPeningkatanModalPengurus.style.display = 'none';
    if (subtitle) subtitle.textContent = 'Pembuat Akta Pernyataan Keputusan Pemilik Usaha Dagang (UD) / Perorangan';
    if (sectionTitle) sectionTitle.textContent = 'Bagian 2: Identitas Usaha Dagang & Perizinan Berusaha (NIB OSS)';
    if (namaLabel) namaLabel.innerHTML = 'Nama Usaha Dagang (UD) / Usaha Perorangan <span class="req">*</span>';
    if (skPendirianLabel) skPendirianLabel.textContent = 'Nomor Induk Berusaha (NIB) / Izin Usaha OSS';
    if (skPerubahanLabel) skPerubahanLabel.textContent = 'Nomor Pembaruan NIB / Izin Usaha';
    if (pemberitahuanLabel) pemberitahuanLabel.textContent = 'Nomor Registrasi OSS / NPWP Usaha';
    if (groupPasal) groupPasal.classList.add('hidden');

    if (sectionModalNonPT) sectionModalNonPT.classList.remove('hidden');
    if (tab4Title) tab4Title.textContent = 'Bagian 4: Modal Usaha & Penetapan Keputusan Pemilik';
    if (tab4Desc) tab4Desc.textContent = 'Total modal usaha perorangan yang dialokasikan.';
    if (labelTotalModalNominal) labelTotalModalNominal.innerHTML = 'Total Modal Usaha Pemilik (Rp) <span class="req">*</span>';
    if (labelDaftarSekutu) labelDaftarSekutu.textContent = 'Daftar Pemilik & Kuasa Penandatangan Keputusan';
    if (tab5Title) tab5Title.textContent = 'Bagian 5: Susunan Pemilik & Kuasa Pengelola Usaha Baru';
    if (tab5Desc) tab5Desc.textContent = 'Pemilik usaha dan pihak yang diberi kuasa operasional pengelolaan.';
    setActiveQuickDemo('btnDemoUD');
  }

  if (autoLoadDemo) {
    if (type === 'PT') {
      if (state.ptSubType === 'SIRKULER_MODAL') loadDataToForm(DEMO_DATA_PT_SIRKULER_MODAL);
      else if (state.ptSubType === 'RUPS_MODAL') loadDataToForm(DEMO_DATA_PT_RUPS_MODAL);
      else loadDataToForm(DEMO_DATA_PT);
    }
    else if (type === 'CV') loadDataToForm(DEMO_DATA_CV);
    else if (type === 'FIRMA') loadDataToForm(DEMO_DATA_FIRMA);
    else if (type === 'UD') loadDataToForm(DEMO_DATA_UD);
  }

  checkOverallConsistency();
  applyNotaryNameLock();
  renderLivePreview();
}

// Pindah ke Tab Tertentu Secara Terprogram
function switchToTab(targetId) {
  const safeTargetId = document.getElementById(targetId) ? targetId : 'tab-akta';
  document.querySelectorAll('#editorTabBar .tab-item').forEach(t => {
    if (t.dataset.tab === safeTargetId) t.classList.add('active');
    else t.classList.remove('active');
  });
  document.querySelectorAll('.tab-page').forEach(p => {
    if (p.id === safeTargetId) p.classList.add('active');
    else p.classList.remove('active');
  });

  const contentPanel = document.getElementById('splitFormPane');
  if (contentPanel) {
    contentPanel.scrollTop = 0;
  }
}

// Setup Navigasi Tab
function setupTabNavigation() {
  const tabs = document.querySelectorAll('#editorTabBar .tab-item');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      switchToTab(tab.dataset.tab);
    });
  });
}

// Setup Live Preview Terbilang
function setupLiveTerbilangListeners() {
  const bindings = [
    { input: 'aktaNomor', preview: 'terbilangAktaNomor', fn: v => v ? `Terbilang: Nomor ${terbilang(v)}` : '' },
    { input: 'aktaTanggal', preview: 'terbilangAktaTanggal', fn: v => formatTanggalAkta(v) },
    { input: 'aktaJam', preview: 'terbilangAktaJam', fn: v => formatJamAkta(v) },
    { input: 'ptAktaPendirianTgl', preview: 'terbilangPtAktaPendirianTgl', fn: v => formatTanggalBiasa(v) },
    { input: 'penghadapTanggalLahir', preview: 'terbilangPenghadapTanggalLahir', fn: v => formatTanggalBiasa(v) },
    { input: 'totalSahamSeriA', preview: 'terbilangTotalSahamSeriA', fn: v => v ? `Terbilang: ${formatSaham(v)}` : '' },
    { input: 'totalSahamSeriB', preview: 'terbilangTotalSahamSeriB', fn: v => v ? `Terbilang: ${formatSaham(v)}` : '' },
    { input: 'totalModalNominal', preview: 'terbilangTotalModalNominal', fn: v => v ? `Terbilang: ${formatRupiah(v)}` : '' },
    { input: 'rupsTanggal', preview: 'terbilangRupsTanggal', fn: v => formatTanggalBiasa(v) },
    { input: 'rupsSahamHadir', preview: 'terbilangRupsSahamHadir', fn: v => v ? `Terbilang: ${formatSaham(v)}` : '' },
    { input: 'modalSemulaNominal', preview: 'terbilangModalSemulaNominal', fn: v => v ? `Terbilang: ${formatRupiah(v)}` : '' },
    { input: 'modalSemulaSaham', preview: 'terbilangModalSemulaSaham', fn: v => v ? `Terbilang: ${formatSaham(v)}` : '' },
    { input: 'nominalPerSaham', preview: 'terbilangNominalPerSaham', fn: v => v ? `Terbilang: ${formatRupiah(v)}` : '' },
    { input: 'modalMenjadiNominal', preview: 'terbilangModalMenjadiNominal', fn: v => v ? `Terbilang: ${formatRupiah(v)}` : '' },
    { input: 'modalMenjadiSaham', preview: 'terbilangModalMenjadiSaham', fn: v => v ? `Terbilang: ${formatSaham(v)}` : '' },
    { input: 'sahamSimpananDikeluarkanJml', preview: 'terbilangSahamSimpananDikeluarkanJml', fn: v => v ? `Terbilang: ${formatSaham(v)}` : '' },
    { input: 'sahamSimpananDikeluarkanNominal', preview: 'terbilangSahamSimpananDikeluarkanNominal', fn: v => v ? `Terbilang: ${formatRupiah(v)}` : '' }
  ];

  bindings.forEach(({ input, preview, fn }) => {
    const el = document.getElementById(input);
    const prevEl = document.getElementById(preview);
    if (el && prevEl) {
      el.addEventListener('input', () => {
        prevEl.textContent = fn(el.value);
        checkOverallConsistency();
      });
    }
  });

  // Validasi NIK Penghadap
  const nikEl = document.getElementById('penghadapNik');
  const nikMsg = document.getElementById('msg-penghadapNik');
  if (nikEl && nikMsg) {
    nikEl.addEventListener('input', () => {
      const clean = nikEl.value.replace(/\D/g, '');
      if (clean.length > 0 && clean.length !== 16) {
        nikMsg.textContent = `NIK saat ini ${clean.length} digit (Standar KTP wajib 16 digit)`;
      } else {
        nikMsg.textContent = '';
      }
    });
  }
}

// Fitur Pengecekan Typo Dinonaktifkan (karena input didominasi entitas unik: nama, NIK, alamat)
function setupTypoChecking() { }

// Periksa Keseluruhan Konsistensi Data Hukum & Perbarui Status di Header
function checkOverallConsistency() {
  const formData = kumpulkanDataForm();
  const warningBanner = document.getElementById('aiWarningBanner');
  const warningList = document.getElementById('aiWarningList');
  const aiPill = document.getElementById('aiStatusPill');
  const aiText = document.getElementById('aiStatusText');

  const warnings = validasiDataAkta(formData);

  if (warnings.length > 0) {
    if (aiPill) aiPill.className = 'ai-status-pill warning';
    if (aiText) aiText.textContent = `${warnings.length} Masalah Data Hukum Terdeteksi`;

    if (warningBanner && warningList) {
      warningBanner.classList.remove('hidden');
      let html = '';
      warnings.forEach(w => {
        html += `<div>• <b>${w.pesan}</b></div>`;
      });
      warningList.innerHTML = html;
    }
  } else {
    if (aiPill) aiPill.className = 'ai-status-pill clean';
    if (aiText) aiText.textContent = 'Status Data: Lengkap & Sesuai';
    if (warningBanner) warningBanner.classList.add('hidden');
  }
}

// Helper seragam untuk menyinkronkan preview & autosave saat baris dinamis diubah/dihapus
function wireDynamicRowEvents(rowEl) {
  const btnDel = rowEl.querySelector('.btn-delete');
  if (btnDel) {
    btnDel.addEventListener('click', () => {
      rowEl.remove();
      checkOverallConsistency();
      renderLivePreview();
      triggerAutoSave();
    });
  }
  rowEl.querySelectorAll('input, select, textarea').forEach(el => {
    el.addEventListener('input', () => checkOverallConsistency());
    el.addEventListener('change', () => checkOverallConsistency());
  });
}

// Tambah / Hapus Baris Dinamis (Pemegang Saham PT, Sekutu CV/Firma/UD, & Pengurus)
function setupDynamicRowActions() {
  const bindings = [
    ['btnAddPemegangSaham', () => tambahBarisPemegangSaham()],
    ['btnAddPemegangSahamModal', () => tambahBarisPemegangSahamModal()],
    ['btnAddSekutu', () => tambahBarisSekutu()],
    ['btnAddPengurus', () => tambahBarisPengurus()]
  ];
  bindings.forEach(([id, addFn]) => {
    const btn = document.getElementById(id);
    if (btn) {
      btn.addEventListener('click', () => {
        addFn();
        checkOverallConsistency();
        renderLivePreview();
        triggerAutoSave();
      });
    }
  });
}

// 1. Baris Pemegang Saham (Khusus PT)
function tambahBarisPemegangSaham(data = null) {
  const container = document.getElementById('pemegangSahamContainer');
  if (!container) return;
  const id = Date.now() + Math.random().toString(36).substring(2, 6);
  const item = data || {
    nama: '',
    selaku: 'Direktur Perseroan Terbatas',
    sahamSeriA: 0,
    sahamSeriB: 0,
    tanggalTtd: '10 September 2026'
  };

  const div = document.createElement('div');
  div.className = 'dynamic-row-card';
  div.id = `row-ps-${id}`;
  div.innerHTML = `
    <div class="dynamic-header">
      <span class="dynamic-tag">Pemegang Saham PT</span>
      <button type="button" class="btn-danger-sm btn-delete">Hapus</button>
    </div>
    <div class="grid grid-2">
      <div class="form-group">
        <label>Nama Pemegang Saham / Yang Mewakili</label>
        <input type="text" class="form-input ps-nama spell-check" value="${item.nama}" placeholder="Contoh: Tuan. BINTANG BULAN" required />
      </div>
      <div class="form-group">
        <label>Kapasitas / Selaku Perusahaan</label>
        <input type="text" class="form-input ps-selaku spell-check" value="${item.selaku}" placeholder="Contoh: Direktur PT. ANUGERAH LANCAR JAYA" />
      </div>
    </div>
    <div class="grid grid-3 mt-3">
      <div class="form-group">
        <label>Jumlah Saham Seri-A (Lembar)</label>
        <input type="number" class="form-input ps-saham-a" value="${item.sahamSeriA}" />
      </div>
      <div class="form-group">
        <label>Jumlah Saham Seri-B (Lembar)</label>
        <input type="number" class="form-input ps-saham-b" value="${item.sahamSeriB}" />
      </div>
      <div class="form-group">
        <label>Tanggal TTD Sirkuler</label>
        <input type="text" class="form-input ps-tgl" value="${item.tanggalTtd}" placeholder="10 September 2026" />
      </div>
    </div>
  `;

  wireDynamicRowEvents(div);
  container.appendChild(div);
}

// 1B. Baris Pemegang Saham Baru Pasal 4 ayat (2) (Khusus PT Peningkatan Modal)
function tambahBarisPemegangSahamModal(data = null) {
  const container = document.getElementById('pemegangSahamModalContainer');
  if (!container) return;
  const id = Date.now() + Math.random().toString(36).substring(2, 6);
  const item = data || {
    nama: '',
    jumlahSaham: 0,
    nominal: 0,
    persentase: '0%'
  };

  const div = document.createElement('div');
  div.className = 'dynamic-row-card';
  div.id = `row-psm-${id}`;
  div.innerHTML = `
    <div class="dynamic-header">
      <span class="dynamic-tag">Pemegang Saham Baru (Pasal 4 ayat 2)</span>
      <button type="button" class="btn-danger-sm btn-delete">Hapus</button>
    </div>
    <div class="grid grid-2">
      <div class="form-group">
        <label>Nama Pemegang Saham / Perusahaan <span class="req">*</span></label>
        <input type="text" class="form-input psm-nama spell-check" value="${item.nama || ''}" placeholder="Contoh: PT. JAYA ABADI SELALU" required />
      </div>
      <div class="form-group">
        <label>Persentase Kepemilikan (%)</label>
        <input type="text" class="form-input psm-persen" value="${item.persentase || ''}" placeholder="Contoh: 99,999%" />
      </div>
    </div>
    <div class="grid grid-2 mt-3">
      <div class="form-group">
        <label>Jumlah Saham (Lembar) <span class="req">*</span></label>
        <input type="number" class="form-input psm-saham" value="${item.jumlahSaham || 0}" placeholder="962505" />
      </div>
      <div class="form-group">
        <label>Nilai Nominal Saham (Rp) <span class="req">*</span></label>
        <input type="number" class="form-input psm-nominal" value="${item.nominal || 0}" placeholder="962505000000" />
      </div>
    </div>
  `;

  wireDynamicRowEvents(div);
  container.appendChild(div);
}

// 2. Baris Sekutu / Pesero / Pemilik (Khusus CV, Firma, UD)
function tambahBarisSekutu(data = null) {
  const container = document.getElementById('sekutuContainer');
  if (!container) return;
  const id = Date.now() + Math.random().toString(36).substring(2, 6);

  const defaultStatus = state.entityType === 'CV'
    ? 'Persero Pengurus'
    : (state.entityType === 'FIRMA' ? 'Pesero Pengurus' : 'Pemilik Usaha');

  const item = data || {
    nama: '',
    statusSekutu: defaultStatus,
    nominalInbreng: 0,
    persentase: '50',
    tanggalTtd: '15 Oktober 2026'
  };

  const labelStatus = state.entityType === 'CV'
    ? 'Status Sekutu'
    : (state.entityType === 'FIRMA' ? 'Status Pesero' : 'Status Kepemilikan');

  const div = document.createElement('div');
  div.className = 'dynamic-row-card';
  div.id = `row-sk-${id}`;
  div.innerHTML = `
    <div class="dynamic-header">
      <span class="dynamic-tag">Pesero / Sekutu / Pemilik</span>
      <button type="button" class="btn-danger-sm btn-delete">Hapus</button>
    </div>
    <div class="grid grid-2">
      <div class="form-group">
        <label>Nama Lengkap Pesero / Pemilik</label>
        <input type="text" class="form-input sk-nama spell-check" value="${item.nama}" placeholder="Contoh: Tuan. H. AHMAD FAUZI" required />
      </div>
      <div class="form-group">
        <label>${labelStatus}</label>
        <input type="text" class="form-input sk-status spell-check" value="${item.statusSekutu}" placeholder="Contoh: Persero Pengurus / Pemilik" />
      </div>
    </div>
    <div class="grid grid-3 mt-3">
      <div class="form-group">
        <label>Nominal Modal Inbreng (Rp)</label>
        <input type="number" class="form-input sk-nominal" value="${item.nominalInbreng}" placeholder="Contoh: 250000000" />
      </div>
      <div class="form-group">
        <label>Porsi / Persentase Modal (%)</label>
        <input type="text" class="form-input sk-persen" value="${item.persentase}" placeholder="Contoh: 50" />
      </div>
      <div class="form-group">
        <label>Tanggal Tanda Tangan</label>
        <input type="text" class="form-input sk-tgl" value="${item.tanggalTtd}" placeholder="15 Oktober 2026" />
      </div>
    </div>
  `;

  wireDynamicRowEvents(div);
  container.appendChild(div);
}

// 3. Baris Pejabat Pengurus Baru (Organ)
function tambahBarisPengurus(data = null) {
  const container = document.getElementById('pengurusContainer');
  if (!container) return;
  const id = Date.now() + Math.random().toString(36).substring(2, 6);

  const defaultJabatan = state.entityType === 'PT'
    ? 'Direktur Utama'
    : (state.entityType === 'CV' ? 'Persero Pengurus (Direktur)' : (state.entityType === 'FIRMA' ? 'Pesero Pengurus' : 'Pemilik Usaha'));

  const item = data || {
    jabatan: defaultJabatan,
    sapaan: 'Tuan',
    nama: '',
    tempatLahir: '',
    tanggalLahir: '1980-01-01',
    kewarganegaraan: 'Indonesia',
    pekerjaan: 'Karyawan Swasta',
    nik: '',
    alamat: ''
  };

  // Jabatan options adapted to entity
  let jabatanOptions = '';
  if (state.entityType === 'PT') {
    jabatanOptions = `
      <option value="Direktur Utama" ${item.jabatan === 'Direktur Utama' ? 'selected' : ''}>Direktur Utama</option>
      <option value="Direktur" ${item.jabatan === 'Direktur' ? 'selected' : ''}>Direktur</option>
      <option value="Komisaris Utama" ${item.jabatan === 'Komisaris Utama' ? 'selected' : ''}>Komisaris Utama</option>
      <option value="Komisaris" ${item.jabatan === 'Komisaris' ? 'selected' : ''}>Komisaris</option>
    `;
  } else if (state.entityType === 'CV') {
    jabatanOptions = `
      <option value="Persero Pengurus (Direktur)" ${item.jabatan.includes('Pengurus') ? 'selected' : ''}>Persero Pengurus (Direktur)</option>
      <option value="Persero Komanditer" ${item.jabatan.includes('Komanditer') ? 'selected' : ''}>Persero Komanditer (Sekutu Diam)</option>
    `;
  } else if (state.entityType === 'FIRMA') {
    jabatanOptions = `
      <option value="Pesero Pengurus" ${item.jabatan.includes('Pengurus') ? 'selected' : ''}>Pesero Pengurus</option>
      <option value="Pesero Firma" ${item.jabatan.includes('Firma') ? 'selected' : ''}>Pesero Firma</option>
    `;
  } else {
    jabatanOptions = `
      <option value="Pemilik Usaha" ${item.jabatan.includes('Pemilik') ? 'selected' : ''}>Pemilik Usaha</option>
      <option value="Kuasa Pengelola Usaha" ${item.jabatan.includes('Kuasa') ? 'selected' : ''}>Kuasa Pengelola Usaha</option>
      <option value="Penanggung Jawab Operasional" ${item.jabatan.includes('Penanggung') ? 'selected' : ''}>Penanggung Jawab Operasional</option>
    `;
  }

  const div = document.createElement('div');
  div.className = 'dynamic-row-card';
  div.id = `row-pg-${id}`;
  div.innerHTML = `
    <div class="dynamic-header">
      <span class="dynamic-tag">Pengurus / Organ Baru</span>
      <button type="button" class="btn-danger-sm btn-delete">Hapus</button>
    </div>
    <div class="grid grid-3">
      <div class="form-group">
        <label>Jabatan / Kedudukan</label>
        <select class="form-input pg-jabatan">
          ${jabatanOptions}
        </select>
      </div>
      <div class="form-group">
        <label>Sapaan</label>
        <select class="form-input pg-sapaan">
          <option value="Tuan" ${item.sapaan === 'Tuan' ? 'selected' : ''}>Tuan</option>
          <option value="Nyonya" ${item.sapaan === 'Nyonya' ? 'selected' : ''}>Nyonya</option>
          <option value="Nona" ${item.sapaan === 'Nona' ? 'selected' : ''}>Nona</option>
        </select>
      </div>
      <div class="form-group">
        <label>Nama Lengkap</label>
        <input type="text" class="form-input pg-nama spell-check" value="${item.nama}" placeholder="PANGERAN KELINCI" required />
      </div>
    </div>
    <div class="grid grid-3 mt-3">
      <div class="form-group">
        <label>Tempat Lahir</label>
        <input type="text" class="form-input pg-tempat-lahir" value="${item.tempatLahir}" placeholder="Semarang" />
      </div>
      <div class="form-group">
        <label>Tanggal Lahir</label>
        <input type="date" class="form-input pg-tgl-lahir" value="${item.tanggalLahir}" />
      </div>
      <div class="form-group">
        <label>NIK KTP (16 Digit)</label>
        <input type="text" class="form-input pg-nik" maxlength="16" value="${item.nik}" placeholder="3333399900000111" required />
      </div>
    </div>
    <div class="form-group mt-3">
      <label>Alamat Lengkap KTP</label>
      <textarea class="form-input pg-alamat" rows="2" placeholder="Jalan Sutera Delima I No. 23, RT 003, RW 010...">${item.alamat}</textarea>
    </div>
  `;

  wireDynamicRowEvents(div);
  container.appendChild(div);
}

/**
 * Terapkan penguncian nama lengkap notaris jika LOCK_NOTARY_NAME diaktifkan di demoConfig.js
 */
function applyNotaryNameLock() {
  const isLocked = Boolean(DEMO_CONFIG?.LOCK_NOTARY_NAME);
  const lockedName = (DEMO_CONFIG?.LOCKED_NOTARY_NAME || 'GRENDI JAYA DARMAWAN').trim();

  const notarisNamaEl = document.getElementById('notarisNama');
  const defaultNotarisNamaEl = document.getElementById('defaultNotarisNama');
  const badgeNotarisNama = document.getElementById('badgeLockNotarisNama');
  const badgeDefaultNotaris = document.getElementById('badgeLockDefaultNotaris');

  if (isLocked) {
    if (notarisNamaEl) {
      notarisNamaEl.value = lockedName;
      notarisNamaEl.readOnly = true;
      notarisNamaEl.classList.add('input-locked');
      notarisNamaEl.title = `Nama Notaris dikunci lisensi: ${lockedName}`;
    }
    if (defaultNotarisNamaEl) {
      defaultNotarisNamaEl.value = lockedName;
      defaultNotarisNamaEl.readOnly = true;
      defaultNotarisNamaEl.classList.add('input-locked');
      defaultNotarisNamaEl.title = `Nama Notaris dikunci lisensi: ${lockedName}`;
    }
    if (badgeNotarisNama) badgeNotarisNama.style.display = 'inline-flex';
    if (badgeDefaultNotaris) badgeDefaultNotaris.style.display = 'inline-flex';
    localStorage.setItem('notaris_default_nama', lockedName);
  } else {
    if (notarisNamaEl) {
      notarisNamaEl.readOnly = false;
      notarisNamaEl.classList.remove('input-locked');
      notarisNamaEl.title = '';
    }
    if (defaultNotarisNamaEl) {
      defaultNotarisNamaEl.readOnly = false;
      defaultNotarisNamaEl.classList.remove('input-locked');
      defaultNotarisNamaEl.title = '';
    }
    if (badgeNotarisNama) badgeNotarisNama.style.display = 'none';
    if (badgeDefaultNotaris) badgeDefaultNotaris.style.display = 'none';
  }
}

// Action Buttons: Load Demo, Reset, Generate Word
function setupActionButtons() {
  document.getElementById('btnLoadDemo').addEventListener('click', () => {
    if (state.entityType === 'PT') {
      if (state.ptSubType === 'SIRKULER_MODAL') loadDataToForm(DEMO_DATA_PT_SIRKULER_MODAL);
      else if (state.ptSubType === 'RUPS_MODAL') loadDataToForm(DEMO_DATA_PT_RUPS_MODAL);
      else loadDataToForm(DEMO_DATA_PT);
    }
    else if (state.entityType === 'CV') loadDataToForm(DEMO_DATA_CV);
    else if (state.entityType === 'FIRMA') loadDataToForm(DEMO_DATA_FIRMA);
    else if (state.entityType === 'UD') loadDataToForm(DEMO_DATA_UD);
    updateActiveDraftUI(null);
    setDraftSavedStatus(false);
  });

  document.getElementById('btnReset').addEventListener('click', async () => {
    const ok = await showAppDialog({
      type: 'warning',
      title: 'Kosongkan Seluruh Formulir?',
      message: 'Seluruh isian data yang belum disimpan ke berkas draf akan dikosongkan kembali. Apakah Anda yakin ingin melanjutkan?',
      showCancel: true,
      cancelText: 'Batal',
      confirmText: 'Ya, Kosongkan Form',
      confirmType: 'danger'
    });
    if (ok) {
      resetFormFields(true);
      updateActiveDraftUI(null);
      setDraftSavedStatus(false);
    }
  });

  const handleGenerate = async () => {
    if (isDemoLocked()) {
      showDemoLockOverlay();
      return;
    }
    const data = kumpulkanDataForm();
    const btn = document.getElementById('btnGenerateDocx');
    const originalText = btn.innerHTML;

    const tipe = data.badanUsaha?.tipe || 'PT';
    const subTipe = data.subTipe || '';
    let rawNama = 'AKTA';
    if (tipe === 'PT') rawNama = data.pt?.nama || 'AKTA';
    else if (tipe === 'CV') rawNama = data.cv?.nama || 'AKTA';
    else if (tipe === 'FIRMA' || tipe === 'FA') rawNama = data.firma?.nama || 'AKTA';
    else if (tipe === 'UD') rawNama = data.ud?.nama || 'AKTA';
    const cleanNama = rawNama.replace(/[^a-zA-Z0-9]/g, '_');
    const nomorAkta = data.akta?.nomor || '1';
    let subTipeTag = '';
    if (subTipe === 'RUPS_MODAL') subTipeTag = '_RUPS_Modal';
    else if (subTipe === 'SIRKULER_MODAL') subTipeTag = '_Sirkuler_Modal';
    const defaultWordFilename = `Salinan_Akta_No_${nomorAkta}_${tipe}${subTipeTag}_${cleanNama}.docx`;

    let initialWordDir = localStorage.getItem('setting_dir_archive') || localStorage.getItem('setting_dir_word') || localStorage.getItem('setting_dir_progress') || '';
    let chosenPath = '';

    if (window.__TAURI__?.core?.invoke) {
      try {
        const selected = await window.__TAURI__.core.invoke('pick_save_file', {
          title: 'Simpan Dokumen Salinan Akta Word (.docx)',
          defaultName: defaultWordFilename,
          defaultPath: initialWordDir || undefined,
          filterName: 'Dokumen Microsoft Word (*.docx)',
          filterExts: ['docx']
        });

        if (!selected) return;

        chosenPath = selected;
        if (!chosenPath.toLowerCase().endsWith('.docx')) {
          chosenPath += '.docx';
        }

        const lastSep = Math.max(chosenPath.lastIndexOf('\\'), chosenPath.lastIndexOf('/'));
        if (lastSep !== -1) {
          const chosenDir = chosenPath.substring(0, lastSep);
          localStorage.setItem('setting_dir_archive', chosenDir);
          localStorage.setItem('setting_dir_progress', chosenDir);
          localStorage.setItem('setting_dir_word', chosenDir);
          const arcInput = document.getElementById('settingDirArchive');
          if (arcInput) arcInput.value = chosenDir;
        }
      } catch (err) {
        console.error('Gagal memilih lokasi penyimpanan Word:', err);
        await showAppDialog({
          type: 'error',
          title: 'Gagal Membuka File Explorer',
          message: err.message || String(err)
        });
        return;
      }
    }

    try {
      btn.disabled = true;
      btn.innerHTML = `Sedang Memproses...`;
      const res = await generateAktaWord(data);
      const filename = chosenPath ? chosenPath.split(/[\\/]/).pop() : (res.filename || defaultWordFilename);
      const blob = res.blob;

      if (window.__TAURI__?.core?.invoke && blob && chosenPath) {
        try {
          const buffer = await blob.arrayBuffer();
          const bytes = Array.from(new Uint8Array(buffer));
          await window.__TAURI__.core.invoke('write_binary_file', {
            filePath: chosenPath,
            bytes: bytes
          });
        } catch (e) {
          console.error('Gagal menulis file Word ke disk via Tauri:', e);
          await showAppDialog({
            type: 'error',
            title: 'Gagal Menyimpan File Word',
            message: e.message || String(e)
          });
          return;
        }
      } else if (!window.__TAURI__?.core?.invoke && blob) {
        saveAs(blob, filename);
      }

      const folderOnly = chosenPath ? chosenPath.substring(0, chosenPath.length - filename.length - 1) : '';
      await showAppDialog({
        type: 'success',
        title: 'Dokumen Word Berhasil Dibuat!',
        message: 'Berkas akta resmi format Microsoft Word (.docx) siap cetak telah berhasil digenerate sesuai standar UUJN.',
        details: {
          'Nama Berkas': filename,
          'Direktori Target': folderOnly || '-',
          'Jalur Lengkap': chosenPath || filename
        },
        confirmText: 'Selesai'
      });
    } catch (err) {
      console.error(err);
      await showAppDialog({
        type: 'error',
        title: 'Gagal Membuat Dokumen Word',
        message: err.message || String(err)
      });
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
  };

  const btnGen = document.getElementById('btnGenerateDocx');
  if (btnGen) btnGen.addEventListener('click', handleGenerate);
  const btnExport = document.getElementById('btnExportPreview');
  if (btnExport) btnExport.addEventListener('click', handleGenerate);

  // Tombol Export Dokumen Internal (Keputusan Sirkuler / BA RUPS dengan Tabel)
  const btnExportInternal = document.getElementById('btnExportInternalDoc');
  if (btnExportInternal) {
    btnExportInternal.addEventListener('click', async () => {
      const data = kumpulkanDataForm();
      const originalText = btnExportInternal.innerHTML;
      try {
        btnExportInternal.disabled = true;
        btnExportInternal.innerHTML = `Sedang Memproses...`;

        const res = await exportInternalDocx(data);
        const filename = res.filename || 'Dokumen_Internal.docx';
        const blob = res.blob;

        let initialWordDir = localStorage.getItem('setting_dir_archive') || localStorage.getItem('setting_dir_word') || localStorage.getItem('setting_dir_progress') || '';
        let chosenPath = '';

        if (window.__TAURI__?.core?.invoke) {
          try {
            const selected = await window.__TAURI__.core.invoke('pick_save_file', {
              title: 'Simpan Dokumen Internal (.docx)',
              defaultName: filename,
              defaultPath: initialWordDir || undefined,
              filterName: 'Dokumen Microsoft Word (*.docx)',
              filterExts: ['docx']
            });

            if (!selected) {
              btnExportInternal.disabled = false;
              btnExportInternal.innerHTML = originalText;
              return;
            }

            chosenPath = selected;
            if (!chosenPath.toLowerCase().endsWith('.docx')) {
              chosenPath += '.docx';
            }

            const buffer = await blob.arrayBuffer();
            const bytes = Array.from(new Uint8Array(buffer));
            await window.__TAURI__.core.invoke('write_binary_file', {
              filePath: chosenPath,
              bytes: bytes
            });
          } catch (e) {
            console.error('Gagal menulis file dokumen internal via Tauri:', e);
            await showAppDialog({
              type: 'error',
              title: 'Gagal Menyimpan Dokumen Internal',
              message: e.message || String(e)
            });
            return;
          }
        } else if (blob) {
          saveAs(blob, filename);
        }

        await showAppDialog({
          type: 'success',
          title: 'Dokumen Internal Berhasil Dibuat!',
          message: `Berkas Word dokumen internal (${data.subTipe === 'RUPS_MODAL' ? 'Berita Acara RUPS Agenda Peningkatan Modal' : 'Keputusan Sirkuler Peningkatan Modal'} berformat tabel) telah berhasil dibuat.\nNama berkas: ${filename}`
        });
      } catch (err) {
        console.error('Error exportInternalDocx:', err);
        await showAppDialog({
          type: 'error',
          title: 'Gagal Mengekspor Dokumen Internal',
          message: err.message || String(err)
        });
      } finally {
        btnExportInternal.disabled = false;
        btnExportInternal.innerHTML = originalText;
      }
    });
  }



  // Tombol Top Settings Navbar (ke Tampilan Pengaturan Sendiri)
  const btnTopSettings = document.getElementById('btnTopSettings');
  if (btnTopSettings) {
    btnTopSettings.addEventListener('click', () => {
      state.previousView = 'editor';
      switchView('settings');
    });
  }
  const btnSaveNotaris = document.getElementById('btnSaveDefaultNotaris');
  if (btnSaveNotaris) {
    btnSaveNotaris.addEventListener('click', () => {
      let defNama = document.getElementById('defaultNotarisNama')?.value || '';
      if (DEMO_CONFIG?.LOCK_NOTARY_NAME && DEMO_CONFIG?.LOCKED_NOTARY_NAME) {
        defNama = DEMO_CONFIG.LOCKED_NOTARY_NAME;
      }
      const defWil = document.getElementById('defaultNotarisWilayah')?.value || '';
      const defGelarP = document.getElementById('defaultNotarisGelarPanjang')?.value || '';
      const defGelarS = document.getElementById('defaultNotarisGelarSingkat')?.value || '';
      localStorage.setItem('notaris_default_nama', defNama);
      localStorage.setItem('notaris_default_wilayah', defWil);
      localStorage.setItem('notaris_default_gelar_panjang', defGelarP);
      localStorage.setItem('notaris_default_gelar_singkat', defGelarS);

      const notarisNamaEl = document.getElementById('notarisNama');
      const notarisWilayahEl = document.getElementById('notarisWilayah');
      const notarisGPEl = document.getElementById('notarisGelarPanjang');
      const notarisGSEl = document.getElementById('notarisGelarSingkat');
      if (notarisNamaEl && defNama) notarisNamaEl.value = defNama;
      if (notarisWilayahEl && defWil) notarisWilayahEl.value = defWil;
      if (notarisGPEl && defGelarP) notarisGPEl.value = defGelarP;
      if (notarisGSEl && defGelarS) notarisGSEl.value = defGelarS;

      applyNotaryNameLock();

      const successLabel = document.getElementById('saveNotarisSuccess');
      if (successLabel) {
        successLabel.style.display = 'inline-flex';
        setTimeout(() => { successLabel.style.display = 'none'; }, 3000);
      }
    });
  }

  // Muat Notaris Default dari LocalStorage jika ada
  const savedNama = localStorage.getItem('notaris_default_nama');
  const savedWilayah = localStorage.getItem('notaris_default_wilayah');
  const savedGelarP = localStorage.getItem('notaris_default_gelar_panjang');
  const savedGelarS = localStorage.getItem('notaris_default_gelar_singkat');
  if (savedNama) {
    const defNamaEl = document.getElementById('defaultNotarisNama');
    if (defNamaEl) {
      defNamaEl.value = (DEMO_CONFIG?.LOCK_NOTARY_NAME && DEMO_CONFIG?.LOCKED_NOTARY_NAME)
        ? DEMO_CONFIG.LOCKED_NOTARY_NAME
        : savedNama;
    }
  }
  if (savedWilayah) {
    const defWilEl = document.getElementById('defaultNotarisWilayah');
    if (defWilEl) defWilEl.value = savedWilayah;
  }
  if (savedGelarP) {
    const defGPEl = document.getElementById('defaultNotarisGelarPanjang');
    if (defGPEl) defGPEl.value = savedGelarP;
  }
  if (savedGelarS) {
    const defGSEl = document.getElementById('defaultNotarisGelarSingkat');
    if (defGSEl) defGSEl.value = savedGelarS;
  }

  // Listener pemisahan otomatis jika user menempel nama dengan koma gelar di notarisNama
  const notarisNamaInput = document.getElementById('notarisNama');
  if (notarisNamaInput) {
    notarisNamaInput.addEventListener('change', () => {
      if (DEMO_CONFIG?.LOCK_NOTARY_NAME) {
        applyNotaryNameLock();
        return;
      }
      const val = notarisNamaInput.value.trim();
      if (val.includes(',')) {
        const parts = val.split(',');
        notarisNamaInput.value = parts[0].trim();
        const detectedGelar = parts.slice(1).map(p => p.trim()).filter(Boolean).join(', ');
        const gSEl = document.getElementById('notarisGelarSingkat');
        if (gSEl && detectedGelar) {
          gSEl.value = detectedGelar;
        }
      }
    });
  }

  applyNotaryNameLock();
}

// Muat Data ke Form
function loadDataToForm(data) {
  const tipe = (data.badanUsaha && data.badanUsaha.tipe) || 'PT';
  const subTipe = data.subTipe || (tipe === 'PT' ? (data.rups?.tanggal ? 'RUPS_MODAL' : (data.peningkatanModal?.modalMenjadiNominal ? 'SIRKULER_MODAL' : 'SIRKULER_PENGURUS')) : null);
  if (subTipe) {
    state.ptSubType = subTipe;
  }
  switchEntityType(tipe, false, subTipe);

  // Muat template klausula khusus jika tersimpan dalam draf
  state.customTemplates = (data.customTemplates && typeof data.customTemplates === 'object')
    ? { ...data.customTemplates }
    : {};
  updateCustomClauseBadges();

  // Akta & Notaris
  document.getElementById('aktaNomor').value = data.akta?.nomor || '';
  document.getElementById('aktaTanggal').value = data.akta?.tanggal || '';
  document.getElementById('aktaJam').value = data.akta?.jam || '';

  const rawNamaNotaris = data.notaris?.nama || '';
  let namaMurni = rawNamaNotaris;
  let parsedGelar = '';
  if (rawNamaNotaris.includes(',')) {
    namaMurni = rawNamaNotaris.split(',')[0].trim();
    parsedGelar = rawNamaNotaris.substring(rawNamaNotaris.indexOf(',') + 1).trim();
  }
  document.getElementById('notarisNama').value = namaMurni;
  document.getElementById('notarisWilayah').value = data.notaris?.wilayah || '';
  const notarisGPEl = document.getElementById('notarisGelarPanjang');
  const notarisGSEl = document.getElementById('notarisGelarSingkat');
  if (notarisGPEl) {
    notarisGPEl.value = data.notaris?.gelarPanjang || 'Sarjana Hukum, Magister Kenotariatan';
  }
  if (notarisGSEl) {
    notarisGSEl.value = data.notaris?.gelarSingkat || (parsedGelar || 'S.H., M.Kn.');
  }

  // Badan Usaha
  document.getElementById('ptNama').value = data.pt?.nama || '';
  document.getElementById('ptKedudukan').value = data.pt?.kedudukan || '';
  document.getElementById('ptAktaPendirianNomor').value = data.pt?.aktaPendirianNomor || '';
  document.getElementById('ptAktaPendirianTgl').value = data.pt?.aktaPendirianTgl || '';
  document.getElementById('ptAktaPendirianNotaris').value = data.pt?.aktaPendirianNotaris || '';
  document.getElementById('ptAktaPendirianWilayah').value = data.pt?.aktaPendirianWilayah || '';
  document.getElementById('ptSkPendirianNomor').value = data.pt?.skPendirianNomor || '';
  document.getElementById('ptSkPendirianTgl').value = data.pt?.skPendirianTgl || '';
  document.getElementById('ptAktaPerubahanNomor').value = data.pt?.aktaPerubahanNomor || '';
  document.getElementById('ptAktaPerubahanTgl').value = data.pt?.aktaPerubahanTgl || '';
  document.getElementById('ptAktaPerubahanNotaris').value = data.pt?.aktaPerubahanNotaris || '';
  document.getElementById('ptAktaPerubahanWilayah').value = data.pt?.aktaPerubahanWilayah || '';
  document.getElementById('ptSkPerubahanNomor').value = data.pt?.skPerubahanNomor || '';
  document.getElementById('ptSkPerubahanTgl').value = data.pt?.skPerubahanTgl || '';
  document.getElementById('ptPemberitahuanPerubahanNomor').value = data.pt?.pemberitahuanPerubahanNomor || '';
  document.getElementById('ptPasalSirkuler').value = data.pt?.pasalSirkuler || '10 ayat (5)';

  // Penghadap
  document.getElementById('penghadapSapaan').value = data.penghadap?.sapaan || 'Tuan';
  document.getElementById('penghadapNama').value = data.penghadap?.nama || '';
  document.getElementById('penghadapTempatLahir').value = data.penghadap?.tempatLahir || '';
  document.getElementById('penghadapTanggalLahir').value = data.penghadap?.tanggalLahir || '';
  document.getElementById('penghadapNik').value = data.penghadap?.nik || '';
  document.getElementById('penghadapPekerjaan').value = data.penghadap?.pekerjaan || 'Karyawan Swasta';
  document.getElementById('penghadapWn').value = data.penghadap?.kewarganegaraan || 'Indonesia';
  document.getElementById('penghadapJabatan').value = data.penghadap?.jabatan || '';
  document.getElementById('penghadapAlamat').value = data.penghadap?.alamat || '';

  // Saham (PT)
  const elSahamA = document.getElementById('totalSahamSeriA');
  const elSahamB = document.getElementById('totalSahamSeriB');
  if (elSahamA) elSahamA.value = data.saham?.totalSeriA || 0;
  if (elSahamB) elSahamB.value = data.saham?.totalSeriB || 0;

  // Modal Inbreng (CV, FIRMA, UD)
  const elTotalModal = document.getElementById('totalModalNominal');
  if (elTotalModal) elTotalModal.value = data.modal?.totalNominal || 0;

  // Keputusan
  document.getElementById('masaJabatan').value = data.keputusan?.masaJabatan || '5 (lima)';
  document.getElementById('tglEfektif').value = data.keputusan?.tglEfektif || '';

  // Saksi
  document.getElementById('saksi1Sapaan').value = data.saksi1?.sapaan || 'Nona';
  document.getElementById('saksi1Nama').value = data.saksi1?.nama || '';
  document.getElementById('saksi1TempatLahir').value = data.saksi1?.tempatLahir || '';
  document.getElementById('saksi1TanggalLahir').value = data.saksi1?.tanggalLahir || '';
  document.getElementById('saksi1Nik').value = data.saksi1?.nik || '';
  document.getElementById('saksi1Alamat').value = data.saksi1?.alamat || '';

  document.getElementById('saksi2Sapaan').value = data.saksi2?.sapaan || 'Nona';
  document.getElementById('saksi2Nama').value = data.saksi2?.nama || '';
  document.getElementById('saksi2TempatLahir').value = data.saksi2?.tempatLahir || '';
  document.getElementById('saksi2TanggalLahir').value = data.saksi2?.tanggalLahir || '';
  document.getElementById('saksi2Nik').value = data.saksi2?.nik || '';
  document.getElementById('saksi2Alamat').value = data.saksi2?.alamat || '';

  // Data RUPS (Khusus PT RUPS Peningkatan Modal)
  const rupsTanggalEl = document.getElementById('rupsTanggal');
  if (rupsTanggalEl) rupsTanggalEl.value = data.rups?.tanggal || '';
  const rupsJamEl = document.getElementById('rupsJam');
  if (rupsJamEl) rupsJamEl.value = data.rups?.jam || '';
  const rupsPimpinanEl = document.getElementById('rupsPimpinan');
  if (rupsPimpinanEl) rupsPimpinanEl.value = data.rups?.pimpinan || '';
  const rupsTempatEl = document.getElementById('rupsTempat');
  if (rupsTempatEl) rupsTempatEl.value = data.rups?.tempat || '';
  const rupsSahamHadirEl = document.getElementById('rupsSahamHadir');
  if (rupsSahamHadirEl) rupsSahamHadirEl.value = data.rups?.sahamHadir || '';

  // Data Peningkatan Modal (Khusus PT Sirkuler Modal & RUPS Modal)
  const pm = data.peningkatanModal || {};
  const msNominalEl = document.getElementById('modalSemulaNominal');
  if (msNominalEl) msNominalEl.value = pm.modalSemulaNominal || '';
  const msSahamEl = document.getElementById('modalSemulaSaham');
  if (msSahamEl) msSahamEl.value = pm.modalSemulaSaham || '';
  const npsEl = document.getElementById('nominalPerSaham');
  if (npsEl) npsEl.value = pm.nominalPerSaham || 1000000;
  const mmNominalEl = document.getElementById('modalMenjadiNominal');
  if (mmNominalEl) mmNominalEl.value = pm.modalMenjadiNominal || '';
  const mmSahamEl = document.getElementById('modalMenjadiSaham');
  if (mmSahamEl) mmSahamEl.value = pm.modalMenjadiSaham || '';
  const ssdjEl = document.getElementById('sahamSimpananDikeluarkanJml');
  if (ssdjEl) ssdjEl.value = pm.sahamSimpananDikeluarkanJml || '';
  const ssdnEl = document.getElementById('sahamSimpananDikeluarkanNominal');
  if (ssdnEl) ssdnEl.value = pm.sahamSimpananDikeluarkanNominal || '';

  const pNamaEl = document.getElementById('pengambilNama');
  if (pNamaEl) pNamaEl.value = pm.pengambilNama || '';
  const pKedudukanEl = document.getElementById('pengambilKedudukan');
  if (pKedudukanEl) pKedudukanEl.value = pm.pengambilKedudukan || '';
  const pAktaPendirianEl = document.getElementById('pengambilAktaPendirian');
  if (pAktaPendirianEl) pAktaPendirianEl.value = pm.pengambilAktaPendirian || '';
  const pAktaPerubahanEl = document.getElementById('pengambilAktaPerubahan');
  if (pAktaPerubahanEl) pAktaPerubahanEl.value = pm.pengambilAktaPerubahan || '';

  const pelNamaEl = document.getElementById('pelepasanNama');
  if (pelNamaEl) pelNamaEl.value = pm.pelepasanNama || '';
  const pelKedudukanEl = document.getElementById('pelepasanKedudukan');
  if (pelKedudukanEl) pelKedudukanEl.value = pm.pelepasanKedudukan || '';
  const pelLegalitasEl = document.getElementById('pelepasanLegalitas');
  if (pelLegalitasEl) pelLegalitasEl.value = pm.pelepasanLegalitas || '';

  // Render pemegangSahamModal
  const psmContainer = document.getElementById('pemegangSahamModalContainer');
  if (psmContainer) {
    psmContainer.innerHTML = '';
    const psmList = pm.pemegangSahamModal || data.pemegangSahamModal || [];
    if (Array.isArray(psmList)) {
      psmList.forEach(psm => tambahBarisPemegangSahamModal(psm));
    }
  }

  // Render Dynamic Rows: Pemegang Saham (PT) vs Sekutu (CV/Firma/UD)
  const psContainer = document.getElementById('pemegangSahamContainer');
  if (psContainer) {
    psContainer.innerHTML = '';
    if (Array.isArray(data.pemegangSaham)) {
      data.pemegangSaham.forEach(ps => tambahBarisPemegangSaham(ps));
    }
  }

  const skContainer = document.getElementById('sekutuContainer');
  if (skContainer) {
    skContainer.innerHTML = '';
    if (Array.isArray(data.sekutu)) {
      data.sekutu.forEach(sk => tambahBarisSekutu(sk));
    }
  }

  const pgContainer = document.getElementById('pengurusContainer');
  if (pgContainer) {
    pgContainer.innerHTML = '';
    if (Array.isArray(data.pengurusBaru)) {
      data.pengurusBaru.forEach(pg => tambahBarisPengurus(pg));
    }
  }

  // Trigger Terbilang updates
  ['aktaNomor', 'aktaTanggal', 'aktaJam', 'ptAktaPendirianTgl', 'penghadapTanggalLahir', 'totalSahamSeriA', 'totalSahamSeriB', 'totalModalNominal', 'rupsTanggal', 'rupsSahamHadir', 'modalSemulaNominal', 'modalSemulaSaham', 'nominalPerSaham', 'modalMenjadiNominal', 'modalMenjadiSaham', 'sahamSimpananDikeluarkanJml', 'sahamSimpananDikeluarkanNominal'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.dispatchEvent(new Event('input'));
  });

  checkOverallConsistency();
  applyNotaryNameLock();
  renderAllSectionPreviews();
}

// Kumpulkan Data Form Menjadi JSON Object
function kumpulkanDataForm() {
  const pemegangSaham = [];
  document.querySelectorAll('#pemegangSahamContainer .dynamic-row-card').forEach(row => {
    pemegangSaham.push({
      nama: row.querySelector('.ps-nama')?.value || '',
      selaku: row.querySelector('.ps-selaku')?.value || '',
      sahamSeriA: parseInt(row.querySelector('.ps-saham-a')?.value, 10) || 0,
      sahamSeriB: parseInt(row.querySelector('.ps-saham-b')?.value, 10) || 0,
      tanggalTtd: row.querySelector('.ps-tgl')?.value || ''
    });
  });

  const pemegangSahamModal = [];
  document.querySelectorAll('#pemegangSahamModalContainer .dynamic-row-card').forEach(row => {
    pemegangSahamModal.push({
      nama: row.querySelector('.psm-nama')?.value || '',
      persentase: row.querySelector('.psm-persen')?.value || '',
      jumlahSaham: parseInt(row.querySelector('.psm-saham')?.value, 10) || 0,
      nominal: parseInt(row.querySelector('.psm-nominal')?.value, 10) || 0
    });
  });

  const sekutu = [];
  document.querySelectorAll('#sekutuContainer .dynamic-row-card').forEach(row => {
    sekutu.push({
      nama: row.querySelector('.sk-nama')?.value || '',
      statusSekutu: row.querySelector('.sk-status')?.value || '',
      nominalInbreng: parseInt(row.querySelector('.sk-nominal')?.value, 10) || 0,
      persentase: row.querySelector('.sk-persen')?.value || '0',
      tanggalTtd: row.querySelector('.sk-tgl')?.value || ''
    });
  });

  const pengurusBaru = [];
  document.querySelectorAll('#pengurusContainer .dynamic-row-card').forEach(row => {
    pengurusBaru.push({
      jabatan: row.querySelector('.pg-jabatan')?.value || '',
      sapaan: row.querySelector('.pg-sapaan')?.value || '',
      nama: row.querySelector('.pg-nama')?.value || '',
      tempatLahir: row.querySelector('.pg-tempat-lahir')?.value || '',
      tanggalLahir: row.querySelector('.pg-tgl-lahir')?.value || '',
      kewarganegaraan: 'Indonesia',
      pekerjaan: 'Karyawan Swasta',
      nik: row.querySelector('.pg-nik')?.value || '',
      alamat: row.querySelector('.pg-alamat')?.value || ''
    });
  });

  return {
    badanUsaha: {
      tipe: state.entityType,
      subTipe: state.entityType === 'PT' ? (state.ptSubType || 'SIRKULER_PENGURUS') : null
    },
    subTipe: state.entityType === 'PT' ? (state.ptSubType || 'SIRKULER_PENGURUS') : null,
    akta: {
      nomor: document.getElementById('aktaNomor')?.value || '',
      tanggal: document.getElementById('aktaTanggal')?.value || '',
      jam: document.getElementById('aktaJam')?.value || ''
    },
    notaris: {
      nama: (DEMO_CONFIG?.LOCK_NOTARY_NAME && DEMO_CONFIG?.LOCKED_NOTARY_NAME)
        ? DEMO_CONFIG.LOCKED_NOTARY_NAME.trim()
        : (document.getElementById('notarisNama')?.value || ''),
      wilayah: document.getElementById('notarisWilayah')?.value || '',
      gelarPanjang: document.getElementById('notarisGelarPanjang')?.value || 'Sarjana Hukum, Magister Kenotariatan',
      gelarSingkat: document.getElementById('notarisGelarSingkat')?.value || 'S.H., M.Kn.'
    },
    pt: {
      nama: document.getElementById('ptNama')?.value || '',
      kedudukan: document.getElementById('ptKedudukan')?.value || '',
      aktaPendirianNomor: document.getElementById('ptAktaPendirianNomor')?.value || '',
      aktaPendirianTgl: document.getElementById('ptAktaPendirianTgl')?.value || '',
      aktaPendirianNotaris: document.getElementById('ptAktaPendirianNotaris')?.value || '',
      aktaPendirianWilayah: document.getElementById('ptAktaPendirianWilayah')?.value || '',
      skPendirianNomor: document.getElementById('ptSkPendirianNomor')?.value || '',
      skPendirianTgl: document.getElementById('ptSkPendirianTgl')?.value || '',
      aktaPerubahanNomor: document.getElementById('ptAktaPerubahanNomor')?.value || '',
      aktaPerubahanTgl: document.getElementById('ptAktaPerubahanTgl')?.value || '',
      aktaPerubahanNotaris: document.getElementById('ptAktaPerubahanNotaris')?.value || '',
      aktaPerubahanWilayah: document.getElementById('ptAktaPerubahanWilayah')?.value || '',
      skPerubahanNomor: document.getElementById('ptSkPerubahanNomor')?.value || '',
      skPerubahanTgl: document.getElementById('ptSkPerubahanTgl')?.value || '',
      pemberitahuanPerubahanNomor: document.getElementById('ptPemberitahuanPerubahanNomor')?.value || '',
      pasalSirkuler: document.getElementById('ptPasalSirkuler')?.value || '10 ayat (5)'
    },
    penghadap: {
      sapaan: document.getElementById('penghadapSapaan')?.value || 'Tuan',
      nama: document.getElementById('penghadapNama')?.value || '',
      tempatLahir: document.getElementById('penghadapTempatLahir')?.value || '',
      tanggalLahir: document.getElementById('penghadapTanggalLahir')?.value || '',
      nik: document.getElementById('penghadapNik')?.value || '',
      pekerjaan: document.getElementById('penghadapPekerjaan')?.value || 'Karyawan Swasta',
      kewarganegaraan: document.getElementById('penghadapWn')?.value || 'Indonesia',
      jabatan: document.getElementById('penghadapJabatan')?.value || '',
      alamat: document.getElementById('penghadapAlamat')?.value || ''
    },
    rups: {
      tanggal: document.getElementById('rupsTanggal')?.value || '',
      jam: document.getElementById('rupsJam')?.value || '',
      tempat: document.getElementById('rupsTempat')?.value || '',
      pimpinan: document.getElementById('rupsPimpinan')?.value || '',
      sahamHadir: parseInt(document.getElementById('rupsSahamHadir')?.value, 10) || 0
    },
    peningkatanModal: {
      modalSemulaNominal: parseInt(document.getElementById('modalSemulaNominal')?.value, 10) || 0,
      modalSemulaSaham: parseInt(document.getElementById('modalSemulaSaham')?.value, 10) || 0,
      nominalPerSaham: parseInt(document.getElementById('nominalPerSaham')?.value, 10) || 1000000,
      modalMenjadiNominal: parseInt(document.getElementById('modalMenjadiNominal')?.value, 10) || 0,
      modalMenjadiSaham: parseInt(document.getElementById('modalMenjadiSaham')?.value, 10) || 0,
      sahamSimpananDikeluarkanJml: parseInt(document.getElementById('sahamSimpananDikeluarkanJml')?.value, 10) || 0,
      sahamSimpananDikeluarkanNominal: parseInt(document.getElementById('sahamSimpananDikeluarkanNominal')?.value, 10) || 0,
      pengambilNama: document.getElementById('pengambilNama')?.value || '',
      pengambilKedudukan: document.getElementById('pengambilKedudukan')?.value || '',
      pengambilAktaPendirian: document.getElementById('pengambilAktaPendirian')?.value || '',
      pengambilAktaPerubahan: document.getElementById('pengambilAktaPerubahan')?.value || '',
      pelepasanNama: document.getElementById('pelepasanNama')?.value || '',
      pelepasanKedudukan: document.getElementById('pelepasanKedudukan')?.value || '',
      pelepasanLegalitas: document.getElementById('pelepasanLegalitas')?.value || '',
      pemegangSahamModal
    },
    saham: {
      totalSeriA: parseInt(document.getElementById('totalSahamSeriA')?.value, 10) || 0,
      totalSeriB: parseInt(document.getElementById('totalSahamSeriB')?.value, 10) || 0
    },
    modal: {
      totalNominal: parseInt(document.getElementById('totalModalNominal')?.value, 10) || 0
    },
    keputusan: {
      masaJabatan: document.getElementById('masaJabatan')?.value || '5 (lima)',
      tglEfektif: document.getElementById('tglEfektif')?.value || ''
    },
    pemegangSaham,
    sekutu,
    pengurusBaru,
    saksi1: {
      sapaan: document.getElementById('saksi1Sapaan')?.value || 'Nona',
      nama: document.getElementById('saksi1Nama')?.value || '',
      tempatLahir: document.getElementById('saksi1TempatLahir')?.value || '',
      tanggalLahir: document.getElementById('saksi1TanggalLahir')?.value || '',
      nik: document.getElementById('saksi1Nik')?.value || '',
      pekerjaan: 'Karyawan Swasta',
      alamat: document.getElementById('saksi1Alamat')?.value || ''
    },
    saksi2: {
      sapaan: document.getElementById('saksi2Sapaan')?.value || 'Nona',
      nama: document.getElementById('saksi2Nama')?.value || '',
      tempatLahir: document.getElementById('saksi2TempatLahir')?.value || '',
      tanggalLahir: document.getElementById('saksi2TanggalLahir')?.value || '',
      nik: document.getElementById('saksi2Nik')?.value || '',
      pekerjaan: 'Karyawan Swasta',
      alamat: document.getElementById('saksi2Alamat')?.value || ''
    },
    customTemplates: { ...(state.customTemplates || {}) },
    layout: {
      spacing: 2.0
    }
  };
}

const SECTION_SHORT_NAMES = {
  1: 'Kepala Akta',
  2: 'Riwayat & Legalitas',
  3: 'Data Penghadap',
  4: 'Modal & Keputusan',
  5: 'Pengurus / Pasal 4',
  6: 'Penutup & Saksi'
};

const FIELD_HIGHLIGHT_MAP = {
  aktaNomor: { key: 'aktaNomor', label: 'Nomor Akta', terms: d => [d.akta?.nomor] },
  aktaTanggal: { key: 'aktaTanggal', label: 'Tanggal Akta', terms: d => [formatTanggalAkta(d.akta?.tanggal), formatTanggalBiasa(d.akta?.tanggal)] },
  aktaJam: { key: 'aktaJam', label: 'Jam Penghadapan', terms: d => [formatJamAkta(d.akta?.jam)] },
  notarisNama: {
    key: 'notarisNama',
    label: 'Nama Notaris',
    terms: d => {
      const raw = (d.notaris?.nama || '').trim();
      const clean = raw.includes(',') ? raw.split(',')[0].trim() : raw;
      return [clean.toUpperCase(), raw];
    }
  },
  notarisWilayah: {
    key: 'notarisWilayah',
    label: 'Wilayah Notaris',
    terms: d => {
      const w = (d.notaris?.wilayah || '').trim();
      return [w, w.toUpperCase(), w.replace(/Kabupaten|Kota/i, '').trim()];
    }
  },
  notarisGelarPanjang: { key: 'notarisGelarPanjang', label: 'Gelar Panjang Notaris', terms: d => [d.notaris?.gelarPanjang] },
  notarisGelarSingkat: { key: 'notarisGelarSingkat', label: 'Gelar Singkat Notaris', terms: d => [d.notaris?.gelarSingkat] },
  ptNama: { key: 'ptNama', label: 'Nama Perusahaan', terms: d => [d.pt?.nama, (d.pt?.nama || '').toUpperCase()] },
  ptKedudukan: { key: 'ptKedudukan', label: 'Kedudukan Perusahaan', terms: d => [d.pt?.kedudukan, (d.pt?.kedudukan || '').toUpperCase()] },
  ptAktaPendirianNomor: { key: 'ptAktaPendirianNomor', label: 'No. Akta Pendirian', terms: d => [d.pt?.aktaPendirianNomor] },
  ptAktaPendirianTgl: { key: 'ptAktaPendirianTgl', label: 'Tgl. Akta Pendirian', terms: d => [formatTanggalTanpaAwalan(d.pt?.aktaPendirianTgl)] },
  ptAktaPendirianNotaris: { key: 'ptAktaPendirianNotaris', label: 'Notaris Pendirian', terms: d => [d.pt?.aktaPendirianNotaris] },
  ptAktaPendirianWilayah: { key: 'ptAktaPendirianWilayah', label: 'Wilayah Notaris Pendirian', terms: d => [d.pt?.aktaPendirianWilayah] },
  ptSkPendirianNomor: { key: 'ptSkPendirianNomor', label: 'No. SK Pendirian', terms: d => [d.pt?.skPendirianNomor] },
  ptSkPendirianTgl: { key: 'ptSkPendirianTgl', label: 'Tgl. SK Pendirian', terms: d => [formatTanggalTanpaAwalan(d.pt?.skPendirianTgl)] },
  ptAktaPerubahanNomor: { key: 'ptAktaPerubahanNomor', label: 'No. Akta Perubahan', terms: d => [d.pt?.aktaPerubahanNomor] },
  ptAktaPerubahanTgl: { key: 'ptAktaPerubahanTgl', label: 'Tgl. Akta Perubahan', terms: d => [formatTanggalTanpaAwalan(d.pt?.aktaPerubahanTgl)] },
  ptAktaPerubahanNotaris: { key: 'ptAktaPerubahanNotaris', label: 'Notaris Perubahan', terms: d => [d.pt?.aktaPerubahanNotaris] },
  ptAktaPerubahanWilayah: { key: 'ptAktaPerubahanWilayah', label: 'Wilayah Notaris Perubahan', terms: d => [d.pt?.aktaPerubahanWilayah] },
  ptSkPerubahanNomor: { key: 'ptSkPerubahanNomor', label: 'No. SK Perubahan', terms: d => [d.pt?.skPerubahanNomor] },
  ptSkPerubahanTgl: { key: 'ptSkPerubahanTgl', label: 'Tgl. SK Perubahan', terms: d => [formatTanggalTanpaAwalan(d.pt?.skPerubahanTgl)] },
  ptPemberitahuanPerubahanNomor: { key: 'ptPemberitahuanPerubahanNomor', label: 'No. Penerimaan AHU', terms: d => [d.pt?.pemberitahuanPerubahanNomor] },
  ptPasalSirkuler: { key: 'ptPasalSirkuler', label: 'Pasal Sirkuler AD', terms: d => [d.pt?.pasalSirkuler] },
  penghadapSapaan: { key: 'penghadapSapaan', label: 'Sapaan Penghadap', terms: d => [d.penghadap?.sapaan] },
  penghadapNama: { key: 'penghadapNama', label: 'Nama Penghadap', terms: d => [d.penghadap?.nama] },
  penghadapTempatLahir: { key: 'penghadapTempatLahir', label: 'Tempat Lahir Penghadap', terms: d => [d.penghadap?.tempatLahir] },
  penghadapTanggalLahir: { key: 'penghadapTanggalLahir', label: 'Tgl. Lahir Penghadap', terms: d => [formatTanggalBiasa(d.penghadap?.tanggalLahir)] },
  penghadapNik: { key: 'penghadapNik', label: 'NIK Penghadap', terms: d => [d.penghadap?.nik] },
  penghadapPekerjaan: { key: 'penghadapPekerjaan', label: 'Pekerjaan Penghadap', terms: d => [d.penghadap?.pekerjaan] },
  penghadapWn: { key: 'penghadapWn', label: 'Kewarganegaraan Penghadap', terms: d => [d.penghadap?.kewarganegaraan] },
  penghadapJabatan: { key: 'penghadapJabatan', label: 'Jabatan Penghadap', terms: d => [d.penghadap?.jabatan] },
  penghadapAlamat: { key: 'penghadapAlamat', label: 'Alamat Penghadap', terms: d => [d.penghadap?.alamat] },
  totalSahamSeriA: { key: 'totalSahamSeriA', label: 'Total Saham Seri-A', terms: d => [d.saham?.totalSeriA ? formatSaham(d.saham.totalSeriA) : ''] },
  totalSahamSeriB: { key: 'totalSahamSeriB', label: 'Total Saham Seri-B', terms: d => [d.saham?.totalSeriB ? formatSaham(d.saham.totalSeriB) : ''] },
  totalModalNominal: { key: 'totalModalNominal', label: 'Total Modal Inbreng', terms: d => [d.modal?.totalNominal ? formatRupiah(d.modal.totalNominal) : ''] },
  rupsTanggal: { key: 'rupsTanggal', label: 'Tanggal RUPS', terms: d => [formatTanggalAkta(d.rups?.tanggal), formatTanggalBiasa(d.rups?.tanggal)] },
  rupsJam: { key: 'rupsJam', label: 'Jam RUPS', terms: d => [d.rups?.jam] },
  rupsPimpinan: { key: 'rupsPimpinan', label: 'Pimpinan Rapat', terms: d => [d.rups?.pimpinan, d.penghadap?.nama] },
  rupsTempat: { key: 'rupsTempat', label: 'Tempat RUPS', terms: d => [d.rups?.tempat] },
  rupsSahamHadir: { key: 'rupsSahamHadir', label: 'Kuorum RUPS', terms: d => [d.rups?.sahamHadir ? formatSaham(d.rups.sahamHadir) : ''] },
  modalSemulaNominal: { key: 'modalSemulaNominal', label: 'Modal Semula (Rp)', terms: d => [d.peningkatanModal?.modalSemulaNominal ? formatRupiah(d.peningkatanModal.modalSemulaNominal) : ''] },
  modalSemulaSaham: { key: 'modalSemulaSaham', label: 'Saham Semula', terms: d => [d.peningkatanModal?.modalSemulaSaham ? formatSaham(d.peningkatanModal.modalSemulaSaham) : ''] },
  nominalPerSaham: { key: 'nominalPerSaham', label: 'Nominal per Saham', terms: d => [d.peningkatanModal?.nominalPerSaham ? formatRupiah(d.peningkatanModal.nominalPerSaham) : ''] },
  modalMenjadiNominal: { key: 'modalMenjadiNominal', label: 'Modal Menjadi (Rp)', terms: d => [d.peningkatanModal?.modalMenjadiNominal ? formatRupiah(d.peningkatanModal.modalMenjadiNominal) : ''] },
  modalMenjadiSaham: { key: 'modalMenjadiSaham', label: 'Saham Menjadi', terms: d => [d.peningkatanModal?.modalMenjadiSaham ? formatSaham(d.peningkatanModal.modalMenjadiSaham) : ''] },
  sahamSimpananDikeluarkanJml: { key: 'sahamSimpananDikeluarkanJml', label: 'Saham Keluar (Jml)', terms: d => [d.peningkatanModal?.sahamSimpananDikeluarkanJml ? formatSaham(d.peningkatanModal.sahamSimpananDikeluarkanJml) : ''] },
  sahamSimpananDikeluarkanNominal: { key: 'sahamSimpananDikeluarkanNominal', label: 'Saham Keluar (Rp)', terms: d => [d.peningkatanModal?.sahamSimpananDikeluarkanNominal ? formatRupiah(d.peningkatanModal.sahamSimpananDikeluarkanNominal) : ''] },
  pengambilNama: { key: 'pengambilNama', label: 'Pengambil Saham', terms: d => [d.peningkatanModal?.pengambilNama] },
  pengambilKedudukan: { key: 'pengambilKedudukan', label: 'Kedudukan Pengambil', terms: d => [d.peningkatanModal?.pengambilKedudukan] },
  pengambilAktaPendirian: { key: 'pengambilAktaPendirian', label: 'Akta Pendirian Pengambil', terms: d => [d.peningkatanModal?.pengambilAktaPendirian] },
  pengambilAktaPerubahan: { key: 'pengambilAktaPerubahan', label: 'Akta Perubahan Pengambil', terms: d => [d.peningkatanModal?.pengambilAktaPerubahan] },
  pelepasanNama: { key: 'pelepasanNama', label: 'Pihak Pelepas Hak', terms: d => [d.peningkatanModal?.pelepasanNama] },
  pelepasanKedudukan: { key: 'pelepasanKedudukan', label: 'Kedudukan Pelepas', terms: d => [d.peningkatanModal?.pelepasanKedudukan] },
  pelepasanLegalitas: { key: 'pelepasanLegalitas', label: 'Legalitas Pelepas Hak', terms: d => [d.peningkatanModal?.pelepasanLegalitas] },
  masaJabatan: { key: 'masaJabatan', label: 'Masa Jabatan Pengurus', terms: d => [d.keputusan?.masaJabatan] },
  tglEfektif: { key: 'tglEfektif', label: 'Tanggal Efektif', terms: d => [formatTanggalBiasa(d.keputusan?.tglEfektif)] }
};

function resolveFocusedFieldMeta(el) {
  if (!el) return null;
  const id = el.id || '';
  if (FIELD_HIGHLIGHT_MAP[id]) return FIELD_HIGHLIGHT_MAP[id];
  if (id.startsWith('saksi1')) {
    return {
      key: 'saksi1',
      label: 'Data Saksi 1',
      terms: d => [d.saksi1?.nama, d.saksi1?.tempatLahir, d.saksi1?.nik, d.saksi1?.alamat]
    };
  }
  if (id.startsWith('saksi2')) {
    return {
      key: 'saksi2',
      label: 'Data Saksi 2',
      terms: d => [d.saksi2?.nama, d.saksi2?.tempatLahir, d.saksi2?.nik, d.saksi2?.alamat]
    };
  }
  if (el.closest('#pemegangSahamContainer')) {
    return {
      key: 'pemegangSaham',
      label: 'Pemegang Saham TTD',
      terms: d => (d.pemegangSaham || []).map(ps => ps.nama).filter(Boolean)
    };
  }
  if (el.closest('#pemegangSahamModalContainer')) {
    return {
      key: 'pemegangSahamModal',
      label: 'Susunan Saham Pasal 4',
      terms: d => (d.peningkatanModal?.pemegangSahamModal || []).map(ps => ps.nama).filter(Boolean)
    };
  }
  if (el.closest('#sekutuContainer')) {
    return {
      key: 'sekutu',
      label: 'Daftar Pesero / Sekutu',
      terms: d => (d.sekutu || []).map(sk => sk.nama).filter(Boolean)
    };
  }
  if (el.closest('#pengurusContainer')) {
    return {
      key: 'pengurusBaru',
      label: 'Susunan Pengurus Baru',
      terms: d => (d.pengurusBaru || []).map(pg => pg.nama).filter(Boolean)
    };
  }
  return null;
}

function getActiveFieldSearchTerms(d) {
  if (!state.activeFieldKey) return [];
  const meta = FIELD_HIGHLIGHT_MAP[state.activeFieldKey] || resolveFocusedFieldMeta(document.activeElement);
  if (!meta || typeof meta.terms !== 'function') return [];
  const rawTerms = meta.terms(d) || [];
  const unique = new Set();
  rawTerms.forEach(t => {
    const clean = (t !== undefined && t !== null) ? String(t).trim() : '';
    if (clean.length >= 2) unique.add(clean);
  });
  return Array.from(unique).sort((a, b) => b.length - a.length);
}

/**
 * Mengonversi teks baris polos menjadi HTML yang aman disertai sorotan slot kosong ('....')
 * dan sorotan kata dari field input aktif (<mark class="preview-field-mark">) tanpa pernah
 * merusak tag HTML.
 */
function buildHighlightedLineHtml(rawText, searchTerms = []) {
  if (!rawText) return '&nbsp;';
  const ranges = [];

  // 1. Cari slot bertitik (3 titik atau lebih)
  const dotRegex = /\.{3,}/g;
  let m;
  while ((m = dotRegex.exec(rawText)) !== null) {
    ranges.push({ start: m.index, end: m.index + m[0].length, kind: 'empty' });
  }

  // 2. Cari istilah dari input yang sedang aktif (case-insensitive)
  if (Array.isArray(searchTerms) && searchTerms.length > 0) {
    const lowerText = rawText.toLowerCase();
    for (const term of searchTerms) {
      const lowerTerm = term.toLowerCase();
      if (!lowerTerm) continue;
      let fromIdx = 0;
      while (true) {
        const hitIdx = lowerText.indexOf(lowerTerm, fromIdx);
        if (hitIdx === -1) break;
        const hitEnd = hitIdx + lowerTerm.length;
        const overlaps = ranges.some(r => !(hitEnd <= r.start || hitIdx >= r.end));
        if (!overlaps) {
          ranges.push({ start: hitIdx, end: hitEnd, kind: 'mark' });
        }
        fromIdx = hitEnd;
      }
    }
  }

  ranges.sort((a, b) => a.start - b.start);

  let html = '';
  let cursor = 0;
  for (const r of ranges) {
    if (r.start < cursor) continue;
    if (r.start > cursor) {
      html += escapeHtml(rawText.slice(cursor, r.start));
    }
    const seg = escapeHtml(rawText.slice(r.start, r.end));
    if (r.kind === 'mark') {
      html += `<mark class="preview-field-mark">${seg}</mark>`;
    } else {
      html += `<span class="preview-empty-slot">${seg}</span>`;
    }
    cursor = r.end;
  }
  if (cursor < rawText.length) {
    html += escapeHtml(rawText.slice(cursor));
  }
  return html || '&nbsp;';
}

function applyPreviewZoom() {
  const scrollEl = document.getElementById('previewPaneScroll');
  const zoomStage = document.querySelector('#livePreviewContainer .preview-zoom-stage');
  if (!scrollEl || !zoomStage) return;

  let zoomVal = 1;
  if (state.previewZoomMode === 'fit') {
    const availW = Math.max(340, scrollEl.clientWidth - 36);
    zoomVal = Math.min(1, Math.max(0.45, Number((availW / 810).toFixed(3))));
  } else {
    zoomVal = parseFloat(state.previewZoomMode) || 1;
  }
  zoomStage.style.zoom = String(zoomVal);
}

function updateLocationBarUi(occurrences = [], isInternal = false) {
  const bar = document.getElementById('previewLocationBar');
  if (!bar) return;

  if (!state.activeFieldKey) {
    const quickSecBtns = isInternal
      ? '<span class="location-hint-muted">Pratinjau Dokumen Internal Tabel aktif. Klik kolom formulir di kiri untuk menyorot nilainya.</span>'
      : `<span class="location-meta-label">Lompat Bagian:</span>` +
        DEED_SECTION_ORDER.map(secNum => `
          <button type="button" class="location-jump-pill" data-jump-section="${secNum}" title="Menuju bagian ${SECTION_NAMES[secNum]}">
            ${escapeHtml(SECTION_SHORT_NAMES[secNum])}
          </button>
        `).join('');
    bar.innerHTML = quickSecBtns;
    return;
  }

  const fieldLabel = escapeHtml(state.activeFieldLabel || state.activeFieldKey);
  if (occurrences.length === 0) {
    bar.innerHTML = `
      <span class="location-field-badge">📍 ${fieldLabel}</span>
      <span class="location-hint-muted">Belum muncul pada jenis akta / templat aktif saat ini.</span>
    `;
    return;
  }

  const pillsHtml = occurrences.map(occ => {
    const secLabel = SECTION_SHORT_NAMES[occ.sectionNum] || `Bagian ${occ.sectionNum}`;
    const pageSuffix = occ.pageNumber ? ` &bull; Hal. ${occ.pageNumber}` : '';
    return `
      <button type="button" class="location-jump-pill" data-scroll-id="${escapeHtml(occ.elId)}" title="Lompat ke ${escapeHtml(secLabel)}${occ.pageNumber ? ' Halaman ' + occ.pageNumber : ''}">
        ${escapeHtml(secLabel)}${pageSuffix}
      </button>
    `;
  }).join('');

  bar.innerHTML = `
    <span class="location-field-badge">📍 ${fieldLabel}</span>
    <span class="location-meta-label">Terpakai di ${occurrences.length} lokasi:</span>
    ${pillsHtml}
  `;
}

function scrollToPreviewTarget(targetEl) {
  if (!targetEl) return;
  targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
  targetEl.classList.remove('preview-line-flash');
  void targetEl.offsetWidth;
  targetEl.classList.add('preview-line-flash');
  setTimeout(() => targetEl.classList.remove('preview-line-flash'), 1500);
}

// Render Live Preview Akta Utuh & Multi-Lokasi di Panel Kanan Split-Screen
function renderLivePreview({ scrollToFirstMatch = false } = {}) {
  const d = kumpulkanDataForm();
  const container = document.getElementById('livePreviewContainer');
  const scrollEl = document.getElementById('previewPaneScroll');
  const pageBadge = document.getElementById('previewPageCountBadge');
  if (!container) return;

  const prevScrollTop = scrollEl ? scrollEl.scrollTop : 0;
  const activeKey = state.activeFieldKey;
  const searchTerms = getActiveFieldSearchTerms(d);

  // Mode 2: Preview Dokumen Internal Tabel (Bookman Old Style / Georgia)
  const isModalOrRups = state.entityType === 'PT' && (state.ptSubType === 'SIRKULER_MODAL' || state.ptSubType === 'RUPS_MODAL');
  if (state.previewMode === 'internal' && isModalOrRups) {
    const m = buildInternalDocModel(d);
    const occurrences = [];
    let firstMatchElId = null;
    let paraCounter = 0;

    const renderInternalPara = (text, opts = {}) => {
      const pid = `internal-para-${paraCounter++}`;
      const fKeys = Array.isArray(opts.fieldKeys) ? opts.fieldKeys : [];
      const isMatch = Boolean(activeKey && fKeys.includes(activeKey));
      if (isMatch) {
        occurrences.push({ sectionNum: opts.sectionNum || 4, pageNumber: null, elId: pid });
        if (!firstMatchElId) firstMatchElId = pid;
      }
      const cls = `internal-doc-para ${isMatch ? 'preview-line-active-field' : ''}`;
      let style = '';
      if (opts.align === 'center') style += 'text-align: center; ';
      if (opts.bold) style += 'font-weight: 700; ';
      if (opts.underline) style += 'text-decoration: underline; ';
      if (opts.size) style += `font-size: ${(opts.size / 2).toFixed(1)}pt; `;
      const inner = buildHighlightedLineHtml(text, isMatch ? searchTerms : []);
      return `<p id="${pid}" class="${cls}" style="${style}">${inner}</p>`;
    };

    const titlesHtml = m.titleLines.map(t => renderInternalPara(t.text, { align: 'center', bold: true, size: t.size, fieldKeys: t.fieldKeys, sectionNum: 1 })).join('');
    const introsHtml = m.introParagraphs.map(p => renderInternalPara(p.text, { bold: p.bold, fieldKeys: p.fieldKeys, sectionNum: 4 })).join('');

    const bankRowsHtml = m.bankTableRows.map(r => `
      <tr>
        <td style="text-align: center;">${escapeHtml(r.no)}</td>
        <td style="text-align: right;">${escapeHtml(r.nominal)}</td>
        <td style="text-align: center;">${escapeHtml(r.tgl)}</td>
        <td style="text-align: center;">${escapeHtml(r.bank)}</td>
        <td style="text-align: center;">${escapeHtml(r.ref)}</td>
      </tr>
    `).join('');

    const isShareMatch = activeKey === 'pemegangSahamModal' || activeKey === 'modalMenjadiNominal' || activeKey === 'modalMenjadiSaham';
    const shareTableId = 'internal-share-table';
    if (isShareMatch) {
      occurrences.push({ sectionNum: 5, pageNumber: null, elId: shareTableId });
      if (!firstMatchElId) firstMatchElId = shareTableId;
    }

    const shareRowsHtml = m.pmList.map((ps, idx) => `
      <tr>
        <td style="text-align: center;">${idx + 1}.</td>
        <td>${escapeHtml(ps.nama)}</td>
        <td style="text-align: right;">${escapeHtml(formatSaham(ps.jumlahSaham))}</td>
        <td style="text-align: right;">${escapeHtml(formatRupiah(ps.nominal))}</td>
      </tr>
    `).join('');

    const ttdSignHtml = (m.isRups ? renderInternalPara(m.pimpinanText, { bold: true, underline: true, fieldKeys: ['penghadapNama', 'penghadapSapaan'], sectionNum: 5 }) + renderInternalPara('Pimpinan Rapat', { sectionNum: 5 }) : '') +
      m.ttdSignatories.map(ps =>
        renderInternalPara(`( ${ps.nama} )`, { bold: true, underline: true, fieldKeys: ['pemegangSaham', 'pemegangSahamModal'], sectionNum: 5 }) +
        renderInternalPara(ps.selaku || 'Pemegang Saham', { fieldKeys: ['pemegangSaham', 'pemegangSahamModal'], sectionNum: 5 })
      ).join('');

    if (pageBadge) pageBadge.textContent = m.isRups ? 'Georgia • Tabel' : 'Bookman • Tabel';
    updateLocationBarUi(occurrences, true);

    container.innerHTML = `
      <div class="preview-zoom-stage">
        <div class="internal-doc-paper" style="font-family: '${m.fontName}', Georgia, serif;">
          ${titlesHtml}
          <div style="height: 12px;"></div>
          ${introsHtml}
          <table class="internal-doc-table">
            <thead>
              <tr><th>No.</th><th>Jumlah Setoran</th><th>Tanggal Setoran</th><th>Nama Bank</th><th>Nomor Bukti Setor</th></tr>
            </thead>
            <tbody>${bankRowsHtml}</tbody>
          </table>
          <p style="font-weight: 700; margin: 14px 0 6px;">Susunan Kepemilikan Saham Perseroan Setelah Peningkatan Modal:</p>
          <table id="${shareTableId}" class="internal-doc-table ${isShareMatch ? 'preview-line-active-field' : ''}">
            <thead>
              <tr><th>No.</th><th>Nama Pemegang Saham</th><th>Jumlah Saham (Lembar)</th><th>Nilai Nominal (Rp)</th></tr>
            </thead>
            <tbody>
              ${shareRowsHtml}
              <tr style="font-weight: 700; background-color: #f8fafc;">
                <td colspan="2" style="text-align: center;">TOTAL KESELURUHAN</td>
                <td style="text-align: right;">${escapeHtml(formatSaham(m.totalSahamSemua))}</td>
                <td style="text-align: right;">${escapeHtml(formatRupiah(m.totalNominalSemua))}</td>
              </tr>
            </tbody>
          </table>
          ${renderInternalPara('Demikian dokumen ini disahkan dan ditandatangani oleh Para Pemegang Saham sebagai bentuk persetujuan.', { sectionNum: 5 })}
          ${renderInternalPara(`${m.ttdKota}, ${m.ttdTgl}`, { fieldKeys: ['notarisWilayah', 'aktaTanggal', 'rupsTanggal'], sectionNum: 5 })}
          ${renderInternalPara('Para Pemegang Saham Perseroan:', { bold: true, sectionNum: 5 })}
          <div style="height: 22px;"></div>
          ${ttdSignHtml}
        </div>
      </div>
    `;

    applyPreviewZoom();
    if (scrollToFirstMatch && firstMatchElId) {
      scrollToPreviewTarget(document.getElementById(firstMatchElId));
    } else if (scrollEl) {
      scrollEl.scrollTop = prevScrollTop;
    }
    return;
  }

  // Mode 1: Salinan Akta Notaris Multi-Halaman A4 (Standar UUJN)
  const spacingVal = d.layout?.spacing || 2.0;
  const pages = generateNotaryPages(d, 53, 30, { isPreview: true });
  const totalPages = pages.length;

  if (pageBadge) pageBadge.textContent = `${totalPages} Hal. A4`;

  if (totalPages === 0) {
    container.innerHTML = '<div style="text-align: center; color: var(--ink-muted-48); padding: 40px;">Belum ada data akta untuk ditampilkan.</div>';
    updateLocationBarUi([], false);
    return;
  }

  const occurrences = [];
  const seenOccurrenceKeys = new Set();
  let firstMatchElId = null;
  let globalLineIdx = 0;

  const pageSheetsHtml = pages.map(page => {
    const pageLinesHtml = page.lines.map(line => {
      const lineId = `preview-line-${globalLineIdx++}`;
      const secNum = line.sectionNum || 1;
      const fKeys = Array.isArray(line.fieldKeys) ? line.fieldKeys : [];
      const isMatch = Boolean(activeKey && fKeys.includes(activeKey));

      if (isMatch) {
        if (!firstMatchElId) firstMatchElId = lineId;
        const dedupKey = `${secNum}-${page.pageNumber}`;
        if (!seenOccurrenceKeys.has(dedupKey)) {
          seenOccurrenceKeys.add(dedupKey);
          occurrences.push({ sectionNum: secNum, pageNumber: page.pageNumber, elId: lineId });
        }
      }

      let style = '';
      if (line.align === 'center') style += 'text-align: center; ';
      if (line.bold) style += 'font-weight: bold; ';
      if (line.underline) style += 'text-decoration: underline; ';
      if (line.isSignatureSpace) style += 'height: 48px; ';

      const isCustomSec = Boolean(state.customTemplates && state.customTemplates[`section${secNum}`]);
      const renvoiHtml = line.isSectionStart
        ? `
          <div class="renvoi-section-control" data-section-anchor="${secNum}">
            <span class="renvoi-section-badge ${isCustomSec ? 'is-custom' : ''}" title="${escapeHtml(SECTION_NAMES[secNum] || '')}">
              §${secNum} ${escapeHtml(SECTION_SHORT_NAMES[secNum] || `Bagian ${secNum}`)}${isCustomSec ? ' • Khusus' : ''}
            </span>
            <div class="renvoi-section-actions">
              <button type="button" class="renvoi-btn-edit" data-edit-section="${secNum}" title="Edit kalimat/redaksional bagian ini">✏️ Edit Redaksi</button>
              ${isCustomSec ? `<button type="button" class="renvoi-btn-reset" data-reset-section="${secNum}" title="Kembalikan bagian ini ke standar UUJN">↺</button>` : ''}
            </div>
          </div>
        `
        : '';

      const highlightedInner = buildHighlightedLineHtml(line.text || '', isMatch ? searchTerms : []);
      const lineClasses = `notary-line ${isMatch ? 'preview-line-active-field' : ''}`;

      return `<div id="${lineId}" class="${lineClasses}" style="${style}">${renvoiHtml}${highlightedInner}</div>`;
    }).join('\n');

    return `
      <div class="notary-page-wrapper" id="sheet-page-${page.pageNumber}">
        <div class="notary-page-sheet-label">
          <span class="sheet-indicator">📄 ${page.headerMark.toUpperCase()} &bull; LEMBAR ${page.pageNumber} DARI ${totalPages}</span>
          <span class="line-counter">${page.lines.length + 1} / 30 Baris</span>
        </div>
        <div class="notary-paper" style="line-height: ${spacingVal};">
          <div class="notary-page-header-mark"><u>${page.headerMark}</u></div>
          ${pageLinesHtml}
        </div>
      </div>
    `;
  }).join('\n');

  updateLocationBarUi(occurrences, false);

  container.innerHTML = `
    <div class="preview-zoom-stage">
      ${pageSheetsHtml}
    </div>
  `;

  applyPreviewZoom();

  if (scrollToFirstMatch && firstMatchElId && scrollEl) {
    const firstEl = document.getElementById(firstMatchElId);
    if (firstEl) {
      const containerRect = scrollEl.getBoundingClientRect();
      const elRect = firstEl.getBoundingClientRect();
      const isVisible = elRect.top >= containerRect.top + 10 && elRect.bottom <= containerRect.bottom - 10;
      if (!isVisible) {
        firstEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  } else if (scrollEl) {
    scrollEl.scrollTop = prevScrollTop;
  }
}

export function renderSectionPreview() {
  renderLivePreview();
}

export function renderAllSectionPreviews() {
  renderLivePreview();
}

/**
 * Setup kontrol toolbar panel kanan: mode Salinan vs Internal, Zoom Fit/85%/100%,
 * tombol perbesar, dropdown Edit Redaksional, dan delegasi klik Lompat Lokasi.
 */
function setupSplitPreviewControls() {
  const modeSwitcher = document.getElementById('previewDocModeSwitcher');
  if (modeSwitcher) {
    modeSwitcher.querySelectorAll('.preview-mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.mode;
        if (!mode || mode === state.previewMode) return;
        state.previewMode = mode;
        modeSwitcher.querySelectorAll('.preview-mode-btn').forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
        renderLivePreview();
      });
    });
  }

  const zoomGroup = document.getElementById('previewZoomControls');
  if (zoomGroup) {
    zoomGroup.querySelectorAll('.preview-zoom-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const z = btn.dataset.zoom || 'fit';
        state.previewZoomMode = z;
        zoomGroup.querySelectorAll('.preview-zoom-btn').forEach(b => b.classList.toggle('active', b.dataset.zoom === z));
        applyPreviewZoom();
      });
    });
  }

  const btnExpand = document.getElementById('btnToggleExpandPreview');
  const viewEditor = document.getElementById('view-editor');
  if (btnExpand && viewEditor) {
    btnExpand.addEventListener('click', () => {
      state.isPreviewExpanded = !state.isPreviewExpanded;
      viewEditor.classList.toggle('preview-expanded', state.isPreviewExpanded);
      btnExpand.textContent = state.isPreviewExpanded ? '⤡' : '⤢';
      btnExpand.title = state.isPreviewExpanded ? 'Pulihkan tampilan Split-Screen (Form + Preview)' : 'Perbesar Preview Akta ke layar penuh';
      requestAnimationFrame(() => applyPreviewZoom());
    });
  }

  // Bar Lompat Lokasi & Bagian (Delegasi Klik)
  const locationBar = document.getElementById('previewLocationBar');
  if (locationBar) {
    locationBar.addEventListener('click', (e) => {
      const pill = e.target.closest('.location-jump-pill');
      if (!pill) return;
      const scrollId = pill.getAttribute('data-scroll-id');
      const jumpSec = pill.getAttribute('data-jump-section');
      if (scrollId) {
        scrollToPreviewTarget(document.getElementById(scrollId));
      } else if (jumpSec) {
        const anchor = document.querySelector(`.renvoi-section-control[data-section-anchor="${jumpSec}"]`);
        scrollToPreviewTarget(anchor ? anchor.closest('.notary-line') : null);
      }
    });
  }

  // Dropdown Edit Redaksional
  const dropdownWrapper = document.getElementById('clauseDropdownWrapper');
  const btnToggleMenu = document.getElementById('btnToggleClauseMenu');
  const dropdownMenu = document.getElementById('clauseDropdownMenu');
  if (btnToggleMenu && dropdownMenu) {
    btnToggleMenu.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = dropdownMenu.style.display !== 'none';
      dropdownMenu.style.display = isOpen ? 'none' : 'block';
    });
    document.addEventListener('click', (e) => {
      if (dropdownWrapper && !dropdownWrapper.contains(e.target)) {
        dropdownMenu.style.display = 'none';
      }
    });
  }

  // Responsif Auto-Fit Zoom saat ukuran panel berubah
  const previewScroll = document.getElementById('previewPaneScroll');
  if (previewScroll && typeof ResizeObserver !== 'undefined') {
    const ro = new ResizeObserver(() => {
      if (state.previewZoomMode === 'fit') applyPreviewZoom();
    });
    ro.observe(previewScroll);
  }
}

/**
 * Pasang listener global pada form agar setiap ketikan & fokus input seketika
 * memperbarui tampilan live preview utuh + sorotan multi-lokasi tanpa reload.
 */
function setupSectionLivePreviewListeners() {
  const form = document.getElementById('aktaForm');
  if (!form) return;

  let animFrameId = null;
  const triggerUpdate = (scrollToMatch = false) => {
    if (animFrameId) cancelAnimationFrame(animFrameId);
    animFrameId = requestAnimationFrame(() => {
      renderLivePreview({ scrollToFirstMatch: scrollToMatch });
    });
  };

  form.addEventListener('focusin', (e) => {
    const meta = resolveFocusedFieldMeta(e.target);
    if (!meta) return;
    const isNewKey = state.activeFieldKey !== meta.key;
    state.activeFieldKey = meta.key;
    state.activeFieldLabel = meta.label;
    triggerUpdate(isNewKey);
  });

  form.addEventListener('input', (e) => {
    const meta = resolveFocusedFieldMeta(e.target);
    if (meta) {
      state.activeFieldKey = meta.key;
      state.activeFieldLabel = meta.label;
    }
    triggerUpdate(false);
    triggerAutoSave();
  });

  form.addEventListener('change', (e) => {
    const meta = resolveFocusedFieldMeta(e.target);
    if (meta) {
      state.activeFieldKey = meta.key;
      state.activeFieldLabel = meta.label;
    }
    triggerUpdate(false);
    triggerAutoSave();
  });
}

/**
 * Perbarui indikator redaksional khusus di dropdown panel kanan & Lajur Renvoi
 */
export function updateCustomClauseBadges() {
  const listEl = document.getElementById('clauseDropdownList');
  const countBadge = document.getElementById('customClauseTotalBadge');

  let customCount = 0;
  for (let s = 1; s <= 6; s++) {
    if (state.customTemplates && state.customTemplates[`section${s}`]) customCount++;
  }

  if (countBadge) {
    countBadge.textContent = String(customCount);
    countBadge.style.display = customCount > 0 ? 'inline-flex' : 'none';
  }

  if (listEl) {
    listEl.innerHTML = DEED_SECTION_ORDER.map(secNum => {
      const isCustom = Boolean(state.customTemplates && state.customTemplates[`section${secNum}`]);
      return `
        <div class="clause-dropdown-row">
          <button type="button" class="clause-dropdown-edit-btn" data-edit-section="${secNum}">
            <span class="clause-sec-chip">§${secNum}</span>
            <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(SECTION_NAMES[secNum] || `Bagian ${secNum}`)}</span>
            ${isCustom ? '<span class="clause-custom-dot">Khusus</span>' : ''}
          </button>
          ${isCustom ? `<button type="button" class="btn-reset-clause" data-reset-section="${secNum}" title="Kembalikan bagian ini ke standar UUJN">↺</button>` : ''}
        </div>
      `;
    }).join('');
  }
}

/**
 * Setup Modal Kustomisasi Redaksional (Template Klausula Bagian 1 s.d. 6)
 */
function setupClauseCustomizationModal() {
  const overlay = document.getElementById('clauseModalOverlay');
  const backdrop = document.getElementById('clauseModalBackdrop');
  const btnClose = document.getElementById('clauseModalBtnClose');
  const btnCancel = document.getElementById('clauseModalBtnCancel');
  const btnApply = document.getElementById('clauseModalBtnApply');
  const btnReset = document.getElementById('clauseModalBtnReset');
  const textarea = document.getElementById('clauseModalTextarea');
  const titleEl = document.getElementById('clauseModalTitle');
  const tagsContainer = document.getElementById('clauseModalTagsContainer');

  if (!overlay || !textarea) return;

  const closeModal = () => {
    overlay.style.display = 'none';
    state.currentModalSection = null;
  };

  const insertTagAtCursor = (txtArea, tag) => {
    const start = txtArea.selectionStart ?? txtArea.value.length;
    const end = txtArea.selectionEnd ?? txtArea.value.length;
    const curVal = txtArea.value;
    txtArea.value = curVal.substring(0, start) + tag + curVal.substring(end);
    const nextCursor = start + tag.length;
    txtArea.selectionStart = nextCursor;
    txtArea.selectionEnd = nextCursor;
    txtArea.focus();
  };

  const openModal = (sectionNum) => {
    const dropdownMenu = document.getElementById('clauseDropdownMenu');
    if (dropdownMenu) dropdownMenu.style.display = 'none';

    state.currentModalSection = sectionNum;
    const secName = SECTION_NAMES[sectionNum] || `Bagian ${sectionNum}`;
    if (titleEl) {
      titleEl.textContent = `Kustomisasi Redaksional: Bagian ${sectionNum} (${secName})`;
    }

    // Tampilkan chip placeholder yang relevan
    if (tagsContainer) {
      tagsContainer.innerHTML = '';
      const tags = getAvailablePlaceholders(sectionNum, state.entityType, state.ptSubType);
      tags.forEach(t => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'clause-tag-chip';
        chip.title = `${t.label}: ${t.desc}\nKlik untuk menyisipkan ke kursor editor`;
        chip.innerHTML = `<code>${escapeHtml(t.tag)}</code><span>${escapeHtml(t.label)}</span>`;
        chip.addEventListener('click', (e) => {
          e.preventDefault();
          insertTagAtCursor(textarea, t.tag);
        });
        tagsContainer.appendChild(chip);
      });
    }

    // Muat template kustom jika ada, atau gunakan default
    if (state.customTemplates && state.customTemplates[`section${sectionNum}`]) {
      textarea.value = state.customTemplates[`section${sectionNum}`];
    } else {
      textarea.value = getDefaultClauseTemplate(sectionNum, state.entityType, state.ptSubType);
    }

    overlay.style.display = 'flex';
    setTimeout(() => {
      textarea.focus();
    }, 50);
  };

  const confirmResetSection = async (sec) => {
    const dropdownMenu = document.getElementById('clauseDropdownMenu');
    if (dropdownMenu) dropdownMenu.style.display = 'none';
    const ok = await showAppDialog({
      type: 'warning',
      title: 'Kembalikan Redaksional Standar',
      message: `Kembalikan redaksional Bagian ${sec} (${SECTION_NAMES[sec]}) ke template baku standar UUJN? Perubahan redaksional khusus pada bagian ini akan dihapus.`,
      confirmText: 'Ya, Kembalikan Standar',
      showCancel: true,
      cancelText: 'Batal'
    });
    if (ok) {
      if (state.customTemplates) {
        delete state.customTemplates[`section${sec}`];
      }
      updateCustomClauseBadges();
      renderLivePreview();
      triggerAutoSave();
      await showAppDialog({
        type: 'info',
        title: 'Redaksional Direset',
        message: `Bagian ${sec} telah kembali menggunakan redaksional standar UUJN.`
      });
    }
  };

  // Delegasi klik [ Edit Redaksional ] dan [ ↺ Reset ] dari Dropdown maupun Lajur Renvoi preview kanan
  const handleClauseActionClick = (e) => {
    const editBtn = e.target.closest('[data-edit-section]');
    if (editBtn) {
      const sec = parseInt(editBtn.getAttribute('data-edit-section'), 10);
      if (sec >= 1 && sec <= 6) openModal(sec);
      return;
    }
    const resetBtn = e.target.closest('[data-reset-section]');
    if (resetBtn) {
      const sec = parseInt(resetBtn.getAttribute('data-reset-section'), 10);
      if (sec >= 1 && sec <= 6) confirmResetSection(sec);
    }
  };

  const livePreviewContainer = document.getElementById('livePreviewContainer');
  const clauseDropdownList = document.getElementById('clauseDropdownList');
  if (livePreviewContainer) livePreviewContainer.addEventListener('click', handleClauseActionClick);
  if (clauseDropdownList) clauseDropdownList.addEventListener('click', handleClauseActionClick);

  // Tombol Terapkan ke Draf Ini
  if (btnApply) {
    btnApply.addEventListener('click', async () => {
      const sec = state.currentModalSection;
      if (!sec) return;
      const val = textarea.value.trim();
      const defVal = getDefaultClauseTemplate(sec, state.entityType, state.ptSubType).trim();

      if (!state.customTemplates) state.customTemplates = {};

      if (val === defVal || !val) {
        delete state.customTemplates[`section${sec}`];
      } else {
        state.customTemplates[`section${sec}`] = textarea.value;
      }

      updateCustomClauseBadges();
      renderLivePreview();
      triggerAutoSave();
      closeModal();

      await showAppDialog({
        type: 'success',
        title: 'Redaksional Diterapkan',
        message: `Klausula redaksional khusus untuk Bagian ${sec} (${SECTION_NAMES[sec]}) berhasil diterapkan pada draf aktif ini.`
      });
    });
  }

  // Tombol Kembalikan ke Standar UUJN di Modal
  if (btnReset) {
    btnReset.addEventListener('click', async () => {
      const sec = state.currentModalSection;
      if (!sec) return;
      const ok = await showAppDialog({
        type: 'warning',
        title: 'Kembalikan ke Standar UUJN',
        message: `Apakah Anda yakin ingin membatalkan kustomisasi dan mengembalikan teks redaksional Bagian ${sec} ke format baku standar?`,
        confirmText: 'Ya, Kembalikan Standar',
        showCancel: true,
        cancelText: 'Batal'
      });
      if (ok) {
        if (state.customTemplates) {
          delete state.customTemplates[`section${sec}`];
        }
        updateCustomClauseBadges();
        renderLivePreview();
        triggerAutoSave();
        closeModal();
        await showAppDialog({
          type: 'info',
          title: 'Redaksional Direset',
          message: `Bagian ${sec} telah kembali menggunakan redaksional standar UUJN.`
        });
      }
    });
  }

  if (btnClose) btnClose.addEventListener('click', closeModal);
  if (btnCancel) btnCancel.addEventListener('click', closeModal);
  if (backdrop) backdrop.addEventListener('click', closeModal);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.style.display !== 'none') {
      closeModal();
    }
  });
}

/**
 * Fitur Status Penyimpanan Draf & Auto-Backup Lokal
 */
let autoSaveTimer = null;

function setDraftSavedStatus(saved = true) {
  state.isDraftSaved = saved;
  const indicator = document.getElementById('autoSaveIndicator');
  const dot = document.getElementById('autoSaveDot');
  const text = document.getElementById('autoSaveText');
  if (!indicator || !dot || !text) return;

  if (saved) {
    indicator.classList.remove('unsaved');
    indicator.classList.add('saved');
    dot.className = 'pulse-dot-green';
    text.textContent = 'Draf Tersimpan';
    indicator.title = state.currentDraftFilePath
      ? `Seluruh perubahan tersimpan di: ${state.currentDraftFilePath}`
      : 'Draf telah tersimpan ke berkas';
  } else {
    indicator.classList.remove('saved');
    indicator.classList.add('unsaved');
    dot.className = 'pulse-dot-red';
    text.textContent = 'Belum Disimpan';
    indicator.title = 'Ada perubahan yang belum disimpan ke berkas (tekan Ctrl+S untuk menyimpan)';
  }
}

// Alias kompatibilitas
const triggerAutoSaveIndicator = setDraftSavedStatus;

function triggerAutoSave() {
  // Tandai draf sebagai belum disimpan (merah)
  setDraftSavedStatus(false);

  if (autoSaveTimer) clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(() => {
    try {
      const data = kumpulkanDataForm();
      localStorage.setItem('akta_autosave_draft_data', JSON.stringify(data));
    } catch (e) {
      console.warn('Autosave error:', e);
    }
  }, 600);
}

/**
 * Fitur Simpan & Muat Progres Pengerjaan (.akta & .json)
 */
function setupProgressSaveAndLoad() {
  const saveDraft = async (forceSaveAs = false) => {
    if (isDemoLocked()) {
      showDemoLockOverlay();
      return;
    }
    const data = kumpulkanDataForm();
    const jsonStr = JSON.stringify(data, null, 2);
    const tipe = data.badanUsaha?.tipe || 'PT';
    let rawNama = 'DRAF';
    if (tipe === 'PT') rawNama = data.pt?.nama || 'DRAF';
    else if (tipe === 'CV') rawNama = data.cv?.nama || 'DRAF';
    else if (tipe === 'FIRMA' || tipe === 'FA') rawNama = data.firma?.nama || 'DRAF';

    const cleanNama = rawNama.replace(/[^a-zA-Z0-9]/g, '_');
    const nomorAkta = data.akta?.nomor || 'Draf';
    const defaultFilename = `Draf_Akta_No_${nomorAkta}_${tipe}_${cleanNama}.akta`;

    let chosenPath = state.currentDraftFilePath;

    // Jika Save As atau berkas belum pernah disimpan sebelumnya:
    if (forceSaveAs || !chosenPath) {
      let initialDir = localStorage.getItem('setting_dir_archive') || localStorage.getItem('setting_dir_progress') || '';
      let initialFilename = defaultFilename;

      if (chosenPath) {
        initialFilename = chosenPath.split(/[\\/]/).pop() || defaultFilename;
        const lastSep = Math.max(chosenPath.lastIndexOf('\\'), chosenPath.lastIndexOf('/'));
        if (lastSep !== -1) {
          initialDir = chosenPath.substring(0, lastSep);
        }
      }

      if (window.__TAURI__?.core?.invoke) {
        try {
          const selected = await window.__TAURI__.core.invoke('pick_save_file', {
            title: forceSaveAs ? 'Simpan Sebagai Salinan Draf Akta (.akta)' : 'Simpan Draf Akta Notaris (.akta)',
            defaultName: initialFilename,
            defaultPath: initialDir || undefined,
            filterName: 'Draf Akta Notaris (*.akta)',
            filterExts: ['akta', 'json']
          });

          if (!selected) {
            // Pengguna membatalkan dialog simpan
            return false;
          }

          chosenPath = selected;
          if (!chosenPath.toLowerCase().endsWith('.akta') && !chosenPath.toLowerCase().endsWith('.json')) {
            chosenPath += '.akta';
          }
        } catch (err) {
          console.error('Gagal membuka dialog simpan berkas:', err);
          await showAppDialog({
            type: 'error',
            title: 'Gagal Membuka File Explorer',
            message: err.message || String(err)
          });
          return false;
        }
      } else {
        // Fallback untuk browser web
        let customName = prompt('Masukkan nama berkas untuk menyimpan draf:', initialFilename);
        if (!customName) return false;
        if (!customName.toLowerCase().endsWith('.akta') && !customName.toLowerCase().endsWith('.json')) {
          customName += '.akta';
        }
        chosenPath = customName;
        const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
        saveAs(blob, customName);
      }
    }

    // Tulis berkas langsung ke disk
    if (window.__TAURI__?.core?.invoke) {
      try {
        await window.__TAURI__.core.invoke('write_text_file', {
          filePath: chosenPath,
          content: jsonStr
        });

        // Simpan folder direktori ke preferensi pengaturan
        const lastSep = Math.max(chosenPath.lastIndexOf('\\'), chosenPath.lastIndexOf('/'));
        if (lastSep !== -1) {
          const chosenDir = chosenPath.substring(0, lastSep);
          localStorage.setItem('setting_dir_archive', chosenDir);
          localStorage.setItem('setting_dir_progress', chosenDir);
          localStorage.setItem('setting_dir_word', chosenDir);
          const arcInput = document.getElementById('settingDirArchive');
          if (arcInput) arcInput.value = chosenDir;
        }
      } catch (err) {
        console.error('Gagal menyimpan draf ke disk:', err);
        await showAppDialog({
          type: 'error',
          title: 'Gagal Menyimpan Berkas ke Disk',
          message: err.message || String(err)
        });
        return false;
      }
    }

    // Perbarui state jalur draf & label UI
    updateActiveDraftUI(chosenPath);

    // Simpan ke local storage sebagai draft aktif terkini
    localStorage.setItem('akta_autosave_draft_data', jsonStr);
    setDraftSavedStatus(true);

    const filenameOnly = chosenPath.split(/[\\/]/).pop();
    const folderOnly = chosenPath.substring(0, chosenPath.length - filenameOnly.length - 1);

    if (forceSaveAs) {
      await showAppDialog({
        type: 'success',
        title: 'Draf Berhasil Disimpan!',
        message: 'Salinan berkas draf baru telah berhasil dibuat dan disimpan ke komputer Anda.',
        details: {
          'Nama Berkas': filenameOnly,
          'Folder': folderOnly || '-',
          'Jalur Lengkap': chosenPath
        },
        confirmText: 'Selesai'
      });
    } else {
      await showAppDialog({
        type: 'success',
        title: 'Draf Berhasil Disimpan!',
        message: 'Seluruh klausula dan data formulir telah berhasil disimpan langsung ke berkas draf.',
        details: {
          'Nama Berkas': filenameOnly,
          'Folder': folderOnly || '-',
          'Jalur Lengkap': chosenPath
        },
        confirmText: 'Selesai'
      });
    }

    return true;
  };

  // 1. Tombol Simpan Draf (Save langsung jika sudah ada file, buka explorer jika draf baru)
  const btnSave = document.getElementById('btnSaveProgress');
  if (btnSave) {
    btnSave.addEventListener('click', () => saveDraft(false));
  }

  // 2. Tombol Simpan Sebagai... (Save As selalu membuka File Explorer)
  const btnSaveAs = document.getElementById('btnSaveAsProgress');
  if (btnSaveAs) {
    btnSaveAs.addEventListener('click', () => saveDraft(true));
  }

  // 3. Shortcut Keyboard: Ctrl + S (atau Cmd + S di Mac) untuk Simpan Draf
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
      const editorView = document.getElementById('view-editor');
      if (editorView && editorView.style.display !== 'none') {
        e.preventDefault();
        saveDraft(false);
      }
    }
  });

  // 3. Buka Draf (.akta / .json)
  const btnLoad = document.getElementById('btnLoadProgress');
  const filePicker = document.getElementById('filePickerProgress');
  if (btnLoad && filePicker) {
    btnLoad.addEventListener('click', () => {
      filePicker.click();
    });

    filePicker.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const parsed = JSON.parse(event.target.result);
          if (!parsed.badanUsaha && !parsed.akta) {
            throw new Error('Struktur berkas tidak cocok dengan format draf akta notaris.');
          }
          loadDataToForm(parsed);
          updateActiveDraftUI(file.name);
          setDraftSavedStatus(true);
          await showAppDialog({
            type: 'success',
            title: 'Draf Akta Berhasil Dimuat!',
            message: 'Seluruh isian formulir, data penghadap, organ badan usaha, dan pratinjau klausula akta telah berhasil dipulihkan.',
            details: {
              'Nama Berkas': file.name
            },
            confirmText: 'Lanjutkan Pengerjaan'
          });
        } catch (err) {
          await showAppDialog({
            type: 'error',
            title: 'Gagal Memuat Berkas Draf',
            message: err.message || String(err),
            details: 'Pastikan berkas berformat .akta atau .json yang valid.'
          });
        } finally {
          filePicker.value = '';
        }
      };
      reader.onerror = async () => {
        await showAppDialog({
          type: 'error',
          title: 'Kesalahan Membaca Berkas',
          message: 'Terjadi kendala saat membaca berkas dari media penyimpanan komputer Anda.'
        });
        filePicker.value = '';
      };
      reader.readAsText(file);
    });
  }
}

/**
 * Setup Pengaturan Direktori Folder Penyimpanan (Tab Settings)
 */
/**
 * Setup Pengaturan Direktori Folder Penyimpanan Terpadu (Draf & Word)
 */
function setupDirectorySettings() {
  const dirArchiveInput = document.getElementById('settingDirArchive');

  const savedDir = localStorage.getItem('setting_dir_archive') ||
    localStorage.getItem('setting_dir_progress') ||
    localStorage.getItem('setting_dir_word') || '';

  if (dirArchiveInput) dirArchiveInput.value = savedDir;

  const saveArchiveDir = (val) => {
    if (val) {
      localStorage.setItem('setting_dir_archive', val);
      localStorage.setItem('setting_dir_progress', val);
      localStorage.setItem('setting_dir_word', val);
    } else {
      localStorage.removeItem('setting_dir_archive');
      localStorage.removeItem('setting_dir_progress');
      localStorage.removeItem('setting_dir_word');
    }
  };

  // Tombol Simpan Direktori
  const btnSaveDir = document.getElementById('btnSaveDirSettings');
  if (btnSaveDir) {
    btnSaveDir.addEventListener('click', () => {
      const val = dirArchiveInput?.value.trim() || '';
      saveArchiveDir(val);

      const successLabel = document.getElementById('saveDirSuccess');
      if (successLabel) {
        successLabel.textContent = '✓ Pengaturan direktori berhasil disimpan!';
        successLabel.style.display = 'inline-flex';
        setTimeout(() => { successLabel.style.display = 'none'; }, 3000);
      }
    });
  }

  // Tombol Kosongkan Direktori
  const btnResetDir = document.getElementById('btnResetDirSettings');
  if (btnResetDir) {
    btnResetDir.addEventListener('click', () => {
      if (dirArchiveInput) dirArchiveInput.value = '';
      saveArchiveDir('');

      const successLabel = document.getElementById('saveDirSuccess');
      if (successLabel) {
        successLabel.textContent = '✓ Direktori berhasil dikosongkan. Folder akan otomatis diminta saat pertama kali Anda menyimpan draf.';
        successLabel.style.display = 'inline-flex';
        setTimeout(() => {
          successLabel.textContent = '✓ Pengaturan direktori berhasil disimpan!';
          successLabel.style.display = 'none';
        }, 4000);
      }
    });
  }

  // Buka dialog Windows File Explorer untuk memilih folder
  const browseFolder = async (title, inputEl) => {
    try {
      if (window.__TAURI__?.core?.invoke) {
        const currentPath = inputEl?.value.trim() || undefined;
        const selected = await window.__TAURI__.core.invoke('pick_folder', {
          title: title,
          defaultPath: currentPath
        });
        if (selected) {
          if (inputEl) inputEl.value = selected;
          saveArchiveDir(selected);
          const successLabel = document.getElementById('saveDirSuccess');
          if (successLabel) {
            successLabel.textContent = `✓ Folder terpilih: ${selected}`;
            successLabel.style.display = 'inline-flex';
            setTimeout(() => {
              successLabel.textContent = '✓ Pengaturan direktori berhasil disimpan!';
              successLabel.style.display = 'none';
            }, 4000);
          }
        }
      } else {
        await showAppDialog({
          type: 'info',
          title: 'Pemilihan Folder',
          message: 'Fitur pemilihan folder otomatis melalui Windows File Explorer aktif di aplikasi desktop (EXE).\n\nPada mode web biasa, silakan ketik atau tempelkan jalur folder direktori yang diinginkan.'
        });
      }
    } catch (err) {
      console.error('Gagal memilih folder:', err);
      await showAppDialog({
        type: 'error',
        title: 'Gagal Membuka File Explorer',
        message: err.message || String(err)
      });
    }
  };

  const btnBrowseArchive = document.getElementById('btnBrowseDirArchive');
  if (btnBrowseArchive) {
    btnBrowseArchive.addEventListener('click', () => {
      browseFolder('Pilih Folder Direktori Arsip Berkas Akta (.akta & .docx)', dirArchiveInput);
    });
  }

  // Auto-save jika pengguna mengetik atau menempel jalur folder secara manual
  if (dirArchiveInput) {
    dirArchiveInput.addEventListener('change', () => {
      const v = dirArchiveInput.value.trim();
      saveArchiveDir(v);
    });
  }

  // Buka folder di Windows Explorer
  const openFolderInExplorer = async (folderPath) => {
    if (!folderPath) {
      await showAppDialog({
        type: 'info',
        title: 'Folder Belum Ditentukan',
        message: 'Direktori folder belum ditentukan. Folder akan otomatis diminta saat pertama kali Anda menyimpan draf, atau klik tombol "Pilih Folder" untuk mengaturnya.'
      });
      return;
    }
    try {
      if (window.__TAURI__?.core?.invoke) {
        await window.__TAURI__.core.invoke('plugin:opener|open_path', { path: folderPath });
      } else {
        await showAppDialog({
          type: 'info',
          title: 'Lokasi Folder Target',
          details: { 'Lokasi Folder': folderPath }
        });
      }
    } catch (err) {
      await showAppDialog({
        type: 'error',
        title: 'Gagal Membuka Folder',
        message: err.message || String(err),
        details: { 'Lokasi Folder': folderPath }
      });
    }
  };

  const btnOpenArchive = document.getElementById('btnOpenDirArchive');
  if (btnOpenArchive) {
    btnOpenArchive.addEventListener('click', () => {
      const p = dirArchiveInput?.value.trim() ||
        localStorage.getItem('setting_dir_archive') ||
        localStorage.getItem('setting_dir_progress') || '';
      openFolderInExplorer(p);
    });
  }
}


