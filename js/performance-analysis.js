import { raceState } from "./state.js";

const state = { lastElapsed: 0, lastRenderKey: "" };

function formatLapTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return "—";
    const minutes = Math.floor(seconds / 60);
    const remainder = seconds - minutes * 60;
    return `${String(minutes).padStart(2, "0")}:${remainder.toFixed(3).padStart(6, "0")}`;
}
function finite(values) { return values.filter(Number.isFinite); }
function average(values) { const valid = finite(values); return valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : null; }
function max(values) { const valid = finite(values); return valid.length ? Math.max(...valid) : null; }
function pct(value, digits = 0) { return Number.isFinite(value) ? `${value.toFixed(digits)}%` : "—"; }
function seconds(value) { return Number.isFinite(value) ? `${value.toFixed(3)} s` : "—"; }

function createPanel() {
    if (document.getElementById("performanceAnalysis")) return;
    const section = document.createElement("section");
    section.id = "performanceAnalysis";
    section.className = "performance-analysis telemetry-section";
    section.innerHTML = `
        <div class="phase2-heading"><div><h2>Driver Performance Analysis</h2><p class="calculator-description">Evidence-based lap consistency, driving-input metrics and areas to review.</p></div></div>
        <div class="phase2-grid performance-grid">
            <div class="phase2-card"><span>Completed Laps</span><strong id="performanceCompleted">0</strong></div>
            <div class="phase2-card"><span>Average Lap</span><strong id="performanceAverage">—</strong></div>
            <div class="phase2-card"><span>Fastest Lap</span><strong id="performanceFastest">—</strong></div>
            <div class="phase2-card"><span>Consistency (σ)</span><strong id="performanceConsistency">—</strong></div>
        </div>
        <div id="performanceLapList" class="session-summary"><strong>Lap comparison</strong><span>Complete laps to see deltas.</span></div>
        <div class="phase2-heading performance-subheading"><div><h3>Telemetry review</h3><p class="calculator-description">Uses captured samples; normalized progress is a proxy, not a physical track sector.</p></div></div>
        <div id="performanceTelemetryMetrics" class="performance-telemetry-metrics">
            <p>Complete at least one captured lap to build a telemetry review.</p>
        </div>
        <div id="performanceRecommendations" class="performance-recommendations" aria-live="polite">
            <p>Recommendations appear when enough telemetry is available.</p>
        </div>`;
    const style = document.createElement("style");
    style.id = "performance-analysis-phase3c-styles";
    style.textContent = `
      #performanceAnalysis .performance-subheading{margin-top:1.2rem}
      #performanceAnalysis .performance-telemetry-metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:12px 0}
      #performanceAnalysis .performance-metric{padding:12px;border:1px solid var(--border,#2b3440);border-radius:8px;background:var(--panel-2,#191f27);min-width:0}
      #performanceAnalysis .performance-metric span{display:block;color:var(--muted,#8e9aaa);font-size:.78rem}
      #performanceAnalysis .performance-metric strong{display:block;margin-top:5px;overflow-wrap:anywhere}
      #performanceAnalysis .performance-recommendations{display:grid;gap:8px;margin-top:10px}
      #performanceAnalysis .performance-recommendation{padding:10px 12px;border-left:3px solid var(--accent,#ff6a00);background:var(--panel-2,#191f27);border-radius:6px;line-height:1.45}
      #performanceAnalysis .performance-recommendation strong{display:block;margin-bottom:3px}
      #performanceAnalysis .performance-muted{color:var(--muted,#8e9aaa)}
      @media(max-width:700px){#performanceAnalysis .performance-telemetry-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}
    `;
    document.head.appendChild(style);
    const dashboard = document.getElementById("phase2Dashboard");
    const firstCalculator = document.querySelector(".calculator-section");
    (dashboard || firstCalculator)?.after(section);
}

function resetPanel() {
    for (const [id, value] of [["performanceCompleted","0"],["performanceAverage","—"],["performanceFastest","—"],["performanceConsistency","—"]]) {
        document.getElementById(id)?.replaceChildren(document.createTextNode(value));
    }
    const list = document.getElementById("performanceLapList");
    if (list) list.innerHTML = "<strong>Lap comparison</strong><span>Complete laps to see deltas.</span>";
    const metrics = document.getElementById("performanceTelemetryMetrics");
    if (metrics) metrics.innerHTML = "<p>Complete at least one captured lap to build a telemetry review.</p>";
    const recommendations = document.getElementById("performanceRecommendations");
    if (recommendations) recommendations.innerHTML = "<p>Recommendations appear when enough telemetry is available.</p>";
}

