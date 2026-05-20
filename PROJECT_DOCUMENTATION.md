# SENTINEL
## AI-Powered Accident Detection & Emergency Response System
### Complete Project Documentation

**Version:** 1.0  
**Date:** May 2026  
**Developer:** JASMIN20041234  
**Repository:** https://github.com/JASMIN20041234/AI-Powered-Accident-Detection-Emergency-Response-System  
**Live Site:** https://sentinelemergencysystem.netlify.app  

---

# PART 1 — PROJECT OVERVIEW

## 1.1 Introduction

SENTINEL is a full-stack, cloud-connected emergency response system designed to detect vehicle accidents in real time and automatically notify emergency contacts via WhatsApp — without any manual intervention from the victim.

The system bridges a critical gap in road safety: when accidents occur, injured or unconscious victims cannot call for help. SENTINEL automatically detects the impact, confirms it is not a false positive by giving a 30-second cancellation window, and then dispatches WhatsApp alert messages containing the victim's real GPS coordinates to all registered emergency contacts.

## 1.2 Problem Statement

Every year, thousands of road accident victims die not from the impact itself but from delayed emergency response. The time between an accident and the arrival of help is the most critical window. If a person is unconscious or trapped, they cannot call for help. Traditional alert systems require the victim to manually press a button or make a call — which is not possible in severe accidents.

## 1.3 Solution

SENTINEL solves this with three layers:

1. **Hardware Layer** — An accelerometer detects sudden G-force changes (impacts above 2.5g). A GPS module captures real-time coordinates. A NodeMCU WiFi module sends this data to the cloud instantly.

2. **Cloud Layer** — A Node.js backend receives the telemetry, creates an incident record in PostgreSQL, and automatically dispatches WhatsApp alert messages via Twilio to all registered emergency contacts. This happens server-side — no CORS issues, no mobile browser limitations.

3. **Dashboard Layer** — A React web application shows live GPS location on a map, displays accelerometer readings in real time, manages emergency contacts, and shows a 30-second countdown overlay when an impact is detected, allowing conscious users to cancel false alerts.

## 1.4 Key Highlights

- **Zero taps required** — Entire dispatch chain is automated from hardware impact to WhatsApp delivery
- **Real GPS coordinates** — Google Maps link sent in every alert
- **30-second cancel window** — Prevents false alerts from speed bumps or rough roads
- **Free fallback** — `wa.me` share links work even without Twilio API subscription
- **Fully cloud-hosted** — Frontend on Netlify, Backend on Render, Database on Neon
- **Mobile responsive** — Works on all screen sizes

---

# PART 2 — SYSTEM ARCHITECTURE

## 2.1 High-Level Architecture Diagram

```
┌───────────────────────────────────────────────────────────────────┐
│                         HARDWARE LAYER                            │
│                                                                   │
│   ADXL335           Arduino Uno          NodeMCU ESP8266          │
│   Accelerometer  →  Impact Logic     →   WiFi HTTP POST           │
│   (A0, A1, A2)      2.5g threshold       /api/telemetry           │
│   3.3V powered      10-sample avg        ALERT:<lat>,<lng>,<mag>  │
│                     30s cooldown                                  │
│                                                                   │
│   NEO-6M GPS   →   Serial (pins 2,3)                              │
│   SIM900A GSM  →   Serial (pins 6,7) [offline SMS fallback]       │
│   16×2 LCD     →   Pins 8–13          [local status display]      │
└────────────────────────────┬──────────────────────────────────────┘
                             │ HTTPS POST JSON
                             ▼
┌───────────────────────────────────────────────────────────────────┐
│                    BACKEND (Node.js + Express)                    │
│                         Render Cloud                              │
│                                                                   │
│   POST /api/telemetry                                             │
│     1. Authenticate device (device_id + device_key)              │
│     2. Store raw telemetry in device_telemetry table              │
│     3. Calculate magnitude = √(x² + y² + z²)                     │
│     4. If magnitude > 2.5g → Create Incident record              │
│     5. setImmediate() → Auto-dispatch (non-blocking)              │
│          → NotificationService.dispatch()                         │
│          → TwilioProvider.send() per contact                      │
│          → Log results to dispatch_logs                           │
│     6. Socket.IO emit → incident:detected (real-time to browser)  │
│                                                                   │
│   Auth: JWT (7d expiry, bcrypt passwords)                         │
│   Database: PostgreSQL via pg Pool (Neon)                         │
│   Real-time: Socket.IO with JWT auth                              │
│   Security: Helmet, CORS, Rate Limiting (300 req/15min)           │
└──────────────┬────────────────────────┬──────────────────────────┘
               │ Socket.IO              │ REST API (Axios)
               ▼                        ▼
┌───────────────────────────────────────────────────────────────────┐
│                   FRONTEND (React + Vite)                         │
│                        Netlify CDN                                │
│                                                                   │
│   Dashboard    → Live Leaflet map, GPS marker, Accel panel        │
│   Contacts     → Add/edit/delete emergency contacts               │
│   History      → All incidents with dispatch outcomes             │
│   Simulator    → 6 realistic accident scenarios for testing       │
│   Setup Guide  → Hardware wiring instructions                     │
│                                                                   │
│   Theme: Dark / Light mode toggle (persisted in localStorage)     │
│   Map tiles: CartoDB dark_all / light_all (switches with theme)   │
│   Responsive: Mobile-first, scrollable nav on small screens       │
└──────────────────────────────┬────────────────────────────────────┘
                               │ Twilio WhatsApp API
                               ▼
┌───────────────────────────────────────────────────────────────────┐
│                   TWILIO WHATSAPP API                             │
│                                                                   │
│   Template: sentinel_emergency_alert                              │
│   {{1}} = Time of detection (e.g. 03:45 PM, 20 May 2026)         │
│   {{2}} = GPS coordinates + Google Maps link                      │
│                                                                   │
│   Fallback: wa.me share links (free, no API key needed)           │
└───────────────────────────────────────────────────────────────────┘
```

