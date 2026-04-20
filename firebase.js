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

// ================================================================
// CLOUD SYNC FUNCTIONS
// ================================================================

let syncTimer = null;
const SYNC_DELAY = 1500;

async function saveAllToCloud() {
  if (!currentUser) return;

  try {
    var transactions = [];
    var products = [];

    try {
      var txData = localStorage.getItem('umkm_transactions');
      transactions = txData ? JSON.parse(txData) : [];
    } catch (e) { transactions = []; }

    try {
      var pdData = localStorage.getItem('umkm_products');
      products = pdData ? JSON.parse(pdData) : [];
    } catch (e) { products = []; }

    await setDoc(doc(db, "users", currentUser.uid), {
      transactions: JSON.stringify(transactions),
      products: JSON.stringify(products),
      displayName: currentUser.displayName || '',
      email: currentUser.email || '',
      lastSync: new Date().toISOString()
    }, { merge: true });

    console.log("☁️ Data berhasil disimpan ke cloud!");
  } catch (err) {
    console.error("☁️ Gagal simpan ke cloud:", err);
  }
}

function debouncedSaveToCloud() {
  if (!currentUser) return;
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(function() {
    saveAllToCloud();
  }, SYNC_DELAY);
}

async function loadFromCloud() {
  if (!currentUser) return;

  try {
    var docSnap = await getDoc(doc(db, "users", currentUser.uid));

    if (docSnap.exists()) {
      var cloudData = docSnap.data();
      console.log("☁️ Data cloud ditemukan! Last sync:", cloudData.lastSync);

      var cloudTransactions = [];
      var cloudProducts = [];

      try {
        cloudTransactions = cloudData.transactions ? JSON.parse(cloudData.transactions) : [];
      } catch (e) { cloudTransactions = []; }

      try {
        cloudProducts = cloudData.products ? JSON.parse(cloudData.products) : [];
      } catch (e) { cloudProducts = []; }

      var localTransactions = [];
      var localProducts = [];

      try {
        var txLocal = localStorage.getItem('umkm_transactions');
        localTransactions = txLocal ? JSON.parse(txLocal) : [];
      } catch (e) { localTransactions = []; }

      try {
        var pdLocal = localStorage.getItem('umkm_products');
        localProducts = pdLocal ? JSON.parse(pdLocal) : [];
      } catch (e) { localProducts = []; }

      var mergedTransactions = mergeArrayById(cloudTransactions, localTransactions);
      var mergedProducts = mergeArrayById(cloudProducts, localProducts);

      localStorage.setItem('umkm_transactions', JSON.stringify(mergedTransactions));
      localStorage.setItem('umkm_products', JSON.stringify(mergedProducts));

      console.log("☁️ Data berhasil di-merge!");

      await setDoc(doc(db, "users", currentUser.uid), {
        transactions: JSON.stringify(mergedTransactions),
        products: JSON.stringify(mergedProducts),
        displayName: currentUser.displayName || '',
        email: currentUser.email || '',
        lastSync: new Date().toISOString()
      }, { merge: true });

      if (typeof refreshDashboard === 'function') refreshDashboard();
      if (typeof refreshFinance === 'function') refreshFinance();
      if (typeof refreshStock === 'function') refreshStock();

      if (typeof showToast === 'function') {
        showToast('☁️ Data berhasil disinkronkan dari cloud!', 'success');
      }

    } else {
      console.log("☁️ Belum ada data cloud. Menyimpan data lokal ke cloud...");
      await saveAllToCloud();
    }
  } catch (err) {
    console.error("☁️ Gagal memuat data dari cloud:", err);
    if (typeof showToast === 'function') {
      showToast('⚠️ Gagal sinkronkan data. Data lokal tetap tersedia.', 'warning');
    }
  }
}

function mergeArrayById(arr1, arr2) {
  var map = {};

  if (Array.isArray(arr1)) {
    arr1.forEach(function(item) {
      if (item && item.id) {
        map[item.id] = item;
      }
    });
  }

  if (Array.isArray(arr2)) {
    arr2.forEach(function(item) {
      if (item && item.id) {
        map[item.id] = item;
      }
    });
  }

  return Object.values(map);
}

// ===== LOGOUT FUNCTION =====
async function performLogout() {
  console.log("PERFORMING FIREBASE LOGOUT");
  
  // Save to cloud with a timeout so it doesn't hang forever
  try {
    var savePromise = saveAllToCloud();
    var timeoutPromise = new Promise(function(resolve) {
      setTimeout(resolve, 3000); // max 3 seconds wait
    });
    await Promise.race([savePromise, timeoutPromise]);
  } catch (err) {
    console.error("Error saving before logout:", err);
  }
  
  // Sign out from Firebase
  try {
    await signOut(auth);
    console.log("Firebase signOut successful");
  } catch (err) {
    console.error("Error signing out:", err);
  }
  
  // Clear local auth state
  currentUser = null;
  localStorage.removeItem('umkm_skip_login');
  
  if (typeof showToast === 'function') {
    showToast('Berhasil logout. Data kamu aman di cloud! ☁️', 'success');
  }
  
  // Redirect to login page
  setTimeout(function() {
    window.location.replace('./login.html');
  }, 500);
}

// Expose sync functions and logout globally IMMEDIATELY (not waiting for DOMContentLoaded)
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

  // ===== LOGOUT =====
  // NOTE: Do NOT add a direct click listener here that calls performLogout().
  // The confirm-logout.js module handles the click via onclick="handleLogoutClick()"
  // which shows a confirmation modal first. Only after user confirms, it calls
  // window._firebaseLogout (performLogout). Adding a direct listener here would
  // bypass the confirmation dialog.

  // ===== HANDLE AUTH STATE CHANGES =====
  const loginBtn = document.getElementById("btnLogin");

  onAuthStateChanged(auth, async (user) => {
    currentUser = user;

    var skippedLogin = localStorage.getItem('umkm_skip_login');

    if (user) {
      console.log("USER LOGIN:", user.email);

      // Show main app
      if (typeof showMainApp === 'function') {
        showMainApp();
      }

      // UI update
      if (logoutBtn) logoutBtn.style.display = "inline-flex";
      if (loginBtn) loginBtn.style.display = "none";
      if (userDisplayName) {
        userDisplayName.textContent = "Halo, " + (user.displayName || user.email) + "! ";
        userDisplayName.style.display = "inline";
      }

      // ☁️ SYNC: Load data from cloud after login
      await loadFromCloud();

    } else {
      console.log("USER NOT LOGGED IN");

      // If user didn't skip login, redirect to login page
      if (skippedLogin !== 'true') {
        // Wait a moment for loading screen to finish
        setTimeout(function() {
          if (typeof goToLogin === 'function') {
            goToLogin();
          }
        }, 1500);
      } else {
        // Skip login user - show app with Login button
        if (typeof showMainApp === 'function') {
          showMainApp();
        }
        // Show Login button for guest users
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