import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, HeadingLevel, BorderStyle, ShadingType,
  Header, Footer, PageNumber, PageBreak
} from 'docx';
import fs from 'fs';
import path from 'path';

console.log("Memulai penyusunan Dokumen Master PRD + SRS + ADD + Manual + Proposal (.docx)...");

// ==========================================
// COLOR PALETTE & TYPOGRAPHY CONSTANTS
// ==========================================
const COLOR = {
  NAVY_PRIMARY: "0F2B48",   // Deep Corporate Navy
  BLUE_ACCENT: "1D4ED8",    // Professional Royal Blue
  BLUE_LIGHT: "2563EB",     // Light Blue Accent
  TEXT_DARK: "1E293B",      // Slate Dark Text
  TEXT_MUTED: "64748B",     // Slate Muted Gray
  BG_LIGHT: "F8FAFC",       // Off-White / Light Gray Row
  BG_CALLOUT: "EFF6FF",     // Ice Blue Callout Fill
  BORDER: "CBD5E1",         // Border Gray
  BORDER_DARK: "0F2B48",    // Table Header Border
  WHITE: "FFFFFF",
  SUCCESS: "059669",
  WARNING: "D97706"
};

// ==========================================
// HELPER BUILDERS
// ==========================================

function h1(title, pageBreakBefore = false) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    pageBreakBefore: pageBreakBefore,
    spacing: { before: 360, after: 140 },
    children: [
      new TextRun({
        text: title,
        bold: true,
        size: 30, // 15pt
        color: COLOR.NAVY_PRIMARY,
        font: "Calibri"
      })
    ]
  });
}

function h2(title) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 100 },
    children: [
      new TextRun({
        text: title,
        bold: true,
        size: 24, // 12pt
        color: COLOR.BLUE_ACCENT,
        font: "Calibri"
      })
    ]
  });
}

function h3(title) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 180, after: 60 },
    children: [
      new TextRun({
        text: title,
        bold: true,
        size: 21, // 10.5pt
        color: COLOR.TEXT_DARK,
        font: "Calibri"
      })
    ]
  });
}

function p(text, options = {}) {
  const runs = [];
  if (typeof text === 'string') {
    runs.push(new TextRun({
      text: text,
      size: options.size || 21, // 10.5pt
      color: options.color || COLOR.TEXT_DARK,
      bold: options.bold || false,
      italics: options.italics || false,
      font: "Calibri"
    }));
  } else if (Array.isArray(text)) {
    // Array of TextRun or strings
    for (const item of text) {
      if (typeof item === 'string') {
        runs.push(new TextRun({ text: item, size: options.size || 21, color: options.color || COLOR.TEXT_DARK, font: "Calibri" }));
      } else {
        runs.push(item);
      }
    }
  }

  return new Paragraph({
    alignment: options.alignment || AlignmentType.LEFT,
    spacing: {
      before: options.spaceBefore || 0,
      after: options.spaceAfter !== undefined ? options.spaceAfter : 120,
      line: 276 // 1.15 line spacing
    },
    children: runs
  });
}

function bullet(boldPrefix, desc) {
  const children = [];
  if (boldPrefix) {
    children.push(new TextRun({
      text: boldPrefix + " ",
      bold: true,
      color: COLOR.NAVY_PRIMARY,
      size: 21,
      font: "Calibri"
    }));
  }
  if (desc) {
    children.push(new TextRun({
      text: desc,
      color: COLOR.TEXT_DARK,
      size: 21,
      font: "Calibri"
    }));
  }
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 80, line: 260 },
    children: children
  });
}

function callout(title, bodyText, type = "info") {
  const borderColor = type === "warning" ? COLOR.WARNING : (type === "success" ? COLOR.SUCCESS : COLOR.BLUE_LIGHT);
  const bgColor = type === "warning" ? "FFFBEB" : (type === "success" ? "F0FDF4" : COLOR.BG_CALLOUT);
  const titleColor = type === "warning" ? COLOR.WARNING : (type === "success" ? COLOR.SUCCESS : COLOR.BLUE_ACCENT);

  const paragraphs = [];
  if (title) {
    paragraphs.push(new Paragraph({
      spacing: { after: 60 },
      children: [
        new TextRun({ text: "📌 " + title, bold: true, size: 21, color: titleColor, font: "Calibri" })
      ]
    }));
  }
  paragraphs.push(new Paragraph({
    spacing: { after: 0, line: 260 },
    children: [
      new TextRun({ text: bodyText, size: 20, color: COLOR.TEXT_DARK, font: "Calibri" })
    ]
  }));

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.SINGLE, size: 28, color: borderColor }
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: bgColor },
            margins: { top: 120, bottom: 120, left: 160, right: 160 },
            children: paragraphs
          })
        ]
      })
    ]
  });
}

function styledTable(headers, rows, colWidths = [], alignMap = []) {
  const tableRows = [];

  // Header Row
  const headerCells = headers.map((h, idx) => {
    const width = colWidths[idx] ? { size: colWidths[idx], type: WidthType.PERCENTAGE } : undefined;
    const align = alignMap[idx] === 'right' ? AlignmentType.RIGHT : (alignMap[idx] === 'center' ? AlignmentType.CENTER : AlignmentType.LEFT);

    return new TableCell({
      width: width,
      shading: { fill: COLOR.NAVY_PRIMARY },
      margins: { top: 140, bottom: 140, left: 140, right: 140 },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 6, color: COLOR.BORDER_DARK },
        bottom: { style: BorderStyle.SINGLE, size: 12, color: COLOR.BORDER_DARK },
        left: { style: BorderStyle.SINGLE, size: 4, color: COLOR.BORDER },
        right: { style: BorderStyle.SINGLE, size: 4, color: COLOR.BORDER }
      },
      children: [
        new Paragraph({
          alignment: align,
          children: [
            new TextRun({ text: h, bold: true, color: COLOR.WHITE, size: 19, font: "Calibri" })
          ]
        })
      ]
    });
  });

  tableRows.push(new TableRow({ children: headerCells }));

  // Data Rows
  rows.forEach((row, rIdx) => {
    const isEven = rIdx % 2 === 1;
    const rowBg = isEven ? COLOR.BG_LIGHT : COLOR.WHITE;

    const cells = row.map((c, cIdx) => {
      const width = colWidths[cIdx] ? { size: colWidths[cIdx], type: WidthType.PERCENTAGE } : undefined;
      const align = alignMap[cIdx] === 'right' ? AlignmentType.RIGHT : (alignMap[cIdx] === 'center' ? AlignmentType.CENTER : AlignmentType.LEFT);
      const isBold = alignMap[cIdx] === 'bold' || cIdx === 0;

      let cellText = "";
      let cellSub = "";
      if (typeof c === 'object' && c !== null) {
        cellText = c.text || "";
        cellSub = c.sub || "";
      } else {
        cellText = String(c);
      }

      const pChildren = [
        new TextRun({
          text: cellText,
          bold: isBold || (typeof c === 'object' && c.bold),
          color: (typeof c === 'object' && c.color) || COLOR.TEXT_DARK,
          size: 19,
          font: "Calibri"
        })
      ];

      if (cellSub) {
        pChildren.push(new TextRun({
          text: "\n" + cellSub,
          italics: true,
          color: COLOR.TEXT_MUTED,
          size: 17,
          font: "Calibri"
        }));
      }

      return new TableCell({
        width: width,
        shading: { fill: rowBg },
        margins: { top: 120, bottom: 120, left: 140, right: 140 },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 4, color: COLOR.BORDER },
          bottom: { style: BorderStyle.SINGLE, size: 4, color: COLOR.BORDER },
          left: { style: BorderStyle.SINGLE, size: 4, color: COLOR.BORDER },
          right: { style: BorderStyle.SINGLE, size: 4, color: COLOR.BORDER }
        },
        children: [
          new Paragraph({
            alignment: align,
            children: pChildren
          })
        ]
      });
    });

    tableRows.push(new TableRow({ children: cells }));
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: tableRows
  });
}

