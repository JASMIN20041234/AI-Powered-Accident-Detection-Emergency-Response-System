const db = require('../config/db');

async function upsert({ user_id, device_id, device_name, device_type, firmware_version, metadata }) {
  const { rows } = await db.query(
    `INSERT INTO devices (user_id, device_id, device_name, device_type, firmware_version, metadata)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (device_id) DO UPDATE
       SET device_name      = EXCLUDED.device_name,
           firmware_version = EXCLUDED.firmware_version,
           metadata         = EXCLUDED.metadata,
           last_seen        = NOW()
     RETURNING id, device_id, device_name, device_type, firmware_version, last_seen, metadata`,
    [user_id, device_id, device_name || null, device_type || 'ESP32', firmware_version || null, metadata || {}]
  );
  return rows[0];
}

async function findAllByUser(userId) {
  const { rows } = await db.query(
    `SELECT id, device_id, device_name, device_type, firmware_version,
            last_seen, is_active, metadata, created_at
     FROM devices WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );
  return rows;
}

async function findByHardwareId(deviceId) {
  const { rows } = await db.query(
    `SELECT id, user_id, device_id, device_type, is_active
     FROM devices WHERE device_id = $1`,
    [deviceId]
  );
  return rows[0] || null;
}

async function touch(id) {
  await db.query(`UPDATE devices SET last_seen = NOW() WHERE id = $1`, [id]);
}

async function insertTelemetry({ device_id, accel_x, accel_y, accel_z, magnitude, latitude, longitude, gps_accuracy, battery_level }) {
  await db.query(
    `INSERT INTO device_telemetry
       (device_id, accel_x, accel_y, accel_z, magnitude, latitude, longitude, gps_accuracy, battery_level)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [device_id, accel_x, accel_y, accel_z, magnitude, latitude || null, longitude || null, gps_accuracy || null, battery_level || null]
  );
}

module.exports = { upsert, findAllByUser, findByHardwareId, touch, insertTelemetry };
