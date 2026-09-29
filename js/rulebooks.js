const RULEBOOKS = [
  {
    id:"fs", series:"Formula Student", title:"Formula Student UK 2026 Rules",
    version:"2026 • V1.0", description:"IMechE Formula Student UK rules covering administration, technical requirements, EV systems, inspections, static events and dynamic events.",
    tags:["T1–T14","EV","Aero","Scrutineering","Dynamic"],
    url:"https://www.imeche.org/docs/default-source/1-oscar/formula-student/2026/rules/fsuk-2026-rules---v1-09e21118e54216d0c8310ff0100d05193.pdf?sfvrsn=2",
    official:"https://www.imeche.org/events/formula-student"
  },
  {
    id:"f1", series:"Formula 1", title:"FIA Formula 1 Sporting Regulations",
    version:"2025 • Issue 1", description:"The 2025 FIA Formula 1 Sporting Regulations document supplied for this project. The FIA regulation hub is also linked so the current revision can be checked.",
    tags:["Sporting","2025","FIA","Race Procedures"],
    url:"https://www.fia.com/sites/default/files/fia_2025_formula_1_sporting_regulations_-_issue_1_-_2024-07-31.pdf",
    official:"https://www.fia.com/regulation/category/2182"
  },
  {
    id:"fe", series:"Formula E", title:"FIA Formula E Regulations",
    version:"2026–2027 • Season 13", description:"Current FIA Formula E regulation hub, including Sporting Regulations and Technical Regulations for the 2026–2027 season.",
    tags:["Sporting","Technical","2026–27","FIA"],
    url:"https://www.fia.com/regulation/category/109",
    official:"https://www.fia.com/regulation/category/109"
  }
];


const TOOLBOX = [
  {category:"Vehicle Dynamics", icon:"🚗", tools:[["Power-to-Weight","Compare power against vehicle mass.","powerToWeightSection"],["Acceleration","Estimate longitudinal acceleration from power, drag and rolling resistance.","accelerationSection"],["Lap Time","Estimate lap time from track length and average speed.","lapTimeSection"],["Lap Delta","Compare current and reference lap times.","lapDeltaSection"],["Weight Transfer","Analyze longitudinal/lateral load transfer.","weightTransferSection"],["Cornering Speed","Estimate theoretical cornering speed from radius and tyre friction.","corneringSpeedSection"],["Lateral G","Calculate lateral acceleration from speed and radius.","lateralGSection"]]} ,
  {category:"Aerodynamics & CFD", icon:"🌬️", tools:[["Downforce","Calculate aerodynamic downforce and dynamic pressure.","downforceSection"],["Inflation Layer","Estimate first-layer height, boundary-layer thickness and growth ratio.","inflationLayerSection"],["Inlet Turbulence","Calculate k, ω, ε and turbulent viscosity from inlet conditions.","inletTurbulenceSection"],["Particle Settling","Estimate terminal settling velocity with drag correction.","particleSettlingSection"],["Humidity","Calculate humidity quantities from temperature, pressure and RH.","humiditySection"]]} ,
  {category:"Brakes & Tyres", icon:"🛞", tools:[["Brake Bias","Estimate front/rear braking-force distribution and load transfer.","brakeBiasSection"],["Stopping Distance","Calculate reaction, braking and total stopping distance.","stoppingDistanceSection"],["Tyre Temperature","Analyze inside/middle/outside tread temperature balance.","tyreTemperatureSection"]]} ,
  {category:"Suspension", icon:"🔩", tools:[["Spring Rate","Calculate effective wheel rate from spring rate and motion ratio.","springRateSection"],["Wheel Rate","Calculate wheel rate from spring rate and motion ratio.","wheelRateSection"],["Ride Frequency","Estimate suspension natural frequency.","rideFrequencySection"],["Damper","Estimate critical and target damping coefficients.","damperSection"],["Roll Stiffness","Estimate axle and total roll stiffness.","rollStiffnessSection"],["CG Height","Estimate CG height from measured load transfer.","cgHeightSection"]]} ,
  {category:"Powertrain", icon:"⚙️", tools:[["Gear Ratio","Calculate wheel RPM and theoretical vehicle speed.","gearRatioSection"],["Fuel Consumption","Estimate fuel per lap, session use and remaining fuel.","fuelConsumptionSection"]]} ,
  {category:"Telemetry & Race Analysis", icon:"📡", tools:[["Speed Telemetry","View the speed trace from the active session.","speedTelemetry"],["Lap Comparison","Compare current lap, best lap and delta.","lapComparisonPanel"],["Performance Analysis","Review completed laps, average, fastest lap and consistency.","performanceAnalysis"],["Race Insights","Live rule-based interpretation of vehicle telemetry.","raceInsights"],["AI Race Engineer","Receive telemetry-based engineering guidance.","aiRaceEngineerPanel"]]}
];
let activeToolCategory = "All";

