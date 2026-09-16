const phase2State = {
    active: false,
    maxSpeed: 0,
    maxRpm: 0,
    throttleTotal: 0,
    samples: 0,
    brakingEvents: 0,
    previousBrake: 0
};

function injectStyles() {
    if (document.getElementById("phase2Styles")) return;
    const style = document.createElement("style");
    style.id = "phase2Styles";
    style.textContent = `
        .phase2-heading { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; }
        .phase2-heading h2 { margin-bottom:6px; }
        .phase2-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:12px; margin-top:16px; }
        .phase2-card { background:#0f1318; border:1px solid var(--border); border-radius:10px; padding:16px; }
        .phase2-card span { display:block; color:var(--muted); font-size:12px; margin-bottom:8px; text-transform:uppercase; letter-spacing:.5px; }
        .phase2-card strong { color:var(--text); font-size:17px; overflow-wrap:anywhere; }
        .session-health { display:inline-flex; align-items:center; justify-content:center; padding:7px 12px; border-radius:999px; font-size:12px; font-weight:800; letter-spacing:.5px; border:1px solid var(--border); }
        .session-health.live { color:#86efac; border-color:#166534; background:rgba(34,197,94,.12); }
        .session-health.neutral { color:var(--muted); background:#0f1318; }
        .phase2-actions { display:flex; justify-content:flex-end; }
        .phase2-actions button { margin:18px 0 0; background:transparent; border:1px solid var(--accent); color:var(--accent); padding:10px 18px; }
        .phase2-actions button:hover { background:var(--accent-soft); }
        .session-summary { display:flex; flex-direction:column; gap:5px; margin-top:16px; padding:14px; border-left:3px solid var(--accent); background:#0f1318; color:var(--muted); }
        .session-summary strong { color:var(--text); }
        @media (max-width:1100px) { .phase2-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } }
        @media (max-width:700px) { .phase2-heading { flex-direction:column; } .phase2-grid { grid-template-columns:1fr; } .phase2-actions { justify-content:stretch; } .phase2-actions button { width:100%; } }
    `;
    document.head.appendChild(style);
}

function readNumber(id) {
    const element = document.getElementById(id);
    if (!element) return 0;
    const value = Number.parseFloat(element.textContent.replace(/[^0-9.-]/g, ""));
    return Number.isFinite(value) ? value : 0;
}

function addPanel() {
    if (document.getElementById("phase2Dashboard")) return;

    const section = document.createElement("section");
    section.id = "phase2Dashboard";
    section.className = "phase2-dashboard telemetry-section";
    section.innerHTML = `
        <div class="phase2-heading">
            <div><h2>Session Dashboard</h2><p class="calculator-description">Live session information and driver-focused session statistics.</p></div>
            <span id="sessionHealth" class="session-health neutral">STANDBY</span>
        </div>
        <div class="phase2-grid">
            <div class="phase2-card"><span>Driver</span><strong>Pritish Nandy</strong></div>
            <div class="phase2-card"><span>Vehicle</span><strong>Formula Student Car</strong></div>
            <div class="phase2-card"><span>Session Type</span><strong>Practice</strong></div>
            <div class="phase2-card"><span>Current Sector</span><strong id="currentSector">—</strong></div>
        </div>
        <div class="phase2-grid phase2-stats">
            <div class="phase2-card"><span>Top Speed</span><strong id="sessionTopSpeed">—</strong></div>
            <div class="phase2-card"><span>Peak RPM</span><strong id="sessionPeakRpm">—</strong></div>
            <div class="phase2-card"><span>Average Throttle</span><strong id="sessionAverageThrottle">—</strong></div>
            <div class="phase2-card"><span>Braking Events</span><strong id="sessionBrakingEvents">0</strong></div>
        </div>
        <div class="phase2-actions"><button id="resetSessionButton" type="button">Reset Session</button></div>
        <div id="sessionSummary" class="session-summary" hidden></div>`;

    const sessionControls = document.querySelector(".session-controls");
    const firstCalculator = document.querySelector(".calculator-section");
    (sessionControls || firstCalculator)?.after(section);
}

function resetStats() {
    phase2State.maxSpeed = 0;
    phase2State.maxRpm = 0;
    phase2State.throttleTotal = 0;
    phase2State.samples = 0;
    phase2State.brakingEvents = 0;
    phase2State.previousBrake = 0;
    document.getElementById("sessionTopSpeed").textContent = "—";
    document.getElementById("sessionPeakRpm").textContent = "—";
    document.getElementById("sessionAverageThrottle").textContent = "—";
    document.getElementById("sessionBrakingEvents").textContent = "0";
    document.getElementById("currentSector").textContent = "—";
    document.getElementById("sessionSummary").hidden = true;
}

function updateDashboard() {
    const active = document.getElementById("sessionStatus")?.textContent?.trim() === "SESSION ACTIVE";
    const health = document.getElementById("sessionHealth");
    if (!health) return;

    health.textContent = active ? "LIVE" : "STANDBY";
    health.className = `session-health ${active ? "live" : "neutral"}`;
    if (!active) return;

    const speed = readNumber("speed");
    const rpm = readNumber("rpm");
    const throttle = readNumber("throttle");
    const brake = readNumber("brake");
    const sessionSeconds = readNumber("sessionTimer");

    phase2State.maxSpeed = Math.max(phase2State.maxSpeed, speed);
    phase2State.maxRpm = Math.max(phase2State.maxRpm, rpm);
    phase2State.throttleTotal += throttle;
    phase2State.samples += 1;
    if (brake >= 70 && phase2State.previousBrake < 70) phase2State.brakingEvents += 1;
    phase2State.previousBrake = brake;

    document.getElementById("sessionTopSpeed").textContent = `${Math.round(phase2State.maxSpeed)} km/h`;
    document.getElementById("sessionPeakRpm").textContent = `${Math.round(phase2State.maxRpm)} RPM`;
    document.getElementById("sessionAverageThrottle").textContent = `${Math.round(phase2State.throttleTotal / phase2State.samples)}%`;
    document.getElementById("sessionBrakingEvents").textContent = String(phase2State.brakingEvents);

    const seconds = Math.floor(sessionSeconds);
    const sector = (seconds % 60) < 20 ? 1 : (seconds % 60) < 40 ? 2 : 3;
    document.getElementById("currentSector").textContent = `Sector ${sector}`;
}

function resetSession() {
    const sessionButton = document.getElementById("sessionButton");
    const active = document.getElementById("sessionStatus")?.textContent?.trim() === "SESSION ACTIVE";

    if (active) {
        sessionButton?.click();
    } else if (sessionButton) {
        // Reuse the main session controller so its state, lap timing and chart are reset too.
        sessionButton.click();
        sessionButton.click();
    }

    resetStats();
    const summary = document.getElementById("sessionSummary");
    if (summary) {
        summary.hidden = false;
        summary.innerHTML = "<strong>Session reset.</strong><span>Start a new session to collect statistics.</span>";
    }
}

function init() {
    injectStyles();
    addPanel();
    resetStats();
    document.getElementById("resetSessionButton")?.addEventListener("click", resetSession);
    setInterval(updateDashboard, 500);
    updateDashboard();
}

document.addEventListener("DOMContentLoaded", init);
if (document.readyState !== "loading") init();
