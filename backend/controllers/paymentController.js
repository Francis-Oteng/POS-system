const { initializeTransaction, verifyTransaction } = require('../utils/paystack');
const Sale = require('../models/Sale');

/**
 * POST /api/payments/paystack/initialize
 * Body: { email, amount, sale_ref }
 * Initializes a Paystack payment and returns the checkout URL.
 */
exports.initialize = async (req, res, next) => {
  try {
    const { email, amount, sale_ref } = req.body;
    if (!email || !amount) return res.status(400).json({ message: 'email and amount are required' });

    const reference = sale_ref || `POS-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    const result = await initializeTransaction({
      email,
      amount: parseFloat(amount),
      reference,
      metadata: { initiated_by: req.user?.id, pos: true }
    });

    res.json({ authorization_url: result.authorization_url, access_code: result.access_code, reference: result.reference });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/payments/paystack/verify
 * Body: { reference }
 * Verifies a Paystack payment and returns the transaction status.
 */
exports.verify = async (req, res, next) => {
  try {
    const { reference } = req.body;
    if (!reference) return res.status(400).json({ message: 'reference is required' });

    const data = await verifyTransaction(reference);

    // Optionally update a sale that carries this payment reference
    if (data.status === 'success') {
      await Sale.findOneAndUpdate(
        { payment_reference: reference },
        { payment_status: 'completed' }
      );
    }

    res.json({
      status: data.status,         // 'success' | 'failed' | 'abandoned'
      amount: data.amount / 100,   // convert back from smallest unit
      reference: data.reference,
      channel: data.channel,
      paid_at: data.paid_at
    });
  } catch (err) {
    next(err);
  }
};


/**
 * POST /api/payments/paystack/initialize
 * Body: { email, amount, sale_ref }
 * Initializes a Paystack payment and returns the checkout URL.
 */
exports.initialize = async (req, res, next) => {
  try {
    const { email, amount, sale_ref } = req.body;
    if (!email || !amount) return res.status(400).json({ message: 'email and amount are required' });

    const reference = sale_ref || `POS-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    const result = await initializeTransaction({
      email,
      amount: parseFloat(amount),
      reference,
      metadata: { initiated_by: req.user?.id, pos: true }
    });

    res.json({ authorization_url: result.authorization_url, access_code: result.access_code, reference: result.reference });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/payments/paystack/verify
 * Body: { reference }
 * Verifies a Paystack payment and returns the transaction status.
 */
exports.verify = async (req, res, next) => {
  try {
    const { reference } = req.body;
    if (!reference) return res.status(400).json({ message: 'reference is required' });

    const data = await verifyTransaction(reference);

    // Optionally update a sale that carries this payment reference
    if (data.status === 'success') {
      await Sale.findOneAndUpdate(
        { payment_reference: reference },
        { payment_status: 'completed' }
      );
    }

    res.json({
      status: data.status,         // 'success' | 'failed' | 'abandoned'
      amount: data.amount / 100,   // convert back from smallest unit
      reference: data.reference,
      channel: data.channel,
      paid_at: data.paid_at
    });
  } catch (err) {
    next(err);
  }
};
