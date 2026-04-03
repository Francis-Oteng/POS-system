const router = require('express').Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/paymentController');

router.use(auth);

router.post('/paystack/initialize', ctrl.initializePaystack);
router.post('/paystack/verify',     ctrl.verifyPaystack);
router.get('/paystack/status/:reference', ctrl.getPaymentStatus);

module.exports = router;
