// ===== CHART DASHBOARD =====
// Grafik pemasukan & pengeluaran bulanan di Dashboard

(function() {
    'use strict';

    var chartInstance = null;

    function getMonthlyData(transactions) {
        var monthMap = {};
        var now = new Date();

        // Init last 6 months
        for (var i = 5; i >= 0; i--) {
            var d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            var key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
            monthMap[key] = { income: 0, expense: 0 };
        }

        // Fill data
        if (Array.isArray(transactions)) {
            transactions.forEach(function(t) {
                if (!t.date) return;
                var parts = t.date.split('-');
                var key = parts[0] + '-' + parts[1];
                if (monthMap[key]) {
                    if (t.type === 'income') {
                        monthMap[key].income += t.amount || 0;
                    } else {
                        monthMap[key].expense += t.amount || 0;
                    }
                }
            });
        }

        var labels = [];
        var incomeData = [];
        var expenseData = [];
        var profitData = [];

        var monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

        Object.keys(monthMap).sort().forEach(function(key) {
            var parts = key.split('-');
            var monthIdx = parseInt(parts[1], 10) - 1;
            labels.push(monthNames[monthIdx] + ' ' + parts[0].slice(2));
            incomeData.push(monthMap[key].income);
            expenseData.push(monthMap[key].expense);
            profitData.push(monthMap[key].income - monthMap[key].expense);
        });

        return { labels: labels, income: incomeData, expense: expenseData, profit: profitData };
    }

    function renderChart() {
        var canvas = document.getElementById('dashboardChart');
        if (!canvas) return;
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js not loaded');
            return;
        }

        var transactions = [];
        try {
            var txData = localStorage.getItem('umkm_transactions');
            transactions = txData ? JSON.parse(txData) : [];
        } catch (e) { transactions = []; }

        var data = getMonthlyData(transactions);

        // Check dark mode
        var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        var gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
        var textColor = isDark ? '#A3C4A3' : '#4B6B4B';

        if (chartInstance) {
            chartInstance.destroy();
        }

        var ctx = canvas.getContext('2d');
        chartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [
                    {
                        label: '💵 Pemasukan',
                        data: data.income,
                        backgroundColor: isDark ? 'rgba(34, 197, 94, 0.6)' : 'rgba(22, 163, 74, 0.7)',
                        borderColor: isDark ? '#22C55E' : '#16A34A',
                        borderWidth: 2,
                        borderRadius: 6,
                        borderSkipped: false
                    },
                    {
                        label: '💸 Pengeluaran',
                        data: data.expense,
                        backgroundColor: isDark ? 'rgba(248, 113, 113, 0.6)' : 'rgba(239, 68, 68, 0.7)',
                        borderColor: isDark ? '#F87171' : '#EF4444',
                        borderWidth: 2,
                        borderRadius: 6,
                        borderSkipped: false
                    },
                    {
                        label: '📈 Keuntungan',
                        data: data.profit,
                        type: 'line',
                        borderColor: isDark ? '#38BDF8' : '#0EA5E9',
                        backgroundColor: 'transparent',
                        borderWidth: 3,
                        pointBackgroundColor: isDark ? '#38BDF8' : '#0EA5E9',
                        pointBorderColor: '#FFFFFF',
                        pointBorderWidth: 2,
                        pointRadius: 5,
                        tension: 0.3
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: textColor,
                            font: { size: 13, weight: '600', family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" },
                            padding: 16,
                            usePointStyle: true,
                            pointStyle: 'roundRect'
                        }
                    },
                    tooltip: {
                        backgroundColor: isDark ? '#142814' : '#14532D',
                        titleColor: '#FFFFFF',
                        bodyColor: '#FFFFFF',
                        padding: 14,
                        cornerRadius: 10,
                        titleFont: { size: 14, weight: '700' },
                        bodyFont: { size: 13 },
                        callbacks: {
                            label: function(context) {
                                var value = context.parsed.y || 0;
                                var formatted = 'Rp ' + Math.abs(value).toLocaleString('id-ID');
                                if (value < 0) formatted = '-' + formatted;
                                return ' ' + context.dataset.label + ': ' + formatted;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: textColor, font: { size: 12, weight: '500' } }
                    },
                    y: {
                        grid: { color: gridColor },
                        ticks: {
                            color: textColor,
                            font: { size: 12 },
                            callback: function(value) {
                                if (value >= 1000000) return 'Rp ' + (value / 1000000).toFixed(1) + 'jt';
                                if (value >= 1000) return 'Rp ' + (value / 1000).toFixed(0) + 'rb';
                                return 'Rp ' + value;
                            }
                        },
                        beginAtZero: true
                    }
                }
            }
        });
    }

    // Expose globally so dashboard refresh can call it
    window.refreshDashboardChart = renderChart;

    // Re-render on theme change
    var observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(m) {
            if (m.attributeName === 'data-theme') {
                setTimeout(renderChart, 100);
            }
        });
    });
    observer.observe(document.documentElement, { attributes: true });

    // Init on DOM ready
    document.addEventListener('DOMContentLoaded', function() {
        // Delay to let data load
        setTimeout(renderChart, 800);
    });
})();