// ===== UTILITY FUNCTIONS =====
function formatRupiah(num) {
    if (isNaN(num) || num === null || num === undefined) return 'Rp 0';
    var absNum = Math.abs(num);
    var formatted = absNum.toLocaleString('id-ID');
    return (num < 0 ? '-Rp ' : 'Rp ') + formatted;
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

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

function getFromStorage(key) {
    try {
        var data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        return [];
    }
}

function saveToStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        // Trigger cloud sync if available
        if (window._firebaseSync && window._firebaseSync.saveToCloud) {
            window._firebaseSync.saveToCloud();
        }
    } catch (e) {
        showToast('Gagal menyimpan data!', 'error');
    }
}

function escapeHtml(text) {
    if (!text) return '';
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(text));
    return div.innerHTML;
}

// ===== AUTH GUARD =====
// Check if user is allowed to access this page
// Firebase onAuthStateChanged in firebase.js will handle the actual redirect
// This is a quick check for skip-login users
function checkAuthGuard() {
    var skippedLogin = localStorage.getItem('umkm_skip_login');
    // If skip login is set, allow access immediately
    if (skippedLogin === 'true') {
        return true;
    }
    // Otherwise, firebase.js onAuthStateChanged will handle it
    return false;
}

// ===== FALLBACK LOGOUT HANDLER =====
// This function is called via onclick attribute on the logout button
// It works as a fallback in case the Firebase module event listener fails
function handleLogoutClick() {
    console.log("LOGOUT BUTTON CLICKED (fallback handler)");
    
    // Prevent double-click
    var logoutBtn = document.getElementById('btnLogout');
    if (logoutBtn) {
        logoutBtn.disabled = true;
        logoutBtn.textContent = '⏳ Logout...';
    }

    // Try Firebase logout if available
    if (typeof window._firebaseLogout === 'function') {
        console.log("Using Firebase logout");
        try {
            window._firebaseLogout();
        } catch (err) {
            console.error("Firebase logout error:", err);
            // Force fallback redirect
            forceLogoutRedirect();
        }
        return;
    }
    
    // If Firebase module hasn't loaded yet, wait briefly and retry once
    console.log("Firebase logout not available yet, waiting...");
    setTimeout(function() {
        if (typeof window._firebaseLogout === 'function') {
            console.log("Firebase logout now available, retrying");
            try {
                window._firebaseLogout();
            } catch (err) {
                console.error("Firebase logout retry error:", err);
                forceLogoutRedirect();
            }
        } else {
            console.log("Firebase logout still not available, using fallback");
            forceLogoutRedirect();
        }
    }, 500);
}

// Force logout and redirect regardless of Firebase state
function forceLogoutRedirect() {
    localStorage.removeItem('umkm_skip_login');
    showToast('Berhasil logout!', 'success');
    setTimeout(function() {
        window.location.replace('./login.html');
    }, 500);
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
                    // Show main app if auth guard passes (skip login)
                    if (checkAuthGuard()) {
                        showMainApp();
                    }
                    // Otherwise firebase.js onAuthStateChanged will handle showing the app or redirecting
                }, 600);
            }, 400);
        }
    }, 300);
}

// ===== SHOW/HIDE MAIN APP =====
function showMainApp() {
    var mainApp = document.getElementById('mainApp');
    if (mainApp) mainApp.style.display = 'block';
    refreshDashboard();
}

// Redirect to login page (used by firebase.js when user is not authenticated)
function goToLogin() {
    window.location.replace('./login.html');
}

// ===== DARK MODE =====
function initDarkMode() {
    var savedTheme = localStorage.getItem('umkm_theme') || 'light';
    applyTheme(savedTheme);

    var toggleEl = document.getElementById('darkModeToggle');
    var mobileToggleEl = document.getElementById('mobileDarkModeToggle');

    if (toggleEl) {
        toggleEl.addEventListener('click', function() {
            var current = document.documentElement.getAttribute('data-theme') || 'light';
            var newTheme = current === 'dark' ? 'light' : 'dark';
            applyTheme(newTheme);
            localStorage.setItem('umkm_theme', newTheme);
        });
    }

    if (mobileToggleEl) {
        mobileToggleEl.addEventListener('click', function() {
            var current = document.documentElement.getAttribute('data-theme') || 'light';
            var newTheme = current === 'dark' ? 'light' : 'dark';
            applyTheme(newTheme);
            localStorage.setItem('umkm_theme', newTheme);
        });
    }
}

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    updateDarkModeLabels(theme);
}

