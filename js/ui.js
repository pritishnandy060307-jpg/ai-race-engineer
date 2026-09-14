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

export function updateTelemetryUI(vehicle) {
    elements.speed.textContent = `${vehicle.speedKmh} km/h`;
    elements.rpm.textContent = vehicle.rpm;
    elements.gear.textContent = vehicle.gear;
    elements.throttle.textContent = `${vehicle.throttlePercent}%`;
    elements.brake.textContent = `${vehicle.brakePercent}%`;
}

export function updateSessionUI(state) {
    elements.lapNumber.textContent = state.lap.number;
    elements.lapTime.textContent = formatLapTime(state.lap.currentTimeSeconds);
    elements.bestLap.textContent = state.lap.bestTimeSeconds === null
        ? "--:--.---"
        : formatLapTime(state.lap.bestTimeSeconds);

    if (state.lap.deltaSeconds === null) {
        elements.lapDelta.textContent = "--.---";
    } else {
        const sign = state.lap.deltaSeconds >= 0 ? "+" : "";
        elements.lapDelta.textContent = `${sign}${state.lap.deltaSeconds.toFixed(3)} s`;
    }

    elements.sessionTimer.textContent = formatSessionTime(state.session.elapsedSeconds);
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

function formatLapTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const wholeSeconds = Math.floor(totalSeconds % 60);
    const milliseconds = Math.round((totalSeconds % 1) * 1000);

    return `${String(minutes).padStart(2, "0")}:${String(wholeSeconds).padStart(2, "0")}.${String(milliseconds).padStart(3, "0")}`;
}

function formatSessionTime(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);

    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
