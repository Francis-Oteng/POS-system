const User = require('../models/User');
const { signToken } = require('../utils/jwt');

exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: 'Username and password required' });

    const user = await User.findOne({ username, is_active: true });
    if (!user || !user.comparePassword(password)) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = signToken({ id: user._id, username: user.username, role: user.role, full_name: user.full_name });
    res.json({ token, user: { id: user._id, username: user.username, full_name: user.full_name, role: user.role, email: user.email } });
  } catch (err) { next(err); }
};

exports.logout = (req, res) => res.json({ message: 'Logged out successfully' });

exports.me = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) { next(err); }
};
