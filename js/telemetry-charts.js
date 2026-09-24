const chartState = {
    labels: [],
    rpm: [],
    throttle: [],
    brake: [],
    gear: [],
    steering: [],
    speed: [],
    gg: []
};

let telemetryCharts = [];
let telemetryTimer = null;

function clearChartHistory() {
    Object.values(chartState).forEach(values => values.length = 0);
    telemetryCharts.forEach(chart => chart.update("none"));
}

function createChartCard(title, canvasId, className = "") {
    const card = document.createElement("div");
    card.className = `telemetry-chart-card ${className}`.trim();
    card.innerHTML = `<h3>${title}</h3><div class="chart-container"><canvas id="${canvasId}"></canvas></div>`;
    return card;
}

function setupCharts() {
    if (document.getElementById("rpmChart")) return [];

    const section = document.createElement("section");
    section.className = "telemetry-section";
    section.dataset.category = "dashboard";
    section.innerHTML = `
        <div class="telemetry-section-heading">
            <div>
                <h2>Live Telemetry Analysis</h2>
                <p class="calculator-description">Driver inputs, engine state, vehicle motion and combined telemetry during the active session.</p>
            </div>
            <button id="clearTelemetryCharts" type="button">Clear Graphs</button>
        </div>`;

    const grid = document.createElement("div");
    grid.className = "telemetry-chart-grid";
    grid.append(
        createChartCard("RPM", "rpmChart"),
        createChartCard("Gear Trace", "gearChart"),
        createChartCard("Steering (°)", "steeringChart"),
        createChartCard("Combined Telemetry", "combinedTelemetryChart", "telemetry-chart-wide"),
        createChartCard("G-G Diagram", "ggChart", "telemetry-chart-wide")
    );
    section.appendChild(grid);

    const speedSection = document.getElementById("speedChart")?.closest(".telemetry-section");
    speedSection?.after(section);

    const common = {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        interaction: { mode: "index", intersect: false },
        plugins: { legend: { display: true } }
    };

    const line = (id, label, data, yTitle, extra = {}) => new Chart(document.getElementById(id), {
        type: "line",
        data: {
            labels: chartState.labels,
            datasets: [{ label, data, borderWidth: 2, tension: 0.2, pointRadius: 0, fill: false }]
        },
        options: {
            ...common,
            scales: {
                x: { title: { display: true, text: "Session Time (s)" } },
                y: { beginAtZero: false, title: { display: true, text: yTitle }, ...extra }
            }
        }
    });

    const rpm = line("rpmChart", "RPM", chartState.rpm, "RPM", { beginAtZero: true });
    const gear = line("gearChart", "Gear", chartState.gear, "Gear", { min: 1, max: 6, ticks: { stepSize: 1 } });
    const steering = line("steeringChart", "Steering", chartState.steering, "Angle (°)", { suggestedMin: -15, suggestedMax: 15 });

    const combined = new Chart(document.getElementById("combinedTelemetryChart"), {
        type: "line",
        data: {
            labels: chartState.labels,
            datasets: [
                { label: "Speed (km/h)", data: chartState.speed, borderWidth: 2, tension: 0.2, pointRadius: 0, yAxisID: "speed" },
                { label: "Throttle (%)", data: chartState.throttle, borderWidth: 2, tension: 0.2, pointRadius: 0, yAxisID: "inputs" },
                { label: "Brake (%)", data: chartState.brake, borderWidth: 2, tension: 0.2, pointRadius: 0, yAxisID: "inputs" }
            ]
        },
        options: {
            ...common,
            scales: {
                x: { title: { display: true, text: "Session Time (s)" } },
                speed: { type: "linear", position: "left", title: { display: true, text: "Speed (km/h)" }, beginAtZero: true },
                inputs: { type: "linear", position: "right", min: 0, max: 100, title: { display: true, text: "Driver Input (%)" }, grid: { drawOnChartArea: false } }
            }
        }
    });

    const gg = new Chart(document.getElementById("ggChart"), {
        type: "scatter",
        data: {
            datasets: [{
                label: "G-G Envelope",
                data: chartState.gg,
                borderWidth: 2,
                pointRadius: 3,
                showLine: false
            }]
        },
        options: {
            ...common,
            scales: {
                x: { title: { display: true, text: "Lateral G" }, min: -1.6, max: 1.6 },
                y: { title: { display: true, text: "Longitudinal G" }, min: -1.4, max: 1.2 }
            }
        }
    });

    telemetryCharts = [rpm, gear, steering, combined, gg];
    document.getElementById("clearTelemetryCharts")?.addEventListener("click", clearChartHistory);
    return telemetryCharts;
}

function startTelemetryCharts() {
    if (typeof Chart === "undefined" || telemetryTimer) return;

    setupCharts();
    if (!telemetryCharts.length) return;

    telemetryTimer = setInterval(() => {
        const status = document.getElementById("sessionStatus")?.textContent?.trim() || "";
        if (!status.includes("ACTIVE")) return;

        const telemetry = window.raceTelemetry;
        if (!telemetry) return;

        const time = Number(document.getElementById("sessionTimer")?.dataset?.seconds);
        const fallbackTime = chartState.labels.length ? Number(chartState.labels.at(-1)) + 0.5 : 0;
        const t = Number.isFinite(time) ? time : fallbackTime;

        chartState.labels.push(t.toFixed(1));
        chartState.rpm.push(telemetry.rpm);
        chartState.gear.push(telemetry.gear);
        chartState.steering.push(telemetry.steeringDeg);
        chartState.speed.push(telemetry.speedKmh);
        chartState.throttle.push(telemetry.throttlePercent);
        chartState.brake.push(telemetry.brakePercent);
        chartState.gg.push({ x: telemetry.lateralG, y: telemetry.longitudinalG });

        if (chartState.labels.length > 120) {
            chartState.labels.shift();
            chartState.rpm.shift();
            chartState.gear.shift();
            chartState.steering.shift();
            chartState.speed.shift();
            chartState.throttle.shift();
            chartState.brake.shift();
            chartState.gg.shift();
        }

        telemetryCharts.forEach(chart => chart.update("none"));
    }, 500);
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startTelemetryCharts, { once: true });
} else {
    startTelemetryCharts();
}
