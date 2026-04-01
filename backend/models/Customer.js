const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  full_name:      { type: String, required: true },
  phone:          { type: String, unique: true, sparse: true },
  email:          { type: String, unique: true, sparse: true, lowercase: true },
  address:        { type: String, default: '' },
  loyalty_points: { type: Number, default: 0 },
  total_spent:    { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Customer', customerSchema);
