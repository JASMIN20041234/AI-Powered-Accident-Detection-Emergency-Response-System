const router = require('express').Router();
const ctrl   = require('../controllers/incidents.controller');
const { authenticate } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');

router.use(authenticate);

router.get('/',    ctrl.list);
router.post('/',
  validate({ event_type: 'required|string', magnitude: 'required|number' }),
  ctrl.create
);
router.delete('/', ctrl.clearAll);

// Dispatch sub-routes (kept on incidents resource for REST clarity)
router.post('/dispatch',
  validate({ incident_id: 'required|string' }),
  ctrl.dispatch
);
router.post('/test-send',
  validate({ phone: 'required|string', apikey: 'string' }),
  ctrl.testSend
);

module.exports = router;
