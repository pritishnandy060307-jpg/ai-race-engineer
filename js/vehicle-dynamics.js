function readNumber(id) {
    const element = document.querySelector(`#${id}`);
    return element ? Number.parseFloat(element.value) : NaN;
}

function showResult(id, text) {
    const element = document.querySelector(`#${id}`);
    if (element) element.textContent = text;
}

function calculatePowerToWeight({ mass, powerKw }) {
    if (![mass, powerKw].every(Number.isFinite) || mass <= 0 || powerKw <= 0) return null;
    const powerToWeightKwPerTonne = powerKw / (mass / 1000);
    const powerToWeightHpPerTonne = powerToWeightKwPerTonne * 1.34102209;
    const powerPerKg = powerKw * 1000 / mass;
    return { powerToWeightKwPerTonne, powerToWeightHpPerTonne, powerPerKg };
}

function calculateAcceleration({ mass, powerKw, speedKmh, drivetrainEfficiency, dragCoefficient, frontalArea, rollingResistance }) {
    if (![mass, powerKw, speedKmh, drivetrainEfficiency, dragCoefficient, frontalArea, rollingResistance].every(Number.isFinite) || mass <= 0 || powerKw <= 0 || speedKmh <= 0 || drivetrainEfficiency <= 0 || drivetrainEfficiency > 1 || dragCoefficient < 0 || frontalArea <= 0 || rollingResistance < 0) return null;
    const g = 9.81;
    const speedMs = speedKmh / 3.6;
    const drivePowerW = powerKw * 1000 * drivetrainEfficiency;
    const driveForce = drivePowerW / speedMs;
    const airDensity = 1.225;
    const dragForce = 0.5 * airDensity * dragCoefficient * frontalArea * speedMs * speedMs;
    const rollingForce = rollingResistance * mass * g;
    const netForce = driveForce - dragForce - rollingForce;
    const acceleration = netForce / mass;
    return { speedMs, driveForce, dragForce, rollingForce, netForce, acceleration, accelerationG: acceleration / g };
}

function calculateLapTime({ distanceKm, averageSpeedKmh }) {
    if (![distanceKm, averageSpeedKmh].every(Number.isFinite) || distanceKm <= 0 || averageSpeedKmh <= 0) return null;
    const timeHours = distanceKm / averageSpeedKmh;
    const timeSeconds = timeHours * 3600;
    const minutes = Math.floor(timeSeconds / 60);
    const seconds = timeSeconds - minutes * 60;
    return { timeSeconds, minutes, seconds };
}

function calculateLapDelta({ referenceLapSeconds, currentLapSeconds }) {
    if (![referenceLapSeconds, currentLapSeconds].every(Number.isFinite) || referenceLapSeconds <= 0 || currentLapSeconds <= 0) return null;
    const deltaSeconds = currentLapSeconds - referenceLapSeconds;
    const deltaPercent = deltaSeconds / referenceLapSeconds * 100;
    return { deltaSeconds, deltaPercent };
}

function addSection(section) {
    document.querySelector("main")?.appendChild(section);
}

