const FIELD_DEFS = [
  { key: "time", label: "Time (required)", aliases: ["time", "timestamp", "elapsed", "elapsed time", "session time", "time s", "time (s)"], required: true },
  { key: "speed", label: "Speed (required)", aliases: ["speed", "speed kmh", "speed km/h", "vehicle speed", "velocity", "speed (km/h)", "speed_kmh"], required: true },
  { key: "rpm", label: "RPM", aliases: ["rpm", "engine rpm", "engine speed"] },
  { key: "throttle", label: "Throttle (%)", aliases: ["throttle", "throttle percent", "throttle (%)", "throttlepercent"] },
  { key: "brake", label: "Brake (%)", aliases: ["brake", "brake percent", "brake (%)", "brakepercent"] },
  { key: "gear", label: "Gear", aliases: ["gear", "current gear"] },
  { key: "steering", label: "Steering (deg)", aliases: ["steering", "steering angle", "steering deg", "steering angle deg"] },
  { key: "lateralG", label: "Lateral G", aliases: ["lateral g", "lat g", "lateral_g", "lateral acceleration"] },
  { key: "longitudinalG", label: "Longitudinal G", aliases: ["longitudinal g", "long g", "longitudinal_g", "longitudinal acceleration"] },
  { key: "lap", label: "Lap number", aliases: ["lap", "lap number", "lap no", "lap #"] },
  { key: "lapTime", label: "Lap time (seconds)", aliases: ["lap time", "lap time s", "lap_time_s", "laptime", "lap time (s)"] }
];
const state = { rows: [], headers: [], charts: [], fileName: "", mappings: {} };
const PANEL_ID = "telemetryImportPanel";

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char]));
}
function parseCSV(text) {
  const firstLine = text.split(/\r?\n/, 1)[0] || "";
  const candidates = [",", ";", "\t"];
  const delimiter = candidates.sort((a, b) => firstLine.split(b).length - firstLine.split(a).length)[0];
  const rows = [];
  let row = [], cell = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"' && quoted && text[i + 1] === '"') { cell += '"'; i++; }
    else if (char === '"') quoted = !quoted;
    else if (char === delimiter && !quoted) { row.push(cell.trim()); cell = ""; }
    else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(cell.trim()); cell = "";
      if (row.some(value => value !== "")) rows.push(row);
      row = [];
    } else cell += char;
  }
  row.push(cell.trim());
  if (row.some(value => value !== "")) rows.push(row);
  return rows;
}
function normaliseHeader(value) { return String(value).trim().toLowerCase().replace(/[._-]+/g, " ").replace(/\s+/g, " "); }
function toNumber(value) {
  if (value === null || value === undefined || String(value).trim() === "") return null;
  const n = Number(String(value).replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : null;
}
function guessColumn(def, headers) {
  const aliases = [normaliseHeader(def.key), ...def.aliases.map(normaliseHeader)];
  let index = headers.findIndex(header => aliases.includes(normaliseHeader(header)));
  if (index < 0) index = headers.findIndex(header => aliases.some(alias => alias.length > 2 && normaliseHeader(header).includes(alias)));
  return index < 0 ? "" : String(index);
}
function ensurePanel() {
  if (document.getElementById(PANEL_ID)) return;
  const section = document.createElement("section");
  section.id = PANEL_ID;
  section.className = "telemetry-section";
  section.setAttribute("aria-label", "Import telemetry data");
  section.innerHTML = `
    <div class="import-heading"><div><span class="eyebrow">DATA WORKSPACE</span><h2>Import Your Telemetry</h2><p class="calculator-description">Load a CSV from your logger or simulator. Imported measurements stay separate from generated demo telemetry.</p></div><span class="import-status" id="telemetryImportStatus">NO DATASET</span></div>
    <div class="import-dropzone"><label for="telemetryCsvFile"><strong>Choose a telemetry CSV</strong><span>Comma-, semicolon- or tab-separated files supported</span></label><input id="telemetryCsvFile" type="file" accept=".csv,.tsv,.txt,text/csv,text/tab-separated-values"><p id="telemetryImportMessage" class="calculator-error" aria-live="polite">Choose a file to begin. Nothing is uploaded to a server; parsing happens in this browser.</p></div>
    <div id="telemetryMappingWrap" hidden><h3>Map your columns</h3><p class="calculator-description">Time and speed are required. Other channels are optional. Check units before loading.</p>
      <div class="import-mapping-grid" id="telemetryMappingGrid"></div>
      <div class="import-actions"><label>Time column unit<select id="telemetryTimeUnit"><option value="seconds">Seconds</option><option value="milliseconds">Milliseconds</option></select></label><label>Speed unit<select id="telemetrySpeedUnit"><option value="kmh">km/h</option><option value="ms">m/s</option></select></label><button id="loadTelemetryDataset" type="button">Load Dataset</button><button id="clearTelemetryDataset" type="button" class="secondary-button">Clear Imported Data</button></div>
      <div id="telemetryImportSummary" class="session-summary"></div><div id="telemetryPreviewWrap" class="import-preview-wrap"></div>
      <div id="importedTelemetryCharts" class="imported-telemetry-charts"></div>
    </div>`;
  const style = document.createElement("style");
  style.id = "telemetry-import-styles";
  style.textContent = `
    #${PANEL_ID}{margin:1rem 0;padding:clamp(16px,2.5vw,24px);border:1px solid var(--border,#2b3440);border-radius:12px;background:var(--panel,#12161c)}
    #${PANEL_ID} .import-heading{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
    #${PANEL_ID} h2{margin:.25rem 0 .5rem} #${PANEL_ID} h3{margin:18px 0 6px}
    #${PANEL_ID} .import-status{border:1px solid var(--border,#2b3440);border-radius:99px;padding:6px 10px;font-size:11px;font-weight:800;letter-spacing:.05em}
    #${PANEL_ID} .import-dropzone{margin:14px 0;padding:20px;border:1px dashed var(--border,#465160);border-radius:10px;background:var(--panel-2,#191f27)}
    #${PANEL_ID} .import-dropzone label{display:grid;gap:5px;cursor:pointer} #${PANEL_ID} .import-dropzone label span{color:var(--muted,#8e9aaa);font-size:12px}
    #${PANEL_ID} input[type=file]{display:block;margin-top:12px;max-width:100%}
    #${PANEL_ID} .import-mapping-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:12px 0}
    #${PANEL_ID} .import-mapping-grid label,#${PANEL_ID} .import-actions label{display:grid;gap:5px;font-size:12px;color:var(--muted,#8e9aaa)}
    #${PANEL_ID} select{min-width:0;width:100%;padding:9px;border:1px solid var(--border,#2b3440);border-radius:7px;background:#0d1116;color:var(--text,#f5f7fa)}
    #${PANEL_ID} .import-actions{display:flex;align-items:end;flex-wrap:wrap;gap:10px;margin:14px 0}
    #${PANEL_ID} .import-actions label{min-width:145px}
    #${PANEL_ID} .import-actions button{margin:0}
    #${PANEL_ID} .import-preview-wrap{overflow:auto;max-width:100%;margin:12px 0}
    #${PANEL_ID} table{border-collapse:collapse;width:100%;font-size:12px;white-space:nowrap}
    #${PANEL_ID} th,#${PANEL_ID} td{padding:8px;border-bottom:1px solid var(--border,#2b3440);text-align:left}
    #${PANEL_ID} th{color:var(--muted,#8e9aaa);position:sticky;top:0;background:var(--panel,#12161c)}
    #${PANEL_ID} .imported-telemetry-charts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin-top:18px}
    #${PANEL_ID} .imported-chart-card{min-width:0;padding:12px;border:1px solid var(--border,#2b3440);border-radius:9px}
    #${PANEL_ID} .imported-chart-card h3{margin:0 0 8px;font-size:14px}
    #${PANEL_ID} .imported-chart-canvas{height:240px;position:relative}
    #${PANEL_ID} .calculator-error{line-height:1.5}
    @media(max-width:700px){#${PANEL_ID} .import-mapping-grid{grid-template-columns:repeat(2,minmax(0,1fr))}#${PANEL_ID} .imported-telemetry-charts{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);
  const anchor = document.getElementById("advancedTelemetrySection") || document.getElementById("speedChart")?.closest(".telemetry-section") || document.querySelector(".cards");
  anchor?.after(section);
  section.querySelector("#telemetryCsvFile").addEventListener("change", handleFile);
  section.querySelector("#loadTelemetryDataset").addEventListener("click", loadDataset);
  section.querySelector("#clearTelemetryDataset").addEventListener("click", clearDataset);
}
function showMessage(message, isError = false) {
  const el = document.getElementById("telemetryImportMessage");
  if (el) { el.textContent = message; el.style.color = isError ? "#ff8a65" : ""; }
}
async function handleFile(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  if (file.size > 25 * 1024 * 1024) { showMessage("File exceeds 25 MB. Export a smaller session or split the file first.", true); return; }
  try {
    const raw = await file.text();
    const matrix = parseCSV(raw.replace(/^\uFEFF/, ""));
    if (matrix.length < 2) throw new Error("The file needs a header row and at least one data row.");
    state.headers = matrix[0].map((header, index) => header || `Column ${index + 1}`);
    state.rows = matrix.slice(1).filter(row => row.some(value => value !== "")).map(row => state.headers.map((_, index) => row[index] ?? ""));
    state.fileName = file.name;
    renderMappings();
    showMessage(`Read ${state.rows.length.toLocaleString()} data rows from ${file.name}. Review the detected columns, then load the dataset.`);
    document.getElementById("telemetryMappingWrap").hidden = false;
    document.getElementById("telemetryImportStatus").textContent = "FILE READY";
    renderPreview();
  } catch (error) { showMessage(error.message || "Could not read this file.", true); }
}
function renderMappings() {
  const grid = document.getElementById("telemetryMappingGrid");
  if (!grid) return;
  grid.replaceChildren();
  for (const def of FIELD_DEFS) {
    const label = document.createElement("label");
    label.textContent = def.label;
    const select = document.createElement("select");
    select.dataset.field = def.key;
    const none = document.createElement("option"); none.value = ""; none.textContent = def.required ? "Choose a column" : "Not mapped";
    select.appendChild(none);
    state.headers.forEach((header, index) => {
      const option = document.createElement("option"); option.value = String(index); option.textContent = header;
      select.appendChild(option);
    });
    select.value = guessColumn(def, state.headers);
    label.appendChild(select); grid.appendChild(label);
  }
}
function getMappings() {
  const mapping = {};
  document.querySelectorAll("#telemetryMappingGrid select").forEach(select => { mapping[select.dataset.field] = select.value === "" ? null : Number(select.value); });
  return mapping;
}
function renderPreview(rows = state.rows) {
  const wrap = document.getElementById("telemetryPreviewWrap");
  if (!wrap) return;
  const preview = rows.slice(0, 6);
  const table = document.createElement("table");
  const thead = document.createElement("thead"), headerRow = document.createElement("tr");
  state.headers.forEach(header => { const th = document.createElement("th"); th.textContent = header; headerRow.appendChild(th); });
  thead.appendChild(headerRow); table.appendChild(thead);
  const tbody = document.createElement("tbody");
  preview.forEach(row => { const tr = document.createElement("tr"); row.forEach(value => { const td = document.createElement("td"); td.textContent = value; tr.appendChild(td); }); tbody.appendChild(tr); });
  table.appendChild(tbody); wrap.replaceChildren(table);
}
function loadDataset() {
  const mapping = getMappings();
  if (mapping.time === null || mapping.speed === null) { showMessage("Map both Time and Speed before loading.", true); return; }
  const timeScale = document.getElementById("telemetryTimeUnit").value === "milliseconds" ? 0.001 : 1;
  const speedScale = document.getElementById("telemetrySpeedUnit").value === "ms" ? 3.6 : 1;
  const normalized = [];
  let invalid = 0;
  for (const raw of state.rows) {
    const time = toNumber(raw[mapping.time]);
    const speed = toNumber(raw[mapping.speed]);
    if (time === null || speed === null || time < 0 || speed < 0) { invalid++; continue; }
    const sample = { timeSeconds: time * timeScale, speedKmh: speed * speedScale };
    const fields = { rpm: "rpm", throttle: "throttlePercent", brake: "brakePercent", gear: "gear", steering: "steeringDeg", lateralG: "lateralG", longitudinalG: "longitudinalG", lap: "lapNumber", lapTime: "lapTimeSeconds" };
    for (const [source, target] of Object.entries(fields)) {
      const index = mapping[source];
      if (index !== null && index !== undefined) {
        const value = toNumber(raw[index]);
        if (value !== null) sample[target] = value;
      }
    }
    if (sample.throttlePercent !== undefined) sample.throttlePercent = Math.max(0, Math.min(100, sample.throttlePercent));
    if (sample.brakePercent !== undefined) sample.brakePercent = Math.max(0, Math.min(100, sample.brakePercent));
    normalized.push(sample);
  }
  if (normalized.length < 2) { showMessage("Fewer than two valid rows remain after parsing. Check your column mapping and units.", true); return; }
  normalized.sort((a, b) => a.timeSeconds - b.timeSeconds);
  state.mappings = mapping;
  state.loadedRows = normalized;
  renderImportedCharts(normalized);
  const times = normalized.map(row => row.timeSeconds);
  const speeds = normalized.map(row => row.speedKmh);
  const duration = times[times.length - 1] - times[0];
  const summary = document.getElementById("telemetryImportSummary");
  summary.innerHTML = `<strong>Imported dataset: ${escapeHtml(state.fileName)}</strong><span>${normalized.length.toLocaleString()} valid samples · ${duration.toFixed(2)} s time span · peak speed ${Math.max(...speeds).toFixed(1)} km/h · ${invalid} rows skipped</span>`;
  const laps = buildLapRecords(normalized);
  if (laps.length && typeof window.loadImportedLapData === "function") {
    window.loadImportedLapData(laps);
    summary.innerHTML += `<span>${laps.length} lap records loaded into Lap Comparison from mapped lap-number and lap-time columns.</span>`;
  } else if (mapping.lap !== null && mapping.lapTime === null) {
    summary.innerHTML += "<span>Lap number is mapped, but lap time is not. Lap comparison was not overwritten because lap durations cannot be inferred safely.</span>";
  } else {
    summary.innerHTML += "<span>For lap comparison, map both Lap number and Lap time (seconds). Imported traces are shown separately from live demo telemetry.</span>";
  }
  document.getElementById("telemetryImportStatus").textContent = "DATA LOADED";
  showMessage("Dataset loaded locally. The imported charts below use your file; live demo telemetry remains separate.");
}
function buildLapRecords(rows) {
  if (state.mappings.lap === null || state.mappings.lapTime === null) return [];
  const groups = new Map();
  rows.forEach(row => {
    if (!Number.isFinite(row.lapNumber) || !Number.isFinite(row.lapTimeSeconds) || row.lapTimeSeconds < 0) return;
    const key = row.lapNumber;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  });
  return [...groups.entries()].map(([number, samples]) => {
    samples.sort((a, b) => a.lapTimeSeconds - b.lapTimeSeconds);
    const duration = Math.max(...samples.map(s => s.lapTimeSeconds));
    const enriched = samples.map(sample => ({ ...sample, progressPercent: duration > 0 ? Math.max(0, Math.min(100, sample.lapTimeSeconds / duration * 100)) : 0, brakePercent: sample.brakePercent ?? 0, throttlePercent: sample.throttlePercent ?? 0, rpm: sample.rpm ?? 0, gear: sample.gear ?? 0, steeringDeg: sample.steeringDeg ?? 0, lateralG: sample.lateralG ?? 0, longitudinalG: sample.longitudinalG ?? 0 }));
    const finite = values => values.filter(Number.isFinite);
    const speedValues = finite(enriched.map(s => s.speedKmh));
    const brakeValues = finite(enriched.map(s => s.brakePercent));
    return { number, timeSeconds: duration, samples: enriched, topSpeedKmh: Math.max(...speedValues), averageSpeedKmh: speedValues.reduce((a, b) => a + b, 0) / speedValues.length, peakBrakePercent: Math.max(...brakeValues), sampleCount: enriched.length, source: "imported" };
  }).filter(lap => lap.samples.length >= 3 && lap.timeSeconds > 0).sort((a, b) => a.number - b.number);
}
function renderImportedCharts(rows) {
  const host = document.getElementById("importedTelemetryCharts");
  if (!host || typeof Chart === "undefined") { showMessage("Chart.js is unavailable. The file was parsed, but charts could not be rendered.", true); return; }
  state.charts.forEach(chart => chart.destroy()); state.charts = [];
  host.replaceChildren();
  const series = [
    { title: "Speed (km/h)", keys: [["Speed", "speedKmh"]] },
    { title: "RPM", keys: [["RPM", "rpm"]] },
    { title: "Throttle & Brake (%)", keys: [["Throttle", "throttlePercent"], ["Brake", "brakePercent"]] },
    { title: "Lateral & Longitudinal G", keys: [["Lateral G", "lateralG"], ["Longitudinal G", "longitudinalG"]] }
  ].filter(item => item.keys.some(([, key]) => rows.some(row => Number.isFinite(row[key]))));
  for (const item of series) {
    const card = document.createElement("div"); card.className = "imported-chart-card";
    const title = document.createElement("h3"); title.textContent = item.title;
    const wrap = document.createElement("div"); wrap.className = "imported-chart-canvas";
    const canvas = document.createElement("canvas"); canvas.setAttribute("role", "img"); canvas.setAttribute("aria-label", `Imported ${item.title}`);
    wrap.appendChild(canvas); card.append(title, wrap); host.appendChild(card);
    const datasets = item.keys.filter(([, key]) => rows.some(row => Number.isFinite(row[key]))).map(([label, key]) => ({
      label, data: rows.map(row => ({ x: row.timeSeconds, y: row[key] ?? null })), borderWidth: 2, pointRadius: 0, spanGaps: true, tension: .12
    }));
    state.charts.push(new Chart(canvas, { type: "line", data: { datasets }, options: {
      responsive: true, maintainAspectRatio: false, animation: false, parsing: false,
      interaction: { mode: "index", intersect: false },
      plugins: { legend: { labels: { color: "#cbd5e1" } } },
      scales: { x: { type: "linear", title: { display: true, text: "Time (s)", color: "#9aa6b5" }, ticks: { color: "#9aa6b5" }, grid: { color: "rgba(142,154,170,.12)" } }, y: { title: { display: true, text: item.title, color: "#9aa6b5" }, ticks: { color: "#9aa6b5" }, grid: { color: "rgba(142,154,170,.12)" } } }
    }}));
  }
}
function clearDataset() {
  state.loadedRows = []; state.fileName = ""; state.mappings = {};
  state.charts.forEach(chart => chart.destroy()); state.charts = [];
  document.getElementById("importedTelemetryCharts")?.replaceChildren();
  document.getElementById("telemetryImportSummary")?.replaceChildren();
  document.getElementById("telemetryPreviewWrap")?.replaceChildren();
  document.getElementById("telemetryCsvFile").value = "";
  document.getElementById("telemetryImportStatus").textContent = "NO DATASET";
  showMessage("Imported dataset cleared. This does not erase live session data or captured laps.");
  if (typeof window.clearImportedLapData === "function") window.clearImportedLapData();
}
function init() { ensurePanel(); }
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
else init();
