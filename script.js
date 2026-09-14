import { raceState } from "./js/state.js";
import { generateTelemetry } from "./js/telemetry.js";
import {
    updateTelemetryUI,
    updateSessionUI,
    setSessionStatus,
    resetSessionUI
} from "./js/ui.js";

const button = document.querySelector("#sessionButton");
const speedChartCanvas = document.querySelector("#speedChart");

let sessionTimer = null;
let telemetryTimer = null;

const speedData = [];
const speedLabels = [];

const chart = new Chart(speedChartCanvas, {
    type: "line",
    data: {
        labels: speedLabels,
        datasets: [{
            label: "Speed (km/h)",
            data: speedData,
            borderWidth: 2,
            tension: 0.25,
            pointRadius: 0
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        scales: {
            x: {
                title: { display: true, text: "Time (s)" }
            },
            y: {
                title: { display: true, text: "Speed (km/h)" },
                beginAtZero: true
            }
        }
    }
});

button.addEventListener("click", toggleSession);

function toggleSession() {
    if (raceState.sessionActive) {
        endSession();
    } else {
        startSession();
    }
}

function startSession() {
    raceState.sessionActive = true;
    raceState.sessionSeconds = 0;
    raceState.lapNumber = 1;
    raceState.bestLap = null;

    clearTelemetryHistory();
    resetSessionUI();
    setSessionStatus(true);

    sessionTimer = setInterval(tickSession, 1000);
    telemetryTimer = setInterval(updateTelemetry, 500);
}

function endSession() {
    raceState.sessionActive = false;

    clearInterval(sessionTimer);
    clearInterval(telemetryTimer);
    sessionTimer = null;
    telemetryTimer = null;

    setSessionStatus(false);
}

function tickSession() {
    raceState.sessionSeconds++;

    const lapSeconds = raceState.sessionSeconds % 20;

    if (lapSeconds === 0) {
        const completedLapTime = 20;

        if (raceState.bestLap === null || completedLapTime < raceState.bestLap) {
            raceState.bestLap = completedLapTime;
        }

        raceState.lapNumber++;
    }

    updateSessionUI(raceState);
}

function updateTelemetry() {
    raceState.telemetry = generateTelemetry(raceState.sessionSeconds);
    updateTelemetryUI(raceState.telemetry);

    speedLabels.push((raceState.sessionSeconds + 0.5).toFixed(1));
    speedData.push(raceState.telemetry.speed);

    if (speedLabels.length > 60) {
        speedLabels.shift();
        speedData.shift();
    }

    chart.update();
}

function clearTelemetryHistory() {
    speedLabels.length = 0;
    speedData.length = 0;
    chart.update();
}
