# PROPOSAL PENAWARAN SISTEM & BIAYA PENGEMBANGAN
## APLIKASI GENERATOR AKTA NOTARIS SIRKULER (STANDAR UUJN)
**Solusi Otomasi Pembuatan Akta Notaris Bebas Typo, Presisi 30 Baris, & Efisiensi Kantor Notaris**

---

* **Disiapkan Oleh:** Tim Pengembang Sistem (*Software Developer*)  
* **Kontak / WhatsApp:** 0821-2295-9032  
* **Ditujukan Kepada:** Kantor Notaris & PPAT  
* **Perihal:** Penawaran Lisensi & Pengembangan Perangkat Lunak Generator Akta  
* **Tanggal:** 20 Oktober 2026  
* **Versi Dokumen:** 1.0 (Proposal Resmi)

---

## 1. RINGKASAN EKSEKUTIF (EXECUTIVE SUMMARY)

Dalam operasional kantor Notaris, penyusunan **Akta Pernyataan Keputusan Sirkuler** (baik untuk Perseroan Terbatas / PT, Persekutuan Komanditer / CV, maupun Persekutuan Firma / FA) menuntut ketelitian hukum yang sangat tinggi. Proses manual sering kali memakan waktu berjam-jam karena staf harus mengetik ulang komparisi para pihak, menghitung terbilang saham dan rupiah secara manual, menyesuaikan batas margin renvoi, serta memastikan teks pas 30 baris per halaman sesuai standar baku Undang-Undang Jabatan Notaris (UUJN).

Aplikasi **Generator Akta Notaris Sirkuler** hadir sebagai solusi teknologi desktop terpadu yang dirancang khusus untuk memotong waktu penyusunan minuta dan salinan akta dari **2–3 jam menjadi hanya 5 menit**, dengan jaminan **100% bebas salah ketik (*zero typo*)** pada angka, tanggal, dan nama komparisi.

Aplikasi ini bekerja secara **100% Offline (Lokal)** di komputer kantor, menjamin kerahasiaan data para penghadap tanpa risiko kebocoran data ke internet.

---

## 2. LATAR BELAKANG & ANALISIS MASALAH

Berdasarkan studi kasus langsung pada alur kerja staf kantor notaris, terdapat 4 kendala utama pengetikan akta konvensional:

1. **Tingginya Risiko Typo Terbilang & Tanggal:**
   Kesalahan penulisan tanggal akta, jam, angka saham, atau nominal modal inbreng dapat berakibat fatal pada keabsahan akta autentik.
2. **Pemformatan Garis Penghubung & 30 Baris yang Melelahkan:**
   Format akta notaris mewajibkan batas garis tanda hubung (`---`) di akhir kalimat serta kepatuhan ketat 30 baris per halaman cetak agar pas pada kertas akta / kertas garuda. Penataan manual di Microsoft Word sangat rentan bergeser.
3. **Penyalinan Data Legalitas Lama Berulang Kali:**
   Data nomor SK Menkumham pendirian, tanggal akta perubahan lama, dan komparisi direksi sering kali harus disalin ulang berkali-kali secara manual.
4. **Variasi Kalimat Klausula Kantor:**
   Setiap kantor notaris memiliki kebiasaan atau preferensi redaksional baku yang berbeda-beda, sehingga template kaku sering kali tidak cocok.

---

## 3. NILAI TAMBAH & KEUNGGULAN SISTEM (VALUE PROPOSITION)

| Fitur Unggulan | Manfaat Nyata Bagi Kantor Notaris |
| :--- | :--- |
| **Presisi Format UUJN Pas 30 Baris** | Dokumen Word langsung memiliki margin akta (lajur renvoi 2.56 inci), tepat 30 baris per halaman, garis tanda hubung otomatis tanpa putus. |
| **Otomasi Terbilang Multilayer** | Angka rupiah, jumlah lembar saham Seri A & B, jam pelaksanaan, hingga tanggal masehi dieja otomatis dalam bahasa Indonesia baku. |
| **Kustomisasi Redaksional per Draf** | Notaris dapat mengubah kalimat pengantar/klausula baku per bagian akta dengan sistem *tag variabel* dinamis `{NOMOR_AKTA}`, `{NAMA_NOTARIS}`, dll. |
| **Penyimpanan Draf Aman (.akta)** | Draf pengerjaan dapat disimpan, diedit kembali kapan saja, dan diarsipkan dalam folder komputer tanpa database pihak ketiga. |
| **Privasi 100% Offline (Native App)** | Dibangun dengan teknologi **Tauri & Rust**, sangat ringan (< 10 MB), cepat dibuka, dan tidak memerlukan koneksi internet sama sekali. |

---

## 4. RUANG LINGKUP MODUL & FITUR (SCOPE OF FEATURES)

