//industrial-iot-machine-monitoring-control-system/frontend/src/App.jsx
import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import MachineList from "./components/MachineList";
import MachineDetail from "./components/MachineDetail";

const backend = process.env.VITE_BACKEND || "http://localhost:3000";
const socket = io(backend);

export default function App() {
  const [machines, setMachines] = useState([]);
  const [selected, setSelected] = useState(null);
  const [telemetry, setTelemetry] = useState({});
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    fetch(`${backend}/api/machines`).then(r => r.json()).then(setMachines);
    socket.on("telemetry", (d) => {
      setTelemetry(prev => ({ ...prev, [d.machineId]: d }));
    });
    socket.on("alert", (a) => setAlerts(prev => [a, ...prev]));
    socket.on("status", (s) => console.log('status', s));
    return () => { socket.off(); };
  }, []);

  return (
    <div style={{ display:'flex', gap:20, padding:20 }}>
      <div style={{ width:300 }}>
        <h3>Machines</h3>
        <MachineList machines={machines} telemetry={telemetry} onSelect={setSelected}/>
        <h4>Alerts</h4>
        <ul>
          {alerts.map((a,i) => <li key={i}>{a.machineId} - {a.type} - {a.value}</li>)}
        </ul>
      </div>
      <div style={{ flex:1 }}>
        {selected ? (
          <MachineDetail machine={selected} telemetry={telemetry[selected]} backend={backend} />
        ) : <div>Select a machine</div>}
      </div>
    </div>
  );
}
