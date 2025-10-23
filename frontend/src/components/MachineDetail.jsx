// industrial-iot-machine-monitoring-control-system/frontend/src/components/MachineDetail.jsx
import React, { useEffect, useState } from "react";
import MachineControl from "./MachineControl";

export default function MachineDetail({ machine, telemetry, backend, token, onBack }) {
  const [history, setHistory] = useState([]);
  const [conditions, setConditions] = useState([]);
  const [machineState, setMachineState] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const headers = {
          'Authorization': `Bearer ${token}`
        };

        // Load telemetry history
        const telemetryResponse = await fetch(`${backend}/api/machines/${machine}/telemetry?limit=100`, { headers });
        if (telemetryResponse.ok) {
          const telemetryData = await telemetryResponse.json();
          setHistory(Array.isArray(telemetryData) ? telemetryData : []);
        }

        // Load condition evaluations
        const conditionsResponse = await fetch(`${backend}/api/machines/${machine}/conditions?limit=20`, { headers });
        if (conditionsResponse.ok) {
          const conditionsData = await conditionsResponse.json();
          setConditions(Array.isArray(conditionsData) ? conditionsData : []);
        }

        // Load current machine state
        const stateResponse = await fetch(`${backend}/api/machines/${machine}/state`, { headers });
        if (stateResponse.ok) {
          const stateData = await stateResponse.json();
          setMachineState(stateData);
        }
      } catch (error) {
        console.error('Failed to fetch machine data:', error);
        setHistory([]);
        setConditions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [machine, backend, token]);

  const getStatusIndicator = (evaluation) => {
    if (!evaluation) return null;
    
    const status = evaluation.overallStatus;
    const color = status === 'HEALTHY' ? '#4CAF50' : '#F44336';
    
    return (
      <div style={{ 
        display: 'inline-block',
        width: 12,
        height: 12,
        borderRadius: '50%',
        background: color,
        marginRight: 8
      }}></div>
    );
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div>Loading machine data...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Back button and header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
        <button 
          onClick={onBack}
          style={{
            background: '#3498db',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          ← Back to Dashboard
        </button>
        <h1 style={{ margin: 0, color: '#2c3e50' }}>Machine: {machine}</h1>
      </div>
      
      {/* Current State & Evaluation */}
      {telemetry?.evaluation && (
        <div style={{ 
          padding: 16, 
          background: '#f8f9fa', 
          borderRadius: 8, 
          marginBottom: 16,
          border: `2px solid ${telemetry.evaluation.overallStatus === 'HEALTHY' ? '#4CAF50' : '#F44336'}`
        }}>
          <h4>Current Condition Evaluation</h4>
          <p>
            {getStatusIndicator(telemetry.evaluation)}
            <strong>Status: {telemetry.evaluation.overallStatus}</strong>
          </p>
          <p>Recommended Action: {telemetry.evaluation.recommendedState}</p>
          
          {telemetry.evaluation.alerts.length > 0 && (
            <div>
              <strong>Alerts:</strong>
              <ul>
                {telemetry.evaluation.alerts.map((alert, idx) => (
                  <li key={idx} style={{ color: alert.type === 'CRITICAL' ? '#D32F2F' : '#FF9800' }}>
                    {alert.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Latest Telemetry */}
      <div style={{ marginBottom: 16 }}>
        <h4>Latest Telemetry</h4>
        {telemetry ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <div style={{ padding: 12, background: '#e3f2fd', borderRadius: 8 }}>
              <strong>Temperature</strong>
              <div style={{ 
                fontSize: '1.5em',
                color: telemetry.temp > 85 ? '#F44336' : '#2196F3'
              }}>
                {telemetry.temp}°C
              </div>
            </div>
            <div style={{ padding: 12, background: '#e8f5e8', borderRadius: 8 }}>
              <strong>Vibration</strong>
              <div style={{ 
                fontSize: '1.5em',
                color: telemetry.vibration > 2.5 ? '#F44336' : '#4CAF50'
              }}>
                {telemetry.vibration}
              </div>
            </div>
            <div style={{ padding: 12, background: '#fff3e0', borderRadius: 8 }}>
              <strong>Power</strong>
              <div style={{ 
                fontSize: '1.5em',
                color: telemetry.power > 280 ? '#F44336' : '#FF9800'
              }}>
                {telemetry.power}W
              </div>
            </div>
            <div style={{ padding: 12, background: '#f3e5f5', borderRadius: 8 }}>
              <strong>State</strong>
              <div style={{ 
                fontSize: '1.5em',
                color: telemetry.state === 'running' ? '#4CAF50' : '#F44336'
              }}>
                {telemetry.state?.toUpperCase() || 'UNKNOWN'}
              </div>
            </div>
          </div>
        ) : (
          <p>No telemetry data available</p>
        )}
      </div>

      {/* Condition History */}
      <div style={{ marginBottom: 16 }}>
        <h4>Condition History</h4>
        <div style={{ maxHeight: 200, overflow: 'auto', background: '#f8f9fa', padding: '10px', borderRadius: '4px' }}>
          {conditions.length > 0 ? (
            conditions.map((condition, i) => (
              <div key={i} style={{ 
                padding: 8, 
                borderBottom: '1px solid #eee',
                background: condition.evaluation?.overallStatus === 'HEALTHY' ? '#f1f8e9' : '#ffebee'
              }}>
                {new Date(condition.timestamp).toLocaleTimeString()} - 
                {getStatusIndicator(condition.evaluation)}
                {condition.evaluation?.overallStatus || 'UNKNOWN'} - 
                Actions: {condition.evaluation?.actions?.join(', ') || 'None'}
              </div>
            ))
          ) : (
            <p>No condition history available</p>
          )}
        </div>
      </div>

      {/* Machine Control */}
      <MachineControl 
        machineId={machine} 
        backend={backend} 
        currentState={machineState?.currentState || telemetry?.state}
        token={token}
      />
    </div>
  );
}