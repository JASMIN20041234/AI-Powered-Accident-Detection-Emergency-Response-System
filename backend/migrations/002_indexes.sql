-- SENTINEL — Migration 002: Indexes for query performance

CREATE INDEX IF NOT EXISTS idx_contacts_user_id        ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_incidents_user_id       ON incidents(user_id);
CREATE INDEX IF NOT EXISTS idx_incidents_created_at    ON incidents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_status        ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_dispatch_logs_incident  ON dispatch_logs(incident_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_logs_status    ON dispatch_logs(status);
CREATE INDEX IF NOT EXISTS idx_devices_user_id         ON devices(user_id);
CREATE INDEX IF NOT EXISTS idx_devices_hardware_id     ON devices(device_id);
CREATE INDEX IF NOT EXISTS idx_telemetry_device_id     ON device_telemetry(device_id);
CREATE INDEX IF NOT EXISTS idx_telemetry_recorded_at   ON device_telemetry(recorded_at DESC);
