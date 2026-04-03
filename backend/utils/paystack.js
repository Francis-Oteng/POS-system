const https = require('https');

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
if (!PAYSTACK_SECRET_KEY) {
  console.warn('Warning: PAYSTACK_SECRET_KEY environment variable is not set. Paystack payments will fail.');
}
const PAYSTACK_BASE_URL = 'api.paystack.co';

function paystackRequest(method, path, data) {
  return new Promise((resolve, reject) => {
    const payload = data ? JSON.stringify(data) : null;
    const options = {
      hostname: PAYSTACK_BASE_URL,
      port: 443,
      path,
      method,
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    };
    if (payload) options.headers['Content-Length'] = Buffer.byteLength(payload);

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch {
          reject(new Error('Failed to parse Paystack response'));
        }
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

exports.initializePayment = async ({ email, amount, reference, metadata }) => {
  const data = {
    email: email || 'customer@example.com',
    amount: Math.round(amount * 100),
    reference,
    metadata: metadata || {},
    callback_url: process.env.PAYSTACK_CALLBACK_URL || 'http://localhost:3000/admin/transactions',
  };
  return paystackRequest('POST', '/transaction/initialize', data);
};

exports.verifyPayment = async (reference) => {
  return paystackRequest('GET', `/transaction/verify/${encodeURIComponent(reference)}`);
};

exports.formatPaymentResponse = (paystackResponse) => {
  if (!paystackResponse || !paystackResponse.data) {
    return { success: false, message: 'Invalid response from Paystack' };
  }
  const { data } = paystackResponse;
  return {
    success: paystackResponse.status === true,
    reference: data.reference,
    amount: data.amount ? data.amount / 100 : 0,
    status: data.status,
    authorization_url: data.authorization_url,
    access_code: data.access_code,
    customer: data.customer,
    paid_at: data.paid_at,
    channel: data.channel,
    message: paystackResponse.message,
  };
};
