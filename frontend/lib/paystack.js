import api from './axios'

export function loadPaystackScript() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error('Not in browser'))
    if (window.PaystackPop) return resolve(window.PaystackPop)
    const script = document.createElement('script')
    script.src = 'https://js.paystack.co/v1/inline.js'
    script.onload = () => resolve(window.PaystackPop)
    script.onerror = () => reject(new Error('Failed to load Paystack script'))
    document.head.appendChild(script)
  })
}

export async function initializePaystackPayment({ email, amount, reference, onSuccess, onCancel }) {
  const PaystackPop = await loadPaystackScript()
  const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
  if (!publicKey) {
    throw new Error('NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY environment variable is not set')
  }
  const handler = PaystackPop.setup({
    key: publicKey,
    email: email || 'customer@example.com',
    amount: Math.round(amount * 100),
    ref: reference,
    onClose: () => { if (onCancel) onCancel() },
    callback: (response) => { if (onSuccess) onSuccess(response) },
  })
  handler.openIframe()
}

export async function verifyPaystackPayment(reference) {
  const res = await api.post('/payments/paystack/verify', { reference })
  return res.data
}

export async function initializePaystackViaBackend({ email, amount, saleId, metadata }) {
  const res = await api.post('/payments/paystack/initialize', {
    email,
    amount,
    sale_id: saleId,
    metadata,
  })
  return res.data
}

export function formatPaystackAmount(amount) {
  return new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(amount)
}
