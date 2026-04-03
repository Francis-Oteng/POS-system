require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/pos_system')
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());

// Routes
app.use('/api/auth',      require('./routes/auth.routes'));
app.use('/api/users',     require('./routes/users.routes'));
app.use('/api/products',  require('./routes/products.routes'));
app.use('/api/sales',     require('./routes/sales.routes'));
app.use('/api/inventory', require('./routes/inventory.routes'));
app.use('/api/customers', require('./routes/customers.routes'));
app.use('/api/reports',   require('./routes/reports.routes'));
app.use('/api/payments',  require('./routes/payments.routes'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));
app.use((req, res) => res.status(404).json({ message: 'Route not found' }));
app.use(require('./middleware/errorHandler'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`POS API running on port ${PORT}`));
module.exports = app;
