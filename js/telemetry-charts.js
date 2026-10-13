const HISTORY_LIMIT = 240;
const GG_REFERENCE_G = 1.5;

// Chart state is a display cache populated only from the telemetry sample
// supplied by script.js; it never generates its own vehicle data.
const chartState = {
    labels: [],
    timestamps: [],
    speed: [],
    rpm: [],
    throttle: [],
    brake: [],
    gear: [],
    steering: [],
    engineTemp: [],
    coolantTemp: [],
    oilTemp: [],
    batteryVoltage: [],
    batteryCurrent: [],
    lateralG: [],
    longitudinalG: [],
    ggHistory: [],
    ggCurrent: []
};

let telemetryCharts = [];
let chartsReady = false;
let importedDatasetActive = false;

function clearChartHistory() {
    importedDatasetActive = false;
    Object.values(chartState).forEach(values => { values.length = 0; });
    telemetryCharts.forEach(chart => chart.update("none"));
}

function createChartCard(title, canvasId, className = "") {
    const card = document.createElement("div");
    card.className = `telemetry-chart-card ${className}`.trim();
    const heading = document.createElement("h3");
    heading.textContent = title;
    const container = document.createElement("div");
    container.className = "chart-container";
    const canvas = document.createElement("canvas");
    canvas.id = canvasId;
    canvas.setAttribute("role", "img");
    canvas.setAttribute("aria-label", title);
    container.appendChild(canvas);
    card.append(heading, container);
    return card;
}

