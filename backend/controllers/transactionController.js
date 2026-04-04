const Sale = require('../models/Sale');
const { generateDummyTransactions } = require('../utils/dummyData');

let cachedTransactions = null;

const DUMMY_CASHIER_ID = '000000000000000000000001';
const DUMMY_PRODUCT_ID = '000000000000000000000002';

const customerNames = [
  'Walk-in', 'Walk-in', 'Walk-in',
  'James Mensah', 'Abena Osei', 'Kweku Asante', 'Akosua Boateng', 'Kofi Acheampong',
  'Efua Darko', 'Yaw Tetteh', 'Ama Sarpong', 'Kwame Nkrumah', 'Adwoa Frimpong',
  'Nana Adjei', 'Gifty Amankwah',
];

const productSets = [
  [{ product_name: 'Wireless Headphones', unit_price: 89.99, quantity: 1 }],
  [{ product_name: 'USB-C Cable', unit_price: 12.99, quantity: 2 }],
  [{ product_name: 'Phone Case', unit_price: 19.99, quantity: 1 }, { product_name: 'Screen Protector', unit_price: 9.99, quantity: 1 }],
  [{ product_name: 'Laptop Stand', unit_price: 45.00, quantity: 1 }],
  [{ product_name: 'Mechanical Keyboard', unit_price: 129.99, quantity: 1 }],
  [{ product_name: 'Mouse Pad XL', unit_price: 24.99, quantity: 1 }, { product_name: 'USB Hub', unit_price: 34.99, quantity: 1 }],
  [{ product_name: 'Bluetooth Speaker', unit_price: 59.99, quantity: 1 }],
  [{ product_name: 'HDMI Cable 2m', unit_price: 14.99, quantity: 3 }],
  [{ product_name: 'Power Bank 20000mAh', unit_price: 49.99, quantity: 1 }],
  [{ product_name: 'Webcam HD', unit_price: 79.99, quantity: 1 }],
  [{ product_name: 'Smart Watch Band', unit_price: 22.99, quantity: 2 }],
  [{ product_name: 'Desk Lamp LED', unit_price: 38.00, quantity: 1 }],
  [{ product_name: 'Cooling Pad', unit_price: 29.99, quantity: 1 }],
  [{ product_name: 'Wireless Charger', unit_price: 35.00, quantity: 1 }, { product_name: 'USB-C Cable', unit_price: 12.99, quantity: 1 }],
  [{ product_name: 'Gaming Mouse', unit_price: 69.99, quantity: 1 }],
  [{ product_name: 'Microphone USB', unit_price: 99.99, quantity: 1 }],
  [{ product_name: 'Cable Organizer', unit_price: 11.99, quantity: 4 }],
  [{ product_name: 'Monitor Stand', unit_price: 54.99, quantity: 1 }],
  [{ product_name: 'Earbuds TWS', unit_price: 44.99, quantity: 1 }],
  [{ product_name: 'SD Card 64GB', unit_price: 18.99, quantity: 2 }, { product_name: 'Card Reader', unit_price: 9.99, quantity: 1 }],
];

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(Math.floor(Math.random() * 12) + 8, Math.floor(Math.random() * 60), 0, 0);
  return d;
}

function calcTotals(items) {
  const subtotal = items.reduce((s, i) => s + i.unit_price * i.quantity, 0);
  const lineItems = items.map(i => ({
    product_id: DUMMY_PRODUCT_ID,
    product_name: i.product_name,
    quantity: i.quantity,
    unit_price: i.unit_price,
    tax_rate: 0,
    tax_amount: 0,
    line_total: parseFloat((i.unit_price * i.quantity).toFixed(2)),
  }));
  return { subtotal: parseFloat(subtotal.toFixed(2)), lineItems };
}

const dummyTransactions = Array.from({ length: 20 }, (_, i) => {
  const items = productSets[i % productSets.length];
  const { subtotal, lineItems } = calcTotals(items);
  const payment_method = i % 3 === 0 ? 'paystack' : 'cash';
  const statuses = ['completed', 'completed', 'completed', 'completed', 'pending', 'refunded'];
  const payment_status = i % 6 < 4 ? 'completed' : statuses[i % 6];
  const customerName = customerNames[i % customerNames.length];
  const ref = payment_method === 'paystack' ? `PSK-${Date.now()}-${i}` : null;

  return {
    receipt_number: `REC-DUMMY-${String(i + 1).padStart(4, '0')}`,
    customer_id: null,
    customer_name: customerName,
    cashier_id: DUMMY_CASHIER_ID,
    items: lineItems,
    subtotal,
    discount_type: null,
    discount_value: 0,
    discount_amount: 0,
    tax_amount: 0,
    total_amount: subtotal,
    amount_paid: payment_status === 'pending' ? 0 : subtotal,
    change_due: 0,
    payment_method,
    payment_reference: ref,
    payment_status,
    notes: '',
    createdAt: daysAgo(i * 1.5),
  };
});