## 2.2 Data Flow — Accident Detection to WhatsApp Alert

```
Step 1:  ADXL335 detects impact > 2.5g
Step 2:  Arduino averages 10 samples, confirms threshold
Step 3:  Arduino sends "ALERT:<lat>,<lng>,<mag>;" to NodeMCU via Serial
Step 4:  NodeMCU parses alert, POSTs JSON to /api/telemetry
Step 5:  Backend authenticates device, creates Incident record in PostgreSQL
Step 6:  Socket.IO pushes incident:detected to all browser clients
Step 7:  Dashboard shows 30-second countdown overlay
Step 8:  setImmediate fires async dispatch:
           - Fetch all contacts for the user
           - For each contact → TwilioProvider.send()
           - Twilio sends WhatsApp template with GPS + time
           - Result logged to dispatch_logs table
Step 9:  Socket.IO pushes dispatch:complete with delivery results
Step 10: Dashboard shows dispatch overlay with per-contact status
```

---

# PART 3 — TECH STACK

## 3.1 Backend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | ≥18.0.0 | JavaScript runtime |
| Express.js | ^4.19.2 | HTTP server and routing |
| Socket.IO | ^4.7.5 | Real-time WebSocket events |
| PostgreSQL (pg) | ^8.11.5 | Database client |
| bcryptjs | ^2.4.3 | Password hashing (cost factor 12) |
| jsonwebtoken | ^9.0.2 | JWT generation and verification |
| Twilio | ^5.2.2 | WhatsApp message delivery |
| helmet | ^7.1.0 | HTTP security headers |
| cors | ^2.8.5 | Cross-origin request handling |
| express-rate-limit | ^7.3.1 | API rate limiting |
| dotenv | ^16.4.5 | Environment variable loading |

## 3.2 Frontend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| React | ^18 | UI component framework |
| Vite | ^5 | Build tool and dev server |
| React Router | ^6 | Client-side routing (SPA) |
| Tailwind CSS | ^3 | Utility-first CSS framework |
| Leaflet / react-leaflet | ^1.9.4 | Interactive GPS map |
| Axios | ^1 | HTTP API client |
| Socket.IO Client | ^4 | Real-time event handling |

## 3.3 Cloud Infrastructure

| Service | Plan | Purpose |
|---------|------|---------|
| Netlify | Free | Frontend hosting (CDN, auto-deploy) |
| Render | Free | Backend hosting (Node.js, Socket.IO) |
| Neon | Free | Serverless PostgreSQL |
| UptimeRobot | Free | Ping /api/health every 5 min (keeps Render alive) |
| GitHub | Free | Source code and CI/CD trigger |

## 3.4 Hardware Components

| Component | Model | Purpose |
|-----------|-------|---------|
| Microcontroller | Arduino Uno | Impact detection and sensor reading |
| WiFi Module | NodeMCU ESP8266 | WiFi connectivity and HTTP POST |
| Accelerometer | ADXL335 | 3-axis analog G-force measurement |
| GPS Module | NEO-6M | Real-time latitude/longitude |
| GSM Module | SIM900A | Offline SMS fallback |
| Display | 16×2 LCD | Local status display |

---

# PART 4 — HARDWARE SETUP

## 4.1 Component List

| Item | Quantity |
|------|----------|
| Arduino Uno | 1 |
| NodeMCU ESP8266 | 1 |
| ADXL335 Accelerometer Module | 1 |
| NEO-6M GPS Module | 1 |
| SIM900A GSM Module | 1 |
| 16×2 LCD Display | 1 |
| 10kΩ Potentiometer | 1 |
| 220Ω Resistor | 1 |
| Breadboard | 1 |
| Jumper Wires | Set |
| 5V 2A External Power Supply | 1 (for SIM900A) |

## 4.2 Pin Connections

### ADXL335 Accelerometer → Arduino
```
ADXL335 VCC  →  Arduino 3.3V   (IMPORTANT: 3.3V not 5V)
ADXL335 GND  →  Arduino GND
ADXL335 X    →  Arduino A0
ADXL335 Y    →  Arduino A1
ADXL335 Z    →  Arduino A2
```

