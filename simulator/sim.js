//industrial-iot-machine-monitoring-control-system/simulator/sim.js 
require('dotenv').config();
const mqtt = require('mqtt');
const MQTT_URL = process.env.MQTT_URL || 'mqtt://localhost:1883';
const PLANT = process.env.PLANT_ID || 'A1';

const client = mqtt.connect(MQTT_URL);
const machines = ['MX-101','MX-102','MX-103'];

client.on('connect', () => {
  console.log('Simulator connected to', MQTT_URL);
  machines.forEach(mid => client.subscribe(`factory/${PLANT}/machine/${mid}/control`));
  setInterval(() => {
    machines.forEach(mid => {
      const payload = {
        machineId: mid,
        ts: new Date().toISOString(),
        temp: Math.round((60 + Math.random()*40)*100)/100,
        vibration: Math.round((Math.random()*5)*100)/100,
        power: Math.round((200 + Math.random()*100)*100)/100
      };
      client.publish(`factory/${PLANT}/machine/${mid}/telemetry`, JSON.stringify(payload));
    });
  }, 2000);
});

client.on('message', (topic, payloadBuf) => {
  try {
    const msg = JSON.parse(payloadBuf.toString());
    console.log('Control received:', topic, msg);
    // ack with reqId:
    const parts = topic.split('/');
    const mid = parts[3];
    client.publish(`factory/${PLANT}/machine/${mid}/control/ack`, JSON.stringify({ reqId: msg.reqId, status: 'ack' }));
  } catch (err) {
    console.error('sim error', err);
  }
});
