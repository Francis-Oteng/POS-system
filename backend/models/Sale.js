const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema({
  product_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  product_name: { type: String, required: true },
  quantity:     { type: Number, required: true, min: 1 },
  unit_price:   { type: Number, required: true },
  tax_rate:     { type: Number, default: 0 },
  tax_amount:   { type: Number, default: 0 },
  line_total:   { type: Number, required: true }
}, { _id: false });

const saleSchema = new mongoose.Schema({
  receipt_number: { type: String, required: true, unique: true },
  customer_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null },
  cashier_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items:          [saleItemSchema],
  subtotal:       { type: Number, default: 0 },
  discount_type:  { type: String, enum: ['percent', 'fixed', null], default: null },
  discount_value: { type: Number, default: 0 },
  discount_amount:{ type: Number, default: 0 },
  tax_amount:     { type: Number, default: 0 },
  total_amount:   { type: Number, default: 0 },
  amount_paid:    { type: Number, default: 0 },
  change_due:     { type: Number, default: 0 },
  payment_method: { type: String, enum: ['cash', 'mobile_money', 'card', 'paystack'], required: true },
  payment_reference: { type: String, default: null },
  paystack_reference: { type: String, default: null },
  paystack_access_code: { type: String, default: null },
  payment_status: { type: String, enum: ['pending', 'completed', 'refunded', 'void', 'failed'], default: 'completed' },
  notes:          { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Sale', saleSchema);
