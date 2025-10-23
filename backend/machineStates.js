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

module.exports = {
  MACHINE_STATES,
  CONTROL_RULES,
  evaluateMachineCondition
};