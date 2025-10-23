//industrial-iot-machine-monitoring-control-system/frontend/src/App.jsx
import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import MachineList from "./components/MachineList";
import MachineDetail from "./components/MachineDetail";
import Login from "./components/Login";

// Use environment variable with fallback
const backend = import.meta.env.VITE_BACKEND || "http://localhost:3000";

// Debug: log the backend URL
console.log("Backend URL:", backend);

export default function App() {
  const [machines, setMachines] = useState([]);
  const [selected, setSelected] = useState(null);
  const [telemetry, setTelemetry] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);

  // Check if user is logged in on component mount
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
      auth: {
        token: token
      }
    });

    newSocket.on("connect", () => {
      console.log("Socket.IO connected");
      setLoading(false);
      fetchMachines(token);
    });

    newSocket.on("telemetry", (d) => {
      setTelemetry(prev => ({ ...prev, [d.machineId]: d }));
    });

    newSocket.on("alert", (a) => setAlerts(prev => [a, ...prev]));
    newSocket.on("status", (s) => console.log('status', s));
    newSocket.on("machine_evaluation", (e) => console.log('evaluation', e));
    newSocket.on("commandAck", (a) => console.log('commandAck', a));

    newSocket.on("connect_error", (err) => {
      console.error("Socket connection error:", err);
      setLoading(false);
      if (err.message.includes("Authentication error")) {
        handleLogout();
      }
    });

    setSocket(newSocket);
  };

  const fetchMachines = async (token) => {
    try {
      console.log("Fetching machines from:", `${backend}/api/machines`);
      const response = await fetch(`${backend}/api/machines`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          handleLogout();
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setMachines(data);
    } catch (error) {
      console.error('Failed to fetch machines:', error);
      setMachines([]);
    }
  };

  const handleLogin = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    initializeSocket(token);
  };

  const handleLogout = () => {
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
    return <div style={{ padding: 20 }}>Loading...</div>;
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
        padding: '10px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h2 style={{ margin: 0 }}>IIoT Factory Dashboard</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span>Welcome, {user.name} ({user.role})</span>
          <button 
            onClick={handleLogout}
            style={{
              background: '#e74c3c',
              color: 'white',
              border: 'none',
              padding: '5px 10px',
              borderRadius: '3px',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ display: 'flex', flex: 1, gap: 20, padding: 20 }}>
        <div style={{ width: 300 }}>
          <h3>Machines</h3>
          <MachineList 
            machines={machines} 
            telemetry={telemetry} 
            onSelect={setSelected}
            token={localStorage.getItem('token')}
            backend={backend}
          />
          
          <h4>Alerts</h4>
          <div style={{ maxHeight: 200, overflow: 'auto' }}>
            {alerts.length > 0 ? (
              <ul style={{ padding: 0, margin: 0, listStyle: 'none' }}>
                {alerts.map((a, i) => (
                  <li 
                    key={i} 
                    style={{ 
                      padding: '8px', 
                      borderBottom: '1px solid #eee',
                      background: a.type === 'CRITICAL' ? '#ffebee' : '#fff3e0'
                    }}
                  >
                    <strong>{a.machineId}</strong> - {a.type} - {a.value}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No alerts</p>
            )}
          </div>
        </div>
        
        <div style={{ flex: 1 }}>
          {selected ? (
            <MachineDetail 
              machine={selected} 
              telemetry={telemetry[selected]} 
              backend={backend} 
              token={localStorage.getItem('token')}
            />
          ) : (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '100%',
              color: '#666'
            }}>
              Select a machine to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}