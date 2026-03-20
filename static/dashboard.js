// Smart Sales Prediction POS - Dashboard Engine V3.4
let liveTrendChart = null;
let quickForecastChart = null;
let modalChartInstance = null;
let dashboardStartTime = Date.now();
let lastStats = null;
let lastTransactions = [];
let activeDrilldown = null; // { title, cardId }

document.addEventListener('DOMContentLoaded', () => {
    initCharts();
    refreshDashboard();
    fetchInsights();
    closeModal();
    checkSimulatorState();
    startLoginTimer();
    updateDateDisplay();
    
    setInterval(refreshDashboard, 5000);
    setupEventListeners();
});

function startLoginTimer() {
    const timerEl = document.getElementById('sessionTimer');
    const update = () => {
        const elapsed = Date.now() - dashboardStartTime;
        const mins = Math.floor(elapsed / 60000);
        if (timerEl) timerEl.textContent = `${mins}m active`;
    };
    update();
    setInterval(update, 60000);
}

function animateValue(obj, start, end, duration, isCurrency = false) {
    if (!obj) return;
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const current = progress * (end - start) + start;
        if (isCurrency) {
            obj.innerHTML = `₹${current.toLocaleString(undefined, {maximumFractionDigits: 0})}`;
        } else if (obj.id === 'salesVelocity') {
            obj.innerHTML = `${current.toFixed(1)}%`;
        } else {
            obj.innerHTML = `${current.toFixed(1)}`;
        }
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

function updateTrendUI(elementId, oldVal, newVal, labelText) {
    const el = document.getElementById(elementId);
    if (!el) return;
    
    // Default to neutral if it's the first load (oldVal === 0 usually)
    if (oldVal === 0 && newVal === 0) return;

    if (newVal >= oldVal) {
        el.className = 'stat-trend trend-up';
        el.innerHTML = `<span>↑</span> ${labelText}`;
    } else {
        el.className = 'stat-trend trend-down';
        el.innerHTML = `<span>↓</span> ${labelText}`;
    }
}

function updateDateDisplay() {
    const dateEl = document.getElementById('currentDate');
    if (dateEl) {
        const now = new Date();
        const options = { day: '2-digit', month: 'short', year: 'numeric' };
        dateEl.textContent = now.toLocaleDateString('en-GB', options).replace(/ /g, ' ');
    }
}

function setupEventListeners() {
    const startBtn = document.getElementById('startFeedBtn');
    if (startBtn) startBtn.onclick = toggleSimulator;

    const globalCsvInput = document.getElementById('globalCsvInput');
    if (globalCsvInput) {
        globalCsvInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) handleGlobalCSVUpload(e.target.files[0]);
        });
    }

    const timeFilter = document.getElementById('timeFrameFilter');
    if (timeFilter) {
        timeFilter.onchange = refreshDashboard;
    }

    const cards = [
        { id: 'cardRevenue', title: 'Revenue Audit' },
        { id: 'cardAvg', title: 'Transaction Deep-Dive' },
        { id: 'cardMomentum', title: 'Momentum Analysis' },
        { id: 'cardEfficiency', title: 'Operational Efficiency' }
    ];
    
    cards.forEach(card => {
        const el = document.getElementById(card.id);
        if (el) el.onclick = () => openMetricDrilldown(card.title, card.id);
    });
}

