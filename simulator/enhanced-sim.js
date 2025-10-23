// industrial-iot-machine-monitoring-control-system/simulator/enhanced-sim.js
require('dotenv').config();
const mqtt = require('mqtt');
const MQTT_URL = process.env.MQTT_URL || 'mqtt://localhost:1883';
const PLANT = process.env.PLANT_ID || 'A1';

const client = mqtt.connect(MQTT_URL);

// Realistic factory machines with different types and behaviors
const machines = [
  // CNC Machines
  { id: 'CNC-001', name: '5-Axis CNC Mill', type: 'cnc', baseTemp: 45, baseVibration: 1.2, basePower: 3500 },
  { id: 'CNC-002', name: 'CNC Lathe', type: 'cnc', baseTemp: 42, baseVibration: 1.0, basePower: 2800 },
  
  // Injection Molding
  { id: 'IM-001', name: 'Injection Molder 200T', type: 'injection', baseTemp: 85, baseVibration: 2.5, basePower: 8500 },
  { id: 'IM-002', name: 'Injection Molder 500T', type: 'injection', baseTemp: 95, baseVibration: 3.0, basePower: 12000 },
  
  // Assembly Robots
  { id: 'ROB-001', name: '6-Axis Assembly Robot', type: 'robot', baseTemp: 35, baseVibration: 0.8, basePower: 1500 },
  { id: 'ROB-002', name: 'SCARA Robot', type: 'robot', baseTemp: 32, baseVibration: 0.6, basePower: 1200 },
  
  // Conveyor Systems
  { id: 'CV-001', name: 'Main Conveyor Line', type: 'conveyor', baseTemp: 28, baseVibration: 1.5, basePower: 7500 },
  { id: 'CV-002', name: 'Packaging Conveyor', type: 'conveyor', baseTemp: 25, baseVibration: 1.2, basePower: 3200 },
  
  // Quality Control
  { id: 'QC-001', name: 'Vision Inspection System', type: 'quality', baseTemp: 30, baseVibration: 0.3, basePower: 800 },
  { id: 'QC-002', name: 'Laser Measurement', type: 'quality', baseTemp: 28, baseVibration: 0.2, basePower: 600 }
];

// Machine states and behaviors
const machineStates = {};
let simulationRunning = true;

// Initialize machine states
machines.forEach(machine => {
  machineStates[machine.id] = {
    state: 'idle',
    operationalHours: Math.floor(Math.random() * 5000),
    lastMaintenance: Date.now() - Math.random() * 2592000000, // 0-30 days ago
    productionCount: Math.floor(Math.random() * 10000),
    efficiency: 0.85 + Math.random() * 0.1, // 85-95%
    errorProbability: 0.02 // 2% chance of error
  };
});

client.on('connect', () => {
  console.log('Enhanced Smart Factory Simulator connected to', MQTT_URL);
  
  // Subscribe to control topics for all machines
  machines.forEach(machine => {
    client.subscribe(`factory/${PLANT}/machine/${machine.id}/control`);
  });

  // Start simulation loops for different machine types
  startCNCSimulation();
  startInjectionMoldingSimulation();
  startRobotSimulation();
  startConveyorSimulation();
  startQualityControlSimulation();

  console.log(`Smart Factory Simulation Started with ${machines.length} machines`);
  console.log('Machine Types: CNC, Injection Molding, Robots, Conveyors, Quality Control');
});

// CNC Machine Simulation (High precision, moderate vibration)
function startCNCSimulation() {
  const cncMachines = machines.filter(m => m.type === 'cnc');
  
  setInterval(() => {
    cncMachines.forEach(machine => {
      const state = machineStates[machine.id];
      
      // Simulate CNC operational patterns
      if (state.state === 'running') {
        const temp = machine.baseTemp + Math.random() * 15 + (state.operationalHours / 1000); // Wear over time
        const vibration = machine.baseVibration + Math.random() * 1.5;
        const power = machine.basePower + Math.random() * 500;
        
        // Simulate tool wear (increasing vibration over time)
        const toolWear = state.operationalHours / 10000;
        const adjustedVibration = vibration * (1 + toolWear);
        
        const payload = {
          machineId: machine.id,
          machineName: machine.name,
          machineType: machine.type,
          ts: new Date().toISOString(),
          temp: Math.round(temp * 100) / 100,
          vibration: Math.round(adjustedVibration * 100) / 100,
          power: Math.round(power),
          state: state.state,
          productionCount: state.productionCount,
          efficiency: state.efficiency,
          toolWear: Math.min(1, toolWear), // 0-1 scale
          spindleSpeed: 8000 + Math.random() * 4000,
          feedRate: 100 + Math.random() * 50
        };

        client.publish(`factory/${PLANT}/machine/${machine.id}/telemetry`, JSON.stringify(payload));
        
        // Increment production
        state.productionCount += Math.floor(Math.random() * 3);
        state.operationalHours += 0.1;
        
        // Random errors based on operational hours and tool wear
        if (Math.random() < state.errorProbability * (1 + toolWear)) {
          simulateMachineError(machine.id, 'Tool Breakage or Overload');
        }
      }
    });
  }, 3000); // Every 3 seconds
}

