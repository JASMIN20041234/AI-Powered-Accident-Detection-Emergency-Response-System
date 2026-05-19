/**
 * Telemetry controller — receives sensor data from ESP32/GPS/GSM hardware.
 * When g-force exceeds the threshold, an incident is created automatically.
 */
const DeviceModel   = require('../models/device.model');
const IncidentModel = require('../models/incident.model');
const asyncHandler  = require('../utils/asyncHandler');
const logger        = require('../utils/logger');
const { emitToUser } = require('../sockets');

const IMPACT_THRESHOLD = 2.5; // g-force

const receive = asyncHandler(async (req, res) => {
  const {
    device_id,
    accel_x, accel_y, accel_z,
    latitude, longitude, gps_accuracy,
    battery_level,
  } = req.body;

  const device = await DeviceModel.findByHardwareId(device_id);
  if (!device || !device.is_active) {
    return res.status(404).json({ error: 'Device not found or inactive' });
  }

  const ax = Number(accel_x) || 0;
  const ay = Number(accel_y) || 0;
  const az = Number(accel_z) || 1;
  const magnitude = Math.sqrt(ax ** 2 + ay ** 2 + az ** 2);

  await DeviceModel.insertTelemetry({
    device_id: device.id,
    accel_x: ax, accel_y: ay, accel_z: az, magnitude,
    latitude:    latitude    ? Number(latitude)    : null,
    longitude:   longitude   ? Number(longitude)   : null,
    gps_accuracy: gps_accuracy ? Number(gps_accuracy) : null,
    battery_level: battery_level ? Number(battery_level) : null,
  });
  await DeviceModel.touch(device.id);

  let incident = null;
  if (magnitude > IMPACT_THRESHOLD) {
    incident = await IncidentModel.create({
      user_id:    device.user_id,
      event_type: 'Hardware Impact Detection',
      magnitude,
      latitude:   latitude  ? Number(latitude)  : null,
      longitude:  longitude ? Number(longitude) : null,
      accuracy:   gps_accuracy ? Number(gps_accuracy) : null,
      status:     'detected',
    });

    // Push real-time alert to the operator's browser immediately
    emitToUser(device.user_id, 'incident:detected', {
      incident_id: incident.id,
      event_type:  incident.event_type,
      magnitude:   incident.magnitude,
      latitude:    incident.latitude,
      longitude:   incident.longitude,
    });

    logger.warn(`Hardware impact: device=${device_id} mag=${magnitude.toFixed(2)}g — incident ${incident.id} created`);
  }

  res.json({
    received: true,
    magnitude: magnitude.toFixed(3),
    incident_triggered: !!incident,
    incident_id: incident?.id || null,
  });
});

module.exports = { receive };
