const Sale     = require('../models/Sale')
const mongoose = require('mongoose')
const { initializePayment, verifyPayment, validateWebhook } = require('../utils/paystack')

/**
 * POST /api/payments/initialize
 * Body: { saleId, email }
 * Initialize a Paystack payment for a sale.
 */
exports.initializePaystack = async (req, res, next) => {
  try {
    const { saleId, email } = req.body
    if (!saleId || !email) return res.status(400).json({ message: 'saleId and email are required' })

    // Validate that saleId is a valid ObjectId to avoid NoSQL injection
    if (!mongoose.Types.ObjectId.isValid(saleId)) {
      return res.status(400).json({ message: 'Invalid saleId' })
    }

    const sale = await Sale.findById(saleId)
    if (!sale) return res.status(404).json({ message: 'Sale not found' })
    if (sale.payment_status === 'completed') {
      return res.status(400).json({ message: 'This transaction is already completed' })
    }

    // Paystack expects amount in smallest currency unit (multiply by 100)
    const amountInCents = Math.round(sale.total_amount * 100)
    const metadata = {
      sale_id:        saleId,
      receipt_number: sale.receipt_number,
    }

    const data = await initializePayment(amountInCents, email, metadata)

    // Persist the reference
    sale.paystack_reference   = data.reference
    sale.paystack_access_code = data.access_code
    sale.payment_method       = 'paystack'
    sale.payment_status       = 'pending'
    await sale.save()

    return res.json({
      authorization_url: data.authorization_url,
      access_code:       data.access_code,
      reference:         data.reference,
    })
  } catch (err) { next(err) }
}

/**
 * POST /api/payments/verify
 * Body: { reference }
 * Verify a Paystack payment and update sale status.
 */
exports.verifyPaystack = async (req, res, next) => {
  try {
    const { reference } = req.body
    if (!reference) return res.status(400).json({ message: 'reference is required' })

    // Sanitize reference – allow only alphanumeric, dashes and underscores
    if (!/^[\w-]+$/.test(reference)) {
      return res.status(400).json({ message: 'Invalid reference format' })
    }

    const data = await verifyPayment(reference)

    if (data.status === 'success') {
      const updated = await Sale.findOneAndUpdate(
        { paystack_reference: reference },
        { payment_status: 'completed' },
        { new: true }
      )
      if (!updated) {
        return res.status(404).json({ message: 'No sale found for this reference' })
      }
    }

    return res.json({ status: data.status, amount: data.amount / 100, reference: data.reference })
  } catch (err) { next(err) }
}

/**
 * POST /api/payments/webhook
 * Handle incoming Paystack webhook events.
 */
exports.handleWebhook = async (req, res, next) => {
  try {
    const signature = req.headers['x-paystack-signature']
    const rawBody   = JSON.stringify(req.body)

    if (!validateWebhook(rawBody, signature)) {
      return res.status(401).json({ message: 'Invalid webhook signature' })
    }

    const { event, data } = req.body

    if (event === 'charge.success') {
      // Sanitize reference before using in query
      const ref = data && data.reference
      if (ref && /^[\w-]+$/.test(ref)) {
        await Sale.findOneAndUpdate(
          { paystack_reference: ref },
          { payment_status: 'completed' }
        )
      }
    }

    return res.sendStatus(200)
  } catch (err) { next(err) }
}

/**
 * GET /api/payments/status/:reference
 * Check payment status for a given Paystack reference.
 */
exports.checkStatus = async (req, res, next) => {
  try {
    // Sanitize reference parameter
    const { reference } = req.params
    if (!/^[\w-]+$/.test(reference)) {
      return res.status(400).json({ message: 'Invalid reference format' })
    }

    const sale = await Sale.findOne({ paystack_reference: reference })
    if (!sale) return res.status(404).json({ message: 'No sale found for this reference' })
    return res.json({ status: sale.payment_status, amount: sale.total_amount, receipt: sale.receipt_number })
  } catch (err) { next(err) }
}