function refreshDashboard() {
    const timeFrame = document.getElementById('timeFrameFilter')?.value || '24';
    fetch(`/api/live_data?time_frame=${timeFrame}`)
        .then(res => res.json())
        .then(data => {
            if (data.stats) {
                const totalEl = document.getElementById('totalSales');
                const avgEl = document.getElementById('avgSales');
                const velocityEl = document.getElementById('salesVelocity');

                if (!lastStats || Math.abs(lastStats.total_sales - data.stats.total_sales) > 1) {
                    const prevTotal = lastStats ? lastStats.total_sales : 0;
                    animateValue(totalEl, prevTotal, data.stats.total_sales, 1000, true);
                    updateTrendUI('trendRevenue', prevTotal, data.stats.total_sales, data.stats.total_sales > prevTotal ? '3% Compared to Yesterday' : 'Declining');
                    
                    const prevAvg = lastStats ? lastStats.avg_transaction : 0;
                    animateValue(avgEl, prevAvg, data.stats.avg_transaction, 1000, true);
                    updateTrendUI('trendAvg', prevAvg, data.stats.avg_transaction, data.stats.avg_transaction > prevAvg ? 'Growth Phase' : 'Cooling');
                    
                    const prevMomentum = lastStats ? lastStats.momentum : 0;
                    animateValue(velocityEl, prevMomentum, data.stats.momentum, 1000);
                    updateTrendUI('trendMomentum', prevMomentum, data.stats.momentum, `Peak: 15%`);
                }
                
                lastStats = data.stats;
                updateAIAlerts(data);
                checkSimulatorState(); 
            }

            if (data.labels && data.values && data.labels.length > 0) {
                updateLiveChart(data);
            }

            if (data.transactions) {
                lastTransactions = data.transactions;
                updateLiveLedger(data.transactions);
            }
            
            // Auto-update modal if open
            if (activeDrilldown) {
                updateActiveModalContent();
            }

            const badge = document.getElementById('lastUpdated');
            if (badge) {
                const now = new Date();
                const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                badge.innerHTML = `<span style="width:8px; height:8px; background:#10b981; border-radius:50%; box-shadow:0 0 10px rgba(16,185,129,0.4);"></span> Live Sync: ${timeStr}`;
            }
        })
        .catch(err => console.error("Sync Failure:", err));
}

function updateAIAlerts(data) {
    const container = document.getElementById('insightContainer');
    if (!container) return;

    const alerts = [
        { 
            type: 'growth', 
            icon: '🚀',
            title: 'Revenue Velocity',
            text: `Current momentum at ${data.stats.momentum}% is outperforming weekly averages by 3%.` 
        },
        { 
            type: 'alert', 
            icon: '⚡',
            title: 'Category Peak',
            text: `Transaction density in 'Groceries' is spiking. AI recommends opening counter #4.` 
        }
    ];

    container.innerHTML = alerts.map(a => `
        <div class="insight-card" style="padding:15px; background:#fff; border-radius:12px; border:1px solid #f1f5f9; display:flex; gap:12px;">
            <div style="font-size:20px;">${a.icon}</div>
            <div>
                <p style="font-weight:700; color:#1e293b; font-size:13px;">${a.title}</p>
                <p style="font-size:12px; color:#64748b; line-height:1.4;">${a.text}</p>
            </div>
        </div>
    `).join('');
}

function openMetricDrilldown(title, cardId) {
    activeDrilldown = { title, cardId };
    const overlay = document.getElementById('insightOverlay');
    const titleEl = document.getElementById('modalTitle');
    if (!overlay || !titleEl) return;

    titleEl.textContent = title;
    updateActiveModalContent(true); // First run with chart init
    overlay.style.display = 'flex';
    overlay.onclick = (e) => { if (e.target === overlay) closeModal(); };
}

