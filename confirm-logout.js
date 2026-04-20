// ===== CONFIRM LOGOUT DIALOG =====
// Menampilkan dialog konfirmasi sebelum logout

(function() {
    'use strict';

    // Create modal HTML
    function createLogoutModal() {
        var overlay = document.createElement('div');
        overlay.id = 'logoutOverlay';
        overlay.className = 'logout-overlay';
        overlay.innerHTML = 
            '<div class="logout-modal">' +
                '<div class="logout-modal-icon">🚪</div>' +
                '<h3 class="logout-modal-title">Yakin Mau Logout?</h3>' +
                '<p class="logout-modal-desc">Data kamu akan disimpan ke cloud sebelum logout. Kamu bisa login lagi kapan saja.</p>' +
                '<div class="logout-modal-actions">' +
                    '<button type="button" class="btn btn-outline btn-logout-cancel" id="btnLogoutCancel">❌ Batal</button>' +
                    '<button type="button" class="btn btn-danger btn-logout-confirm" id="btnLogoutConfirm">🚪 Ya, Logout</button>' +
                '</div>' +
            '</div>';
        document.body.appendChild(overlay);

        // Close on overlay click
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) {
                closeLogoutModal();
            }
        });

        // Cancel button
        document.getElementById('btnLogoutCancel').addEventListener('click', function() {
            closeLogoutModal();
        });

        // Confirm button
        document.getElementById('btnLogoutConfirm').addEventListener('click', function() {
            closeLogoutModal();
            doActualLogout();
        });

        // Close on Escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                closeLogoutModal();
            }
        });
    }

    function openLogoutModal() {
        var overlay = document.getElementById('logoutOverlay');
        if (!overlay) {
            createLogoutModal();
            overlay = document.getElementById('logoutOverlay');
        }
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeLogoutModal() {
        var overlay = document.getElementById('logoutOverlay');
        if (overlay) {
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        }
        // Re-enable logout button
        var logoutBtn = document.getElementById('btnLogout');
        if (logoutBtn) {
            logoutBtn.disabled = false;
            logoutBtn.textContent = '🚪 Logout';
        }
    }

    function doActualLogout() {
        var logoutBtn = document.getElementById('btnLogout');
        if (logoutBtn) {
            logoutBtn.disabled = true;
            logoutBtn.textContent = '⏳ Logout...';
        }

        // Try Firebase logout
        if (typeof window._firebaseLogout === 'function') {
            try {
                window._firebaseLogout();
            } catch (err) {
                console.error("Firebase logout error:", err);
                fallbackLogout();
            }
            return;
        }

        // Retry after short delay
        setTimeout(function() {
            if (typeof window._firebaseLogout === 'function') {
                try {
                    window._firebaseLogout();
                } catch (err) {
                    fallbackLogout();
                }
            } else {
                fallbackLogout();
            }
        }, 500);
    }

    function fallbackLogout() {
        localStorage.removeItem('umkm_skip_login');
        if (typeof showToast === 'function') {
            showToast('Berhasil logout!', 'success');
        }
        setTimeout(function() {
            window.location.replace('./login.html');
        }, 500);
    }

    // Override the global handleLogoutClick to show confirmation first
    window.handleLogoutClick = function() {
        console.log("LOGOUT BUTTON CLICKED - showing confirmation");
        openLogoutModal();
    };

    // Init on DOM ready
    document.addEventListener('DOMContentLoaded', function() {
        createLogoutModal();
    });
})();