const elements = {
    speed: document.querySelector("#speed"),
    rpm: document.querySelector("#rpm"),
    gear: document.querySelector("#gear"),
    throttle: document.querySelector("#throttle"),
    brake: document.querySelector("#brake"),
    lapNumber: document.querySelector("#lapNumber"),
    lapTime: document.querySelector("#lapTime"),
    bestLap: document.querySelector("#bestLap"),
    lapDelta: document.querySelector("#lapDelta"),
    sessionTimer: document.querySelector("#sessionTimer"),
    sessionStatus: document.querySelector("#sessionStatus"),
    statusDot: document.querySelector(".status-dot"),
    sessionButton: document.querySelector("#sessionButton")
};

export function updateTelemetryUI(telemetry) {
    elements.speed.textContent = `${telemetry.speed} km/h`;
    elements.rpm.textContent = telemetry.rpm;
    elements.gear.textContent = telemetry.gear;
    elements.throttle.textContent = `${telemetry.throttle}%`;
    elements.brake.textContent = `${telemetry.brake}%`;
}

export function updateSessionUI(state) {
    elements.lapNumber.textContent = state.lapNumber;
    elements.bestLap.textContent = state.bestLap === null ? "--:--.---" : "00:20.000";

    const lapSeconds = state.sessionSeconds % 20;
    const minutes = Math.floor(lapSeconds / 60);
    const seconds = lapSeconds % 60;

    elements.lapTime.textContent =
        `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.000`;

    if (state.bestLap !== null) {
        const delta = lapSeconds - state.bestLap;
        elements.lapDelta.textContent = `${delta >= 0 ? "+" : ""}${delta.toFixed(3)} s`;
    } else {
        elements.lapDelta.textContent = "--.---";
    }

    const hours = Math.floor(state.sessionSeconds / 3600);
    const mins = Math.floor((state.sessionSeconds % 3600) / 60);
    const secs = state.sessionSeconds % 60;

    elements.sessionTimer.textContent =
        `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function setSessionStatus(active) {
    elements.sessionStatus.textContent = active ? "SESSION ACTIVE" : "OFFLINE";
    elements.statusDot.style.background = active ? "#22c55e" : "#6b7280";
    elements.sessionButton.textContent = active ? "End Session" : "Start Session";
}

export function resetSessionUI() {
    elements.lapNumber.textContent = "1";
    elements.lapTime.textContent = "00:00.000";
    elements.bestLap.textContent = "--:--.---";
    elements.lapDelta.textContent = "--.---";
    elements.sessionTimer.textContent = "00:00:00";
}
