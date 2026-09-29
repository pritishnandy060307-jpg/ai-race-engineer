import { raceState } from "./state.js";
import { updateTelemetryUI } from "./ui.js";

const STORAGE_KEY = "aiRaceEngineer.setupSnapshots.v1";
let socket = null;
let playbackTimer = null;
let csvRows = [];
let csvIndex = 0;

const style = document.createElement("style");
style.textContent = `
.engineering-upgrades{display:grid;gap:18px;margin:18px 0}
.upgrade-panel{background:linear-gradient(145deg,#151b22,#10151b);border:1px solid #2b3440;border-radius:12px;padding:18px}
.upgrade-panel h2{margin:0 0 8px}.upgrade-panel p{color:#8e9aaa}
.source-badge{display:inline-flex;padding:5px 9px;border-radius:999px;background:rgba(255,106,0,.12);border:1px solid rgba(255,106,0,.3);font-size:12px;letter-spacing:.5px}
.connection-grid,.upgrade-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px}
.upgrade-panel label{display:grid;gap:6px;color:#aeb7c4;font-size:13px}.upgrade-panel input,.upgrade-panel select{width:100%;padding:10px;border-radius:8px;border:1px solid #34404d;background:#0b1015;color:#fff}
.upgrade-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}.upgrade-actions button{padding:10px 14px;border-radius:8px;border:1px solid #3a4653;background:#1b232d;color:#fff;cursor:pointer}.upgrade-actions button.primary{background:#ff6a00;border-color:#ff6a00;color:#111}
.track-wrap{display:grid;grid-template-columns:minmax(0,2fr) minmax(220px,1fr);gap:16px;align-items:stretch}.track-map{min-height:330px;background:#080c10;border:1px solid #29333e;border-radius:10px;padding:10px}.track-map svg{width:100%;height:100%;min-height:300px}.track-line{fill:none;stroke:#596575;stroke-width:42;stroke-linecap:round;stroke-linejoin:round}.track-center{fill:none;stroke:#d8dee6;stroke-width:2;stroke-dasharray:8 8}.car-dot{fill:#ff6a00;stroke:#fff;stroke-width:2}.sector-line{stroke:#ff6a00;stroke-width:3;opacity:.55}.track-stats{display:grid;gap:10px;align-content:start}.track-stat{padding:12px;border:1px solid #2b3440;border-radius:9px;background:#11171e}.track-stat span{display:block;color:#8e9aaa;font-size:12px}.track-stat strong{display:block;font-size:22px;margin-top:3px}
.model-results{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-top:14px}.model-result{padding:12px;border:1px solid #2b3440;border-radius:9px;background:#11171e}.model-result span{display:block;color:#8e9aaa;font-size:12px}.model-result strong{display:block;font-size:20px;margin-top:3px}
.snapshot-list{display:grid;gap:8px;margin-top:12px}.snapshot{display:flex;justify-content:space-between;gap:10px;align-items:center;padding:9px 11px;border:1px solid #2b3440;border-radius:8px}.snapshot small{color:#8e9aaa}.source-help{font-size:12px!important}
@media(max-width:800px){.track-wrap{grid-template-columns:1fr}}
`;
document.head.appendChild(style);

function panel(html){const el=document.createElement("section");el.className="upgrade-panel";el.innerHTML=html;return el;}
function show(id,text){const el=document.getElementById(id);if(el)el.textContent=text;}
function num(id){return Number.parseFloat(document.getElementById(id)?.value);}

