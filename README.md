🏭 Smart Factory 4.0 - Industrial IoT Monitoring & Control System
https://img.shields.io/badge/Industry-4.0-blue
https://img.shields.io/badge/IoT-Industrial-green
https://img.shields.io/badge/Real--time-Monitoring-orange
https://img.shields.io/badge/Deployment-Docker-lightblue

A comprehensive Industrial IoT (IIoT) platform for real-time machine monitoring, predictive maintenance, and remote control in smart factory environments. This system demonstrates Industry 4.0 capabilities with live telemetry data, automated safety controls, and a modern web-based dashboard.

🚀 Key Features
📊 Real-time Monitoring
Live Telemetry Dashboard - Temperature, vibration, and power consumption monitoring

Machine State Tracking - Real-time status updates (Running, Stopped, Maintenance, Error)

Factory-wide Metrics - Overall Equipment Effectiveness (OEE), quality rates, energy consumption

Visual Factory Layout - Interactive factory floor visualization

⚡ Smart Control Systems
Remote Machine Control - Start, stop, maintenance mode, and emergency stops

Automated Safety Protocols - Emergency stops triggered by critical conditions

Predictive Maintenance - Automatic alerts for temperature, vibration, and power thresholds

Role-based Access Control - Different permissions for admins, operators, and viewers

🔧 Industrial Protocols & Security
MQTT Communication - Industrial-grade messaging protocol

JWT Authentication - Secure API access with token-based authentication

TLS/SSL Ready - Production-ready security implementation

Real-time WebSockets - Live data updates via Socket.IO

🏗️ System Architecture
text
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend       │    │   Database      │
│   (React)       │◄──►│   (Node.js)      │◄──►│   (MongoDB)    │
│                 │    │                  │    │                 │
│ - Real-time     │    │ - REST API       │    │ - Telemetry     │
│   Dashboard     │    │ - Socket.IO      │    │ - Machine States│
│ - Machine       │    │ - MQTT Client    │    │ - Alerts        │
│   Controls      │    │ - Authentication │    │ - Users         │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │
         │                        │
         │              ┌──────────────────┐
         │              │   MQTT Broker    │
         │              │   (Mosquitto)    │
         │              └──────────────────┘
         │                        ▲
         │                        │
         │              ┌──────────────────┐
         └──────────────│   Simulator      │
                        │   (Node.js)      │
                        │                  │
                        │ - Machine Data   │
                        │ - Control Responses│
                        └──────────────────┘
🛠️ Technology Stack
Component	Technology	Purpose
Frontend	React 18 + Vite	Modern, responsive dashboard
Backend	Node.js + Express	REST API & real-time services
Database	MongoDB	Time-series data & system state
Messaging	MQTT (Mosquitto)	Industrial IoT communication
Real-time	Socket.IO	Live dashboard updates
Container	Docker + Docker Compose	Easy deployment
Security	JWT + bcrypt	Authentication & authorization
📋 Prerequisites
Docker & Docker Compose

Node.js 18+ (for development only)

Modern web browser

🚀 Quick Start
Method 1: Docker (Recommended)
bash
# Clone the repository
git clone <repository-url>
cd industrial-iot-machine-monitoring-control-system

# Start all services
docker-compose up --build

# Access the application:
# Frontend: http://localhost:8080
# Backend API: http://localhost:3000
# MQTT Broker: localhost:1883
# MongoDB: localhost:27017
Method 2: Development Mode
bash
# Backend setup
cd backend
npm install
npm run dev

# Frontend setup (new terminal)
cd frontend
npm install
npm run dev

# Simulator (new terminal)
cd simulator
npm install
npm start
🔑 Default Login Credentials
Role	Username	Password	Permissions
Administrator	admin	admin123	Full system access
Operator	operator	operator123	Machine control & monitoring
Viewer	viewer	viewer123	Read-only access
🏭 Simulated Factory Environment
The system includes 10 simulated industrial machines:

