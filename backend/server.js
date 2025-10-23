// industrial-iot-machine-monitoring-control-system/backend/server.js
const express = require('express');
const http = require('http');
const { MongoClient, ObjectId } = require('mongodb');
const mqtt = require('mqtt');
const { Server } = require('socket.io');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const PORT = process.env.PORT || 3000;
const MQTT_URL = process.env.MQTT_URL || 'mqtt://localhost:1883';
const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/iot_iiot';
const PLANT_ID = process.env.PLANT_ID || 'A1';
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// Machine State Definitions
const MACHINE_STATES = {
  IDLE: 'idle',
  RUNNING: 'running',
  STOPPED: 'stopped',
  MAINTENANCE: 'maintenance',
  ERROR: 'error'
};

// Control Logic based on sensor data
const CONTROL_RULES = {
  temperature: {
    normal: [60, 85],
    warning: [85, 95],
    critical: 95,
    action: {
      warning: 'reduce_speed',
      critical: 'emergency_stop'
    }
  },
  vibration: {
    normal: [0, 2.5],
    warning: [2.5, 4.0],
    critical: 4.0,
    action: {
      warning: 'schedule_maintenance',
      critical: 'immediate_stop'
    }
  },
  power: {
    normal: [200, 280],
    warning: [280, 320],
    critical: 320,
    action: {
      warning: 'check_load',
      critical: 'power_cutoff'
    }
  }
};

// Evaluate machine condition and determine actions
function evaluateMachineCondition(telemetry) {
  const actions = [];
  const alerts = [];
  let recommendedState = MACHINE_STATES.RUNNING;

  // Temperature evaluation
  if (telemetry.temp >= CONTROL_RULES.temperature.critical) {
    actions.push(CONTROL_RULES.temperature.action.critical);
    alerts.push({ type: 'CRITICAL', message: `Temperature critical: ${telemetry.temp}°C` });
    recommendedState = MACHINE_STATES.STOPPED;
  } else if (telemetry.temp >= CONTROL_RULES.temperature.warning[0]) {
    actions.push(CONTROL_RULES.temperature.action.warning);
    alerts.push({ type: 'WARNING', message: `Temperature high: ${telemetry.temp}°C` });
  }

  // Vibration evaluation
  if (telemetry.vibration >= CONTROL_RULES.vibration.critical) {
    actions.push(CONTROL_RULES.vibration.action.critical);
    alerts.push({ type: 'CRITICAL', message: `Vibration critical: ${telemetry.vibration}` });
    recommendedState = MACHINE_STATES.STOPPED;
  } else if (telemetry.vibration >= CONTROL_RULES.vibration.warning[0]) {
    actions.push(CONTROL_RULES.vibration.action.warning);
    alerts.push({ type: 'WARNING', message: `Vibration high: ${telemetry.vibration}` });
    recommendedState = MACHINE_STATES.MAINTENANCE;
  }

  // Power evaluation
  if (telemetry.power >= CONTROL_RULES.power.critical) {
    actions.push(CONTROL_RULES.power.action.critical);
    alerts.push({ type: 'CRITICAL', message: `Power consumption critical: ${telemetry.power}W` });
    recommendedState = MACHINE_STATES.STOPPED;
  } else if (telemetry.power >= CONTROL_RULES.power.warning[0]) {
    actions.push(CONTROL_RULES.power.action.warning);
    alerts.push({ type: 'WARNING', message: `Power consumption high: ${telemetry.power}W` });
  }

  return {
    actions,
    alerts,
    recommendedState,
    overallStatus: recommendedState === MACHINE_STATES.RUNNING ? 'HEALTHY' : 'ISSUE_DETECTED'
  };
}

class MachineController {
  constructor(mqttClient, db) {
    this.mqttClient = mqttClient;
    this.db = db;
    this.machineStates = new Map();
  }

  // Initialize machine states from database
  async initializeMachineStates() {
    try {
      const machines = await this.db.collection('machines').find().toArray();
      machines.forEach(machine => {
        this.machineStates.set(machine.machineId, {
          currentState: machine.status || 'idle',
          lastUpdate: new Date(),
          lastEvaluation: null,
          machineData: machine
        });
      });
      console.log(`Initialized ${machines.length} machine states`);
    } catch (error) {
      console.error('Error initializing machine states:', error);
    }
  }

