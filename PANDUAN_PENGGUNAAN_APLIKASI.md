# BUKU PANDUAN PENGGUNAAN SISTEM (USER MANUAL GUIDE)
## APLIKASI GENERATOR AKTA NOTARIS KEPUTUSAN SIRKULER
**Standar Format Baku UUJN — Presisi 30 Baris & Otomasi Bebas Typo**

---

* **Versi Aplikasi:** 1.0.0 (Edisi Desktop Portable)  
* **Penyusun:** Tim Pengembang Perangkat Lunak  
* **Layanan Bantuan / WhatsApp:** 0821-2295-9032  
* **Format Dokumen Output:** Microsoft Word (.docx) & Berkas Draf (.akta)

---

## 1. PENDAHULUAN & SPESIFIKASI SISTEM

Aplikasi **Generator Akta Notaris Sirkuler** adalah perangkat lunak desktop mandiri (*standalone portable*) yang dirancang khusus untuk mempermudah kantor notaris dalam memproduksi minuta dan salinan akta pernyataan keputusan sirkuler (PT, CV, dan Firma) secara cepat, presisi, dan terhindar dari kesalahan pengetikan manual.

### Keunggulan Sistem:
* **Portable (Tanpa Perlu Instalasi Rumit):** Cukup klik dua kali file `.exe` untuk langsung bekerja.
* **100% Offline & Aman:** Tidak membutuhkan jaringan internet. Data akta dan identitas klien kantor Anda tersimpan seutuhnya di komputer kantor Anda sendiri.
* **Format Baku UUJN:** Lajur renvoi (catatan pinggir) 2.56 inci, pas 30 baris per halaman, garis penutup tanda hubung otomatis tanpa terputus, dan nomor halaman bertingkat.

### Spesifikasi Komputer yang Dibutuhkan:
* **Sistem Operasi:** Windows 10 atau Windows 11 (64-bit).
* **Perangkat Lunak Pendukung:** Microsoft Word (versi 2013, 2016, 2019, 2021, atau Microsoft 365) untuk membuka hasil berkas `.docx`.
* **Kebutuhan RAM & Ruang Disk:** Minimal RAM 2 GB, ruang kosong disk 50 MB.

---

## 2. CARA MENJALANKAN APLIKASI PERTAMA KALI

1. Letakkan berkas **`GeneratorAktaSirkuler.exe`** di folder yang Anda inginkan (misal di Desktop atau folder kerja Notaris).
2. Klik dua kali (*double click*) pada ikon aplikasi.
3. Aplikasi akan langsung terbuka menampilkan **Beranda Pengerjaan Akta**.
4. **Indikator Masa Uji Coba Demo:**
   Pada bilah navigasi atas, terdapat badge waktu mundur (contoh: `⏱️ Demo: 3 Hari Tersisa`). Waktu 72 jam dihitung otomatis sejak pertama kali Anda membuka program ini.

---

## 3. PANDUAN ALUR PENGERJAAN AKTA (USE CASES)

---

### USE CASE 1: UJI COBA CEPAT DALAM 1 MENIT (FITUR "MUAT CONTOH")

Jika Anda ingin langsung melihat bagaimana bentuk formulir dan bagaimana dokumen Word dihasilkan tanpa perlu mengetik dari awal:

1. Di **Beranda**, klik tombol **`+ Buat Akta PT`** (atau CV / Firma).
2. Di bilah navigasi atas, klik tombol **`⚡ Muat Contoh`**.
3. Formulir akan otomatis terisi lengkap dengan contoh data nyata (PT Sehat Dan Bahagia Selalu).
4. Klik tombol hijau **`⚡ Buat Dokumen Word (.docx)`** di pojok kanan atas.
5. Dokumen Word siap cetak akan otomatis terunduh/tersimpan di komputer Anda dan siap dibuka di Microsoft Word!

---

### USE CASE 2: MEMBUAT DRAF AKTA BARU DARI NOL

Berikut adalah alur pengerjaan akta harian kantor notaris:

#### Langkah 1: Pilih Bentuk Badan Usaha
* Pada halaman Beranda, pilih salah satu bentuk badan usaha:
  * **🏢 Perseroan Terbatas (PT):** Menangani keputusan sirkuler pemegang saham (Saham Seri A & Seri B, Direksi, dan Dewan Komisaris).
  * **🤝 Persekutuan Komanditer (CV):** Menangani keputusan para pesero CV (Modal Inbreng Rupiah, Persero Pengurus & Komanditer).
  * **⚖️ Persekutuan Firma (FA):** Menangani keputusan para pesero firma (Tanggung renteng, modal inbreng, pesero pengurus).

