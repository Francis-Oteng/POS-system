const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  transactionId: { type: String, unique: true, required: true },
  receiptNumber: { type: String, required: true },
  date: { type: Date, default: Date.now },
  customer: {
    name: { type: String, required: true },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
  },
  items: [{
    product: String,
    quantity: Number,
    unitPrice: Number,
    lineTotal: Number,
  }],
  subtotal: Number,
  tax: Number,
  discount: Number,
  total: { type: Number, required: true },
  payment: {
    method: { type: String, enum: ['cash', 'paystack', 'card'], required: true },
    reference: String,
    accessCode: String,
    amount: Number,
    status: { type: String, enum: ['pending', 'completed', 'failed', 'refunded'], default: 'pending' },
    timestamp: Date,
  },
  status: { type: String, enum: ['pending', 'completed', 'refunded', 'failed'], default: 'pending' },
  notes: String,
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
