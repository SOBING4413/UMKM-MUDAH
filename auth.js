// ===== AUTH PAGE UTILITIES =====

function showToast(message, type) {
    type = type || 'success';
    var container = document.getElementById('toastContainer');
    if (!container) return;
    var toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(function() {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 3000);
}

// ===== LOADING SCREEN =====
function initLoadingScreen() {
    var loadingBar = document.getElementById('loadingBar');
    var loadingStatus = document.getElementById('loadingStatus');
    var loadingScreen = document.getElementById('loadingScreen');

    if (!loadingBar || !loadingScreen) return;

    var progress = 0;
    var messages = [
        'Memuat aplikasi...',
        'Menyiapkan fitur...',
        'Mengecek koneksi...',
        'Hampir selesai...',
        'Selamat datang!'
    ];

    var interval = setInterval(function() {
        progress += Math.random() * 18 + 8;
        if (progress > 100) progress = 100;

        loadingBar.style.width = progress + '%';

        var msgIndex = Math.min(Math.floor(progress / 25), messages.length - 1);
        if (loadingStatus) loadingStatus.textContent = messages[msgIndex];

        if (progress >= 100) {
            clearInterval(interval);
            setTimeout(function() {
                loadingScreen.classList.add('fade-out');
                setTimeout(function() {
                    loadingScreen.style.display = 'none';
                    // Show auth page
                    var authPage = document.getElementById('authPage');
                    if (authPage) authPage.style.display = 'block';
                }, 600);
            }, 400);
        }
    }, 300);
}

// ===== AUTH TABS =====
function switchAuthTab(tabName) {
    var tabs = document.querySelectorAll('.auth-tab');
    tabs.forEach(function(tab) {
        tab.classList.toggle('active', tab.getAttribute('data-auth-tab') === tabName);
    });

    var formWraps = document.querySelectorAll('.auth-form-wrap');
    formWraps.forEach(function(wrap) {
        wrap.classList.remove('active');
    });

    if (tabName === 'login') {
        document.getElementById('authFormLogin').classList.add('active');
    } else if (tabName === 'signup') {
        document.getElementById('authFormSignup').classList.add('active');
    } else if (tabName === 'reset') {
        document.getElementById('authFormReset').classList.add('active');
    }
}

function showResetPassword() {
    switchAuthTab('reset');
    var tabs = document.querySelectorAll('.auth-tab');
    tabs.forEach(function(tab) { tab.classList.remove('active'); });
}

function togglePassword(inputId, btn) {
    var input = document.getElementById(inputId);
    if (input.type === 'password') {
        input.type = 'text';
        btn.textContent = '🙈';
    } else {
        input.type = 'password';
        btn.textContent = '👁️';
    }
}

// ===== DARK MODE (for login page too) =====
function initDarkMode() {
    var savedTheme = localStorage.getItem('umkm_theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', function() {
    initDarkMode();
    initLoadingScreen();

    // Auth tab clicks
    var tabs = document.querySelectorAll('.auth-tab');
    tabs.forEach(function(tab) {
        tab.addEventListener('click', function() {
            switchAuthTab(this.getAttribute('data-auth-tab'));
        });
    });

    // Skip login button
    var btnSkip = document.getElementById('btnSkipLogin');
    if (btnSkip) {
        btnSkip.addEventListener('click', function() {
            localStorage.setItem('umkm_skip_login', 'true');
            showToast('Selamat datang! Data tersimpan di perangkat ini saja.', 'success');
            setTimeout(function() {
                window.location.replace('./index.html');
            }, 500);
        });
    }
});