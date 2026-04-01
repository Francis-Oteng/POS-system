const User = require('../models/User');

exports.list = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    if (req.query.is_active !== undefined) filter.is_active = req.query.is_active === '1' || req.query.is_active === 'true';
    const users = await User.find(filter).select('-password').sort('-createdAt');
    res.json(users);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { username, email, password, full_name, role } = req.body;
    if (!username || !email || !password || !full_name || !role) return res.status(400).json({ message: 'All fields required' });
    if (!['admin', 'manager', 'cashier'].includes(role)) return res.status(400).json({ message: 'Invalid role' });
    const user = await new User({ username, email, password, full_name, role }).save();
    res.status(201).json(user.toSafeObject());
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const { full_name, email, role, is_active, password } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (full_name !== undefined) user.full_name = full_name;
    if (email !== undefined) user.email = email;
    if (role !== undefined) user.role = role;
    if (is_active !== undefined) user.is_active = is_active;
    if (password) user.password = password;
    await user.save();
    res.json(user.toSafeObject());
  } catch (err) { next(err); }
};

exports.deactivate = async (req, res, next) => {
  try {
    if (req.params.id === req.user.id.toString()) return res.status(400).json({ message: 'Cannot deactivate your own account' });
    const user = await User.findByIdAndUpdate(req.params.id, { is_active: false });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deactivated' });
  } catch (err) { next(err); }
};