#### Langkah 2: Mengisi Tab 1 — Data Kepala Akta & Notaris
* **Nomor Akta:** Masukkan nomor akta (contoh: `23`).
* **Hari, Tanggal & Jam Akta:** Pilih tanggal dan jam. Di bawah kolom tanggal, sistem akan otomatis menampilkan kalimat terbilang masehi lengkap (contoh: *selasa, lima belas september dua ribu dua puluh enam*).
* **Identitas Notaris:** Nama Notaris terkunci otomatis sesuai lisensi kantor Anda (*GRENDI JAYA DARMAWAN*). Anda dapat menyesuaikan wilayah jabatan notaris (contoh: *Kabupaten Kudus*).

#### Langkah 3: Mengisi Tab 2 — Badan Usaha & Riwayat Legalitas
* Masukkan nama perseroan/persekutuan dan kedudukan kota/kabupaten.
* Masukkan riwayat Akta Pendirian dan Akta Perubahan terakhir (nomor akta, tanggal, nama notaris terdahulu, nomor SK Menkumham/SABU).
* Kolom ini akan otomatis disusun menjadi kalimat komparisi legalitas baku notaris.

#### Langkah 4: Mengisi Tab 3 — Identitas Penghadap
* Masukkan data orang yang menghadap (Direktur / Kuasa Pemegang Saham).
* Isi tempat/tanggal lahir, NIK KTP, pekerjaan, dan alamat tempat tinggal lengkap.

#### Langkah 5: Mengisi Tab 4 — Struktur Modal & Keputusan Sirkuler
* **Untuk PT:**
  * Masukkan total modal saham Seri A dan Seri B.
  * Masukkan daftar pemegang saham penandatangan keputusan sirkuler dengan menekan tombol **`+ Tambah Pemegang Saham`**.
* **Untuk CV / Firma:**
  * Masukkan total nominal modal inbreng (Rp).
  * Masukkan nama sekutu dan persentase kepemilikan modal.
* Seluruh nominal rupiah otomatis dihitung kalimat terbilangnya di bawah kolom input.

#### Langkah 6: Mengisi Tab 5 — Susunan Pengurus Baru
* Masukkan susunan pengurus baru yang diangkat dalam keputusan sirkuler (contoh: Direktur Utama, Direktur, Komisaris).
* Klik tombol **`+ Tambah Pengurus Baru`** untuk menambah baris jabatan berikutnya.

#### Langkah 7: Mengisi Tab 6 — Saksi-Saksi Akta
* Masukkan identitas 2 orang saksi staf kantor notaris yang menghadiri dan menandatangani akta.

---

### USE CASE 3: MENYESUAIKAN / MENGUBAH TEKS KLAUSULA (KUSTOMISASI REDAKSIONAL)

Jika kantor notaris Anda memiliki gaya bahasa atau kalimat pengantar khusus yang berbeda dari standar:

1. Di setiap bagian pengerjaan, perhatikan kotak **Live Preview** di bagian bawah.
2. Klik tombol **`✏️ Kustomisasi Redaksional`**.
3. Jendela editor klausula akan terbuka:
   * Anda bebas mengedit kalimat, menambah poin baru, atau mengubah susunan kata.
   * Di bagian atas editor, terdapat tombol-tombol **Tag Variabel** seperti `{NOMOR_AKTA}`, `{NAMA_ENTITAS}`, `{WILAYAH_NOTARIS}`. Klik tag tersebut untuk langsung menyisipkannya ke dalam teks.
4. Klik tombol biru **`✓ Terapkan ke Draf Ini`**.
5. Jika di kemudian hari ingin mengembalikan ke kalimat standar semula, cukup buka kembali modal dan klik **`↺ Kembalikan ke Standar UUJN`**.

---

### USE CASE 4: MENYIMPAN DAN MEMBUKA KEMBALI DRAF (.AKTA)

Pengerjaan akta sering kali tertunda karena menunggu kelengkapan berkas dari pihak klien. Anda dapat menyimpan draf pengerjaan kapan saja:

1. **Menyimpan Draf:**
   * Klik tombol **`💾 Simpan Draf`** di bilah atas, atau cukup tekan kombinasi tombol keyboard **`Ctrl + S`**.
   * Jika draf baru, pilih folder penyimpanan. Berkas akan tersimpan dalam format resmi **`.akta`**.
   * Indikator di kanan atas akan otomatis berubah menjadi warna hijau **`Draf Tersimpan`**.
