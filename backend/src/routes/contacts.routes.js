const router = require('express').Router();
const ctrl     = require('../controllers/contacts.controller');
const { authenticate } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');

router.use(authenticate);

router.get('/', ctrl.list);
router.post('/',
  validate({ name: 'required|string|max:100', phone: 'required|string' }),
  ctrl.create
);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