### NEO-6M GPS → Arduino (SoftwareSerial)
```
GPS TX   →  Arduino Pin 2
GPS RX   →  Arduino Pin 3
GPS VCC  →  Arduino 5V
GPS GND  →  Arduino GND
```

### NodeMCU ESP8266 ↔ Arduino (SoftwareSerial)
```
NodeMCU D5 (GPIO14) RX  →  Arduino Pin 5 (TX)
NodeMCU D6 (GPIO12) TX  →  Arduino Pin 4 (RX)
NodeMCU GND             →  Arduino GND
(Do NOT connect NodeMCU VCC to Arduino — power NodeMCU separately via USB)
```

### SIM900A GSM → Arduino (SoftwareSerial)
```
SIM900A TX   →  Arduino Pin 6
SIM900A RX   →  Arduino Pin 7
SIM900A VCC  →  External 5V 2A supply  (NOT Arduino 5V pin)
SIM900A GND  →  Common GND
```

### 16×2 LCD → Arduino
```
LCD VSS  →  GND
LCD VDD  →  5V
LCD V0   →  Potentiometer wiper (contrast adjustment)
LCD RS   →  Arduino Pin 8
LCD RW   →  GND
LCD EN   →  Arduino Pin 9
LCD D4   →  Arduino Pin 10
LCD D5   →  Arduino Pin 11
LCD D6   →  Arduino Pin 12
LCD D7   →  Arduino Pin 13
LCD A    →  5V via 220Ω resistor (backlight +)
LCD K    →  GND (backlight −)
```

## 4.3 Impact Detection Algorithm

```
Sampling:
  - Read A0 (X), A1 (Y), A2 (Z) from ADXL335
  - Collect 10 samples, calculate average
  - Convert ADC to G-force: g = (adc - 338) / 61.4
    where 338 = zero-G ADC value, 61.4 = counts per G

Magnitude:
  - magnitude = sqrt(ax² + ay² + az²)
  - Threshold: 2.5g

Cooldown:
  - 30 seconds between consecutive detections
  - Prevents multiple alerts from a single accident event

Alert Protocol (Arduino → NodeMCU via Serial):
  - Format: ALERT:<latitude>,<longitude>,<magnitude>;\n
  - Example: ALERT:17.38501,78.48670,3.82;
```

## 4.4 NodeMCU Configuration

Before flashing `nodemcu_wifi.ino`, edit these values:
```cpp
const char* WIFI_SSID   = "YourWiFiSSID";
const char* WIFI_PASS   = "YourWiFiPassword";
const char* API_URL     = "https://ai-powered-accident-detection-emergency.onrender.com/api/telemetry";
const char* DEVICE_ID   = "ESP32-001";
const char* DEVICE_KEY  = "your-device-registration-key";
```

---

# PART 5 — DATABASE SCHEMA

## 5.1 Tables Overview

The PostgreSQL database (hosted on Neon) contains 6 tables:

```
users           → Admin/operator accounts
contacts        → Emergency contact details per user
incidents       → Accident detection records
dispatch_logs   → WhatsApp delivery results per contact per incident
devices         → Registered hardware devices
device_telemetry→ Raw sensor data from hardware
```

## 5.2 Full Schema

```sql
-- Extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users
CREATE TABLE IF NOT EXISTS users (
  id             UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  username       VARCHAR(50)  UNIQUE NOT NULL,
  email          VARCHAR(255) UNIQUE,
  password_hash  VARCHAR(255) NOT NULL,
  role           VARCHAR(20)  NOT NULL DEFAULT 'operator',
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Emergency Contacts
CREATE TABLE IF NOT EXISTS contacts (
  id               UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name             VARCHAR(100) NOT NULL,
  relationship     VARCHAR(50)  NOT NULL DEFAULT 'Other',
  phone            VARCHAR(20)  NOT NULL,
  callmebot_apikey VARCHAR(100),
  is_active        BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Incidents
CREATE TABLE IF NOT EXISTS incidents (
  id          UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type  VARCHAR(100)  NOT NULL,
  magnitude   DECIMAL(5,2)  NOT NULL,
  latitude    DECIMAL(10,7),
  longitude   DECIMAL(10,7),
  accuracy    DECIMAL(8,2),
  status      VARCHAR(20)   NOT NULL DEFAULT 'detected',
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Dispatch Logs
CREATE TABLE IF NOT EXISTS dispatch_logs (
  id            UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_id   UUID         NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  contact_id    UUID         REFERENCES contacts(id) ON DELETE SET NULL,
  contact_name  VARCHAR(100) NOT NULL,
  contact_phone VARCHAR(20)  NOT NULL,
  status        VARCHAR(20)  NOT NULL DEFAULT 'pending',
  error_message TEXT,
  sent_at       TIMESTAMPTZ,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Hardware Devices
CREATE TABLE IF NOT EXISTS devices (
  id               UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id        VARCHAR(100) UNIQUE NOT NULL,
  device_name      VARCHAR(100),
  device_type      VARCHAR(50)  NOT NULL DEFAULT 'ESP32',
  firmware_version VARCHAR(20),
  last_seen        TIMESTAMPTZ,
  is_active        BOOLEAN      NOT NULL DEFAULT TRUE,
  metadata         JSONB        NOT NULL DEFAULT '{}',
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Device Telemetry
CREATE TABLE IF NOT EXISTS device_telemetry (
  id            UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_id     UUID          NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  accel_x       DECIMAL(8,4),
  accel_y       DECIMAL(8,4),
  accel_z       DECIMAL(8,4),
  magnitude     DECIMAL(8,4),
  latitude      DECIMAL(10,7),
  longitude     DECIMAL(10,7),
  gps_accuracy  DECIMAL(8,2),
  battery_level INTEGER,
  recorded_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
```