### Modul 1: Beranda & Manajemen Draf Terpadu
* Dasbor pembuatan akta baru berbasis kartu bentuk usaha (PT, CV, Firma).
* Daftar riwayat draf tersimpan dilengkapi pencarian instan (*live search*), sorting berdasarkan tanggal/nama, dan paginasi rapi.
* Dukungan buka berkas draf dari media eksternal (Flashdisk / Harddisk).

### Modul 2: Formulir Pengerjaan Anatomi Akta 6 Bagian
1. **Bagian 1: Kepala Akta & Notaris:** Nomor akta, tanggal, jam, identitas notaris, dan wilayah jabatan.
2. **Bagian 2: Badan Usaha & Riwayat Legalitas:** Anggaran dasar pendirian, SK Menkumham SABU, nomor perubahan, serta dasar pasal sirkuler.
3. **Bagian 3: Identitas Penghadap / Kuasa:** Komparisi lengkap penghadap, NIK, pekerjaan, dan alamat domisili.
4. **Bagian 4: Struktur Permodalan & Keputusan:** Otomasi saham Seri A/B (PT) atau nominal modal inbreng sekutu (CV/Firma).
5. **Bagian 5: Susunan Pengurus Baru:** Entri dinamis direksi, komisaris, atau persero pengurus baru.
6. **Bagian 6: Komparisi Saksi-Saksi Akta:** Entri 2 saksi staf kantor notaris dan klausula penutup akta.

### Modul 3: Editor Kustomisasi Redaksional Klausula
* Modal editor teks khusus per bagian akta.
* *Chips tag variabel* yang dapat diklik untuk langsung menyisipkan variabel ke kursor.
* Tombol *Kembalikan ke Standar UUJN* dengan pengaman dialog konfirmasi.

### Modul 4: Ekspor Dokumen Word (.docx) Otomatis
* Konversi instan menjadi file Word asli tanpa perlu aplikasi pihak ketiga.
* Siap cetak langsung ke kertas minuta atau salinan akta notaris.

---

## 5. STANDAR BIAYA INDUSTRI & RINCIAN PER FITUR (MARKET RESEARCH & QUOTATION)

Berdasarkan riset standar industri rekayasa perangkat lunak (*software engineering*) di Indonesia untuk pengembangan aplikasi desktop kustom (*custom desktop software*) pada sektor hukum/legal:
* Tarif pengerjaan perangkat lunak bisnis legal berkisar antara **Rp 15.000.000,- hingga Rp 35.000.000,-**.
* Nilai per modul dihitung berdasarkan kompleksitas algoritma perumusan dokumen, otomatisasi terbilang angka/waktu, dan jaminan keamanan data offline.

### A. Rincian Nilai Riil Pengembangan Per Fitur (Jika Dibangun dari Nol)

| No | Modul / Fitur Sistem | Spesifikasi & Kompleksitas Logika | Nilai Riil Pasar |
| :---: | :--- | :--- | :---: |
| 1 | **Engine Dokumen Word UUJN (.docx Generator)** | Algoritma pemotong kalimat presisi 30 baris per halaman, garis tanda hubung otomatis tanpa terputus, lajur renvoi 2.56 inci, dan penomoran halaman bertingkat. | Rp 4.500.000,- |
| 2 | **Engine Terbilang Multilayer Otomatis** | Konversi real-time angka ke teks bahasa Indonesia baku: nominal rupiah modal inbreng, saham Seri A & B, tanggal masehi, dan jam peresmian akta. | Rp 2.000.000,- |
| 3 | **Formulir Cerdas Anatomi Akta 6 Bagian** | Navigasi tab terstruktur (Kepala Akta, Legalitas, Komparisi Penghadap, Modal Saham/Inbreng, Pengurus Baru, Saksi) dengan validasi konsistensi otomatis. | Rp 3.500.000,- |
| 4 | **Modul Kustomisasi Klausula & Tag Variabel** | Editor modal interaktif per bagian dengan sistem placeholder dinamis (`{NOMOR_AKTA}`, `{NAMA_NOTARIS}`, dll) dan tombol reset ke UUJN baku. | Rp 2.500.000,- |
| 5 | **Sistem Manajemen Draf Lokal (.akta) & Beranda** | Penyimpanan terenkripsi lokal, pencarian instan (*live search*), sorting waktu, paginasi data draf, serta fitur pemulihan otomatis (*auto-backup*). | Rp 2.500.000,- |
| 6 | **Arsitektur Native Desktop (Tauri & Rust Engine)** | Ukuran file sangat ringan (< 10 MB), cepat dibuka, hemat RAM komputer, dan beroperasi 100% tanpa internet demi menjamin kerahasiaan data kantor. | Rp 3.500.000,- |
| | **TOTAL ESTIMASI NILAI PENGEMBANGAN DARI NOL** | | **Rp 18.500.000,-** |

---

### B. PAKET PENAWARAN SPESIAL LISENSI PENUH (ONE-TIME PURCHASE / BUYOUT)

Karena aplikasi inti telah kami selesaikan dan disesuaikan secara presisi untuk kantor Notaris Bapak, kami menawarkan skema **Lisensi Beli Putus (*Full License*)** dengan potongan investasi istimewa:

