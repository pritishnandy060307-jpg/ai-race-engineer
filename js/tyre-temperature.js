function readNumber(id) {
    const element = document.querySelector(`#${id}`);
    return element ? Number.parseFloat(element.value) : NaN;
}

function showResult(id, text) {
    const element = document.querySelector(`#${id}`);
    if (element) element.textContent = text;
}

function calculateTyreTemperature({ inside, middle, outside, targetMin, targetMax }) {
    const values = [inside, middle, outside, targetMin, targetMax];
    if (!values.every(Number.isFinite) || inside < 0 || middle < 0 || outside < 0 || targetMin < 0 || targetMax <= targetMin) return null;

    const average = (inside + middle + outside) / 3;
    const peak = Math.max(inside, middle, outside);
    const spread = Math.max(inside, middle, outside) - Math.min(inside, middle, outside);
    const insideOutside = inside - outside;
    const middleVsAverage = middle - average;

    let balance = "Balanced";
    if (insideOutside > 5) balance = "More heat on inside";
    else if (insideOutside < -5) balance = "More heat on outside";

    let operatingStatus = "Within target range";
    if (average < targetMin) operatingStatus = "Below target range";
    else if (average > targetMax) operatingStatus = "Above target range";

    return { average, peak, spread, insideOutside, middleVsAverage, balance, operatingStatus };
}

function buildTyreTemperatureTool() {
    if (document.querySelector("#tyreTemperatureSection")) return;

    const section = document.createElement("section");
    section.id = "tyreTemperatureSection";
    section.className = "calculator-section";
    section.setAttribute("aria-label", "Brakes and tyres — Tyre temperature calculator");
    section.innerHTML = `<h2>Tyre Temperature Calculator</h2><p class="calculator-description">Analyze measured inside, middle and outside tread temperatures. This tool evaluates temperature distribution; it does not predict tyre temperature from vehicle setup.</p><div class="calculator-grid"><label>Inside Tread (°C)<input id="tyreTempInside" type="number" min="0" step="0.1" value="85"></label><label>Middle Tread (°C)<input id="tyreTempMiddle" type="number" min="0" step="0.1" value="90"></label><label>Outside Tread (°C)<input id="tyreTempOutside" type="number" min="0" step="0.1" value="87"></label><label>Target Minimum (°C)<input id="tyreTempMin" type="number" min="0" step="1" value="80"></label><label>Target Maximum (°C)<input id="tyreTempMax" type="number" min="0" step="1" value="100"></label></div><button id="calculateTyreTemperatureButton" type="button">Calculate</button><div class="calculator-results calculator-results-6"><div class="result-card"><span>Average Temperature</span><strong id="tyreTempAverage">—</strong></div><div class="result-card"><span>Peak Temperature</span><strong id="tyreTempPeak">—</strong></div><div class="result-card"><span>Inside–Outside Spread</span><strong id="tyreTempIOSpread">—</strong></div><div class="result-card"><span>Total Tread Spread</span><strong id="tyreTempSpread">—</strong></div><div class="result-card"><span>Temperature Balance</span><strong id="tyreTempBalance">—</strong></div><div class="result-card"><span>Operating Range</span><strong id="tyreTempStatus">—</strong></div></div><p class="calculator-description">Balance indication uses a ±5°C inside-to-outside heuristic. Use measured tyre data together with your team’s tyre model and setup data before making setup changes.</p><p id="tyreTempError" class="calculator-error" aria-live="polite"></p>`;
    document.querySelector("main")?.appendChild(section);

    document.querySelector("#calculateTyreTemperatureButton")?.addEventListener("click", () => {
        const result = calculateTyreTemperature({ inside: readNumber("tyreTempInside"), middle: readNumber("tyreTempMiddle"), outside: readNumber("tyreTempOutside"), targetMin: readNumber("tyreTempMin"), targetMax: readNumber("tyreTempMax") });
        if (!result) {
            showResult("tyreTempError", "Enter valid temperatures and make sure the target maximum is above the target minimum.");
            return;
        }
        showResult("tyreTempError", "");
        showResult("tyreTempAverage", `${result.average.toFixed(1)} °C`);
        showResult("tyreTempPeak", `${result.peak.toFixed(1)} °C`);
        showResult("tyreTempIOSpread", `${result.insideOutside > 0 ? "+" : ""}${result.insideOutside.toFixed(1)} °C`);
        showResult("tyreTempSpread", `${result.spread.toFixed(1)} °C`);
        showResult("tyreTempBalance", result.balance);
        showResult("tyreTempStatus", result.operatingStatus);
    });
}

buildTyreTemperatureTool();