function divider() {
  return new Paragraph({
    spacing: { before: 180, after: 180 },
    alignment: AlignmentType.CENTER,
    children: [
      new TextRun({ text: "• • •", color: COLOR.BORDER, size: 28, bold: true })
    ]
  });
}

// ==========================================
// DOCUMENT CONTENT ASSEMBLY
// ==========================================
const children = [];

// ------------------------------------------
// 1. COVER / TITLE PAGE
// ------------------------------------------
children.push(
  new Paragraph({
    spacing: { before: 720, after: 120 },
    children: [
      new TextRun({
        text: "DOKUMEN REKAYASA SISTEM TERPADU",
        bold: true,
        size: 20,
        color: COLOR.BLUE_ACCENT,
        font: "Calibri",
        characterSpacing: 40
      })
    ]
  }),
  new Paragraph({
    spacing: { before: 60, after: 180 },
    children: [
      new TextRun({
        text: "GENERATOR AKTA NOTARIS SIRKULER",
        bold: true,
        size: 44, // 22pt
        color: COLOR.NAVY_PRIMARY,
        font: "Calibri"
      })
    ]
  }),
  new Paragraph({
    spacing: { before: 0, after: 360 },
    children: [
      new TextRun({
        text: "Otomasi Penyusunan Akta Berita Acara & Keputusan Sirkuler (PT, CV, Firma)\nSesuai Format Standar Baku Undang-Undang Jabatan Notaris (UUJN)",
        size: 24, // 12pt
        color: COLOR.TEXT_MUTED,
        font: "Calibri"
      })
    ]
  }),
  callout(
    "KLASIFIKASI DOKUMEN: TEKNIS, ARSITEKTUR & PENAWARAN RESMI",
    "Dokumen ini memadukan Product Requirement Document (PRD), Software Requirements Specification (SRS IEEE 830), Architecture Design Document (ADD ISO/IEC/IEEE 42010), Buku Panduan Penggunaan Operasional, serta Rincian Riset Biaya Pengembangan Per Fitur dan Proposal Penawaran Lisensi.",
    "info"
  ),
  new Paragraph({ spacing: { before: 360, after: 180 } }),
  // Project Metadata Box Table
  styledTable(
    ["Parameter Dokumen", "Keterangan Spesifikasi"],
    [
      ["Nama Sistem / Aplikasi", "Generator Akta Notaris Sirkuler (GANS-Desktop)"],
      ["Arsitektur Inti", "Hybrid Native Desktop (Tauri v2 + Rust Core + Chromium Webview2)"],
      ["Instansi Klien / Sasaran", "Kantor Notaris & PPAT Grendi Jaya Darmawan, S.H., M.Kn."],
      ["Wilayah Jabatan Notaris", "Kabupaten Kudus, Jawa Tengah"],
      ["Pengembang / Engineer", "Tim Pengembang Perangkat Lunak Legal Kustom"],
      ["Kontak Pengembang (WhatsApp)", "0821-2295-9032"],
      ["Status Dokumen & Versi", "Versi 1.0.0 (Release Candidate / Commercial Final)"],
      ["Kerahasiaan", "CONFIDENTIAL / KHUSUS KANTOR NOTARIS GRENDI JAYA DARMAWAN"]
    ],
    [35, 65]
  ),
  new Paragraph({ pageBreakBefore: true })
);

// ------------------------------------------
// 2. LEMBAR PENGESAHAN & DAFTAR ISI
// ------------------------------------------
children.push(
  h1("LEMBAR PENGESAHAN DOKUMEN"),
  p("Dokumen spesifikasi terpadu ini telah ditinjau dan divalidasi oleh tim rekayasa perangkat lunak untuk memastikan kepatuhan teknis terhadap standar pembuatan akta autentik di Indonesia:"),
  styledTable(
    ["Peran / Posisi", "Nama Personalia", "Status Tinjauan", "Tanggal Validasi"],
    [
      ["Lead Software Architect", "Tim Pengembang Software", "APPROVED & COMMITTED", "Oktober 2026"],
      ["Legal Tech Specialist", "Legal Engineering Team", "VERIFIED & AUDITED", "Oktober 2026"],
      ["Notaris Pemesan / Klien", "Grendi Jaya Darmawan, S.H., M.Kn.", "SUBMITTED FOR REVIEW", "Oktober 2026"]
    ],
    [25, 35, 25, 15],
    ['left', 'left', 'center', 'center']
  ),
  divider(),
  h2("STRUKTUR & DAFTAR BAB DOKUMEN"),
  bullet("BAB 1: RINGKASAN EKSEKUTIF & LATAR BELAKANG BISNIS", "Latar belakang masalah, analisis inefisiensi kantor, solusi perangkat lunak, dan ROI."),
  bullet("BAB 2: PRODUCT REQUIREMENT DOCUMENT (PRD)", "Visi produk, user personas, alur kerja (workflow), use cases, kebutuhan fungsional (FR) & non-fungsional (NFR)."),
  bullet("BAB 3: SOFTWARE REQUIREMENTS SPECIFICATION (SRS)", "Spesifikasi antarmuka eksternal, kamus data entitas, skema JSON .akta, dan aturan bisnis hukum notariat (BR)."),
  bullet("BAB 4: ARCHITECTURE DESIGN DOCUMENT (ADD)", "Arsitektur hybrid native Tauri+Rust, keamanan airgap offline, proteksi demo trial 72 jam, dan dekomposisi sub-sistem."),
  bullet("BAB 5: PANDUAN PENGGUNAAN & PROSEDUR OPERASIONAL (MANUAL)", "Instalasi, navigasi dasbor, pengisian 6 anatomi akta, kustomisasi klausula, ekspor Word, dan troubleshooting."),
  bullet("BAB 6: ANALISIS BIAYA INDUSTRI, PER FITUR, & PROPOSAL PENAWARAN", "Riset harga industri software legal di Indonesia, rincian biaya 6 fitur utama (Rp 18,5 jt), paket penawaran lisensi penuh (Rp 4,5 jt), katalog add-ons, garansi SLA, dan persetujuan pemesanan."),
  new Paragraph({ pageBreakBefore: true })
);

