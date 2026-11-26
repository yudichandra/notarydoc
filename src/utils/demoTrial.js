import { DEMO_CONFIG } from '../demoConfig.js';

const STORAGE_KEYS = {
  INIT: '__sys_ntr_t1',
  LAST: '__sys_ntr_t2',
  SIG:  '__sys_ntr_sig',
  LOCK: '__sys_ntr_lock'
};

const SECRET_SALT = 'uujn_notaris_akta_sirkuler_demo_sec_2026';

/**
 * Buat tanda tangan digital sederhana (checksum) untuk mencegah edit localStorage manual
 */
function computeSignature(t1, t2) {
  const raw = `${t1}:${t2}:${SECRET_SALT}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

/**
 * Format durasi sisa waktu menjadi teks yang ramah dan jelas
 */
function formatRemainingTime(ms) {
  if (ms <= 0) return '0 Detik';

  const totalSecs = Math.floor(ms / 1000);
  const days = Math.floor(totalSecs / (3600 * 24));
  const hours = Math.floor((totalSecs % (3600 * 24)) / 3600);
  const minutes = Math.floor((totalSecs % 3600) / 60);
  const seconds = totalSecs % 60;

  if (days > 0) {
    return `${days} Hari ${hours} Jam Tersisa`;
  } else if (hours > 0) {
    return `${hours} Jam ${minutes} Menit Tersisa`;
  } else if (minutes > 0) {
    return `${minutes} Menit ${seconds} Detik Tersisa`;
  } else {
    return `${seconds} Detik Tersisa`;
  }
}

let checkIntervalId = null;
let isLockedState = false;

/**
 * Hitung total durasi masa uji coba dalam milidetik
 */
export function getDemoDurationMs() {
  if (typeof DEMO_CONFIG?.DEMO_MINUTES === 'number' && DEMO_CONFIG.DEMO_MINUTES > 0) {
    return DEMO_CONFIG.DEMO_MINUTES * 60 * 1000;
  }
  if (typeof DEMO_CONFIG?.DEMO_HOURS === 'number' && DEMO_CONFIG.DEMO_HOURS > 0) {
    return DEMO_CONFIG.DEMO_HOURS * 60 * 60 * 1000;
  }
  if (typeof DEMO_CONFIG?.DEMO_DAYS === 'number' && DEMO_CONFIG.DEMO_DAYS > 0) {
    return DEMO_CONFIG.DEMO_DAYS * 24 * 60 * 60 * 1000;
  }
  return 3 * 24 * 60 * 60 * 1000;
}

/**
 * Label teks durasi yang dipilih
 */
export function getDemoDurationLabel() {
  if (typeof DEMO_CONFIG?.DEMO_MINUTES === 'number' && DEMO_CONFIG.DEMO_MINUTES > 0) {
    return `${DEMO_CONFIG.DEMO_MINUTES} Menit`;
  }
  if (typeof DEMO_CONFIG?.DEMO_HOURS === 'number' && DEMO_CONFIG.DEMO_HOURS > 0) {
    return `${DEMO_CONFIG.DEMO_HOURS} Jam`;
  }
  if (typeof DEMO_CONFIG?.DEMO_DAYS === 'number' && DEMO_CONFIG.DEMO_DAYS > 0) {
    return `${DEMO_CONFIG.DEMO_DAYS} Hari`;
  }
  return '3 Hari';
}

function decodeStoredTimestamp(raw) {
  if (!raw) return null;
  try {
    const num = parseInt(atob(raw), 10);
    return Number.isFinite(num) ? num : null;
  } catch {
    return null;
  }
}

/**
 * Inisialisasi dan jalankan sistem pengawasan demo/trial
 */
export function initDemoTrial() {
  // Jika mode demo dimatikan (versi full), keluar tanpa membatasi apapun
  if (!DEMO_CONFIG || !DEMO_CONFIG.IS_DEMO_MODE) {
    hideAllDemoUI();
    return { isDemo: false, isLocked: false };
  }

  // Khusus Pengembang: Jika opsi reset testing diaktifkan
  if (DEMO_CONFIG.RESET_TRIAL_FOR_TESTING) {
    localStorage.removeItem(STORAGE_KEYS.INIT);
    localStorage.removeItem(STORAGE_KEYS.LAST);
    localStorage.removeItem(STORAGE_KEYS.SIG);
    localStorage.removeItem(STORAGE_KEYS.LOCK);
    isLockedState = false;
    const overlay = document.getElementById('demoExpiredOverlay');
    if (overlay) overlay.style.display = 'none';
  }

  const durationMs = getDemoDurationMs();
  const now = Date.now();

  // 1. Cek apakah sebelumnya sudah pernah terkunci permanen
  const existingLock = localStorage.getItem(STORAGE_KEYS.LOCK);
  if (existingLock) {
    isLockedState = true;
    showDemoLockOverlay(existingLock === 'tampered' ? 'tampered' : 'expired');
    return { isDemo: true, isLocked: true };
  }

  // 2. Baca waktu awal dan waktu terakhir aktif
  let rawInit = localStorage.getItem(STORAGE_KEYS.INIT);
  let rawLast = localStorage.getItem(STORAGE_KEYS.LAST);
  let rawSig  = localStorage.getItem(STORAGE_KEYS.SIG);

  let initTime = decodeStoredTimestamp(rawInit);
  let lastTime = decodeStoredTimestamp(rawLast);

  // Jika pertama kali dibuka di perangkat ini:
  if (!initTime || !lastTime || isNaN(initTime) || isNaN(lastTime)) {
    initTime = now;
    lastTime = now;
    saveTrialState(initTime, lastTime);
  } else {
    // Verifikasi validitas signature
    const expectedSig = computeSignature(initTime, lastTime);
    if (rawSig !== expectedSig) {
      // Terindikasi data dimanipulasi
      lockTrialPermanently('tampered');
      showDemoLockOverlay('tampered');
      return { isDemo: true, isLocked: true };
    }

    // PROTEKSI ANTI-ROLLBACK JAM:
    // Toleransi rollback (maksimal 60 detik atau 1/4 dari durasi jika durasi sangat singkat)
    const rollbackTolerance = Math.min(60000, Math.max(10000, Math.floor(durationMs / 4)));
    if (now < (lastTime - rollbackTolerance)) {
      lockTrialPermanently('tampered');
      showDemoLockOverlay('tampered');
      return { isDemo: true, isLocked: true };
    }

    // Perbarui waktu terakhir aktif
    lastTime = Math.max(lastTime, now);
    saveTrialState(initTime, lastTime);
  }

  // 3. Evaluasi apakah sudah melewati batas durasi
  const elapsed = now - initTime;
  const remaining = durationMs - elapsed;

  if (remaining <= 0) {
    lockTrialPermanently('expired');
    showDemoLockOverlay('expired');
    return { isDemo: true, isLocked: true };
  }

  // 4. Jika masih aktif, tampilkan badge countdown dan mulai pembaruan tiap detik
  showAllDemoBadges();
  updateBadgeDisplay(remaining);

  if (checkIntervalId) clearInterval(checkIntervalId);
  checkIntervalId = setInterval(() => {
    runPeriodicCheck(durationMs);
  }, 1000);

  return { isDemo: true, isLocked: false };
}

/**
 * Pengecekan berkala setiap detik
 */
function runPeriodicCheck(durationMs) {
  if (isLockedState) return;

  const now = Date.now();
  let rawInit = localStorage.getItem(STORAGE_KEYS.INIT);
  let rawLast = localStorage.getItem(STORAGE_KEYS.LAST);
  let rawSig  = localStorage.getItem(STORAGE_KEYS.SIG);

  if (!rawInit || !rawLast || !rawSig) {
    lockTrialPermanently('tampered');
    showDemoLockOverlay('tampered');
    return;
  }

  const initTime = decodeStoredTimestamp(rawInit);
  const lastTime = decodeStoredTimestamp(rawLast);
  if (!initTime || !lastTime) {
    lockTrialPermanently('tampered');
    showDemoLockOverlay('tampered');
    return;
  }

  // Validasi signature
  if (rawSig !== computeSignature(initTime, lastTime)) {
    lockTrialPermanently('tampered');
    showDemoLockOverlay('tampered');
    return;
  }

  // Cek rollback jam (toleransi jika jam mundur lebih dari toleransi)
  const rollbackTolerance = Math.min(60000, Math.max(10000, Math.floor(durationMs / 4)));
  if (now < (lastTime - rollbackTolerance)) {
    lockTrialPermanently('tampered');
    showDemoLockOverlay('tampered');
    return;
  }

  // Cek apakah waktu habis
  const elapsed = now - initTime;
  const remaining = durationMs - elapsed;

  if (remaining <= 0) {
    lockTrialPermanently('expired');
    showDemoLockOverlay('expired');
    return;
  }

  // Perbarui waktu aktif terakhir jika waktu berjalan maju
  if (now > lastTime) {
    saveTrialState(initTime, now);
  }

  // Perbarui tampilan badge
  updateBadgeDisplay(remaining);
}

/**
 * Simpan status ke localStorage dengan enkripsi sederhana & signature
 */
function saveTrialState(initTime, lastTime) {
  localStorage.setItem(STORAGE_KEYS.INIT, btoa(String(initTime)));
  localStorage.setItem(STORAGE_KEYS.LAST, btoa(String(lastTime)));
  localStorage.setItem(STORAGE_KEYS.SIG, computeSignature(initTime, lastTime));
}

/**
 * Kunci status secara permanen
 */
function lockTrialPermanently(reason) {
  isLockedState = true;
  if (checkIntervalId) {
    clearInterval(checkIntervalId);
    checkIntervalId = null;
  }
  localStorage.setItem(STORAGE_KEYS.LOCK, reason);
}

/**
 * Update teks badge countdown di UI
 */
function updateBadgeDisplay(remainingMs) {
  const textStr = `Demo: ${formatRemainingTime(remainingMs)}`;
  const badges = document.querySelectorAll('.demo-trial-text');
  badges.forEach(b => {
    b.textContent = textStr;
  });
}

/**
 * Tampilkan badge di navbar
 */
function showAllDemoBadges() {
  const pills = document.querySelectorAll('.demo-trial-pill');
  pills.forEach(p => {
    p.style.display = 'inline-flex';
  });
}

/**
 * Sembunyikan badge demo (untuk versi full)
 */
function hideAllDemoBadges() {
  const pills = document.querySelectorAll('.demo-trial-pill');
  pills.forEach(p => {
    p.style.display = 'none';
  });
}

function hideAllDemoUI() {
  hideAllDemoBadges();
  const overlay = document.getElementById('demoExpiredOverlay');
  if (overlay) overlay.style.display = 'none';
}

/**
 * Tampilkan layar popup terkunci dengan latar belakang frosted blur
 */
export function showDemoLockOverlay(reason = 'expired') {
  isLockedState = true;
  hideAllDemoBadges();

  const overlay = document.getElementById('demoExpiredOverlay');
  if (!overlay) return;

  const titleEl = document.getElementById('demoLockTitle');
  const descEl = document.getElementById('demoLockDesc');
  const contactName = document.getElementById('demoContactName');
  const contactPhone = document.getElementById('demoContactPhone');
  const contactEmail = document.getElementById('demoContactEmail');
  const badgeEl = document.getElementById('demoLockBadge');

  if (contactName) contactName.textContent = DEMO_CONFIG.CONTACT.NAME || 'Pengembang Aplikasi';
  if (contactPhone) contactPhone.textContent = DEMO_CONFIG.CONTACT.PHONE || '-';
  if (contactEmail) contactEmail.textContent = DEMO_CONFIG.CONTACT.EMAIL || '-';

  if (reason === 'tampered') {
    if (badgeEl) badgeEl.textContent = 'PERINGATAN SISTEM LISENSI';
    if (titleEl) titleEl.textContent = 'Terdeteksi Perubahan Waktu Sistem';
    if (descEl) {
      descEl.textContent = 'Aplikasi mendeteksi tanggal atau jam komputer diubah/dimundurkan secara tidak wajar. Untuk menjaga integritas lisensi, aplikasi dinonaktifkan sementara.';
    }
  } else {
    if (badgeEl) badgeEl.textContent = 'MASA UJI COBA BERAKHIR';
    if (titleEl) titleEl.textContent = 'Masa Uji Coba Demo Telah Selesai';
    if (descEl) {
      descEl.textContent = `Terima kasih telah mencoba Aplikasi ${DEMO_CONFIG.CONTACT.APP_NAME || 'Generator Akta'}. Masa uji coba selama ${getDemoDurationLabel()} pada perangkat ini telah habis.`;
    }
  }

  overlay.style.display = 'flex';

  // Cegah interaksi tombol keyboard (Escape, Enter, Space)
  window.addEventListener('keydown', trapKeysWhenLocked, true);
}

function trapKeysWhenLocked(e) {
  if (isLockedState) {
    e.stopPropagation();
    e.preventDefault();
  }
}

/**
 * Fungsi pembantu untuk mengecek apakah saat ini aplikasi terkunci
 */
export function isDemoLocked() {
  if (!DEMO_CONFIG || !DEMO_CONFIG.IS_DEMO_MODE) return false;
  return isLockedState;
}
