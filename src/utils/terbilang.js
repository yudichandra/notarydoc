// Utility helper untuk konversi angka dan tanggal ke format "Terbilang" standar Akta Notaris Indonesia

const satuan = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas'];

export function terbilang(n) {
  n = Math.floor(Math.abs(Number(n) || 0));
  if (n === 0) return 'nol';
  if (n < 12) return satuan[n];
  if (n < 20) return terbilang(n - 10) + ' belas';
  if (n < 100) return terbilang(Math.floor(n / 10)) + ' puluh' + (n % 10 !== 0 ? ' ' + satuan[n % 10] : '');
  if (n < 200) return 'seratus' + (n - 100 !== 0 ? ' ' + terbilang(n - 100) : '');
  if (n < 1000) return terbilang(Math.floor(n / 100)) + ' ratus' + (n % 100 !== 0 ? ' ' + terbilang(n % 100) : '');
  if (n < 2000) return 'seribu' + (n - 1000 !== 0 ? ' ' + terbilang(n - 1000) : '');
  if (n < 1000000) return terbilang(Math.floor(n / 1000)) + ' ribu' + (n % 1000 !== 0 ? ' ' + terbilang(n % 1000) : '');
  if (n < 1000000000) return terbilang(Math.floor(n / 1000000)) + ' juta' + (n % 1000000 !== 0 ? ' ' + terbilang(n % 1000000) : '');
  if (n < 1000000000000) return terbilang(Math.floor(n / 1000000000)) + ' milyar' + (n % 1000000000 !== 0 ? ' ' + terbilang(n % 1000000000) : '');
  return terbilang(Math.floor(n / 1000000000000)) + ' triliun' + (n % 1000000000000 !== 0 ? ' ' + terbilang(n % 1000000000000) : '');
}

const NAMA_HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const NAMA_BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

/**
 * Format tanggal akta notaris lengkap:
 * Contoh: "Selasa, tanggal lima belas bulan September tahun dua ribu dua puluh enam (15-09-2026)"
 */
export function formatTanggalAkta(dateInput) {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';

  const hari = NAMA_HARI[d.getDay()];
  const tgl = d.getDate();
  const bln = NAMA_BULAN[d.getMonth()];
  const thn = d.getFullYear();

  const tglTerbilang = terbilang(tgl);
  const thnTerbilang = terbilang(thn);

  const padTgl = String(tgl).padStart(2, '0');
  const padBln = String(d.getMonth() + 1).padStart(2, '0');

  return `${hari}, tanggal ${tglTerbilang} bulan ${bln} tahun ${thnTerbilang} (${padTgl}-${padBln}-${thn})`;
}

/**
 * Format tanggal biasa (misal tanggal SK / Akta Pendirian):
 * Contoh: "dua belas bulan Agustus tahun dua ribu sepuluh (12-08-2010)"
 */
export function formatTanggalBiasa(dateInput) {
  if (!dateInput) return '';
  let d;
  if (typeof dateInput === 'string' && dateInput.includes('-')) {
    const parts = dateInput.split('-');
    d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  } else {
    d = new Date(dateInput);
  }
  if (isNaN(d.getTime())) return '';

  const tgl = d.getDate();
  const bln = NAMA_BULAN[d.getMonth()];
  const thn = d.getFullYear();

  const padTgl = String(tgl).padStart(2, '0');
  const padBln = String(d.getMonth() + 1).padStart(2, '0');

  return `tanggal ${terbilang(tgl)} bulan ${bln} tahun ${terbilang(thn)} (${padTgl}-${padBln}-${thn})`;
}

/**
 * Format tanggal tanpa awalan kata "tanggal" (untuk frasa "tertanggal ..." atau "pada tanggal ...")
 * Contoh: "dua belas bulan Agustus tahun dua ribu sepuluh (12-08-2010)"
 */
export function formatTanggalTanpaAwalan(dateInput) {
  if (!dateInput) return '';
  let d;
  if (typeof dateInput === 'string' && dateInput.includes('-')) {
    const parts = dateInput.split('-');
    d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  } else {
    d = new Date(dateInput);
  }
  if (isNaN(d.getTime())) return '';

  const tgl = d.getDate();
  const bln = NAMA_BULAN[d.getMonth()];
  const thn = d.getFullYear();

  const padTgl = String(tgl).padStart(2, '0');
  const padBln = String(d.getMonth() + 1).padStart(2, '0');

  return `${terbilang(tgl)} bulan ${bln} tahun ${terbilang(thn)} (${padTgl}-${padBln}-${thn})`;
}

/**
 * Format jam akta:
 * Contoh: "11.00 WIB (sebelas Waktu Indonesia Bagian Barat)"
 */
export function formatJamAkta(timeStr) {
  if (!timeStr) return '';
  const [jamStr, menitStr] = timeStr.split(':');
  const jam = parseInt(jamStr, 10);
  const menit = parseInt(menitStr || '0', 10);

  let terbilangWaktu = terbilang(jam);
  if (menit > 0) {
    terbilangWaktu += ' lebih ' + terbilang(menit) + ' menit';
  }

  const padJam = String(jam).padStart(2, '0');
  const padMenit = String(menit).padStart(2, '0');

  return `pukul ${padJam}.${padMenit} WIB (${terbilangWaktu} Waktu Indonesia Bagian Barat)`;
}

/**
 * Format jumlah saham (Khusus PT):
 * Contoh: 293100 -> "293.100 (dua ratus sembilan puluh tiga ribu seratus) lembar"
 */
export function formatSaham(jumlah) {
  const num = parseInt(jumlah, 10) || 0;
  const numFormatted = num.toLocaleString('id-ID');
  return `${numFormatted} (${terbilang(num)}) lembar`;
}

/**
 * Format nominal Rupiah (Untuk Modal Inbreng CV, Firma, dan Modal UD):
 * Contoh: 100000000 -> "Rp 100.000.000,- (seratus juta rupiah)"
 */
export function formatRupiah(amount) {
  const num = parseInt(amount, 10) || 0;
  const numFormatted = num.toLocaleString('id-ID');
  return `Rp ${numFormatted},- (${terbilang(num)} rupiah)`;
}

