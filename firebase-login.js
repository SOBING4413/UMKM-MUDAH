import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-app.js";

import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile
} from "https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDDHm4EOo5i_GAfrupEeX_mGen1XHDCRxM",
  authDomain: "umkmmudah.firebaseapp.com",
  projectId: "umkmmudah",
  storageBucket: "umkmmudah.firebasestorage.app",
  messagingSenderId: "1096867722400",
  appId: "1:1096867722400:web:6887771fa2d987779045c5",
  measurementId: "G-9C6VWY7GCL"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// ================================================================
// AUTH SECURITY HELPERS
// ================================================================

const RATE_LIMITS = {
  login: { max: 5, windowMs: 60 * 1000, lockMs: 5 * 60 * 1000 },
  signup: { max: 3, windowMs: 10 * 60 * 1000, lockMs: 15 * 60 * 1000 },
  reset: { max: 3, windowMs: 10 * 60 * 1000, lockMs: 10 * 60 * 1000 },
  google: { max: 5, windowMs: 60 * 1000, lockMs: 3 * 60 * 1000 }
};

function logSecurityEvent(event, details) {
  const payload = {
    event: event,
    details: details || {},
    ts: new Date().toISOString()
  };

  try {
    const key = 'umkm_security_logs';
    const existing = localStorage.getItem(key);
    const logs = existing ? JSON.parse(existing) : [];
    logs.push(payload);
    if (logs.length > 100) logs.shift();
    localStorage.setItem(key, JSON.stringify(logs));
  } catch (err) {
    // intentionally silent to avoid breaking auth flow
  }

  console.info('[SECURITY]', payload);
}

function normalizeText(input) {
  if (typeof input !== 'string') return '';
  return input.replace(/[\u0000-\u001F\u007F]/g, '').trim();
}

