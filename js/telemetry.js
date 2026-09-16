export function generateTelemetry(sessionSeconds = performance.now() / 1000) {
    const t = sessionSeconds % 24;
    const phase = (Math.sin(t * 0.55) + 1) / 2;

    let speed;
    let throttle;
    let brake;

    if (t < 6) {
        speed = 85 + t * 15 + Math.sin(t * 2) * 3;
        throttle = 65 + t * 5;
        brake = 0;
    } else if (t < 10) {
        speed = 175 + Math.sin((t - 6) * 1.5) * 8;
        throttle = 78 + Math.sin(t * 2) * 8;
        brake = 0;
    } else if (t < 13) {
        speed = 175 - (t - 10) * 25;
        throttle = 15;
        brake = 72 + Math.sin(t * 3) * 12;
    } else if (t < 18) {
        speed = 100 + (t - 13) * 12 + Math.sin(t * 2) * 4;
        throttle = 35 + (t - 13) * 9;
        brake = 8;
    } else {
        speed = 160 + phase * 25 + Math.sin(t * 1.8) * 5;
        throttle = 82 + Math.sin(t * 2.2) * 7;
        brake = 0;
    }

    speed = Math.max(0, speed);
    throttle = Math.max(0, Math.min(100, throttle));
    brake = Math.max(0, Math.min(100, brake));

    const rpm = Math.floor(speed * 38 + Math.sin(t * 4) * 180 + Math.random() * 160);

    let gear;
    if (speed < 50) gear = 1;
    else if (speed < 85) gear = 2;
    else if (speed < 120) gear = 3;
    else if (speed < 155) gear = 4;
    else if (speed < 180) gear = 5;
    else gear = 6;

    return {
        speedKmh: Math.floor(speed),
        rpm: Math.max(0, rpm),
        gear,
        throttlePercent: Math.floor(throttle),
        brakePercent: Math.floor(brake),
        speed: Math.floor(speed),
        throttle: Math.floor(throttle),
        brake: Math.floor(brake)
    };
}