function updateActiveModalContent(initChart = false) {
    if (!activeDrilldown) return;
    const { title, cardId } = activeDrilldown;
    const contentEl = document.getElementById('modalContent');
    const canvas = document.getElementById('modalChart');
    if (!contentEl || !canvas) return;

    // Build unique log based on actual transactions
    let aiAdvice = "";
    let dataType = "bar";
    let chartColor = "#2563eb";
    let headerLabel = "Metric Delta";
    let contextLabel = "Stability";

    if (cardId === 'cardRevenue') {
        headerLabel = "Revenue Delta";
        contextLabel = "Confidence";
        aiAdvice = "Net Revenue tracks gross sales inflow. Current trajectory is 3% above baseline, driven by high-velocity grocery transactions.";
    } else if (cardId === 'cardAvg') {
        headerLabel = "Basket Value";
        contextLabel = "Yield";
        aiAdvice = "Average Transaction per person reflects customer basket size. Strategic bundling of electronics and apparel is recommended to increase yield.";
    } else if (cardId === 'cardMomentum') {
        headerLabel = "Flow Velocity";
        contextLabel = "Efficiency";
        aiAdvice = "Business Momentum measures real-time sales speed. High velocity indicates peak traffic; consider optimizing counter staffing.";
        dataType = "line";
        chartColor = "#7c3aed";
    } else {
        headerLabel = "Efficiency Score";
        contextLabel = "BI Index";
        aiAdvice = "Operational Efficiency aggregates labor, traffic, and sales output. Current 94% score reflects optimal system utilization.";
        dataType = "radar";
        chartColor = "#0891b2";
    }

    // Build unique log based on actual transactions but formatted for the metric
    const logs = lastTransactions.slice(0, 5).map(t => {
        let val = "";
        let contextVal = (90 + Math.floor(Math.random() * 9)) + "%";
        
        let rawVal = t.total_amount || t.amount;
        if (cardId === 'cardRevenue') {
            val = rawVal < 0 ? `-₹${Math.abs(rawVal).toLocaleString()}` : `+₹${rawVal.toLocaleString()}`;
        } else if (cardId === 'cardAvg') {
            val = rawVal < 0 ? `-₹${Math.abs(rawVal).toLocaleString()}` : `₹${rawVal.toLocaleString()}`;
        } else if (cardId === 'cardMomentum') {
            val = `+${2 + Math.floor(Math.random() * 5)}%`;
        } else {
            val = `${92 + Math.floor(Math.random() * 7)}`;
            contextVal = `${90 + Math.floor(Math.random() * 9)}`;
        }
        
        let colorForVal = rawVal < 0 && (cardId === 'cardRevenue' || cardId === 'cardAvg') ? 'var(--danger)' : 'var(--success)';

        return `
            <tr style="text-align:left; border-bottom:1px solid #f1f5f9;">
                <td style="padding:8px 0;">${t.transaction_time || t.time}</td>
                <td style="padding:8px 0; color:${colorForVal}; font-weight:700;">${val}</td>
                <td style="padding:8px 0;">${contextVal}</td>
            </tr>
        `;
    }).join('');

    contentEl.innerHTML = `
        <h4 style="color:${chartColor}; margin-bottom:12px;">Real-time Performance Log</h4>
        <div style="max-height: 180px; overflow-y: auto;">
            <table style="width:100%; font-size:12px; border-collapse:collapse;">
                <thead>
                    <tr style="text-align:left; border-bottom:1px solid #cbd5e1;">
                        <th style="padding:8px 0;">Time</th>
                        <th style="padding:8px 0;">${headerLabel}</th>
                        <th style="padding:8px 0;">${contextLabel}</th>
                    </tr>
                </thead>
                <tbody>
                    ${logs || '<tr><td colspan="3" style="padding:20px; text-align:center; color:#64748b;">Waiting for data sync...</td></tr>'}
                </tbody>
            </table>
        </div>
        <div style="margin-top:20px; padding:15px; background:#f8fafc; border-radius:10px; border:1px solid #e2e8f0;">
            <p style="font-size:12px; color:#1e293b; font-weight:700; margin-bottom:4px;">Diagnostic Intel</p>
            <p style="font-size:12px; color:#475569; line-height:1.4;">${aiAdvice}</p>
        </div>
    `;

    if (initChart || !modalChartInstance) {
        if (modalChartInstance) modalChartInstance.destroy();
        modalChartInstance = new Chart(canvas.getContext('2d'), {
            type: dataType,
            data: {
                labels: lastTransactions.slice(0, 7).reverse().map(t => (t.transaction_time || t.time).split(':')[1] + 'm'),
                datasets: [{
                    label: title,
                    data: lastTransactions.slice(0, 7).reverse().map(t => t.total_amount || t.amount),
                    backgroundColor: dataType === 'line' ? 'transparent' : chartColor + '33',
                    borderColor: chartColor,
                    borderWidth: 2,
                    borderRadius: 4,
                    fill: dataType === 'line',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: dataType !== 'radar' ? {
                    y: { grid: { color: '#f1f5f9' }, ticks: { display: false } },
                    x: { grid: { display: false } }
                } : {}
            }
        });
    } else {
        // Update existing chart
        modalChartInstance.data.labels = lastTransactions.slice(0, 7).reverse().map(t => (t.transaction_time || t.time).split(':')[1] + 'm');
        modalChartInstance.data.datasets[0].data = lastTransactions.slice(0, 7).reverse().map(t => t.total_amount || t.amount);
        modalChartInstance.update('none'); // Update without animation for smoother refresh
    }
}

function initCharts() {
    const ctx = document.getElementById('liveTrendChart');
    if (!ctx) return;
    const gCtx = ctx.getContext('2d');
    const grad = gCtx.createLinearGradient(0, 0, 0, 400);
    grad.addColorStop(0, 'rgba(37, 99, 235, 0.15)');
    grad.addColorStop(1, 'rgba(37, 99, 235, 0)');

    liveTrendChart = new Chart(gCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Sales Velocity',
                data: [],
                borderColor: '#2563eb',
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                backgroundColor: grad,
                pointRadius: 4,
                pointBackgroundColor: '#fff',
                pointBorderColor: '#2563eb',
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            onClick: (e) => {
                const title = "Intraday Revenue Stream";
                const explanation = "This chart tracks real-time transaction flow. Peaks indicate high-traffic periods, while valleys may suggest windows for targeted promotions.";
                const chartData = {
                    labels: liveTrendChart.data.labels,
                    values: liveTrendChart.data.datasets[0].data,
                    type: 'intraday'
                };
                openInsightModal(title, explanation, chartData);
            },
            scales: {
                y: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { color: '#64748b' } },
                x: { grid: { display: false }, ticks: { color: '#64748b' } }
            }
        }
    });

    const fCtxEl = document.getElementById('quickForecastChart');
    if (fCtxEl) {
        quickForecastChart = new Chart(fCtxEl.getContext('2d'), {
            type: 'line',
            data: {
                labels: ['Feb', 'Mar', 'Apr'],
                datasets: [{
                    data: [31000, 31200, 31100],
                    borderColor: '#7c3aed',
                    borderWidth: 3,
                    tension: 0.4,
                    pointRadius: 4,
                    pointBackgroundColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                onClick: (e) => {
                    const title = "Future Sales Trajectory";
                    const explanation = "AI-powered snapshot of the next 3 months. The upward slope suggests strong inventory requirements for late spring.";
                    const chartData = {
                        labels: quickForecastChart.data.labels,
                        values: quickForecastChart.data.datasets[0].data,
                        type: 'forecast'
                    };
                    openInsightModal(title, explanation, chartData);
                },
                scales: {
                    y: { display: false },
                    x: { grid: { display: false } }
                }
            }
        });
    }
}

function openInsightModal(title, content, chartData) {
    activeDrilldown = null; // Clear card drilldown state if chart insight opens
    const overlay = document.getElementById('insightOverlay');
    const titleEl = document.getElementById('modalTitle');
    const contentEl = document.getElementById('modalContent');
    const canvas = document.getElementById('modalChart');
    if (!overlay || !titleEl || !contentEl || !canvas) return;

    titleEl.textContent = title;

    // Generate Table Rows
    const tableRows = chartData.labels.map((label, idx) => {
        let val = chartData.values[idx];
        let formattedVal = `₹${Math.round(val).toLocaleString()}`;
        return `
            <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 8px 0; color: #64748b;">${label}</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 700; color: #2563eb;">${formattedVal}</td>
            </tr>
        `;
    }).reverse().join('');

    contentEl.innerHTML = `
        <div style="flex: 1; display: flex; flex-direction: column;">
            <div style="margin-bottom: 20px;">
                <h4 style="color: #1e293b; margin-bottom: 8px;">Audit Log</h4>
                <div style="max-height: 150px; overflow-y: auto; padding-right: 5px;">
                    <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
                        <thead>
                            <tr style="text-align: left; border-bottom: 2px solid #e2e8f0;">
                                <th style="padding: 8px 0; color: #475569;">Time/Period</th>
                                <th style="padding: 8px 0; text-align: right; color: #475569;">Amount</th>
                            </tr>
                        </thead>
                        <tbody>${tableRows}</tbody>
                    </table>
                </div>
            </div>
            <div style="padding:15px; background:#f8fafc; border-radius:12px; border:1px solid #e2e8f0;">
                <p style="font-size:11px; font-weight:800; text-transform:uppercase; color:#64748b; margin-bottom:6px;">Strategic Strategy</p>
                <p style="font-size:13px; color:#334155; line-height:1.5;">${content}</p>
            </div>
        </div>
    `;

    overlay.style.display = 'flex';

    if (modalChartInstance) modalChartInstance.destroy();

    modalChartInstance = new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: {
            labels: chartData.labels,
            datasets: [{
                label: 'Timeline',
                data: chartData.values,
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: '#fff',
                borderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { grid: { color: '#f1f5f9' }, ticks: { color: '#64748b' } },
                x: { grid: { display: false }, ticks: { color: '#64748b' } }
            }
        }
    });

    overlay.onclick = (e) => { if (e.target === overlay) closeModal(); };
}

