const { evaluateMachineCondition, MACHINE_STATES } = require('./machineStates');

class MachineController {
  constructor(mqttClient, db) {
    this.mqttClient = mqttClient;
    this.db = db;
    this.machineStates = new Map(); // In-memory state tracking
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
    if (evaluation.recommendedState === MACHINE_STATES.STOPPED) {
      await this.emergencyStop(machineId, plantId, evaluation.alerts);
    } else if (evaluation.recommendedState === MACHINE_STATES.MAINTENANCE) {
      await this.scheduleMaintenance(machineId, plantId, evaluation.alerts);
    }

    // Update current state
    this.machineStates.set(machineId, {
      currentState: evaluation.recommendedState,
      lastEvaluation: evaluation,
      lastUpdate: new Date()
    });

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
  async manualControl(machineId, plantId, command, operator) {
    const currentState = this.machineStates.get(machineId);
    
    // Safety checks
    if (command === 'start' && currentState?.evaluation?.overallStatus === 'ISSUE_DETECTED') {
      throw new Error('Cannot start machine with detected issues. Please check alerts.');
    }

    if (command === 'stop' && currentState?.currentState === MACHINE_STATES.STOPPED) {
      throw new Error('Machine is already stopped');
    }

    // Execute command
    const reqId = `manual-${Date.now()}`;
    const topic = `factory/${plantId}/machine/${machineId}/control`;
    
    this.mqttClient.publish(topic, JSON.stringify({
      reqId,
      cmd: command,
      operator,
      timestamp: new Date()
    }));

    // Log manual command
    await this.db.collection('manual_commands').insertOne({
      machineId,
      plantId,
      command,
      operator,
      reqId,
      timestamp: new Date(),
      currentState: currentState?.currentState
    });

    return { reqId, message: `Command ${command} sent to ${machineId}` };
  }

  getMachineState(machineId) {
    return this.machineStates.get(machineId) || { currentState: MACHINE_STATES.IDLE };
  }
}

module.exports = MachineController; 