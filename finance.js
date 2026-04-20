// ===== FINANCE MODULE =====
var financeFilterMonth = '';

function initFinance() {
    var form = document.getElementById('financeForm');
    var btnFilter = document.getElementById('btnFilterFinance');
    var btnShowAll = document.getElementById('btnShowAllFinance');
    var btnExport = document.getElementById('btnExportFinance');

    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            addTransaction();
        });
    }

    if (btnFilter) {
        btnFilter.addEventListener('click', function() {
            var monthInput = document.getElementById('financeMonth').value;
            if (monthInput) {
                financeFilterMonth = monthInput;
                refreshFinance();
            } else {
                showToast('Pilih bulan terlebih dahulu!', 'warning');
            }
        });
    }

    if (btnShowAll) {
        btnShowAll.addEventListener('click', function() {
            financeFilterMonth = '';
            document.getElementById('financeMonth').value = '';
            refreshFinance();
        });
    }

    if (btnExport) {
        btnExport.addEventListener('click', exportFinanceExcel);
    }
}

function addTransaction() {
    var date = document.getElementById('finDate').value;
    var type = document.getElementById('finType').value;
    var category = document.getElementById('finCategory').value;
    var amount = parseFloat(document.getElementById('finAmount').value) || 0;
    var note = document.getElementById('finNote').value;

    if (!date || amount <= 0) {
        showToast('Mohon isi tanggal dan jumlah!', 'error');
        return;
    }

    var transactions = getFromStorage('umkm_transactions');
    transactions.push({
        id: generateId(),
        date: date,
        type: type,
        category: category,
        amount: amount,
        note: note
    });

    saveToStorage('umkm_transactions', transactions);
    showToast('Transaksi berhasil disimpan!', 'success');

    document.getElementById('finAmount').value = '';
    document.getElementById('finNote').value = '';

    refreshFinance();
}

function deleteTransaction(id) {
    var transactions = getFromStorage('umkm_transactions');
    transactions = transactions.filter(function(t) { return t.id !== id; });
    saveToStorage('umkm_transactions', transactions);
    showToast('Transaksi berhasil dihapus!', 'success');
    refreshFinance();
}

function refreshFinance() {
    var transactions = getFromStorage('umkm_transactions');

    var filtered = transactions;
    if (financeFilterMonth) {
        filtered = transactions.filter(function(t) {
            return t.date.startsWith(financeFilterMonth);
        });
    }

    filtered.sort(function(a, b) {
        return new Date(b.date) - new Date(a.date);
    });

    var totalIncome = 0;
    var totalExpense = 0;

    filtered.forEach(function(t) {
        if (t.type === 'income') totalIncome += t.amount;
        else totalExpense += t.amount;
    });

    var finTotalIncome = document.getElementById('finTotalIncome');
    var finTotalExpense = document.getElementById('finTotalExpense');
    var finBalance = document.getElementById('finBalance');

    if (finTotalIncome) finTotalIncome.textContent = formatRupiah(totalIncome);
    if (finTotalExpense) finTotalExpense.textContent = formatRupiah(totalExpense);
    if (finBalance) finBalance.textContent = formatRupiah(totalIncome - totalExpense);

    var tbody = document.getElementById('financeTableBody');
    var emptyEl = document.getElementById('financeEmpty');
    var tableEl = document.getElementById('financeTable');

    if (!tbody) return;

    if (filtered.length === 0) {
        if (emptyEl) emptyEl.style.display = 'block';
        if (tableEl) tableEl.style.display = 'none';
    } else {
        if (emptyEl) emptyEl.style.display = 'none';
        if (tableEl) tableEl.style.display = 'table';

        tbody.innerHTML = filtered.map(function(t) {
            var isIncome = t.type === 'income';
            return '<tr>' +
                '<td>' + t.date + '</td>' +
                '<td><span class="' + (isIncome ? 'badge-income' : 'badge-expense') + '">' +
                (isIncome ? 'Pemasukan' : 'Pengeluaran') + '</span></td>' +
                '<td>' + escapeHtml(t.category) + '</td>' +
                '<td style="font-weight:600;color:' + (isIncome ? 'var(--secondary)' : 'var(--danger)') + '">' +
                (isIncome ? '+' : '-') + formatRupiah(t.amount) + '</td>' +
                '<td>' + escapeHtml(t.note || '-') + '</td>' +
                '<td><button class="btn btn-danger btn-xs" onclick="deleteTransaction(\'' + t.id + '\')">Hapus</button></td>' +
                '</tr>';
        }).join('');
    }
}

