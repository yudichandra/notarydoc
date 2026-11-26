// Engine Pengecek Ejaan (Spell-check) & Deteksi Typo untuk Dokumen Notaris
import { parseNumericSafe } from './terbilang.js';

// Glosarium Kata Baku Hukum & Kenotariatan Indonesia
const KAMUS_BAKU = new Set([
  // Istilah Badan Usaha: PT, CV, Firma, UD
  'akta', 'salinan', 'minuta', 'penghadap', 'berhadapan', 'notaris', 'komparisi',
  'perseroan', 'terbatas', 'sirkuler', 'keputusan', 'pernyataan', 'pemegang', 'saham',
  'persekutuan', 'komanditer', 'commanditaire', 'vennootschap', 'cv', 'firma', 'fa',
  'usaha', 'dagang', 'ud', 'perusahaan', 'sekutu', 'pesero', 'komplementer',
  'pengurus', 'komanditer', 'diam', 'inbreng', 'pemasukan', 'modal', 'tanggung',
  'renteng', 'pemilik', 'pengusaha', 'pengelola', 'kepaniteraan', 'pengadilan', 'negeri',
  'sabu', 'sistem', 'administrasi', 'badan', 'usaha', 'skt', 'nib', 'oss',
  'anggaran', 'dasar', 'pendirian', 'perubahan', 'pengesahan', 'persetujuan', 'pemberitahuan',
  'kementerian', 'menteri', 'hukum', 'hak', 'asasi', 'manusia', 'republik', 'indonesia',
  'direksi', 'direktur', 'utama', 'komisaris', 'dewan', 'pengawasan',
  'acquit', 'et', 'decharge', 'pelunasan', 'pembebasan', 'tanggung', 'jawab',
  'menyetujui', 'memberhentikan', 'hormat', 'mengangkat', 'susunan', 'periode', 'masa',
  'jabatan', 'tahun', 'efektif', 'berlaku', 'terhitung', 'sejak', 'wewenang', 'kewenangan',
  'kewajiban', 'kuasa', 'memberi', 'menerima', 'diberitahukan', 'instansi', 'berwenang',
  'bawah', 'tangan', 'materai', 'cukup', 'dilekatkan', 'surat', 'lembar', 'seri',
  'keseluruhan', 'bagian', 'dicetak', 'keadaan', 'sebenarnya', 'mengikat', 'sah',
  'rapat', 'umum', 'rups', 'pasal', 'ayat', 'ketentuan', 'keuangan', 'tahunan', 'laporan',
  'tindakan', 'menyimpang', 'tercermin', 'permohonan', 'pengubahan', 'tambahan',
  'menjamin', 'kebenaran', 'identitas', 'tandatangan', 'asli', 'bertanggungjawab',
  'memahami', 'tuntutan', 'sengketa', 'sebab', 'apapun', 'membebaskan', 'saksi',
  'dikenal', 'dilangsungkan', 'penggantian', 'coretan', 'sempurna', 'bunyinya',
  'pukul', 'waktu', 'bagian', 'barat', 'wib', 'hari', 'tanggal', 'bulan',
  'tuan', 'nyonya', 'nona', 'lahir', 'warga', 'negara', 'karyawan', 'swasta',
  'bertempat', 'tinggal', 'rukun', 'tetangga', 'rt', 'rw', 'kelurahan', 'desa',
  'kecamatan', 'kabupaten', 'kota', 'provinsi', 'jalan', 'nomor', 'no',
  'kartu', 'tanda', 'penduduk', 'ktp', 'nik', 'pemegang', 'selaku', 'mewakili',
  'sarjana', 'magister', 'kenotariatan',

  // Angka & Terbilang
  'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh',
  'sebelas', 'belas', 'puluh', 'ratus', 'ribu', 'juta', 'milyar', 'triliun', 'nol',

  // Nama Hari & Bulan
  'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu',
  'januari', 'februari', 'maret', 'april', 'mei', 'juni', 'juli', 'agustus',
  'september', 'oktober', 'november', 'desember',

  // Kata Penghubung & Umum
  'dan', 'atau', 'pada', 'di', 'ke', 'dari', 'yang', 'untuk', 'dengan', 'dalam', 'oleh',
  'atas', 'ini', 'itu', 'karenanya', 'tersebut', 'sebagaimana', 'ternyata', 'satu', 'lain',
  'terakhir', 'melalui', 'dibuat', 'telah', 'mengalami', 'beberapa', 'kali', 'mendapatkan',
  'bukti', 'penerimaan', 'diatas', 'berikut', 'sebagai', 'demikian', 'demikianlah',
  'jumlah', 'sekarang', 'hendak', 'suatu', 'sepanjang', 'dimaksud', 'sesuai', 'tidak',
  'seluruhnya', 'sepenuhnya', 'masing', 'masing-masing', 'diemban', 'menurut', 'maupun',
  'undang', 'undang-undang', 'berlaku', 'tanpa', 'ada', 'dikecualikan', 'kedua', 'keduanya',
  'segera', 'setelah', 'dibacakan', 'para', 'serta', 'cap', 'ibu', 'jari', 'jempol',
  'kertas', 'terpisah', 'diberikan', 'sama'
]);

