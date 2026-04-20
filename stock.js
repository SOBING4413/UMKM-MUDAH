// ===== STOCK MODULE =====
function initStock() {
    var form = document.getElementById('stockForm');
    var btnAdjust = document.getElementById('btnStockAdjust');
    var btnCancel = document.getElementById('btnStockCancel');
    var btnExport = document.getElementById('btnExportStock');

    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            saveProduct();
        });
    }

    if (btnAdjust) {
        btnAdjust.addEventListener('click', adjustStock);
    }

    if (btnCancel) {
        btnCancel.addEventListener('click', cancelEdit);
    }

    if (btnExport) {
        btnExport.addEventListener('click', exportStockExcel);
    }

    refreshStock();
}

function saveProduct() {
    var editId = document.getElementById('stockEditId').value;
    var name = document.getElementById('stockName').value;
    var category = document.getElementById('stockCategory').value || 'Umum';
    var buyPrice = parseFloat(document.getElementById('stockBuyPrice').value) || 0;
    var sellPrice = parseFloat(document.getElementById('stockSellPrice').value) || 0;
    var qty = parseInt(document.getElementById('stockQty').value) || 0;
    var minQty = parseInt(document.getElementById('stockMinQty').value) || 10;

    if (!name || buyPrice <= 0 || sellPrice <= 0) {
        showToast('Mohon isi nama, harga beli, dan harga jual!', 'error');
        return;
    }

    var products = getFromStorage('umkm_products');

    if (editId) {
        products = products.map(function(p) {
            if (p.id === editId) {
                return {
                    id: p.id,
                    name: name,
                    category: category,
                    buyPrice: buyPrice,
                    sellPrice: sellPrice,
                    qty: qty,
                    minQty: minQty
                };
            }
            return p;
        });
        showToast('Produk berhasil diperbarui!', 'success');
    } else {
        products.push({
            id: generateId(),
            name: name,
            category: category,
            buyPrice: buyPrice,
            sellPrice: sellPrice,
            qty: qty,
            minQty: minQty
        });
        showToast('Produk berhasil ditambahkan!', 'success');
    }

    saveToStorage('umkm_products', products);
    resetStockForm();
    refreshStock();
}

function editProduct(id) {
    var products = getFromStorage('umkm_products');
    var product = products.find(function(p) { return p.id === id; });

    if (!product) return;

    document.getElementById('stockEditId').value = product.id;
    document.getElementById('stockName').value = product.name;
    document.getElementById('stockCategory').value = product.category;
    document.getElementById('stockBuyPrice').value = product.buyPrice;
    document.getElementById('stockSellPrice').value = product.sellPrice;
    document.getElementById('stockQty').value = product.qty;
    document.getElementById('stockMinQty').value = product.minQty;

    document.getElementById('stockFormTitle').textContent = 'Edit Produk';
    document.getElementById('btnStockSubmit').textContent = 'Simpan Perubahan';
    document.getElementById('btnStockCancel').style.display = 'inline-flex';

    document.getElementById('stockForm').scrollIntoView({ behavior: 'smooth' });
}

function deleteProduct(id) {
    if (!confirm('Yakin ingin menghapus produk ini?')) return;

    var products = getFromStorage('umkm_products');
    products = products.filter(function(p) { return p.id !== id; });
    saveToStorage('umkm_products', products);
    showToast('Produk berhasil dihapus!', 'success');
    refreshStock();
}

function cancelEdit() {
    resetStockForm();
}

function resetStockForm() {
    document.getElementById('stockForm').reset();
    document.getElementById('stockEditId').value = '';
    document.getElementById('stockFormTitle').textContent = 'Tambah Produk Baru';
    document.getElementById('btnStockSubmit').textContent = 'Tambah Produk';
    document.getElementById('btnStockCancel').style.display = 'none';
    document.getElementById('stockMinQty').value = '10';
}

function adjustStock() {
    var productId = document.getElementById('stockAdjProduct').value;
    var adjType = document.getElementById('stockAdjType').value;
    var adjQty = parseInt(document.getElementById('stockAdjQty').value) || 0;

    if (!productId) {
        showToast('Pilih produk terlebih dahulu!', 'error');
        return;
    }

    if (adjQty <= 0) {
        showToast('Masukkan jumlah yang valid!', 'error');
        return;
    }

    var products = getFromStorage('umkm_products');
    var updated = false;

    products = products.map(function(p) {
        if (p.id === productId) {
            if (adjType === 'in') {
                p.qty += adjQty;
                updated = true;
            } else {
                if (p.qty >= adjQty) {
                    p.qty -= adjQty;
                    updated = true;
                } else {
                    showToast('Stok tidak mencukupi! Stok saat ini: ' + p.qty, 'error');
                }
            }
        }
        return p;
    });

    if (updated) {
        saveToStorage('umkm_products', products);
        showToast('Stok berhasil diperbarui!', 'success');
        document.getElementById('stockAdjQty').value = '';
        refreshStock();
    }
}

