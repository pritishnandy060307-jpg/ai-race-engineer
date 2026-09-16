import { raceState, resetRaceState } from "./state.js";
import { generateTelemetry } from "./telemetry.js";
import { updateTelemetryUI, updateSessionUI, setSessionStatus, resetSessionUI } from "./ui.js";

let sessionTimer = null;
let telemetryTimer = null;
let handledClick = false;

function clearTimers() {
    if (sessionTimer !== null) clearInterval(sessionTimer);
    if (telemetryTimer !== null) clearInterval(telemetryTimer);
    sessionTimer = null;
    telemetryTimer = null;
}

function startSession() {
    clearTimers();
    resetRaceState();
    raceState.session.active = true;
    raceState.session.status = "SESSION ACTIVE";
    resetSessionUI();
    setSessionStatus(true);

    sessionTimer = setInterval(() => {
        if (!raceState.session.active) return;
        raceState.session.elapsedSeconds = Number((raceState.session.elapsedSeconds + 0.1).toFixed(1));
        updateSessionUI(raceState);
    }, 100);

    telemetryTimer = setInterval(() => {
        if (!raceState.session.active) return;
        const telemetry = generateTelemetry(raceState.session.elapsedSeconds);
        raceState.telemetry = telemetry;
        updateTelemetryUI(telemetry);
    }, 500);
}

function endSession() {
    raceState.session.active = false;
    raceState.session.status = "OFFLINE";
    clearTimers();
    setSessionStatus(false);
}

function toggleSession(event) {
    event.preventDefault();
    event.stopImmediatePropagation();
    if (raceState.session.active) endSession();
    else startSession();
}

function installRepair() {
    const button = document.querySelector("#sessionButton");
    if (!button || button.dataset.sessionRepairInstalled === "true") return;
    button.dataset.sessionRepairInstalled = "true";
    button.addEventListener("click", toggleSession, true);
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", installRepair, { once: true });
} else {
    installRepair();
}
