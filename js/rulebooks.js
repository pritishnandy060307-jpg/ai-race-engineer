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


function setMainView(view) {
  const rulebook = document.getElementById("rulebookSection");
  const mainContent = document.querySelectorAll(".cards, .telemetry-section, .calculator-section, .status, .timer, #sessionButton, .session-controls, .tool-category-title");
  mainContent.forEach(el => { el.hidden = view === "rulebooks"; });
  if (rulebook) rulebook.hidden = view !== "rulebooks";
  document.querySelectorAll(".main-tab").forEach(tab => tab.classList.toggle("active", tab.dataset.view === view));
  window.scrollTo({top:0, behavior:"smooth"});
}

function renderRulebooks() {
  const grid=document.getElementById("rulebookGrid");
  const search=(document.getElementById("rulebookSearch")?.value||"").trim().toLowerCase();
  const series=document.getElementById("rulebookSeries")?.value||"all";
  const filtered=RULEBOOKS.filter(r => {
    const hay=[r.series,r.title,r.version,r.description,...r.tags].join(" ").toLowerCase();
    return (series==="all" || r.id===series) && (!search || hay.includes(search));
  });
  grid.innerHTML=filtered.length ? filtered.map(r => `
    <article class="rulebook-card">
      <span class="series">${r.series}</span>
      <h3>${r.title}</h3>
      <p>${r.description}</p>
      <div class="rulebook-meta"><span class="rulebook-tag">${r.version}</span>${r.tags.slice(0,3).map(t=>`<span class="rulebook-tag">${t}</span>`).join("")}</div>
      <div class="rulebook-actions">
        <a href="${r.url}" target="_blank" rel="noopener noreferrer">Open Rulebook</a>
        <a class="secondary" href="${r.official}" target="_blank" rel="noopener noreferrer">Official Hub</a>
      </div>
    </article>`).join("") : '<div class="rulebook-empty">No matching rulebook topics found.</div>';
}
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("rulebookSection")?.setAttribute("hidden", "");
  document.querySelectorAll(".main-tab").forEach(tab => tab.addEventListener("click", () => setMainView(tab.dataset.view)));
  renderRulebooks();
  setMainView("engineer");
  document.getElementById("rulebookSearch")?.addEventListener("input", renderRulebooks);
  document.getElementById("rulebookSeries")?.addEventListener("change", renderRulebooks);
});