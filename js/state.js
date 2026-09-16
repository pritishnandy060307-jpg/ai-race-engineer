// Shared project-wide race data model.
// Future telemetry, calculators and analysis modules can use this same state.

export const raceState = {
    session: {
        active: false,
        elapsedSeconds: 0,
        status: "OFFLINE"
    },

    vehicle: {
        speedKmh: 0,
        rpm: 0,
        gear: 1,
        throttlePercent: 0,
        brakePercent: 0
    },

    lap: {
        number: 1,
        currentTimeSeconds: 0,
        targetTimeSeconds: 20,
        bestTimeSeconds: null,
        deltaSeconds: null,
        completedTimes: []
    },

    telemetry: {
        speed: [],
        rpm: [],
        throttle: [],
        brake: [],
        gear: [],
        timestamps: []
    },

    vehicleInfo: {
        name: "Demo Race Car",
        massKg: null,
        wheelbaseM: null
    }
};

export function resetRaceState() {
    raceState.session.active = false;
    raceState.session.elapsedSeconds = 0;
    raceState.session.status = "OFFLINE";

    raceState.vehicle.speedKmh = 0;
    raceState.vehicle.rpm = 0;
    raceState.vehicle.gear = 1;
    raceState.vehicle.throttlePercent = 0;
    raceState.vehicle.brakePercent = 0;

    raceState.lap.number = 1;
    raceState.lap.currentTimeSeconds = 0;
    raceState.lap.targetTimeSeconds = 20;
    raceState.lap.bestTimeSeconds = null;
    raceState.lap.deltaSeconds = null;
    raceState.lap.completedTimes.length = 0;

    // Telemetry is replaced by the generator with scalar live values.
    // Recreate the expected empty telemetry structure so a new session
    // can always be started safely after a previous session ends.
    raceState.telemetry = {
        speed: [],
        rpm: [],
        throttle: [],
        brake: [],
        gear: [],
        timestamps: []
    };
}