function updateDarkModeLabels(theme) {
    var icon = theme === 'dark' ? '\u2600\uFE0F' : '\uD83C\uDF19';
    var label = theme === 'dark' ? 'Mode Terang' : 'Mode Gelap';
    var mobileLabel = theme === 'dark' ? 'Terang' : 'Gelap';

    var darkModeIcon = document.getElementById('darkModeIcon');
    var darkModeLabel = document.getElementById('darkModeLabel');
    var mobileDarkModeIcon = document.getElementById('mobileDarkModeIcon');
    var mobileDarkModeLabel = document.getElementById('mobileDarkModeLabel');

    if (darkModeIcon) darkModeIcon.textContent = icon;
    if (darkModeLabel) darkModeLabel.textContent = label;
    if (mobileDarkModeIcon) mobileDarkModeIcon.textContent = icon;
    if (mobileDarkModeLabel) mobileDarkModeLabel.textContent = mobileLabel;
}

// ===== NAVIGATION =====
function initNavigation() {
    var navItems = document.querySelectorAll('.nav-item');
    var mobileItems = document.querySelectorAll('.mobile-nav-item');
    var pages = document.querySelectorAll('.page');

    function switchPage(pageName) {
        pages.forEach(function(p) { p.classList.remove('active'); });
        var target = document.getElementById('page-' + pageName);
        if (target) target.classList.add('active');

        navItems.forEach(function(item) {
            item.classList.toggle('active', item.getAttribute('data-page') === pageName);
        });

        mobileItems.forEach(function(item) {
            item.classList.toggle('active', item.getAttribute('data-page') === pageName);
        });

        window.scrollTo({ top: 0, behavior: 'smooth' });

        if (pageName === 'dashboard') refreshDashboard();
        if (pageName === 'finance') refreshFinance();
        if (pageName === 'stock') refreshStock();
    }

    navItems.forEach(function(item) {
        item.addEventListener('click', function() {
            switchPage(this.getAttribute('data-page'));
        });
    });

    mobileItems.forEach(function(item) {
        item.addEventListener('click', function() {
            var page = this.getAttribute('data-page');
            if (page) switchPage(page);
        });
    });

    document.querySelectorAll('[data-page]').forEach(function(el) {
        if (!el.classList.contains('nav-item') && !el.classList.contains('mobile-nav-item')) {
            el.addEventListener('click', function() {
                switchPage(this.getAttribute('data-page'));
            });
        }
    });
}

// ===== DASHBOARD =====
function refreshDashboard() {
    var transactions = getFromStorage('umkm_transactions');
    var products = getFromStorage('umkm_products');

    var totalIncome = 0;
    var totalExpense = 0;

    transactions.forEach(function(t) {
        if (t.type === 'income') totalIncome += t.amount;
        else totalExpense += t.amount;
    });

    var dashIncome = document.getElementById('dashIncome');
    var dashExpense = document.getElementById('dashExpense');
    var dashProfit = document.getElementById('dashProfit');
    var dashProducts = document.getElementById('dashProducts');

    if (dashIncome) dashIncome.textContent = formatRupiah(totalIncome);
    if (dashExpense) dashExpense.textContent = formatRupiah(totalExpense);
    if (dashProfit) dashProfit.textContent = formatRupiah(totalIncome - totalExpense);
    if (dashProducts) dashProducts.textContent = products.length;

    // Low stock warning
    var lowStock = products.filter(function(p) { return p.qty <= p.minQty; });
    var lowStockSection = document.getElementById('lowStockSection');
    var lowStockList = document.getElementById('lowStockList');

    if (lowStockSection && lowStockList) {
        if (lowStock.length > 0) {
            lowStockSection.style.display = 'block';
            lowStockList.innerHTML = lowStock.map(function(p) {
                return '<div class="low-stock-item">' +
                    '<span class="stock-name">' + escapeHtml(p.name) + '</span>' +
                    '<span class="stock-qty">Sisa: ' + p.qty + '</span>' +
                    '</div>';
            }).join('');
        } else {
            lowStockSection.style.display = 'none';
        }
    }

    // Recent transactions (last 5)
    var recent = transactions.slice().sort(function(a, b) {
        return new Date(b.date) - new Date(a.date);
    }).slice(0, 5);

    var recentEl = document.getElementById('recentTransactions');
    if (!recentEl) return;

    if (recent.length === 0) {
        recentEl.innerHTML = '<div class="empty-state-box">' +
            '<span class="empty-icon">\uD83D\uDCDD</span>' +
            '<p>Belum ada transaksi yang dicatat.</p>' +
            '<p class="empty-hint">Klik menu <strong>"Catat Keuangan"</strong> di samping kiri untuk mulai mencatat!</p>' +
            '</div>';
    } else {
        recentEl.innerHTML = recent.map(function(t) {
            var isIncome = t.type === 'income';
            return '<div class="recent-item">' +
                '<div class="ri-left">' +
                '<div class="ri-type ' + (isIncome ? 'income-type' : 'expense-type') + '">' +
                (isIncome ? '\uD83D\uDCB5' : '\uD83D\uDCB8') + '</div>' +
                '<div class="ri-info">' +
                '<div class="ri-cat">' + escapeHtml(t.category) + '</div>' +
                '<div class="ri-note">' + escapeHtml(t.note || '-') + ' \u00B7 ' + t.date + '</div>' +
                '</div></div>' +
                '<div class="ri-amount ' + (isIncome ? 'income-amount' : 'expense-amount') + '">' +
                (isIncome ? '+' : '-') + formatRupiah(t.amount) + '</div>' +
                '</div>';
        }).join('');
    }

    // Refresh chart if available
    if (typeof window.refreshDashboardChart === 'function') {
        window.refreshDashboardChart();
    }
}

