const router = require('express').Router();
const ctrl   = require('../controllers/telemetry.controller');
const { authenticate } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');

router.use(authenticate);

/**
 * POST /api/telemetry
 * Ingests a single sensor reading from an ESP32/GPS/GSM device.
 *
 * Body: { device_id, accel_x, accel_y, accel_z, latitude?, longitude?, gps_accuracy?, battery_level? }
 */
router.post('/',
  validate({ device_id: 'required|string' }),
  ctrl.receive
);

module.exports = router;
