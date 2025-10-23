//industrial-iot-machine-monitoring-control-system/frontend/src/components/MachineDetail.jsx
import React, { useEffect, useState } from "react";
import MachineControl from "./MachineControl";

export default function MachineDetail({ machine, telemetry, backend }) {
  const [history, setHistory] = useState([]);
  useEffect(() => {
    fetch(`${backend}/api/machines/${machine}/telemetry?limit=100`)
      .then(r => r.json()).then(setHistory);
  }, [machine, backend]);

  return (
    <div>
      <h2>Machine: {machine}</h2>
      <div>
        <h4>Latest telemetry</h4>
        <pre>{telemetry ? JSON.stringify(telemetry, null, 2) : 'No data'}</pre>
      </div>

      <div>
        <h4>History (last {history.length})</h4>
        <div style={{ maxHeight:300, overflow:'auto', background:'#fafafa', padding:8 }}>
          {history.map((h,i) => <div key={i}>{new Date(h.ts).toLocaleTimeString()} — temp {h.temp}</div>)}
        </div>
      </div>

      <MachineControl machineId={machine} backend={backend}/>
    </div>
  );
}
