import { raceState } from "./state.js";

const LAP_LENGTH_SECONDS = 20;
let lastElapsed = 0;
let completedLapCount = 0;
let bestLap = null;

function formatLapTime(seconds) {
    if (!Number.isFinite(seconds)) return "--:--.---";
    const minutes = Math.floor(seconds / 60);
    const remainder = seconds - minutes * 60;
    return `${String(minutes).padStart(2, "0")}:${remainder.toFixed(3).padStart(6, "0")}`;
}

function updateLapDisplay() {
    const lap = raceState.lap;
    const current = Math.max(0, raceState.session.elapsedSeconds - completedLapCount * LAP_LENGTH_SECONDS);
    lap.currentTimeSeconds = current;
    lap.number = completedLapCount + 1;
    lap.bestTimeSeconds = bestLap;
    lap.deltaSeconds = bestLap === null ? null : current - bestLap;

    document.querySelector("#lapNumber")?.replaceChildren(document.createTextNode(String(lap.number)));
    document.querySelector("#lapTime")?.replaceChildren(document.createTextNode(formatLapTime(current)));
    document.querySelector("#bestLap")?.replaceChildren(document.createTextNode(formatLapTime(bestLap)));
    const delta = document.querySelector("#lapDelta");
    if (delta) delta.textContent = lap.deltaSeconds === null ? "--.---" : `${lap.deltaSeconds >= 0 ? "+" : ""}${lap.deltaSeconds.toFixed(3)}`;
}

function resetTiming() {
    lastElapsed = 0;
    completedLapCount = 0;
    bestLap = null;
}

setInterval(() => {
    if (!raceState.session.active) {
        resetTiming();
        return;
    }

    const elapsed = raceState.session.elapsedSeconds;
    if (elapsed < lastElapsed) resetTiming();

    const completed = Math.floor(elapsed / LAP_LENGTH_SECONDS);
    if (completed > completedLapCount) {
        const lapTime = LAP_LENGTH_SECONDS;
        raceState.lap.completedTimes.push(lapTime);
        bestLap = bestLap === null ? lapTime : Math.min(bestLap, lapTime);
        completedLapCount = completed;
    }

    lastElapsed = elapsed;
    updateLapDisplay();
}, 100);

updateLapDisplay();
