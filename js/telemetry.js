export function generateTelemetry(sessionSeconds) {
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

    return {
        speed: Math.floor(speed),
        rpm,
        gear,
        throttle: Math.floor(throttle),
        brake: Math.floor(brake)
    };
}