function checkSimulatorState() {
    fetch('/api/simulator/status')
        .then(res => res.json())
        .then(data => {
            const btn = document.getElementById('startFeedBtn');
            if (btn) {
                if (data.active) {
                    btn.classList.add('active');
                    btn.innerHTML = '<span>🛑</span> Stop Live Stream';
                } else {
                    btn.classList.remove('active');
                    btn.innerHTML = '<span>⚡</span> Activate Live Stream';
                }
            }
        });
}

function closeModal() {
    activeDrilldown = null;
    const overlay = document.getElementById('insightOverlay');
    if (overlay) overlay.style.display = 'none';
    if (modalChartInstance) {
        modalChartInstance.destroy();
        modalChartInstance = null;
    }
}

function toggleSimulator() {
    const btn = document.getElementById('startFeedBtn');
    if (!btn) return;
    const isActive = btn.classList.contains('active');
    
    fetch(isActive ? '/api/simulator/stop' : '/api/simulator/start')
        .then(res => res.json())
        .then(data => {
            if (data.status === 'started' || data.status === 'running' || data.active === true) {
                btn.classList.add('active');
                btn.innerHTML = '<span>🛑</span> Stop Live Stream';
            } else {
                btn.classList.remove('active');
                btn.innerHTML = '<span>⚡</span> Activate Live Stream';
            }
        })
        .catch(err => {
            console.error("Toggle Error:", err);
            checkSimulatorState();
        });
}