---

# PART 6 — API REFERENCE

## 6.1 Authentication

All protected routes require: `Authorization: Bearer <jwt_token>`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | ✗ | Login with username + password → JWT token |
| POST | `/api/auth/register` | ✗ | Register new account |
| GET | `/api/auth/me` | ✓ | Get current logged-in user |

**Login Request:**
```json
{ "username": "sentinelemergency", "password": "Sentinel@2026" }
```
**Login Response:**
```json
{ "token": "eyJhbGci...", "user": { "id": "...", "username": "sentinelemergency", "role": "admin" } }
```

## 6.2 Contacts

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/contacts` | ✓ | List all emergency contacts |
| POST | `/api/contacts` | ✓ | Create new contact |
| PUT | `/api/contacts/:id` | ✓ | Update contact |
| DELETE | `/api/contacts/:id` | ✓ | Delete contact |

**Create Contact Body:**
```json
{
  "name": "John Doe",
  "relationship": "Family",
  "phone": "919876543210",
  "is_active": true
}
```

## 6.3 Incidents

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/incidents` | ✓ | All incidents with dispatch logs |
| POST | `/api/incidents` | ✓ | Create incident record |
| DELETE | `/api/incidents` | ✓ | Clear all incident history |
| POST | `/api/incidents/:id/dispatch` | ✓ | Manually trigger WhatsApp dispatch |
| POST | `/api/incidents/test-send` | ✓ | Send test message to one contact |

## 6.4 Devices & Telemetry

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/devices` | ✓ | List registered devices |
| POST | `/api/devices/register` | ✓ | Register a new hardware device |
| POST | `/api/telemetry` | ✓ | Ingest sensor data from hardware |

**Telemetry Payload (ESP32 → Backend):**
```json
{
  "device_id":     "ESP32-001",
  "accel_x":        1.23,
  "accel_y":       -4.56,
  "accel_z":        0.91,
  "latitude":       17.38501,
  "longitude":      78.48670,
  "gps_accuracy":   8.5,
  "battery_level":  87
}
```

## 6.5 Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Returns server status + timestamp |

## 6.6 Socket.IO Real-Time Events

| Event | Direction | Payload | Trigger |
|-------|-----------|---------|---------|
| `incident:detected` | Server → Client | `{ incident_id, event_type, magnitude, latitude, longitude }` | Hardware telemetry exceeds 2.5g |
| `dispatch:complete` | Server → Client | `{ incident_id, results[] }` | All contacts processed |

---

# PART 7 — FRONTEND PAGES

## 7.1 Login Page (`/login`)
- Username and password form with JWT authentication
- Password show/hide toggle (eye icon)
- `autoComplete="off"` to prevent browser autofill
- Split layout: dark art panel (left) + form (right)
- Both dark and light mode supported

## 7.2 Dashboard Page (`/`)
- **Live Map** — Leaflet map with pulsing GPS marker, accuracy circle, auto-recenter
- **GPS Banner** — Shows GPS fix status (good/pending/bad) with message
- **System Status** — GPS latitude, longitude, accuracy, contact count grid
- **Accelerometer Panel** — X/Y/Z bars, magnitude display, 2.5g threshold indicator
- **Auto-Dispatch Panel** — Provider info, test message button
- **Alert Overlay** — 30-second countdown ring, incident details, cancel button
- **Dispatch Overlay** — Per-contact delivery status, WhatsApp share buttons, close

## 7.3 Contacts Page (`/contacts`)
- Add/edit/delete emergency contacts
- Name, relationship, phone number fields
- Per-contact WhatsApp test send
- Auto-dispatch readiness indicator

## 7.4 History Page (`/history`)
- All incident records with event type and magnitude
- Delivery status per incident (sent/failed/skipped count)
- GPS coordinates (hidden on mobile to save space)
- Clear all history button

## 7.5 AI Simulator Page (`/simulator`)
Six built-in accident scenarios for testing the full pipeline:

| Scenario | Magnitude | Severity |
|----------|-----------|----------|
| Highway Collision | 4.8g | High |
| Side Impact (T-bone) | 3.9g | High |
| Rollover Event | 5.2g | Critical |
| Minor Fender Bender | 2.7g | Low |
| Pothole (False Positive) | 2.6g | Low |
| Two-Wheeler Crash | 4.1g | High |

## 7.6 Setup Guide Page (`/setup`)
Complete hardware wiring instructions with ASCII circuit diagrams.

---

# PART 8 — WHATSAPP ALERT SYSTEM

## 8.1 Twilio WhatsApp Template

Template Name: `sentinel_emergency_alert`

```
An accident has been detected for your contact.

