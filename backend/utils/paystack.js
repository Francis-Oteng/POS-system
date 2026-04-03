const axios = require('axios');

const PAYSTACK_BASE = 'https://api.paystack.co';

function paystackClient() {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) throw new Error('PAYSTACK_SECRET_KEY is not configured');
  return axios.create({
    baseURL: PAYSTACK_BASE,
    headers: { Authorization: `Bearer ${secretKey}`, 'Content-Type': 'application/json' }
  });
}

/**
 * Initialize a Paystack transaction.
 * @param {string} email - Customer email
 * @param {number} amount - Amount in the smallest currency unit (e.g. kobo for NGN, pesewas for GHS)
 * @param {string} reference - Unique transaction reference
 * @param {object} metadata - Optional extra data
 */
async function initializeTransaction({ email, amount, reference, metadata = {} }) {
  const client = paystackClient();
  const { data } = await client.post('/transaction/initialize', {
    email,
    amount: Math.round(amount * 100), // convert to smallest unit
    reference,
    metadata
  });
  if (!data.status) throw new Error(data.message || 'Paystack initialization failed');
  return data.data; // { authorization_url, access_code, reference }
}

/**
 * Verify a Paystack transaction by reference.
 * @param {string} reference - Transaction reference
 */
async function verifyTransaction(reference) {
  const client = paystackClient();
  const { data } = await client.get(`/transaction/verify/${encodeURIComponent(reference)}`);
  if (!data.status) throw new Error(data.message || 'Paystack verification failed');
  return data.data; // { status, amount, reference, ... }
}

module.exports = { initializeTransaction, verifyTransaction };