function setupCharts() {
    if (chartsReady || typeof Chart === "undefined") return telemetryCharts;
    const speedCanvas = document.getElementById("speedChart");
    const speedSection = speedCanvas?.closest(".telemetry-section");
    if (!speedCanvas || !speedSection) return [];

    const section = document.createElement("section");
    section.className = "telemetry-section";
    section.dataset.category = "dashboard";
    section.id = "advancedTelemetrySection";

    const heading = document.createElement("div");
    heading.className = "telemetry-section-heading";
    const headingCopy = document.createElement("div");
    const title = document.createElement("h2");
    title.textContent = "Live Telemetry Analysis";
    const description = document.createElement("p");
    description.className = "calculator-description";
    description.textContent = "Timestamped driver inputs, powertrain and temperature trends, vehicle motion, and a live G-G trace.";
    headingCopy.append(title, description);
    const clearButton = document.createElement("button");
    clearButton.id = "clearTelemetryCharts";
    clearButton.type = "button";
    clearButton.textContent = "Clear Graphs";
    clearButton.setAttribute("aria-label", "Clear telemetry graph history");
    heading.append(headingCopy, clearButton);
    section.appendChild(heading);

    const grid = document.createElement("div");
    grid.className = "telemetry-chart-grid";
    grid.append(
        createChartCard("RPM", "rpmChart"),
        createChartCard("Gear Trace", "gearChart"),
        createChartCard("Steering Angle", "steeringChart"),
        createChartCard("Speed, Throttle & Brake", "combinedTelemetryChart", "telemetry-chart-wide"),
        createChartCard("Engine & Coolant Temperatures", "temperatureChart"),
        createChartCard("Battery Voltage & Current", "batteryChart"),
        createChartCard("Lateral & Longitudinal G", "gTraceChart"),
        createChartCard("G-G Diagram", "ggChart", "telemetry-chart-wide")
    );
    section.appendChild(grid);
    speedSection.after(section);

    const common = {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        normalized: true,
        interaction: { mode: "index", intersect: false },
        plugins: {
            legend: { display: true, labels: { color: "#cbd5e1", boxWidth: 12, usePointStyle: true } },
            tooltip: { enabled: true }
        },
        scales: {
            x: {
                title: { display: true, text: "Session Time (s)", color: "#9aa6b5" },
                ticks: { color: "#9aa6b5", maxTicksLimit: 8 },
                grid: { color: "rgba(142,154,170,0.12)" }
            }
        }
    };
    const axis = (titleText, extra = {}) => ({
        title: { display: true, text: titleText, color: "#9aa6b5" },
        ticks: { color: "#9aa6b5" },
        grid: { color: "rgba(142,154,170,0.12)" },
        ...extra
    });
    const lineDataset = (label, data, extra = {}) => ({
        label, data, borderWidth: 2, tension: 0.18, pointRadius: 0,
        pointHitRadius: 8, fill: false, ...extra
    });
    const lineChart = (id, datasets, yAxisTitle, yExtra = {}) => new Chart(
        document.getElementById(id),
        {
            type: "line",
            data: { labels: chartState.labels, datasets },
            options: {
                ...common,
                scales: { x: common.scales.x, y: axis(yAxisTitle, yExtra) }
            }
        }
    );

    const speed = new Chart(speedCanvas, {
        type: "line",
        data: { labels: chartState.labels, datasets: [lineDataset("Speed (km/h)", chartState.speed)] },
        options: { ...common, scales: { x: common.scales.x, y: axis("Speed (km/h)", { beginAtZero: true }) } }
    });
    const rpm = lineChart("rpmChart", [lineDataset("RPM", chartState.rpm)], "Engine speed (rpm)", { beginAtZero: true });
    // A stepped trace reflects discrete gear selection; it must not imply
    // intermediate gears during a shift.
    const gear = lineChart("gearChart", [lineDataset("Gear", chartState.gear, { stepped: "after", tension: 0 })],
        "Gear", { min: 1, max: 6, ticks: { stepSize: 1 } });
    const steering = lineChart("steeringChart", [lineDataset("Steering (°)", chartState.steering)],
        "Steering angle (°)", { suggestedMin: -15, suggestedMax: 15 });

    const combined = new Chart(document.getElementById("combinedTelemetryChart"), {
        type: "line",
        data: { labels: chartState.labels, datasets: [
            lineDataset("Speed (km/h)", chartState.speed, { yAxisID: "speed" }),
            lineDataset("Throttle (%)", chartState.throttle, { yAxisID: "inputs" }),
            lineDataset("Brake (%)", chartState.brake, { yAxisID: "inputs" })
        ] },
        options: { ...common, scales: {
            x: common.scales.x,
            speed: axis("Speed (km/h)", { type: "linear", position: "left", beginAtZero: true }),
            inputs: axis("Driver input (%)", { type: "linear", position: "right", min: 0, max: 100, grid: { drawOnChartArea: false } })
        } }
    });

    const temperatures = lineChart("temperatureChart", [
        lineDataset("Engine (°C)", chartState.engineTemp),
        lineDataset("Coolant (°C)", chartState.coolantTemp),
        lineDataset("Oil (°C)", chartState.oilTemp)
    ], "Temperature (°C)");

    const battery = new Chart(document.getElementById("batteryChart"), {
        type: "line",
        data: { labels: chartState.labels, datasets: [
            lineDataset("Voltage (V)", chartState.batteryVoltage, { yAxisID: "voltage" }),
            lineDataset("Current (A)", chartState.batteryCurrent, { yAxisID: "current" })
        ] },
        options: { ...common, scales: {
            x: common.scales.x,
            voltage: axis("Voltage (V)", { type: "linear", position: "left" }),
            current: axis("Current (A)", { type: "linear", position: "right", grid: { drawOnChartArea: false } })
        } }
    });

    const gTrace = lineChart("gTraceChart", [
        lineDataset("Lateral G", chartState.lateralG),
        lineDataset("Longitudinal G", chartState.longitudinalG)
    ], "Acceleration (g)", { suggestedMin: -1.5, suggestedMax: 1.5 });

    const circle = Array.from({ length: 73 }, (_, i) => {
        const angle = (i / 72) * Math.PI * 2;
        return { x: Number((GG_REFERENCE_G * Math.cos(angle)).toFixed(3)), y: Number((GG_REFERENCE_G * Math.sin(angle)).toFixed(3)) };
    });
    const gg = new Chart(document.getElementById("ggChart"), {
        type: "scatter",
        data: { datasets: [
            {
                label: "1.5 g reference circle (illustrative)",
                data: circle,
                showLine: true,
                borderWidth: 1,
                borderDash: [5, 5],
                pointRadius: 0,
                pointHitRadius: 0,
                tension: 0
            },
            {
                label: "Session trace",
                data: chartState.ggHistory,
                showLine: true,
                borderWidth: 2,
                pointRadius: 0,
                pointHitRadius: 6,
                tension: 0
            },
            {
                label: "Current sample",
                data: chartState.ggCurrent,
                showLine: false,
                pointRadius: 5,
                pointHoverRadius: 7,
                pointStyle: "circle"
            }
        ] },
        options: {
            ...common,
            normalized: false,
            interaction: { mode: "nearest", intersect: false },
            scales: {
                x: axis("Lateral G", { type: "linear", min: -1.8, max: 1.8 }),
                y: axis("Longitudinal G", { min: -1.8, max: 1.8 })
            },
            plugins: {
                ...common.plugins,
                tooltip: {
                    callbacks: {
                        label: context => {
                            const point = context.raw;
                            const time = Number.isFinite(point?.t) ? ` at ${point.t.toFixed(1)} s` : "";
                            return `${context.dataset.label}: (${point.x.toFixed(2)} g, ${point.y.toFixed(2)} g)${time}`;
                        }
                    }
                }
            }
        }
    });

    telemetryCharts = [speed, rpm, gear, steering, combined, temperatures, battery, gTrace, gg];
    clearButton.addEventListener("click", clearChartHistory);
    chartsReady = true;
    return telemetryCharts;
}

