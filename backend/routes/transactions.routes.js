const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const ctrl = require('../controllers/transactionController');

// Rate-limit transaction read endpoints: max 60 requests per 15 minutes per IP
const transactionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
});

router.get('/dummy', ctrl.getDummyTransactions);
router.get('/stats', transactionLimiter, auth, ctrl.getDashboardStats);

router.use(auth);

router.get('/',     transactionLimiter, requireRole('admin', 'manager'), ctrl.getAllTransactions);
router.get('/:id',  transactionLimiter, requireRole('admin', 'manager'), ctrl.getTransactionById);
router.post('/',    requireRole('admin', 'manager', 'cashier'), ctrl.createTransaction);
router.put('/:id',  requireRole('admin', 'manager'), ctrl.updateTransactionStatus);

module.exports = router;
