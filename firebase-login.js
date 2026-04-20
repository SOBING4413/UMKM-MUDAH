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
  document.querySelectorAll('.auth-error').forEach(function(el) {
    el.classList.remove('show');
    el.style.display = 'none';
  });
}

function translateFirebaseError(code) {
  const errors = {
    'auth/email-already-in-use': 'Email ini sudah terdaftar. Silakan login atau gunakan email lain.',
    'auth/invalid-email': 'Format email tidak valid.',
    'auth/user-not-found': 'Akun tidak ditemukan. Silakan daftar terlebih dahulu.',
    'auth/wrong-password': 'Password salah. Silakan coba lagi.',
    'auth/weak-password': 'Password terlalu lemah. Gunakan minimal 6 karakter.',
    'auth/too-many-requests': 'Terlalu banyak percobaan. Coba lagi beberapa menit kemudian.',
    'auth/popup-closed-by-user': 'Popup login ditutup. Silakan coba lagi.',
    'auth/cancelled-popup-request': 'Permintaan popup dibatalkan.',
    'auth/network-request-failed': 'Koneksi internet bermasalah. Periksa koneksi kamu.',
    'auth/invalid-credential': 'Email atau password salah. Silakan coba lagi.',
    'auth/user-disabled': 'Akun ini telah dinonaktifkan.',
    'auth/operation-not-allowed': 'Metode login ini belum diaktifkan.',
    'auth/missing-password': 'Mohon masukkan password.',
  };
  return errors[code] || 'Terjadi kesalahan. Silakan coba lagi. (' + code + ')';
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
    const originalText = btn.innerHTML;
    btn.disabled = true;
    var spanEl = btn.querySelector('span');
    if (spanEl) spanEl.textContent = '⏳ Memproses...';

    try {
      const result = await signInWithPopup(auth, provider);
      console.log("GOOGLE LOGIN SUCCESS:", result.user.displayName);
      if (typeof showToast === 'function') {
        showToast('Login berhasil! Selamat datang, ' + (result.user.displayName || result.user.email) + '!', 'success');
      }
      // Redirect handled by onAuthStateChanged
    } catch (err) {
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

      const email = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value;
      const submitBtn = document.getElementById('btnLoginEmail');

      if (!email || !password) {
        showAuthError('loginForm', 'Mohon isi email dan password!');
        return;
      }

      setBtnLoading(submitBtn, true);

      try {
        const result = await signInWithEmailAndPassword(auth, email, password);
        console.log("EMAIL LOGIN SUCCESS:", result.user.email);
        if (typeof showToast === 'function') {
          showToast('Login berhasil! Selamat datang kembali!', 'success');
        }
        // Redirect handled by onAuthStateChanged
      } catch (err) {
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

      const name = document.getElementById('signupName').value.trim();
      const email = document.getElementById('signupEmail').value.trim();
      const password = document.getElementById('signupPassword').value;
      const confirmPassword = document.getElementById('signupConfirmPassword').value;
      const submitBtn = document.getElementById('btnSignupEmail');

      if (!name) { showAuthError('signupForm', 'Mohon isi nama lengkap!'); return; }
      if (!email) { showAuthError('signupForm', 'Mohon isi email!'); return; }
      if (!password) { showAuthError('signupForm', 'Mohon isi password!'); return; }
      if (password.length < 6) { showAuthError('signupForm', 'Password minimal 6 karakter!'); return; }
      if (password !== confirmPassword) { showAuthError('signupForm', 'Password dan konfirmasi password tidak cocok!'); return; }

      setBtnLoading(submitBtn, true);

      try {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(result.user, { displayName: name });
        console.log("SIGNUP SUCCESS:", result.user.email);
        if (typeof showToast === 'function') {
          showToast('Pendaftaran berhasil! Selamat datang, ' + name + '!', 'success');
        }
        // Redirect handled by onAuthStateChanged
      } catch (err) {
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

      const email = document.getElementById('resetEmail').value.trim();
      const submitBtn = document.getElementById('btnResetPassword');

      if (!email) { showAuthError('resetForm', 'Mohon isi email!'); return; }

      setBtnLoading(submitBtn, true);

      try {
        await sendPasswordResetEmail(auth, email);
        console.log("RESET EMAIL SENT TO:", email);
        if (typeof showToast === 'function') {
          showToast('Link reset password telah dikirim ke ' + email + '!', 'success');
        }
        const successDiv = document.createElement('div');
        successDiv.className = 'auth-success show';
        successDiv.style.display = 'block';
        successDiv.textContent = '✅ Email reset password berhasil dikirim ke ' + email + '. Cek inbox atau folder spam.';
        resetForm.insertBefore(successDiv, resetForm.firstChild);
      } catch (err) {
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
      // Small delay so toast can show
      setTimeout(function() {
        goToApp();
      }, 300);
    }
  });

});