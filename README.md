# SENTINEL — AI-Powered Accident Detection & Emergency Response

PERN stack (PostgreSQL · Express · React · Node.js) with Socket.IO real-time updates, JWT auth, server-side WhatsApp dispatch, and ESP32/GPS hardware integration hooks.

## Folder Structure

```
sentinel-pern/
├── backend/
│   ├── migrations/          001_init.sql · 002_indexes.sql
│   ├── scripts/             migrate.js (run schema + seed admin)
│   ├── src/
│   │   ├── config/          db.js · env.js
│   │   ├── controllers/     auth · contacts · devices · incidents · telemetry
│   │   ├── middleware/       auth · error · validate
│   │   ├── models/          user · contact · device · incident · dispatch
│   │   ├── routes/          auth · contacts · devices · incidents · telemetry
│   │   ├── services/
│   │   │   └── providers/   callmebot.provider · twilio.provider
│   │   ├── sockets/         index.js (Socket.IO + JWT auth)
│   │   ├── utils/           asyncHandler · jwt · logger
│   │   ├── app.js           Express setup
│   │   └── server.js        HTTP + Socket.IO bootstrap
│   ├── .env.example
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── api/             client · auth · contacts · incidents · devices
│   │   ├── components/      layout · dashboard · contacts · simulator · ui
│   │   ├── contexts/        AuthContext
│   │   ├── hooks/           useSocket · useGPS · useAccelerometer · useToast
│   │   ├── pages/           Login · Dashboard · Contacts · History · Simulator · Setup
│   │   ├── styles/          global.css (Tailwind + Leaflet dark theme)
│   │   └── App.jsx
│   ├── nginx.conf
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

## Quick Start (Local Dev)

### 1. Install dependencies
```bash
cd backend  && npm install
cd ../frontend && npm install
```

### 2. Configure environment
```bash
cp backend/.env.example backend/.env
# Edit backend/.env — set DATABASE_URL, JWT_SECRET
```

### 3. Run migrations + seed admin
```bash
cd backend && npm run migrate
# Creates schema and default user: admin / sentinel
```

### 4. Start servers (two terminals)
```bash
# Terminal 1
cd backend && npm run dev      # → http://localhost:5000

# Terminal 2
cd frontend && npm run dev     # → http://localhost:5173
```

## Docker (All-in-One)
```bash
cp backend/.env.example backend/.env   # set JWT_SECRET at minimum
docker compose up --build
# Frontend → http://localhost:5173
# Backend  → http://localhost:5000
# Postgres → localhost:5432
```

## API Reference

| Method | Route                        | Auth | Description                        |
|--------|------------------------------|------|------------------------------------|
| POST   | /api/auth/register           | ✗    | Create account                     |
| POST   | /api/auth/login              | ✗    | Returns JWT token                  |
| GET    | /api/auth/me                 | ✓    | Current user                       |
| GET    | /api/contacts                | ✓    | List contacts                      |
| POST   | /api/contacts                | ✓    | Create contact                     |
| PUT    | /api/contacts/:id            | ✓    | Update contact                     |
| DELETE | /api/contacts/:id            | ✓    | Delete contact                     |
| GET    | /api/incidents               | ✓    | Incident history with dispatch logs|
| POST   | /api/incidents               | ✓    | Create incident record             |
| DELETE | /api/incidents               | ✓    | Clear all incidents                |
| POST   | /api/incidents/dispatch      | ✓    | Trigger WhatsApp dispatch          |
| POST   | /api/incidents/test-send     | ✓    | Test single contact                |
| GET    | /api/devices                 | ✓    | List hardware devices              |
| POST   | /api/devices/register        | ✓    | Register ESP32 device              |
| POST   | /api/telemetry               | ✓    | Ingest sensor data from hardware   |

## Socket.IO Events (server → client)

| Event              | Payload                                    | When                                  |
|--------------------|--------------------------------------------|---------------------------------------|
| `incident:detected`| `{ incident_id, event_type, magnitude, … }`| ESP32 telemetry exceeds 2.5g threshold|
| `dispatch:complete`| `{ incident_id, results }`                 | All contacts processed                |

## Switching to Twilio (Production)

```env
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxx
TWILIO_AUTH_TOKEN=your_token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

No code changes needed — the notification service picks the provider from the env variable.

## ESP32 Telemetry Payload

```json
{
  "device_id":     "ESP32-MAC-A4B2",
  "accel_x":       1.23,
  "accel_y":      -4.56,
  "accel_z":       0.91,
  "latitude":      17.38501,
  "longitude":     78.48670,
  "gps_accuracy":  8.5,
  "battery_level": 87
}
```

POST to `POST /api/telemetry` with `Authorization: Bearer <token>`.  
When magnitude > 2.5g, an incident is created and pushed to the browser via Socket.IO instantly.
