// ===== SEARCH FEATURE =====
// Fitur pencarian untuk Stok Barang dan Riwayat Keuangan

(function() {
    'use strict';

    // ===== STOCK SEARCH =====
    function initStockSearch() {
        var stockTableBody = document.getElementById('stockTableBody');
        var stockEmpty = document.getElementById('stockEmpty');
        if (!stockTableBody) return;

        // Create search bar
        var searchWrap = document.createElement('div');
        searchWrap.className = 'search-bar-wrap';
        searchWrap.innerHTML = 
            '<div class="search-input-group">' +
                '<span class="search-icon">🔍</span>' +
                '<input type="text" id="stockSearchInput" class="search-input" placeholder="Cari produk berdasarkan nama atau kategori...">' +
                '<button type="button" class="search-clear-btn" id="stockSearchClear" style="display:none;">✕</button>' +
            '</div>';

        // Insert before the stock table card
        var stockTableCard = stockTableBody.closest('.card');
        if (stockTableCard) {
            stockTableCard.parentNode.insertBefore(searchWrap, stockTableCard);
        }

        var searchInput = document.getElementById('stockSearchInput');
        var clearBtn = document.getElementById('stockSearchClear');

        searchInput.addEventListener('input', function() {
            var query = this.value.toLowerCase().trim();
            clearBtn.style.display = query ? 'block' : 'none';
            filterStockTable(query);
        });

        clearBtn.addEventListener('click', function() {
            searchInput.value = '';
            clearBtn.style.display = 'none';
            filterStockTable('');
            searchInput.focus();
        });
    }

    function filterStockTable(query) {
        var rows = document.querySelectorAll('#stockTableBody tr');
        var visibleCount = 0;

        rows.forEach(function(row) {
            var name = (row.cells[0] && row.cells[0].textContent || '').toLowerCase();
            var category = (row.cells[1] && row.cells[1].textContent || '').toLowerCase();

            if (!query || name.indexOf(query) !== -1 || category.indexOf(query) !== -1) {
                row.style.display = '';
                visibleCount++;
            } else {
                row.style.display = 'none';
            }
        });

        // Show/hide empty state
        var stockEmpty = document.getElementById('stockEmpty');
        var stockTable = document.getElementById('stockTable');
        
        if (rows.length === 0) {
            // No data at all
            if (stockEmpty) stockEmpty.style.display = '';
            if (stockTable) stockTable.style.display = 'none';
        } else if (visibleCount === 0 && query) {
            // Has data but no search results
            if (stockEmpty) {
                stockEmpty.style.display = '';
                stockEmpty.innerHTML = 
                    '<span class="empty-icon">🔍</span>' +
                    '<p>Tidak ditemukan produk dengan kata kunci "<strong>' + escapeHtml(query) + '</strong>"</p>' +
                    '<p class="empty-hint">Coba kata kunci lain</p>';
            }
            if (stockTable) stockTable.style.display = 'none';
        } else {
            if (stockEmpty) stockEmpty.style.display = 'none';
            if (stockTable) stockTable.style.display = '';
        }
    }

    // ===== FINANCE SEARCH =====
    function initFinanceSearch() {
        var financeTableBody = document.getElementById('financeTableBody');
        if (!financeTableBody) return;

        // Create search bar
        var searchWrap = document.createElement('div');
        searchWrap.className = 'search-bar-wrap';
        searchWrap.innerHTML = 
            '<div class="search-input-group">' +
                '<span class="search-icon">🔍</span>' +
                '<input type="text" id="financeSearchInput" class="search-input" placeholder="Cari transaksi berdasarkan kategori atau keterangan...">' +
                '<button type="button" class="search-clear-btn" id="financeSearchClear" style="display:none;">✕</button>' +
            '</div>';

        // Insert before the finance table card
        var financeTableCard = financeTableBody.closest('.card');
        if (financeTableCard) {
            financeTableCard.parentNode.insertBefore(searchWrap, financeTableCard);
        }

        var searchInput = document.getElementById('financeSearchInput');
        var clearBtn = document.getElementById('financeSearchClear');

        searchInput.addEventListener('input', function() {
            var query = this.value.toLowerCase().trim();
            clearBtn.style.display = query ? 'block' : 'none';
            filterFinanceTable(query);
        });

        clearBtn.addEventListener('click', function() {
            searchInput.value = '';
            clearBtn.style.display = 'none';
            filterFinanceTable('');
            searchInput.focus();
        });
    }

    function filterFinanceTable(query) {
        var rows = document.querySelectorAll('#financeTableBody tr');
        var visibleCount = 0;

        rows.forEach(function(row) {
            var category = (row.cells[2] && row.cells[2].textContent || '').toLowerCase();
            var note = (row.cells[4] && row.cells[4].textContent || '').toLowerCase();
            var date = (row.cells[0] && row.cells[0].textContent || '').toLowerCase();

            if (!query || category.indexOf(query) !== -1 || note.indexOf(query) !== -1 || date.indexOf(query) !== -1) {
                row.style.display = '';
                visibleCount++;
            } else {
                row.style.display = 'none';
            }
        });

        var financeEmpty = document.getElementById('financeEmpty');
        var financeTable = document.getElementById('financeTable');

        if (rows.length === 0) {
            if (financeEmpty) financeEmpty.style.display = '';
            if (financeTable) financeTable.style.display = 'none';
        } else if (visibleCount === 0 && query) {
            if (financeEmpty) {
                financeEmpty.style.display = '';
                financeEmpty.innerHTML = 
                    '<span class="empty-icon">🔍</span>' +
                    '<p>Tidak ditemukan transaksi dengan kata kunci "<strong>' + escapeHtml(query) + '</strong>"</p>' +
                    '<p class="empty-hint">Coba kata kunci lain</p>';
            }
            if (financeTable) financeTable.style.display = 'none';
        } else {
            if (financeEmpty) financeEmpty.style.display = 'none';
            if (financeTable) financeTable.style.display = '';
        }
    }

    // Helper
    function escapeHtml(text) {
        if (!text) return '';
        var div = document.createElement('div');
        div.appendChild(document.createTextNode(text));
        return div.innerHTML;
    }

    // Init on DOM ready
    document.addEventListener('DOMContentLoaded', function() {
        initStockSearch();
        initFinanceSearch();
    });
})();