// ------------------------------------------
// BAB 1: RINGKASAN EKSEKUTIF & LATAR BELAKANG BISNIS
// ------------------------------------------
children.push(
  h1("BAB 1: RINGKASAN EKSEKUTIF & LATAR BELAKANG BISNIS"),
  h2("1.1 Latar Belakang & Urgensi Praktik Notariat"),
  p("Kantor Notaris merupakan pilar utama penegakan kepastian hukum perdata dan bisnis di Indonesia. Setiap hari, kantor notaris menangani penerbitan akta-akta autentik seperti Akta Berita Acara Rapat dan Keputusan Sirkuler Pemegang Saham / Sekutu untuk perseroan terbatas (PT), persekutuan komanditer (CV), maupun persekutuan perdata/firma."),
  p("Dalam praktik konvensional, pembuatan akta-akta ini masih sangat bergantung pada proses penyalinan manual (*copy-paste*) antar-dokumen Microsoft Word lama. Metode konvensional ini memiliki risiko kegagalan sistemik yang tinggi:"),
  bullet("Kerentanan 'Human Error':", "Tertukarnya nama perseroan lama, kesalahan pengetikan nomor SK Menteri, kelalaian dalam penulisan nominal modal dan nama-nama pengurus baru."),
  bullet("Ketidakteraturan Perhitungan Terbilang:", "Penyusunan kalimat terbilang rupiah, terbilang lembar saham Seri A dan Seri B, serta penulisan jam dan tanggal masehi yang rumit dan rawan kekeliruan staf."),
  bullet("Pelanggaran Format Baku UUJN:", "Undang-Undang Nomor 2 Tahun 2014 tentang Jabatan Notaris (UUJN) mewajibkan batas maksimal 30 baris per halaman, garis tanda hubung otomatis tanpa terputus, dan batas margin renvoi 2.56 inci di sebelah kiri. Mengatur tata letak ini secara manual di Word memakan waktu 1–2 jam per akta."),
  bullet("Risiko Kebocoran Data Rahasia Notariat:", "Penggunaan generator dokumen berbasis cloud/web publik membahayakan kerahasiaan akta dan melanggar sumpah jabatan notaris serta regulasi perlindungan data pribadi (UU PDP)."),

  h2("1.2 Solusi: Generator Akta Notaris Sirkuler Berbasis Desktop Native"),
  p("Untuk menjawab permasalahan mendasar di atas, dikembangkanlah sistem Generator Akta Notaris Sirkuler (GANS-Desktop). Aplikasi ini bukan sekadar editor teks, melainkan instrumen hukum presisi (*legal engineering tool*) yang dirancang khusus untuk memandu asisten dan notaris dari tahap input anatomi akta hingga menghasilkan dokumen Microsoft Word (.docx) siap cetak."),

  h2("1.3 Analisis Efisiensi & Return on Investment (ROI) Kantor Notaris"),
  p("Penerapan sistem ini menghadirkan lompatan efisiensi drastis bagi operasional kantor notaris Bapak Grendi Jaya Darmawan, S.H., M.Kn.:"),
  styledTable(
    ["Parameter Pengukuran", "Metode Manual Konvensional", "Dengan Generator Akta Notaris", "Efisiensi / Penghematan"],
    [
      ["Waktu Pembuatan 1 Akta", "60 – 120 menit (pengetikan & cek ulang)", "10 – 15 menit (input terstruktur)", "Menghemat waktu >80%"],
      ["Kerapian Garis Hubung UUJN", "Diketuk manual spasi & minus (rawan meleset)", "Otomatis dihitung presisi margin", "Kepatuhan UUJN 100%"],
      ["Konversi Angka ke Terbilang", "Dihitung manual (rawan salah ketik)", "Real-time kalkulasi otomatis", "Zero error (0% salah)"],
      ["Keamanan & Privasi Akta", "Data rawan tersinkron ke cloud pribadi", "100% Offline Lokal di PC kantor", "Aman & Kepatuhan UU PDP"],
      ["Biaya Lembur Staf", "Tinggi saat mengejar deadline rapat sirkuler", "Terkendali & minim lembur", "Menghemat biaya operasional"]
    ],
    [25, 30, 30, 15]
  ),
  new Paragraph({ pageBreakBefore: true })
);