function createUpgrades(){
 if(document.querySelector(".engineering-upgrades")) return;
 const root=document.createElement("div"); root.className="engineering-upgrades";
 root.innerHTML=`
 <section class="upgrade-panel" id="telemetrySourcePanel">
  <div style="display:flex;justify-content:space-between;gap:10px;align-items:center"><div><h2>Telemetry Source</h2><p>Make the data origin explicit. Demo mode is simulated; WebSocket mode is for a local simulator/CAN bridge; CSV mode replays recorded data.</p></div><span class="source-badge" id="telemetrySourceBadge">DEMO SIMULATION</span></div>
  <div class="connection-grid">
   <label>Source<select id="telemetrySource"><option value="demo">Demo simulation</option><option value="websocket">WebSocket bridge</option><option value="csv">CSV replay</option></select></label>
   <label>WebSocket URL<input id="telemetryWsUrl" value="ws://localhost:8765" placeholder="ws://localhost:8765"></label>
   <label>CSV file<input id="telemetryCsv" type="file" accept=".csv,text/csv"></label>
  </div>
  <div class="upgrade-actions"><button class="primary" id="connectTelemetry">Connect / Load</button><button id="disconnectTelemetry">Disconnect</button><button id="exportTelemetry">Export Session JSON</button></div>
  <p class="source-help">Expected live JSON fields: speedKmh, rpm, gear, throttlePercent, brakePercent, steeringDeg, lateralG, longitudinalG. GPS fields lat/lon are optional.</p>
 </section>
 <section class="upgrade-panel" id="trackAnalysisPanel">
  <h2>Track Position & Spatial Analysis</h2><p>Trackside analysis needs distance/position context. The map below is a spatially aware demo circuit until GPS data is supplied by the telemetry bridge.</p>
  <div class="track-wrap"><div class="track-map"><svg viewBox="0 0 900 500" aria-label="Track map"><path class="track-line" d="M170 360 C80 290 100 125 230 95 C355 65 420 160 500 125 C610 75 790 115 760 250 C735 365 590 415 470 355 C370 305 300 430 170 360 Z"/><path class="track-center" d="M170 360 C80 290 100 125 230 95 C355 65 420 160 500 125 C610 75 790 115 760 250 C735 365 590 415 470 355 C370 305 300 430 170 360 Z"/><line class="sector-line" x1="230" y1="95" x2="255" y2="135"/><line class="sector-line" x1="500" y1="125" x2="515" y2="168"/><circle id="trackCar" class="car-dot" cx="170" cy="360" r="9"/></svg></div>
   <div class="track-stats"><div class="track-stat"><span>Data source</span><strong id="trackSource">Demo</strong></div><div class="track-stat"><span>Track distance</span><strong id="trackDistance">0.00 km</strong></div><div class="track-stat"><span>Sector</span><strong id="trackSector">S1</strong></div><div class="track-stat"><span>Position</span><strong id="trackPosition">No GPS</strong></div><div class="track-stat"><span>Spatial status</span><strong id="spatialStatus">SIMULATED</strong></div></div>
  </div>
 </section>
 <section class="upgrade-panel" id="integratedModelPanel">
  <h2>Integrated Vehicle Model</h2><p>Links aero and vehicle dynamics so downforce does not have to be manually copied into another calculator. This is still a simplified engineering model, not a tyre/suspension multibody solver.</p>
  <div class="upgrade-grid">
   <label>Mass (kg)<input id="imMass" type="number" value="250"></label><label>Corner radius (m)<input id="imRadius" type="number" value="20"></label><label>Tyre μ<input id="imMu" type="number" value="1.5" step="0.01"></label><label>C<sub>L</sub><input id="imCl" type="number" value="2.0" step="0.01"></label><label>Reference area (m²)<input id="imArea" type="number" value="1.2" step="0.01"></label><label>Air density (kg/m³)<input id="imRho" type="number" value="1.225" step="0.001"></label><label>Current speed (km/h)<input id="imSpeed" type="number" value="100"></label><label>Front aero share (%)<input id="imFrontAero" type="number" value="45"></label><label>Brake decel (g)<input id="imBrakeG" type="number" value="1.5" step="0.01"></label><label>CG height (m)<input id="imCg" type="number" value="0.30" step="0.01"></label><label>Wheelbase (m)<input id="imWheelbase" type="number" value="1.60" step="0.01"></label><label>Static front weight (%)<input id="imStaticFront" type="number" value="45"></label>
  </div>
  <div class="upgrade-actions"><button class="primary" id="calculateIntegrated">Run Vehicle Model</button></div>
  <div class="model-results"><div class="model-result"><span>Current downforce</span><strong id="imDownforce">—</strong></div><div class="model-result"><span>Aero-adjusted corner speed</span><strong id="imCornerSpeed">—</strong></div><div class="model-result"><span>Cornering lateral G</span><strong id="imCornerG">—</strong></div><div class="model-result"><span>Predicted front brake bias</span><strong id="imBrakeBias">—</strong></div></div>
 </section>
 <section class="upgrade-panel" id="setupManagerPanel">
  <h2>Setup Manager</h2><p>Save, compare and export a vehicle setup instead of manually re-entering calculator values between runs.</p>
  <div class="upgrade-actions"><button class="primary" id="saveSetup">Save Current Setup</button><button id="compareSetups">Compare Last Two</button><button id="exportSetups">Export Setups JSON</button><button id="clearSetups">Clear Saved Setups</button></div>
  <div class="snapshot-list" id="snapshotList"></div><p id="setupComparison" class="source-help"></p>
 </section>`;
 document.querySelector(".cards")?.after(root);
}