// Injection Molding Simulation (High temperature, high power)
function startInjectionMoldingSimulation() {
  const injectionMachines = machines.filter(m => m.type === 'injection');
  
  setInterval(() => {
    injectionMachines.forEach(machine => {
      const state = machineStates[machine.id];
      
      if (state.state === 'running') {
        const cycleTime = 30 + Math.random() * 20; // 30-50 second cycles
        const temp = machine.baseTemp + Math.random() * 25;
        const vibration = machine.baseVibration + Math.random() * 2;
        const power = machine.basePower + Math.random() * 1500;
        
        const payload = {
          machineId: machine.id,
          machineName: machine.name,
          machineType: machine.type,
          ts: new Date().toISOString(),
          temp: Math.round(temp * 100) / 100,
          vibration: Math.round(vibration * 100) / 100,
          power: Math.round(power),
          state: state.state,
          productionCount: state.productionCount,
          efficiency: state.efficiency,
          cycleTime: Math.round(cycleTime * 100) / 100,
          moldTemp: 80 + Math.random() * 20,
          injectionPressure: 800 + Math.random() * 200
        };

        client.publish(`factory/${PLANT}/machine/${machine.id}/telemetry`, JSON.stringify(payload));
        
        state.productionCount++;
        state.operationalHours += cycleTime / 3600;
        
        // Overheating risk for injection molders
        if (temp > 120 && Math.random() < 0.3) {
          simulateMachineError(machine.id, 'Overheating - Cooling System Required');
        }
      }
    });
  }, 5000); // Every 5 seconds
}

// Robot Simulation (Low vibration, precise movements)
function startRobotSimulation() {
  const robots = machines.filter(m => m.type === 'robot');
  
  setInterval(() => {
    robots.forEach(machine => {
      const state = machineStates[machine.id];
      
      if (state.state === 'running') {
        const temp = machine.baseTemp + Math.random() * 8;
        const vibration = machine.baseVibration + Math.random() * 0.5;
        const power = machine.basePower + Math.random() * 300;
        
        const payload = {
          machineId: machine.id,
          machineName: machine.name,
          machineType: machine.type,
          ts: new Date().toISOString(),
          temp: Math.round(temp * 100) / 100,
          vibration: Math.round(vibration * 100) / 100,
          power: Math.round(power),
          state: state.state,
          productionCount: state.productionCount,
          efficiency: state.efficiency,
          accuracy: 0.98 + Math.random() * 0.02, // 98-100%
          cycleCount: Math.floor(Math.random() * 100),
          jointPositions: Array(6).fill(0).map(() => Math.random() * 360)
        };

        client.publish(`factory/${PLANT}/machine/${machine.id}/telemetry`, JSON.stringify(payload));
        
        state.productionCount += 5;
        state.operationalHours += 0.05;
        
        // Precision degradation over time
        if (state.operationalHours > 8000 && Math.random() < 0.1) {
          simulateMachineError(machine.id, 'Calibration Required - Accuracy Degraded');
        }
      }
    });
  }, 2000); // Every 2 seconds
}

// Conveyor System Simulation
function startConveyorSimulation() {
  const conveyors = machines.filter(m => m.type === 'conveyor');
  
  setInterval(() => {
    conveyors.forEach(machine => {
      const state = machineStates[machine.id];
      
      if (state.state === 'running') {
        const temp = machine.baseTemp + Math.random() * 10;
        const vibration = machine.baseVibration + Math.random() * 1;
        const power = machine.basePower + Math.random() * 1000;
        
        const payload = {
          machineId: machine.id,
          machineName: machine.name,
          machineType: machine.type,
          ts: new Date().toISOString(),
          temp: Math.round(temp * 100) / 100,
          vibration: Math.round(vibration * 100) / 100,
          power: Math.round(power),
          state: state.state,
          productionCount: state.productionCount,
          efficiency: state.efficiency,
          beltSpeed: 2 + Math.random() * 3, // m/s
          throughput: 50 + Math.random() * 50, // parts/minute
          loadPercentage: 60 + Math.random() * 40
        };

        client.publish(`factory/${PLANT}/machine/${machine.id}/telemetry`, JSON.stringify(payload));
        
        state.productionCount += Math.floor(Math.random() * 20);
        state.operationalHours += 0.02;
        
        // Belt wear and tear
        if (state.operationalHours > 10000 && Math.random() < 0.15) {
          simulateMachineError(machine.id, 'Conveyor Belt Wear - Maintenance Required');
        }
      }
    });
  }, 4000); // Every 4 seconds
}

