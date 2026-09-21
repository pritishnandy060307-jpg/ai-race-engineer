const chartState = {
    labels: [],
    rpm: [],
    throttle: [],
    brake: []
};

let telemetryCharts = null;
let telemetryTimer = null;
let sample = 0;
let wasActive = false;

function readNumber(id, fallback = 0) {
    const element = document.getElementById(id);
    if (!element) return fallback;
    const value = Number.parseFloat(element.textContent.replace(/[^0-9.-]/g, ''));
    return Number.isFinite(value) ? value : fallback;
}

function clearChartHistory() {
    chartState.labels.length = 0;
    chartState.rpm.length = 0;
    chartState.throttle.length = 0;
    chartState.brake.length = 0;
    sample = 0;
    telemetryCharts?.forEach(chart => chart.update('none'));
}

function createChartCard(title, canvasId) {
    const card = document.createElement('div');
    card.className = 'telemetry-chart-card';
    card.innerHTML = `<h3>${title}</h3><div class="chart-container"><canvas id="${canvasId}"></canvas></div>`;
    return card;
}

function setupCharts() {
    if (document.getElementById('rpmChart')) return null;

    const section = document.createElement('section');
    section.className = 'telemetry-section';
    section.innerHTML = `
        <div class="telemetry-section-heading">
            <div>
                <h2>Live Telemetry Channels</h2>
                <p class="calculator-description">Real-time driver inputs and engine speed during an active session.</p>
            </div>
            <button id="clearTelemetryCharts" type="button">Clear Graphs</button>
        </div>`;

    const grid = document.createElement('div');
    grid.className = 'telemetry-chart-grid';
    grid.append(
        createChartCard('RPM', 'rpmChart'),
        createChartCard('Throttle (%)', 'throttleChart'),
        createChartCard('Brake (%)', 'brakeChart')
    );
    section.appendChild(grid);

    const speedSection = document.getElementById('speedChart')?.closest('.telemetry-section');
    speedSection?.after(section);

    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        scales: { y: { beginAtZero: true } },
        plugins: { legend: { display: true } }
    };

    const createLineChart = (id, label, data, max) => new Chart(document.getElementById(id), {
        type: 'line',
        data: {
            labels: chartState.labels,
            datasets: [{ label, data, borderWidth: 2, tension: 0.25, pointRadius: 0, fill: false }]
        },
        options: {
            ...commonOptions,
            scales: { y: { beginAtZero: true, ...(max ? { max } : {}) } }
        }
    });

    const charts = [
        createLineChart('rpmChart', 'RPM', chartState.rpm),
        createLineChart('throttleChart', 'Throttle (%)', chartState.throttle, 100),
        createLineChart('brakeChart', 'Brake (%)', chartState.brake, 100)
    ];

    document.getElementById('clearTelemetryCharts')?.addEventListener('click', clearChartHistory);
    return charts;
}

function startTelemetryCharts() {
    if (typeof Chart === 'undefined' || telemetryTimer) return;
    telemetryCharts = setupCharts();
    if (!telemetryCharts) return;

    telemetryTimer = setInterval(() => {
        const status = document.getElementById('sessionStatus')?.textContent?.trim() || '';
        const active = status.includes('ACTIVE');

        if (!active) {
            // Keep the completed session visible instead of clearing the graphs.
            wasActive = false;
            return;
        }

        wasActive = true;
        chartState.labels.push(sample++);
        chartState.rpm.push(readNumber('rpm'));
        chartState.throttle.push(readNumber('throttle'));
        chartState.brake.push(readNumber('brake'));

        if (chartState.labels.length > 60) {
            chartState.labels.shift();
            chartState.rpm.shift();
            chartState.throttle.shift();
            chartState.brake.shift();
        }

        telemetryCharts.forEach(chart => chart.update('none'));
    }, 500);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startTelemetryCharts, { once: true });
} else {
    startTelemetryCharts();
}
