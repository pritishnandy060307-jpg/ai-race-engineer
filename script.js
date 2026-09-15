import { raceState, resetRaceState } from "./js/state.js";
import { generateTelemetry } from "./js/telemetry.js";
import { calculateVehicleSpeed } from "./js/calculators.js";
import {
    updateTelemetryUI,
    updateSessionUI,
    setSessionStatus,
    resetSessionUI
} from "./js/ui.js";

const button = document.querySelector("#sessionButton");
const speedChartCanvas = document.querySelector("#speedChart");
const calculateGearButton = document.querySelector("#calculateGearButton");

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
calculateGearButton.addEventListener("click", calculateGear);

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

    // 100 ms gives lap timing millisecond precision while keeping the UI smooth.
    sessionTimer = setInterval(tickSession, 100);
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
    raceState.session.elapsedSeconds = Number(
        (raceState.session.elapsedSeconds + 0.1).toFixed(1)
    );

    raceState.lap.currentTimeSeconds = Number(
        (raceState.lap.currentTimeSeconds + 0.1).toFixed(1)
    );

    // Simulated track: each lap has a slightly different target time.
    // This lets Best Lap and Delta behave like a real timing system.
    if (raceState.lap.currentTimeSeconds >= raceState.lap.targetTimeSeconds) {
        completeLap();
    }

    updateLapDelta();
    updateSessionUI(raceState);
}

function completeLap() {
    const completedLapTime = raceState.lap.currentTimeSeconds;

    raceState.lap.completedTimes.push(completedLapTime);

    if (
        raceState.lap.bestTimeSeconds === null ||
        completedLapTime < raceState.lap.bestTimeSeconds
    ) {
        raceState.lap.bestTimeSeconds = completedLapTime;
    }

    raceState.lap.number++;
    raceState.lap.currentTimeSeconds = 0;

    // Deterministic variation for the simulated driver/track.
    const lapVariation = [0.0, -0.8, 1.2, -0.4, 0.6];
    const variation = lapVariation[(raceState.lap.number - 1) % lapVariation.length];
    raceState.lap.targetTimeSeconds = 20 + variation;
}

function updateLapDelta() {
    if (raceState.lap.bestTimeSeconds === null) {
        raceState.lap.deltaSeconds = null;
        return;
    }

    // Positive = currently slower than the best lap.
    raceState.lap.deltaSeconds = Number(
        (raceState.lap.currentTimeSeconds - raceState.lap.bestTimeSeconds).toFixed(1)
    );
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
    raceState.telemetry.timestamps.push(raceState.session.elapsedSeconds);

    updateTelemetryUI(raceState.vehicle);

    chartData.labels.push(raceState.session.elapsedSeconds.toFixed(1));
    chartData.speed.push(telemetry.speed);

    if (chartData.labels.length > 60) {
        chartData.labels.shift();
        chartData.speed.shift();
    }

    chart.update();
}

function calculateGear() {
    const engineRpm = Number(document.querySelector("#engineRpmInput").value);
    const gearRatio = Number(document.querySelector("#gearRatioInput").value);
    const finalDriveRatio = Number(document.querySelector("#finalDriveInput").value);
    const tyreDiameterM = Number(document.querySelector("#tyreDiameterInput").value);

    const errorElement = document.querySelector("#calculatorError");

    if (![engineRpm, gearRatio, finalDriveRatio, tyreDiameterM].every(Number.isFinite) ||
        engineRpm < 0 || gearRatio <= 0 || finalDriveRatio <= 0 || tyreDiameterM <= 0) {
        errorElement.textContent = "Please enter valid positive values.";
        return;
    }

    const wheelRpm = engineRpm / (gearRatio * finalDriveRatio);
    const vehicleSpeed = calculateVehicleSpeed({
        engineRpm,
        gearRatio,
        finalDriveRatio,
        tyreDiameterM
    });

    document.querySelector("#wheelRpmResult").textContent = `${wheelRpm.toFixed(0)} rpm`;
    document.querySelector("#vehicleSpeedResult").textContent = `${vehicleSpeed.toFixed(1)} km/h`;
    errorElement.textContent = "";
}

function clearChartHistory() {
    chartData.labels.length = 0;
    chartData.speed.length = 0;
    chart.update();
}