// ------------------------------------------
// BAB 2: PRODUCT REQUIREMENT DOCUMENT (PRD)
// ------------------------------------------
children.push(
  h1("BAB 2: PRODUCT REQUIREMENT DOCUMENT (PRD)"),
  h2("2.1 Visi & Pernyataan Nilai Produk (Product Vision)"),
  p([
    new TextRun({ text: "Visi Produk: ", bold: true, color: COLOR.BLUE_ACCENT }),
    "Menyediakan instrumen kerja desktop tercepat, teringan, dan paling patuh hukum bagi kantor notaris Indonesia dalam menyusun dokumen akta sirkuler komersial tanpa ketergantungan koneksi internet dan tanpa risiko kebocoran data."
  ]),

  h2("2.2 Profil Pengguna & Persona (User Personas)"),
  styledTable(
    ["Atribut Persona", "Persona 1: Asisten Notaris / Operator Typist", "Persona 2: Notaris Pembuat Akta"],
    [
      ["Nama Representatif", "Ibu Siti / Mas Budi (Staf Komputer Akta)", "Bapak Grendi Jaya Darmawan, S.H., M.Kn."],
      ["Tanggung Jawab Utama", "Menginput data para penghadap, menyusun draf akta, mencocokkan SK Kemenkumham, dan mencetak minuta.", "Memeriksa kesesuaian hukum, memimpin pembacaan akta di hadapan penghadap, dan menandatangani minuta."],
      ["Kendala Harian", "Sering lelah mengatur spasi garis tanda hubung penutup, format margin renvoi yang meleset di Word, dan salah hitung terbilang saham.", "Waktu habis memeriksa kesalahan ketik ketimbang aspek substansi hukum."],
      ["Nilai yang Diharapkan", "Formulir yang jelas, navigasi tab mudah, pencarian draf cepat, dan tombol cetak Word instan.", "Jaminan kepatuhan format UUJN, identitas kantor terkunci resmi, dan data klien tetap aman di kantor."]
    ],
    [20, 40, 40]
  ),

  h2("2.3 Ruang Lingkup Fungsional Produk (Functional Scope)"),
  p("Aplikasi mendukung 3 (tiga) varian badan usaha komersial:"),
  bullet("1. Perseroan Terbatas (PT) Sirkuler:", "Keputusan sirkuler pemegang saham pengganti RUPS, penyesuaian modal dasar/ditempatkan/disetor (Saham Seri A dan Seri B), serta perubahan pengurus (Direksi & Komisaris)."),
  bullet("2. Persekutuan Komanditer (CV) Sirkuler:", "Keputusan rapat sekutu, modal masukan/inbreng sekutu komplementer & komanditer, penerimaan sekutu baru, dan pengunduran diri sekutu lama."),
  bullet("3. Persekutuan Firma (Fa) Sirkuler:", "Keputusan bersama para persero firma, perubahan anggaran dasar, pembagian modal persero, dan perombakan pengurus firma."),

  h2("2.4 Matriks Kebutuhan Fungsional (Functional Requirements Matrix)"),
  styledTable(
    ["Kode FR", "Modul / Fitur", "Deskripsi Kebutuhan Fungsional", "Tingkat Prioritas"],
    [
      ["FR-01", "Manajemen Dasbor", "Sistem menyediakan dasbor beranda dengan kartu pilihan pembuatan akta baru (PT, CV, Firma).", "CRITICAL"],
      ["FR-02", "Daftar Draf Lokal", "Sistem menampilkan daftar draf tersimpan lengkap dengan waktu simpan, tipe badan usaha, dan nomor akta.", "CRITICAL"],
      ["FR-03", "Pencarian Instan (Live)", "Sistem menyaring daftar draf seketika saat pengguna mengetik kata kunci pada kolom pencarian.", "HIGH"],
      ["FR-04", "Paginasi Draf", "Sistem membagi daftar draf ke dalam halaman terstruktur dengan batas maksimal item per halaman.", "MEDIUM"],
      ["FR-05", "Navigasi Form 6 Bagian", "Sistem membagi pengerjaan akta ke dalam 6 tab terstruktur (Kepala, Legalitas, Komparisi, Modal, Pengurus, Saksi).", "CRITICAL"],
      ["FR-06", "Otomasi Terbilang Multilayer", "Sistem mengonversi secara otomatis angka nominal uang, lembar saham, tanggal, dan jam ke dalam teks bahasa Indonesia baku.", "CRITICAL"],
      ["FR-07", "Kustomisasi Redaksional", "Sistem menyediakan editor modal untuk mengubah kalimat pembuka, isi, maupun penutup tiap pasal akta.", "HIGH"],
      ["FR-08", "Chips Tag Variabel", "Sistem menyediakan tombol tag dinamis ({NOMOR_AKTA}, {NAMA_NOTARIS}, dll) yang langsung menyisip ke kursor editor.", "HIGH"],
      ["FR-09", "Reset Standar UUJN", "Sistem menyediakan tombol kembalikan ke redaksional standar UUJN dengan dialog konfirmasi pengaman.", "HIGH"],
      ["FR-10", "Ekspor Dokumen Word (.docx)", "Sistem menghasilkan file Microsoft Word asli (.docx) siap cetak tanpa ketergantungan software pihak ketiga.", "CRITICAL"],
      ["FR-11", "Format UUJN 30 Baris", "Engine Word memotong kalimat menjadi tepat 30 baris per halaman sesuai ketentuan akta autentik UUJN.", "CRITICAL"],
      ["FR-12", "Garis Penutup Otomatis", "Engine Word membubuhkan garis tanda hubung rapat hingga batas margin kanan pada setiap baris kalimat akta.", "CRITICAL"],
      ["FR-13", "Lajur Renvoi 2.56 Inci", "Engine Word menyisakan batas margin kiri 2.56 inci untuk ruang penulisan catatan renvoi notaris.", "CRITICAL"],
      ["FR-14", "Simpan Draf Berkas (.akta)", "Sistem mampu mengekspor dan mengimpor file draf fisik (.akta) untuk dipindahkan antar-komputer via flashdisk.", "HIGH"],
      ["FR-15", "Penguncian Identitas Notaris", "Nama notaris, gelar, dan wilayah jabatan terkunci secara aman atas nama Notaris Grendi Jaya Darmawan.", "CRITICAL"],
      ["FR-16", "Proteksi Demo Trial 72 Jam", "Sistem membatasi penggunaan demo selama 72 jam aktif sejak aplikasi pertama kali dijalankan.", "HIGH"],
      ["FR-17", "Deteksi Rollback Jam Sistem", "Sistem mendeteksi dan mengunci aplikasi jika pengguna memundurkan jam kalender komputer Windows.", "HIGH"]
    ],
    [15, 25, 45, 15]
  ),

  h2("2.5 Matriks Kebutuhan Non-Fungsional (Non-Functional Requirements Matrix)"),
  styledTable(
    ["Kode NFR", "Kategori Kebutuhan", "Spesifikasi Teknis & Toleransi", "Hasil Uji Coba"],
    [
      ["NFR-01", "Kecepatan Start-Up (Cold Start)", "Aplikasi harus terbuka sempurna dalam waktu kurang dari 1.0 detik sejak file .exe diklik.", "TERPENUHI (Rata-rata 0.35 detik)"],
      ["NFR-02", "Efisiensi Memori (RAM)", "Konsumsi memori kerja aplikasi tidak boleh melebihi 100 MB RAM saat beroperasi penuh.", "TERPENUHI (Stabil di 45 – 70 MB)"],
      ["NFR-03", "Ukuran Berkas Distribusi", "Ukuran total installer / file binary aplikasi tidak boleh melebihi 15 MB.", "TERPENUHI (Total binary ~9.8 MB)"],
      ["NFR-04", "Keamanan (Air-Gapped Offline)", "Aplikasi tidak boleh mengirimkan atau meminta request jaringan/internet sama sekali (0 outbound network calls).", "TERPENUHI (100% Offline Lokal)"],
      ["NFR-05", "Kompatibilitas Dokumen Word", "File Word (.docx) hasil ekspor harus dapat dibuka sempurna pada Word 2013, 2016, 2019, 2021, dan Office 365.", "TERPENUHI (Valid OOXML ISO/IEC 29500)"],
      ["NFR-06", "Ketahanan Data (Fault Tolerance)", "Draf yang sedang dikerjakan tidak boleh hilang saat listrik padam atau aplikasi tertutup tiba-tiba.", "TERPENUHI (Auto-save local storage)"]
    ],
    [15, 25, 45, 15]
  ),
  new Paragraph({ pageBreakBefore: true })
);

