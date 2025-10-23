//industrial-iot-machine-monitoring-control-system/frontend/src/components/MachineList.jsx
import React from "react";
export default function MachineList({ machines = [], telemetry = {}, onSelect }) {
  return (
    <ul>
      {machines.map(m => {
        const t = telemetry[m.machineId];
        const temp = t ? (t.temp || t.raw?.temp) : '—';
        return (
          <li key={m.machineId} style={{ padding:8, borderBottom:'1px solid #eee', cursor:'pointer'}} onClick={() => onSelect(m.machineId)}>
            <strong>{m.name || m.machineId}</strong>
            <div>Temp: {temp}</div>
          </li>
        );
      })}
    </ul>
  );
}