function sanitizeName(input) {
  return normalizeText(input).replace(/[^\p{L}\p{N} .,'-]/gu, '').slice(0, 80);
}

function sanitizeEmail(input) {
  return normalizeText(input).toLowerCase().slice(0, 254);
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePasswordStrength(password) {
  if (typeof password !== 'string' || password.length < 8) return false;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /\d/.test(password);
  return hasUpper && hasLower && hasDigit;
}

function getRateLimitState(action) {
  const key = 'umkm_rate_' + action;
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === 'object' ? parsed : { attempts: [], lockUntil: 0 };
  } catch (err) {
    return { attempts: [], lockUntil: 0 };
  }
}

function saveRateLimitState(action, state) {
  const key = 'umkm_rate_' + action;
  localStorage.setItem(key, JSON.stringify(state));
}

function checkRateLimit(action) {
  const config = RATE_LIMITS[action];
  if (!config) return { allowed: true };

  const now = Date.now();
  const state = getRateLimitState(action);

  if (state.lockUntil && now < state.lockUntil) {
    const waitSeconds = Math.ceil((state.lockUntil - now) / 1000);
    return { allowed: false, waitSeconds: waitSeconds };
  }

  const recentAttempts = (state.attempts || []).filter(function(ts) {
    return now - ts < config.windowMs;
  });

  if (recentAttempts.length >= config.max) {
    state.lockUntil = now + config.lockMs;
    state.attempts = recentAttempts;
    saveRateLimitState(action, state);
    logSecurityEvent('rate_limit_lock', { action: action, lockMs: config.lockMs });
    return { allowed: false, waitSeconds: Math.ceil(config.lockMs / 1000) };
  }

  return { allowed: true };
}

function recordRateAttempt(action) {
  const config = RATE_LIMITS[action];
  if (!config) return;
  const now = Date.now();
  const state = getRateLimitState(action);
  state.attempts = (state.attempts || []).filter(function(ts) {
    return now - ts < config.windowMs;
  });
  state.attempts.push(now);
  saveRateLimitState(action, state);
}

function clearRateLimit(action) {
  saveRateLimitState(action, { attempts: [], lockUntil: 0 });
}

// ================================================================
// AUTH UI HELPERS
// ================================================================

function setBtnLoading(btn, loading) {
  if (!btn) return;
  const textEl = btn.querySelector('.auth-btn-text');
  const loadingEl = btn.querySelector('.auth-btn-loading');
  if (textEl && loadingEl) {
    textEl.style.display = loading ? 'none' : 'inline';
    loadingEl.style.display = loading ? 'inline' : 'none';
  }
  btn.disabled = loading;
}

function showAuthError(formId, message) {
  const existingError = document.querySelector('#' + formId + ' .auth-error');
  if (existingError) {
    existingError.textContent = message;
    existingError.classList.add('show');
    existingError.style.display = 'block';
    return;
  }
  const form = document.getElementById(formId);
  if (!form) return;
  const errorDiv = document.createElement('div');
  errorDiv.className = 'auth-error show';
  errorDiv.style.display = 'block';
  errorDiv.textContent = message;
  form.insertBefore(errorDiv, form.firstChild);
}

function clearAuthErrors() {
  document.querySelectorAll('.auth-error, .auth-success').forEach(function(el) {
    el.classList.remove('show');
    el.style.display = 'none';
    if (el.classList.contains('auth-success') && el.parentNode) {
      el.parentNode.removeChild(el);
    }
  });
}

function translateFirebaseError(code) {
  const errors = {
    'auth/email-already-in-use': 'Email ini sudah terdaftar. Silakan login atau gunakan email lain.',
    'auth/invalid-email': 'Format email tidak valid.',
    'auth/user-not-found': 'Kredensial tidak valid. Periksa email dan password.',
    'auth/wrong-password': 'Kredensial tidak valid. Periksa email dan password.',
    'auth/weak-password': 'Password terlalu lemah. Gunakan minimal 8 karakter dan kombinasi huruf + angka.',
    'auth/too-many-requests': 'Terlalu banyak percobaan. Coba lagi beberapa menit kemudian.',
    'auth/popup-closed-by-user': 'Popup login ditutup. Silakan coba lagi.',
    'auth/cancelled-popup-request': 'Permintaan popup dibatalkan.',
    'auth/network-request-failed': 'Koneksi internet bermasalah. Periksa koneksi kamu.',
    'auth/invalid-credential': 'Kredensial tidak valid. Periksa email dan password.',
    'auth/user-disabled': 'Akun ini telah dinonaktifkan.',
    'auth/operation-not-allowed': 'Metode login ini belum diaktifkan.',
    'auth/missing-password': 'Mohon masukkan password.'
  };
  return errors[code] || 'Terjadi kesalahan. Silakan coba lagi. (' + code + ')';
}

function ensureAllowed(action, formId) {
  const state = checkRateLimit(action);
  if (!state.allowed) {
    showAuthError(formId, 'Terlalu banyak percobaan. Coba lagi dalam ' + state.waitSeconds + ' detik.');
    return false;
  }
  return true;
}

// Redirect to main app
function goToApp() {
  window.location.replace('./index.html');
}

// ================================================================
// DOM READY - AUTH EVENT HANDLERS
// ================================================================
document.addEventListener('DOMContentLoaded', () => {

  const btnLoginGoogle = document.getElementById("btnLoginGoogleAuth");
  const btnSignupGoogle = document.getElementById("btnSignupGoogleAuth");

  // Google Login handler
  async function handleGoogleLogin(btn) {
    if (!btn) return;
    if (!ensureAllowed('google', 'loginForm')) return;

    const originalText = btn.innerHTML;
    btn.disabled = true;
    var spanEl = btn.querySelector('span');
    if (spanEl) spanEl.textContent = '⏳ Memproses...';

    try {
      const result = await signInWithPopup(auth, provider);
      clearRateLimit('google');
      logSecurityEvent('google_login_success', { uid: result.user.uid });
      if (typeof showToast === 'function') {
        showToast('Login berhasil! Selamat datang, ' + (result.user.displayName || result.user.email) + '!', 'success');
      }
      // Redirect handled by onAuthStateChanged
    } catch (err) {
      recordRateAttempt('google');
      logSecurityEvent('google_login_failed', { code: err.code || 'unknown' });
      console.error("GOOGLE LOGIN ERROR:", err.code, err.message);
      if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
        if (typeof showToast === 'function') {
          showToast(translateFirebaseError(err.code), 'error');
        }
      }
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
  }

  if (btnLoginGoogle) {
    btnLoginGoogle.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      handleGoogleLogin(btnLoginGoogle);
    });
  }

  if (btnSignupGoogle) {
    btnSignupGoogle.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      handleGoogleLogin(btnSignupGoogle);
    });
  }

  // ===== EMAIL/PASSWORD LOGIN =====
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      clearAuthErrors();

      if (!ensureAllowed('login', 'loginForm')) return;

      const email = sanitizeEmail(document.getElementById('loginEmail').value);
      const password = document.getElementById('loginPassword').value;
      const submitBtn = document.getElementById('btnLoginEmail');

      if (!email || !password) {
        showAuthError('loginForm', 'Mohon isi email dan password!');
        return;
      }

      if (!validateEmail(email)) {
        showAuthError('loginForm', 'Format email tidak valid.');
        return;
      }

      setBtnLoading(submitBtn, true);

      try {
        const result = await signInWithEmailAndPassword(auth, email, password);
        clearRateLimit('login');
        logSecurityEvent('email_login_success', { uid: result.user.uid });
        if (typeof showToast === 'function') {
          showToast('Login berhasil! Selamat datang kembali!', 'success');
        }
        // Redirect handled by onAuthStateChanged
      } catch (err) {
        recordRateAttempt('login');
        logSecurityEvent('email_login_failed', { code: err.code || 'unknown', email: email });
        console.error("EMAIL LOGIN ERROR:", err.code, err.message);
        showAuthError('loginForm', translateFirebaseError(err.code));
      } finally {
        setBtnLoading(submitBtn, false);
      }
    });
  }

  // ===== EMAIL/PASSWORD SIGNUP =====
  const signupForm = document.getElementById("signupForm");
  if (signupForm) {
    signupForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      clearAuthErrors();

      if (!ensureAllowed('signup', 'signupForm')) return;

      const name = sanitizeName(document.getElementById('signupName').value);
      const email = sanitizeEmail(document.getElementById('signupEmail').value);
      const password = document.getElementById('signupPassword').value;
      const confirmPassword = document.getElementById('signupConfirmPassword').value;
      const submitBtn = document.getElementById('btnSignupEmail');

      if (!name) { showAuthError('signupForm', 'Mohon isi nama lengkap!'); return; }
      if (!email) { showAuthError('signupForm', 'Mohon isi email!'); return; }
      if (!validateEmail(email)) { showAuthError('signupForm', 'Format email tidak valid!'); return; }
      if (!password) { showAuthError('signupForm', 'Mohon isi password!'); return; }
      if (!validatePasswordStrength(password)) { showAuthError('signupForm', 'Password minimal 8 karakter, mengandung huruf besar, huruf kecil, dan angka.'); return; }
      if (password !== confirmPassword) { showAuthError('signupForm', 'Password dan konfirmasi password tidak cocok!'); return; }

      setBtnLoading(submitBtn, true);

      try {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(result.user, { displayName: name });
        clearRateLimit('signup');
        logSecurityEvent('signup_success', { uid: result.user.uid });
        if (typeof showToast === 'function') {
          showToast('Pendaftaran berhasil! Selamat datang, ' + name + '!', 'success');
        }
        // Redirect handled by onAuthStateChanged
      } catch (err) {
        recordRateAttempt('signup');
        logSecurityEvent('signup_failed', { code: err.code || 'unknown', email: email });
        console.error("SIGNUP ERROR:", err.code, err.message);
        showAuthError('signupForm', translateFirebaseError(err.code));
      } finally {
        setBtnLoading(submitBtn, false);
      }
    });
  }

  // ===== RESET PASSWORD =====
  const resetForm = document.getElementById("resetForm");
  if (resetForm) {
    resetForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      clearAuthErrors();

      if (!ensureAllowed('reset', 'resetForm')) return;

      const email = sanitizeEmail(document.getElementById('resetEmail').value);
      const submitBtn = document.getElementById('btnResetPassword');

      if (!email) { showAuthError('resetForm', 'Mohon isi email!'); return; }
      if (!validateEmail(email)) { showAuthError('resetForm', 'Format email tidak valid!'); return; }

      setBtnLoading(submitBtn, true);

      try {
        await sendPasswordResetEmail(auth, email);
        clearRateLimit('reset');
        logSecurityEvent('reset_password_sent', { email: email });
        if (typeof showToast === 'function') {
          showToast('Link reset password telah dikirim ke ' + email + '!', 'success');
        }
        const successDiv = document.createElement('div');
        successDiv.className = 'auth-success show';
        successDiv.style.display = 'block';
        successDiv.textContent = '✅ Email reset password berhasil dikirim. Cek inbox atau folder spam.';
        resetForm.insertBefore(successDiv, resetForm.firstChild);
      } catch (err) {
        recordRateAttempt('reset');
        logSecurityEvent('reset_password_failed', { code: err.code || 'unknown', email: email });
        console.error("RESET ERROR:", err.code, err.message);
        showAuthError('resetForm', translateFirebaseError(err.code));
      } finally {
        setBtnLoading(submitBtn, false);
      }
    });
  }

  // ===== HANDLE AUTH STATE CHANGES =====
  // If user is already logged in, redirect to main app immediately
  onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log("USER ALREADY LOGGED IN:", user.email);
      setTimeout(function() {
        goToApp();
      }, 300);
    }
  });

});
