function fuelNumber(id) {
    const el = document.querySelector(`#${id}`);
    return el ? Number.parseFloat(el.value) : NaN;
}

function fuelOut(id, text) {
    const el = document.querySelector(`#${id}`);
    if (el) el.textContent = text;
}

function buildFuelConsumptionTool() {
    if (document.querySelector("#fuelConsumptionSection")) return;
    const section = document.createElement("section");
    section.id = "fuelConsumptionSection";
    section.className = "calculator-section";
    section.setAttribute("aria-label", "Powertrain — Fuel consumption calculator");
    section.innerHTML = `<h2>Fuel Consumption Calculator</h2><p class="calculator-description">Estimate fuel used per lap and for a session from fuel flow, lap time and lap count.</p><div class="calculator-grid"><label>Fuel Flow (L/h)<input id="fuelFlow" type="number" min="0.01" step="0.1" value="8.0"></label><label>Lap Time (s)<input id="fuelLapTime" type="number" min="0.1" step="0.1" value="90"></label><label>Number of Laps<input id="fuelLaps" type="number" min="1" step="1" value="20"></label><label>Tank Capacity (L)<input id="fuelTank" type="number" min="0.01" step="0.1" value="10"></label></div><button id="calculateFuelButton" type="button">Calculate</button><div class="calculator-results calculator-results-4"><div class="result-card"><span>Fuel per Lap</span><strong id="fuelPerLap">—</strong></div><div class="result-card"><span>Total Fuel Used</span><strong id="fuelTotal">—</strong></div><div class="result-card"><span>Fuel Remaining</span><strong id="fuelRemaining">—</strong></div><div class="result-card"><span>Session Time</span><strong id="fuelSessionTime">—</strong></div></div><p id="fuelError" class="calculator-error" aria-live="polite"></p>`;
    document.querySelector("main")?.appendChild(section);

    document.querySelector("#calculateFuelButton")?.addEventListener("click", () => {
        const flow = fuelNumber("fuelFlow"), lapTime = fuelNumber("fuelLapTime"), laps = fuelNumber("fuelLaps"), tank = fuelNumber("fuelTank");
        if (!(flow > 0 && lapTime > 0 && laps > 0 && tank > 0)) { fuelOut("fuelError", "Enter positive fuel flow, lap time, lap count and tank capacity."); return; }
        const perLap = flow * lapTime / 3600;
        const total = perLap * laps;
        const remaining = tank - total;
        const sessionSeconds = lapTime * laps;
        const minutes = Math.floor(sessionSeconds / 60);
        const seconds = sessionSeconds - minutes * 60;
        fuelOut("fuelError", remaining < 0 ? "Warning: estimated fuel use exceeds tank capacity." : "");
        fuelOut("fuelPerLap", `${perLap.toFixed(3)} L`);
        fuelOut("fuelTotal", `${total.toFixed(2)} L`);
        fuelOut("fuelRemaining", `${remaining.toFixed(2)} L`);
        fuelOut("fuelSessionTime", `${String(minutes).padStart(2, "0")}:${seconds.toFixed(1).padStart(4, "0")}`);
    });
}

buildFuelConsumptionTool();
