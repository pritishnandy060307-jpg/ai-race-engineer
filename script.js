import { raceState, resetRaceState } from "./js/state.js";
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

const chartData = {
    labels: [],
    speed: []
};

const chart = new Chart(speedChartCanvas, {
    type: "line",
    data: {
        labels: chartData.labels,
        datasets: [{
            label: "Speed (km/h)",
            data: chartData.speed,
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
    if (raceState.session.active) {
        endSession();
    } else {
        startSession();
    }
}

function startSession() {
    resetRaceState();
    raceState.session.active = true;
    raceState.session.status = "SESSION ACTIVE";

    clearChartHistory();
    resetSessionUI();
    setSessionStatus(true);

    sessionTimer = setInterval(tickSession, 1000);
    telemetryTimer = setInterval(updateTelemetry, 500);
}

function endSession() {
    raceState.session.active = false;
    raceState.session.status = "OFFLINE";

    clearInterval(sessionTimer);
    clearInterval(telemetryTimer);
    sessionTimer = null;
    telemetryTimer = null;

    setSessionStatus(false);
}

function tickSession() {
    raceState.session.elapsedSeconds++;

    const lapSeconds = raceState.session.elapsedSeconds % 20;
    raceState.lap.currentTimeSeconds = lapSeconds;

    if (lapSeconds === 0 && raceState.session.elapsedSeconds > 0) {
        const completedLapTime = 20;

        if (
            raceState.lap.bestTimeSeconds === null ||
            completedLapTime < raceState.lap.bestTimeSeconds
        ) {
            raceState.lap.bestTimeSeconds = completedLapTime;
        }

        raceState.lap.number++;
    }

    if (raceState.lap.bestTimeSeconds !== null) {
        raceState.lap.deltaSeconds =
            lapSeconds - raceState.lap.bestTimeSeconds;
    } else {
        raceState.lap.deltaSeconds = null;
    }

    updateSessionUI(raceState);
}

function updateTelemetry() {
    const telemetry = generateTelemetry(raceState.session.elapsedSeconds);

    raceState.vehicle.speedKmh = telemetry.speed;
    raceState.vehicle.rpm = telemetry.rpm;
    raceState.vehicle.gear = telemetry.gear;
    raceState.vehicle.throttlePercent = telemetry.throttle;
    raceState.vehicle.brakePercent = telemetry.brake;

    raceState.telemetry.speed.push(telemetry.speed);
    raceState.telemetry.rpm.push(telemetry.rpm);
    raceState.telemetry.throttle.push(telemetry.throttle);
    raceState.telemetry.brake.push(telemetry.brake);
    raceState.telemetry.gear.push(telemetry.gear);
    raceState.telemetry.timestamps.push(raceState.session.elapsedSeconds + 0.5);

    updateTelemetryUI(raceState.vehicle);

    chartData.labels.push(
        (raceState.session.elapsedSeconds + 0.5).toFixed(1)
    );
    chartData.speed.push(telemetry.speed);

    if (chartData.labels.length > 60) {
        chartData.labels.shift();
        chartData.speed.shift();
    }

    chart.update();
}

function clearChartHistory() {
    chartData.labels.length = 0;
    chartData.speed.length = 0;
    chart.update();
}