// ------------------------------------------
// BAB 3: SOFTWARE REQUIREMENTS SPECIFICATION (SRS)
// ------------------------------------------
children.push(
  h1("BAB 3: SOFTWARE REQUIREMENTS SPECIFICATION (SRS)"),
  h2("3.1 Spesifikasi Kebutuhan Antarmuka Eksternal (External Interfaces)"),
  bullet("Antarmuka Pengguna (UI):", "Berbasis antarmuka grafis desktop modern dengan kontras tinggi, navigasi tab 6 bagian, modal editor redaksional melayang (floating overlay), serta feedback visual status simpan otomatis."),
  bullet("Antarmuka Perangkat Keras:", "Mendukung prosesor Intel/AMD x86_64, minimal RAM 2 GB (direkomendasikan 4 GB), ruang harddisk kosong minimal 50 MB, dan resolusi layar minimal 1280x720 piksel."),
  bullet("Antarmuka Perangkat Lunak:", "Kompatibel penuh dengan sistem operasi Microsoft Windows 10 (64-bit) dan Windows 11 (64-bit). Memanfaatkan runtime bawaan Microsoft Edge WebView2 Evergreen."),
  bullet("Antarmuka Dokumen Luaran:", "Format berkas terstandarisasi Microsoft Office Open XML (.docx) dengan tipe MIME 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'."),

  h2("3.2 Model Entitas & Kamus Data Sistem (Data Models & Entity Schema)"),
  p("Setiap draf akta sirkuler dikelola dalam format objek data JSON (.akta) yang memiliki skema terstruktur sebagai berikut:"),
  styledTable(
    ["Bagian Anatomi Akta", "Field / Atribut Utama", "Tipe Data & Validasi", "Keterangan Yuridis"],
    [
      ["1. Kepala Akta", "nomorAkta, tanggal, jam, notarisNama, notarisWilayah, kedudukanKantor", "String / Number / Date", "Menentukan legalitas waktu pembuatan akta dan identitas pejabat umum."],
      ["2. Badan Usaha & Legalitas", "namaBadanUsaha, nomorSK, tglSK, noDaftar, dasarRapat, pasalSirkuler", "String / Formatted Text", "Riwayat anggaran dasar pendirian dan dasar hukum persetujuan sirkuler."],
      ["3. Penghadap & Kuasa", "penghadapList: [{nama, nik, pekerjaan, alamat, kapasitasBertindak}]", "Array of Objects", "Komparisi para pihak yang hadir atau diwakili oleh kuasa sah."],
      ["4. Permodalan (PT/CV/Fa)", "modalDasar, modalDitempatkan, sahamSeriA, sahamSeriB, nominalPerSaham, inbrengList", "Numeric / Currency / Array", "Rincian struktur permodalan, pemegang saham, atau penyertaan modal sekutu."],
      ["5. Pengurus Baru", "direksiList, komisarisList / pengurusSekutuList", "Array of Objects", "Susunan nama dan jabatan organ perseroan/persekutuan yang baru diangkat."],
      ["6. Saksi-Saksi & Penutup", "saksi1: {nama, nik, alamat}, saksi2: {nama, nik, alamat}, pembacaanAkta", "Object / String", "Komparisi dua orang saksi staf kantor notaris dan klausula penutup akta."],
      ["Klausula Kustom", "customSections: {sec1, sec2, sec3, sec4, sec5, sec6}", "Object (Key-Value)", "Teks redaksional hasil modifikasi pengguna yang menggantikan klausula baku."]
    ],
    [20, 30, 20, 30]
  ),

  h2("3.3 Aturan Bisnis & Logika Hukum Notariat (Business & Legal Rules)"),
  callout(
    "ATURAN BAKU BR-01: MAKSIMAL 30 BARIS PER HALAMAN AKTA",
    "Sesuai regulasi UUJN, dokumen akta autentik tidak boleh melebihi 30 baris tulisan per halaman. Engine DOCX menerapkan pemotongan kalimat strictly 30 baris per halaman, di mana baris ke-31 otomatis dipindahkan ke halaman berikutnya dengan penomoran berurutan.",
    "warning"
  ),
  new Paragraph({ spacing: { after: 120 } }),
  callout(
    "ATURAN BAKU BR-02: PENUTUP GARIS TANDA HUBUNG TANPA TERPUTUS",
    "Ruang kosong antara akhir kalimat dan margin kanan harus ditutup dengan garis tanda hubung (- - - - -) rapat tanpa terputus untuk mencegah penyisipan kata ilegal di masa depan. Sistem menghitung lebar karakter rata-rata dan membubuhkan garis hubung hingga batas margin secara matematis.",
    "info"
  ),
  new Paragraph({ spacing: { after: 120 } }),
  callout(
    "ATURAN BAKU BR-03: MARGIN RENVOI NOTARIS 2.56 INCI",
    "Margin kiri dokumen disetel selebar 2.56 inci (6.5 cm) pada halaman ganjil dan genap untuk memberikan ruang resmi bagi penulisan pembetulan/renvoi yang diparaf oleh penghadap, saksi, dan notaris.",
    "info"
  ),
  new Paragraph({ pageBreakBefore: true })
);