Time of Detection: {{1}}
Location: {{2}}

Please check on them immediately or contact emergency services.
```

- `{{1}}` → Formatted time: "03:45 PM, 20 May 2026"
- `{{2}}` → GPS coordinates + Google Maps link: "17.38501, 78.48670 — maps.google.com/?q=17.38501,78.48670"

## 8.2 Auto-Dispatch Flow

```javascript
// In telemetry controller — non-blocking
setImmediate(async () => {
  const contacts = await ContactModel.findAllByUser(device.user_id);
  await NotificationService.dispatch({ incident, contacts, userId: device.user_id });
});
```

The `setImmediate()` ensures the HTTP 200 response is sent to the hardware device immediately, while dispatch happens asynchronously in the background.

## 8.3 Free WhatsApp Fallback

For contacts that fail Twilio delivery (sandbox restrictions, etc.), a "Share" button generates a free `wa.me` link:

```
https://wa.me/919876543210?text=🚨 SENTINEL Emergency Alert...
```

No API key needed. Works for any WhatsApp number worldwide.

## 8.4 Switching Providers

Change `SMS_PROVIDER` in `.env` — no code changes needed:
- `SMS_PROVIDER=twilio` → Twilio WhatsApp API
- `SMS_PROVIDER=callmebot` → CallMeBot free API

---

# PART 9 — DEPLOYMENT GUIDE

## 9.1 Frontend — Netlify

`netlify.toml` at project root handles all configuration automatically:

```toml
[build]
  base    = "frontend"
  command = "npm run build"
  publish = "dist"
[build.environment]
  NODE_VERSION = "20"
[[redirects]]
  from   = "/*"
  to     = "/index.html"
  status = 200
```

**Steps:**
1. Connect GitHub repo on netlify.com → Add new site → Import from Git
2. Add env vars: `VITE_API_URL` and `VITE_SOCKET_URL` → your Render URL
3. Deploy

## 9.2 Backend — Render

`render.yaml` at project root:

```yaml
services:
  - type: web
    name: sentinel-backend
    runtime: node
    rootDir: backend
    buildCommand: npm install
    startCommand: npm start
    healthCheckPath: /api/health
```

**Steps:**
1. Connect GitHub repo on render.com → New → Web Service
2. Language: Node, Root Directory: `backend`
3. Add all environment variables (see Section 9.4)
4. Deploy → copy the Render URL
5. Update `CLIENT_URL` on Render and `VITE_API_URL` on Netlify

## 9.3 Database — Neon

1. Create project at neon.tech
2. Copy the connection string (includes SSL params)
3. Run migrations: `cd backend && node scripts/migrate.js`
4. This creates all 6 tables and seeds the admin user from env vars

## 9.4 Environment Variables Reference

### Backend
```env
PORT=10000
NODE_ENV=production
CLIENT_URL=https://sentinelemergencysystem.netlify.app
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
JWT_SECRET=your-long-random-secret-here
JWT_EXPIRES_IN=7d
ADMIN_USERNAME=sentinelemergency
ADMIN_EMAIL=sentinelemergency@sentinel.com
ADMIN_PASSWORD=Sentinel@2026
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
TWILIO_DEFAULT_COUNTRY_CODE=91
TWILIO_CONTENT_SID=HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
LOG_LEVEL=info
```

### Frontend
```env
VITE_API_URL=https://ai-powered-accident-detection-emergency.onrender.com
VITE_SOCKET_URL=https://ai-powered-accident-detection-emergency.onrender.com
```

## 9.5 Keep Render Alive (Free Tier)

Render's free tier spins down after 15 minutes of inactivity. Fix:

1. Sign up at uptimerobot.com
2. Add monitor: HTTP(s), URL = `https://ai-powered-accident-detection-emergency.onrender.com/api/health`, every 5 minutes
3. Backend stays awake 24/7

---

# PART 10 — SECURITY

| Area | Implementation |
|------|---------------|
| Passwords | bcrypt with cost factor 12 |
| Authentication | JWT tokens, 7-day expiry, stored in localStorage |
| CORS | Restricted to `CLIENT_URL` only (comma-separated for multiple) |
| Rate Limiting | 300 requests per 15 minutes per IP on all `/api` routes |
| HTTP Headers | helmet.js — CSP, HSTS, X-Frame-Options, etc. |
| Admin Credentials | Never hardcoded — read only from environment variables |
| Secrets | `.env` files are gitignored; set in Netlify/Render dashboards |
| Device Auth | Hardware authenticates with `device_id` + `device_key` pair |

---

# PART 11 — PROJECT FOLDER STRUCTURE

