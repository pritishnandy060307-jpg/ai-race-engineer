import { raceState } from "./state.js";

let maxSpeed = 0;
let maxRpm = 0;
let speedSum = 0;
let samples = 0;
let previousActive = false;

function resetStats() {
    maxSpeed = 0;
    maxRpm = 0;
    speedSum = 0;
    samples = 0;
}

function updateStats() {
    const session = raceState.session;
    const vehicle = raceState.vehicle;

    if (!session.active) {
        if (previousActive) resetStats();
        previousActive = false;
        return;
    }

    previousActive = true;
    maxSpeed = Math.max(maxSpeed, vehicle.speedKmh || 0);
    maxRpm = Math.max(maxRpm, vehicle.rpm || 0);
    speedSum += vehicle.speedKmh || 0;
    samples += 1;
}

setInterval(updateStats, 500);
