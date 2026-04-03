const express   = require('express')
const rateLimit = require('express-rate-limit')
const router    = express.Router()
const auth      = require('../middleware/auth')
const ctrl      = require('../controllers/payments.controller')

// Rate-limit payment endpoints: max 20 requests per 15 minutes per IP
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many payment requests, please try again later.' },
})

// All routes require authentication except the webhook
router.post('/initialize',       paymentLimiter, auth, ctrl.initializePaystack)
router.post('/verify',           paymentLimiter, auth, ctrl.verifyPaystack)
router.post('/webhook',          ctrl.handleWebhook)   // No auth – called by Paystack
router.get('/status/:reference', paymentLimiter, auth, ctrl.checkStatus)

module.exports = router
