/**
 * Paystack inline payment helper.
 * Uses the Paystack inline JS via dynamic script injection so it works in SSR/Next.js.
 */

const PAYSTACK_JS_URL = 'https://js.paystack.co/v1/inline.js';

function loadPaystackScript() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error('Not in browser'));
    if (window.PaystackPop) return resolve(window.PaystackPop);
    const script = document.createElement('script');
    script.src = PAYSTACK_JS_URL;
    script.async = true;
    script.onload = () => resolve(window.PaystackPop);
    script.onerror = () => reject(new Error('Failed to load Paystack script'));
    document.head.appendChild(script);
  });
}

/**
 * Opens the Paystack payment popup.
 * @param {object} options
 * @param {string} options.key  - Paystack public key
 * @param {string} options.email
 * @param {number} options.amount - Amount in the MAIN currency unit (e.g. GHS, NGN)
 * @param {string} options.reference
 * @param {function} options.onSuccess - Called with transaction object on success
 * @param {function} options.onClose   - Called when popup is closed without payment
 */
export async function openPaystackPopup({ key, email, amount, reference, onSuccess, onClose }) {
  const PaystackPop = await loadPaystackScript();
  const handler = PaystackPop.setup({
    key,
    email,
    amount: Math.round(amount * 100), // convert to smallest currency unit
    ref: reference,
    callback: (transaction) => {
      onSuccess && onSuccess(transaction);
    },
    onClose: () => {
      onClose && onClose();
    }
  });
  handler.openIframe();
}
