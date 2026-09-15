export function calculateGearRatio({ engineRpm, wheelRpm }) {
    if (!Number.isFinite(engineRpm) || !Number.isFinite(wheelRpm) || engineRpm <= 0 || wheelRpm <= 0) return null;
    return engineRpm / wheelRpm;
}

export function calculateWheelRpm({ vehicleSpeedKmh, tyreDiameterM }) {
    if (!Number.isFinite(vehicleSpeedKmh) || !Number.isFinite(tyreDiameterM) || vehicleSpeedKmh < 0 || tyreDiameterM <= 0) return null;
    const speedMs = vehicleSpeedKmh / 3.6;
    return (speedMs / (Math.PI * tyreDiameterM)) * 60;
}

export function calculateVehicleSpeed({ engineRpm, gearRatio, finalDriveRatio, tyreDiameterM }) {
    if (![engineRpm, gearRatio, finalDriveRatio, tyreDiameterM].every(Number.isFinite) || engineRpm < 0 || gearRatio <= 0 || finalDriveRatio <= 0 || tyreDiameterM <= 0) return null;
    const wheelRpm = engineRpm / (gearRatio * finalDriveRatio);
    return wheelRpm * Math.PI * tyreDiameterM / 60 * 3.6;
}

export function calculateInflationLayer({ velocity, lengthScale, viscosity, density, targetYPlus, layers }) {
    if (![velocity, lengthScale, viscosity, density, targetYPlus, layers].every(Number.isFinite) || velocity <= 0 || lengthScale <= 0 || viscosity <= 0 || density <= 0 || targetYPlus <= 0 || layers < 2) return null;
    const Re = density * velocity * lengthScale / viscosity;
    const cf = Math.pow(2 * Math.log10(Re) - 0.65, -2.3);
    const tauW = 0.5 * density * velocity * velocity * cf;
    const uTau = Math.sqrt(tauW / density);
    const yP = targetYPlus * viscosity / (uTau * density);
    const firstLayer = 2 * yP;
    const delta99 = Re < 5e5 ? 4.91 * lengthScale / Math.sqrt(Re) : 0.38 * lengthScale / Math.pow(Re, 0.2);
    const ratioTarget = delta99 / firstLayer;
    const N = Math.round(layers);
    const f = r => Math.pow(r, N) - r * ratioTarget + (ratioTarget - 1);
    const df = r => N * Math.pow(r, N - 1) - ratioTarget;
    let r = 5;
    for (let i = 0; i < 50; i++) {
        const derivative = df(r);
        if (!Number.isFinite(derivative) || Math.abs(derivative) < 1e-12) break;
        const next = r - f(r) / derivative;
        if (!Number.isFinite(next) || next <= 1) break;
        if (Math.abs(next - r) < 1e-10) { r = next; break; }
        r = next;
    }
    if (!(r > 1 && Number.isFinite(r))) r = 1.01;
    return { Re, firstLayer, finalLayer: firstLayer * Math.pow(r, N - 1), delta99, growthRatio: r };
}

export function calculateInletTurbulence({ velocity, intensityPercent, lengthScale }) {
    if (![velocity, intensityPercent, lengthScale].every(Number.isFinite) || velocity <= 0 || intensityPercent < 0 || lengthScale <= 0) return null;
    const I = intensityPercent / 100;
    const Cmu = 0.09;
    const k = 1.5 * velocity * velocity * I * I;
    const epsilon = Cmu * Math.pow(k, 1.5) / lengthScale;
    const omega = epsilon / (Cmu * k);
    return { k, epsilon, omega, turbulentViscosity: k / omega };
}

export function calculateParticleSettling({ diameter, particleDensity, fluidDensity, fluidViscosity }) {
    if (![diameter, particleDensity, fluidDensity, fluidViscosity].every(Number.isFinite) || diameter <= 0 || particleDensity <= fluidDensity || fluidDensity <= 0 || fluidViscosity <= 0) return null;
    const g = 9.81;
    let velocity = g * diameter * diameter * (particleDensity - fluidDensity) / (18 * fluidViscosity);
    let reynolds = 0, dragCoefficient = 24;
    for (let i = 0; i < 100; i++) {
        reynolds = fluidDensity * velocity * diameter / fluidViscosity;
        dragCoefficient = reynolds < 1000 ? (reynolds > 0 ? 24 / reynolds * (1 + 0.15 * Math.pow(reynolds, 0.687)) : Infinity) : 0.44;
        const dragFunction = dragCoefficient * reynolds / 24;
        const updatedVelocity = g * diameter * diameter * (particleDensity - fluidDensity) / (18 * fluidViscosity * dragFunction);
        const relaxedVelocity = 0.5 * velocity + 0.5 * updatedVelocity;
        if (Math.abs(relaxedVelocity - velocity) < 1e-10) { velocity = relaxedVelocity; break; }
        velocity = relaxedVelocity;
    }
    reynolds = fluidDensity * velocity * diameter / fluidViscosity;
    dragCoefficient = reynolds < 1000 ? 24 / reynolds * (1 + 0.15 * Math.pow(reynolds, 0.687)) : 0.44;
    return { reynolds, dragCoefficient, velocity };
}

