// industrial-iot-machine-monitoring-control-system/frontend/src/components/MachineControl.jsx
import React, { useState } from "react";

export default function MachineControl({ machineId, backend, currentState, token }) {
  const [loading, setLoading] = useState(false);

  const sendCommand = async (cmd) => {
    if (!token) {
      alert('Authentication required. Please log in again.');
      return;
    }

    setLoading(true);
    try {
      console.log(`Sending command ${cmd} to ${machineId}`);
      const res = await fetch(`${backend}/api/machines/${machineId}/commands`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          cmd, 
          issuedBy: 'operator',
          params: {}
        })
      });
      
      const result = await res.json();
      
      if (result.ok) {
        alert(`✅ Command ${cmd} sent successfully! Request ID: ${result.reqId}`);
      } else {
        alert(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Command failed:', error);
      alert('❌ Failed to send command: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStateColor = (state) => {
    const colors = {
      running: '#4CAF50',
      idle: '#FFC107',
      stopped: '#F44336',
      maintenance: '#FF9800',
      error: '#9C27B0',
      emergency_stop: '#D32F2F'
    };
    return colors[state] || '#757575';
  };

  return (
    <div style={{ marginTop: 12, padding: 16, border: '1px solid #ddd', borderRadius: 8, background: 'white' }}>
      <h4>Machine Control</h4>
      
      <div style={{ marginBottom: 12 }}>
        <strong>Current State: </strong>
        <span style={{ 
          color: getStateColor(currentState),
          fontWeight: 'bold',
          padding: '4px 8px',
          borderRadius: 4,
          background: '#f5f5f5'
        }}>
          {currentState?.toUpperCase() || 'UNKNOWN'}
        </span>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button 
          onClick={() => sendCommand('start')} 
          disabled={loading || currentState === 'running'}
          style={{ 
            background: '#4CAF50', 
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: (loading || currentState === 'running') ? 'not-allowed' : 'pointer',
            opacity: (loading || currentState === 'running') ? 0.6 : 1
          }}
        >
          {loading ? 'Sending...' : 'Start'}
        </button>
        
        <button 
          onClick={() => sendCommand('stop')} 
          disabled={loading || currentState === 'stopped'}
          style={{ 
            background: '#F44336', 
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: (loading || currentState === 'stopped') ? 'not-allowed' : 'pointer',
            opacity: (loading || currentState === 'stopped') ? 0.6 : 1
          }}
        >
          Stop
        </button>
        
        <button 
          onClick={() => sendCommand('maintenance_mode')}
          disabled={loading}
          style={{ 
            background: '#FF9800', 
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        >
          Maintenance
        </button>
        
        <button 
          onClick={() => sendCommand('reset')}
          disabled={loading}
          style={{ 
            background: '#2196F3', 
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        >
          Reset
        </button>
        
        <button 
          onClick={() => sendCommand('emergency_stop')}
          disabled={loading}
          style={{ 
            background: '#D32F2F', 
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
            fontWeight: 'bold'
          }}
        >
          EMERGENCY STOP
        </button>
      </div>

      <div style={{ marginTop: 12, fontSize: '0.9em', color: '#666' }}>
        <p>Automatic controls will trigger based on sensor readings:</p>
        <ul>
          <li>Temp ≥ 95°C: Emergency Stop</li>
          <li>Vibration ≥ 4.0: Immediate Stop</li>
          <li>Power ≥ 320W: Power Cutoff</li>
        </ul>
      </div>
    </div>
  );
}