// ===== DASHBOARD EXPORT EXCEL =====
function exportDashboardExcel() {
    if (typeof XLSX === 'undefined') {
        showToast('Library Excel belum dimuat. Coba refresh halaman.', 'error');
        return;
    }

    var transactions = getFromStorage('umkm_transactions');
    var products = getFromStorage('umkm_products');

    var totalIncome = 0;
    var totalExpense = 0;
    transactions.forEach(function(t) {
        if (t.type === 'income') totalIncome += t.amount;
        else totalExpense += t.amount;
    });

    var wb = XLSX.utils.book_new();

    var summaryData = [
        ['Ringkasan Dashboard UMKM Mudah'],
        [''],
        ['Metrik', 'Jumlah'],
        ['Total Uang Masuk', totalIncome],
        ['Total Uang Keluar', totalExpense],
        ['Keuntungan Bersih', totalIncome - totalExpense],
        ['Jumlah Produk', products.length],
        [''],
        ['Diekspor pada', new Date().toLocaleString('id-ID')]
    ];
    var ws1 = XLSX.utils.aoa_to_sheet(summaryData);
    ws1['!cols'] = [{ wch: 25 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, ws1, 'Ringkasan');

    var lowStock = products.filter(function(p) { return p.qty <= p.minQty; });
    if (lowStock.length > 0) {
        var lowStockData = [
            ['Peringatan Stok Menipis'],
            [''],
            ['Nama Produk', 'Stok Saat Ini', 'Batas Minimum']
        ];
        lowStock.forEach(function(p) {
            lowStockData.push([p.name, p.qty, p.minQty]);
        });
        var ws2 = XLSX.utils.aoa_to_sheet(lowStockData);
        ws2['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(wb, ws2, 'Stok Menipis');
    }

    var recentTx = transactions.slice().sort(function(a, b) {
        return new Date(b.date) - new Date(a.date);
    }).slice(0, 20);
    if (recentTx.length > 0) {
        var txData = [
            ['Transaksi Terakhir (maks 20)'],
            [''],
            ['Tanggal', 'Jenis', 'Kategori', 'Jumlah (Rp)', 'Keterangan']
        ];
        recentTx.forEach(function(t) {
            txData.push([
                t.date,
                t.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
                t.category,
                t.amount,
                t.note || '-'
            ]);
        });
        var ws3 = XLSX.utils.aoa_to_sheet(txData);
        ws3['!cols'] = [{ wch: 12 }, { wch: 14 }, { wch: 18 }, { wch: 15 }, { wch: 30 }];
        XLSX.utils.book_append_sheet(wb, ws3, 'Transaksi Terakhir');
    }

    XLSX.writeFile(wb, 'Dashboard_UMKM_' + new Date().toISOString().split('T')[0] + '.xlsx');
    showToast('Dashboard berhasil diexport ke Excel!', 'success');
}

// ===== SCROLL TO DOC =====
function scrollToDoc(id) {
    var el = document.getElementById(id);
    if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    return false;
}

// ===== SUPPORT MODULE =====
function initSupport() {
    var btnSendDiscord = document.getElementById('btnSendDiscord');
    var btnCopyMessage = document.getElementById('btnCopyMessage');

    if (btnSendDiscord) {
        btnSendDiscord.addEventListener('click', function() {
            var message = buildSupportMessage();
            if (!message) return;
            sendToDiscordWebhook(message);
        });
    }

    if (btnCopyMessage) {
        btnCopyMessage.addEventListener('click', function() {
            var message = buildSupportMessage();
            if (!message) return;

            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(message).then(function() {
                    showToast('Pesan berhasil disalin ke clipboard!', 'success');
                }).catch(function() {
                    fallbackCopy(message);
                });
            } else {
                fallbackCopy(message);
            }
        });
    }
}

function buildSupportMessage() {
    var name = document.getElementById('supportName').value.trim();
    var email = document.getElementById('supportEmail').value.trim();
    var category = document.getElementById('supportCategory').value;
    var messageText = document.getElementById('supportMessage').value.trim();

    if (!name) {
        showToast('Mohon isi nama kamu!', 'error');
        return null;
    }
    if (!messageText) {
        showToast('Mohon isi pesan / pertanyaan kamu!', 'error');
        return null;
    }

    var msg = '--- Pesan dari UMKM Mudah ---\n';
    msg += 'Nama: ' + name + '\n';
    if (email) msg += 'Email: ' + email + '\n';
    msg += 'Kategori: ' + category + '\n';
    msg += 'Pesan:\n' + messageText + '\n';
    msg += '---';

    return msg;
}

function fallbackCopy(text) {
    var textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
        document.execCommand('copy');
        showToast('Pesan berhasil disalin!', 'success');
    } catch (e) {
        showToast('Gagal menyalin. Coba salin manual.', 'error');
    }
    document.body.removeChild(textarea);
}

