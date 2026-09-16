import { raceState } from "./state.js";

const state = {
    lastElapsed: 0,
    lastCompletedCount: 0
};

function formatLapTime(seconds) {
    if (!Number.isFinite(seconds)) return "—";
    const minutes = Math.floor(seconds / 60);
    const remainder = seconds - minutes * 60;
    return `${String(minutes).padStart(2, "0")}:${remainder.toFixed(3).padStart(6, "0")}`;
}

function createPanel() {
    if (document.getElementById("performanceAnalysis")) return;

    const section = document.createElement("section");
    section.id = "performanceAnalysis";
    section.className = "performance-analysis telemetry-section";
    section.innerHTML = `
        <div class="phase2-heading">
            <div>
                <h2>Driver Performance Analysis</h2>
                <p class="calculator-description">Lap consistency and lap-to-lap performance comparison.</p>
            </div>
        </div>
        <div class="phase2-grid performance-grid">
            <div class="phase2-card"><span>Completed Laps</span><strong id="performanceCompleted">0</strong></div>
            <div class="phase2-card"><span>Average Lap</span><strong id="performanceAverage">—</strong></div>
            <div class="phase2-card"><span>Fastest Lap</span><strong id="performanceFastest">—</strong></div>
            <div class="phase2-card"><span>Consistency</span><strong id="performanceConsistency">—</strong></div>
        </div>
        <div id="performanceLapList" class="session-summary"><strong>Lap comparison</strong><span>Complete a lap to see lap-to-lap deltas.</span></div>`;

    const dashboard = document.getElementById("phase2Dashboard");
    const firstCalculator = document.querySelector(".calculator-section");
    (dashboard || firstCalculator)?.after(section);
}

function resetPanel() {
    const values = {
        performanceCompleted: "0",
        performanceAverage: "—",
        performanceFastest: "—",
        performanceConsistency: "—"
    };
    Object.entries(values).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    });
    const list = document.getElementById("performanceLapList");
    if (list) list.innerHTML = "<strong>Lap comparison</strong><span>Complete a lap to see lap-to-lap deltas.</span>";
}

function updatePanel() {
    const active = raceState.session.active;
    const elapsed = Number(raceState.session.elapsedSeconds) || 0;
    const times = Array.isArray(raceState.lap.completedTimes) ? raceState.lap.completedTimes.filter(Number.isFinite) : [];

    if (elapsed < state.lastElapsed || (!active && state.lastCompletedCount > 0)) {
        state.lastCompletedCount = 0;
        state.lastElapsed = 0;
        resetPanel();
    }

    if (!active) return;

    const completed = times.length;
    if (completed === 0) {
        state.lastElapsed = elapsed;
        return;
    }

    const average = times.reduce((sum, time) => sum + time, 0) / completed;
    const fastest = Math.min(...times);
    const variance = times.reduce((sum, time) => sum + (time - average) ** 2, 0) / completed;
    const standardDeviation = Math.sqrt(variance);

    document.getElementById("performanceCompleted").textContent = String(completed);
    document.getElementById("performanceAverage").textContent = formatLapTime(average);
    document.getElementById("performanceFastest").textContent = formatLapTime(fastest);
    document.getElementById("performanceConsistency").textContent = `${standardDeviation.toFixed(3)} s σ`;

    const list = document.getElementById("performanceLapList");
    if (list) {
        const rows = times.map((time, index) => {
            const delta = index === 0 ? "baseline" : `${time - times[index - 1] >= 0 ? "+" : ""}${(time - times[index - 1]).toFixed(3)} s`;
            return `<span>Lap ${index + 1}: <strong>${formatLapTime(time)}</strong> <small>(${delta})</small></span>`;
        }).join("");
        list.innerHTML = `<strong>Lap comparison</strong>${rows}`;
    }

    state.lastCompletedCount = completed;
    state.lastElapsed = elapsed;
}

function init() {
    createPanel();
    resetPanel();
    setInterval(updatePanel, 200);
    updatePanel();
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
else init();
