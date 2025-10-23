import React, { useEffect, useState } from "react";

export default function MachineList({ machines = [], telemetry = {}, onSelect, token, backend }) {
  const [machineList, setMachineList] = useState([]);

  useEffect(() => {
    // Ensure machines is always an array
    if (Array.isArray(machines)) {
      setMachineList(machines);
    } else {
      setMachineList([]);
    }
  }, [machines]);

  const getMachineStatus = (machineId) => {
    const t = telemetry[machineId];
    if (!t) return "unknown";

    if (t.evaluation?.overallStatus === "ISSUE_DETECTED") return "issue";
    if (t.evaluation?.overallStatus === "HEALTHY") return "healthy";
    return "unknown";
  };

  const getStatusColor = (status) => {
    const colors = {
      healthy: "#4CAF50",
      issue: "#F44336",
      unknown: "#9E9E9E",
    };
    return colors[status] || "#9E9E9E";
  };

  return (
    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
      {machineList.length > 0 ? (
        machineList.map((m) => {
          const t = telemetry[m.machineId];
          const temp = t ? t.temp || t.raw?.temp : "—";
          const status = getMachineStatus(m.machineId);

          return (
            <li
              key={m.machineId}
              style={{
                padding: "12px",
                borderBottom: "1px solid #eee",
                cursor: "pointer",
                background: "white",
                transition: "background 0.2s",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
              onClick={() => onSelect(m.machineId)}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f5f5")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
            >
              <div
                style={{
                  width: "12px",
                  height: "12px",
                  borderRadius: "50%",
                  background: getStatusColor(status),
                }}
              />
              <div style={{ flex: 1 }}>
                <strong>{m.name || m.machineId}</strong>
                <div style={{ fontSize: "14px", color: "#666" }}>
                  Temp: {temp}°C | {status.toUpperCase()}
                </div>
              </div>
            </li>
          );
        })
      ) : (
        <li
          style={{
            padding: "20px",
            textAlign: "center",
            color: "#666",
            background: "white",
            borderBottom: "1px solid #eee",
          }}
        >
          No machines available
        </li>
      )}
    </ul>
  );
}
