import { raceState } from "./state.js";

const style = document.createElement('style');
style.textContent = `.phase2-details{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px;margin-top:24px}.phase2-panel{background:var(--panel-2);border:1px solid var(--border);border-radius:14px;padding:22px}.phase2-panel h2{margin:0 0 16px;font-size:20px}.phase2-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.phase2-grid div{background:#0f1318;border:1px solid var(--border);border-radius:9px;padding:12px}.phase2-grid span{display:block;color:var(--muted);font-size:12px;margin-bottom:8px}.phase2-grid strong{color:var(--accent);font-size:18px;overflow-wrap:anywhere}.phase2-panel button{margin-top:16px}@media(max-width:700px){.phase2-details,.phase2-grid{grid-template-columns:1fr}}`;
document.head.appendChild(style);

const dashboard = document.querySelector('.cards');
const sessionButton = document.querySelector('#sessionButton');

if (dashboard && !document.querySelector('#phase2Details')) {
    const details = document.createElement('section');
    details.id = 'phase2Details';
    details.className = 'phase2-details';
    details.innerHTML = `
        <div class="phase2-panel" aria-label="Sector information"><h2>Sector Information</h2><div class="phase2-grid"><div><span>Current Sector</span><strong id="currentSector">S1</strong></div><div><span>Sector Time</span><strong id="sectorTime">00:00.000</strong></div><div><span>Sector Status</span><strong id="sectorStatus">READY</strong></div></div></div>
        <div class="phase2-panel" aria-label="Driver information"><h2>Driver Information</h2><div class="phase2-grid"><div><span>Driver</span><strong id="driverName">Demo Driver</strong></div><div><span>Driving Mode</span><strong id="drivingMode">Simulation</strong></div><div><span>Session State</span><strong id="driverSessionState">OFFLINE</strong></div></div></div>
        <div class="phase2-panel" aria-label="Vehicle information"><h2>Vehicle Information</h2><div class="phase2-grid"><div><span>Vehicle</span><strong id="vehicleName">Demo Race Car</strong></div><div><span>Mass</span><strong id="vehicleMass">Not set</strong></div><div><span>Wheelbase</span><strong id="vehicleWheelbase">Not set</strong></div></div></div>
        <div class="phase2-panel" aria-label="Session summary"><h2>Session Summary</h2><div class="phase2-grid"><div><span>Session Duration</span><strong id="summaryDuration">00:00:00</strong></div><div><span>Peak Speed</span><strong id="summaryPeakSpeed">0 km/h</strong></div><div><span>Peak RPM</span><strong id="summaryPeakRpm">0</strong></div></div><button id="resetDashboardButton" type="button">Reset Dashboard</button></div>`;
    dashboard.after(details);
}

const peak = { speed: 0, rpm: 0 };
const text = (id, value) => { const node = document.querySelector(`#${id}`); if (node) node.textContent = value; };
const formatSectorTime = seconds => { const mins = Math.floor(seconds / 60); const secs = Math.floor(seconds % 60); const ms = Math.floor((seconds % 1) * 1000); return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(3, '0')}`; };

function updatePhase2() {
    const elapsed = raceState.session.elapsedSeconds;
    const sector = Math.min(3, Math.floor(elapsed / 20) + 1);
    peak.speed = Math.max(peak.speed, raceState.vehicle.speedKmh || 0);
    peak.rpm = Math.max(peak.rpm, raceState.vehicle.rpm || 0);
    text('currentSector', `S${sector}`);
    text('sectorTime', formatSectorTime(elapsed % 20));
    text('sectorStatus', raceState.session.active ? 'LIVE' : 'READY');
    text('driverSessionState', raceState.session.active ? 'ACTIVE' : 'OFFLINE');
    text('summaryDuration', document.querySelector('#sessionTimer')?.textContent || '00:00:00');
    text('summaryPeakSpeed', `${peak.speed} km/h`);
    text('summaryPeakRpm', String(peak.rpm));
    text('vehicleName', raceState.vehicleInfo.name || 'Demo Race Car');
    text('vehicleMass', raceState.vehicleInfo.massKg == null ? 'Not set' : `${raceState.vehicleInfo.massKg} kg`);
    text('vehicleWheelbase', raceState.vehicleInfo.wheelbaseM == null ? 'Not set' : `${raceState.vehicleInfo.wheelbaseM} m`);
}

function resetDashboard() {
    peak.speed = 0;
    peak.rpm = 0;
    text('currentSector', 'S1');
    text('sectorTime', '00:00.000');
    text('sectorStatus', raceState.session.active ? 'LIVE' : 'READY');
    text('summaryDuration', '00:00:00');
    text('summaryPeakSpeed', '0 km/h');
    text('summaryPeakRpm', '0');
}

document.querySelector('#resetDashboardButton')?.addEventListener('click', () => {
    resetDashboard();
    updatePhase2();
});

setInterval(updatePhase2, 100);
sessionButton?.addEventListener('click', () => { if (!raceState.session.active) resetDashboard(); updatePhase2(); });