2. **Membuka Kembali Draf:**
   * Dari **Beranda**: Klik tombol **`Buka Draf`** pada kartu riwayat draf tersimpan di tabel bawah.
   * Atau klik tombol **`📂 Buka Berkas (.akta)`** di navigasi atas untuk memilih file dari flashdisk/folder lain.
   * Seluruh isian form dan kustomisasi redaksional akan dimuat kembali persis seperti saat terakhir disimpan.

---

### USE CASE 5: MEMBUAT DOKUMEN MICROSOFT WORD (.DOCX) SIAP CETAK

1. Setelah seluruh data selesai diisi, klik tombol hijau **`⚡ Buat Dokumen Word (.docx)`** di pojok kanan atas.
2. Aplikasi akan mengonversi seluruh data menjadi berkas Microsoft Word berekstensi `.docx`.
3. Buka file Word yang dihasilkan. Anda akan melihat:
   * **Lajur Renvoi:** Garis batas kiri 2.56 inci untuk catatan pinggir notaris.
   * **Garis Penutup Tanda Hubung (`---`):** Mengisi ruang kosong sampai batas kanan secara otomatis tanpa ada baris kosong.
   * **Format 30 Baris:** Setiap halaman tepat berisi 30 baris ketikan font Courier New 12pt spasi ganda sesuai UUJN.
   * **Penomoran Halaman:** *"Halaman Pertama."*, *"Halaman Kedua."*, hingga *"Halaman Terakhir."* secara otomatis tercetak di kanan atas setiap halaman.

---

### USE CASE 6: MENGATUR FOLDER PENYIMPANAN ARSIP (PENGATURAN)

Agar hasil kerja kantor tidak tercecer di sembarang tempat:

1. Di Beranda atau Editor, klik tombol **`⚙️ Pengaturan`** di pojok kanan atas.
2. Pada bagian **Direktori Penyimpanan Terpadu**, klik tombol **`Pilih Folder`**.
3. Tentukan folder kerja kantor (misal: `D:\ARSIP AKTA NOTARIS 2026`).
4. Klik **`Simpan Direktori`**.
5. Mulai saat itu, setiap kali Anda membuat dokumen Word atau menyimpan draf, aplikasi akan langsung mengarahkannya ke folder tersebut secara otomatis.

---

## 4. TIPS & TRIK PENGGUNAAN CEPAT

* **Pintasan Keyboard (*Shortcut*):**
  * `Ctrl + S`: Menyimpan draf akta secara instan kapan saja.
  * `Tab` / `Shift + Tab`: Berpindah antar kolom isian formulir dengan cepat tanpa menggunakan mouse.
* **Pemisahan Gelar Otomatis:**
  Jika Anda mengetik nama notaris atau penghadap disertai gelar (contoh: *Bulan Sabit, S.H.*), aplikasi cukup pintar untuk otomatis memisahkan nama asli ke kolom nama dan gelarnya ke kolom gelar.
* **Auto-Backup Lokal:**
  Jika laptop Anda tiba-tiba mati listrik saat mengetik draf, jangan khawatir! Saat Anda membuka kembali aplikasi, data ketikan terakhir Anda akan otomatis dipulihkan.

---

## 5. TANYA JAWAB UMUM (FAQ) & PEMECAHAN MASALAH

**T: Mengapa hasil Word tidak bisa dibuka?**  
*J:* Pastikan di komputer Anda sudah terpasang Microsoft Word, WPS Office, atau LibreOffice.

**T: Apakah aplikasi ini membutuhkan koneksi internet?**  
*J:* Tidak sama sekali. Aplikasi bekerja 100% luring (*offline*) untuk menjamin keamanan dan kerahasiaan data para penghadap kantor notaris Anda.

**T: Bagaimana jika masa uji coba demo 3 hari telah berakhir?**  
*J:* Aplikasi akan menampilkan layar penguncian dengan nomor kontak aktivasi. Silakan hubungi nomor WhatsApp di bawah ini untuk mendapatkan lisensi penuh (*Full Version*) tanpa batas waktu.

---

## 6. LAYANAN BANTUAN & DUKUNGAN TEKNIS

Jika Anda membutuhkan bantuan teknis, penambahan template klausula khusus, atau aktivasi lisensi penuh:

* **WhatsApp / Telepon:** **0821-2295-9032**  
* **Jam Layanan:** Senin – Sabtu (08.00 – 18.00 WIB)  
* **Email Dukungan:** kontak.notaris@gmail.com  

---
*Selamat menggunakan Aplikasi Generator Akta Notaris Sirkuler. Semoga membawa kemudahan dan efisiensi prima bagi kantor Notaris Anda!*
