import "./tyre-temperature.js?v=1";
import "./suspension-tools.js?v=1";
import "./fuel-consumption.js?v=1";
import "./telemetry-charts.js?v=1";

function moveSessionControls() {
    const status = document.querySelector(".status");
    const timer = document.querySelector(".timer");
    const button = document.querySelector("#sessionButton");
    const firstCalculator = document.querySelector(".calculator-section");

    if (!status || !timer || !button || !firstCalculator || document.querySelector(".session-controls")) return;

    const controls = document.createElement("section");
    controls.className = "session-controls";
    controls.setAttribute("aria-label", "Race session controls");
    controls.append(status, timer, button);
    firstCalculator.before(controls);
}

function showVehicleDynamics() {
    const vehicleIds = ["powerToWeightSection", "accelerationSection", "lapTimeSection", "lapDeltaSection", "weightTransferSection"];
    document.querySelectorAll(".calculator-section, .telemetry-section").forEach(section => {
        section.hidden = !vehicleIds.includes(section.id);
    });
    document.querySelectorAll(".tool-category-title").forEach(title => title.remove());
    const first = document.querySelector("#powerToWeightSection");
    if (first) {
        const title = document.createElement("h2");
        title.className = "tool-category-title";
        title.textContent = "🚗 Vehicle Dynamics";
        first.before(title);
    }
}

function showCategory(category, titleText) {
    document.querySelectorAll(".calculator-section, .telemetry-section").forEach(section => {
        const label = (section.getAttribute("aria-label") || "").toLowerCase();
        const match = category === "suspension" ? label.includes("suspension") : category === "powertrain" ? label.includes("gear ratio") || label.includes("fuel consumption") : false;
        section.hidden = !match;
    });
    document.querySelectorAll(".tool-category-title").forEach(title => title.remove());
    const first = document.querySelector(`.calculator-section:not([hidden])`);
    if (first) {
        const title = document.createElement("h2");
        title.className = "tool-category-title";
        title.textContent = titleText;
        first.before(title);
    }
}

document.addEventListener("DOMContentLoaded", moveSessionControls);

document.addEventListener("click", event => {
    const button = event.target.closest(".nav-button");
    if (!button) return;
    if (button.dataset.category === "vehicle") showVehicleDynamics();
    if (button.dataset.category === "suspension") showCategory("suspension", "🔩 Suspension");
    if (button.dataset.category === "powertrain") showCategory("powertrain", "🔧 Powertrain");
});