function buildVehicleDynamicsTools() {
    if (document.querySelector("#powerToWeightSection")) return;

    const powerToWeight = document.createElement("section");
    powerToWeight.id = "powerToWeightSection";
    powerToWeight.className = "calculator-section";
    powerToWeight.setAttribute("aria-label", "Power-to-weight calculator");
    powerToWeight.innerHTML = `<h2>Power-to-Weight Calculator</h2><p class="calculator-description">Compare engine power with vehicle mass using kW/tonne, hp/tonne and W/kg.</p><div class="calculator-grid"><label>Vehicle Mass (kg)<input id="ptwMass" type="number" min="1" step="1" value="250"></label><label>Power (kW)<input id="ptwPower" type="number" min="0.1" step="1" value="60"></label></div><button id="calculatePowerToWeightButton" type="button">Calculate</button><div class="calculator-results calculator-results-3"><div class="result-card"><span>Power-to-Weight (kW/t)</span><strong id="ptwKwT">—</strong></div><div class="result-card"><span>Power-to-Weight (hp/t)</span><strong id="ptwHpT">—</strong></div><div class="result-card"><span>Specific Power (W/kg)</span><strong id="ptwWKg">—</strong></div></div><p id="ptwError" class="calculator-error" aria-live="polite"></p>`;
    addSection(powerToWeight);

    const acceleration = document.createElement("section");
    acceleration.id = "accelerationSection";
    acceleration.className = "calculator-section";
    acceleration.setAttribute("aria-label", "Acceleration calculator");
    acceleration.innerHTML = `<h2>Acceleration Calculator</h2><p class="calculator-description">Estimate instantaneous longitudinal acceleration from available power, aerodynamic drag and rolling resistance.</p><div class="calculator-grid"><label>Vehicle Mass (kg)<input id="accMass" type="number" min="1" step="1" value="250"></label><label>Power (kW)<input id="accPower" type="number" min="0.1" step="1" value="60"></label><label>Vehicle Speed (km/h)<input id="accSpeed" type="number" min="0.1" step="1" value="100"></label><label>Drivetrain Efficiency (%)<input id="accEfficiency" type="number" min="1" max="100" step="1" value="90"></label><label>Drag Coefficient C<sub>D</sub><input id="accCd" type="number" min="0" step="0.01" value="0.80"></label><label>Frontal Area (m²)<input id="accArea" type="number" min="0.01" step="0.01" value="1.20"></label><label>Rolling Resistance Coefficient<input id="accCr" type="number" min="0" step="0.001" value="0.015"></label></div><button id="calculateAccelerationButton" type="button">Calculate</button><div class="calculator-results calculator-results-4"><div class="result-card"><span>Drive Force</span><strong id="accDriveForce">—</strong></div><div class="result-card"><span>Drag Force</span><strong id="accDragForce">—</strong></div><div class="result-card"><span>Rolling Force</span><strong id="accRollingForce">—</strong></div><div class="result-card"><span>Acceleration</span><strong id="accAcceleration">—</strong></div></div><p id="accError" class="calculator-error" aria-live="polite"></p>`;
    addSection(acceleration);

    const lapTime = document.createElement("section");
    lapTime.id = "lapTimeSection";
    lapTime.className = "calculator-section";
    lapTime.setAttribute("aria-label", "Lap time calculator");
    lapTime.innerHTML = `<h2>Lap Time Calculator</h2><p class="calculator-description">Estimate lap time from circuit distance and average vehicle speed.</p><div class="calculator-grid"><label>Track Length (km)<input id="lapDistance" type="number" min="0.01" step="0.01" value="3.00"></label><label>Average Speed (km/h)<input id="lapAverageSpeed" type="number" min="0.1" step="1" value="90"></label></div><button id="calculateLapTimeButton" type="button">Calculate</button><div class="calculator-results calculator-results-2"><div class="result-card"><span>Lap Time</span><strong id="lapTimeResult">—</strong></div><div class="result-card"><span>Total Time (s)</span><strong id="lapTimeSeconds">—</strong></div></div><p id="lapTimeError" class="calculator-error" aria-live="polite"></p>`;
    addSection(lapTime);

    const lapDelta = document.createElement("section");
    lapDelta.id = "lapDeltaSection";
    lapDelta.className = "calculator-section";
    lapDelta.setAttribute("aria-label", "Lap delta calculator");
    lapDelta.innerHTML = `<h2>Lap Delta Calculator</h2><p class="calculator-description">Compare a current lap against a reference lap. Positive delta means the current lap is slower; negative means it is faster.</p><div class="calculator-grid"><label>Reference Lap (s)<input id="deltaReference" type="number" min="0.001" step="0.001" value="90.000"></label><label>Current Lap (s)<input id="deltaCurrent" type="number" min="0.001" step="0.001" value="91.250"></label></div><button id="calculateLapDeltaButton" type="button">Calculate</button><div class="calculator-results calculator-results-2"><div class="result-card"><span>Delta</span><strong id="deltaResult">—</strong></div><div class="result-card"><span>Delta (%)</span><strong id="deltaPercent">—</strong></div></div><p id="deltaError" class="calculator-error" aria-live="polite"></p>`;
    addSection(lapDelta);

    document.querySelector("#calculatePowerToWeightButton")?.addEventListener("click", () => {
        const result = calculatePowerToWeight({ mass: readNumber("ptwMass"), powerKw: readNumber("ptwPower") });
        if (!result) { showResult("ptwError", "Enter a positive vehicle mass and power."); return; }
        showResult("ptwError", "");
        showResult("ptwKwT", `${result.powerToWeightKwPerTonne.toFixed(1)} kW/t`);
        showResult("ptwHpT", `${result.powerToWeightHpPerTonne.toFixed(1)} hp/t`);
        showResult("ptwWKg", `${result.powerPerKg.toFixed(1)} W/kg`);
    });

    document.querySelector("#calculateAccelerationButton")?.addEventListener("click", () => {
        const result = calculateAcceleration({ mass: readNumber("accMass"), powerKw: readNumber("accPower"), speedKmh: readNumber("accSpeed"), drivetrainEfficiency: readNumber("accEfficiency") / 100, dragCoefficient: readNumber("accCd"), frontalArea: readNumber("accArea"), rollingResistance: readNumber("accCr") });
        if (!result) { showResult("accError", "Enter valid positive values. Speed must be above 0 km/h."); return; }
        showResult("accError", "");
        showResult("accDriveForce", `${result.driveForce.toFixed(1)} N`);
        showResult("accDragForce", `${result.dragForce.toFixed(1)} N`);
        showResult("accRollingForce", `${result.rollingForce.toFixed(1)} N`);
        showResult("accAcceleration", `${result.acceleration.toFixed(2)} m/s² (${result.accelerationG.toFixed(2)} g)`);
    });

    document.querySelector("#calculateLapTimeButton")?.addEventListener("click", () => {
        const result = calculateLapTime({ distanceKm: readNumber("lapDistance"), averageSpeedKmh: readNumber("lapAverageSpeed") });
        if (!result) { showResult("lapTimeError", "Enter a positive track length and average speed."); return; }
        showResult("lapTimeError", "");
        showResult("lapTimeResult", `${String(result.minutes).padStart(2, "0")}:${result.seconds.toFixed(3).padStart(6, "0")}`);
        showResult("lapTimeSeconds", `${result.timeSeconds.toFixed(3)} s`);
    });

    document.querySelector("#calculateLapDeltaButton")?.addEventListener("click", () => {
        const result = calculateLapDelta({ referenceLapSeconds: readNumber("deltaReference"), currentLapSeconds: readNumber("deltaCurrent") });
        if (!result) { showResult("deltaError", "Enter positive reference and current lap times."); return; }
        showResult("deltaError", "");
        const sign = result.deltaSeconds > 0 ? "+" : "";
        showResult("deltaResult", `${sign}${result.deltaSeconds.toFixed(3)} s`);
        showResult("deltaPercent", `${sign}${result.deltaPercent.toFixed(2)}%`);
    });
}

buildVehicleDynamicsTools();
