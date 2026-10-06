// Shared project-wide race data model.
const createTelemetryHistory = () => ({speed:[],rpm:[],throttle:[],brake:[],gear:[],steering:[],lateralG:[],longitudinalG:[],timestamps:[]});
export const raceState = {
  session:{active:false,elapsedSeconds:0,status:"OFFLINE"},
  vehicle:{speedKmh:0,rpm:0,gear:1,throttlePercent:0,brakePercent:0},
  lap:{number:1,currentTimeSeconds:0,targetTimeSeconds:20,bestTimeSeconds:null,deltaSeconds:null,completedTimes:[]},
  telemetry:{current:null,history:createTelemetryHistory()},
  vehicleInfo:{name:"Demo Race Car",massKg:null,wheelbaseM:null}
};
export function resetRaceState(){
  raceState.session={active:false,elapsedSeconds:0,status:"OFFLINE"};
  raceState.vehicle={speedKmh:0,rpm:0,gear:1,throttlePercent:0,brakePercent:0};
  raceState.lap={number:1,currentTimeSeconds:0,targetTimeSeconds:20,bestTimeSeconds:null,deltaSeconds:null,completedTimes:[]};
  raceState.telemetry={current:null,history:createTelemetryHistory()};
}