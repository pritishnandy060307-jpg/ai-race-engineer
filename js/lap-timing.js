import { raceState } from "./state.js";

// Simulated track model: lap completion is driven by virtual start/finish
// crossings rather than by resetting the clock every fixed 20 seconds.
const SIMULATED_LAP_LENGTHS = [20.0, 19.6, 20.3, 19.8];
const SECTOR_COUNT = 3;
let lastElapsed = 0;
let lapStartElapsed = 0;
let nextCrossingElapsed = SIMULATED_LAP_LENGTHS[0];
let completedLapCount = 0;
let bestLap = null;
let wasActive = false;

function formatLapTime(seconds) {
    if (!Number.isFinite(seconds)) return "--:--.---";
    const minutes = Math.floor(seconds / 60);
    const remainder = seconds - minutes * 60;
    return `${String(minutes).padStart(2, "0")}:${remainder.toFixed(3).padStart(6, "0")}`;
}

function updateLapDisplay() {
    const lap = raceState.lap;
    const current = Math.max(0, raceState.session.elapsedSeconds - lapStartElapsed);
    lap.currentTimeSeconds = current;
    lap.number = completedLapCount + 1;
    lap.bestTimeSeconds = bestLap;
    lap.deltaSeconds = bestLap === null ? null : current - bestLap;

    document.querySelector("#lapNumber")?.replaceChildren(document.createTextNode(String(lap.number)));
    document.querySelector("#lapTime")?.replaceChildren(document.createTextNode(formatLapTime(current)));
    document.querySelector("#bestLap")?.replaceChildren(document.createTextNode(formatLapTime(bestLap)));
    const delta = document.querySelector("#lapDelta");
    if (delta) delta.textContent = lap.deltaSeconds === null ? "--.---" : `${lap.deltaSeconds >= 0 ? "+" : ""}${lap.deltaSeconds.toFixed(3)} s`;

    const lapDuration = SIMULATED_LAP_LENGTHS[completedLapCount % SIMULATED_LAP_LENGTHS.length];
    const progress = lapDuration > 0 ? current / lapDuration : 0;
    const sector = Math.min(SECTOR_COUNT, Math.floor(progress * SECTOR_COUNT) + 1);
    document.querySelectorAll("[data-current-sector], #currentSector").forEach(element => {
        element.textContent = `Sector ${sector}`;
    });
}

function resetTiming(clearHistory = false) {
    lastElapsed = 0;
    lapStartElapsed = 0;
    nextCrossingElapsed = SIMULATED_LAP_LENGTHS[0];
    completedLapCount = 0;
    bestLap = null;
    if (clearHistory) raceState.lap.completedTimes.length = 0;
}

setInterval(() => {
    const active = Boolean(raceState.session.active);
    if (!active) {
        // Preserve completed laps after stopping so the analysis panel can
        // be reviewed. A new start calls resetRaceState() in script.js.
        if (wasActive) updateLapDisplay();
        wasActive = false;
        return;
    }

    if (!wasActive && raceState.session.elapsedSeconds === 0) resetTiming(true);
    wasActive = true;

    const elapsed = Number(raceState.session.elapsedSeconds) || 0;
    if (elapsed < lastElapsed) resetTiming(true);

    while (elapsed >= nextCrossingElapsed) {
        const lapTime = nextCrossingElapsed - lapStartElapsed;
        if (lapTime > 0) {
            raceState.lap.completedTimes.push(Number(lapTime.toFixed(3)));
            bestLap = bestLap === null ? lapTime : Math.min(bestLap, lapTime);
        }

        completedLapCount += 1;
        lapStartElapsed = nextCrossingElapsed;
        nextCrossingElapsed += SIMULATED_LAP_LENGTHS[completedLapCount % SIMULATED_LAP_LENGTHS.length];
    }

    lastElapsed = elapsed;
    updateLapDisplay();
}, 100);

updateLapDisplay();