export function calculateHumidity({ temperatureC, pressurePa, relativeHumidity }) {
    if (![temperatureC, pressurePa, relativeHumidity].every(Number.isFinite) || pressurePa <= 0 || relativeHumidity < 0 || relativeHumidity > 1) return null;
    const T = temperatureC;
    const saturationKPa = T >= 0 ? 0.61121 * Math.exp((18.678 - T / 234.5) * (T / (T + 257.14))) : 0.61121 * Math.exp((23.036 - T / 333.7) * (T / (T + 279.82)));
    const saturationPressure = saturationKPa * 1000;
    const vapourPressure = relativeHumidity * saturationPressure;
    if (vapourPressure >= pressurePa) return null;
    const specificHumidity = (18.01528 / 28.96546) * vapourPressure / (pressurePa - vapourPressure);
    const absoluteHumidity = specificHumidity / (1 + specificHumidity);
    return { saturationPressure, vapourPressure, specificHumidity, absoluteHumidity };
}

export function calculateBrakeBias({ mass, cgHeight, wheelbase, staticFrontPercent, decelerationG }) {
    if (![mass, cgHeight, wheelbase, staticFrontPercent, decelerationG].every(Number.isFinite) || mass <= 0 || cgHeight <= 0 || wheelbase <= 0 || staticFrontPercent <= 0 || staticFrontPercent >= 100 || decelerationG <= 0) return null;
    const g = 9.81;
    const weight = mass * g;
    const staticFrontLoad = weight * staticFrontPercent / 100;
    const staticRearLoad = weight - staticFrontLoad;
    const loadTransfer = mass * decelerationG * g * cgHeight / wheelbase;
    const frontLoad = staticFrontLoad + loadTransfer;
    const rearLoad = staticRearLoad - loadTransfer;
    if (rearLoad <= 0) return null;
    const frontBiasPercent = frontLoad / weight * 100;
    return { staticFrontLoad, staticRearLoad, loadTransfer, frontLoad, rearLoad, frontBiasPercent, rearBiasPercent: 100 - frontBiasPercent, totalBrakingForce: mass * decelerationG * g };
}

export function calculateStoppingDistance({ speedKmh, reactionTime, decelerationG }) {
    if (![speedKmh, reactionTime, decelerationG].every(Number.isFinite) || speedKmh < 0 || reactionTime < 0 || decelerationG <= 0) return null;
    const g = 9.81;
    const speedMs = speedKmh / 3.6;
    const reactionDistance = speedMs * reactionTime;
    const brakingDistance = speedMs * speedMs / (2 * decelerationG * g);
    return { speedMs, reactionDistance, brakingDistance, totalDistance: reactionDistance + brakingDistance };
}

export function calculateCorneringSpeed({ radius, frictionCoefficient }) {
    if (![radius, frictionCoefficient].every(Number.isFinite) || radius <= 0 || frictionCoefficient <= 0) return null;
    const g = 9.81;
    const speedMs = Math.sqrt(frictionCoefficient * g * radius);
    return { speedMs, speedKmh: speedMs * 3.6, lateralG: frictionCoefficient };
}

export function calculateLateralG({ speedKmh, radius }) {
    if (![speedKmh, radius].every(Number.isFinite) || speedKmh < 0 || radius <= 0) return null;
    const speedMs = speedKmh / 3.6;
    const lateralAcceleration = (speedMs * speedMs) / radius;
    return { speedMs, lateralAcceleration, lateralG: lateralAcceleration / 9.81 };
}

export function calculateDownforce({ speedKmh, airDensity, liftCoefficient, referenceArea }) {
    if (![speedKmh, airDensity, liftCoefficient, referenceArea].every(Number.isFinite) || speedKmh < 0 || airDensity <= 0 || liftCoefficient < 0 || referenceArea <= 0) return null;
    const speedMs = speedKmh / 3.6;
    const dynamicPressure = 0.5 * airDensity * speedMs * speedMs;
    const downforceN = dynamicPressure * liftCoefficient * referenceArea;
    return { speedMs, dynamicPressure, downforceN, downforceKgf: downforceN / 9.81 };
}