  // Process telemetry and take automatic actions
  async processTelemetry(telemetryData) {
    const { machineId, plantId, temp, vibration, power } = telemetryData;
    
    // Evaluate condition
    const evaluation = evaluateMachineCondition({ temp, vibration, power });
    
    // Store evaluation results
    await this.db.collection('machine_conditions').insertOne({
      machineId,
      plantId,
      timestamp: new Date(),
      telemetry: { temp, vibration, power },
      evaluation,
      autoActionTaken: false
    });

    // Take automatic actions for critical conditions
    let stateChanged = false;
    if (evaluation.recommendedState === MACHINE_STATES.STOPPED) {
      await this.emergencyStop(machineId, plantId, evaluation.alerts);
      stateChanged = true;
    } else if (evaluation.recommendedState === MACHINE_STATES.MAINTENANCE) {
      await this.scheduleMaintenance(machineId, plantId, evaluation.alerts);
      stateChanged = true;
    }

    // Update current state
    const currentState = this.machineStates.get(machineId);
    if (currentState) {
      this.machineStates.set(machineId, {
        ...currentState,
        lastEvaluation: evaluation,
        lastUpdate: new Date(),
        currentState: stateChanged ? evaluation.recommendedState : currentState.currentState
      });
    }

    return evaluation;
  }

  async emergencyStop(machineId, plantId, alerts) {
    const reqId = `emergency-${Date.now()}`;
    
    // Send stop command
    const topic = `factory/${plantId}/machine/${machineId}/control`;
    this.mqttClient.publish(topic, JSON.stringify({
      reqId,
      cmd: 'emergency_stop',
      reason: 'Automatic safety shutdown',
      alerts
    }));

    // Update state immediately
    const currentState = this.machineStates.get(machineId);
    if (currentState) {
      this.machineStates.set(machineId, {
        ...currentState,
        currentState: MACHINE_STATES.STOPPED,
        lastUpdate: new Date()
      });
    }

    // Log the action
    await this.db.collection('auto_actions').insertOne({
      machineId,
      plantId,
      action: 'emergency_stop',
      reason: 'Critical condition detected',
      alerts,
      timestamp: new Date(),
      reqId
    });

    console.log(`Emergency stop initiated for ${machineId}`);
  }

  async scheduleMaintenance(machineId, plantId, alerts) {
    // Create maintenance ticket
    await this.db.collection('maintenance_tickets').insertOne({
      machineId,
      plantId,
      type: 'preventive',
      reason: 'High vibration detected',
      priority: 'medium',
      status: 'pending',
      created: new Date(),
      alerts
    });

    console.log(`Maintenance scheduled for ${machineId}`);
  }

  // Manual control with safety checks
  async manualControl(machineId, plantId, command, operator, userRole) {
    if (!userRole) {
      throw new Error('User role is required for machine control');
    }

    const currentState = this.machineStates.get(machineId);
    if (!currentState) {
      throw new Error(`Machine ${machineId} not found`);
    }

    // Role-based access control for commands
    if (userRole === 'viewer') {
      throw new Error('Insufficient permissions. Viewers cannot control machines.');
    }

    if (command === 'emergency_stop' && userRole !== 'admin' && userRole !== 'operator') {
      throw new Error('Only admins and operators can execute emergency stops.');
    }

    // Safety checks
    if (command === 'start' && currentState.lastEvaluation?.overallStatus === 'ISSUE_DETECTED') {
      throw new Error('Cannot start machine with detected issues. Please check alerts.');
    }

    if (command === 'stop' && currentState.currentState === MACHINE_STATES.STOPPED) {
      throw new Error('Machine is already stopped');
    }

    // Update state immediately for better UX
    let newState = currentState.currentState;
    switch (command) {
      case 'start':
        newState = MACHINE_STATES.RUNNING;
        break;
      case 'stop':
        newState = MACHINE_STATES.STOPPED;
        break;
      case 'maintenance_mode':
        newState = MACHINE_STATES.MAINTENANCE;
        break;
      case 'emergency_stop':
        newState = MACHINE_STATES.STOPPED;
        break;
    }

    this.machineStates.set(machineId, {
      ...currentState,
      currentState: newState,
      lastUpdate: new Date()
    });

    // Execute command
    const reqId = `manual-${Date.now()}`;
    const topic = `factory/${plantId}/machine/${machineId}/control`;
    
    this.mqttClient.publish(topic, JSON.stringify({
      reqId,
      cmd: command,
      operator,
      userRole,
      timestamp: new Date()
    }));

    // Log manual command
    await this.db.collection('manual_commands').insertOne({
      machineId,
      plantId,
      command,
      operator,
      userRole,
      reqId,
      timestamp: new Date(),
      previousState: currentState.currentState,
      newState: newState
    });

    console.log(`Command ${command} sent to ${machineId}, state updated to ${newState}`);

    return { 
      reqId, 
      message: `Command ${command} sent to ${machineId}`,
      newState: newState 
    };
  }