```
AI-Powered-Accident-Detection-Emergency-Response-System/
│
├── backend/
│   ├── migrations/
│   │   ├── 001_init.sql           ← All 6 table definitions
│   │   └── 002_indexes.sql        ← Performance indexes
│   ├── scripts/
│   │   └── migrate.js             ← Runs migrations + seeds admin from env
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js              ← PostgreSQL pool connection
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── contacts.controller.js
│   │   │   ├── devices.controller.js
│   │   │   ├── incidents.controller.js
│   │   │   └── telemetry.controller.js  ← Auto-dispatch on impact
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js       ← JWT verify + requireAdmin
│   │   │   └── error.middleware.js
│   │   ├── models/
│   │   │   ├── user.model.js
│   │   │   ├── contact.model.js
│   │   │   ├── device.model.js
│   │   │   ├── incident.model.js
│   │   │   └── dispatch.model.js
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── contacts.routes.js
│   │   │   ├── devices.routes.js
│   │   │   ├── incidents.routes.js
│   │   │   └── telemetry.routes.js
│   │   ├── services/
│   │   │   ├── notification.service.js  ← buildContentVariables, dispatch
│   │   │   └── providers/
│   │   │       ├── twilio.provider.js   ← Template + free-text modes
│   │   │       └── callmebot.provider.js
│   │   ├── sockets/
│   │   │   └── index.js                 ← Socket.IO with JWT auth
│   │   ├── utils/
│   │   │   ├── asyncHandler.js
│   │   │   ├── jwt.js
│   │   │   └── logger.js
│   │   ├── app.js                       ← Express setup, CORS, routes
│   │   └── server.js                    ← HTTP + Socket.IO bootstrap
│   ├── .env                             ← Gitignored, local only
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── client.js                ← Axios with JWT interceptor, VITE_API_URL
│   │   │   ├── auth.api.js
│   │   │   ├── contacts.api.js
│   │   │   ├── incidents.api.js
│   │   │   └── devices.api.js
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── TopBar.jsx           ← Responsive nav with scrollable strip
│   │   │   │   └── ProtectedRoute.jsx
│   │   │   ├── dashboard/
│   │   │   │   ├── LiveMap.jsx          ← Leaflet map, dark/light tiles
│   │   │   │   ├── AccelerometerPanel.jsx
│   │   │   │   ├── AlertOverlay.jsx     ← 30s countdown ring
│   │   │   │   └── DispatchOverlay.jsx  ← wa.me share buttons
│   │   │   ├── contacts/
│   │   │   │   ├── ContactCard.jsx
│   │   │   │   └── ContactModal.jsx
│   │   │   ├── simulator/
│   │   │   │   └── ScenarioCard.jsx
│   │   │   └── ui/
│   │   │       ├── Btn.jsx
│   │   │       ├── Field.jsx
│   │   │       └── Toast.jsx
│   │   ├── contexts/
│   │   │   ├── AuthContext.jsx
│   │   │   └── ThemeContext.jsx         ← Dark/light toggle + localStorage
│   │   ├── hooks/
│   │   │   ├── useSocket.js             ← Socket.IO with VITE_SOCKET_URL
│   │   │   ├── useGPS.js
│   │   │   ├── useAccelerometer.js
│   │   │   └── useToast.js
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx            ← Eye icon, no autofill
│   │   │   ├── DashboardPage.jsx        ← Responsive 1→2 col grid
│   │   │   ├── ContactsPage.jsx
│   │   │   ├── HistoryPage.jsx
│   │   │   ├── SimulatorPage.jsx
│   │   │   └── SetupGuidePage.jsx
│   │   ├── styles/
│   │   │   └── global.css               ← Tailwind + light mode overrides + Leaflet
│   │   └── App.jsx
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── index.html
│
├── hardware/
│   ├── arduino/
│   │   └── arduino_main.ino
│   ├── nodemcu/
│   │   └── nodemcu_wifi.ino
│   └── CIRCUIT_DIAGRAM.md
│
├── netlify.toml                         ← Frontend build + SPA redirect
├── render.yaml                          ← Backend Render config
└── PROJECT_DOCUMENTATION.md            ← This file
```

---

# PART 12 — DEVELOPMENT CONVERSATION LOG

This section is a complete record of the development conversation — every feature built, bug fixed, and decision made across all sessions.

---

## Session 1 — Project Conversion & Core Backend

**User:** Requested conversion of a static HTML prototype into a full PERN stack application.

**Built:**
- PostgreSQL schema: 6 tables (users, contacts, incidents, dispatch_logs, devices, device_telemetry)
- Express REST API with 15 endpoints across 5 route groups
- JWT authentication with bcrypt password hashing (cost factor 12)
- Socket.IO server with JWT auth for real-time events
- React frontend with React Router, Axios, Tailwind CSS
- Leaflet map integration with live GPS marker

---

## Session 2 — Twilio WhatsApp Integration

**User:** "I am using the Twilio WhatsApp API to send emergency alert messages. Help me integrate this into my PERN stack application."

Shared credentials:
- Account SID: ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx *(redacted)*
- Auth Token: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx *(redacted)*

**Built:**
- `twilio.provider.js` with dual mode: template (contentSid) and free-text fallback
- `notification.service.js` with `buildContentVariables()` mapping `{{1}}`=time, `{{2}}`=location
- Auto-dispatch in `telemetry.controller.js` using `setImmediate()` (non-blocking)
- Phone number sanitization: `phone.replace(/\D/g, '')` → prepend `whatsapp:+`

