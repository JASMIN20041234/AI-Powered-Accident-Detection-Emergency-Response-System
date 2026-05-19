const router = require('express').Router();
const ctrl   = require('../controllers/devices.controller');
const { authenticate } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');

router.use(authenticate);

router.get('/', ctrl.list);
router.post('/register',
  validate({ device_id: 'required|string' }),
  ctrl.register
);

module.exports = router;
