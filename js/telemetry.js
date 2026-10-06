import { raceState } from "./state.js";
import "./lap-timing.js";
import "./session-stats.js";
const HISTORY_LIMIT=240;
function pushSample(h,k,v){h[k].push(v);if(h[k].length>HISTORY_LIMIT)h[k].shift();}
export function generateTelemetry(sessionSeconds=raceState.session.elapsedSeconds){
 const t=sessionSeconds%24,phase=(Math.sin(t*.55)+1)/2; let speed,throttle,brake;
 if(t<6){speed=85+t*15+Math.sin(t*2)*3;throttle=65+t*5;brake=0}
 else if(t<10){speed=175+Math.sin((t-6)*1.5)*8;throttle=78+Math.sin(t*2)*8;brake=0}
 else if(t<13){speed=175-(t-10)*25;throttle=15;brake=72+Math.sin(t*3)*12}
 else if(t<18){speed=100+(t-13)*12+Math.sin(t*2)*4;throttle=35+(t-13)*9;brake=8}
 else{speed=160+phase*25+Math.sin(t*1.8)*5;throttle=82+Math.sin(t*2.2)*7;brake=0}
 speed=Math.max(0,speed);throttle=Math.max(0,Math.min(100,throttle));brake=Math.max(0,Math.min(100,brake));
 const rpm=Math.floor(speed*38+Math.sin(t*4)*180+Math.random()*160);
 let gear=speed<50?1:speed<85?2:speed<120?3:speed<155?4:speed<180?5:6;
 const steeringDeg=Number((Math.sin(t*.9)*10+Math.sin(t*2.1)*3).toFixed(1));
 const lateralG=Number((Math.sin(t*.75)*1.35+Math.sin(t*2.4)*.12).toFixed(2));
 const longitudinalG=Number(((throttle/100)*.85-(brake/100)*1.25+Math.sin(t*1.8)*.05).toFixed(2));
 const engineTempC=Math.round(82+throttle*.28+Math.sin(t*.35)*4),coolantTempC=Math.round(74+throttle*.20+Math.sin(t*.32)*3),oilTempC=Math.round(86+throttle*.24+Math.sin(t*.28)*5);
 const batteryVoltageV=Number((400-throttle*.12-Math.abs(lateralG)*1.5).toFixed(1)),batteryCurrentA=Math.round(18+throttle*1.45+Math.max(0,longitudinalG)*35);
 const telemetry={speedKmh:Math.floor(speed),rpm:Math.max(0,rpm),gear,throttlePercent:Math.floor(throttle),brakePercent:Math.floor(brake),steeringDeg,lateralG,longitudinalG,engineTempC,coolantTempC,oilTempC,batteryVoltageV,batteryCurrentA,speed:Math.floor(speed),throttle:Math.floor(throttle),brake:Math.floor(brake),steering:steeringDeg};
 Object.assign(raceState.vehicle,{speedKmh:telemetry.speedKmh,rpm:telemetry.rpm,gear:telemetry.gear,throttlePercent:telemetry.throttlePercent,brakePercent:telemetry.brakePercent});
 raceState.telemetry.current=telemetry;
 const h=raceState.telemetry.history,timestamp=Number(sessionSeconds.toFixed(1));
 for(const [k,v] of [["speed",telemetry.speedKmh],["rpm",telemetry.rpm],["throttle",telemetry.throttlePercent],["brake",telemetry.brakePercent],["gear",telemetry.gear],["steering",telemetry.steeringDeg],["lateralG",telemetry.lateralG],["longitudinalG",telemetry.longitudinalG],["timestamps",timestamp]])pushSample(h,k,v);
 return telemetry;
}