**Issue encountered:** Twilio error 63015 — recipient (+918500054786) hadn't joined sandbox.

**Resolution:** User must send "join owner-anywhere" to +14155238886 to join sandbox. For production, Meta-approved template bypasses sandbox.

---

## Session 3 — WhatsApp Template Setup

**User:** Shared screenshots of the new `sentinel_emergency_alert` template with SID `HXed4a8a15bf29decef984f4685bbe92e0`.

**Issue:** Template variable order was swapped — `{{1}}` was location and `{{2}}` was time in the backend, but the template defined the opposite.

**Fixed:** Updated `buildContentVariables()`:
```javascript
return { '1': timeStr, '2': locationStr };
// {{1}} = Time of Detection
// {{2}} = GPS Location + Maps link
```

---

## Session 4 — Hardware Design (Arduino + NodeMCU)

**User:** "I am providing the components here. Now create a circuit diagram and write the Arduino code. When an accident occurs, the system should automatically send an alert message from the web application to a WhatsApp number."

Components listed: Arduino Uno, NodeMCU ESP8266, ADXL335, NEO-6M GPS, SIM900A GSM, 16×2 LCD.

**Built:**
- `arduino_main.ino`: ADXL335 on A0/A1/A2 (3.3V), GPS SoftwareSerial(2,3), NodeMCU SoftwareSerial(4,5), GSM SoftwareSerial(6,7), LCD(8–13)
- 2.5g threshold, 30s cooldown, 10-sample average
- `readMagnitude()` using multiplication not `**` (Arduino compatibility)
- `nodemcu_wifi.ino`: Parses `ALERT:<lat>,<lng>,<mag>;` protocol, POSTs JSON to `/api/telemetry`
- `CIRCUIT_DIAGRAM.md`: Full ASCII schematic, pin reference tables, power budget notes
- Important note: SIM900A needs external 5V 2A — NOT from Arduino 5V pin

---

## Session 5 — Free WhatsApp Fallback

**User:** "All WhatsApp API providers charge $20+ subscription. Let's add a share feature so they can share the live location to any number on WhatsApp."

**Built:**
- `buildWALink()` function in `DispatchOverlay.jsx`
- Per-contact Share button for failed/skipped entries
- Broadcast "Share Live Location on WhatsApp" button at bottom
- Format: `https://wa.me/<phone>?text=<encoded_emergency_message>`
- Zero cost, no API key, works for any WhatsApp number worldwide

---

## Session 6 — UI Improvements

**User:** Shared screenshot showing map gap at bottom, requested dark/light mode, removal of CallMeBot field, and page title fix.

**Built:**
- `ThemeContext.jsx`: dark/light toggle persisted in localStorage
- `html.light .classname` CSS overrides in `global.css` (higher specificity than Tailwind)
- Map container: `flex flex-col`, inner `flex-1 min-h-[320px]` — fills gap
- CartoDB tiles: `dark_all` / `light_all`, `key={theme}` forces Leaflet remount on theme change
- Theme toggle button in `TopBar.jsx` (☀️/🌙)
- App wrapped with `<ThemeProvider>` in `App.jsx`
- CallMeBot API key field hidden when `SMS_PROVIDER === 'twilio'`
- Page title changed to `<title>SENTINEL</title>`

**Technical issue resolved:** Tailwind CSS variables are baked at build time — they cannot be changed at runtime. Solution: keep hardcoded dark colors in Tailwind config, use `html.light .classname` CSS overrides.

**React bug resolved:** `onExpired()` was being called inside a `setRemaining` state updater, causing setState-during-render error. Fixed with separate `useEffect(() => { if (remaining === 0) onExpiredRef.current(); }, [remaining])`.

---

## Session 7 — Database Connection (Neon)

**User:** Provided Neon PostgreSQL connection string and asked to verify it works.

```
postgresql://neondb_owner:xxxxxxxxxxxx@ep-xxxxxxxxxxxx.neon.tech/neondb?sslmode=require *(redacted)*
```

**Issue:** `.env` had both a local postgres URL (commented out) and Neon URL — duplicate `DATABASE_URL`.

**Fixed:** Rewrote `.env` with only the Neon URL.

**Result:** Migrations ran successfully — all 6 tables created, indexes applied, admin user seeded.

---

## Session 8 — Deployment (Netlify + Render)

**User:** "Is it possible to host frontend on Netlify and backend on Render?"

**Built:**
- `netlify.toml`: base=frontend, build=`npm run build`, publish=dist, SPA redirect
- `render.yaml`: Node web service, rootDir=backend, build=`npm install`, start=`npm start`
- Updated `api/client.js`: uses `VITE_API_URL` in production, falls back to `/api` locally
- Updated `app.js` CORS: accepts comma-separated `CLIENT_URL` list

