//industrial-iot-machine-monitoring-control-system/backend/server.js
const express = require('express');
const http = require('http');
const { MongoClient } = require('mongodb');
const mqtt = require('mqtt');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const PORT = process.env.PORT || 3000;
const MQTT_URL = process.env.MQTT_URL || 'mqtt://localhost:1883';
const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/iot_iiot';
const PLANT_ID = process.env.PLANT_ID || 'A1';

async function start() {
  // Connect to MongoDB
  const mClient = new MongoClient(MONGO_URL);
  await mClient.connect();
  const db = mClient.db();
  const telemetryCol = db.collection('telemetry');
  const machinesCol = db.collection('machines');
  const commandsCol = db.collection('commands');
  const alertsCol = db.collection('alerts');

  // Express + Socket.IO
  const app = express();
  app.use(cors());
  app.use(express.json());
  const server = http.createServer(app);
  const io = new Server(server, { cors: { origin: '*' } });

  // MQTT client
  const mqttClient = mqtt.connect(MQTT_URL);

  mqttClient.on('connect', () => {
    console.log('MQTT connected to', MQTT_URL);
    mqttClient.subscribe(`factory/+/machine/+/telemetry`);
    mqttClient.subscribe(`factory/+/machine/+/control/ack`);
    mqttClient.subscribe(`factory/+/machine/+/status`);
  });

  mqttClient.on('message', async (topic, payload) => {
    try {
      const msg = JSON.parse(payload.toString());
      const parts = topic.split('/');
      // expected: ["factory", "<plant>", "machine", "<machineId>", "<kind>"]
      const plant = parts[1];
      const machineId = parts[3];
      const kind = parts[4];

      if (kind === 'telemetry') {
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
        io.emit('telemetry', doc);

        // simple alert rule example (threshold 85)
        const threshold = 85;
        if (doc.temp && doc.temp > threshold) {
          const alert = { machineId, plantId: plant, ts: new Date(), type: 'over_temp', value: doc.temp, threshold, acknowledged: false };
          await alertsCol.insertOne(alert);
          io.emit('alert', alert);
        }
      } else if (kind === 'control' && parts[5] === 'ack') {
        // topic: factory/<plant>/machine/<id>/control/ack
        const { reqId, status } = msg;
        await commandsCol.updateOne({ reqId }, { $set: { status, tsAck: new Date() } });
        io.emit('commandAck', { reqId, machineId, status });
      } else if (kind === 'status') {
        io.emit('status', { machineId, status: msg.status, ts: new Date() });
      }
    } catch (err) {
      console.error('Error handling MQTT message', err);
    }
  });

  // REST endpoints
  app.get('/api/machines', async (req, res) => {
    const machines = await machinesCol.find().toArray();
    res.json(machines);
  });

  app.post('/api/machines', async (req, res) => {
    const doc = req.body;
    await machinesCol.insertOne(doc);
    res.json({ ok: true });
  });

  app.get('/api/machines/:id/telemetry', async (req, res) => {
    const { id } = req.params;
    const limit = parseInt(req.query.limit || '200', 10);
    const data = await telemetryCol.find({ machineId: id }).sort({ ts: -1 }).limit(limit).toArray();
    res.json(data);
  });

  app.get('/api/alerts', async (req, res) => {
    const data = await alertsCol.find().sort({ ts: -1 }).limit(200).toArray();
    res.json(data);
  });

  app.post('/api/machines/:id/commands', async (req, res) => {
    const { id } = req.params;
    const { cmd, params = {}, issuedBy = 'operator' } = req.body;
    const reqId = `${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
    const doc = { machineId: id, cmd, params, issuedBy, reqId, status: 'pending', tsIssued: new Date() };
    await commandsCol.insertOne(doc);
    const topic = `factory/${PLANT_ID}/machine/${id}/control`;
    mqttClient.publish(topic, JSON.stringify({ reqId, cmd, params }));
    res.json({ ok: true, reqId });
  });

  io.on('connection', (socket) => {
    console.log('Socket.IO connected', socket.id);
  });

  server.listen(PORT, () => {
    console.log(`Backend listening on ${PORT}`);
  });
}

start().catch(err => {
  console.error(err);
  process.exit(1);
});