function sendToDiscordWebhook(message) {
    var webhookUrl = 'https://discord.com/api/webhooks/1363130852275392613/ICOI416wzg0Ib83xT3LfiIKvr1Ad2IVxYFpnCsbrqaLC5RmA76dXtQY9mrzDaTXeEh89';

    var name = document.getElementById('supportName').value.trim();
    var email = document.getElementById('supportEmail').value.trim();
    var category = document.getElementById('supportCategory').value;
    var messageText = document.getElementById('supportMessage').value.trim();

    var embed = {
        title: '\uD83D\uDCAC Pesan Baru dari UMKM Mudah',
        color: 1484084,
        fields: [
            { name: '\uD83D\uDC64 Nama', value: name, inline: true },
            { name: '\uD83D\uDCCB Kategori', value: category, inline: true }
        ],
        timestamp: new Date().toISOString(),
        footer: { text: 'UMKM Mudah - Support Form' }
    };

    if (email) {
        embed.fields.push({ name: '\uD83D\uDCE7 Email', value: email, inline: true });
    }

    embed.fields.push({ name: '\uD83D\uDCAC Pesan', value: messageText, inline: false });

    var payload = {
        username: 'UMKM Mudah Bot',
        avatar_url: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f33f.png',
        embeds: [embed]
    };

    var btnSendDiscord = document.getElementById('btnSendDiscord');
    var originalText = btnSendDiscord.textContent;
    btnSendDiscord.disabled = true;
    btnSendDiscord.textContent = '\u23F3 Mengirim...';

    fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(function(response) {
        if (response.ok || response.status === 204) {
            showToast('\u2705 Pesan berhasil dikirim ke Discord!', 'success');
            document.getElementById('supportForm').reset();
        } else {
            showToast('\u274C Gagal mengirim pesan. Coba lagi nanti.', 'error');
        }
    })
    .catch(function() {
        showToast('\u274C Gagal mengirim pesan. Periksa koneksi internet.', 'error');
    })
    .finally(function() {
        btnSendDiscord.disabled = false;
        btnSendDiscord.textContent = originalText;
    });
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', function() {
    // Start loading screen
    initLoadingScreen();

    // Init dark mode early
    initDarkMode();

    // Init main app modules
    initNavigation();
    initCalculator();
    initFinance();
    initInvoice();
    initStock();
    initSupport();

    // Dashboard export button
    var btnExportDash = document.getElementById('btnExportDashboard');
    if (btnExportDash) {
        btnExportDash.addEventListener('click', exportDashboardExcel);
    }

    // Set default dates
    var today = new Date().toISOString().split('T')[0];
    var finDateEl = document.getElementById('finDate');
    if (finDateEl) finDateEl.value = today;
    var invDateEl = document.getElementById('invDate');
    if (invDateEl) invDateEl.value = today;
});