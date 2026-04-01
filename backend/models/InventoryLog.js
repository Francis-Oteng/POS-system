const mongoose = require('mongoose');

const inventoryLogSchema = new mongoose.Schema({
  product_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  change_type: { type: String, enum: ['sale', 'adjustment', 'restock', 'return', 'initial'], required: true },
  qty_before:  { type: Number, required: true },
  qty_change:  { type: Number, required: true },
  qty_after:   { type: Number, required: true },
  reference_id:{ type: mongoose.Schema.Types.ObjectId, default: null },
  notes:       { type: String, default: '' },
  created_by:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true });

module.exports = mongoose.model('InventoryLog', inventoryLogSchema);
