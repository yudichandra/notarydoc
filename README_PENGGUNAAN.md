# Panduan Aplikasi Generator Akta Keputusan (PT, CV, Firma, UD) - Native Windows

Aplikasi desktop native Windows yang ringan, portabel (berupa **1 file tunggal `.exe`**), dan dilengkapi dengan **AI Sederhana Pengecek Typo (Typo Guardian)** untuk membantu staf kantor Notaris membuat **Akta Pernyataan Keputusan Sirkuler / Para Pesero / Pemilik** untuk 4 jenis bentuk badan usaha:
1. 🏢 **PT (Perseroan Terbatas)** - Akta Pernyataan Keputusan Sirkuler Para Pemegang Saham (Saham Seri A & Seri B, Direksi & Dewan Komisaris).
2. 🤝 **CV (Persekutuan Komanditer)** - Akta Pernyataan Keputusan Para Pesero CV (Modal Pemasukan Inbreng, Sekutu Pengurus / Direktur, Sekutu Komanditer).
3. ⚖️ **Firma (Fa)** - Akta Pernyataan Keputusan Para Pesero Firma (Inbreng Sekutu, Tanggung Renteng, Pesero Pengurus & Pesero Firma).
4. 🏪 **Usaha Dagang (UD) / Perorangan** - Akta Pernyataan Keputusan Pemilik Usaha Dagang (Modal Usaha Pemilik, Kuasa Pengelola Usaha, NIB OSS).

---

## 🚀 Fitur Unggulan

1. **Dukungan 4 Bentuk Badan Usaha Sekaligus (PT, CV, Firma, UD)**
   - **Pill Selector Instan**: Cukup klik pill di bar atas untuk berpindah antara PT, CV, Firma, atau UD.
   - **Formulir Beradaptasi Otomatis**:
     - *PT*: Menampilkan kolom Saham (Seri-A & Seri-B), SK Pengesahan Kemenkumham, serta Direksi & Komisaris.
     - *CV, Firma, UD*: Otomatis beralih ke kolom Modal Pemasukan / Inbreng (Rupiah), Pendaftaran SABU AHU / NIB OSS, dan organ sekutu/pemilik.
   - **Tombol Muat Contoh Kasus (1-Klik Demo untuk ke-4 Entitas)**:
     - `Contoh PT` : Memuat data riil notaris *PT. SEHAT DAN BAHAGIA SELALU*.
     - `Contoh CV` : Memuat data *CV. MAJU BERSAMA JAYA* (Modal Rp 500 Juta, 2 Sekutu).
     - `Contoh Firma` : Memuat data *FIRMA KONSULTAN WIJAYA & REKAN* (Modal Rp 300 Juta).
     - `Contoh UD` : Memuat data *UD. SUMBER REJEKI ABADI* (Modal Rp 250 Juta, Pemilik & Kuasa).

2. **Portable Single File (`.exe` Tunggal)**
   - Tidak perlu install runtime rumit (tidak butuh Python, Node.js, JRE, atau .NET terpisah).
   - Menggunakan teknologi **Tauri (Rust + Windows Native WebView2)** sehingga ukuran file sangat kecil (~5 MB) dan konsumsi RAM sangat hemat (~35 MB).
   - Cukup copy file `GeneratorAktaSirkuler.exe` ke komputer mana pun (Windows 10/11) dan langsung klik 2x untuk menjalankannya.

3. **AI Sederhana Deteksi Typo (Warna Merah)**
   - **Glosarium Istilah Hukum & Notaris**: Secara otomatis mendeteksi kata yang salah ketik (misal: *perseruan* ➔ *perseroan*, *sahman* ➔ *saham*, *kebupaten* ➔ *kabupaten*, *komanditer*, *inbreng*, dll).
   - **Highlight Warna Merah**: Input dengan kata salah ketik akan ditandai dengan border dan warna merah.
   - **Saran Perbaikan Sekali Klik**: Muncul chip saran di bawah field. Klik chip tersebut untuk langsung memperbaiki kata tanpa perlu mengetik ulang.
   - **Validasi Data Hukum Real-time**:
     - Memeriksa panjang NIK KTP (wajib 16 digit).
     - Memeriksa kesesuaian jumlah saham pemegang vs total saham perseroan (PT).
     - Memeriksa kesesuaian jumlah inbreng sekutu vs total modal usaha (CV / Firma).

4. **Otomatisasi "Terbilang" Standar Akta Notaris**
   - Mengonversi otomatis tanggal menjadi: `"Selasa, tanggal lima belas bulan September tahun dua ribu dua puluh enam (15-09-2026)"`.
   - Mengonversi otomatis jam menjadi: `"pukul 11.00 WIB (sebelas Waktu Indonesia Bagian Barat)"`.
   - Mengonversi otomatis jumlah saham (PT) menjadi: `"293.100 (dua ratus sembilan puluh tiga ribu seratus) lembar"`.
   - Mengonversi otomatis modal inbreng (CV/Firma/UD) menjadi: `"Rp 500.000.000,- (lima ratus juta rupiah)"`.

