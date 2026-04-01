const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name:                { type: String, required: true },
  description:         { type: String, default: '' },
  barcode:             { type: String, unique: true, sparse: true },
  sku:                 { type: String, unique: true, sparse: true },
  category:            { type: String, default: 'General' },
  price:               { type: Number, required: true, min: 0 },
  cost_price:          { type: Number, default: 0, min: 0 },
  tax_rate:            { type: Number, default: 0 },
  stock_qty:           { type: Number, default: 0, min: 0 },
  low_stock_threshold: { type: Number, default: 10 },
  unit:                { type: String, default: 'pcs' },
  is_active:           { type: Boolean, default: true },
  created_by:          { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

productSchema.virtual('is_low_stock').get(function() {
  return this.stock_qty <= this.low_stock_threshold;
});

module.exports = mongoose.model('Product', productSchema);
