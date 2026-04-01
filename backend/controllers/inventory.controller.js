const Product = require('../models/Product');
const InventoryLog = require('../models/InventoryLog');

exports.list = async (req, res, next) => {
  try {
    const { low_stock, category, page = 1, limit = 20, search } = req.query;
    const filter = { is_active: true };
    if (category) filter.category = category;
    if (search) filter.name = { $regex: search, $options: 'i' };
    if (low_stock === 'true') filter.$expr = { $lte: ['$stock_qty', '$low_stock_threshold'] };
    const total = await Product.countDocuments(filter);
    const data = await Product.find(filter).sort('name').skip((parseInt(page)-1)*parseInt(limit)).limit(parseInt(limit));
    res.json({ data, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) { next(err); }
};

exports.getLowStock = async (req, res, next) => {
  try {
    const items = await Product.aggregate([
      { $match: { is_active: true } },
      { $match: { $expr: { $lte: ['$stock_qty', '$low_stock_threshold'] } } },
      { $sort: { stock_qty: 1 } },
      { $project: { product_id: '$_id', name: 1, category: 1, stock_qty: 1, low_stock_threshold: 1, unit: 1 } }
    ]);
    res.json(items);
  } catch (err) { next(err); }
};

exports.adjust = async (req, res, next) => {
  try {
    const { adjustments, change_type } = req.body;
    if (!adjustments || !adjustments.length) return res.status(400).json({ message: 'Adjustments required' });
    if (!['restock', 'adjustment', 'return'].includes(change_type)) return res.status(400).json({ message: 'Invalid change_type' });

    const logs = [];
    for (const adj of adjustments) {
      const product = await Product.findById(adj.product_id);
      if (!product) throw { status: 404, message: `Product not found: ${adj.product_id}` };
      const newQty = product.stock_qty + parseInt(adj.qty_change);
      if (newQty < 0) throw { status: 400, message: `Cannot reduce below 0 for: ${product.name}` };
      await Product.findByIdAndUpdate(adj.product_id, { stock_qty: newQty });
      await new InventoryLog({
        product_id: adj.product_id, change_type,
        qty_before: product.stock_qty, qty_change: parseInt(adj.qty_change), qty_after: newQty,
        notes: adj.notes || '', created_by: req.user.id
      }).save();
      logs.push({ product_name: product.name, qty_before: product.stock_qty, qty_change: adj.qty_change, qty_after: newQty });
    }
    res.json({ adjusted: logs.length, logs });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    next(err);
  }
};

exports.getLogs = async (req, res, next) => {
  try {
    const { product_id, from, to, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (product_id) filter.product_id = product_id;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) { const d = new Date(to); d.setHours(23,59,59,999); filter.createdAt.$lte = d; }
    }
    const total = await InventoryLog.countDocuments(filter);
    const data = await InventoryLog.find(filter)
      .populate('product_id', 'name category')
      .populate('created_by', 'full_name')
      .sort('-createdAt')
      .skip((parseInt(page)-1)*parseInt(limit)).limit(parseInt(limit));
    res.json({ data, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) { next(err); }
};