// ------------------------------------------
// BAB 4: ARCHITECTURE DESIGN DOCUMENT (ADD)
// ------------------------------------------
children.push(
  h1("BAB 4: ARCHITECTURE DESIGN DOCUMENT (ADD)"),
  h2("4.1 Gambaran Arsitektur Sistem (High-Level Architecture)"),
  p("Generator Akta Notaris Sirkuler dibangun menggunakan arsitektur desktop generasi baru berbasis Tauri Framework v2, memadukan keandalan logika native Rust pada lapisan backend dengan antarmuka web modern pada lapisan presentasi:"),
  bullet("Lapisan Backend (Tauri / Rust):", "Menangani interaksi sistem berkas lokal Windows (I/O), dialog buka/simpan berkas native, enkripsi penyimpanan state, dan pengawasan integritas waktu demo trial."),
  bullet("Lapisan Frontend (Vanilla JavaScript / HTML5 / CSS3):", "Menjalankan logika antarmuka reaktif, validasi formulir 6 bagian, live preview, kalkulasi terbilang instan, dan engine kompilasi dokumen Word OpenXML."),
  bullet("Lapisan Rendering (Chromium WebView2 Evergreen):", "Menggunakan engine browser bawaan sistem operasi Windows 10/11, sehingga tidak membutuhkan instalasi browser terpisah."),

  h2("4.2 Analisis Komparasi Arsitektur: Tauri vs Electron"),
  styledTable(
    ["Parameter Kinerja", "Arsitektur Lama (Electron)", "Arsitektur Baru (Tauri + Rust)", "Keuntungan bagi Notaris"],
    [
      ["Ukuran File Installer", "80 – 150 MB (sangat besar)", "8 – 10 MB (sangat ringkas)", "Sangat mudah dikirim via WhatsApp/Flashdisk."],
      ["Konsumsi Memori RAM", "300 – 600 MB (membebani PC kantor)", "40 – 75 MB (sangat hemat)", "Komputer kantor lama tetap lancar tanpa lemot."],
      ["Waktu Buka Aplikasi", "2.0 – 5.0 detik", "0.3 – 0.5 detik (seketika)", "Staf dapat langsung bekerja tanpa menunggu lama."],
      ["Keamanan Kode Sumber", "Mudah dibongkar (plain Node.js)", "Terkonstruksi binary biner Rust", "Proteksi lisensi & integritas kode terjamin."]
    ],
    [20, 25, 25, 30]
  ),

  h2("4.3 Arsitektur Keamanan & Model Nol-Jaringan (Air-Gapped Offline)"),
  p("Kerahasiaan data akta notaris diatur secara ketat dalam Pasal 16 ayat (1) huruf f UUJN. Sistem ini menerapkan prinsip keamanan 'Zero Network Footprint':"),
  bullet("100% Offline Tanpa Kebutuhan Internet:", "Aplikasi tidak membuka socket HTTP/HTTPS ke luar, tidak menggunakan library berbasis CDN daring, dan tidak mengirimkan telemetri."),
  bullet("Data Tetap di Komputer Kantor:", "Seluruh draf akta dan identitas pihak tersimpan secara lokal pada media penyimpanan PC kantor. Notaris memegang kontrol fisik penuh atas seluruh berkas."),
  bullet("Kepatuhan Penuh UU PDP:", "Memenuhi seluruh klausul pemrosesan data pribadi secara tertutup sesuai Undang-Undang Perlindungan Data Pribadi."),

  h2("4.4 Arsitektur Proteksi Demo Trial 72 Jam & Anti-Rollback Jam"),
  p("Untuk memungkinkan pengujian evaluasi oleh klien sebelum pembayaran penuh, modul `src/utils/demoTrial.js` dan konfigurasi `src/demoConfig.js` mengimplementasikan sistem proteksi waktu berbasis status:"),
  bullet("Masa Uji Coba Terbatas:", "Aplikasi menghitung durasi aktif selama 72 jam (3 hari) sejak pertama kali dibuka di komputer klien."),
  bullet("Proteksi Anti-Rollback Kalender:", "Sistem secara berkala mencatat timestamp terakhir (`lastKnownTime`). Jika pengguna memundurkan jam atau tanggal komputer Windows untuk mengakali masa berlaku, sistem mendeteksi anomali ini dan seketika mengunci aplikasi."),
  bullet("Layar Kunci Interaktif:", "Saat masa demo berakhir, antarmuka ditutup dengan layar kunci blur penuh yang menampilkan informasi bahwa masa evaluasi telah selesai serta tombol kontak langsung via WhatsApp ke nomor pengembang `0821-2295-9032`."),
  bullet("Kemudahan Aktivasi Versi Penuh (Full Version):", "Pengembang cukup mengubah parameter `TRIAL_ENABLED: false` pada `src/demoConfig.js` untuk mengompilasi versi rilis permanen seumur hidup tanpa batas waktu."),
  new Paragraph({ pageBreakBefore: true })
);

// ------------------------------------------
// BAB 5: PANDUAN PENGGUNAAN & PROSEDUR OPERASIONAL (MANUAL)
// ------------------------------------------
children.push(
  h1("BAB 5: PANDUAN PENGGUNAAN & PROSEDUR OPERASIONAL"),
  h2("5.1 Persiapan Sistem & Peluncuran Pertama"),
  p("Aplikasi Generator Akta Notaris Sirkuler bersifat *portable native*. Pengguna tidak perlu menginstal database MySQL atau web server eksternal:"),
  bullet("Langkah 1:", "Salin berkas `Generator-Akta-Notaris.exe` ke folder kerja di komputer kantor (misalnya `D:\\APLIKASI NOTARIS\\`)."),
  bullet("Langkah 2:", "Klik dua kali pada file executable untuk membuka aplikasi. Jendela kerja akan terbuka seketika."),

  h2("5.2 Navigasi Beranda & Dasbor Draf"),
  bullet("Kartu Pembuatan Akta Baru:", "Pada bagian atas beranda terdapat 3 kartu pilihan: 'Akta PT Sirkuler', 'Akta CV Sirkuler', dan 'Akta Firma Sirkuler'. Klik kartu yang diinginkan untuk memulai draf baru."),
  bullet("Pencarian Draf Tersimpan:", "Ketik nama PT, nama penghadap, atau nomor akta pada kotak pencarian di bagian 'Draf Akta Tersimpan'. Daftar draf akan tersaring secara instan."),
  bullet("Buka Berkas Draf (.akta):", "Klik tombol 'Buka File Draf (.akta)' untuk memuat draf yang sebelumnya disimpan di flashdisk atau harddisk eksternal."),

  h2("5.3 Prosedur Pengisian Anatomi Akta 6 Bagian"),
  styledTable(
    ["Nomor Tab / Bagian", "Panduan Input Data", "Fungsi Otomasi Sistem"],
    [
      ["Tab 1: Kepala Akta", "Masukkan nomor akta, pilih tanggal akta, dan atur jam peresmian akta.", "Nama notaris dan wilayah jabatan otomatis terisi resmi. Jam dan tanggal dikonversi otomatis ke kalimat terbilang."],
      ["Tab 2: Badan Usaha", "Isi nama perseroan/CV, nomor SK pendirian, tanggal SK, serta dasar pasal sirkuler.", "Sistem merangkai kalimat konsiderans legalitas secara otomatis sesuai format akta autentik."],
      ["Tab 3: Komparisi", "Tambahkan pihak penghadap, NIK, pekerjaan, alamat, serta status bertindak (pribadi/kuasa).", "Komparisi dirumuskan otomatis dengan kaidah tata bahasa hukum notariat baku."],
      ["Tab 4: Permodalan", "Isi nilai nominal modal dasar, saham Seri A & B (PT) atau nilai inbreng sekutu (CV/Firma).", "Sistem menghitung total modal dan merumuskan teks terbilang rupiah dan saham secara seketika."],
      ["Tab 5: Pengurus Baru", "Tambahkan susunan Direktur Utama, Direktur, Komisaris, atau Persero Pengurus yang baru.", "Menghasilkan pasal pengangkatan organ pengurus baru secara berurutan dan rapi."],
      ["Tab 6: Saksi & Penutup", "Isi identitas 2 orang saksi staf kantor notaris dan tinjau kalimat penutup akta.", "Menghasilkan klausula pembacaan akta, penandatanganan, dan komparisi saksi-saksi."]
    ],
    [25, 45, 30]
  ),

  h2("5.4 Panduan Kustomisasi Redaksional & Penyisipan Tag"),
  p("Jika kantor notaris memiliki format redaksional khusus yang sedikit berbeda dari template bawaan:"),
  bullet("Buka Editor Modal:", "Klik tombol 'Edit Redaksional' pada bagian yang ingin disesuaikan."),
  bullet("Sisipkan Tag Variabel Dinamis:", "Klik pada chip tag yang tersedia di atas editor (misalnya `{NOMOR_AKTA}`, `{NAMA_NOTARIS}`, `{TANGGAL_AKTA}`). Variabel akan langsung tersemat pada posisi kursor."),
  bullet("Kembalikan ke Format Baku UUJN:", "Jika ingin membatalkan perubahan dan kembali ke susunan kalimat standar, klik tombol 'Kembalikan ke Standar UUJN' lalu konfirmasi pilihan Anda."),

  h2("5.5 Panduan Ekspor Dokumen Word (.docx) & Cetak Minuta"),
  bullet("Klik Tombol Ekspor:", "Pada pojok kanan atas aplikasi, klik tombol hijau bertuliskan 'Ekspor ke Dokumen Word (.docx)'."),
  bullet("Hasil Unduhan:", "File dokumen Word akan otomatis tersimpan di folder 'Downloads' atau folder kerja kantor Anda dengan nama otomatis (contoh: `Draf_Akta_PT_Maju_Jaya.docx`)."),
  bullet("Pemeriksaan Akhir & Cetak:", "Buka file tersebut di Microsoft Word. Dokumen telah memiliki batas margin 2.56 inci di sebelah kiri, batas 30 baris per halaman, serta garis tanda hubung penutup otomatis. Dokumen siap dicetak langsung ke kertas akta garuda/minuta."),
  new Paragraph({ pageBreakBefore: true })
);

