// industrial-iot-machine-monitoring-control-system/frontend/src/App.jsx
import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import SmartFactoryDashboard from "./components/SmartFactoryDashboard";
import MachineDetail from "./components/MachineDetail";
import Login from "./components/Login";

const backend = import.meta.env.VITE_BACKEND || "http://localhost:3000";

export default function App() {
  const [machines, setMachines] = useState([]);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [telemetry, setTelemetry] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setUser(JSON.parse(userData));
      initializeSocket(token);
    } else {
      setLoading(false);
    }
  }, []);

  const initializeSocket = (token) => {
    const newSocket = io(backend, {
      auth: { token }
    });

    newSocket.on("connect", () => {
      console.log("✅ Smart Factory Dashboard Connected");
      setLoading(false);
      fetchMachines(token);
    });

    // Handle telemetry data
    newSocket.on("telemetry", (data) => {
      console.log("📊 Telemetry received:", data.machineId, data);
      setTelemetry(prev => ({ 
        ...prev, 
        [data.machineId]: data
      }));
    });

    // Handle machine state updates
    newSocket.on("machine_state_update", (update) => {
      console.log("🔄 Machine state update:", update);
      // Update the machine status in the machines list
      setMachines(prev => prev.map(machine => 
        machine.machineId === update.machineId 
          ? { ...machine, status: update.state }
          : machine
      ));
    });

    // Handle initial states
    newSocket.on("initial_states", (states) => {
      console.log("🏭 Initial machine states:", states);
      // Update telemetry with current states
      Object.keys(states).forEach(machineId => {
        setTelemetry(prev => ({
          ...prev,
          [machineId]: {
            ...prev[machineId],
            state: states[machineId].currentState
          }
        }));
      });
    });

    newSocket.on("alert", (alert) => {
      console.log("🚨 Alert received:", alert);
      setAlerts(prev => [alert, ...prev.slice(0, 49)]); // Keep last 50 alerts
    });

    newSocket.on("machine_evaluation", (evaluation) => {
      console.log('📈 Machine evaluation:', evaluation);
    });

    newSocket.on("commandAck", (ack) => {
      console.log('✅ Command acknowledged:', ack);
    });

    newSocket.on("status", (status) => {
      console.log('📢 Status update:', status);
    });

    newSocket.on("connect_error", (err) => {
      console.error("❌ Socket connection error:", err);
      setLoading(false);
      if (err.message.includes("Authentication error")) {
        handleLogout();
      }
    });

    setSocket(newSocket);

    // Request notification permission
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  };

  const fetchMachines = async (token) => {
    try {
      console.log("🔄 Fetching machines...");
      const response = await fetch(`${backend}/api/machines`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log("✅ Machines loaded:", data);
        setMachines(data);
      } else {
        console.error("❌ Failed to fetch machines:", response.status);
      }
    } catch (error) {
      console.error('❌ Failed to fetch machines:', error);
      setMachines([]);
    }
  };

  const handleLogin = (userData, token) => {
    console.log("🔑 User logged in:", userData.username);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    initializeSocket(token);
  };

  const handleLogout = () => {
    console.log("🚪 User logging out");
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setMachines([]);
    setTelemetry({});
    setAlerts([]);
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: '#2c3e50',
        color: 'white',
        fontSize: '1.2em'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3em', marginBottom: '20px' }}>🏭</div>
          <div>Loading Smart Factory Dashboard...</div>
          <div style={{ fontSize: '0.8em', marginTop: '10px', opacity: 0.7 }}>
            Connecting to backend...
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login backend={backend} onLogin={handleLogin} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ 
        background: '#2c3e50', 
        color: 'white', 
        padding: '15px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <h1 style={{ margin: 0, fontSize: '1.5em' }}>🏭 Smart Factory 4.0</h1>
          <div style={{ 
            background: '#34495e', 
            padding: '4px 8px', 
            borderRadius: '4px',
            fontSize: '0.9em'
          }}>
            Plant: A1
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.9em', opacity: 0.8 }}>Welcome back,</div>
            <div style={{ fontWeight: 'bold' }}>{user.name} ({user.role})</div>
          </div>
          <button 
            onClick={handleLogout}
            style={{
              background: '#e74c3c',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Alert Banner */}
      {alerts.length > 0 && alerts[0].type === 'CRITICAL' && (
        <div style={{
          background: '#ffebee',
          color: '#c62828',
          padding: '10px 20px',
          borderBottom: '2px solid #f44336',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span>🚨</span>
          <span>CRITICAL ALERT: {alerts[0].machineId} - {alerts[0].message}</span>
        </div>
      )}

      {/* Main Content */}
      <div style={{ flex: 1, background: '#ecf0f1' }}>
        {selectedMachine ? (
          <MachineDetail 
            machine={selectedMachine} 
            telemetry={telemetry[selectedMachine]} 
            backend={backend} 
            token={localStorage.getItem('token')}
            onBack={() => setSelectedMachine(null)}
          />
        ) : (
          <SmartFactoryDashboard 
            machines={machines}
            telemetry={telemetry}
            onSelectMachine={setSelectedMachine}
          />
        )}
      </div>

      {/* Footer */}
      <div style={{ 
        background: '#34495e', 
        color: '#bdc3c7', 
        padding: '10px 20px',
        textAlign: 'center',
        fontSize: '0.9em'
      }}>
        Smart Factory Monitoring System • {new Date().getFullYear()} • Real-time IIoT Platform
      </div>
    </div>
  );
}