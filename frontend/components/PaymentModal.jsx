'use client'
import { useState } from 'react'
import { X, CreditCard, Banknote, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const PAYMENT_METHODS = [
  { key: 'cash',     label: 'Cash',     icon: Banknote,    desc: 'Collect payment in person' },
  { key: 'paystack', label: 'Paystack', icon: CreditCard,  desc: 'Pay via Paystack (card/bank)' },
]

export default function PaymentModal({ amount, onClose, onComplete, customerEmail }) {
  const [method, setMethod] = useState('cash')
  const [amountPaid, setAmountPaid] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(null) // 'success' | 'error'
  const [statusMsg, setStatusMsg] = useState('')
  const [reference, setReference] = useState('')

  const displayAmount = amount || 0
  const change = Math.max(0, parseFloat(amountPaid || 0) - displayAmount)

  const handleCashPayment = async () => {
    const paid = parseFloat(amountPaid)
    if (isNaN(paid) || paid < displayAmount) {
      toast.error('Amount paid must be at least the total amount')
      return
    }
    setLoading(true)
    await new Promise(r => setTimeout(r, 600))
    setLoading(false)
    setStatus('success')
    setStatusMsg(`Cash payment of $${paid.toFixed(2)} received. Change: $${change.toFixed(2)}`)
    toast.success('Cash payment recorded!')
    if (onComplete) onComplete({ method: 'cash', amount_paid: paid, change_due: change, payment_status: 'completed' })
  }

  const handlePaystackPayment = async () => {
    if (typeof window === 'undefined') return

    setLoading(true)
    try {
      const ref = `PSK-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
      setReference(ref)

      const script = await new Promise((resolve, reject) => {
        if (window.PaystackPop) { resolve(window.PaystackPop); return }
        const el = document.createElement('script')
        el.src = 'https://js.paystack.co/v1/inline.js'
        el.onload = () => resolve(window.PaystackPop)
        el.onerror = () => reject(new Error('Failed to load Paystack'))
        document.head.appendChild(el)
      })

      setLoading(false)

      if (!process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY) {
        throw new Error('NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY is not configured. Please set this environment variable to use Paystack payments.')
      }
      const handler = script.setup({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
        email: customerEmail || 'customer@example.com',
        amount: Math.round(displayAmount * 100),
        ref,
        onClose: () => {
          toast('Payment cancelled', { icon: '⚠️' })
        },
        callback: (response) => {
          setStatus('success')
          setStatusMsg(`Paystack payment successful! Reference: ${response.reference}`)
          toast.success('Paystack payment verified!')
          if (onComplete) onComplete({ method: 'paystack', reference: response.reference, amount_paid: displayAmount, payment_status: 'completed' })
        },
      })
      handler.openIframe()
    } catch (err) {
      setLoading(false)
      setStatus('error')
      setStatusMsg(err.message || 'Paystack initialization failed')
      toast.error('Failed to initialize Paystack payment')
    }
  }

  const handleSubmit = () => {
    if (method === 'cash') handleCashPayment()
    else handlePaystackPayment()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <CreditCard size={20} className="text-blue-600" /> Process Payment
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><X size={20} className="text-gray-500" /></button>
        </div>

        <div className="p-6 space-y-5">
          {/* Amount summary */}
          <div className="bg-blue-50 rounded-xl p-4 text-center">
            <p className="text-sm text-blue-600 font-medium">Total Amount Due</p>
            <p className="text-3xl font-bold text-blue-800 mt-1">${displayAmount.toFixed(2)}</p>
          </div>

          {/* Status messages */}
          {status === 'success' && (
            <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-lg p-3">
              <CheckCircle2 size={18} className="text-green-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-green-800">{statusMsg}</p>
            </div>
          )}
          {status === 'error' && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-3">
              <AlertCircle size={18} className="text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-800">{statusMsg}</p>
            </div>
          )}

          {/* Payment method selection */}
          {!status && (
            <>
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-3">Select Payment Method</p>
                <div className="grid grid-cols-2 gap-3">
                  {PAYMENT_METHODS.map(({ key, label, icon: Icon, desc }) => (
                    <button
                      key={key}
                      onClick={() => setMethod(key)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-left ${method === key ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300 bg-white'}`}
                    >
                      <Icon size={24} className={method === key ? 'text-blue-600' : 'text-gray-400'} />
                      <div>
                        <p className={`text-sm font-semibold ${method === key ? 'text-blue-700' : 'text-gray-700'}`}>{label}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Cash input */}
              {method === 'cash' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount Received</label>
                  <input
                    type="number"
                    step="0.01"
                    min={displayAmount}
                    value={amountPaid}
                    onChange={e => setAmountPaid(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder={displayAmount.toFixed(2)}
                  />
                  {parseFloat(amountPaid) > 0 && (
                    <p className="text-sm text-green-600 mt-1.5">Change due: ${change.toFixed(2)}</p>
                  )}
                </div>
              )}

              {/* Paystack info */}
              {method === 'paystack' && (
                <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
                  <p>A Paystack payment popup will open. Enter your card or bank details to complete payment.</p>
                  {customerEmail && <p className="mt-1 text-xs text-gray-400">Receipt will be sent to: {customerEmail}</p>}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button onClick={onClose} className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg text-sm hover:bg-gray-50">
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading || (method === 'cash' && (!amountPaid || parseFloat(amountPaid) < displayAmount))}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  {loading ? 'Processing...' : method === 'paystack' ? 'Pay with Paystack' : 'Confirm Cash Payment'}
                </button>
              </div>
            </>
          )}

          {status && (
            <button onClick={onClose} className="w-full bg-gray-900 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-800">
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
