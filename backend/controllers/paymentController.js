const paystack = require('../utils/paystack');
const Sale = require('../models/Sale');
const mongoose = require('mongoose');

exports.initializePaystack = async (req, res, next) => {
  try {
    const { email, amount, sale_id, metadata } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ message: 'Valid amount required' });
    if (sale_id && !mongoose.Types.ObjectId.isValid(sale_id)) {
      return res.status(400).json({ message: 'Invalid sale_id' });
    }

    const reference = `PSK-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    const response = await paystack.initializePayment({
      email: email || 'customer@example.com',
      amount,
      reference,
      metadata: { ...(metadata || {}), sale_id },
    });

    const formatted = paystack.formatPaymentResponse(response);

    if (sale_id) {
      await Sale.findByIdAndUpdate(sale_id, {
        payment_reference: reference,
        payment_status: 'pending',
      }).catch((err) => console.error('Failed to update sale with payment reference:', err.message));
    }

    res.json({ ...formatted, reference });
  } catch (err) { next(err); }
};

exports.verifyPaystack = async (req, res, next) => {
  try {
    const { reference } = req.body;
    if (!reference) return res.status(400).json({ message: 'Reference required' });
    if (typeof reference !== 'string') return res.status(400).json({ message: 'Reference must be a string' });

    const response = await paystack.verifyPayment(reference);
    const formatted = paystack.formatPaymentResponse(response);

    if (formatted.status === 'success') {
      await Sale.findOneAndUpdate(
        { payment_reference: reference },
        { payment_status: 'completed' }
      ).catch((err) => console.error('Failed to update sale payment status:', err.message));
    }

    res.json(formatted);
  } catch (err) { next(err); }
};

exports.getPaymentStatus = async (req, res, next) => {
  try {
    const { reference } = req.params;
    if (typeof reference !== 'string') return res.status(400).json({ message: 'Invalid reference' });
    const response = await paystack.verifyPayment(reference);
    const formatted = paystack.formatPaymentResponse(response);
    res.json(formatted);
  } catch (err) { next(err); }
};
