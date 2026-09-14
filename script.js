const button = document.querySelector("#sessionButton");
const status = document.querySelector("#sessionStatus");
const dot = document.querySelector(".status-dot");
const timerDisplay = document.querySelector("#sessionTimer");

const speedDisplay = document.querySelector("#speed");
const rpmDisplay = document.querySelector("#rpm");
const gearDisplay = document.querySelector("#gear");
const throttleDisplay = document.querySelector("#throttle");
const brakeDisplay = document.querySelector("#brake");
const lapNumberDisplay = document.querySelector("#lapNumber");
const lapTimeDisplay = document.querySelector("#lapTime");
const bestLapDisplay = document.querySelector("#bestLap");
const lapDeltaDisplay = document.querySelector("#lapDelta");

let sessionActive = false;
let sessionSeconds = 0;
let lapNumber = 1;
let timer = null;
let telemetryTimer = null;
let bestLap = null;

const speedData = [];
const speedLabels = [];

const chart = new Chart(document.querySelector("#speedChart"), {
    type: "line",
    data: {
        labels: speedLabels,
        datasets: [{
            label: "Speed (km/h)",
            data: speedData,
            borderWidth: 2,
            tension: 0.25,
            pointRadius: 0
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        scales: {
            x: {
                title: { display: true, text: "Time (s)" }
            },
            y: {
                title: { display: true, text: "Speed (km/h)" },
                beginAtZero: true
            }
        }
    }
});

bestLapDisplay.textContent = "--:--.---";
lapDeltaDisplay.textContent = "--.---";

button.addEventListener("click", function () {
    if (!sessionActive) {
        sessionActive = true;
        sessionSeconds = 0;
        lapNumber = 1;
        bestLap = null;

        speedData.length = 0;
        speedLabels.length = 0;
        chart.update();

        lapNumberDisplay.textContent = lapNumber;
        lapTimeDisplay.textContent = "00:00.000";
        bestLapDisplay.textContent = "--:--.---";
        lapDeltaDisplay.textContent = "--.---";
        timerDisplay.textContent = "00:00:00";

        status.textContent = "SESSION ACTIVE";
        dot.style.background = "#22c55e";
        button.textContent = "End Session";

        timer = setInterval(function () {
            sessionSeconds++;

            const hours = Math.floor(sessionSeconds / 3600);
            const minutes = Math.floor((sessionSeconds % 3600) / 60);
            const seconds = sessionSeconds % 60;

            timerDisplay.textContent =
                String(hours).padStart(2, "0") + ":" +
                String(minutes).padStart(2, "0") + ":" +
                String(seconds).padStart(2, "0");

            const lapSeconds = sessionSeconds % 20;

            if (lapSeconds === 0 && sessionSeconds > 0) {
                const completedLapTime = 20;
                if (bestLap === null || completedLapTime < bestLap) {
                    bestLap = completedLapTime;
                    bestLapDisplay.textContent = "00:20.000";
                }
                lapNumber++;
                lapNumberDisplay.textContent = lapNumber;
            }

            const lapMinutes = Math.floor(lapSeconds / 60);
            const lapSecs = lapSeconds % 60;

            lapTimeDisplay.textContent =
                String(lapMinutes).padStart(2, "0") + ":" +
                String(lapSecs).padStart(2, "0") + ".000";

            if (bestLap !== null) {
                const delta = lapSeconds - bestLap;
                lapDeltaDisplay.textContent = (delta >= 0 ? "+" : "") + delta.toFixed(3) + " s";
            }
        }, 1000);

        telemetryTimer = setInterval(updateTelemetry, 500);
    } else {
        sessionActive = false;

        clearInterval(timer);
        clearInterval(telemetryTimer);
        timer = null;
        telemetryTimer = null;

        status.textContent = "OFFLINE";
        dot.style.background = "#6b7280";
        button.textContent = "Start Session";
    }
});

function updateTelemetry() {
    const t = sessionSeconds % 20;

    let speed;
    let throttle;
    let brake;

    if (t < 7) {
        speed = 120 + (t * 10);
        throttle = 90 + Math.random() * 10;
        brake = 0;
    } else if (t < 10) {
        speed = 190 - ((t - 7) * 22);
        throttle = 0;
        brake = 70 + Math.random() * 20;
    } else if (t < 14) {
        speed = 125 - ((t - 10) * 3);
        throttle = 10 + ((t - 10) * 12);
        brake = 10;
    } else {
        speed = 113 + ((t - 14) * 10);
        throttle = 60 + ((t - 14) * 7);
        brake = 0;
    }

    const rpm = Math.floor(speed * 38 + Math.random() * 300);

    let gear;
    if (speed < 50) gear = 1;
    else if (speed < 85) gear = 2;
    else if (speed < 120) gear = 3;
    else if (speed < 155) gear = 4;
    else if (speed < 180) gear = 5;
    else gear = 6;

    speedDisplay.textContent = Math.floor(speed) + " km/h";
    rpmDisplay.textContent = rpm;
    gearDisplay.textContent = gear;
    throttleDisplay.textContent = Math.floor(throttle) + "%";
    brakeDisplay.textContent = Math.floor(brake) + "%";

    speedLabels.push(sessionSeconds.toFixed(1));
    speedData.push(Math.floor(speed));

    if (speedLabels.length > 60) {
        speedLabels.shift();
        speedData.shift();
    }

    chart.update();
}