function getLapStats(lap) {
    const samples = Array.isArray(lap.samples) ? lap.samples : [];
    const brakes = samples.map(s => Number(s.brakePercent)).filter(Number.isFinite);
    const throttles = samples.map(s => Number(s.throttlePercent)).filter(Number.isFinite);
    const speeds = samples.map(s => Number(s.speedKmh)).filter(Number.isFinite);
    const lateral = samples.map(s => Math.abs(Number(s.lateralG))).filter(Number.isFinite);
    const brakeStart = samples.find(s => Number(s.brakePercent) >= 20);
    const throttleAfterBrake = samples.find(s => Number(s.brakePercent) >= 20 && samples.some(later => later.lapTimeSeconds > s.lapTimeSeconds && Number(later.throttlePercent) >= 80));
    const brakingSamples = brakes.filter(v => v >= 20).length;
    const coastingSamples = samples.filter(s => Number(s.brakePercent) < 10 && Number(s.throttlePercent) < 10 && Number(s.speedKmh) > 15).length;
    return {
        lap, samples, averageThrottle: average(throttles), peakBrake: max(brakes),
        averageSpeed: average(speeds), topSpeed: max(speeds), peakLateralG: max(lateral),
        brakingShare: samples.length ? brakingSamples / samples.length * 100 : null,
        coastingShare: samples.length ? coastingSamples / samples.length * 100 : null,
        brakeStartProgress: brakeStart && Number.isFinite(brakeStart.progressPercent) ? brakeStart.progressPercent : null,
        throttleAfterBrakeProgress: throttleAfterBrake && Number.isFinite(throttleAfterBrake.progressPercent) ? throttleAfterBrake.progressPercent : null
    };
}

function largestSpeedGap(reference, comparison) {
    if (!reference?.samples?.length || !comparison?.samples?.length) return null;
    let best = null;
    for (let start = 0; start < 100; start += 5) {
        const end = start + 5;
        const a = reference.samples.filter(s => s.progressPercent >= start && s.progressPercent < end).map(s => Number(s.speedKmh));
        const b = comparison.samples.filter(s => s.progressPercent >= start && s.progressPercent < end).map(s => Number(s.speedKmh));
        const meanA = average(a), meanB = average(b);
        if (meanA === null || meanB === null) continue;
        const gap = meanA - meanB;
        if (!best || gap > best.gap) best = { start, end, gap };
    }
    return best && best.gap > 2 ? best : null;
}