> **Investasi Lisensi Penuh:** **Rp 4.500.000,-** *(Empat Juta Lima Ratus Ribu Rupiah)*  
> *(Satu kali pembayaran / Beli Putus — Tanpa Biaya Langganan Bulanan / Unlimited Masa Pakai)*

**Fasilitas yang Didapatkan:**
1. **Aplikasi Versi Full (Unlimited):** Tanpa batas waktu (seumur hidup), tanpa batas jumlah pengerjaan akta.
2. **Aktivasi Lisensi Resmi:** Penguncian identitas kantor notaris resmi (*Notaris Grendi Jaya Darmawan, S.H., M.Kn.*).
3. **Pemasangan & Instalasi:** Bantuan instalasi langsung di laptop/PC kantor notaris (offline atau remote AnyDesk/TeamViewer).
4. **Pelatihan Staf (*Training*):** Sesi demo dan panduan operasional staf hingga mahir (1–2 jam).
5. **Garansi & Pemeliharaan Bebas Biaya (6 Bulan):** Perbaikan *bug*, kendala teknis, atau penyesuaian format minor secara gratis.

---

### PAKET PENGEMBANGAN FITUR TAMBAHAN (MODULAR ADD-ONS)
Jika di masa depan kantor Anda ingin memperluas kemampuan aplikasi untuk menangani jenis akta notaris lainnya, kami menyediakan pengembangan modular dengan rincian biaya terjangkau:

| Modul Akta Tambahan | Deskripsi & Kegunaan | Estimasi Biaya |
| :--- | :--- | :---: |
| **Modul Akta Pendirian PT Perorangan** | Pembuatan akta pendirian perseroan perorangan skala mikro/kecil. | Rp 750.000,- |
| **Modul Akta Perubahan Anggaran Dasar Lengkap** | Penambahan klausula pasal-pasal perubahan modal dasar & maksud tujuan (KBLI). | Rp 950.000,- |
| **Modul Akta Kuasa Menjual / Pengikatan Jual Beli (PPJB)** | Template khusus transaksi properti dan kuasa autentik. | Rp 850.000,- |
| **Modul Akta Pendirian Yayasan / Koperasi** | Format komparisi organ yayasan (Pembina, Pengurus, Pengawas). | Rp 1.000.000,- |
| **Custom Template Logo & Watermark Kop Kantor** | Pemasangan kop resmi dan tata letak khusus kantor notaris pada Word. | Rp 300.000,- |

---

## 6. KETENTUAN MASA UJI COBA DEMO (TRIAL TERMS)

1. **Aplikasi Demo yang Diserahkan:**
   Aplikasi yang saat ini diserahkan merupakan **Versi Demo Eksklusif** dengan durasi pengerjaan aktif selama **72 jam (3 hari)** sejak pertama kali dibuka di komputer kantor Anda.
2. **Fungsi Penuh Selama Demo:**
   Seluruh fitur (input form, kustomisasi klausula, simpan draf, hingga ekspor dokumen Word asli) dapat diuji coba secara nyata pada kasus pengerjaan akta harian kantor Anda.
3. **Aktivasi Versi Penuh:**
   Setelah masa uji coba selesai atau saat kantor Anda siap melakukan pengesahan kerja sama, kami akan mengirimkan file binary rilis resmi **Full Version (Tanpa Batas Waktu)** dalam waktu maksimal 1x24 jam setelah konfirmasi.

---

## 7. PROSEDUR PEMESANAN & PEMBAYARAN

1. **Tahap 1 — Evaluasi Demo:** Notaris dan staf kantor menguji coba aplikasi demo.
2. **Tahap 2 — Konfirmasi & Penandatanganan:** Notaris mengonfirmasi paket lisensi yang dipilih.
3. **Tahap 3 — Pembayaran:**
   * Uang muka (*Down Payment*) 50% saat konfirmasi.
   * Pelunasan 50% setelah penyerahan installer Full Version dan pelatihan staf selesai.
4. **Tahap 4 — Serah Terima Dokumen & Garansi:** Penyerahan dokumen lisensi resmi, panduan teknis, dan aktivasi masa garansi 6 bulan.

---

## 8. LEMBAR KONTAK & PERSETUJUAN

Apabila Bapak/Ibu Notaris menyetujui penawaran ini atau memerlukan konsultasi teknis lebih lanjut, silakan menghubungi:

* **Nama Kontak:** Pengembang Sistem Generator Akta Notaris  
* **Nomor WhatsApp / HP:** **0821-2295-9032**  
* **Email:** kontak.notaris@gmail.com  

Kami berkomitmen memberikan solusi digital terbaik guna meningkatkan kecepatan, akurasi, dan prestise kantor Notaris Bapak/Ibu.

---

*Hormat kami,*

**Tim Pengembang Sistem Aplikasi Generator Akta Notaris**