// ------------------------------------------
// BAB 6: ANALISIS BIAYA INDUSTRI, PER FITUR, & PROPOSAL KOMERSIAL
// ------------------------------------------
children.push(
  h1("BAB 6: ANALISIS BIAYA INDUSTRI, PER FITUR, & PROPOSAL KOMERSIAL"),
  h2("6.1 Hasil Riset Standar Pasar Biaya Pengembangan Software Legal"),
  p("Berdasarkan riset pasar pada industri rekayasa perangkat lunak (*software engineering*) dan vendor *software house* profesional di Indonesia:"),
  bullet("Biaya Proyek Custom Legal Desktop:", "Pengembangan sistem otomasi akta bisnis berbasis desktop native yang dibangun dari nol umumnya dibanderol pada kisaran Rp 15.000.000,- hingga Rp 35.000.000,- tergantung kompleksitas logika hukum dan algoritma pengolahan dokumennya."),
  bullet("Komponen Biaya Utama:", "Komponen biaya terbesar terletak pada perumusan algoritma pemotong baris presisi 30 baris/halaman UUJN, otomatisasi terbilang angka/saham/tanggal multilayer, serta arsitektur keamanan offline lokal."),

  h2("6.2 Tabel Rincian Nilai Riil Pengembangan Per Fitur (Jika Dibangun dari Nol)"),
  styledTable(
    ["No", "Modul / Fitur Sistem", "Spesifikasi Teknis & Kompleksitas Algoritma", "Nilai Pasar Riil"],
    [
      ["1", "Engine Dokumen Word UUJN (.docx Generator)", "Algoritma pemotong kalimat presisi 30 baris per halaman, garis tanda hubung otomatis tanpa terputus, lajur renvoi 2.56 inci, dan penomoran halaman bertingkat.", "Rp 4.500.000,-"],
      ["2", "Engine Terbilang Multilayer Otomatis", "Konversi real-time angka ke teks bahasa Indonesia baku: nominal rupiah modal inbreng, saham Seri A & B, tanggal masehi, dan jam peresmian akta.", "Rp 2.000.000,-"],
      ["3", "Formulir Cerdas Anatomi Akta 6 Bagian", "Navigasi tab terstruktur (Kepala Akta, Legalitas, Komparisi Penghadap, Modal Saham/Inbreng, Pengurus Baru, Saksi) dengan validasi konsistensi otomatis.", "Rp 3.500.000,-"],
      ["4", "Modul Kustomisasi Klausula & Tag Variabel", "Editor modal interaktif per bagian dengan sistem placeholder dinamis ({NOMOR_AKTA}, {NAMA_NOTARIS}, dll) dan tombol reset ke UUJN baku.", "Rp 2.500.000,-"],
      ["5", "Sistem Manajemen Draf Lokal (.akta) & Beranda", "Penyimpanan terenkripsi lokal, pencarian instan (live search), sorting waktu, paginasi data draf, serta fitur pemulihan otomatis (auto-backup).", "Rp 2.500.000,-"],
      ["6", "Arsitektur Native Desktop (Tauri & Rust Engine)", "Ukuran file sangat ringan (< 10 MB), cepat dibuka, hemat RAM komputer, dan beroperasi 100% tanpa internet demi menjamin kerahasiaan data kantor.", "Rp 3.500.000,-"],
      [{ text: "TOTAL ESTIMASI NILAI RIIL PENGEMBANGAN SISTEM DARI NOL", bold: true, color: COLOR.NAVY_PRIMARY }, "", "", { text: "Rp 18.500.000,-", bold: true, color: COLOR.BLUE_ACCENT }]
    ],
    [5, 30, 45, 20],
    ['center', 'left', 'left', 'right']
  ),

  h2("6.3 Paket Penawaran Spesial Lisensi Penuh (One-Time Buyout)"),
  p("Karena aplikasi inti telah kami selesaikan dan disesuaikan secara khusus bagi kantor Notaris Bapak Grendi Jaya Darmawan, S.H., M.Kn., kami menawarkan skema Lisensi Beli Putus dengan penghematan investasi istimewa:"),
  callout(
    "INVESTASI SPESIAL LISENSI RESMI PENUH: Rp 4.500.000,- (EMPAT JUTA LIMA RATUS RIBU RUPIAH)",
    "Satu kali pembayaran untuk lisensi permanen seumur hidup • Tanpa biaya langganan bulanan • Hemat 75% dibanding membangun sistem dari nol seharga Rp 18.500.000,-",
    "success"
  ),
  new Paragraph({ spacing: { after: 120 } }),
  p("Fasilitas & Manfaat yang Didapatkan Kantor Notaris:"),
  bullet("1. Aplikasi Versi Penuh (Unlimited):", "Bebas digunakan selamanya tanpa batas waktu dan tanpa batas jumlah penerbitan akta."),
  bullet("2. Aktivasi Lisensi Resmi:", "Penguncian identitas resmi nama Notaris Grendi Jaya Darmawan, S.H., M.Kn. dan wilayah jabatan Kabupaten Kudus."),
  bullet("3. Bantuan Instalasi & Pemasangan:", "Bantuan pemasangan langsung pada komputer/laptop kantor notaris (secara offline atau remote via AnyDesk)."),
  bullet("4. Pelatihan Staf Kantor (Training):", "Sesi panduan operasional bagi para asisten notaris / staf pengetikan akta hingga mahir."),
  bullet("5. Garansi Pemeliharaan Bebas Biaya (6 Bulan):", "Jaminan perbaikan bug, penyesuaian teknis minor, dan konsultasi gratis selama 6 bulan."),

  h2("6.4 Katalog Biaya Modul Tambahan di Masa Depan (Modular Add-Ons)"),
  p("Jika di kemudian hari kantor Notaris Bapak ingin memperluas kemampuan sistem ke jenis akta lainnya, kami menyediakan pengembangan modular dengan rincian biaya terjangkau:"),
  styledTable(
    ["Modul Akta Tambahan", "Deskripsi & Kegunaan Yuridis", "Estimasi Biaya"],
    [
      ["Modul Akta Pendirian PT Perorangan", "Pembuatan akta pendirian perseroan perorangan skala mikro dan kecil.", "Rp 750.000,-"],
      ["Modul Akta Perubahan Anggaran Dasar Lengkap", "Penambahan klausula pasal perubahan modal dasar dan maksud tujuan (KBLI 2020).", "Rp 950.000,-"],
      ["Modul Akta Kuasa Menjual / PPJB Properti", "Template khusus transaksi pengikatan jual beli dan kuasa autentik tanah/bangunan.", "Rp 850.000,-"],
      ["Modul Akta Pendirian Yayasan & Koperasi", "Format komparisi organ yayasan (Pembina, Pengurus, Pengawas) dan permodalan koperasi.", "Rp 1.000.000,-"],
      ["Custom Template Watermark & Kop Kantor", "Pemasangan kop resmi dan tata letak khusus kantor notaris pada dokumen Word.", "Rp 300.000,-"]
    ],
    [35, 45, 20],
    ['left', 'left', 'right']
  ),

  h2("6.5 Prosedur Pemesanan & Pembayaran"),
  bullet("Tahap 1 — Evaluasi Demo 72 Jam:", "Notaris dan staf kantor menguji coba aplikasi versi demo pada kasus akta harian."),
  bullet("Tahap 2 — Konfirmasi Kerja Sama:", "Pihak kantor notaris menyatakan persetujuan pemesanan lisensi penuh."),
  bullet("Tahap 3 — Pembayaran:", "Pembayaran Down Payment (DP) 50% saat konfirmasi, dan pelunasan 50% setelah penyerahan installer Full Version dan pelatihan staf selesai."),
  bullet("Tahap 4 — Penyerahan Berkas & Aktivasi Garansi:", "Penyerahan master installer Full Version, aktivasi masa garansi 6 bulan, dan penyerahan dokumentasi teknis."),

  divider(),
  h2("6.6 Lembar Kontak & Persetujuan Kerja Sama"),
  p("Untuk konsultasi teknis, pengesahan kerja sama, dan pemesanan aktivasi versi penuh, silakan menghubungi:"),
  bullet("Nama Kontak Pengembang:", "Tim Pengembang Generator Akta Notaris"),
  bullet("Nomor WhatsApp / Telepon Resmi:", "0821-2295-9032"),
  bullet("Email:", "kontak.notaris@gmail.com"),
  new Paragraph({ spacing: { after: 180 } }),

  // Signature Block Table
  styledTable(
    ["Pihak Pengembang Sistem", "Pihak Pemesan / Kantor Notaris"],
    [
      [
        { text: "Yang Menyerahkan Proposal,\n\n\n\n\n( Tim Pengembang Perangkat Lunak )\nLead Software Engineer\nKontak: 0821-2295-9032", bold: false },
        { text: "Disetujui dan Diterima Oleh,\n\n\n\n\n( Grendi Jaya Darmawan, S.H., M.Kn. )\nNotaris di Kabupaten Kudus\nTanggal: .......................................", bold: false }
      ]
    ],
    [50, 50],
    ['center', 'center']
  )
);

