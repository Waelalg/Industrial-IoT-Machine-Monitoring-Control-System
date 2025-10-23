//industrial-iot-machine-monitoring-control-system/frontend/src/components/MachineControl.jsx
import React from "react";

export default function MachineControl({ machineId, backend }) {
  const send = async (cmd) => {
    const res = await fetch(`${backend}/api/machines/${machineId}/commands`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ cmd, issuedBy: 'operator1' })
    });
    const j = await res.json();
    alert('Command sent: ' + JSON.stringify(j));
  };

  return (
    <div style={{ marginTop:12 }}>
      <h4>Controls</h4>
      <button onClick={() => send('start')}>Start</button>
      <button onClick={() => send('stop')}>Stop</button>
      <button onClick={() => send('setThreshold')}>Set Threshold (example)</button>
    </div>
  );
}