// Quality Control Simulation
function startQualityControlSimulation() {
  const qcSystems = machines.filter(m => m.type === 'quality');
  
  setInterval(() => {
    qcSystems.forEach(machine => {
      const state = machineStates[machine.id];
      
      if (state.state === 'running') {
        const temp = machine.baseTemp + Math.random() * 5;
        const vibration = machine.baseVibration + Math.random() * 0.3;
        const power = machine.basePower + Math.random() * 100;
        
        const payload = {
          machineId: machine.id,
          machineName: machine.name,
          machineType: machine.type,
          ts: new Date().toISOString(),
          temp: Math.round(temp * 100) / 100,
          vibration: Math.round(vibration * 100) / 100,
          power: Math.round(power),
          state: state.state,
          productionCount: state.productionCount,
          efficiency: state.efficiency,
          inspectionRate: 120 + Math.random() * 60, // parts/minute
          defectRate: (0.5 + Math.random() * 2).toFixed(2), // percentage
          accuracy: 99.5 + Math.random() * 0.5 // 99.5-100%
        };

        client.publish(`factory/${PLANT}/machine/${machine.id}/telemetry`, JSON.stringify(payload));
        
        state.productionCount += Math.floor(Math.random() * 100);
        state.operationalHours += 0.01;
      }
    });
  }, 6000); // Every 6 seconds
}

// Simulate machine errors and status changes
function simulateMachineError(machineId, errorMessage) {
  const state = machineStates[machineId];
  state.state = 'error';
  
  const errorPayload = {
    machineId: machineId,
    timestamp: new Date().toISOString(),
    error: errorMessage,
    severity: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
    requiresMaintenance: true
  };
  
  client.publish(`factory/${PLANT}/machine/${machineId}/status`, JSON.stringify({
    status: 'error',
    message: errorMessage,
    timestamp: new Date().toISOString()
  }));
  
  console.log(`❌ Machine ${machineId} error: ${errorMessage}`);
  
  // Auto-recovery after random time (5-30 seconds)
  setTimeout(() => {
    if (state.state === 'error') {
      state.state = 'running';
      client.publish(`factory/${PLANT}/machine/${machineId}/status`, JSON.stringify({
        status: 'running',
        message: 'Auto-recovery completed',
        timestamp: new Date().toISOString()
      }));
      console.log(`✅ Machine ${machineId} auto-recovered`);
    }
  }, 5000 + Math.random() * 25000);
}

// Handle control messages from dashboard
client.on('message', (topic, payloadBuf) => {
  try {
    const msg = JSON.parse(payloadBuf.toString());
    const parts = topic.split('/');
    const machineId = parts[3];
    
    console.log('Control received:', topic, msg);
    
    const state = machineStates[machineId];
    if (!state) return;
    
    switch (msg.cmd) {
      case 'start':
        state.state = 'running';
        console.log(`▶️ Starting machine ${machineId}`);
        break;
      case 'stop':
        state.state = 'idle';
        console.log(`⏹️ Stopping machine ${machineId}`);
        break;
      case 'maintenance_mode':
        state.state = 'maintenance';
        state.lastMaintenance = Date.now();
        console.log(`🔧 Maintenance mode for ${machineId}`);
        break;
      case 'emergency_stop':
        state.state = 'emergency_stop';
        console.log(`🛑 EMERGENCY STOP for ${machineId}`);
        
        // Auto-reset emergency stop after 10 seconds
        setTimeout(() => {
          if (state.state === 'emergency_stop') {
            state.state = 'idle';
            console.log(`🔄 Emergency stop reset for ${machineId}`);
          }
        }, 10000);
        break;
    }
    
    // Send acknowledgement
    client.publish(`factory/${PLANT}/machine/${machineId}/control/ack`, JSON.stringify({ 
      reqId: msg.reqId, 
      status: 'ack',
      machineState: state.state
    }));
    
    // Update status
    client.publish(`factory/${PLANT}/machine/${machineId}/status`, JSON.stringify({
      status: state.state,
      timestamp: new Date().toISOString()
    }));
    
  } catch (err) {
    console.error('Simulator error:', err);
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down Smart Factory Simulator...');
  simulationRunning = false;
  machines.forEach(machine => {
    client.publish(`factory/${PLANT}/machine/${machine.id}/status`, JSON.stringify({
      status: 'offline',
      timestamp: new Date().toISOString()
    }));
  });
  setTimeout(() => {
    client.end();
    process.exit(0);
  }, 1000);
});

console.log('Enhanced Smart Factory Simulator initialized');
console.log('Available machines:', machines.map(m => `${m.id} (${m.type})`).join(', '));