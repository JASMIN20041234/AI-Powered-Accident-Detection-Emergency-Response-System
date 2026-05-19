const router = require('express').Router();
const ctrl   = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');

router.post('/register',
  validate({ username: 'required|string|min:3|max:50', password: 'required|string|min:6' }),
  ctrl.register
);
router.post('/login',
  validate({ username: 'required|string', password: 'required|string' }),
  ctrl.login
);
router.get('/me', authenticate, ctrl.me);

module.exports = router;
