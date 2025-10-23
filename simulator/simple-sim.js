// industrial-iot-machine-monitoring-control-system/simulator/simple-sim.js
require('dotenv').config();
const mqtt = require('mqtt');
const MQTT_URL = process.env.MQTT_URL || 'mqtt://localhost:1883';
const PLANT = process.env.PLANT_ID || 'A1';

const client = mqtt.connect(MQTT_URL);

// Use the same machine IDs as backend
const machines = [
  'CNC-001', 'CNC-002', 'IM-001', 'IM-002', 
  'ROB-001', 'ROB-002', 'CV-001', 'CV-002', 
  'QC-001', 'QC-002'
];

const machineStates = {};

// Initialize all machines to idle
machines.forEach(mid => {
  machineStates[mid] = 'idle';
});

client.on('connect', () => {
  console.log('Simple Smart Factory Simulator connected to', MQTT_URL);
  console.log(`Simulating ${machines.length} machines`);
  
  // Subscribe to control topics for all machines
  machines.forEach(mid => {
    client.subscribe(`factory/${PLANT}/machine/${mid}/control`);
  });

  // Start sending telemetry data every 2 seconds
  setInterval(() => {
    machines.forEach(mid => {
      const state = machineStates[mid];
      const isRunning = state === 'running';
      
      // Generate realistic telemetry based on machine state
      const payload = {
        machineId: mid,
        ts: new Date().toISOString(),
        temp: isRunning ? Math.round((60 + Math.random()*40)*100)/100 : 25,
        vibration: isRunning ? Math.round((Math.random()*5)*100)/100 : 0.1,
        power: isRunning ? Math.round((200 + Math.random()*100)*100)/100 : 10,
        state: state,
        productionCount: isRunning ? Math.floor(Math.random() * 1000) : 0,
        efficiency: isRunning ? 0.85 + Math.random() * 0.15 : 0
      };
      
      client.publish(`factory/${PLANT}/machine/${mid}/telemetry`, JSON.stringify(payload));
    });
  }, 2000);

  console.log('Telemetry simulation started - sending data every 2 seconds');
});

client.on('message', (topic, payloadBuf) => {
  try {
    const msg = JSON.parse(payloadBuf.toString());
    const parts = topic.split('/');
    const machineId = parts[3];
    
    console.log('Control command received for', machineId, ':', msg.cmd);
    
    // Update machine state based on command
    switch (msg.cmd) {
      case 'start':
        machineStates[machineId] = 'running';
        console.log(`▶️ Starting machine ${machineId}`);
        break;
      case 'stop':
        machineStates[machineId] = 'stopped';
        console.log(`⏹️ Stopping machine ${machineId}`);
        break;
      case 'maintenance_mode':
        machineStates[machineId] = 'maintenance';
        console.log(`🔧 Maintenance mode for ${machineId}`);
        break;
      case 'emergency_stop':
        machineStates[machineId] = 'stopped';
        console.log(`🛑 EMERGENCY STOP for ${machineId}`);
        break;
    }
    
    // Send acknowledgement
    client.publish(`factory/${PLANT}/machine/${machineId}/control/ack`, JSON.stringify({ 
      reqId: msg.reqId, 
      status: 'ack',
      machineState: machineStates[machineId]
    }));
    
    // Send status update
    client.publish(`factory/${PLANT}/machine/${machineId}/status`, JSON.stringify({
      status: machineStates[machineId],
      message: `Machine ${msg.cmd} command executed`,
      timestamp: new Date().toISOString()
    }));
    
  } catch (err) {
    console.error('Simulator error:', err);
  }
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down simulator...');
  client.end();
  process.exit(0);
});

console.log('Smart Factory Simulator initialized and ready');