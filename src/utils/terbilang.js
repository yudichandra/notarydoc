// Utility helper untuk konversi angka dan tanggal ke format "Terbilang" standar Akta Notaris Indonesia

const satuan = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas'];

export function parseNumericSafe(val) {
  if (typeof val === 'number') {
    return Number.isFinite(val) ? Math.floor(Math.abs(val)) : 0;
  }
  if (val === null || val === undefined) return 0;
  const raw = String(val).trim();
  if (!raw) return 0;
  // Jika berupa angka polos / desimal standar JS
  if (/^-?\d+(\.\d+)?$/.test(raw) && !/^\d{1,3}(\.\d{3})+$/.test(raw)) {
    const n = Number(raw);
    return Number.isFinite(n) ? Math.floor(Math.abs(n)) : 0;
  }
  // Tangani format rupiah/ribuan bertitik seperti "100.000.000" atau "Rp 50.000.000,-"
  const beforeComma = raw.split(',')[0];
  const digitsOnly = beforeComma.replace(/[^\d]/g, '');
  if (!digitsOnly) return 0;
  const parsed = Number(digitsOnly);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function terbilang(n) {
  n = parseNumericSafe(n);
  if (n === 0) return 'nol';
  if (n >= 1e15) {
    const kuadriliun = Math.floor(n / 1e15);
    const rem = n % 1e15;
    return `${terbilang(kuadriliun)} kuadriliun${rem > 0 ? ' ' + terbilang(rem) : ''}`;
  }
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

function parseDateSafe(dateInput) {
  if (!dateInput) return null;
  if (dateInput instanceof Date) {
    return isNaN(dateInput.getTime()) ? null : dateInput;
  }
  if (typeof dateInput === 'string') {
    const isoMatch = dateInput.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      const y = parseInt(isoMatch[1], 10);
      const m = parseInt(isoMatch[2], 10);
      const d = parseInt(isoMatch[3], 10);
      const dt = new Date(y, m - 1, d);
      return isNaN(dt.getTime()) ? null : dt;
    }
  }
  const dt = new Date(dateInput);
  return isNaN(dt.getTime()) ? null : dt;
}

/**
 * Format tanggal akta notaris lengkap:
 * Contoh: "Selasa, tanggal lima belas bulan September tahun dua ribu dua puluh enam (15-09-2026)"
 */
export function formatTanggalAkta(dateInput) {
  const d = parseDateSafe(dateInput);
  if (!d) return '';

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
  const d = parseDateSafe(dateInput);
  if (!d) return '';

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
  const d = parseDateSafe(dateInput);
  if (!d) return '';

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
  const parts = String(timeStr).trim().split(/[:.]/);
  const jam = parseInt(parts[0], 10);
  const menit = parseInt(parts[1] || '0', 10);
  if (isNaN(jam) || isNaN(menit)) return '';

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
  const num = parseNumericSafe(jumlah);
  const numFormatted = num.toLocaleString('id-ID');
  return `${numFormatted} (${terbilang(num)}) lembar`;
}

/**
 * Format nominal Rupiah (Untuk Modal Inbreng CV, Firma, dan Modal UD):
 * Contoh: 100000000 -> "Rp 100.000.000,- (seratus juta rupiah)"
 */
export function formatRupiah(amount) {
  const num = parseNumericSafe(amount);
  const numFormatted = num.toLocaleString('id-ID');
  return `Rp ${numFormatted},- (${terbilang(num)} rupiah)`;
}