5. **Standar Tata Letak & Penspasian 2.0 (Standar Akta Notaris Indonesia)**
   - **Kertas**: A4 (210 mm × 297 mm).
   - **Margin Presisi**:
     - *Top*: `0.3"` (432 dxa)
     - *Bottom*: `0.19"` (274 dxa)
     - *Left*: `2.56"` (3686 dxa / ~6.5 cm) — dialokasikan khusus untuk **Lajur Renvoi** (ruang catatan pinggir untuk pembetulan akta yang disahkan).
     - *Right*: `0.39"` (562 dxa / ~1.0 cm).
   - **Font & Tipografi**: `Courier New`, ukuran `12 pt` (font mesin tik monospace 10 karakter per inci).
   - **Kerapatan Bidang Ketik**: Tepat **53 karakter per baris**, sehingga tepi kanan rata lurus sempurna.
   - **Penspasian (Line & Paragraph Spacing)**: **2.0 (Double Spasi)** seragam dan konstan (`before: 0 pt, after: 0 pt`) sesuai standar minuta dan salinan akta. Tersedia pula pilihan 1.5 dan 1.0 jika diperlukan.
   - **Penutupan Ruang Kosong (Pasal 42 ayat 2 UUJN)**: Seluruh ujung baris yang tersisa otomatis ditutup dengan garis hubung (`---`) tanpa celah kosong, mencegah penyelundupan teks gelap.

6. **Tampilan Beranda / Dashboard & Pembuatan Draf Baru**
   - Saat aplikasi pertama kali dibuka, pengguna langsung disambut oleh halaman **Beranda Draf Akta**:
     - **Kartu Template 4 Badan Usaha**: Klik `+ Buat Akta PT`, `+ Buat Akta CV`, `+ Buat Akta Firma`, atau `+ Buat Akta UD` untuk memulai formulir baru dengan form bersih sesuai entitas yang dipilih.
     - **Daftar Draf Tersimpan**: Secara otomatis memindai dan menampilkan seluruh berkas draf `.akta` yang ada di direktori penyimpanan Anda lengkap dengan nama perusahaan, nomor akta, tanggal, ukuran file, dan tombol `Buka & Lanjutkan` atau `Hapus`.
     - **Tombol Navigasi `← Beranda Draf`**: Terdapat di pojok kiri atas form editor untuk memudahkan pengguna kembali ke daftar draf sewaktu-waktu.

7. **Penyimpanan Draf Langsung ke Direktori Disk (.akta) & Auto-Save**
   - **Penyimpanan Nyata ke Disk**: Mengklik `💾 Simpan Draf (.akta)` langsung menulis berkas `.akta` ke folder direktori tujuan di komputer Anda tanpa hanya mengandalkan dialog browser.
   - **Auto-Save Lokal**: Setiap perubahan otomatis tersimpan di memori lokal, ditandai lampu indikator hijau berdenyut di bilah atas.

8. **Pengaturan Direktori Penyimpanan Berkas & Default Windows Downloads**
   - **Default Folder Downloads**: Folder penyimpanan draf dan hasil Word otomatis mengarah ke folder **Downloads Windows** (`C:\Users\<Nama_User>\Downloads`).
   - **Pilih Interaktif via Windows File Explorer (`🔍 Pilih Folder`)**: Membuka dialog penjelajah folder asli Windows untuk memilih lokasi direktori mana pun di PC Anda.
   - **Tombol `📁 Buka Folder`**: Membuka folder arsip tersebut secara langsung di jendela Windows Explorer.


---

## 🛠️ Cara Menjalankan & Membangun (Build)

### 1. Membangun Menjadi File `.exe` Tunggal:
Cukup klik ganda file:
```
build_exe.bat
```
Atau jalankan perintah terminal:
```bash
npm run build
cargo build --release --manifest-path src-tauri/Cargo.toml
```
File hasil compile berada di:
`src-tauri\target\release\generator_akta_sirkuler.exe` (disalin otomatis ke folder root menjadi `GeneratorAktaSirkuler.exe`).

### 2. Menjalankan dalam Mode Pengembangan (Live Reload):
```bash
npm run tauri dev
```
Atau jika ingin melihat tampilan web langsung di browser:
```bash
npm run dev
```
Lalu buka `http://localhost:5173`.

---

## 📁 Struktur Kode

- `src/index.html` : Antarmuka form wizard (Akta & Notaris, Legalitas PT, Penghadap, Saham, Pengurus Baru, Saksi, Live Preview).
- `src/styles.css` : Tampilan modern dengan tema executive dark, efek visual typo merah, dan simulasi kertas akta notaris.
- `src/main.js` : Pengendali utama, integrasi data binding, tombol demo, dan export dokumen.
- `src/utils/terbilang.js` : Modul rumus angka dan tanggal ke teks terbilang akta notaris.
- `src/utils/spellcheck.js` : Algoritma Levenshtein distance dan kamus istilah hukum untuk deteksi typo real-time.
- `src/utils/docGenerator.js` : Generator file Word (`.docx`) standar notaris.
- `src-tauri/` : Backend native Rust untuk pembungkus desktop Windows single executable.
