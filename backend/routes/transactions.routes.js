const router = require('express').Router();
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const ctrl = require('../controllers/transactionController');

router.get('/dummy', ctrl.getDummyTransactions);

router.use(auth);

router.get('/',     requireRole('admin', 'manager'), ctrl.getAllTransactions);
router.get('/:id',  requireRole('admin', 'manager'), ctrl.getTransactionById);
router.post('/',    requireRole('admin', 'manager', 'cashier'), ctrl.createTransaction);
router.put('/:id',  requireRole('admin', 'manager'), ctrl.updateTransactionStatus);

module.exports = router;