exports.getAllTransactions = async (req, res, next) => {
  try {
    const {
      page = 1, limit = 15, payment_method, status, fromDate, toDate,
    } = req.query;

    // Ensure sort and search are strings (not arrays) to prevent type confusion
    const sortRaw = Array.isArray(req.query.sort) ? req.query.sort[0] : (req.query.sort || '-createdAt');
    const search = Array.isArray(req.query.search) ? req.query.search[0] : req.query.search;

    // Restrict sort to allowed fields to prevent NoSQL injection
    const ALLOWED_SORT_FIELDS = ['createdAt', 'total_amount', 'receipt_number', 'payment_method', 'payment_status'];
    const isDesc = typeof sortRaw === 'string' && sortRaw.startsWith('-');
    const sortFieldRaw = isDesc ? sortRaw.slice(1) : sortRaw;
    const sortField = ALLOWED_SORT_FIELDS.includes(sortFieldRaw) ? sortFieldRaw : 'createdAt';
    const sortDir = isDesc ? -1 : 1;

    const ALLOWED_METHODS = ['cash', 'mobile_money', 'card', 'paystack'];
    const ALLOWED_STATUSES = ['pending', 'completed', 'refunded', 'void'];

    const filter = {};
    if (payment_method && ALLOWED_METHODS.includes(payment_method)) filter.payment_method = payment_method;
    if (status && ALLOWED_STATUSES.includes(status)) filter.payment_status = status;
    if (search && typeof search === 'string') filter.receipt_number = { $regex: search.slice(0, 100), $options: 'i' };
    if (fromDate || toDate) {
      filter.createdAt = {};
      if (fromDate) filter.createdAt.$gte = new Date(fromDate);
      if (toDate) { const d = new Date(toDate); d.setHours(23, 59, 59, 999); filter.createdAt.$lte = d; }
    }

    const total = await Sale.countDocuments(filter);
    const data = await Sale.find(filter)
      .populate('cashier_id', 'full_name')
      .populate('customer_id', 'full_name phone')
      .sort({ [sortField]: sortDir })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    res.json({ data, total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) { next(err); }
};

exports.getTransactionById = async (req, res, next) => {
  try {
    const tx = await Sale.findById(req.params.id)
      .populate('cashier_id', 'full_name')
      .populate('customer_id', 'full_name phone email');
    if (!tx) return res.status(404).json({ message: 'Transaction not found' });
    res.json(tx);
  } catch (err) { next(err); }
};

exports.createTransaction = async (req, res, next) => {
  try {
    const { receipt_number, payment_method, payment_reference, payment_status, items, total_amount, amount_paid, notes } = req.body;
    if (!payment_method) return res.status(400).json({ message: 'payment_method required' });

    const tx = await Sale.create({
      receipt_number: receipt_number || `REC-${Date.now()}`,
      cashier_id: req.user.id,
      customer_id: req.body.customer_id || null,
      items: items || [],
      subtotal: total_amount || 0,
      discount_type: null,
      discount_value: 0,
      discount_amount: 0,
      tax_amount: 0,
      total_amount: total_amount || 0,
      amount_paid: amount_paid || 0,
      change_due: Math.max(0, (amount_paid || 0) - (total_amount || 0)),
      payment_method,
      payment_reference: payment_reference || null,
      payment_status: payment_status || 'pending',
      notes: notes || '',
    });

    res.status(201).json(tx);
  } catch (err) { next(err); }
};

exports.updateTransactionStatus = async (req, res, next) => {
  try {
    const { payment_status, payment_reference } = req.body;
    const allowed = ['pending', 'completed', 'refunded', 'void'];
    if (payment_status && !allowed.includes(payment_status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const update = {};
    if (payment_status) update.payment_status = payment_status;
    if (payment_reference) update.payment_reference = payment_reference;

    const tx = await Sale.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!tx) return res.status(404).json({ message: 'Transaction not found' });
    res.json(tx);
  } catch (err) { next(err); }
};

exports.getDummyTransactions = (_req, res) => {
  const page = parseInt(_req.query.page) || 1;
  const limit = parseInt(_req.query.limit) || 15;
  const { payment_method, status, search, fromDate, toDate } = _req.query;

  let filtered = [...dummyTransactions];
  if (payment_method && payment_method !== 'all') filtered = filtered.filter(t => t.payment_method === payment_method);
  if (status && status !== 'all') filtered = filtered.filter(t => t.payment_status === status);
  if (search) filtered = filtered.filter(t => t.receipt_number.toLowerCase().includes(search.toLowerCase()) || t.customer_name.toLowerCase().includes(search.toLowerCase()));
  if (fromDate) filtered = filtered.filter(t => new Date(t.createdAt) >= new Date(fromDate));
  if (toDate) { const d = new Date(toDate); d.setHours(23, 59, 59, 999); filtered = filtered.filter(t => new Date(t.createdAt) <= d); }

  const total = filtered.length;
  const data = filtered.slice((page - 1) * limit, page * limit);
  res.json({ data, total, page, limit, pages: Math.ceil(total / limit) });
};

exports.getDashboardStats = async (req, res, next) => {
  try {
    if (!cachedTransactions) {
      cachedTransactions = generateDummyTransactions();
    }

    const completed = cachedTransactions.filter(t => t.status === 'completed');
    const totalRevenue = completed.reduce((sum, t) => sum + t.total, 0);
    const avgTransaction = completed.length > 0 ? totalRevenue / completed.length : 0;
    const paystackCount = cachedTransactions.filter(t => t.payment.method === 'paystack').length;

    res.json({
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      transactionCount: cachedTransactions.length,
      completedCount: completed.length,
      avgTransaction: Math.round(avgTransaction * 100) / 100,
      paystackPercentage: Math.round((paystackCount / cachedTransactions.length) * 100),
      recentTransactions: cachedTransactions.slice(0, 10),
    });
  } catch (error) {
    next(error);
  }
};