function applyTelemetry(t, source="LIVE"){
 if(!t)return;
 const telemetry={...t,speedKmh:Number(t.speedKmh??t.speed??0),rpm:Number(t.rpm??0),gear:Number(t.gear??1),throttlePercent:Number(t.throttlePercent??t.throttle??0),brakePercent:Number(t.brakePercent??t.brake??0),steeringDeg:Number(t.steeringDeg??t.steering??0),lateralG:Number(t.lateralG??0),longitudinalG:Number(t.longitudinalG??0)};
 raceState.vehicle.speedKmh=telemetry.speedKmh;raceState.vehicle.rpm=telemetry.rpm;raceState.vehicle.gear=telemetry.gear;raceState.vehicle.throttlePercent=telemetry.throttlePercent;raceState.vehicle.brakePercent=telemetry.brakePercent;
 window.raceTelemetry=telemetry; updateTelemetryUI(telemetry);
 document.getElementById("telemetrySourceBadge").textContent=source;
 document.getElementById("trackSource").textContent=source;
 const lat=telemetry.lat??telemetry.latitude,lon=telemetry.lon??telemetry.longitude;
 document.getElementById("trackPosition").textContent=Number.isFinite(Number(lat))&&Number.isFinite(Number(lon))?\`${Number(lat).toFixed(5)}, ${Number(lon).toFixed(5)}\`:"No GPS";
 document.getElementById("spatialStatus").textContent=Number.isFinite(Number(lat))&&Number.isFinite(Number(lon))?"GPS LIVE":"SIMULATED";
 updateTrack(telemetry);
}

function updateTrack(t){
 const progress=((Number(t.distanceM)||((raceState.session.elapsedSeconds%20)/20)*3000)%3000)/3000;
 const pts=[{x:170,y:360},{x:105,y:210},{x:230,y:95},{x:380,y:120},{x:500,y:125},{x:650,y:95},{x:760,y:250},{x:650,y:355},{x:470,y:355},{x:300,y:410}];
 const f=progress*(pts.length-1),i=Math.floor(f),r=f-i,a=pts[i]||pts[0],b=pts[Math.min(i+1,pts.length-1)];
 const x=a.x+(b.x-a.x)*r,y=a.y+(b.y-a.y)*r;
 document.getElementById("trackCar")?.setAttribute("transform",\`translate(${x-170},${y-360})\`);
 show("trackDistance",`${(progress*3).toFixed(2)} km\`);
 show("trackSector",progress<1/3?"S1":progress<2/3?"S2":"S3");
}

function connectWebSocket(){
 disconnectTelemetry(); const url=document.getElementById("telemetryWsUrl").value.trim();
 try{socket=new WebSocket(url);socket.onopen=()=>{show("telemetrySourceBadge","WEBSOCKET LIVE");show("spatialStatus","WAITING DATA")};socket.onmessage=e=>{try{applyTelemetry(JSON.parse(e.data),"WEBSOCKET LIVE")}catch{}};socket.onclose=()=>show("telemetrySourceBadge","WEBSOCKET OFFLINE");socket.onerror=()=>show("telemetrySourceBadge","WEBSOCKET ERROR")}catch{show("telemetrySourceBadge","INVALID URL")}
}
function disconnectTelemetry(){if(socket){socket.close();socket=null}if(playbackTimer){clearInterval(playbackTimer);playbackTimer=null}}
function parseCsv(text){const lines=text.trim().split(/\\r?\\n/).filter(Boolean);if(lines.length<2)return[];const headers=lines[0].split(",").map(x=>x.trim());return lines.slice(1).map(line=>{const values=line.split(",");const row={};headers.forEach((h,i)=>row[h]=values[i]?.trim());return row})}
function startCsv(file){const reader=new FileReader();reader.onload=()=>{csvRows=parseCsv(reader.result);csvIndex=0;disconnectTelemetry();playbackTimer=setInterval(()=>{if(csvIndex>=csvRows.length){clearInterval(playbackTimer);playbackTimer=null;return}applyTelemetry(csvRows[csvIndex++],"CSV REPLAY")},200)};reader.readAsText(file)}

function integratedModel(){
 const m=num("imMass"),r=num("imRadius"),mu=num("imMu"),cl=num("imCl"),A=num("imArea"),rho=num("imRho"),speed=num("imSpeed"),frontAero=num("imFrontAero"),decel=num("imBrakeG"),h=num("imCg"),L=num("imWheelbase"),frontStatic=num("imStaticFront");
 if([m,r,mu,cl,A,rho,speed,frontAero,decel,h,L,frontStatic].some(x=>!Number.isFinite(x)||x<=0)||frontAero>100||frontStatic>100){show("imDownforce","Check inputs");return}
 const g=9.81,v=speed/3.6,k=.5*rho*cl*A,df=k*v*v,den=m-mu*r*k;
 const cornerV=den>0?Math.sqrt(mu*r*m*g/den):NaN;
 const cornerG=(cornerV*cornerV/r)/g;
 const frontDf=df*frontAero/100,transfer=m*decel*g*h/L;
 const frontBrake=(m*g*frontStatic/100+frontDf+transfer)/(m*g+df)*100;
 show("imDownforce",\`${df.toFixed(0)} N\`);show("imCornerSpeed",Number.isFinite(cornerV)?\`${(cornerV*3.6).toFixed(1)} km/h\`:"Aero limit");show("imCornerG",Number.isFinite(cornerG)?\`${cornerG.toFixed(2)} g\`:"—");show("imBrakeBias",\`${Math.min(100,Math.max(0,frontBrake)).toFixed(1)}% F / ${(100-Math.min(100,Math.max(0,frontBrake))).toFixed(1)}% R\`);
}

function captureSetup(){
 const values={};document.querySelectorAll(".calculator-section input,.calculator-section select,#integratedModelPanel input").forEach(el=>{if(el.id)values[el.id]=el.value});return{timestamp:new Date().toISOString(),values};
}
function getSetups(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||"[]")}catch{return[]}}
function saveSetup(){const list=getSetups();list.push(captureSetup());localStorage.setItem(STORAGE_KEY,JSON.stringify(list.slice(-10)));renderSetups()}
function renderSetups(){const list=getSetups();const el=document.getElementById("snapshotList");if(!el)return;el.innerHTML=list.length?list.map((s,i)=>\`<div class="snapshot"><span>Setup ${i+1}<br><small>${new Date(s.timestamp).toLocaleString()}</small></span><strong>${Object.keys(s.values).length} parameters</strong></div>\`).join(""):"<div class='snapshot'><small>No saved setups yet.</small></div>"}
function compareSetups(){const list=getSetups();if(list.length<2){show("setupComparison","Save at least two setups to compare.");return}const a=list.at(-2).values,b=list.at(-1).values;const keys=[...new Set([...Object.keys(a),...Object.keys(b)])];const changed=keys.filter(k=>a[k]!==b[k]);show("setupComparison",changed.length?\`Last two setups differ in: ${changed.join(", ")}\`:"The last two setups are identical.")}
function exportJson(data,name){const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;a.click();URL.revokeObjectURL(a.href)}

document.addEventListener("DOMContentLoaded",()=>{
 createUpgrades();renderSetups();
 document.getElementById("telemetrySource").addEventListener("change",e=>{document.getElementById("telemetryWsUrl").disabled=e.target.value!=="websocket";document.getElementById("telemetryCsv").disabled=e.target.value!=="csv"});
 document.getElementById("connectTelemetry").onclick=()=>{const source=document.getElementById("telemetrySource").value;if(source==="websocket")connectWebSocket();else if(source==="csv"){const f=document.getElementById("telemetryCsv").files[0];if(f)startCsv(f);else show("telemetrySourceBadge","SELECT CSV")}else{disconnectTelemetry();show("telemetrySourceBadge","DEMO SIMULATION");}};
 document.getElementById("disconnectTelemetry").onclick=disconnectTelemetry;
 document.getElementById("calculateIntegrated").onclick=integratedModel;
 document.getElementById("saveSetup").onclick=saveSetup;
 document.getElementById("compareSetups").onclick=compareSetups;
 document.getElementById("exportSetups").onclick=()=>exportJson(getSetups(),"race-engineer-setups.json");
 document.getElementById("exportTelemetry").onclick=()=>exportJson({exportedAt:new Date().toISOString(),vehicle:raceState.vehicle,lap:raceState.lap,telemetry:window.raceTelemetry||null},"race-engineer-session.json");
 document.getElementById("clearSetups").onclick=()=>{localStorage.removeItem(STORAGE_KEY);renderSetups();show("setupComparison","Saved setups cleared.")};
 document.getElementById("telemetryWsUrl").disabled=true;document.getElementById("telemetryCsv").disabled=true;
 setInterval(()=>{if(!socket&&document.getElementById("telemetrySource")?.value==="demo"&&window.raceTelemetry)applyTelemetry(window.raceTelemetry,"DEMO SIMULATION")},500);
});