function updateTelemetryCharts(telemetry, timeSeconds) {
    if (importedDatasetActive || !telemetry || typeof Chart === "undefined") return;
    if (!chartsReady && !setupCharts().length) return;

    const parsedTime = Number(timeSeconds);
    const fallbackTime = chartState.timestamps.length ? chartState.timestamps.at(-1) + 0.5 : 0;
    const timestamp = Number.isFinite(parsedTime) && parsedTime >= 0 ? parsedTime : fallbackTime;
    const t = Number(timestamp.toFixed(1));
    // Do not append duplicate or out-of-order samples; all graph series share
    // this single session timestamp.
    if (chartState.timestamps.length && t <= chartState.timestamps.at(-1)) return;

    chartState.timestamps.push(t);
    chartState.labels.push(t.toFixed(1));
    chartState.speed.push(Number(telemetry.speedKmh ?? telemetry.speed));
    chartState.rpm.push(Number(telemetry.rpm));
    chartState.throttle.push(Number(telemetry.throttlePercent ?? telemetry.throttle));
    chartState.brake.push(Number(telemetry.brakePercent ?? telemetry.brake));
    chartState.gear.push(Number(telemetry.gear));
    chartState.steering.push(Number(telemetry.steeringDeg ?? telemetry.steering));
    chartState.engineTemp.push(Number(telemetry.engineTempC));
    chartState.coolantTemp.push(Number(telemetry.coolantTempC));
    chartState.oilTemp.push(Number(telemetry.oilTempC));
    chartState.batteryVoltage.push(Number(telemetry.batteryVoltageV));
    chartState.batteryCurrent.push(Number(telemetry.batteryCurrentA));
    chartState.lateralG.push(Number(telemetry.lateralG));
    chartState.longitudinalG.push(Number(telemetry.longitudinalG));

    const ggPoint = {
        x: Number(telemetry.lateralG),
        y: Number(telemetry.longitudinalG),
        t
    };
    chartState.ggHistory.push(ggPoint);
    chartState.ggCurrent.splice(0, chartState.ggCurrent.length, ggPoint);

    if (chartState.labels.length > HISTORY_LIMIT) {
        Object.values(chartState).forEach(values => {
            if (values.length > HISTORY_LIMIT) values.shift();
        });
    }
    telemetryCharts.forEach(chart => chart.update("none"));
}

function loadTelemetryChartDataset(rows) {
    if (!Array.isArray(rows) || !rows.length || typeof Chart === "undefined") return false;
    if (!chartsReady && !setupCharts().length) return false;
    importedDatasetActive = true;
    Object.values(chartState).forEach(values => { values.length = 0; });
    const channelMap = [
        ["speed", "speedKmh"], ["rpm", "rpm"], ["throttle", "throttlePercent"],
        ["brake", "brakePercent"], ["gear", "gear"], ["steering", "steeringDeg"],
        ["engineTemp", "engineTempC"], ["coolantTemp", "coolantTempC"],
        ["oilTemp", "oilTempC"], ["batteryVoltage", "batteryVoltageV"],
        ["batteryCurrent", "batteryCurrentA"], ["lateralG", "lateralG"],
        ["longitudinalG", "longitudinalG"]
    ];
    for (const row of rows) {
        const t = Number(row.timeSeconds);
        chartState.timestamps.push(t);
        chartState.labels.push(t.toFixed(2));
        for (const [target, source] of channelMap) {
            const value = Number(row[source]);
            chartState[target].push(Number.isFinite(value) ? value : null);
        }
        if (Number.isFinite(row.lateralG) && Number.isFinite(row.longitudinalG)) {
            chartState.ggHistory.push({ x: row.lateralG, y: row.longitudinalG, t });
        }
    }
    if (chartState.ggHistory.length) chartState.ggCurrent.push(chartState.ggHistory[chartState.ggHistory.length - 1]);
    telemetryCharts.forEach(chart => chart.update("none"));
    return true;
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupCharts, { once: true });
} else {
    setupCharts();
}

window.updateTelemetryCharts = updateTelemetryCharts;
window.clearTelemetryCharts = clearChartHistory;
window.loadTelemetryChartDataset = loadTelemetryChartDataset;