Machine Types & Capabilities
Machine Type	Examples	Key Metrics	Control Features
CNC Machines	5-Axis CNC Mill, CNC Lathe	Temperature, Vibration, Tool Wear	Start/Stop, Speed Control
Injection Molding	200T & 500T Molders	High Temperature, Cycle Times	Temperature Control
Assembly Robots	6-Axis, SCARA Robots	Precision, Accuracy	Program Control
Conveyor Systems	Main Line, Packaging	Throughput, Load Percentage	Speed Control
Quality Control	Vision Inspection, Laser	Defect Rates, Accuracy	Calibration
Automated Safety Rules
Temperature ≥ 95°C: Emergency Stop

Vibration ≥ 4.0: Immediate Stop & Maintenance Alert

Power ≥ 320W: Power Cutoff

Continuous Monitoring: Real-time condition evaluation

📡 API Documentation
Authentication Endpoints
http
POST /auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
Machine Management
http
GET /api/machines
Authorization: Bearer <token>

POST /api/machines/:id/commands
Authorization: Bearer <token>
Content-Type: application/json

{
  "cmd": "start",
  "issuedBy": "operator"
}
Real-time Data
http
GET /api/machines/:id/telemetry?limit=100
GET /api/machines/:id/state
GET /api/alerts
🎯 Use Cases
🏭 Smart Factory Operations
Real-time Production Monitoring - Live view of all machines

Predictive Maintenance - Early detection of potential failures

Remote Operations - Control machines from anywhere

Energy Management - Monitor and optimize power consumption

🔬 Educational & Research
Industry 4.0 Demonstrations - Complete IIoT platform example

IoT Protocol Studies - MQTT, WebSocket implementations

Real-time Data Processing - Time-series data handling

Cybersecurity in IoT - JWT, RBAC implementations

💼 Professional Development
IoT Portfolio Project - Comprehensive system for resumes

Full-stack Development - React, Node.js, MongoDB stack

Industrial Automation - PLC simulation and control logic

🗂️ Project Structure
text
industrial-iot-machine-monitoring-control-system/
├── 📁 backend/                 # Node.js API server
│   ├── server.js              # Main application
│   ├── package.json
│   └── Dockerfile
├── 📁 frontend/               # React dashboard
│   ├── src/
│   │   ├── components/        # UI components
│   │   ├── App.jsx           # Main application
│   │   └── main.jsx
│   ├── package.json
│   └── Dockerfile
├── 📁 simulator/              # Machine data simulator
│   ├── simple-sim.js         # Telemetry generator
│   ├── package.json
│   └── Dockerfile
├── 📁 mosquitto/             # MQTT broker configuration
│   └── config/
│       └── mosquitto.conf
├── 📄 docker-compose.yml     # Multi-container setup
└── 📄 README.md
🔧 Configuration
Environment Variables
Backend (.env)

env
PORT=3000
MQTT_URL=mqtt://mosquitto:1883
MONGO_URL=mongodb://mongo:27017/iot_iiot
PLANT_ID=A1
JWT_SECRET=your-super-secret-key
FRONTEND_URL=http://localhost:8080
Simulator (.env)

env
MQTT_URL=mqtt://mosquitto:1883
PLANT_ID=A1
🐛 Troubleshooting
Common Issues
"No telemetry data available"

Check if simulator is running: docker-compose logs simulator

Verify MQTT connection in backend logs

Authentication errors

Clear browser localStorage and login again

Check JWT_SECRET in backend environment

Docker port conflicts

Stop other services using ports 8080, 3000, 1883, 27017

Use docker-compose down then restart

Database connection issues

Wait for MongoDB to initialize (30-60 seconds)

Check docker-compose logs mongo

Logs & Debugging
bash
# View all service logs
docker-compose logs -f

# View specific service logs
docker-compose logs backend
docker-compose logs frontend  
docker-compose logs simulator

# Check service status
docker-compose ps

# Restart specific service
docker-compose restart backend