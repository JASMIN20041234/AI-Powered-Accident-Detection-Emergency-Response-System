-- SENTINEL — Migration 001: Initial schema
-- Run via: node scripts/migrate.js

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Users ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id             UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  username       VARCHAR(50)  UNIQUE NOT NULL,
  email          VARCHAR(255) UNIQUE,
  password_hash  VARCHAR(255) NOT NULL,
  role           VARCHAR(20)  NOT NULL DEFAULT 'operator',
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─── Emergency Contacts ───────────────────────────────────────────────────────
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

-- ─── Incidents ────────────────────────────────────────────────────────────────
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

-- ─── Dispatch Logs ────────────────────────────────────────────────────────────
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

-- ─── Hardware Devices (ESP32 / GPS-GSM) ───────────────────────────────────────
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

-- ─── Device Telemetry ─────────────────────────────────────────────────────────
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
