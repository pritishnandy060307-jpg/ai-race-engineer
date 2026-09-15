import { raceState, resetRaceState } from "./js/state.js";
import { generateTelemetry } from "./js/telemetry.js";
import { calculateVehicleSpeed, calculateInflationLayer, calculateInletTurbulence, calculateParticleSettling, calculateHumidity } from "./js/calculators.js";
import { updateTelemetryUI, updateSessionUI, setSessionStatus, resetSessionUI } from "./js/ui.js";

const button = document.querySelector("#sessionButton");
const speedChartCanvas = document.querySelector("#speedChart");
const calculateGearButton = document.querySelector("#calculateGearButton");
const calculateInflationButton = document.querySelector("#calculateInflationButton");
const calculateTurbulenceButton = document.querySelector("#calculateTurbulenceButton");
const calculateParticleButton = document.querySelector("#calculateParticleButton");
const calculateHumidityButton = document.querySelector("#calculateHumidityButton");

let sessionTimer = null;
let telemetryTimer = null;
const chartData = { labels: [], speed: [] };

const chart = new Chart(speedChartCanvas, {
    type: "line",
    data: { labels: chartData.labels, datasets: [{ label: "Speed (km/h)", data: chartData.speed, borderWidth: 2, tension: 0.25, pointRadius: 0 }] },
    options: {
        responsive: true, maintainAspectRatio: false, animation: false,
        scales: {
            x: { title: { display: true, text: "Time (s)" } },
            y: { title: { display: true, text: "Speed (km/h)" }, beginAtZero: true }
        }
    }
});

button.addEventListener("click", toggleSession);
calculateGearButton.addEventListener("click", calculateGear);
calculateInflationButton.addEventListener("click", calculateInflation);
calculateTurbulenceButton.addEventListener("click", calculateTurbulence);
calculateParticleButton.addEventListener("click", calculateParticle);
calculateHumidityButton.addEventListener("click", calculateHumidityTool);

function value(id) { return Number.parseFloat(document.querySelector(`#${id}`).value); }
function show(id, text) { document.querySelector(`#${id}`).textContent = text; }
function error(id, text) { show(id, text); }
function fmt(x, digits = 4) { return Number.isFinite(x) ? x.toFixed(digits) : "—"; }

function calculateGear() {
    const engineRpm = value("engineRpmInput"), gearRatio = value("gearRatioInput"), finalDriveRatio = value("finalDriveInput"), tyreDiameterM = value("tyreDiameterInput");
    if (![engineRpm, gearRatio, finalDriveRatio, tyreDiameterM].every(Number.isFinite) || engineRpm < 0 || gearRatio <= 0 || finalDriveRatio <= 0 || tyreDiameterM <= 0) {
        error("calculatorError", "Please enter valid positive values."); return;
    }
    const wheelRpm = engineRpm / (gearRatio * finalDriveRatio);
    const vehicleSpeed = calculateVehicleSpeed({ engineRpm, gearRatio, finalDriveRatio, tyreDiameterM });
    show("wheelRpmResult", `${wheelRpm.toFixed(0)} rpm`);
    show("vehicleSpeedResult", `${vehicleSpeed.toFixed(1)} km/h`);
    error("calculatorError", "");
}

function calculateInflation() {
    const result = calculateInflationLayer({ velocity: value("inflVelocity"), lengthScale: value("inflLength"), viscosity: value("inflViscosity"), density: value("inflDensity"), targetYPlus: value("inflYPlus"), layers: value("inflLayers") });
    if (!result) { error("inflError", "Enter valid positive values; layers must be at least 2."); return; }
    error("inflError", "");
    show("inflFirst", result.firstLayer.toExponential(4));
    show("inflFinal", result.finalLayer.toExponential(4));
    show("inflDelta", result.delta99.toExponential(4));
    show("inflGrowth", fmt(result.growthRatio, 4));
}

function calculateTurbulence() {
    const result = calculateInletTurbulence({ velocity: value("turbVelocity"), intensityPercent: value("turbIntensity"), lengthScale: value("turbLength") });
    if (!result) { error("turbError", "Enter valid velocity, intensity and length scale."); return; }
    error("turbError", "");
    show("turbK", result.k.toExponential(4));
    show("turbOmega", result.omega.toExponential(4));
    show("turbEpsilon", result.epsilon.toExponential(4));
    show("turbNu", result.turbulentViscosity.toExponential(4));
}

