const router = require('express').Router();
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const ctrl = require('../controllers/inventory.controller');
router.get('/low-stock', auth, ctrl.getLowStock);
router.get('/logs', auth, requireRole('admin', 'manager'), ctrl.getLogs);
router.post('/adjust', auth, requireRole('admin', 'manager'), ctrl.adjust);
router.get('/', auth, ctrl.list);
module.exports = router;
