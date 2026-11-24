/**
 * ============================================================================
 * KONFIGURASI LISENSI & MODE DEMO / TRIAL
 * ============================================================================
 * 
 * PANDUAN PENGGUNAAN:
 * 
 * 1. UNTUK MEMBUAT VERSI FULL (TANPA BATAS WAKTU / UNLIMITED):
 *    Ubah nilai `IS_DEMO_MODE` di bawah ini menjadi `false`.
 * 
 * 2. UNTUK MENGUBAH DURASI DEMO:
 *    Ubah nilai `DEMO_DAYS` (misal 3 untuk 3 hari / 72 jam, 7 untuk 7 hari, 1 untuk 1 hari, dsb).
 * 
 * 3. UNTUK MENGUBAH INFORMASI KONTAK PADA POPUP KETIKA DEMO HABIS:
 *    Sesuaikan nomor WhatsApp/telepon, nama, dan email pada bagian `CONTACT`.
 * ============================================================================
 */

export const DEMO_CONFIG = {
  // Ganti ke `false` jika ingin membangun (build) VERSI FULL tanpa batas waktu!
  // Ganti ke `true` jika ingin versi DEMO dengan masa uji coba.
  IS_DEMO_MODE: true,

  // PILIH SALAH SATU SATUAN WAKTU (isi salah satu, kosongkan / set 0 yang lain):
  // 1. Dalam hitungan HARI:
  DEMO_DAYS: 30,       // Contoh: 3 = 3 hari (72 jam)

  // 2. Dalam hitungan JAM (jika diisi > 0, opsi jam ini yang akan digunakan):
  DEMO_HOURS: 0,      // Contoh: 2 = 2 jam, 12 = 12 jam

  // 3. Dalam hitungan MENIT (jika diisi > 0, opsi menit ini yang diprioritaskan):
  DEMO_MINUTES: 0,    // Contoh: 5 = 5 menit (sangat cocok untuk tes cepat melihat popup expired)

  // KHUSUS PENGEMBANG / TESTING:
  // Ubah ke `true` jika Anda baru saja mengetes demo dan ingin mereset timer di komputer Anda dari awal lagi.
  // (Pastikan kembalikan ke `false` sebelum membagikan aplikasi ke klien)
  RESET_TRIAL_FOR_TESTING: true,

  // ============================================================================
  // PENGUNCIAN IDENTITAS NAMA NOTARIS (LOCK NAMA NOTARIS)
  // ============================================================================
  // Ubah ke `true` untuk mengunci nama notaris agar tidak bisa diedit oleh klien.
  // Ubah ke `false` jika di masa depan Anda ingin membuka kuncian (bebas diubah).
  LOCK_NOTARY_NAME: true,

  // Nama notaris yang dikunci (berlaku di menu Pengaturan & Bagian 1 Akta PT, CV, FA)
  LOCKED_NOTARY_NAME: "GRENDI JAYA DARMAWAN",

  // Informasi kontak yang akan tampil di popup saat masa demo berakhir
  CONTACT: {
    APP_NAME: "Generator Akta Notaris Sirkuler",
    NAME: "Admin / Pengembang Sistem",
    PHONE: "082122959032", // Ganti dengan nomor WhatsApp / HP Anda
    NOTE: "Silakan hubungi Admin / Pengembang Sistem untuk aktivasi lisensi penuh (Full Version)."
  }
};
