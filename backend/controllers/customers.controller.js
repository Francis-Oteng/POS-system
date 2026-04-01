const Customer = require('../models/Customer');
const Sale = require('../models/Sale');

exports.list = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (search) filter.$or = [
      { full_name: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
    const total = await Customer.countDocuments(filter);
    const data = await Customer.find(filter).sort('full_name').skip((parseInt(page)-1)*parseInt(limit)).limit(parseInt(limit));
    res.json({ data, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) { next(err); }
};

exports.getById = async (req, res, next) => {
  try {
    const c = await Customer.findById(req.params.id);
    if (!c) return res.status(404).json({ message: 'Customer not found' });
    res.json(c);
  } catch (err) { next(err); }
};

exports.getPurchases = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const filter = { customer_id: req.params.id };
    const total = await Sale.countDocuments(filter);
    const data = await Sale.find(filter).select('receipt_number total_amount payment_method payment_status createdAt').sort('-createdAt').skip((parseInt(page)-1)*parseInt(limit)).limit(parseInt(limit));
    res.json({ data, total });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { full_name, phone, email, address } = req.body;
    if (!full_name) return res.status(400).json({ message: 'Full name required' });
    const customer = await new Customer({ full_name, phone, email, address }).save();
    res.status(201).json(customer);
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const { full_name, phone, email, address } = req.body;
    const c = await Customer.findByIdAndUpdate(req.params.id, { full_name, phone, email, address }, { new: true, runValidators: true });
    if (!c) return res.status(404).json({ message: 'Customer not found' });
    res.json(c);
  } catch (err) { next(err); }
};

exports.redeemPoints = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    const { points } = req.body;
    if (!points || points <= 0) return res.status(400).json({ message: 'Invalid points' });
    if (customer.loyalty_points < points) return res.status(400).json({ message: 'Insufficient loyalty points' });
    customer.loyalty_points -= points;
    await customer.save();
    res.json({ redeemed_points: points, discount_amount: points / 100, remaining_points: customer.loyalty_points });
  } catch (err) { next(err); }
};