// ===== FINANCE EXPORT EXCEL =====
function exportFinanceExcel() {
    if (typeof XLSX === 'undefined') {
        showToast('Library Excel belum dimuat. Coba refresh halaman.', 'error');
        return;
    }

    var transactions = getFromStorage('umkm_transactions');

    if (transactions.length === 0) {
        showToast('Belum ada transaksi untuk diexport!', 'warning');
        return;
    }

    transactions.sort(function(a, b) {
        return new Date(b.date) - new Date(a.date);
    });

    var totalIncome = 0;
    var totalExpense = 0;
    transactions.forEach(function(t) {
        if (t.type === 'income') totalIncome += t.amount;
        else totalExpense += t.amount;
    });

    var wb = XLSX.utils.book_new();

    var txData = [
        ['Catatan Keuangan UMKM Mudah'],
        [''],
        ['Tanggal', 'Jenis', 'Kategori', 'Jumlah (Rp)', 'Keterangan']
    ];
    transactions.forEach(function(t) {
        txData.push([
            t.date,
            t.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
            t.category,
            t.amount,
            t.note || '-'
        ]);
    });
    txData.push(['']);
    txData.push(['', '', 'Total Pemasukan', totalIncome, '']);
    txData.push(['', '', 'Total Pengeluaran', totalExpense, '']);
    txData.push(['', '', 'Sisa Uang', totalIncome - totalExpense, '']);
    txData.push(['']);
    txData.push(['Diekspor pada', new Date().toLocaleString('id-ID')]);

    var ws1 = XLSX.utils.aoa_to_sheet(txData);
    ws1['!cols'] = [{ wch: 12 }, { wch: 14 }, { wch: 18 }, { wch: 15 }, { wch: 35 }];

    for (var i = 3; i < txData.length; i++) {
        var cellRef = XLSX.utils.encode_cell({ r: i, c: 3 });
        if (ws1[cellRef] && typeof ws1[cellRef].v === 'number') {
            ws1[cellRef].z = '#,##0';
        }
    }

    XLSX.utils.book_append_sheet(wb, ws1, 'Transaksi');

    var catMap = {};
    transactions.forEach(function(t) {
        var key = t.category + '|' + t.type;
        if (!catMap[key]) catMap[key] = { category: t.category, type: t.type, total: 0, count: 0 };
        catMap[key].total += t.amount;
        catMap[key].count++;
    });

    var catData = [
        ['Ringkasan per Kategori'],
        [''],
        ['Kategori', 'Jenis', 'Jumlah Transaksi', 'Total (Rp)']
    ];
    Object.keys(catMap).sort().forEach(function(key) {
        var c = catMap[key];
        catData.push([c.category, c.type === 'income' ? 'Pemasukan' : 'Pengeluaran', c.count, c.total]);
    });

    var ws2 = XLSX.utils.aoa_to_sheet(catData);
    ws2['!cols'] = [{ wch: 20 }, { wch: 14 }, { wch: 18 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, ws2, 'Ringkasan Kategori');

    XLSX.writeFile(wb, 'Keuangan_UMKM_' + new Date().toISOString().split('T')[0] + '.xlsx');
    showToast('Data keuangan berhasil diexport ke Excel!', 'success');
}