// Hitung Levenshtein Distance (Jarak Perubahan Karakter)
function levenshteinDistance(a, b) {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

/**
 * Cari saran kata perbaikan dari kamus jika terdeteksi typo
 */
export function cariSaranTypo(kata) {
  const k = kata.toLowerCase().trim();
  if (k.length <= 2 || KAMUS_BAKU.has(k)) return null;

  let bestMatch = null;
  let minDistance = 3; // Batas maksimal toleransi typo 2 huruf

  for (const kataBaku of KAMUS_BAKU) {
    // Optimasi: lewati jika selisih panjang string lebih dari 2
    if (Math.abs(kataBaku.length - k.length) > 2) continue;

    const dist = levenshteinDistance(k, kataBaku);
    if (dist < minDistance) {
      minDistance = dist;
      bestMatch = kataBaku;
      if (dist === 1) break; // Jika hanya beda 1 huruf, langsung ambil
    }
  }

  return bestMatch;
}

/**
 * Cek teks input, kembalikan daftar kata typo dan saran perbaikannya
 */
export function periksaTeksTypo(teks) {
  if (!teks || typeof teks !== 'string') return [];

  // Pisahkan kata-kata (abaikan tanda baca dan angka murni)
  const tokens = teks.match(/[a-zA-ZáéíóúÁÉÍÓÚ-]+/g) || [];
  const hasilTypo = [];

  for (const token of tokens) {
    const saran = cariSaranTypo(token);
    if (saran) {
      hasilTypo.push({
        kataAsli: token,
        saranPerbaikan: saran
      });
    }
  }

  return hasilTypo;
}

/**
 * Validasi Konsistensi Data Hukum (Mencegah Salah Akta):
 * 1. Validasi NIK (Wajib 16 Digit)
 * 2. Validasi Jumlah Saham (Total Saham vs Jumlah Saham Pemilik)
 */
export function validasiDataAkta(data) {
  const peringatan = [];

  // Validasi NIK Penghadap
  if (data.penghadap && data.penghadap.nik) {
    const cleanNik = data.penghadap.nik.replace(/\D/g, '');
    if (cleanNik.length !== 16) {
      peringatan.push({
        bidang: 'penghadap.nik',
        pesan: `NIK Penghadap berjumlah ${cleanNik.length} digit (Standar NIK wajib 16 digit).`,
        tipe: 'danger'
      });
    }
  }

  // Validasi NIK Pejabat Pengurus Baru
  if (Array.isArray(data.pengurusBaru)) {
    data.pengurusBaru.forEach((pejabat, idx) => {
      if (pejabat.nik) {
        const cleanNik = pejabat.nik.replace(/\D/g, '');
        if (cleanNik.length !== 16) {
          peringatan.push({
            bidang: `pengurusBaru[${idx}].nik`,
            pesan: `NIK ${pejabat.jabatan || 'Pengurus'} (${pejabat.nama || '#' + (idx + 1)}) berjumlah ${cleanNik.length} digit (wajib 16 digit).`,
            tipe: 'danger'
          });
        }
      }
    });
  }

  // Validasi NIK Saksi 1 & Saksi 2 jika terisi
  ['saksi1', 'saksi2'].forEach((key, idx) => {
    const sk = data[key];
    if (sk && sk.nik && sk.nik.trim()) {
      const cleanNik = sk.nik.replace(/\D/g, '');
      if (cleanNik.length !== 16) {
        peringatan.push({
          bidang: `${key}.nik`,
          pesan: `NIK Saksi ${idx + 1} berjumlah ${cleanNik.length} digit (Standar NIK wajib 16 digit).`,
          tipe: 'danger'
        });
      }
    }
  });

  // Validasi Modal / Saham Sesuai Jenis Badan Usaha
  const tipe = (data.badanUsaha && data.badanUsaha.tipe) || 'PT';

  if (tipe === 'PT') {
    const subTipe = data.subTipe || 'SIRKULER_PENGURUS';
    if (subTipe === 'SIRKULER_MODAL' || subTipe === 'RUPS_MODAL') {
      const pm = data.peningkatanModal;
      if (pm) {
        const semulaNom = parseNumericSafe(pm.modalSemulaNominal);
        const keluarNom = parseNumericSafe(pm.sahamSimpananDikeluarkanNominal);
        const menjadiNom = parseNumericSafe(pm.modalMenjadiNominal);
        if (semulaNom > 0 && keluarNom > 0 && menjadiNom > 0 && (semulaNom + keluarNom !== menjadiNom)) {
          peringatan.push({
            bidang: 'peningkatanModal.nominal',
            pesan: `Perhitungan Modal: Modal Semula (Rp ${semulaNom.toLocaleString('id-ID')}) + Penyetoran Simpanan (Rp ${keluarNom.toLocaleString('id-ID')}) TIDAK SAMA dengan Modal Menjadi (Rp ${menjadiNom.toLocaleString('id-ID')}). Selisih: Rp ${Math.abs((semulaNom + keluarNom) - menjadiNom).toLocaleString('id-ID')}!`,
            tipe: 'danger'
          });
        }

        const semulaSaham = parseNumericSafe(pm.modalSemulaSaham);
        const keluarSaham = parseNumericSafe(pm.sahamSimpananDikeluarkanJml);
        const menjadiSaham = parseNumericSafe(pm.modalMenjadiSaham);
        if (semulaSaham > 0 && keluarSaham > 0 && menjadiSaham > 0 && (semulaSaham + keluarSaham !== menjadiSaham)) {
          peringatan.push({
            bidang: 'peningkatanModal.saham',
            pesan: `Perhitungan Lembar Saham: Saham Semula (${semulaSaham.toLocaleString('id-ID')}) + Saham Dikeluarkan (${keluarSaham.toLocaleString('id-ID')}) TIDAK SAMA dengan Saham Menjadi (${menjadiSaham.toLocaleString('id-ID')}). Selisih: ${Math.abs((semulaSaham + keluarSaham) - menjadiSaham).toLocaleString('id-ID')} lembar!`,
            tipe: 'danger'
          });
        }

        if (Array.isArray(pm.pemegangSahamModal) && pm.pemegangSahamModal.length > 0 && menjadiSaham > 0) {
          let sumPsmSaham = 0;
          let sumPsmNominal = 0;
          pm.pemegangSahamModal.forEach(psm => {
            sumPsmSaham += parseNumericSafe(psm.jumlahSaham);
            sumPsmNominal += parseNumericSafe(psm.nominal);
          });
          if (sumPsmSaham > 0 && sumPsmSaham !== menjadiSaham) {
            peringatan.push({
              bidang: 'peningkatanModal.pemegangSahamModal',
              pesan: `Total Saham Rincian Pemegang Saham Baru (${sumPsmSaham.toLocaleString('id-ID')}) TIDAK COCOK dengan Modal Menjadi (${menjadiSaham.toLocaleString('id-ID')}). Selisih: ${Math.abs(sumPsmSaham - menjadiSaham).toLocaleString('id-ID')} lembar!`,
              tipe: 'danger'
            });
          }
          if (sumPsmNominal > 0 && menjadiNom > 0 && sumPsmNominal !== menjadiNom) {
            peringatan.push({
              bidang: 'peningkatanModal.pemegangSahamModalNominal',
              pesan: `Total Nominal Rincian Pemegang Saham Baru (Rp ${sumPsmNominal.toLocaleString('id-ID')}) TIDAK COCOK dengan Modal Menjadi (Rp ${menjadiNom.toLocaleString('id-ID')}). Selisih: Rp ${Math.abs(sumPsmNominal - menjadiNom).toLocaleString('id-ID')}!`,
              tipe: 'danger'
            });
          }
        }
      }
    } else {
      // Validasi Saham PT Sirkuler Pengurus
      if (data.saham && Array.isArray(data.pemegangSaham)) {
        const targetSeriA = parseNumericSafe(data.saham.totalSeriA);
        const targetSeriB = parseNumericSafe(data.saham.totalSeriB);

        let sumSeriA = 0;
        let sumSeriB = 0;

        data.pemegangSaham.forEach(ps => {
          sumSeriA += parseNumericSafe(ps.sahamSeriA);
          sumSeriB += parseNumericSafe(ps.sahamSeriB);
        });

        if (targetSeriA > 0 && sumSeriA !== targetSeriA) {
          peringatan.push({
            bidang: 'saham.seriA',
            pesan: `Total Saham Seri A PT (${targetSeriA.toLocaleString('id-ID')}) TIDAK COCOK dengan jumlah saham pemegang (${sumSeriA.toLocaleString('id-ID')}). Selisih: ${Math.abs(targetSeriA - sumSeriA).toLocaleString('id-ID')} lembar!`,
            tipe: 'danger'
          });
        }

        if (targetSeriB > 0 && sumSeriB !== targetSeriB) {
          peringatan.push({
            bidang: 'saham.seriB',
            pesan: `Total Saham Seri B PT (${targetSeriB.toLocaleString('id-ID')}) TIDAK COCOK dengan jumlah saham pemegang (${sumSeriB.toLocaleString('id-ID')}). Selisih: ${Math.abs(targetSeriB - sumSeriB).toLocaleString('id-ID')} lembar!`,
            tipe: 'danger'
          });
        }
      }
    }
  } else if (tipe === 'CV' || tipe === 'FIRMA') {
    // Validasi Modal Inbreng CV / Firma
    if (data.modal && Array.isArray(data.sekutu)) {
      const totalModal = parseNumericSafe(data.modal.totalNominal);
      let sumInbreng = 0;

      data.sekutu.forEach(sk => {
        sumInbreng += parseNumericSafe(sk.nominalInbreng);
      });

      if (totalModal > 0 && sumInbreng !== totalModal) {
        peringatan.push({
          bidang: 'modal.total',
          pesan: `Total Modal ${tipe} (Rp ${totalModal.toLocaleString('id-ID')}) TIDAK COCOK dengan total inbreng sekutu (Rp ${sumInbreng.toLocaleString('id-ID')}). Selisih: Rp ${Math.abs(totalModal - sumInbreng).toLocaleString('id-ID')}!`,
          tipe: 'danger'
        });
      }
    }
  }

  return peringatan;
}
