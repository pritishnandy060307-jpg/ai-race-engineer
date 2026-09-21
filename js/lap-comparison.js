import { raceState } from "./state.js";

const STYLE_ID = "lap-comparison-styles";
const PANEL_ID = "lapComparisonPanel";

function injectStyles() {
    if (document.querySelector(`#${STYLE_ID}`)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
        #${PANEL_ID} { margin: 1rem 0; padding: 1rem; border: 1px solid var(--border, #2b3440); border-radius: 12px; background: var(--panel, #12161c); }
        #${PANEL_ID} h2 { margin: 0 0 .8rem; }
        .lap-comparison-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(135px, 1fr)); gap: .7rem; }
        .lap-comparison-item { padding: .8rem; border-radius: 8px; background: var(--panel-2, #191f27); }
        .lap-comparison-item span { display: block; color: var(--muted, #8e9aaa); font-size: .78rem; }
        .lap-comparison-item strong { display: block; margin-top: .25rem; font-size: 1.2rem; }
        #lapComparisonStatus { margin: .8rem 0 0; font-weight: 700; letter-spacing: .04em; }
        #lapComparisonStatus.ahead { color: #55d68a; }
        #lapComparisonStatus.behind { color: #ff8a65; }
    `;
    document.head.appendChild(style);
}

function parseTime(id) {
    const element = document.querySelector(`#${id}`);
    if (!element) return null;
    const match = element.textContent.replace(/,/g, "").match(/-?\d+(?:\.\d+)?/);
    if (!match) return null;
    const value = Number.parseFloat(match[0]);
    return Number.isFinite(value) ? value : null;
}

function formatTime(value) {
    return Number.isFinite(value) ? `${value.toFixed(3)} s` : "—";
}

function ensurePanel() {
    if (document.querySelector(`#${PANEL_ID}`)) return;
    const panel = document.createElement("section");
    panel.id = PANEL_ID;
    panel.className = "telemetry-section";
    panel.setAttribute("aria-label", "Lap comparison");
    panel.innerHTML = `
        <h2>Lap Comparison</h2>
        <div class="lap-comparison-grid">
            <div class="lap-comparison-item"><span>Current Lap</span><strong id="lapCompareCurrent">—</strong></div>
            <div class="lap-comparison-item"><span>Best Lap</span><strong id="lapCompareBest">—</strong></div>
            <div class="lap-comparison-item"><span>Delta</span><strong id="lapCompareDelta">—</strong></div>
            <div class="lap-comparison-item"><span>Lap Number</span><strong id="lapCompareNumber">—</strong></div>
        </div>
        <p id="lapComparisonStatus" aria-live="polite">NO BASELINE</p>
    `;
    const anchor = document.querySelector("#phase2Details") || document.querySelector(".cards") || document.querySelector("main");
    anchor?.after(panel);
}

function updatePanel() {
    const current = parseTime("lapTime");
    const best = parseTime("bestLap");
    const delta = parseTime("delta");
    const currentValue = current ?? raceState.lap.currentTimeSeconds;
    const bestValue = best ?? raceState.lap.bestTimeSeconds;
    const deltaValue = delta ?? raceState.lap.deltaSeconds;

    const currentElement = document.querySelector("#lapCompareCurrent");
    const bestElement = document.querySelector("#lapCompareBest");
    const deltaElement = document.querySelector("#lapCompareDelta");
    const numberElement = document.querySelector("#lapCompareNumber");
    const statusElement = document.querySelector("#lapComparisonStatus");

    if (currentElement) currentElement.textContent = formatTime(currentValue);
    if (bestElement) bestElement.textContent = formatTime(bestValue);
    if (deltaElement) deltaElement.textContent = Number.isFinite(deltaValue) ? `${deltaValue > 0 ? "+" : ""}${deltaValue.toFixed(3)} s` : "—";
    if (numberElement) numberElement.textContent = String(raceState.lap.number ?? "—");

    if (!statusElement) return;
    statusElement.classList.remove("ahead", "behind");
    if (!Number.isFinite(deltaValue)) {
        statusElement.textContent = "NO BASELINE";
    } else if (deltaValue < 0) {
        statusElement.textContent = "AHEAD OF BEST";
        statusElement.classList.add("ahead");
    } else if (deltaValue > 0) {
        statusElement.textContent = "BEHIND BEST";
        statusElement.classList.add("behind");
    } else {
        statusElement.textContent = "MATCHING BEST";
    }
}

function initLapComparison() {
    injectStyles();
    ensurePanel();
    updatePanel();
    setInterval(updatePanel, 250);
}

document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", initLapComparison, { once: true }) : initLapComparison();
