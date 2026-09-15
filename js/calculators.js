export function calculateGearRatio({ engineRpm, wheelRpm }) {
    if (!Number.isFinite(engineRpm) || !Number.isFinite(wheelRpm) || engineRpm <= 0 || wheelRpm <= 0) {
        return null;
    }

    return engineRpm / wheelRpm;
}

export function calculateWheelRpm({ vehicleSpeedKmh, tyreDiameterM }) {
    if (!Number.isFinite(vehicleSpeedKmh) || !Number.isFinite(tyreDiameterM) || vehicleSpeedKmh < 0 || tyreDiameterM <= 0) {
        return null;
    }

    const speedMs = vehicleSpeedKmh / 3.6;
    const wheelCircumference = Math.PI * tyreDiameterM;
    return (speedMs / wheelCircumference) * 60;
}

export function calculateVehicleSpeed({ engineRpm, gearRatio, finalDriveRatio, tyreDiameterM }) {
    if (![engineRpm, gearRatio, finalDriveRatio, tyreDiameterM].every(Number.isFinite) ||
        engineRpm < 0 || gearRatio <= 0 || finalDriveRatio <= 0 || tyreDiameterM <= 0) {
        return null;
    }

    const wheelRpm = engineRpm / (gearRatio * finalDriveRatio);
    const speedMs = wheelRpm * Math.PI * tyreDiameterM / 60;
    return speedMs * 3.6;
}
