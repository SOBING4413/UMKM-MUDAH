// ===== CALCULATOR MODULE =====
function initCalculator() {
    var btnCalcProfit = document.getElementById('btnCalcProfit');
    var btnCalcBEP = document.getElementById('btnCalcBEP');

    if (btnCalcProfit) {
        btnCalcProfit.addEventListener('click', calculateProfit);
    }
    if (btnCalcBEP) {
        btnCalcBEP.addEventListener('click', calculateBEP);
    }
}

function calculateProfit() {
    var modal = parseFloat(document.getElementById('calcModal').value) || 0;
    var operasional = parseFloat(document.getElementById('calcOperasional').value) || 0;
    var hargaJual = parseFloat(document.getElementById('calcHargaJual').value) || 0;
    var jumlah = parseFloat(document.getElementById('calcJumlah').value) || 0;

    if (hargaJual <= 0 || jumlah <= 0) {
        showToast('Mohon isi harga jual dan jumlah terjual!', 'error');
        return;
    }

    var totalModal = modal * jumlah;
    var totalOps = operasional * jumlah;
    var totalRevenue = hargaJual * jumlah;
    var totalCost = totalModal + totalOps;
    var profit = totalRevenue - totalCost;
    var margin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;
    var profitPerUnit = hargaJual - modal - operasional;

    document.getElementById('resModalTotal').textContent = formatRupiah(totalModal);
    document.getElementById('resOpsTotal').textContent = formatRupiah(totalOps);
    document.getElementById('resRevenue').textContent = formatRupiah(totalRevenue);
    document.getElementById('resProfit').textContent = formatRupiah(profit);
    document.getElementById('resMargin').textContent = margin.toFixed(1) + '%';

    var explain = '';
    if (profit > 0) {
        explain = '🎉 Selamat! Kamu UNTUNG ' + formatRupiah(profit) + ' dari ' + jumlah + ' barang yang terjual. ' +
            'Setiap 1 barang yang terjual, kamu untung ' + formatRupiah(profitPerUnit) + '. ' +
            'Margin ' + margin.toFixed(1) + '% artinya dari setiap ' + formatRupiah(hargaJual) + ' yang masuk, ' +
            formatRupiah(profitPerUnit) + ' adalah keuntungan bersih kamu.';
    } else if (profit === 0) {
        explain = '⚖️ Kamu IMPAS (tidak untung, tidak rugi). Coba naikkan harga jual atau kurangi biaya supaya bisa untung.';
    } else {
        explain = '⚠️ Kamu RUGI ' + formatRupiah(Math.abs(profit)) + '! Harga jual kamu terlalu rendah. ' +
            'Coba naikkan harga jual atau cari supplier yang lebih murah.';
    }
    document.getElementById('profitExplain').textContent = explain;

    document.getElementById('profitResult').style.display = 'block';
    showToast('Perhitungan berhasil!', 'success');
}

function calculateBEP() {
    var fixedCost = parseFloat(document.getElementById('bepFixedCost').value) || 0;
    var price = parseFloat(document.getElementById('bepPrice').value) || 0;
    var varCost = parseFloat(document.getElementById('bepVarCost').value) || 0;

    if (fixedCost <= 0 || price <= 0) {
        showToast('Mohon isi biaya tetap dan harga jual!', 'error');
        return;
    }

    var contributionMargin = price - varCost;

    if (contributionMargin <= 0) {
        showToast('Harga jual harus lebih besar dari modal + biaya per barang!', 'error');
        return;
    }

    var bepUnit = Math.ceil(fixedCost / contributionMargin);
    var bepRupiah = bepUnit * price;

    document.getElementById('resBepMargin').textContent = formatRupiah(contributionMargin);
    document.getElementById('resBepUnit').textContent = bepUnit.toLocaleString('id-ID') + ' barang';
    document.getElementById('resBepRupiah').textContent = formatRupiah(bepRupiah);

    var explain = '📌 Artinya: Kamu harus menjual minimal ' + bepUnit.toLocaleString('id-ID') + ' barang per bulan ' +
        '(senilai ' + formatRupiah(bepRupiah) + ') supaya semua biaya tetap sebesar ' + formatRupiah(fixedCost) + ' tertutup. ' +
        'Setelah terjual lebih dari ' + bepUnit + ' barang, baru kamu mulai UNTUNG! ' +
        'Setiap 1 barang yang terjual memberikan kontribusi ' + formatRupiah(contributionMargin) + ' untuk menutup biaya tetap.';

    document.getElementById('resBepNote').textContent = explain;

    document.getElementById('bepResult').style.display = 'block';
    showToast('Perhitungan BEP berhasil!', 'success');
}