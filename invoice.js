// ===== INVOICE MODULE =====
function initInvoice() {
    var btnAddItem = document.getElementById('btnAddInvItem');
    var btnGenerate = document.getElementById('btnGenerateInvoice');
    var btnPrint = document.getElementById('btnPrintInvoice');

    if (btnAddItem) {
        btnAddItem.addEventListener('click', addInvoiceItemRow);
    }

    if (btnGenerate) {
        btnGenerate.addEventListener('click', generateInvoice);
    }

    if (btnPrint) {
        btnPrint.addEventListener('click', printInvoice);
    }
}

function addInvoiceItemRow() {
    var container = document.getElementById('invoiceItems');
    var row = document.createElement('div');
    row.className = 'invoice-item-row';
    row.innerHTML =
        '<input type="text" placeholder="Nama Barang" class="inv-item-name">' +
        '<input type="number" placeholder="Qty" class="inv-item-qty" min="1">' +
        '<input type="number" placeholder="Harga (Rp)" class="inv-item-price" min="0">';
    container.appendChild(row);
}

function generateInvoice() {
    var shopName = document.getElementById('invShopName').value || 'Nama Toko';
    var shopAddress = document.getElementById('invShopAddress').value || '';
    var shopPhone = document.getElementById('invShopPhone').value || '';
    var custName = document.getElementById('invCustName').value || 'Pelanggan';
    var invDate = document.getElementById('invDate').value || new Date().toISOString().split('T')[0];

    var rows = document.querySelectorAll('.invoice-item-row');
    var items = [];
    var grandTotal = 0;

    rows.forEach(function(row) {
        var name = row.querySelector('.inv-item-name').value;
        var qty = parseInt(row.querySelector('.inv-item-qty').value) || 0;
        var price = parseFloat(row.querySelector('.inv-item-price').value) || 0;

        if (name && qty > 0 && price > 0) {
            var subtotal = qty * price;
            grandTotal += subtotal;
            items.push({
                name: name,
                qty: qty,
                price: price,
                subtotal: subtotal
            });
        }
    });

    if (items.length === 0) {
        showToast('Tambahkan minimal 1 item dengan data lengkap!', 'error');
        return;
    }

    var invNumber = 'INV-' + Date.now().toString().slice(-8);

    var html = '<div class="inv-print">' +
        '<div class="inv-header">' +
        '<h2>' + escapeHtml(shopName) + '</h2>' +
        (shopAddress ? '<p>' + escapeHtml(shopAddress) + '</p>' : '') +
        (shopPhone ? '<p>Telp: ' + escapeHtml(shopPhone) + '</p>' : '') +
        '</div>' +
        '<div class="inv-meta">' +
        '<div><strong>No:</strong> ' + invNumber + '<br><strong>Tanggal:</strong> ' + invDate + '</div>' +
        '<div><strong>Pelanggan:</strong><br>' + escapeHtml(custName) + '</div>' +
        '</div>' +
        '<table class="inv-table">' +
        '<thead><tr><th>No</th><th>Nama Barang</th><th>Qty</th><th>Harga</th><th>Subtotal</th></tr></thead>' +
        '<tbody>';

    items.forEach(function(item, i) {
        html += '<tr>' +
            '<td>' + (i + 1) + '</td>' +
            '<td>' + escapeHtml(item.name) + '</td>' +
            '<td>' + item.qty + '</td>' +
            '<td>' + formatRupiah(item.price) + '</td>' +
            '<td>' + formatRupiah(item.subtotal) + '</td>' +
            '</tr>';
    });

    html += '</tbody></table>' +
        '<div class="inv-total">TOTAL: ' + formatRupiah(grandTotal) + '</div>' +
        '<div class="inv-footer">Terima kasih atas pembelian Anda!<br>Barang yang sudah dibeli tidak dapat dikembalikan.</div>' +
        '</div>';

    document.getElementById('invoicePreview').innerHTML = html;
    document.getElementById('btnPrintInvoice').style.display = 'inline-flex';
    showToast('Invoice berhasil dibuat!', 'success');
}

function printInvoice() {
    var preview = document.getElementById('invoicePreview').innerHTML;
    var printArea = document.getElementById('printArea');
    printArea.innerHTML = preview;
    window.print();
}