const Product = require('../models/Product');
const InventoryLog = require('../models/InventoryLog');

exports.list = async (req, res, next) => {
  try {
    const { search, category, page = 1, limit = 20, active = 'true' } = req.query;
    const filter = {};
    if (active === 'true') filter.is_active = true;
    if (category) filter.category = category;
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { barcode: { $regex: search, $options: 'i' } },
      { sku: { $regex: search, $options: 'i' } }
    ];
    const total = await Product.countDocuments(filter);
    const data = await Product.find(filter).sort('name').skip((page - 1) * limit).limit(parseInt(limit));
    res.json({ data, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) { next(err); }
};

exports.getById = async (req, res, next) => {
  try {
    const p = await Product.findById(req.params.id);
    if (!p) return res.status(404).json({ message: 'Product not found' });
    res.json(p);
  } catch (err) { next(err); }
};

exports.getByBarcode = async (req, res, next) => {
  try {
    const p = await Product.findOne({ barcode: req.params.barcode, is_active: true });
    if (!p) return res.status(404).json({ message: 'Product not found' });
    res.json(p);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { name, description, barcode, sku, category, price, cost_price, tax_rate, stock_qty, low_stock_threshold, unit } = req.body;
    if (!name || price === undefined) return res.status(400).json({ message: 'Name and price are required' });
    const product = await new Product({ name, description, barcode, sku, category, price, cost_price, tax_rate, stock_qty, low_stock_threshold, unit, created_by: req.user.id }).save();
    if (parseInt(stock_qty) > 0) {
      await new InventoryLog({ product_id: product._id, change_type: 'initial', qty_before: 0, qty_change: parseInt(stock_qty), qty_after: parseInt(stock_qty), notes: 'Initial stock', created_by: req.user.id }).save();
    }
    res.status(201).json(product);
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const allowed = ['name', 'description', 'barcode', 'sku', 'category', 'price', 'cost_price', 'tax_rate', 'low_stock_threshold', 'unit', 'is_active'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
    const product = await Product.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) { next(err); }
};

exports.deactivate = async (req, res, next) => {
  try {
    const p = await Product.findByIdAndUpdate(req.params.id, { is_active: false });
    if (!p) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deactivated' });
  } catch (err) { next(err); }
};

exports.getCategories = async (req, res, next) => {
  try {
    const cats = await Product.distinct('category', { is_active: true });
    res.json(cats.sort());
  } catch (err) { next(err); }
};
