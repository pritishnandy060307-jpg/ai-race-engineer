import { raceState } from "./state.js";

const PANEL_ID = "aiRaceEngineerPanel";

function injectStyles() {
    if (document.querySelector("#ai-race-engineer-styles")) return;
    const style = document.createElement("style");
    style.id = "ai-race-engineer-styles";
    style.textContent = `
        #${PANEL_ID} { margin: 1rem 0; padding: 1rem; border: 1px solid var(--border, #2b3440); border-radius: 12px; background: var(--panel, #12161c); }
        #${PANEL_ID} h2 { margin: 0 0 .35rem; }
        .ai-engineer-subtitle { color: var(--muted, #8e9aaa); margin: 0 0 .8rem; font-size: .9rem; }
        .ai-engineer-message { padding: .7rem .8rem; margin: .45rem 0; border-left: 3px solid var(--accent, #ff6a00); background: var(--panel-2, #191f27); border-radius: 6px; }
        .ai-engineer-message strong { display: block; margin-bottom: .2rem; }
        .ai-engineer-empty { color: var(--muted, #8e9aaa); }
    `;
    document.head.appendChild(style);
}

function addMessage(container, title, text) {
    const message = document.createElement("div");
    message.className = "ai-engineer-message";
    message.innerHTML = `<strong>${title}</strong><span>${text}</span>`;
    container.appendChild(message);
}

function updateAdvice() {
    const container = document.querySelector("#aiEngineerMessages");
    if (!container) return;
    container.replaceChildren();

    const { vehicle, telemetry, lap } = raceState;
    const speed = Number(vehicle.speedKmh) || 0;
    const rpm = Number(vehicle.rpm) || 0;
    const throttle = Number(vehicle.throttlePercent) || 0;
    const brake = Number(vehicle.brakePercent) || 0;
    const recentThrottle = telemetry.throttle.slice(-10);
    const recentBrake = telemetry.brake.slice(-10);
    const averageThrottle = recentThrottle.length ? recentThrottle.reduce((sum, value) => sum + value, 0) / recentThrottle.length : throttle;
    const brakingSamples = recentBrake.filter(value => value > 15).length;

    if (!raceState.session.active && lap.number === 1 && !telemetry.timestamps.length) {
        const empty = document.createElement("p");
        empty.className = "ai-engineer-empty";
        empty.textContent = "Start a session to receive telemetry-based engineering guidance.";
        container.appendChild(empty);
        return;
    }

    if (brake > 80 && throttle > 20) addMessage(container, "Brake and throttle overlap", "Check pedal coordination: high brake and throttle input together may indicate an inefficient transition.");
    if (brakingSamples >= 6) addMessage(container, "Frequent braking activity", "Review braking points and release consistency in the telemetry trace.");
    if (rpm >= 9000) addMessage(container, "High engine speed", "Monitor the RPM limit and consider an earlier upshift if the engine is near its operating ceiling.");
    if (averageThrottle < 25 && speed > 20) addMessage(container, "Low average throttle", "Check whether corner exits or traction limitations are preventing earlier acceleration.");
    if (speed > 0 && brake < 5 && throttle < 5) addMessage(container, "Coasting detected", "Review the coasting zone to determine whether braking or throttle application can be made more deliberate.");

    if (!container.children.length) addMessage(container, "Session stable", "No immediate rule-based warning detected. Continue monitoring speed, RPM, throttle, brake, and lap delta.");
}

function ensurePanel() {
    if (document.querySelector(`#${PANEL_ID}`)) return;
    const panel = document.createElement("section");
    panel.id = PANEL_ID;
    panel.className = "telemetry-section";
    panel.setAttribute("aria-label", "AI race engineer");
    panel.innerHTML = `<h2>AI Race Engineer</h2><p class="ai-engineer-subtitle">Rule-based engineering guidance from live session telemetry.</p><div id="aiEngineerMessages" aria-live="polite"></div>`;
    const anchor = document.querySelector("#lapComparisonPanel") || document.querySelector("#phase2Details") || document.querySelector("main");
    anchor?.after(panel);
}

function init() {
    injectStyles();
    ensurePanel();
    updateAdvice();
    setInterval(updateAdvice, 500);
}

document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", init, { once: true }) : init();