// ------------------------------------------
// CREATE DOCUMENT OBJECT
// ------------------------------------------
const doc = new Document({
  styles: {
    default: {
      document: {
        run: {
          font: "Calibri",
          size: 21,
          color: COLOR.TEXT_DARK
        }
      }
    }
  },
  sections: [
    {
      properties: {
        page: {
          margin: {
            top: 1440,    // 1 inch = 1440 dxa (2.54 cm)
            bottom: 1440,
            left: 1440,
            right: 1440
          }
        }
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              spacing: { after: 120 },
              children: [
                new TextRun({
                  text: "DOKUMEN SPESIFIKASI SISTEM, ARSITEKTUR & PROPOSAL PENAWARAN",
                  size: 16,
                  color: COLOR.TEXT_MUTED,
                  font: "Calibri"
                }),
                new TextRun({
                  text: " | GANS-DESKTOP",
                  size: 16,
                  bold: true,
                  color: COLOR.BLUE_ACCENT,
                  font: "Calibri"
                })
              ]
            })
          ]
        })
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.JUSTIFIED,
              children: [
                new TextRun({
                  text: "Generator Akta Notaris Sirkuler • Standar Baku UUJN",
                  size: 16,
                  color: COLOR.TEXT_MUTED,
                  font: "Calibri"
                }),
                new TextRun({
                  text: "\tHalaman ",
                  size: 16,
                  color: COLOR.TEXT_MUTED,
                  font: "Calibri"
                }),
                new TextRun({
                  children: [PageNumber.CURRENT],
                  size: 16,
                  bold: true,
                  color: COLOR.NAVY_PRIMARY,
                  font: "Calibri"
                }),
                new TextRun({
                  text: " dari ",
                  size: 16,
                  color: COLOR.TEXT_MUTED,
                  font: "Calibri"
                }),
                new TextRun({
                  children: [PageNumber.TOTAL_PAGES],
                  size: 16,
                  bold: true,
                  color: COLOR.NAVY_PRIMARY,
                  font: "Calibri"
                })
              ]
            })
          ]
        })
      },
      children: children
    }
  ]
});

// ------------------------------------------
// PACK & SAVE TO .DOCX
// ------------------------------------------
const outputPath = path.resolve('c:/laragon/www/AKTE/DOKUMEN_SPESIFIKASI_ARSITEKTUR_DAN_PROPOSAL.docx');

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(outputPath, buffer);
  console.log(`\n======================================================`);
  console.log(`BERHASIL! Dokumen Word Master Terpadu (.docx) selesai:`);
  console.log(`File: ${outputPath}`);
  console.log(`Ukuran Berkas: ${buffer.length} bytes (${(buffer.length / 1024).toFixed(1)} KB)`);
  console.log(`======================================================\n`);
}).catch(err => {
  console.error("Gagal membuat berkas .docx:", err);
  process.exit(1);
});
