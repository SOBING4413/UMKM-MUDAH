import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js";

import {
  getFirestore,
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";

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
const db = getFirestore(app);

let currentUser = null;
let syncTimer = null;
let saveInFlightPromise = null;

const SYNC_DELAY = 1500;
const MAX_RECORDS = 10000;

function parseJsonArray(rawValue) {
  if (!rawValue || typeof rawValue !== 'string') return [];
  try {
    const parsed = JSON.parse(rawValue);
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(0, MAX_RECORDS).filter(function(item) {
      return item && typeof item === 'object';
    });
  } catch (err) {
    return [];
  }
}

function safeLocalArray(key) {
  return parseJsonArray(localStorage.getItem(key));
}

function deduplicateById(items) {
  const map = {};

  if (!Array.isArray(items)) return [];

  items.forEach(function(item) {
    if (!item || typeof item !== 'object') return;
    const id = item.id;
    if (!id || typeof id !== 'string') return;

    const existing = map[id];
    if (!existing) {
      map[id] = item;
      return;
    }

    // Prefer the latest item if both have timestamps
    const existingTs = new Date(existing.updatedAt || existing.date || 0).getTime() || 0;
    const incomingTs = new Date(item.updatedAt || item.date || 0).getTime() || 0;
    map[id] = incomingTs >= existingTs ? item : existing;
  });

  return Object.values(map);
}

function logSyncEvent(level, message, meta) {
  const payload = {
    level: level,
    message: message,
    meta: meta || {},
    ts: new Date().toISOString()
  };

  if (level === 'error') {
    console.error('[SYNC]', payload);
  } else {
    console.log('[SYNC]', payload);
  }
}

// ================================================================
// CLOUD SYNC FUNCTIONS
// ================================================================

async function saveAllToCloud() {
  if (!currentUser) return;
  if (saveInFlightPromise) return saveInFlightPromise;

  saveInFlightPromise = (async function() {
    try {
      const transactions = safeLocalArray('umkm_transactions');
      const products = safeLocalArray('umkm_products');

      await setDoc(doc(db, "users", currentUser.uid), {
        transactions: JSON.stringify(transactions),
        products: JSON.stringify(products),
        displayName: currentUser.displayName || '',
        email: currentUser.email || '',
        schemaVersion: 2,
        lastSync: new Date().toISOString()
      }, { merge: true });

      logSyncEvent('info', 'Data berhasil disimpan ke cloud', {
        uid: currentUser.uid,
        txCount: transactions.length,
        productCount: products.length
      });
    } catch (err) {
      logSyncEvent('error', 'Gagal simpan ke cloud', { error: err && err.message ? err.message : String(err) });
      throw err;
    } finally {
      saveInFlightPromise = null;
    }
  })();

  return saveInFlightPromise;
}

function debouncedSaveToCloud() {
  if (!currentUser) return;
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(function() {
    saveAllToCloud().catch(function() {
      if (typeof showToast === 'function') {
        showToast('⚠️ Gagal sinkronkan data ke cloud. Akan dicoba lagi otomatis.', 'warning');
      }
    });
  }, SYNC_DELAY);
}

async function loadFromCloud() {
  if (!currentUser) return;

  try {
    const docSnap = await getDoc(doc(db, "users", currentUser.uid));

    if (docSnap.exists()) {
      const cloudData = docSnap.data();
      logSyncEvent('info', 'Data cloud ditemukan', { lastSync: cloudData.lastSync || null });

      const cloudTransactions = parseJsonArray(cloudData.transactions || '[]');
      const cloudProducts = parseJsonArray(cloudData.products || '[]');
      const localTransactions = safeLocalArray('umkm_transactions');
      const localProducts = safeLocalArray('umkm_products');

      const mergedTransactions = deduplicateById(cloudTransactions.concat(localTransactions));
      const mergedProducts = deduplicateById(cloudProducts.concat(localProducts));

      localStorage.setItem('umkm_transactions', JSON.stringify(mergedTransactions));
      localStorage.setItem('umkm_products', JSON.stringify(mergedProducts));

      await setDoc(doc(db, "users", currentUser.uid), {
        transactions: JSON.stringify(mergedTransactions),
        products: JSON.stringify(mergedProducts),
        displayName: currentUser.displayName || '',
        email: currentUser.email || '',
        schemaVersion: 2,
        lastSync: new Date().toISOString()
      }, { merge: true });

      if (typeof refreshDashboard === 'function') refreshDashboard();
      if (typeof refreshFinance === 'function') refreshFinance();
      if (typeof refreshStock === 'function') refreshStock();

      if (typeof showToast === 'function') {
        showToast('☁️ Data berhasil disinkronkan dari cloud!', 'success');
      }

    } else {
      logSyncEvent('info', 'Belum ada data cloud, menyimpan data lokal', { uid: currentUser.uid });
      await saveAllToCloud();
    }
  } catch (err) {
    logSyncEvent('error', 'Gagal memuat data dari cloud', { error: err && err.message ? err.message : String(err) });
    if (typeof showToast === 'function') {
      showToast('⚠️ Gagal sinkronkan data. Data lokal tetap tersedia.', 'warning');
    }
  }
}

// ===== LOGOUT FUNCTION =====
async function performLogout() {
  logSyncEvent('info', 'Mulai proses logout', { uid: currentUser ? currentUser.uid : null });

  try {
    const savePromise = saveAllToCloud();
    const timeoutPromise = new Promise(function(resolve) {
      setTimeout(resolve, 3000);
    });
    await Promise.race([savePromise, timeoutPromise]);
  } catch (err) {
    logSyncEvent('error', 'Error saving before logout', { error: err && err.message ? err.message : String(err) });
  }

  try {
    await signOut(auth);
    logSyncEvent('info', 'Firebase signOut successful');
  } catch (err) {
    logSyncEvent('error', 'Error signing out', { error: err && err.message ? err.message : String(err) });
  }

  currentUser = null;
  localStorage.removeItem('umkm_skip_login');

  if (typeof showToast === 'function') {
    showToast('Berhasil logout. Data kamu aman di cloud! ☁️', 'success');
  }

  setTimeout(function() {
    window.location.replace('./login.html');
  }, 500);
}

// Expose sync functions and logout globally IMMEDIATELY
window._firebaseSync = {
  saveToCloud: debouncedSaveToCloud,
  saveAllToCloud: saveAllToCloud,
  loadFromCloud: loadFromCloud,
  isLoggedIn: function() { return !!currentUser; }
};

window._firebaseLogout = performLogout;

console.log("Firebase module loaded. _firebaseLogout is now available.");

// ================================================================
// DOM READY - AUTH STATE & LOGOUT
// ================================================================
document.addEventListener('DOMContentLoaded', () => {

  const logoutBtn = document.getElementById("btnLogout");
  const userDisplayName = document.getElementById("userDisplayName");
  const loginBtn = document.getElementById("btnLogin");

  onAuthStateChanged(auth, async (user) => {
    currentUser = user;

    var skippedLogin = localStorage.getItem('umkm_skip_login');

    if (user) {
      logSyncEvent('info', 'USER LOGIN', { email: user.email });

      if (typeof showMainApp === 'function') {
        showMainApp();
      }

      if (logoutBtn) logoutBtn.style.display = "inline-flex";
      if (loginBtn) loginBtn.style.display = "none";
      if (userDisplayName) {
        userDisplayName.textContent = "Halo, " + (user.displayName || user.email) + "! ";
        userDisplayName.style.display = "inline";
      }

      await loadFromCloud();

    } else {
      logSyncEvent('info', 'USER NOT LOGGED IN');

      if (skippedLogin !== 'true') {
        setTimeout(function() {
          if (typeof goToLogin === 'function') {
            goToLogin();
          }
        }, 1500);
      } else {
        if (typeof showMainApp === 'function') {
          showMainApp();
        }
        if (loginBtn) loginBtn.style.display = "inline-flex";
      }

      if (logoutBtn) logoutBtn.style.display = "none";
      if (userDisplayName) {
        userDisplayName.textContent = "Mode Tanpa Akun";
        userDisplayName.style.display = "inline";
      }
    }
  });

});