function refreshStock() {
    var products = getFromStorage('umkm_products');

    var tbody = document.getElementById('stockTableBody');
    var emptyEl = document.getElementById('stockEmpty');
    var tableEl = document.getElementById('stockTable');

    if (!tbody) return;

    if (products.length === 0) {
        if (emptyEl) emptyEl.style.display = 'block';
        if (tableEl) tableEl.style.display = 'none';
    } else {
        if (emptyEl) emptyEl.style.display = 'none';
        if (tableEl) tableEl.style.display = 'table';

        tbody.innerHTML = products.map(function(p) {
            var status = '';
            if (p.qty <= 0) {
                status = '<span class="badge-danger">Habis</span>';
            } else if (p.qty <= p.minQty) {
                status = '<span class="badge-warning">Menipis</span>';
            } else {
                status = '<span class="badge-ok">Aman</span>';
            }

            return '<tr>' +
                '<td><strong>' + escapeHtml(p.name) + '</strong></td>' +
                '<td>' + escapeHtml(p.category) + '</td>' +
                '<td>' + formatRupiah(p.buyPrice) + '</td>' +
                '<td>' + formatRupiah(p.sellPrice) + '</td>' +
                '<td><strong>' + p.qty + '</strong></td>' +
                '<td>' + status + '</td>' +
                '<td>' +
                '<button class="btn btn-primary btn-xs" onclick="editProduct(\'' + p.id + '\')" style="margin-right:4px;">Edit</button>' +
                '<button class="btn btn-danger btn-xs" onclick="deleteProduct(\'' + p.id + '\')">Hapus</button>' +
                '</td>' +
                '</tr>';
        }).join('');
    }

    var select = document.getElementById('stockAdjProduct');
    if (select) {
        var currentVal = select.value;
        select.innerHTML = '<option value="">-- Pilih Produk --</option>';
        products.forEach(function(p) {
            var option = document.createElement('option');
            option.value = p.id;
            option.textContent = p.name + ' (Stok: ' + p.qty + ')';
            select.appendChild(option);
        });
        if (currentVal) select.value = currentVal;
    }
}

// ===== STOCK EXPORT EXCEL =====
function exportStockExcel() {
    if (typeof XLSX === 'undefined') {
        showToast('Library Excel belum dimuat. Coba refresh halaman.', 'error');
        return;
    }

    var products = getFromStorage('umkm_products');

    if (products.length === 0) {
        showToast('Belum ada produk untuk diexport!', 'warning');
        return;
    }

    var wb = XLSX.utils.book_new();

    var prodData = [
        ['Daftar Stok Barang UMKM Mudah'],
        [''],
        ['Nama Produk', 'Kategori', 'Harga Beli (Rp)', 'Harga Jual (Rp)', 'Stok', 'Batas Minimum', 'Status']
    ];
    products.forEach(function(p) {
        var status = 'Aman';
        if (p.qty <= 0) status = 'Habis';
        else if (p.qty <= p.minQty) status = 'Menipis';

        prodData.push([p.name, p.category, p.buyPrice, p.sellPrice, p.qty, p.minQty, status]);
    });

    var totalBuyValue = 0;
    var totalSellValue = 0;
    products.forEach(function(p) {
        totalBuyValue += p.buyPrice * p.qty;
        totalSellValue += p.sellPrice * p.qty;
    });

    prodData.push(['']);
    prodData.push(['Ringkasan']);
    prodData.push(['Total Jenis Produk', products.length]);
    prodData.push(['Total Nilai Stok (Harga Beli)', totalBuyValue]);
    prodData.push(['Total Nilai Stok (Harga Jual)', totalSellValue]);
    prodData.push(['Potensi Keuntungan', totalSellValue - totalBuyValue]);

    var lowStockCount = products.filter(function(p) { return p.qty <= p.minQty; }).length;
    prodData.push(['Produk Stok Menipis/Habis', lowStockCount]);
    prodData.push(['']);
    prodData.push(['Diekspor pada', new Date().toLocaleString('id-ID')]);

    var ws1 = XLSX.utils.aoa_to_sheet(prodData);
    ws1['!cols'] = [{ wch: 25 }, { wch: 18 }, { wch: 15 }, { wch: 15 }, { wch: 8 }, { wch: 14 }, { wch: 10 }];

    for (var i = 3; i < prodData.length; i++) {
        var cellRef2 = XLSX.utils.encode_cell({ r: i, c: 2 });
        var cellRef3 = XLSX.utils.encode_cell({ r: i, c: 3 });
        if (ws1[cellRef2] && typeof ws1[cellRef2].v === 'number') ws1[cellRef2].z = '#,##0';
        if (ws1[cellRef3] && typeof ws1[cellRef3].v === 'number') ws1[cellRef3].z = '#,##0';
    }

    XLSX.utils.book_append_sheet(wb, ws1, 'Daftar Produk');

    var lowStock = products.filter(function(p) { return p.qty <= p.minQty; });
    if (lowStock.length > 0) {
        var lowData = [
            ['Peringatan Stok Menipis / Habis'],
            [''],
            ['Nama Produk', 'Kategori', 'Stok Saat Ini', 'Batas Minimum', 'Selisih', 'Status']
        ];
        lowStock.forEach(function(p) {
            var status = p.qty <= 0 ? 'Habis' : 'Menipis';
            lowData.push([p.name, p.category, p.qty, p.minQty, p.qty - p.minQty, status]);
        });

        var ws2 = XLSX.utils.aoa_to_sheet(lowData);
        ws2['!cols'] = [{ wch: 25 }, { wch: 18 }, { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 10 }];
        XLSX.utils.book_append_sheet(wb, ws2, 'Stok Menipis');
    }

    XLSX.writeFile(wb, 'Stok_UMKM_' + new Date().toISOString().split('T')[0] + '.xlsx');
    showToast('Data stok berhasil diexport ke Excel!', 'success');
}