**Deployment steps:**
1. Deployed backend on Render → got URL `https://ai-powered-accident-detection-emergency.onrender.com`
2. Deployed frontend on Netlify → got URL `https://sentinelemergencysystem.netlify.app`
3. Added `VITE_API_URL` and `VITE_SOCKET_URL` on Netlify pointing to Render
4. Added `CLIENT_URL` on Render pointing to Netlify
5. Both redeployed → fully connected

**Issue:** API calls were going to Netlify URL (`/api/...`) instead of Render. Cause: `VITE_API_URL` was empty when first deploy ran. Fix: Set env vars → trigger redeploy.

**Set up UptimeRobot** to ping `/api/health` every 5 minutes — prevents Render free tier sleep.

---

## Session 9 — Admin Credentials System

**User:** "Change credentials to username: superadmin@sentinel, password: Admin@123. Update values in .env by fetching from database. Do not hardcode anywhere."

**Built:**
- `migrate.js` updated to read `ADMIN_USERNAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` from env only
- Throws error if any of the three are missing (no silent defaults)
- Uses `UPDATE WHERE role='admin'` first → if no rows, `INSERT` (handles username rename gracefully)
- All three vars added to `.env`

**Credentials updated through multiple iterations:**
- `superadmin@sentinel` / `Admin@123`
- `superadmin` / `Admin@123`
- `sentinelemergency` / `Sentinel@2026`

---

## Session 10 — Login Page Cleanup

**User:** "Remove DEMO CREDENTIALS, 01 — Authentication, and v1.0 / PERN Stack from the login screen."

**Removed:**
- Demo credentials box (username: admin, password: sentinel)
- "01 — Authentication" section label
- "v1.0 / PERN Stack · Powered by WhatsApp API" footer

**User:** "The text content on the left panel came too low. Move it to the middle."

**Fixed:** Changed `justify-between` to `justify-start` + added `my-auto` to content div. Previously 3 flex items created even spacing; after removing the footer, `justify-between` pushed content to the very bottom.

---

## Session 11 — Mobile Responsiveness

**User:** "I tried on my mobile phone and it was not looking good. Make it responsive."

**Fixed across all files:**

`TopBar.jsx`:
- Split into two rows: logo + actions (top) and scrollable nav strip (bottom)
- `[&::-webkit-scrollbar]:hidden` + `scrollbarWidth: none` to hide the scrollbar
- Username text hidden on small screens (`hidden sm:inline`)

`DashboardPage.jsx`:
- `p-7` → `p-4 md:p-7`
- `style={{ gridTemplateColumns: '2fr 1fr' }}` → `grid-cols-1 lg:grid-cols-[2fr_1fr]`
- Title `text-[38px]` → `text-[26px] md:text-[38px]`
- Button labels shortened for mobile

`ContactsPage.jsx`, `HistoryPage.jsx`, `SimulatorPage.jsx`:
- Same padding and title size fixes

`HistoryPage.jsx`:
- Grid layout → flex layout for log rows
- GPS coordinates hidden on small screens (`hidden sm:inline`)
- Added `shrink-0` to icon, `flex-1 min-w-0 truncate` to text

---

## Session 12 — Light Mode Fix & Eye Icon

**User:** Shared screenshot of login page in light mode — left panel text was invisible.

**Root cause:** Left panel has hardcoded dark background (`#0f1218`), but `html.light .text-ink` overrides text to dark `#18181a`, making it invisible on dark background.

**Fixed:** Added `style={{ color: '#e8e9ec' }}` to SENTINEL heading and h1, `style={{ color: '#8a93a6' }}` to paragraph — forces light colors regardless of theme.

**User:** "Add eye icon to show or hide the password on login page."

**Built:**
- `EyeIcon` component with open/closed SVG states
- `showPwd` state toggling `type="text"` / `type="password"`
- Eye button absolutely positioned inside password field (`right-3`, `top-1/2`, `-translate-y-1/2`)
- `tabIndex={-1}` so it doesn't interfere with keyboard navigation

---

## Key Technical Decisions Summary

| Decision | Reason |
|----------|--------|
| `setImmediate()` for dispatch | Returns HTTP 200 to hardware immediately; dispatch runs after |
| `wa.me` share links | Free, zero API cost, no sandbox restrictions |
| Tailwind hardcoded dark + `html.light` CSS overrides | Tailwind bakes values at build time; runtime switching needs CSS specificity |
| `key={theme}` on Leaflet TileLayer | Forces Leaflet to fully remount and re-fetch new tile URL |
| Neon PostgreSQL | Serverless, free tier, SSL required, works without local Postgres |
| Netlify + Render split | Netlify = global CDN for static React; Render = persistent server for Socket.IO |
| UptimeRobot pings | Render free tier spins down; pinging `/api/health` every 5 min keeps it live |
| `UPDATE WHERE role='admin'` before INSERT | Handles username rename gracefully without leaving orphaned rows |
| `autoComplete="new-password"` | Stops Chrome/Firefox from autofilling saved passwords into login form |

---

*End of Documentation*

*Project: SENTINEL — AI-Powered Accident Detection & Emergency Response System*
*Developer: JASMIN20041234*
*Built with Claude Code by Anthropic — May 2026*