function calculateParticle() {
    const fluid = document.querySelector("#particleFluid").value;
    const properties = fluid === "air" ? { density: 1.225, viscosity: 1.81e-5 } : { density: 998, viscosity: 1.002e-3 };
    const result = calculateParticleSettling({ diameter: value("particleDiameter"), particleDensity: value("particleDensity"), fluidDensity: properties.density, fluidViscosity: properties.viscosity });
    if (!result) { error("particleError", "Particle density must exceed fluid density and all values must be valid."); return; }
    error("particleError", "");
    show("particleRe", fmt(result.reynolds, 4));
    show("particleCd", fmt(result.dragCoefficient, 4));
    show("particleVelocity", result.velocity.toExponential(4));
}

function calculateHumidityTool() {
    const result = calculateHumidity({ temperatureC: value("humidityTemp"), pressurePa: value("humidityPressure"), relativeHumidity: value("humidityRH") });
    if (!result) { error("humidityError", "Enter valid pressure and relative humidity (0–1); vapour pressure must be below total pressure."); return; }
    error("humidityError", "");
    show("humiditySpecific", result.specificHumidity.toExponential(4));
    show("humidityAbsolute", result.absoluteHumidity.toExponential(4));
    show("humidityMassFraction", result.absoluteHumidity.toExponential(4));
}

function toggleSession() { if (raceState.session.active) endSession(); else startSession(); }

function startSession() {
    resetRaceState(); raceState.session.active = true; raceState.session.status = "SESSION ACTIVE";
    clearChartHistory(); resetSessionUI(); setSessionStatus(true);
    sessionTimer = setInterval(tickSession, 100); telemetryTimer = setInterval(updateTelemetry, 500);
}

function endSession() {
    raceState.session.active = false; raceState.session.status = "OFFLINE";
    clearInterval(sessionTimer); clearInterval(telemetryTimer); sessionTimer = null; telemetryTimer = null; setSessionStatus(false);
}

function tickSession() {
    raceState.session.elapsedSeconds = Number((raceState.session.elapsedSeconds + 0.1).toFixed(1));
    raceState.lap.currentTimeSeconds = Number((raceState.lap.currentTimeSeconds + 0.1).toFixed(1));
    if (raceState.lap.currentTimeSeconds >= raceState.lap.targetTimeSeconds) completeLap();
    updateLapDelta(); updateSessionUI(raceState);
}

function completeLap() {
    const completedLapTime = raceState.lap.currentTimeSeconds;
    raceState.lap.completedTimes.push(completedLapTime);
    if (raceState.lap.bestTimeSeconds === null || completedLapTime < raceState.lap.bestTimeSeconds) raceState.lap.bestTimeSeconds = completedLapTime;
    raceState.lap.number++; raceState.lap.currentTimeSeconds = 0;
    const lapVariation = [0.0, -0.8, 1.2, -0.4, 0.6];
    const variation = lapVariation[(raceState.lap.number - 1) % lapVariation.length];
    raceState.lap.targetTimeSeconds = 20 + variation;
}

function updateLapDelta() {
    if (raceState.lap.bestTimeSeconds === null) { raceState.lap.deltaSeconds = null; return; }
    raceState.lap.deltaSeconds = Number((raceState.lap.currentTimeSeconds - raceState.lap.bestTimeSeconds).toFixed(1));
}

function updateTelemetry() {
    const telemetry = generateTelemetry(raceState.session.elapsedSeconds);
    raceState.vehicle.speedKmh = telemetry.speed; raceState.vehicle.rpm = telemetry.rpm; raceState.vehicle.gear = telemetry.gear; raceState.vehicle.throttlePercent = telemetry.throttle; raceState.vehicle.brakePercent = telemetry.brake;
    raceState.telemetry.speed.push(telemetry.speed); raceState.telemetry.rpm.push(telemetry.rpm); raceState.telemetry.throttle.push(telemetry.throttle); raceState.telemetry.brake.push(telemetry.brake); raceState.telemetry.gear.push(telemetry.gear); raceState.telemetry.timestamps.push(raceState.session.elapsedSeconds);
    updateTelemetryUI(raceState.vehicle);
    chartData.labels.push(raceState.session.elapsedSeconds.toFixed(1)); chartData.speed.push(telemetry.speed);
    if (chartData.labels.length > 60) { chartData.labels.shift(); chartData.speed.shift(); }
    chart.update();
}

function clearChartHistory() { chartData.labels.length = 0; chartData.speed.length = 0; chart.update(); }
