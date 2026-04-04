const https  = require('https')
const crypto = require('crypto')

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || ''
const PAYSTACK_BASE_URL   = 'api.paystack.co'

/**
 * Make an authenticated request to the Paystack API.
 */
function paystackRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : undefined
    const options = {
      hostname: PAYSTACK_BASE_URL,
      path,
      method,
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    }
    const req = https.request(options, (res) => {
      let raw = ''
      res.on('data', chunk => { raw += chunk })
      res.on('end', () => {
        try { resolve(JSON.parse(raw)) }
        catch (e) { reject(new Error('Invalid JSON from Paystack')) }
      })
    })
    req.on('error', reject)
    if (data) req.write(data)
    req.end()
  })
}

/**
 * Generate a unique payment reference.
 */
function generateReference(prefix = 'PSK') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
}

/**
 * Initialize a Paystack transaction.
 * @param {number} amount  Amount in the smallest currency unit (kobo for NGN, cents for USD etc.)
 * @param {string} email   Customer email
 * @param {object} metadata  Additional metadata
 */
async function initializePayment(amount, email, metadata = {}) {
  const reference = generateReference()
  const payload   = { amount, email, reference, metadata }
  const result    = await paystackRequest('POST', '/transaction/initialize', payload)
  if (!result.status) throw new Error(result.message || 'Paystack initialization failed')
  return { ...result.data, reference }
}

/**
 * Verify a Paystack transaction.
 * @param {string} reference  Transaction reference
 */
async function verifyPayment(reference) {
  const result = await paystackRequest('GET', `/transaction/verify/${reference}`)
  if (!result.status) throw new Error(result.message || 'Paystack verification failed')
  return result.data
}

/**
 * Validate a webhook payload using the Paystack webhook secret.
 * @param {string} payload   Raw request body string
 * @param {string} signature x-paystack-signature header value
 */
function validateWebhook(payload, signature) {
  const hash = crypto
    .createHmac('sha512', process.env.PAYSTACK_WEBHOOK_SECRET || '')
    .update(payload)
    .digest('hex')
  return hash === signature
}

module.exports = { initializePayment, verifyPayment, validateWebhook, generateReference }