function renderTelemetryReview(laps) {
    const metricsEl = document.getElementById("performanceTelemetryMetrics");
    const recEl = document.getElementById("performanceRecommendations");
    if (!metricsEl || !recEl) return;
    const stats = laps.map(getLapStats).filter(item => item.samples.length >= 3);
    if (!stats.length) {
        metricsEl.innerHTML = "<p>Telemetry samples are not available yet. Keep a session running to record a completed lap.</p>";
        recEl.innerHTML = "<p>Recommendations need a completed lap with recorded samples.</p>";
        return;
    }
    const fastest = [...stats].sort((a, b) => a.lap.timeSeconds - b.lap.timeSeconds)[0];
    const selected = stats[stats.length - 1];
    const tiles = [
        ["Average throttle", pct(selected.averageThrottle, 1)],
        ["Samples with braking ≥20%", pct(selected.brakingShare, 1)],
        ["Coasting samples", pct(selected.coastingShare, 1)],
        ["Peak lateral acceleration", Number.isFinite(selected.peakLateralG) ? `${selected.peakLateralG.toFixed(2)} g` : "—"],
        ["First firm brake input", Number.isFinite(selected.brakeStartProgress) ? `${selected.brakeStartProgress.toFixed(0)}% progress` : "Not observed"],
        ["Peak brake input", pct(selected.peakBrake, 1)]
    ];
    metricsEl.innerHTML = tiles.map(([label, value]) => `<div class="performance-metric"><span>${label}</span><strong>${value}</strong></div>`).join("");

    const recommendations = [];
    const gap = largestSpeedGap(fastest.lap, selected.lap);
    if (selected.lap.number !== fastest.lap.number) {
        const delta = selected.lap.timeSeconds - fastest.lap.timeSeconds;
        recommendations.push({
            title: delta > 0 ? `Lap ${selected.lap.number} is ${delta.toFixed(3)} s slower than your fastest` : `Lap ${selected.lap.number} is ${Math.abs(delta).toFixed(3)} s faster than your previous reference`,
            text: gap ? `The largest average-speed deficit versus Lap ${fastest.lap.number} is around ${gap.start}–${gap.end}% normalized lap progress (${gap.gap.toFixed(1)} km/h). Review the speed trace and pedal inputs in this window; this is not a GPS-defined sector.` : "Review the speed overlay and driving inputs to locate where the time difference develops."
        });
    }
    if (selected.brakingShare !== null && selected.brakingShare > 30) {
        recommendations.push({title:"High braking-sample share",text:`${selected.brakingShare.toFixed(1)}% of captured samples have brake input ≥20%. Check whether this reflects the circuit layout, sample rate, or prolonged braking; it is a telemetry flag, not proof of a mistake.`});
    }
    if (selected.coastingShare !== null && selected.coastingShare > 18) {
        recommendations.push({title:"Review extended coasting",text:`${selected.coastingShare.toFixed(1)}% of samples show speed above 15 km/h with both pedals below 10%. Inspect those trace regions to determine whether coasting is intentional or time can be recovered.`});
    }
    if (selected.averageThrottle !== null && selected.averageThrottle < 35) {
        recommendations.push({title:"Low average throttle in captured samples",text:"Check whether the lap includes long lift phases, low-speed sections, or incomplete telemetry. Compare against a representative lap before changing driving technique."});
    }
    if (!recommendations.length) recommendations.push({title:"No strong anomaly from the available samples",text:"Compare laps with similar conditions and use the synchronized speed, throttle and brake traces before changing setup or driving technique."});
    recEl.innerHTML = recommendations.slice(0, 3).map(item => `<div class="performance-recommendation"><strong>${item.title}</strong><span>${item.text}</span></div>`).join("");
}

function updatePanel() {
    const elapsed = Number(raceState.session.elapsedSeconds) || 0;
    if (elapsed < state.lastElapsed || (elapsed === 0 && state.lastElapsed > 0)) {
        state.lastElapsed = 0;
        state.lastRenderKey = "";
        resetPanel();
    }
    state.lastElapsed = elapsed;
    let times = Array.isArray(raceState.lap.completedTimes)
        ? raceState.lap.completedTimes.map(Number).filter(value => Number.isFinite(value) && value > 0)
        : [];
    const laps = typeof window.getLapComparisonData === "function" ? window.getLapComparisonData() : [];
    if (laps.some(lap => lap.source === "imported")) {
        times = laps.filter(lap => lap.source === "imported").map(lap => Number(lap.timeSeconds)).filter(value => Number.isFinite(value) && value > 0);
    }
    const key = `${times.length}:${laps.map(lap => `${lap.number}-${lap.sampleCount}`).join(",")}`;
    if (key === state.lastRenderKey) return;
    state.lastRenderKey = key;
    if (times.length) {
        const averageTime = average(times);
        const fastest = Math.min(...times);
        const variance = average(times.map(time => (time - averageTime) ** 2));
        document.getElementById("performanceCompleted")?.replaceChildren(document.createTextNode(String(times.length)));
        document.getElementById("performanceAverage")?.replaceChildren(document.createTextNode(formatLapTime(averageTime)));
        document.getElementById("performanceFastest")?.replaceChildren(document.createTextNode(formatLapTime(fastest)));
        document.getElementById("performanceConsistency")?.replaceChildren(document.createTextNode(`${Math.sqrt(variance).toFixed(3)} s`));
        const list = document.getElementById("performanceLapList");
        if (list) {
            list.innerHTML = `<strong>Lap-by-lap delta (negative is faster than the previous lap)</strong>` + times.map((time, index) => {
                const delta = index === 0 ? "baseline" : `${time - times[index - 1] >= 0 ? "+" : ""}${(time - times[index - 1]).toFixed(3)} s`;
                return `<span>Lap ${index + 1}: <strong>${formatLapTime(time)}</strong> <small>(${delta})</small></span>`;
            }).join("");
        }
    } else {
        resetPanel();
    }
    renderTelemetryReview(laps);
}

function init() {
    createPanel();
    resetPanel();
    setInterval(updatePanel, 500);
    updatePanel();
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
else init();
