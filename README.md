# Industrial IoT — Machine Monitoring & Remote Control

## What this project does
- Simulates machines that publish telemetry (temp, vibration, power) via MQTT.
- Backend ingests telemetry, stores it in MongoDB, and streams it to a React dashboard via Socket.IO.
- Dashboard shows machines, live telemetry, history, and allows sending control commands (Start/Stop).
- Commands are published to MQTT and simulators respond with an ACK.

## Quick start (Docker)
1. Install Docker & Docker Compose.
2. From repo root:
   docker-compose up --build

Services:
- Mosquitto MQTT broker (1883)
- MongoDB (27017)
- Backend API (3000)
- Frontend (http://localhost:8080)
- Simulator (publishes telemetry to mosquitto)

## Quick start (local, no Docker)
1. Start Mosquitto broker locally (or use existing).
2. Start MongoDB locally.
3. Backend:
   - cd backend
   - cp .env.example .env (edit if needed)
   - npm install
   - npm start
4. Simulator:
   - cd simulator
   - npm install
   - npm start
5. Frontend:
   - cd frontend
   - npm install
   - npm run dev
   - open http://localhost:5173 (or configured port)

## MQTT topics
- Telemetry: factory/<plant>/machine/<machineId>/telemetry
- Control command: factory/<plant>/machine/<machineId>/control
- Control ack: factory/<plant>/machine/<machineId>/control/ack
- Status: factory/<plant>/machine/<machineId>/status

## API
- GET /api/machines
- POST /api/machines
- GET /api/machines/:id/telemetry
- POST /api/machines/:id/commands  (body: {cmd, params, issuedBy})

## Next steps & improvements
- Add authentication (JWT) and RBAC.
- Use TimescaleDB or InfluxDB for time-series retention & downsampling.
- Add TLS for MQTT and HTTPS endpoints.
- Add device provisioning and unique credentials per device.
- Replace simulator with ESP32/C code (MQTT) and test on real hardware.