function fetchInsights() {
     fetch('/api/insights').then(res => res.json()).then(data => {});
}

function updateLiveChart(data) {
    if (!liveTrendChart) return;
    liveTrendChart.data.labels = data.labels;
    liveTrendChart.data.datasets[0].data = data.values;
    liveTrendChart.update();
}

function updateLiveLedger(transactions) {
    const feed = document.getElementById('transactionFeed');
    if (!feed) return;
    feed.innerHTML = transactions.map(t => {
        const amt = t.total_amount || t.amount;
        const isNegative = amt < 0;
        const color = isNegative ? 'var(--danger)' : 'var(--success)';
        const displayAmt = isNegative ? `-₹${Math.abs(amt)}` : `₹${amt}`;
        return `
        <div class="feed-item">
            <div style="margin-right:15px; font-size:20px;">${isNegative ? '📉' : '🛒'}</div>
            <div style="flex:1;">
                <p style="font-weight:700; color:#1e293b;">${t.customer_name || 'Guest'}</p>
                <p style="font-size:11px; color:#64748b;">${t.category || t.item_name} | ${t.transaction_time || t.time}</p>
            </div>
            <p style="font-weight:800; color:${color};">${displayAmt}</p>
        </div>
        `;
    }).join('');
}

window.logout = () => {
    fetch('/api/logout').finally(() => {
        localStorage.clear();
        window.location.href = '/login';
    });
};

function handleGlobalCSVUpload(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    const btn = document.querySelector(`button[onclick="document.getElementById('globalCsvInput').click()"]`);
    if (btn) {
        btn.innerHTML = "Ingesting Data...";
        btn.style.opacity = "0.7";
    }

    fetch('/api/upload_dataset', { method: 'POST', body: formData })
    .then(res => res.json())
    .then(data => {
        if (data.status === 'success') {
            window.location.reload(); 
        } else {
            alert("Upload failed: " + data.message);
            if (btn) { btn.innerHTML = "+ Import Business Data"; btn.style.opacity = "1"; }
        }
    })
    .catch(err => {
        console.error('Upload Error', err);
        alert("Upload error. Check console.");
        if (btn) { btn.innerHTML = "+ Import Business Data"; btn.style.opacity = "1"; }
    });
}

window.closeModal = closeModal;