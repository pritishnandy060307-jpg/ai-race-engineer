const chartState = {
    labels: [],
    rpm: [],
    throttle: [],
    brake: []
};

function readNumber(id, fallback = 0) {
    const element = document.getElementById(id);
    if (!element) return fallback;
    const value = Number.parseFloat(element.textContent.replace(/[^0-9.-]/g, ''));
    return Number.isFinite(value) ? value : fallback;
}

function createChartCard(title, canvasId) {
    const card = document.createElement('div');
    card.className = 'telemetry-chart-card';
    card.innerHTML = `<h3>${title}</h3><div class="chart-container"><canvas id="${canvasId}"></canvas></div>`;
    return card;
}

function setupCharts() {
    const section = document.createElement('section');
    section.className = 'telemetry-section';
    section.innerHTML = '<h2>Live Telemetry Channels</h2>';

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
        plugins: { legend: { display: false } }
    };

    const createLineChart = (id, label, data, max) => new Chart(document.getElementById(id), {
        type: 'line',
        data: { labels: chartState.labels, datasets: [{ label, data, tension: 0.25, pointRadius: 0 }] },
        options: { ...commonOptions, scales: { y: { beginAtZero: true, ...(max ? { max } : {}) } } }
    });

    return {
        rpm: createLineChart('rpmChart', 'RPM', chartState.rpm),
        throttle: createLineChart('throttleChart', 'Throttle', chartState.throttle, 100),
        brake: createLineChart('brakeChart', 'Brake', chartState.brake, 100)
    };
}

function startTelemetryCharts() {
    if (typeof Chart === 'undefined') return;
    const charts = setupCharts();
    let sample = 0;

    setInterval(() => {
        const status = document.getElementById('sessionStatus')?.textContent?.trim();
        if (status !== 'ACTIVE') return;

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

        Object.values(charts).forEach(chart => chart.update('none'));
    }, 500);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startTelemetryCharts);
} else {
    startTelemetryCharts();
}
