# 🏭 Smart Factory — Industrial IoT Monitoring & Control System

<img width="1889" height="887" alt="Screenshot 2025-10-23 185331" src="https://github.com/user-attachments/assets/1ce28cc0-2f3a-485c-966e-292ce156daf0" />


![Industry-4.0](https://img.shields.io/badge/Industry-4.0-blue) ![IoT-Industrial](https://img.shields.io/badge/IoT-Industrial-green) ![Real-time-Monitoring](https://img.shields.io/badge/Real--time-Monitoring-orange) ![Deployment-Docker](https://img.shields.io/badge/Deployment-Docker-lightblue)

A comprehensive Industrial IoT (IIoT) platform for real-time machine monitoring, predictive maintenance, and remote control designed for Smart Factory demonstrations, research, and portfolio showcases.

---

## 🔖 Table of Contents

* [Quick Start](#-quick-start)
* [Default Logins](#-default-logins)
* [Features](#-features)
* [Technology Stack](#-technology-stack)
* [Architecture](#-architecture)
* [Project Structure](#-project-structure)
* [Deployment](#-deployment)
* [API Endpoints](#-api-endpoints)
* [Real-time Features](#-real-time-features)
* [Security](#-security)
* [Monitoring & Analytics](#-monitoring--analytics)
* [Troubleshooting](#-troubleshooting)
* [Use Cases](#-use-cases)
* [Contributing](#-contributing)
* [License](#-license)

---

## 🚀 Quick Start

Clone the repository and bring everything up using Docker Compose (recommended):

```bash
# Clone and deploy in one command
git clone <your-repo-url> && cd industrial-iot-machine-monitoring-control-system && docker-compose up --build

# Access the frontend dashboard
# http://localhost:8080 (default)
```

> Development mode (optional)

```bash
# Backend
cd backend && npm install && npm run dev

# Frontend
cd frontend && npm install && npm run dev

# Simulator
cd simulator && npm install && npm start
```

---

## 📦 Default Logins

* **Admin**: `admin` / `admin123`
* **Operator**: `operator` / `operator123`

> You should change these credentials in production. The backend seeds an admin account on first run.

---

## 📋 Features

**Core Capabilities**

* Real-time Monitoring — Live telemetry (temperature, vibration, power)
* Predictive Maintenance — Automated alerts and condition evaluation
* Remote Control — Start, stop, maintenance mode, emergency stop
* Smart Factory Dashboard — React-based visualizations with Socket.IO
* Role-based Access — Admin, Operator, Viewer

**Simulated Environment**

* Pre-configured set of simulated industrial machines (CNC, robots, conveyors, etc.)
* Realistic telemetry patterns and automated safety rules
* Factory layout visualization and production-line representation

<img width="1919" height="912" alt="Screenshot 2025-10-23 185322" src="https://github.com/user-attachments/assets/62284af3-89d3-4af8-a3db-342ff5eafe52" />


---

## 🛠️ Technology Stack

| Layer      | Technology                    |
| ---------- | ----------------------------- |
| Frontend   | React 18 + Vite + Socket.IO   |
| Backend    | Node.js + Express + Socket.IO |
| Database   | MongoDB                       |
| Messaging  | MQTT (Mosquitto)              |
| Security   | JWT + bcrypt                  |
| Containers | Docker + Docker Compose       |

---

## 🏗️ Architecture

```
Frontend (React + Socket.IO) ↔ Backend (Express + Socket.IO)
              ↕                      ↕
         MQTT Broker  ↔  Simulators  ↔  Industrial Machines
              ↕
            MongoDB
```

* Frontend receives live telemetry and evaluation events via Socket.IO.
* Backend subscribes to MQTT telemetry topics, stores telemetry in MongoDB, runs control/predictive logic, and publishes control messages.
* Simulator publishes machine telemetry to the MQTT broker to emulate real devices.

---

## 📁 Project Structure

```
industrial-iot-machine-monitoring-control-system/
├── backend/          # Node.js API & WebSocket server
├── frontend/         # React dashboard (Vite)
├── simulator/        # Machine data simulator (publishes MQTT telemetry)
├── mosquitto/        # MQTT broker config / persistence
└── docker-compose.yml
```

---

## 🚀 Deployment

**Production (Docker Compose)**

```bash
# Full deployment
docker-compose up --build -d

# View logs
docker-compose logs -f

# Stop and remove containers
docker-compose down
```

**Notes**

* Ensure environment variables are set in `.env` or your deployment environment (e.g. `MONGO_URL`, `MQTT_URL`, `JWT_SECRET`, `PLANT_ID`, `FRONTEND_URL`).
* For production, properly secure MQTT (TLS) and MongoDB (authentication + network rules).

---

## 🔌 API Endpoints (selected)

**Authentication**

```http
POST /auth/login          # { username, password } -> returns { token, user }
POST /auth/register       # register new user (admin-only in some setups)
```

**Machines & Telemetry**

```http
GET  /api/machines                  # List all machines
GET  /api/machines/:id/telemetry    # Historical telemetry for machine
GET  /api/machines/:id/state        # Current computed state
GET  /api/machines/:id/conditions   # Condition/evaluation history
POST /api/machines/:id/commands     # Send control command to machine
GET  /api/alerts                    # Recent alerts
```

**Socket.IO**

* `telemetry` — live telemetry messages
* `machine_evaluation` — evaluation results after control logic
* `alert` — emitted when thresholds/conditions are exceeded
* `commandAck` — command acknowledgement from device

---

## ⚡ Real-time Features

* Live telemetry updates (default simulator publishes every 1–5 seconds depending on config)
* Instant command dispatch via MQTT (control topics)
* Automatic alerts & safety rules (e.g. emergency stop on critical temperature)
* Dashboard updates via Socket.IO for instant UX

---

## 🛡️ Security

* **JWT Authentication** for REST and Socket.IO connections.
* **Role-based authorization** (admin / operator / viewer) for restricting control actions.
* **Password hashing** using `bcrypt`.
* **Rate-limiting** on auth and API endpoints to mitigate brute-force and abuse.
* For production, enable TLS for MQTT and HTTPS for the frontend/backend.

---

## 📈 Monitoring & Analytics

* Real-time OEE and machine efficiency calculations
* Production counting and quality metrics tracking
* Energy usage and power consumption dashboards
* Alerts table with history and acknowledgment support

---

## 🐛 Troubleshooting

**Common issues & fixes**

* **No telemetry data** → Check the `simulator` container logs and verify MQTT broker connectivity:

```bash
docker-compose logs simulator
```

* **Authentication errors** → Clear browser local storage or re-login. Ensure `JWT_SECRET` is identical between backend and any services that verify tokens.

* **Port conflicts** → Stop other services using `8080`, `3000`, `1883` (MQTT) or change ports in `docker-compose.yml`.

**Helpful debug commands**

```bash
docker-compose ps

docker-compose logs backend

docker-compose logs simulator
```

---




