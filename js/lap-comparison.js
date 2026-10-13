import { raceState } from "./state.js";

const STYLE_ID = "lap-comparison-styles";
const PANEL_ID = "lapComparisonPanel";
const MAX_LAPS = 24;
const SAMPLE_INTERVAL = 0.45;
const state = {
    laps: [],
    activeLap: null,
    lastSampleElapsed: -Infinity,
    lastLapNumber: null,
    lastSessionElapsed: 0,
    chart: null
};

function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
        #${PANEL_ID} { margin: 1rem 0; padding: clamp(16px,2.5vw,24px); border: 1px solid var(--border,#2b3440); border-radius: 12px; background: var(--panel,#12161c); }
        #${PANEL_ID} h2 { margin: 0 0 .45rem; }
        #${PANEL_ID} .lap-compare-intro { color:var(--muted,#8e9aaa);line-height:1.55;margin:0 0 16px; }
        #${PANEL_ID} .lap-compare-controls { display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:14px 0; }
        #${PANEL_ID} label { display:grid;gap:6px;color:var(--muted,#8e9aaa);font-size:12px; }
        #${PANEL_ID} select { width:100%;min-width:0;padding:11px;border:1px solid var(--border,#2b3440);border-radius:8px;background:#0d1116;color:var(--text,#f5f7fa); }
        #${PANEL_ID} .lap-comparison-grid { display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:14px 0; }
        #${PANEL_ID} .lap-comparison-item { padding:13px;border-radius:8px;background:var(--panel-2,#191f27);border:1px solid var(--border,#2b3440);min-width:0; }
        #${PANEL_ID} .lap-comparison-item span { display:block;color:var(--muted,#8e9aaa);font-size:.76rem; }
        #${PANEL_ID} .lap-comparison-item strong { display:block;margin-top:6px;font-size:clamp(16px,2vw,22px);overflow-wrap:anywhere; }
        #${PANEL_ID} .lap-comparison-chart { height:300px;position:relative;margin-top:14px; }
        #${PANEL_ID} .lap-compare-actions { display:flex;flex-wrap:wrap;gap:8px;margin-top:12px; }
        #${PANEL_ID} .lap-compare-actions button { margin:0; }
        #${PANEL_ID} .lap-compare-note { color:var(--muted,#8e9aaa);font-size:12px;line-height:1.5;margin:12px 0 0; }
        #${PANEL_ID} .lap-compare-status { font-weight:800;font-size:12px;letter-spacing:.05em;margin:10px 0 0; }
        #${PANEL_ID} .lap-compare-status.ahead { color:#55d68a; }
        #${PANEL_ID} .lap-compare-status.behind { color:#ff8a65; }
        @media(max-width:700px) { #${PANEL_ID} .lap-comparison-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } #${PANEL_ID} .lap-compare-controls { grid-template-columns:1fr; } #${PANEL_ID} .lap-comparison-chart { height:240px; } }
    `;
    document.head.appendChild(style);
}

function formatTime(value) {
    if (!Number.isFinite(value) || value < 0) return "—";
    const minutes = Math.floor(value / 60);
    const seconds = value - minutes * 60;
    return `${String(minutes).padStart(2, "0")}:${seconds.toFixed(3).padStart(6, "0")}`;
}

function signed(value, unit = "s", digits = 3) {
    if (!Number.isFinite(value)) return "—";
    return `${value > 0 ? "+" : ""}${value.toFixed(digits)} ${unit}`;
}

function ensurePanel() {
    if (document.getElementById(PANEL_ID)) return;
    const panel = document.createElement("section");
    panel.id = PANEL_ID;
    panel.className = "telemetry-section";
    panel.setAttribute("aria-label", "Lap comparison and time deltas");
    panel.innerHTML = `
        <h2>Lap Comparison & Time Delta</h2>
        <p class="lap-compare-intro">Compare recorded lap speed traces and key performance metrics. Laps are captured from the active telemetry stream in this browser session.</p>
        <div class="lap-compare-controls">
            <label>Reference lap (A)<select id="lapCompareSelectA" aria-label="Reference lap"></select></label>
            <label>Comparison lap (B)<select id="lapCompareSelectB" aria-label="Comparison lap"></select></label>
        </div>
        <div class="lap-comparison-grid">
            <div class="lap-comparison-item"><span>Lap time delta (B − A)</span><strong id="lapCompareDelta">—</strong></div>
            <div class="lap-comparison-item"><span>Top speed delta</span><strong id="lapCompareTopSpeed">—</strong></div>
            <div class="lap-comparison-item"><span>Average speed delta</span><strong id="lapCompareAverageSpeed">—</strong></div>
            <div class="lap-comparison-item"><span>Peak brake delta</span><strong id="lapCompareBrake">—</strong></div>
        </div>
        <p id="lapComparisonStatus" class="lap-compare-status" aria-live="polite">WAITING FOR LAPS</p>
        <div class="lap-comparison-chart"><canvas id="lapCompareChart" role="img" aria-label="Speed traces for the selected laps"></canvas></div>
        <div class="lap-compare-actions"><button id="exportLapComparison" type="button">Export Comparison CSV</button><button id="resetLapComparison" type="button">Clear Captured Laps</button></div>
        <p id="lapCompareMessage" class="lap-compare-note">Start a session and complete at least two laps to compare recorded traces. Spatial sector timing requires distance or GPS telemetry and is not inferred from time alone.</p>
    `;
    const anchor = document.getElementById("performanceAnalysis")
        || document.getElementById("phase2Dashboard")
        || document.querySelector(".cards")
        || document.querySelector("main");
    anchor?.after(panel);
}

function getTelemetry() {
    return raceState.telemetry?.current || window.raceTelemetry || null;
}

function numeric(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
}

function beginLap(number, elapsed) {
    state.activeLap = { number, startedAt: elapsed, samples: [], officialTime: null };
    state.lastLapNumber = number;
    state.lastSampleElapsed = -Infinity;
}

function finishLap(numberJustCompleted) {
    const lap = state.activeLap;
    if (!lap || lap.samples.length < 3) return;
    const times = Array.isArray(raceState.lap.completedTimes) ? raceState.lap.completedTimes : [];
    const official = numeric(times[numberJustCompleted - 1]);
    const samples = lap.samples.map(sample => ({ ...sample }));
    const duration = official ?? (samples[samples.length - 1].lapTimeSeconds);
    // Normalize each trace to its own completed lap duration so faster/slower
    // laps align on the same 0–100% horizontal axis.
    samples.forEach(sample => {
        sample.progressPercent = Math.max(0, Math.min(100, sample.lapTimeSeconds / Math.max(0.001, duration) * 100));
    });
    const record = {
        number: numberJustCompleted,
        timeSeconds: duration,
        samples,
        topSpeedKmh: Math.max(...samples.map(sample => sample.speedKmh).filter(Number.isFinite)),
        averageSpeedKmh: samples.reduce((sum, sample) => sum + sample.speedKmh, 0) / samples.length,
        peakBrakePercent: Math.max(...samples.map(sample => sample.brakePercent).filter(Number.isFinite)),
        sampleCount: samples.length
    };
    if (!Number.isFinite(record.topSpeedKmh)) record.topSpeedKmh = null;
    if (!Number.isFinite(record.averageSpeedKmh)) record.averageSpeedKmh = null;
    if (!Number.isFinite(record.peakBrakePercent)) record.peakBrakePercent = null;
    const existing = state.laps.findIndex(item => item.number === record.number);
    if (existing >= 0) state.laps[existing] = record;
    else state.laps.push(record);
    state.laps.sort((a, b) => a.number - b.number);
    while (state.laps.length > MAX_LAPS) state.laps.shift();
}

function captureSample() {
    const elapsed = Number(raceState.session.elapsedSeconds) || 0;
    const lapNumber = Number(raceState.lap.number) || 1;
    if (elapsed < state.lastSessionElapsed || (elapsed === 0 && state.lastSessionElapsed > 0)) {
        state.laps = [];
        state.activeLap = null;
        state.lastLapNumber = null;
        state.lastSampleElapsed = -Infinity;
        refreshLapOptions();
    }
    state.lastSessionElapsed = elapsed;
    if (!raceState.session.active) return;

    if (!state.activeLap || state.lastLapNumber !== lapNumber) {
        if (state.activeLap && state.lastLapNumber !== null) finishLap(state.lastLapNumber);
        beginLap(lapNumber, elapsed);
        refreshLapOptions();
    }

    if (elapsed - state.lastSampleElapsed < SAMPLE_INTERVAL) return;
    const telemetry = getTelemetry();
    if (!telemetry) return;

    const speed = numeric(telemetry.speedKmh ?? telemetry.speed);
    const brake = numeric(telemetry.brakePercent ?? telemetry.brake);
    const rpm = numeric(telemetry.rpm);
    const throttle = numeric(telemetry.throttlePercent ?? telemetry.throttle);
    if (speed === null) return;
    const lapTime = Math.max(0, numeric(raceState.lap.currentTimeSeconds) ?? elapsed - state.activeLap.startedAt);
    state.activeLap.samples.push({
        lapTimeSeconds: lapTime,
        progressPercent: Math.max(0, Math.min(100, lapTime / Math.max(0.001, Number(raceState.lap.targetTimeSeconds) || 20) * 100)),
        speedKmh: speed,
        brakePercent: brake ?? 0,
        throttlePercent: throttle ?? 0,
        rpm: rpm ?? 0,
        gear: numeric(telemetry.gear) ?? 0,
        steeringDeg: numeric(telemetry.steeringDeg ?? telemetry.steering) ?? 0,
        lateralG: numeric(telemetry.lateralG) ?? 0,
        longitudinalG: numeric(telemetry.longitudinalG) ?? 0,
        distanceM: numeric(telemetry.distanceM ?? telemetry.distance),
        latitude: numeric(telemetry.latitude ?? telemetry.lat),
        longitude: numeric(telemetry.longitude ?? telemetry.lon)
    });
    state.lastSampleElapsed = elapsed;
}

function createChart() {
    if (state.chart || typeof Chart === "undefined") return;
    const canvas = document.getElementById("lapCompareChart");
    if (!canvas) return;
    state.chart = new Chart(canvas, {
        type: "line",
        data: { datasets: [] },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            interaction: { mode: "nearest", intersect: false },
            plugins: {
                legend: { display: true, labels: { color: "#cbd5e1", usePointStyle: true } },
                tooltip: { callbacks: { label: context => ` ${context.dataset.label}: ${Number(context.parsed.y).toFixed(1)} km/h` } }
            },
            scales: {
                x: { type: "linear", min: 0, max: 100, title: { display: true, text: "Lap progress (%)", color: "#9aa6b5" }, ticks: { color: "#9aa6b5" }, grid: { color: "rgba(142,154,170,.12)" } },
                y: { beginAtZero: true, title: { display: true, text: "Speed (km/h)", color: "#9aa6b5" }, ticks: { color: "#9aa6b5" }, grid: { color: "rgba(142,154,170,.12)" } }
            }
        }
    });
}

function refreshLapOptions() {
    const selectA = document.getElementById("lapCompareSelectA");
    const selectB = document.getElementById("lapCompareSelectB");
    if (!selectA || !selectB) return;
    const previousA = selectA.value;
    const previousB = selectB.value;
    const sorted = [...state.laps].sort((a, b) => a.number - b.number);
    const options = sorted.map(lap => ({
        value: String(lap.number),
        label: `Lap ${lap.number} · ${formatTime(lap.timeSeconds)}`
    }));
    for (const select of [selectA, selectB]) {
        select.replaceChildren();
        if (options.length === 0) {
            const option = document.createElement("option");
            option.value = "";
            option.textContent = "Complete a lap first";
            select.appendChild(option);
        } else {
            options.forEach(item => {
                const option = document.createElement("option");
                option.value = item.value;
                option.textContent = item.label;
                select.appendChild(option);
            });
        }
    }
    const values = options.map(item => item.value);
    selectA.value = values.includes(previousA) ? previousA : (values[0] || "");
    selectB.value = values.includes(previousB) ? previousB : (values[values.length - 1] || "");
    if (values.length > 1 && selectA.value === selectB.value) selectA.value = values[0];
    renderComparison();
}

function getSelectedLaps() {
    const aNumber = Number(document.getElementById("lapCompareSelectA")?.value);
    const bNumber = Number(document.getElementById("lapCompareSelectB")?.value);
    return {
        a: state.laps.find(lap => lap.number === aNumber) || null,
        b: state.laps.find(lap => lap.number === bNumber) || null
    };
}

function setMetric(id, value, unit, digits = 1) {
    const el = document.getElementById(id);
    if (el) el.textContent = Number.isFinite(value) ? `${value > 0 ? "+" : ""}${value.toFixed(digits)} ${unit}` : "—";
}

function renderComparison() {
    createChart();
    const { a, b } = getSelectedLaps();
    const status = document.getElementById("lapComparisonStatus");
    if (!a || !b) {
        setMetric("lapCompareDelta", NaN, "s");
        setMetric("lapCompareTopSpeed", NaN, "km/h");
        setMetric("lapCompareAverageSpeed", NaN, "km/h");
        setMetric("lapCompareBrake", NaN, "%");
        if (status) {
            status.className = "lap-compare-status";
            status.textContent = state.laps.length === 0 ? "WAITING FOR LAPS" : "CAPTURE ANOTHER LAP TO COMPARE";
        }
        if (state.chart) {
            state.chart.data.datasets = [];
            state.chart.update("none");
        }
        return;
    }

    const delta = b.timeSeconds - a.timeSeconds;
    setMetric("lapCompareDelta", delta, "s", 3);
    setMetric("lapCompareTopSpeed", (b.topSpeedKmh ?? NaN) - (a.topSpeedKmh ?? NaN), "km/h", 1);
    setMetric("lapCompareAverageSpeed", (b.averageSpeedKmh ?? NaN) - (a.averageSpeedKmh ?? NaN), "km/h", 1);
    setMetric("lapCompareBrake", (b.peakBrakePercent ?? NaN) - (a.peakBrakePercent ?? NaN), "%", 1);

    if (status) {
        status.className = "lap-compare-status";
        if (a.number === b.number) status.textContent = "SAME LAP SELECTED";
        else if (delta < 0) { status.textContent = `LAP ${b.number} IS ${Math.abs(delta).toFixed(3)} s FASTER`; status.classList.add("ahead"); }
        else if (delta > 0) { status.textContent = `LAP ${b.number} IS ${delta.toFixed(3)} s SLOWER`; status.classList.add("behind"); }
        else status.textContent = "MATCHING LAP TIMES";
    }

    if (state.chart) {
        const datasets = [
            { label: `Lap ${a.number} · ${formatTime(a.timeSeconds)}`, data: a.samples.map(sample => ({ x: sample.progressPercent, y: sample.speedKmh })), borderWidth: 2, pointRadius: 0, tension: 0.12 },
            { label: `Lap ${b.number} · ${formatTime(b.timeSeconds)}`, data: b.samples.map(sample => ({ x: sample.progressPercent, y: sample.speedKmh })), borderWidth: 2, pointRadius: 0, tension: 0.12 }
        ];
        state.chart.data.datasets = datasets;
        state.chart.update("none");
    }
}

function exportComparison() {
    const { a, b } = getSelectedLaps();
    if (!a || !b) {
        const message = document.getElementById("lapCompareMessage");
        if (message) message.textContent = "Capture at least one completed lap and select it in both fields before exporting.";
        return;
    }
    const header = ["lap", "lap_time_s", "lap_progress_percent", "lap_time_at_sample_s", "speed_kmh", "throttle_percent", "brake_percent", "rpm", "gear", "steering_deg", "lateral_g", "longitudinal_g"];
    const rows = [header];
    for (const lap of [a, b]) {
        for (const sample of lap.samples) {
            rows.push([lap.number, lap.timeSeconds, sample.progressPercent.toFixed(2), sample.lapTimeSeconds.toFixed(3), sample.speedKmh, sample.throttlePercent, sample.brakePercent, sample.rpm, sample.gear, sample.steeringDeg, sample.lateralG, sample.longitudinalG]);
        }
    }
    const csv = rows.map(row => row.map(value => {
        const text = String(value ?? "");
        return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
    }).join(",")).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `lap-comparison-${a.number}-vs-${b.number}.csv`;
    link.click();
    URL.revokeObjectURL(url);
}

function clearLaps() {
    state.laps = [];
    state.activeLap = null;
    state.lastLapNumber = Number(raceState.lap.number) || 1;
    state.lastSampleElapsed = -Infinity;
    refreshLapOptions();
    const message = document.getElementById("lapCompareMessage");
    if (message) message.textContent = "Captured laps cleared. Complete new laps to build a fresh comparison.";
}

// Read-only snapshot API for analysis modules. Callers receive copies so they
// cannot mutate the recorder's canonical lap history.
window.getLapComparisonData = () => state.laps.map(lap => ({
    number: lap.number,
    timeSeconds: lap.timeSeconds,
    topSpeedKmh: lap.topSpeedKmh,
    averageSpeedKmh: lap.averageSpeedKmh,
    peakBrakePercent: lap.peakBrakePercent,
    sampleCount: lap.sampleCount,
    samples: lap.samples.map(sample => ({ ...sample }))
}));

function initLapComparison() {
    injectStyles();
    ensurePanel();
    createChart();
    document.getElementById("lapCompareSelectA")?.addEventListener("change", renderComparison);
    document.getElementById("lapCompareSelectB")?.addEventListener("change", renderComparison);
    document.getElementById("exportLapComparison")?.addEventListener("click", exportComparison);
    document.getElementById("resetLapComparison")?.addEventListener("click", clearLaps);
    refreshLapOptions();
    setInterval(() => {
        captureSample();
        if (!state.chart) createChart();
    }, 200);
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initLapComparison, { once: true });
else initLapComparison();
