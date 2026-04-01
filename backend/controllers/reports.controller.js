const Sale = require('../models/Sale');
const Product = require('../models/Product');

function getDateRange(period, from, to) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  switch (period) {
    case 'today': return { start: today, end: new Date(today.getTime() + 86400000 - 1) };
    case 'week': return { start: new Date(today.getTime() - 6 * 86400000), end: new Date(today.getTime() + 86400000 - 1) };
    case 'month': return { start: new Date(today.getTime() - 29 * 86400000), end: new Date(today.getTime() + 86400000 - 1) };
    default: {
      const start = from ? new Date(from) : today;
      const end = to ? new Date(new Date(to).setHours(23,59,59,999)) : new Date(today.getTime() + 86400000 - 1);
      return { start, end };
    }
  }
}

exports.summary = async (req, res, next) => {
  try {
    const { period = 'today', from, to } = req.query;
    const range = getDateRange(period, from, to);
    const filter = { payment_status: 'completed', createdAt: { $gte: range.start, $lte: range.end } };

    const agg = await Sale.aggregate([
      { $match: filter },
      { $group: {
        _id: null,
        total_sales: { $sum: 1 },
        total_revenue: { $sum: '$total_amount' },
        avg_transaction: { $avg: '$total_amount' },
        total_discount: { $sum: '$discount_amount' },
        total_items: { $sum: { $sum: '$items.quantity' } }
      }}
    ]);

    const paymentAgg = await Sale.aggregate([
      { $match: filter },
      { $group: { _id: '$payment_method', count: { $sum: 1 } } },
      { $sort: { count: -1 } }, { $limit: 1 }
    ]);

    const stats = agg[0] || { total_sales: 0, total_revenue: 0, avg_transaction: 0, total_items: 0 };
    res.json({
      period: { from: range.start.toISOString().slice(0,10), to: range.end.toISOString().slice(0,10) },
      total_sales: stats.total_sales,
      total_revenue: parseFloat((stats.total_revenue || 0).toFixed(2)),
      avg_transaction_value: parseFloat((stats.avg_transaction || 0).toFixed(2)),
      total_items_sold: stats.total_items || 0,
      top_payment_method: paymentAgg[0]?._id || 'N/A'
    });
  } catch (err) { next(err); }
};

exports.salesByDay = async (req, res, next) => {
  try {
    const range = getDateRange('custom', req.query.from, req.query.to);
    const data = await Sale.aggregate([
      { $match: { payment_status: 'completed', createdAt: { $gte: range.start, $lte: range.end } } },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        sales_count: { $sum: 1 },
        revenue: { $sum: '$total_amount' },
        total_discount: { $sum: '$discount_amount' }
      }},
      { $sort: { _id: 1 } },
      { $project: { date: '$_id', sales_count: 1, revenue: { $round: ['$revenue', 2] }, total_discount: 1, _id: 0 } }
    ]);
    res.json(data);
  } catch (err) { next(err); }
};

exports.topProducts = async (req, res, next) => {
  try {
    const range = getDateRange('custom', req.query.from, req.query.to);
    const limit = parseInt(req.query.limit) || 10;
    const data = await Sale.aggregate([
      { $match: { payment_status: 'completed', createdAt: { $gte: range.start, $lte: range.end } } },
      { $unwind: '$items' },
      { $group: {
        _id: '$items.product_id',
        name: { $first: '$items.product_name' },
        qty_sold: { $sum: '$items.quantity' },
        revenue: { $sum: '$items.line_total' }
      }},
      { $sort: { qty_sold: -1 } }, { $limit: limit },
      { $project: { product_id: '$_id', name: 1, qty_sold: 1, revenue: { $round: ['$revenue', 2] }, _id: 0 } }
    ]);
    res.json(data);
  } catch (err) { next(err); }
};

exports.salesByCategory = async (req, res, next) => {
  try {
    const range = getDateRange('custom', req.query.from, req.query.to);
    const data = await Sale.aggregate([
      { $match: { payment_status: 'completed', createdAt: { $gte: range.start, $lte: range.end } } },
      { $unwind: '$items' },
      { $lookup: { from: 'products', localField: 'items.product_id', foreignField: '_id', as: 'product' } },
      { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
      { $group: {
        _id: { $ifNull: ['$product.category', 'Unknown'] },
        qty_sold: { $sum: '$items.quantity' },
        revenue: { $sum: '$items.line_total' }
      }},
      { $sort: { revenue: -1 } },
      { $project: { category: '$_id', qty_sold: 1, revenue: { $round: ['$revenue', 2] }, _id: 0 } }
    ]);
    res.json(data);
  } catch (err) { next(err); }
};

exports.cashierPerformance = async (req, res, next) => {
  try {
    const range = getDateRange('custom', req.query.from, req.query.to);
    const data = await Sale.aggregate([
      { $match: { payment_status: 'completed', createdAt: { $gte: range.start, $lte: range.end } } },
      { $group: { _id: '$cashier_id', sales_count: { $sum: 1 }, total_revenue: { $sum: '$total_amount' } } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'cashier' } },
      { $unwind: '$cashier' },
      { $sort: { total_revenue: -1 } },
      { $project: { cashier_id: '$_id', full_name: '$cashier.full_name', sales_count: 1, total_revenue: { $round: ['$total_revenue', 2] }, _id: 0 } }
    ]);
    res.json(data);
  } catch (err) { next(err); }
};

exports.inventoryValue = async (req, res, next) => {
  try {
    const products = await Product.find({ is_active: true }).select('name stock_qty cost_price price');
    const total_stock_value = products.reduce((s, p) => s + p.stock_qty * p.cost_price, 0);
    const total_retail_value = products.reduce((s, p) => s + p.stock_qty * p.price, 0);
    res.json({
      total_stock_value: parseFloat(total_stock_value.toFixed(2)),
      total_retail_value: parseFloat(total_retail_value.toFixed(2)),
      products: products.map(p => ({ id: p._id, name: p.name, stock_qty: p.stock_qty, cost_price: p.cost_price, retail_price: p.price, stock_value: parseFloat((p.stock_qty * p.cost_price).toFixed(2)) }))
    });
  } catch (err) { next(err); }
};
