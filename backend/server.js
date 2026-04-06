const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

const dummyProducts = [
    { id: 1, name: 'Coca Cola', price: 5.99 },
    { id: 2, name: 'Fanta Orange', price: 4.99 },
    { id: 3, name: 'Sprite', price: 4.99 },
    { id: 4, name: 'Water 500ml', price: 2.99 },
    { id: 5, name: 'Milk 1L', price: 8.99 },
    { id: 6, name: 'Orange Juice', price: 6.99 },
    { id: 7, name: 'Bread', price: 3.50 },
    { id: 8, name: 'Butter', price: 7.99 },
    { id: 9, name: 'Eggs (12)', price: 9.99 },
    { id: 10, name: 'Rice 5kg', price: 15.99 },
    { id: 11, name: 'Sugar 2kg', price: 6.50 },
    { id: 12, name: 'Salt', price: 1.50 }
];

app.get('/api/products', (req, res) => {
    try {
        res.json(dummyProducts);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

app.post('/api/pay', async (req, res) => {
    try {
        const { amount, paymentMethod, email } = req.body;
        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Invalid amount' });
        }
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const amountInKobo = Math.round(amount * 100);
        const paystackUrl = 'https://api.paystack.co/transaction/initialize';
        const paystackPayload = {
            email,
            amount: amountInKobo,
            metadata: { paymentMethod: paymentMethod }
        };

        const paystackResponse = await axios.post(paystackUrl, paystackPayload, {
            headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        const { data } = paystackResponse.data;

        res.json({
            success: true,
            authorizationUrl: data.authorization_url,
            accessCode: data.access_code,
            reference: data.reference
        });
    } catch (error) {
        console.error('Paystack Error:', error.response?.data || error.message);
        if (error.response?.status === 401) {
            return res.status(401).json({ error: 'Invalid Paystack API key' });
        }
        res.status(500).json({ error: 'Failed to initialize payment', details: error.response?.data?.message || error.message });
    }
});

app.get('/api/verify-payment/:reference', async (req, res) => {
    try {
        const { reference } = req.params;
        const verifyUrl = `https://api.paystack.co/transaction/verify/${reference}`;
        const response = await axios.get(verifyUrl, {
            headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
            }
        });

        res.json({
            success: response.data.data.status === 'success',
            data: response.data.data
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to verify payment' });
    }
});

app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
    console.log(`🚀 POS System Backend running on http://localhost:${PORT}`);
    console.log(`📝 Products endpoint: http://localhost:${PORT}/api/products`);
    console.log(`💳 Payment endpoint: http://localhost:${PORT}/api/pay`);
});