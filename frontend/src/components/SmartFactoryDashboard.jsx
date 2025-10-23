// industrial-iot-machine-monitoring-control-system/frontend/src/components/SmartFactoryDashboard.jsx
import React, { useState, useEffect } from "react";

export default function SmartFactoryDashboard({ machines, telemetry, onSelectMachine }) {
  const [factoryMetrics, setFactoryMetrics] = useState({
    overallEfficiency: 0,
    activeMachines: 0,
    totalProduction: 0,
    qualityRate: 0,
    energyConsumption: 0
  });

  const [machineStatus, setMachineStatus] = useState({});

  useEffect(() => {
    // Calculate factory-wide metrics
    calculateFactoryMetrics();
  }, [machines, telemetry]);

  const calculateFactoryMetrics = () => {
    if (machines.length > 0) {
      let totalEfficiency = 0;
      let activeCount = 0;
      let totalProduction = 0;
      let totalPower = 0;
      let qualitySystems = 0;
      let qualityRateSum = 0;

      machines.forEach(machine => {
        const machineData = telemetry[machine.machineId];
        if (machineData) {
          const isRunning = machineData.state === 'running';
          if (isRunning) activeCount++;
          
          if (machineData.efficiency) totalEfficiency += machineData.efficiency;
          if (machineData.productionCount) totalProduction += machineData.productionCount;
          if (machineData.power) totalPower += machineData.power;
          
          // Quality systems specific metrics
          if (machine.type === 'quality' && machineData.defectRate) {
            qualitySystems++;
            qualityRateSum += (100 - parseFloat(machineData.defectRate));
          }
        }
      });

      setFactoryMetrics({
        overallEfficiency: machines.length > 0 ? Math.round((totalEfficiency / machines.length) * 100) : 0,
        activeMachines: activeCount,
        totalProduction: totalProduction,
        qualityRate: qualitySystems > 0 ? Math.round(qualityRateSum / qualitySystems) : 0,
        energyConsumption: Math.round(totalPower / 1000) // Convert to kW
      });

      // Update machine status
      const status = {};
      machines.forEach(machine => {
        const data = telemetry[machine.machineId];
        status[machine.machineId] = data?.state || machine.status || 'idle';
      });
      setMachineStatus(status);
    }
  };

  const getMachineTypeIcon = (type) => {
    const icons = {
      cnc: '⚙️',
      injection: '🔥',
      robot: '🤖',
      conveyor: '🔄',
      quality: '🔍'
    };
    return icons[type] || '🏭';
  };

  const getStatusColor = (status) => {
    const colors = {
      running: '#4CAF50',
      idle: '#FFC107',
      stopped: '#F44336',
      maintenance: '#FF9800',
      error: '#9C27B0',
      emergency_stop: '#D32F2F',
      offline: '#9E9E9E',
      unknown: '#757575'
    };
    return colors[status] || '#757575';
  };

  const getMachineTypeColor = (type) => {
    const colors = {
      cnc: '#2196F3',
      injection: '#FF5722',
      robot: '#9C27B0',
      conveyor: '#4CAF50',
      quality: '#FFC107'
    };
    return colors[type] || '#607D8B';
  };

  const getMachineData = (machineId) => {
    const data = telemetry[machineId];
    if (!data) {
      return {
        temp: 0,
        vibration: 0,
        power: 0,
        state: machineStatus[machineId] || 'idle',
        productionCount: 0,
        efficiency: 0
      };
    }
    return data;
  };

  return (
    <div style={{ padding: '20px', background: '#f5f5f5', minHeight: '100vh' }}>
      {/* Factory Overview Header */}
      <div style={{ 
        background: 'white', 
        padding: '20px', 
        borderRadius: '8px', 
        marginBottom: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>🏭 Smart Factory Dashboard</h1>
        <p style={{ margin: '0', color: '#7f8c8d' }}>Real-time monitoring of production line</p>
        
        {/* Key Metrics */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '15px', 
          marginTop: '20px' 
        }}>
          <div style={{ textAlign: 'center', padding: '15px', background: '#e8f5e8', borderRadius: '8px' }}>
            <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#4CAF50' }}>
              {factoryMetrics.overallEfficiency}%
            </div>
            <div style={{ color: '#666' }}>Overall Efficiency</div>
          </div>
          
          <div style={{ textAlign: 'center', padding: '15px', background: '#e3f2fd', borderRadius: '8px' }}>
            <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#2196F3' }}>
              {factoryMetrics.activeMachines}/{machines.length}
            </div>
            <div style={{ color: '#666' }}>Active Machines</div>
          </div>
          
          <div style={{ textAlign: 'center', padding: '15px', background: '#fff3e0', borderRadius: '8px' }}>
            <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#FF9800' }}>
              {factoryMetrics.totalProduction.toLocaleString()}
            </div>
            <div style={{ color: '#666' }}>Total Production</div>
          </div>
          
          <div style={{ textAlign: 'center', padding: '15px', background: '#fce4ec', borderRadius: '8px' }}>
            <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#E91E63' }}>
              {factoryMetrics.qualityRate}%
            </div>
            <div style={{ color: '#666' }}>Quality Rate</div>
          </div>
          
          <div style={{ textAlign: 'center', padding: '15px', background: '#e8eaf6', borderRadius: '8px' }}>
            <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#3F51B5' }}>
              {factoryMetrics.energyConsumption} kW
            </div>
            <div style={{ color: '#666' }}>Energy Usage</div>
          </div>
        </div>
      </div>

      {/* Machine Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
        gap: '20px' 
      }}>
        {machines.map(machine => {
          const machineData = getMachineData(machine.machineId);
          const status = machineData.state;
          
          return (
            <div 
              key={machine.machineId}
              style={{ 
                background: 'white',
                borderRadius: '8px',
                padding: '20px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                borderLeft: `4px solid ${getMachineTypeColor(machine.type)}`,
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
              }}
              onClick={() => onSelectMachine(machine.machineId)}
            >
              {/* Machine Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.5em' }}>{getMachineTypeIcon(machine.type)}</span>
                    <h3 style={{ margin: 0, fontSize: '1.1em' }}>{machine.name}</h3>
                  </div>
                  <div style={{ fontSize: '0.9em', color: '#7f8c8d', marginTop: '4px' }}>
                    {machine.machineId} • {machine.location}
                  </div>
                </div>
                <div style={{ 
                  padding: '4px 8px', 
                  background: getStatusColor(status),
                  color: 'white',
                  borderRadius: '12px',
                  fontSize: '0.8em',
                  fontWeight: 'bold'
                }}>
                  {status.toUpperCase()}
                </div>
              </div>

              {/* Machine Data */}
              <div style={{ fontSize: '0.9em' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                  <div>
                    <div style={{ color: '#666' }}>Temperature</div>
                    <div style={{ 
                      fontWeight: 'bold',
                      color: machineData.temp > 80 ? '#F44336' : '#4CAF50'
                    }}>
                      {machineData.temp}°C
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#666' }}>Power</div>
                    <div style={{ fontWeight: 'bold' }}>
                      {Math.round(machineData.power)}W
                    </div>
                  </div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <div style={{ color: '#666' }}>Vibration</div>
                    <div style={{ 
                      fontWeight: 'bold',
                      color: machineData.vibration > 3 ? '#F44336' : '#4CAF50'
                    }}>
                      {machineData.vibration}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#666' }}>Efficiency</div>
                    <div style={{ fontWeight: 'bold' }}>
                      {Math.round(machineData.efficiency * 100)}%
                    </div>
                  </div>
                </div>

                {/* Production count */}
                {machineData.productionCount > 0 && (
                  <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #eee' }}>
                    <div style={{ color: '#666' }}>Production Count</div>
                    <div style={{ fontWeight: 'bold' }}>
                      {machineData.productionCount.toLocaleString()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Factory Layout Visualization */}
      <div style={{ 
        background: 'white', 
        padding: '20px', 
        borderRadius: '8px', 
        marginTop: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ margin: '0 0 15px 0' }}>🏗️ Factory Layout</h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '10px',
          background: '#ecf0f1',
          padding: '15px',
          borderRadius: '4px'
        }}>
          {/* Machining Cell */}
          <div style={{ gridColumn: '1 / 3', background: '#e3f2fd', padding: '10px', borderRadius: '4px' }}>
            <strong>Machining Cell</strong>
            <div>CNC-001, CNC-002</div>
          </div>
          
          {/* Molding Line */}
          <div style={{ gridColumn: '3 / 5', background: '#ffebee', padding: '10px', borderRadius: '4px' }}>
            <strong>Molding Line</strong>
            <div>IM-001, IM-002</div>
          </div>
          
          {/* Assembly Station */}
          <div style={{ gridColumn: '1 / 3', background: '#f3e5f5', padding: '10px', borderRadius: '4px' }}>
            <strong>Assembly Station</strong>
            <div>ROB-001, ROB-002</div>
          </div>
          
          {/* Quality Control */}
          <div style={{ gridColumn: '3 / 5', background: '#fff8e1', padding: '10px', borderRadius: '4px' }}>
            <strong>Quality Control</strong>
            <div>QC-001, QC-002</div>
          </div>
          
          {/* Conveyor System */}
          <div style={{ gridColumn: '1 / 5', background: '#e8f5e8', padding: '10px', borderRadius: '4px', textAlign: 'center' }}>
            <strong>Conveyor System</strong>
            <div>CV-001, CV-002</div>
          </div>
        </div>
      </div>
    </div>
  );
}