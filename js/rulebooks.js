const RULEBOOKS = [
  {
    id:"fs", series:"Formula Student", title:"Formula Student UK 2026 Rules",
    version:"2026 • V1.0", description:"IMechE Formula Student UK rules covering administration, technical requirements, EV systems, inspections, static events and dynamic events.",
    tags:["T1–T14","EV","Aero","Scrutineering","Dynamic"],
    url:"https://www.imeche.org/docs/default-source/1-oscar/formula-student/2026/rules/fsuk-2026-rules---v1-09e21118e54216d0c8310ff0100d05193.pdf?sfvrsn=2",
    official:"https://www.imeche.org/events/formula-student"
  },
  {
    id:"f1", series:"Formula 1", title:"FIA Formula 1 Regulations",
    version:"2026 • Live FIA hub", description:"Use the FIA Formula One regulation hub for the current 2026 General, Sporting, Technical, Financial and Operational sections. Revisions can change during the season.",
    tags:["Sporting","Technical","2026","FIA"],
    url:"https://www.fia.com/regulation/category/110",
    official:"https://www.fia.com/regulation/category/110"
  },
  {
    id:"nascar", series:"NASCAR", title:"NASCAR 2026 Competition & Technical Rules",
    version:"2026 • NASCAR Cup / National Series", description:"NASCAR competition and technical rules, including 2026 technical updates and series procedures. The official NASCAR source should be checked for the latest revision and applicable series package.",
    tags:["Stock Car","Cup","Technical","Sporting"],
    url:"https://www.nascar.com/news-media/2025/11/14/nascar-2026-rule-book-technical-updates/",
    official:"https://www.nascar.com/"
  },
  {
    id:"indycar", series:"INDYCAR", title:"NTT INDYCAR SERIES Rulebook",
    version:"2026 • Rulebook", description:"Official 2026 NTT INDYCAR SERIES Rulebook covering sporting, technical, safety, aero, powertrain and event regulations.",
    tags:["Open Wheel","Technical","Aero","Hybrid"],
    url:"https://epaddock.indycar.com/docs/default-source/rules-regulations-and-policies/2026-indycar-rulebook.pdf?sfvrsn=56785b60_42",
    official:"https://www.indycar.com/Fan-Info/INDYCAR-101"
  },
  {
    id:"daytona", series:"Daytona", title:"Daytona International Speedway",
    version:"2026 • Daytona / Superspeedway", description:"Daytona-specific reference for the 2.5-mile superspeedway, including official NASCAR event information and current Daytona Cup rules-package updates.",
    tags:["2.5 mi","Superspeedway","NASCAR","Aero Package"],
    url:"https://www.nascar.com/news-media/2026/07/15/nascar-announces-rule-changes-for-summer-cup-race-at-daytona/",
    official:"https://www.nascar.com/nascar-tracks/daytona-international-speedway/"
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
  const cards = document.querySelector(".cards");
  const sessionControls = document.querySelector(".session-controls");
  const toolNavigation = document.querySelector("#toolNavigation");
  const mainContent = document.querySelectorAll(".cards, .telemetry-section, .calculator-section, .status, .timer, #sessionButton, .session-controls, .engineering-upgrades, .tool-category-title");

  mainContent.forEach(el => { el.hidden = true; });
  document.querySelectorAll(".engineering-upgrades > .upgrade-panel").forEach(el => { el.hidden = true; });
  if (allTools) allTools.hidden = true;
  if (rulebook) rulebook.hidden = true;
  if (toolNavigation) toolNavigation.hidden = true;

  if (view === "dashboard") {
    if (cards) cards.hidden = false;
    if (sessionControls) sessionControls.hidden = false;
  }

  if (view === "setup") {
    document.getElementById("telemetrySourcePanel")?.removeAttribute("hidden");
    document.getElementById("setupManagerPanel")?.removeAttribute("hidden");
    document.getElementById("integratedModelPanel")?.removeAttribute("hidden");
    document.querySelector(".engineering-upgrades")?.removeAttribute("hidden");
    if (sessionControls) sessionControls.hidden = false;
  }

  if (view === "telemetry") {
    document.querySelectorAll(".telemetry-section").forEach(el => { el.hidden = false; });
    document.getElementById("telemetrySourcePanel")?.removeAttribute("hidden");
    document.querySelector(".engineering-upgrades")?.removeAttribute("hidden");
  }

  if (view === "analysis") {
    ["trackAnalysisPanel", "lapComparisonPanel", "performanceAnalysis", "raceInsights", "aiRaceEngineerPanel"].forEach(id => {
      document.getElementById(id)?.removeAttribute("hidden");
    });
    document.querySelector(".engineering-upgrades")?.removeAttribute("hidden");
    document.querySelectorAll(".insights-section, .performance-analysis-section, .lap-comparison-section, .ai-race-engineer-section").forEach(el => { el.hidden = false; });
  }

  if (view === "engineering-tools") {
    if (allTools) allTools.hidden = false;
    if (toolNavigation) toolNavigation.hidden = false;
    renderToolbox();
  }

  if (view === "rulebooks") {
    if (rulebook) rulebook.hidden = false;
  }

  document.querySelectorAll(".main-tab").forEach(tab => tab.classList.toggle("active", tab.dataset.view === view));
  window.scrollTo({top:0, behavior:"smooth"});
}

function openTool(target) { showEngineeringTool(target); }

function showEngineeringTool(target) {
  setMainView("engineering-tools");
  const allTools = document.getElementById("allToolsSection");
  if (allTools) allTools.hidden = true;
  document.querySelectorAll(".calculator-section, .telemetry-section").forEach(el => { el.hidden = true; });
  document.querySelectorAll(".tool-category-title").forEach(el => el.remove());
  const section = target === "speedTelemetry"
    ? document.getElementById("speedChart")?.closest(".telemetry-section")
    : document.getElementById(target);
  if (!section) return;
  section.hidden = false;
  section.scrollIntoView({behavior:"smooth", block:"start"});
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("rulebookSection")?.setAttribute("hidden", "");
  document.querySelectorAll(".main-tab").forEach(tab => tab.addEventListener("click", () => setMainView(tab.dataset.view)));
  renderRulebooks();
  requestAnimationFrame(() => setMainView("dashboard"));
  document.getElementById("rulebookSearch")?.addEventListener("input", renderRulebooks);
  document.getElementById("rulebookSeries")?.addEventListener("change", renderRulebooks);
  document.getElementById("allToolsSearch")?.addEventListener("input", renderToolbox);
  document.getElementById("toolCategoryChips")?.addEventListener("click", event => { const chip=event.target.closest("[data-tool-category]"); if (!chip) return; activeToolCategory=chip.dataset.toolCategory; renderToolbox(); });
  document.getElementById("allToolsGrid")?.addEventListener("click", event => { const button=event.target.closest("[data-tool-target]"); if (button) openTool(button.dataset.toolTarget); });
});