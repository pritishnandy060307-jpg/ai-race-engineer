const insightState = {
    lastSpeed: null,
    lastTime: null,
    samples: []
};

function numberFrom(id) {
    const element = document.getElementById(id);
    if (!element) return 0;
    const value = Number.parseFloat(element.textContent.replace(/[^0-9.-]/g, ""));
    return Number.isFinite(value) ? value : 0;
}

function createInsightsPanel() {
    if (document.getElementById("raceInsights")) return document.getElementById("raceInsights");

    const section = document.createElement("section");
    section.id = "raceInsights";
    section.className = "insights-section telemetry-section";
    section.innerHTML = `
        <div class="insights-heading">
            <div><h2>AI Race Engineer Insights</h2><p>Live interpretation of simulated vehicle telemetry.</p></div>
            <span id="insightBadge" class="insight-badge">WAITING</span>
        </div>
        <div id="insightMessages" class="insight-messages" aria-live="polite">
            <div class="insight-message neutral"><strong>● System</strong><span>Start a session to receive live driving insights.</span></div>
        </div>`;

    const speedSection = document.getElementById("speedChart")?.closest(".telemetry-section");
    const liveSection = document.querySelector(".telemetry-chart-grid")?.closest(".telemetry-section");
    (liveSection || speedSection)?.after(section);
    return section;
}

function setInsights(messages, active) {
    const panel = createInsightsPanel();
    const badge = panel.querySelector("#insightBadge");
    const container = panel.querySelector("#insightMessages");
    badge.textContent = active ? "LIVE" : "WAITING";
    badge.className = `insight-badge ${active ? "live" : ""}`;
    container.innerHTML = messages.map(({ type, title, text }) => `
        <div class="insight-message ${type}"><strong>${title}</strong><span>${text}</span></div>`).join("");
}

function evaluateTelemetry() {
    const status = document.getElementById("sessionStatus")?.textContent?.trim() || "OFFLINE";
    if (status !== "SESSION ACTIVE") {
        setInsights([{ type: "neutral", title: "● System", text: "Start a session to receive live driving insights." }], false);
        return;
    }

    const speed = numberFrom("speed");
    const rpm = numberFrom("rpm");
    const throttle = numberFrom("throttle");
    const brake = numberFrom("brake");
    const messages = [];

    if (brake >= 70) {
        messages.push({ type: "warning", title: "● Braking", text: "Heavy braking detected. Monitor front/rear brake balance and lock-up risk." });
    } else if (throttle >= 85 && brake <= 5) {
        messages.push({ type: "positive", title: "● Acceleration", text: "High throttle application with minimal brake input." });
    } else if (throttle <= 20 && brake <= 10) {
        messages.push({ type: "neutral", title: "● Coasting", text: "Low pedal input detected. Review corner entry and exit efficiency." });
    } else {
        messages.push({ type: "positive", title: "● Driving", text: "Throttle and brake inputs are within a moderate operating range." });
    }

    if (rpm >= 7000) {
        messages.push({ type: "warning", title: "● Powertrain", text: `Engine speed is high at approximately ${Math.round(rpm)} RPM.` });
    } else {
        messages.push({ type: "neutral", title: "● Powertrain", text: `Current speed is ${Math.round(speed)} km/h in gear ${Math.round(numberFrom("gear"))}.` });
    }

    if (insightState.lastSpeed !== null && speed - insightState.lastSpeed > 12) {
        messages.push({ type: "positive", title: "● Performance", text: "Strong acceleration detected in the latest telemetry interval." });
    }

    insightState.lastSpeed = speed;
    insightState.lastTime = Date.now();
    setInsights(messages.slice(0, 3), true);
}

createInsightsPanel();
setInterval(evaluateTelemetry, 500);
evaluateTelemetry();
