import "./tyre-temperature.js?v=1";

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

document.addEventListener("click", event => {
    const button = event.target.closest('.nav-button[data-category="vehicle"]');
    if (button) showVehicleDynamics();
});
