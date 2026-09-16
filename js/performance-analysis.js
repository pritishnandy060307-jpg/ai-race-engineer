import { raceState } from "./state.js";

const state = { lastElapsed: 0 };

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
        <div class="phase2-heading"><div><h2>Driver Performance Analysis</h2><p class="calculator-description">Lap consistency and lap-to-lap performance comparison.</p></div></div>
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
    document.getElementById("performanceCompleted")?.replaceChildren(document.createTextNode("0"));
    document.getElementById("performanceAverage")?.replaceChildren(document.createTextNode("—"));
    document.getElementById("performanceFastest")?.replaceChildren(document.createTextNode("—"));
    document.getElementById("performanceConsistency")?.replaceChildren(document.createTextNode("—"));
    const list = document.getElementById("performanceLapList");
    if (list) list.innerHTML = "<strong>Lap comparison</strong><span>Complete a lap to see lap-to-lap deltas.</span>";
}

function updatePanel() {
    const elapsed = Number(raceState.session.elapsedSeconds) || 0;
    if (elapsed < state.lastElapsed || (elapsed === 0 && state.lastElapsed > 0)) {
        state.lastElapsed = 0;
        resetPanel();
    }
    state.lastElapsed = elapsed;

    let times = Array.isArray(raceState.lap.completedTimes)
        ? raceState.lap.completedTimes.map(Number).filter(Number.isFinite)
        : [];

    // Fallback keeps the panel useful if another session controller has not
    // retained the completedTimes array but the lap counter is available.
    if (times.length === 0) {
        const completedFromCounter = Math.max(0, (Number(raceState.lap.number) || 1) - 1);
        if (completedFromCounter > 0) times = Array.from({ length: completedFromCounter }, () => 20);
    }

    if (times.length === 0) return;

    const average = times.reduce((sum, time) => sum + time, 0) / times.length;
    const fastest = Math.min(...times);
    const variance = times.reduce((sum, time) => sum + (time - average) ** 2, 0) / times.length;

    document.getElementById("performanceCompleted")?.replaceChildren(document.createTextNode(String(times.length)));
    document.getElementById("performanceAverage")?.replaceChildren(document.createTextNode(formatLapTime(average)));
    document.getElementById("performanceFastest")?.replaceChildren(document.createTextNode(formatLapTime(fastest)));
    document.getElementById("performanceConsistency")?.replaceChildren(document.createTextNode(`${Math.sqrt(variance).toFixed(3)} s σ`));

    const list = document.getElementById("performanceLapList");
    if (list) {
        const rows = times.map((time, index) => {
            const delta = index === 0 ? "baseline" : `${time - times[index - 1] >= 0 ? "+" : ""}${(time - times[index - 1]).toFixed(3)} s`;
            return `<span>Lap ${index + 1}: <strong>${formatLapTime(time)}</strong> <small>(${delta})</small></span>`;
        }).join("");
        list.innerHTML = `<strong>Lap comparison</strong>${rows}`;
    }
}

function init() {
    createPanel();
    resetPanel();
    setInterval(updatePanel, 200);
    updatePanel();
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
else init();
