function num(id) {
    const el = document.querySelector(`#${id}`);
    return el ? Number.parseFloat(el.value) : NaN;
}

function out(id, text) {
    const el = document.querySelector(`#${id}`);
    if (el) el.textContent = text;
}

function addSuspensionSection(section) {
    section.className = "calculator-section";
    document.querySelector("main")?.appendChild(section);
}

function buildSuspensionTools() {
    if (document.querySelector("#springRateSection")) return;

    const spring = document.createElement("section");
    spring.id = "springRateSection";
    spring.setAttribute("aria-label", "Suspension — Spring rate calculator");
    spring.innerHTML = `<h2>Spring Rate Calculator</h2><p class="calculator-description">Calculate wheel rate and required spring rate from the suspension motion ratio. Motion ratio is wheel travel divided by spring travel.</p><div class="calculator-grid"><label>Spring Rate (N/mm)<input id="springRate" type="number" min="0.01" step="0.1" value="50"></label><label>Motion Ratio (wheel/spring)<input id="springMotionRatio" type="number" min="0.01" step="0.01" value="0.80"></label></div><button id="calculateSpringRateButton" type="button">Calculate</button><div class="calculator-results calculator-results-2"><div class="result-card"><span>Wheel Rate</span><strong id="springWheelRate">—</strong></div><div class="result-card"><span>Wheel Rate (N/m)</span><strong id="springWheelRateNm">—</strong></div></div><p id="springError" class="calculator-error" aria-live="polite"></p>`;
    addSuspensionSection(spring);

    const wheel = document.createElement("section");
    wheel.id = "wheelRateSection";
    wheel.setAttribute("aria-label", "Suspension — Wheel rate calculator");
    wheel.innerHTML = `<h2>Wheel Rate Calculator</h2><p class="calculator-description">Calculate effective wheel rate from spring rate and motion ratio.</p><div class="calculator-grid"><label>Spring Rate (N/mm)<input id="wheelSpringRate" type="number" min="0.01" step="0.1" value="50"></label><label>Motion Ratio (wheel/spring)<input id="wheelMotionRatio" type="number" min="0.01" step="0.01" value="0.80"></label></div><button id="calculateWheelRateButton" type="button">Calculate</button><div class="calculator-results calculator-results-2"><div class="result-card"><span>Wheel Rate</span><strong id="wheelRateResult">—</strong></div><div class="result-card"><span>Wheel Rate (N/m)</span><strong id="wheelRateNm">—</strong></div></div><p id="wheelError" class="calculator-error" aria-live="polite"></p>`;
    addSuspensionSection(wheel);

    const ride = document.createElement("section");
    ride.id = "rideFrequencySection";
    ride.setAttribute("aria-label", "Suspension — Ride frequency calculator");
    ride.innerHTML = `<h2>Ride Frequency Calculator</h2><p class="calculator-description">Estimate natural ride frequency from wheel rate and sprung mass supported by the wheel.</p><div class="calculator-grid"><label>Wheel Rate (N/mm)<input id="rideWheelRate" type="number" min="0.01" step="0.1" value="40"></label><label>Sprung Mass per Wheel (kg)<input id="rideSprungMass" type="number" min="0.1" step="1" value="60"></label></div><button id="calculateRideFrequencyButton" type="button">Calculate</button><div class="calculator-results calculator-results-2"><div class="result-card"><span>Natural Frequency</span><strong id="rideFrequency">—</strong></div><div class="result-card"><span>Angular Frequency</span><strong id="rideOmega">—</strong></div></div><p id="rideError" class="calculator-error" aria-live="polite"></p>`;
    addSuspensionSection(ride);

    const damper = document.createElement("section");
    damper.id = "damperSection";
    damper.setAttribute("aria-label", "Suspension — Damper calculator");
    damper.innerHTML = `<h2>Damper Calculator</h2><p class="calculator-description">Estimate the critical damping coefficient and a target damping coefficient from wheel rate, sprung mass and damping ratio.</p><div class="calculator-grid"><label>Wheel Rate (N/mm)<input id="damperWheelRate" type="number" min="0.01" step="0.1" value="40"></label><label>Sprung Mass per Wheel (kg)<input id="damperMass" type="number" min="0.1" step="1" value="60"></label><label>Damping Ratio ζ<input id="damperRatio" type="number" min="0.01" max="2" step="0.01" value="0.70"></label></div><button id="calculateDamperButton" type="button">Calculate</button><div class="calculator-results calculator-results-2"><div class="result-card"><span>Critical Damping</span><strong id="damperCritical">—</strong></div><div class="result-card"><span>Target Damping</span><strong id="damperTarget">—</strong></div></div><p id="damperError" class="calculator-error" aria-live="polite"></p>`;
    addSuspensionSection(damper);

    const roll = document.createElement("section");
    roll.id = "rollStiffnessSection";
    roll.setAttribute("aria-label", "Suspension — Roll stiffness calculator");
    roll.innerHTML = `<h2>Roll Stiffness Calculator</h2><p class="calculator-description">Estimate axle roll stiffness from left/right wheel rates and track width. This simplified model uses spring contribution only.</p><div class="calculator-grid"><label>Front Wheel Rate (N/mm)<input id="rollFrontRate" type="number" min="0.01" step="0.1" value="40"></label><label>Rear Wheel Rate (N/mm)<input id="rollRearRate" type="number" min="0.01" step="0.1" value="50"></label><label>Track Width (m)<input id="rollTrack" type="number" min="0.01" step="0.01" value="1.20"></label></div><button id="calculateRollStiffnessButton" type="button">Calculate</button><div class="calculator-results calculator-results-3"><div class="result-card"><span>Front Roll Stiffness</span><strong id="rollFrontResult">—</strong></div><div class="result-card"><span>Rear Roll Stiffness</span><strong id="rollRearResult">—</strong></div><div class="result-card"><span>Total Roll Stiffness</span><strong id="rollTotalResult">—</strong></div></div><p id="rollError" class="calculator-error" aria-live="polite"></p>`;
    addSuspensionSection(roll);

    const cg = document.createElement("section");
    cg.id = "cgHeightSection";
    cg.setAttribute("aria-label", "Suspension — CG height calculator");
    cg.innerHTML = `<h2>CG Height Calculator</h2><p class="calculator-description">Estimate CG height from measured longitudinal load transfer during acceleration or braking.</p><div class="calculator-grid"><label>Vehicle Mass (kg)<input id="cgMass" type="number" min="1" step="1" value="250"></label><label>Wheelbase (m)<input id="cgWheelbase" type="number" min="0.01" step="0.01" value="1.60"></label><label>Longitudinal Acceleration (g)<input id="cgAccel" type="number" min="0.001" step="0.01" value="1.00"></label><label>Measured Load Transfer (N)<input id="cgTransfer" type="number" min="0.01" step="1" value="459.8"></label></div><button id="calculateCgHeightButton" type="button">Calculate</button><div class="calculator-results calculator-results-2"><div class="result-card"><span>CG Height</span><strong id="cgHeightResult">—</strong></div><div class="result-card"><span>CG Height (mm)</span><strong id="cgHeightMm">—</strong></div></div><p id="cgError" class="calculator-error" aria-live="polite"></p>`;
    addSuspensionSection(cg);

    const weight = document.createElement("section");
    weight.id = "weightDistributionSection";
    weight.setAttribute("aria-label", "Suspension — Weight distribution calculator");
    weight.innerHTML = `<h2>Weight Distribution Calculator</h2><p class="calculator-description">Convert static front/rear weight distribution into axle loads in kg and N.</p><div class="calculator-grid"><label>Vehicle Mass (kg)<input id="wdMass" type="number" min="1" step="1" value="250"></label><label>Static Front Weight (%)<input id="wdFrontPercent" type="number" min="0.1" max="99.9" step="0.1" value="45"></label></div><button id="calculateWeightDistributionButton" type="button">Calculate</button><div class="calculator-results calculator-results-4"><div class="result-card"><span>Front Mass</span><strong id="wdFrontMass">—</strong></div><div class="result-card"><span>Rear Mass</span><strong id="wdRearMass">—</strong></div><div class="result-card"><span>Front Load</span><strong id="wdFrontLoad">—</strong></div><div class="result-card"><span>Rear Load</span><strong id="wdRearLoad">—</strong></div></div><p id="wdError" class="calculator-error" aria-live="polite"></p>`;
    addSuspensionSection(weight);

    document.querySelector("#calculateSpringRateButton")?.addEventListener("click", () => {
        const k = num("springRate"), mr = num("springMotionRatio");
        if (!(k > 0 && mr > 0)) { out("springError", "Enter positive spring rate and motion ratio."); return; }
        const wheel = k * mr * mr;
        out("springError", ""); out("springWheelRate", `${wheel.toFixed(2)} N/mm`); out("springWheelRateNm", `${(wheel * 1000).toFixed(0)} N/m`);
    });

    document.querySelector("#calculateWheelRateButton")?.addEventListener("click", () => {
        const k = num("wheelSpringRate"), mr = num("wheelMotionRatio");
        if (!(k > 0 && mr > 0)) { out("wheelError", "Enter positive spring rate and motion ratio."); return; }
        const wheel = k * mr * mr;
        out("wheelError", ""); out("wheelRateResult", `${wheel.toFixed(2)} N/mm`); out("wheelRateNm", `${(wheel * 1000).toFixed(0)} N/m`);
    });

    document.querySelector("#calculateRideFrequencyButton")?.addEventListener("click", () => {
        const k = num("rideWheelRate") * 1000, m = num("rideSprungMass");
        if (!(k > 0 && m > 0)) { out("rideError", "Enter positive wheel rate and sprung mass."); return; }
        const omega = Math.sqrt(k / m), f = omega / (2 * Math.PI);
        out("rideError", ""); out("rideFrequency", `${f.toFixed(2)} Hz`); out("rideOmega", `${omega.toFixed(2)} rad/s`);
    });

    document.querySelector("#calculateDamperButton")?.addEventListener("click", () => {
        const k = num("damperWheelRate") * 1000, m = num("damperMass"), zeta = num("damperRatio");
        if (!(k > 0 && m > 0 && zeta > 0)) { out("damperError", "Enter positive wheel rate, sprung mass and damping ratio."); return; }
        const critical = 2 * Math.sqrt(k * m), target = zeta * critical;
        out("damperError", ""); out("damperCritical", `${critical.toFixed(1)} N·s/m`); out("damperTarget", `${target.toFixed(1)} N·s/m`);
    });

    document.querySelector("#calculateRollStiffnessButton")?.addEventListener("click", () => {
        const kf = num("rollFrontRate") * 1000, kr = num("rollRearRate") * 1000, t = num("rollTrack");
        if (!(kf > 0 && kr > 0 && t > 0)) { out("rollError", "Enter positive wheel rates and track width."); return; }
        const front = kf * t * t / 2, rear = kr * t * t / 2, total = front + rear;
        out("rollError", ""); out("rollFrontResult", `${front.toFixed(0)} N·m/rad`); out("rollRearResult", `${rear.toFixed(0)} N·m/rad`); out("rollTotalResult", `${total.toFixed(0)} N·m/rad`);
    });

    document.querySelector("#calculateCgHeightButton")?.addEventListener("click", () => {
        const mass = num("cgMass"), L = num("cgWheelbase"), aG = num("cgAccel"), transfer = num("cgTransfer");
        if (!(mass > 0 && L > 0 && aG > 0 && transfer > 0)) { out("cgError", "Enter positive mass, wheelbase, acceleration and measured load transfer."); return; }
        const h = transfer * L / (mass * 9.81 * aG);
        out("cgError", ""); out("cgHeightResult", `${h.toFixed(3)} m`); out("cgHeightMm", `${(h * 1000).toFixed(1)} mm`);
    });

    document.querySelector("#calculateWeightDistributionButton")?.addEventListener("click", () => {
        const mass = num("wdMass"), frontPct = num("wdFrontPercent");
        if (!(mass > 0 && frontPct > 0 && frontPct < 100)) { out("wdError", "Enter a positive mass and a front weight percentage between 0 and 100."); return; }
        const front = mass * frontPct / 100, rear = mass - front, g = 9.81;
        out("wdError", ""); out("wdFrontMass", `${front.toFixed(1)} kg`); out("wdRearMass", `${rear.toFixed(1)} kg`); out("wdFrontLoad", `${(front * g).toFixed(1)} N`); out("wdRearLoad", `${(rear * g).toFixed(1)} N`);
    });
}

buildSuspensionTools();