  getMachineState(machineId) {
    const state = this.machineStates.get(machineId);
    return state || { 
      currentState: MACHINE_STATES.IDLE,
      lastUpdate: new Date(),
      machineData: { machineId, name: 'Unknown Machine' }
    };
  }

  getAllMachineStates() {
    const states = {};
    this.machineStates.forEach((state, machineId) => {
      states[machineId] = state;
    });
    return states;
  }
}

// Authentication middleware
const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Role-based authorization middleware
function authorize(roles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login attempts per windowMs
  message: 'Too many authentication attempts, please try again later.'
});

async function start() {
  // Connect to MongoDB
  const mClient = new MongoClient(MONGO_URL);
  await mClient.connect();
  const db = mClient.db();
  const telemetryCol = db.collection('telemetry');
  const machinesCol = db.collection('machines');
  const commandsCol = db.collection('commands');
  const alertsCol = db.collection('alerts');
  const usersCol = db.collection('users');

  // Initialize default admin user if not exists
  const adminExists = await usersCol.findOne({ username: 'admin' });
  if (!adminExists) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await usersCol.insertOne({
      username: 'admin',
      password: hashedPassword,
      role: 'admin',
      name: 'System Administrator',
      created: new Date()
    });
    console.log('Default admin user created: admin / admin123');
  }

  // Initialize default operator user if not exists
  const operatorExists = await usersCol.findOne({ username: 'operator' });
  if (!operatorExists) {
    const hashedPassword = await bcrypt.hash('operator123', 10);
    await usersCol.insertOne({
      username: 'operator',
      password: hashedPassword,
      role: 'operator',
      name: 'Factory Operator',
      created: new Date()
    });
    console.log('Default operator user created: operator / operator123');
  }

  // Initialize default machines if not exists
  const defaultMachines = [
    { machineId: 'CNC-001', name: '5-Axis CNC Mill', type: 'cnc', location: 'Machining Cell A', status: 'idle' },
    { machineId: 'CNC-002', name: 'CNC Lathe', type: 'cnc', location: 'Machining Cell B', status: 'idle' },
    { machineId: 'IM-001', name: 'Injection Molder 200T', type: 'injection', location: 'Molding Line 1', status: 'idle' },
    { machineId: 'IM-002', name: 'Injection Molder 500T', type: 'injection', location: 'Molding Line 2', status: 'idle' },
    { machineId: 'ROB-001', name: '6-Axis Assembly Robot', type: 'robot', location: 'Assembly Station 1', status: 'idle' },
    { machineId: 'ROB-002', name: 'SCARA Robot', type: 'robot', location: 'Assembly Station 2', status: 'idle' },
    { machineId: 'CV-001', name: 'Main Conveyor Line', type: 'conveyor', location: 'Production Line', status: 'idle' },
    { machineId: 'CV-002', name: 'Packaging Conveyor', type: 'conveyor', location: 'Packaging Area', status: 'idle' },
    { machineId: 'QC-001', name: 'Vision Inspection System', type: 'quality', location: 'Final Inspection', status: 'idle' },
    { machineId: 'QC-002', name: 'Laser Measurement', type: 'quality', location: 'Quality Lab', status: 'idle' }
  ];

  // Remove old machines if they exist
  await machinesCol.deleteMany({ 
    machineId: { $in: ['MX-101', 'MX-102', 'MX-103'] } 
  });

  // Insert new machines
  for (const machine of defaultMachines) {
    const exists = await machinesCol.findOne({ machineId: machine.machineId });
    if (!exists) {
      await machinesCol.insertOne(machine);
      console.log(`Created machine: ${machine.machineId}`);
    }
  }

  // Express + Socket.IO
  const app = express();
  app.use(cors());
  app.use(express.json());
  
  // Apply rate limiting to API routes
  app.use('/api/', apiLimiter);
  app.use('/auth/login', authLimiter);

  const server = http.createServer(app);
  const io = new Server(server, { 
    cors: { 
      origin: process.env.FRONTEND_URL || "http://localhost:8080",
      methods: ["GET", "POST"]
    } 
  });

  // MQTT client with enhanced error handling
  const mqttClient = mqtt.connect(MQTT_URL, {
    reconnectPeriod: 1000,
    connectTimeout: 30 * 1000
  });

  // Initialize Machine Controller
  const machineController = new MachineController(mqttClient, db);
  await machineController.initializeMachineStates();

  mqttClient.on('connect', () => {
    console.log('MQTT connected to', MQTT_URL);
    mqttClient.subscribe(`factory/+/machine/+/telemetry`);
    mqttClient.subscribe(`factory/+/machine/+/control/ack`);
    mqttClient.subscribe(`factory/+/machine/+/status`);
    console.log('Subscribed to MQTT topics');
  });

  mqttClient.on('error', (err) => {
    console.error('MQTT connection error:', err);
  });

  mqttClient.on('message', async (topic, payload) => {
    try {
      const msg = JSON.parse(payload.toString());
      const parts = topic.split('/');
      const plant = parts[1];
      const machineId = parts[3];
      const kind = parts[4];

      console.log(`MQTT message received: ${topic}`);

      if (kind === 'telemetry') {
        console.log(`Telemetry from ${machineId}:`, msg);
        
        const doc = {
          machineId,
          plantId: plant,
          ts: msg.ts ? new Date(msg.ts) : new Date(),
          temp: msg.temp,
          vibration: msg.vibration,
          power: msg.power,
          raw: msg
        };
        
        await telemetryCol.insertOne(doc);
        
        // Enhanced: Process telemetry with control logic
        const evaluation = await machineController.processTelemetry(doc);
        
        io.emit('telemetry', { ...doc, evaluation });
        
        // Emit evaluation results
        io.emit('machine_evaluation', {
          machineId,
          evaluation,
          timestamp: new Date()
        });

        // Simple alert rule example (threshold 85)
        const threshold = 85;
        if (doc.temp && doc.temp > threshold) {
          const alert = { 
            machineId, 
            plantId: plant, 
            ts: new Date(), 
            type: 'over_temp', 
            value: doc.temp, 
            threshold, 
            acknowledged: false 
          };
          await alertsCol.insertOne(alert);
          io.emit('alert', alert);
        }
      } else if (kind === 'control' && parts[5] === 'ack') {
        // topic: factory/<plant>/machine/<id>/control/ack
        const { reqId, status } = msg;
        await commandsCol.updateOne({ reqId }, { 
          $set: { 
            status, 
            tsAck: new Date(),
            acknowledgedBy: 'machine'
          } 
        });
        io.emit('commandAck', { reqId, machineId, status });
      } else if (kind === 'status') {
        // Update machine state from device
        const newState = msg.status;
        console.log(`Updating machine ${machineId} state to: ${newState}`);
        
        machineController.machineStates.set(machineId, {
          currentState: newState,
          lastUpdate: new Date(),
          statusMessage: msg.message || 'State updated'
        });

        // Also update in database
        await machinesCol.updateOne(
          { machineId: machineId },
          { $set: { status: newState, lastStatusUpdate: new Date() } }
        );

        io.emit('status', { 
          machineId, 
          status: newState, 
          message: msg.message,
          ts: new Date() 
        });

        // Also emit a general update for the dashboard
        io.emit('machine_state_update', {
          machineId,
          state: newState,
          timestamp: new Date()
        });
      }
    } catch (err) {
      console.error('Error handling MQTT message', err);
    }
  });

  // Authentication endpoints
  app.post('/auth/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
      }

      const user = await usersCol.findOne({ username });
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { 
          userId: user._id.toString(), 
          username: user.username, 
          role: user.role,
          name: user.name 
        }, 
        JWT_SECRET, 
        { expiresIn: '24h' }
      );

      res.json({
        token,
        user: {
          id: user._id,
          username: user.username,
          role: user.role,
          name: user.name
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/auth/register', async (req, res) => {
    try {
      const { username, password, name, role = 'viewer' } = req.body;
      
      // Check if user exists
      const existingUser = await usersCol.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ error: 'Username already exists' });
      }

      // Hash password and create user
      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await usersCol.insertOne({
        username,
        password: hashedPassword,
        name,
        role,
        created: new Date()
      });

      res.json({ 
        message: 'User created successfully',
        userId: result.insertedId 
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Public health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
  });

  // Protected REST endpoints - ALL require authentication
  app.get('/api/machines', authenticate, async (req, res) => {
    try {
      const machines = await machinesCol.find().toArray();
      res.json(machines);
    } catch (error) {
      console.error('Error fetching machines:', error);
      res.status(500).json({ error: 'Failed to fetch machines' });
    }
  });

  app.post('/api/machines', authenticate, authorize(['admin']), async (req, res) => {
    try {
      const doc = req.body;
      await machinesCol.insertOne(doc);
      res.json({ ok: true });
    } catch (error) {
      console.error('Error creating machine:', error);
      res.status(500).json({ error: 'Failed to create machine' });
    }
  });

  app.get('/api/machines/:id/telemetry', authenticate, async (req, res) => {
    try {
      const { id } = req.params;
      const limit = parseInt(req.query.limit || '200', 10);
      const data = await telemetryCol.find({ machineId: id }).sort({ ts: -1 }).limit(limit).toArray();
      res.json(data);
    } catch (error) {
      console.error('Error fetching telemetry:', error);
      res.status(500).json({ error: 'Failed to fetch telemetry' });
    }
  });

  app.get('/api/alerts', authenticate, async (req, res) => {
    try {
      const data = await alertsCol.find().sort({ ts: -1 }).limit(200).toArray();
      res.json(data);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      res.status(500).json({ error: 'Failed to fetch alerts' });
    }
  });

  // Enhanced machine state endpoints
  app.get('/api/machines/:id/state', authenticate, async (req, res) => {
    try {
      const { id } = req.params;
      const state = machineController.getMachineState(id);
      res.json(state);
    } catch (error) {
      console.error('Error fetching machine state:', error);
      res.status(500).json({ error: 'Failed to fetch machine state' });
    }
  });

  app.get('/api/machines/:id/conditions', authenticate, async (req, res) => {
    try {
      const { id } = req.params;
      const limit = parseInt(req.query.limit || '50', 10);
      const data = await db.collection('machine_conditions')
        .find({ machineId: id })
        .sort({ timestamp: -1 })
        .limit(limit)
        .toArray();
      res.json(data);
    } catch (error) {
      console.error('Error fetching conditions:', error);
      res.status(500).json({ error: 'Failed to fetch conditions' });
    }
  });

  // FIXED: Added authenticate middleware to commands endpoint
  app.post('/api/machines/:id/commands', authenticate, async (req, res) => {
    const { id } = req.params;
    const { cmd, params = {}, issuedBy = 'operator' } = req.body;
    
    try {
      console.log('User in command request:', req.user);
      
      if (!req.user || !req.user.role) {
        return res.status(401).json({ 
          ok: false, 
          error: 'User authentication missing or invalid' 
        });
      }

      const result = await machineController.manualControl(
        id, 
        PLANT_ID, 
        cmd, 
        issuedBy || req.user.username,
        req.user.role
      );
      res.json({ ok: true, ...result });
    } catch (error) {
      console.error('Command error:', error);
      res.status(400).json({ ok: false, error: error.message });
    }
  });

  // User management endpoints (admin only)
  app.get('/api/users', authenticate, authorize(['admin']), async (req, res) => {
    try {
      const users = await usersCol.find({}, { projection: { password: 0 } }).toArray();
      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  app.get('/api/profile', authenticate, async (req, res) => {
    try {
      const user = await usersCol.findOne(
        { username: req.user.username }, 
        { projection: { password: 0 } }
      );
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json(user);
    } catch (error) {
      console.error('Error fetching profile:', error);
      res.status(500).json({ error: 'Failed to fetch profile' });
    }
  });

  // Socket.IO authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        return next(new Error('Authentication error'));
      }
      socket.user = decoded;
      next();
    });
  });

  io.on('connection', (socket) => {
    console.log('Socket.IO connected', socket.id, 'user:', socket.user.username);
    
    // Send current machine states to newly connected client
    const machineStates = machineController.getAllMachineStates();
    socket.emit('initial_states', machineStates);
    
    socket.on('disconnect', () => {
      console.log('Socket.IO disconnected', socket.id);
    });
  });

  server.listen(PORT, () => {
    console.log(`Backend listening on ${PORT}`);
    console.log(`Plant ID: ${PLANT_ID}`);
    console.log(`Default admin: admin / admin123`);
    console.log(`Default operator: operator / operator123`);
  });
}

start().catch(err => {
  console.error(err);
  process.exit(1);
});