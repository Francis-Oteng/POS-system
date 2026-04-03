const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const auth = require('../middleware/auth');
const ctrl = require('../controllers/paymentController');

// Limit payment requests to prevent abuse
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  message: { message: 'Too many payment requests, please try again later.' }
});

// All payment routes require a valid JWT and are rate-limited
router.post('/paystack/initialize', paymentLimiter, auth, ctrl.initialize);
router.post('/paystack/verify', paymentLimiter, auth, ctrl.verify);

module.exports = router;
