const router = require('express').Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/paymentController');

// All payment routes require a valid JWT
router.post('/paystack/initialize', auth, ctrl.initialize);
router.post('/paystack/verify', auth, ctrl.verify);

module.exports = router;