function setMainView(view) {
  const allTools = document.getElementById("allToolsSection");
  const rulebook = document.getElementById("rulebookSection");
  const mainContent = document.querySelectorAll(".cards, .telemetry-section, .calculator-section, .status, .timer, #sessionButton, .session-controls, .tool-category-title");
  mainContent.forEach(el => { el.hidden = view !== "engineer"; });
  if (rulebook) rulebook.hidden = view !== "rulebooks";
  if (allTools) allTools.hidden = view !== "all-tools";
  document.querySelectorAll(".main-tab").forEach(tab => tab.classList.toggle("active", tab.dataset.view === view));
  if (view === "all-tools") renderToolbox();
  window.scrollTo({top:0, behavior:"smooth"});
}

function renderToolbox() {
  const grid=document.getElementById("allToolsGrid");
  const chips=document.getElementById("toolCategoryChips");
  if (!grid || !chips) return;
  const search=(document.getElementById("allToolsSearch")?.value||"").trim().toLowerCase();
  const categories=["All", ...TOOLBOX.map(c=>c.category)];
  chips.innerHTML=categories.map(c=>'<button type="button" class="tool-chip ' + (activeToolCategory===c?"active":"") + '" data-tool-category="' + c + '">' + (c==="All"?"✨":TOOLBOX.find(x=>x.category===c)?.icon||"") + " " + c + "</button>").join("");
  const tools=TOOLBOX.flatMap(group=>group.tools.map(t=>({group:group,name:t[0],description:t[1],target:t[2]}))).filter(t=>activeToolCategory==="All" || t.group.category===activeToolCategory).filter(t=>!search || [t.name,t.description,t.group.category].join(" ").toLowerCase().includes(search));
  document.getElementById("allToolsCount").textContent=tools.length + " TOOL" + (tools.length===1?"":"S");
  grid.innerHTML=tools.length ? tools.map(t=>'<article class="tool-card"><div class="tool-card-top"><span class="tool-card-category">' + t.group.icon + " " + t.group.category + '</span><span class="tool-card-arrow">↗</span></div><h3>' + t.name + '</h3><p>' + t.description + '</p><button type="button" class="open-tool-button" data-tool-target="' + t.target + '">Open Tool</button></article>').join("") : '<div class="tool-empty">No tools match that search. Try a category or a broader term.</div>';
}

function openTool(target) {
  setMainView("engineer");
  setTimeout(() => {
    const section=target==="speedTelemetry" ? document.getElementById("speedChart")?.closest(".telemetry-section") : document.getElementById(target);
    if (!section) return;
    document.querySelectorAll(".calculator-section, .telemetry-section").forEach(el => el.hidden=true);
    document.querySelectorAll(".tool-category-title").forEach(el=>el.remove());
    section.hidden=false;
    section.scrollIntoView({behavior:"smooth", block:"start"});
  }, 50);
}
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("rulebookSection")?.setAttribute("hidden", "");
  document.querySelectorAll(".main-tab").forEach(tab => tab.addEventListener("click", () => setMainView(tab.dataset.view)));
  renderRulebooks();
  setMainView("engineer");
  document.getElementById("rulebookSearch")?.addEventListener("input", renderRulebooks);
  document.getElementById("rulebookSeries")?.addEventListener("change", renderRulebooks);
  document.getElementById("allToolsSearch")?.addEventListener("input", renderToolbox);
  document.getElementById("toolCategoryChips")?.addEventListener("click", event => { const chip=event.target.closest("[data-tool-category]"); if (!chip) return; activeToolCategory=chip.dataset.toolCategory; renderToolbox(); });
  document.getElementById("allToolsGrid")?.addEventListener("click", event => { const button=event.target.closest("[data-tool-target]"); if (button) openTool(button.dataset.toolTarget); });
});