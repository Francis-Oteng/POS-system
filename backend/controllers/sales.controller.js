const mongoose = require('mongoose');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const InventoryLog = require('../models/InventoryLog');

async function generateReceiptNumber() {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const count = await Sale.countDocuments({ createdAt: { $gte: startOfDay } });
  return `REC-${dateStr}-${String(count + 1).padStart(4, '0')}`;
}

exports.create = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { customer_id, items, discount_type, discount_value = 0, payment_method, amount_paid, payment_reference, notes } = req.body;

    if (!items || !items.length) return res.status(400).json({ message: 'At least one item required' });
    if (!['cash', 'mobile_money', 'card', 'paystack'].includes(payment_method)) return res.status(400).json({ message: 'Valid payment method required' });

    let subtotal = 0, tax_amount_total = 0;
    const lineItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product_id).session(session);
      if (!product || !product.is_active) throw { status: 404, message: `Product not found: ${item.product_id}` };
      if (product.stock_qty < item.quantity) throw { status: 400, message: `Insufficient stock for: ${product.name} (available: ${product.stock_qty})` };

      const unit_price = item.unit_price || product.price;
      const line_subtotal = unit_price * item.quantity;
      const item_tax = (line_subtotal * product.tax_rate) / 100;
      const line_total = line_subtotal + item_tax;

      subtotal += line_subtotal;
      tax_amount_total += item_tax;

      lineItems.push({
        product_id: product._id,
        product_name: product.name,
        quantity: item.quantity,
        unit_price,
        tax_rate: product.tax_rate,
        tax_amount: item_tax,
        line_total,
        _product: product
      });
    }

    let discount_amount = 0;
    if (discount_type === 'percent') discount_amount = (subtotal * parseFloat(discount_value)) / 100;
    else if (discount_type === 'fixed') discount_amount = parseFloat(discount_value);

    const total_amount = Math.max(0, subtotal - discount_amount + tax_amount_total);
    const paid = parseFloat(amount_paid) || total_amount;
    const change_due = Math.max(0, paid - total_amount);

    const receipt_number = await generateReceiptNumber();

    const [sale] = await Sale.create([{
      receipt_number,
      customer_id: customer_id || null,
      cashier_id: req.user.id,
      items: lineItems.map(({ _product, ...i }) => i),
      subtotal, discount_type: discount_type || null, discount_value: parseFloat(discount_value),
      discount_amount, tax_amount: tax_amount_total, total_amount,
      amount_paid: paid, change_due,
      payment_method, payment_reference: payment_reference || null,
      notes: notes || ''
    }], { session });

    // Deduct stock and log
    for (const item of lineItems) {
      const before = item._product.stock_qty;
      await Product.findByIdAndUpdate(item.product_id, { $inc: { stock_qty: -item.quantity } }, { session });
      await InventoryLog.create([{
        product_id: item.product_id, change_type: 'sale',
        qty_before: before, qty_change: -item.quantity, qty_after: before - item.quantity,
        reference_id: sale._id, notes: 'Sale deduction', created_by: req.user.id
      }], { session });
    }

    // Update customer loyalty
    if (customer_id) {
      await Customer.findByIdAndUpdate(customer_id, {
        $inc: { loyalty_points: Math.floor(total_amount), total_spent: total_amount }
      }, { session });
    }

    await session.commitTransaction();
    res.status(201).json(sale);
  } catch (err) {
    await session.abortTransaction();
    if (err.status) return res.status(err.status).json({ message: err.message });
    next(err);
  } finally {
    session.endSession();
  }
};

exports.list = async (req, res, next) => {
  try {
    const { from, to, cashier_id, payment_method, payment_status, page = 1, limit = 20, search } = req.query;
    const VALID_PAYMENT_METHODS = ['cash', 'mobile_money', 'card', 'paystack'];
    const VALID_STATUSES = ['completed', 'refunded', 'void'];
    const filter = {};
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) { const d = new Date(to); d.setHours(23,59,59,999); filter.createdAt.$lte = d; }
    }
    if (cashier_id) filter.cashier_id = cashier_id;
    if (payment_method && VALID_PAYMENT_METHODS.includes(payment_method)) filter.payment_method = payment_method;
    if (payment_status && VALID_STATUSES.includes(payment_status)) filter.payment_status = payment_status;
    if (search) {
      const trimmed = String(search).slice(0, 100); // limit length to prevent ReDoS
      const escapedSearch = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { receipt_number: { $regex: escapedSearch, $options: 'i' } }
      ];
    }

    const total = await Sale.countDocuments(filter);
    const data = await Sale.find(filter)
      .populate('cashier_id', 'full_name')
      .populate('customer_id', 'full_name phone')
      .sort('-createdAt')
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    res.json({ data, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) { next(err); }
};

exports.getById = async (req, res, next) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate('cashier_id', 'full_name')
      .populate('customer_id', 'full_name phone email');
    if (!sale) return res.status(404).json({ message: 'Sale not found' });
    res.json(sale);
  } catch (err) { next(err); }
};

exports.getByReceipt = async (req, res, next) => {
  try {
    const sale = await Sale.findOne({ receipt_number: req.params.receipt_number })
      .populate('cashier_id', 'full_name')
      .populate('customer_id', 'full_name phone');
    if (!sale) return res.status(404).json({ message: 'Receipt not found' });
    res.json(sale);
  } catch (err) { next(err); }
};

exports.voidSale = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const sale = await Sale.findById(req.params.id).session(session);
    if (!sale) return res.status(404).json({ message: 'Sale not found' });
    if (sale.payment_status !== 'completed') return res.status(400).json({ message: 'Sale cannot be voided' });

    sale.payment_status = 'void';
    await sale.save({ session });

    for (const item of sale.items) {
      const product = await Product.findById(item.product_id).session(session);
      const before = product.stock_qty;
      await Product.findByIdAndUpdate(item.product_id, { $inc: { stock_qty: item.quantity } }, { session });
      await InventoryLog.create([{
        product_id: item.product_id, change_type: 'return',
        qty_before: before, qty_change: item.quantity, qty_after: before + item.quantity,
        reference_id: sale._id, notes: `Void: ${req.body.reason || ''}`, created_by: req.user.id
      }], { session });
    }

    if (sale.customer_id) {
      await Customer.findByIdAndUpdate(sale.customer_id, {
        $inc: { loyalty_points: -Math.floor(sale.total_amount), total_spent: -sale.total_amount }
      }, { session });
    }

    await session.commitTransaction();
    res.json({ message: 'Sale voided', id: sale._id });
  } catch (err) {
    await session.abortTransaction();
    next(err);
  } finally { session.endSession(); }
};
