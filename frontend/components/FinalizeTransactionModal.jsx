'use client'
import { useState, useEffect } from 'react'
import { X, CheckCircle, CreditCard, Banknote, Smartphone } from 'lucide-react'
import { formatCurrency } from '../lib/formatting'
import toast from 'react-hot-toast'

function PaystackButton({ transaction, onSuccess }) {
  const [email, setEmail] = useState(transaction.customer?.email || '')
  const [loading, setLoading] = useState(false)

  const handlePay = () => {
    if (!email) { toast.error('Please enter your email'); return }
    if (typeof window === 'undefined' || !window.PaystackPop) {
      toast.error('Paystack is not loaded. Please refresh the page.')
      return
    }
    setLoading(true)
    const handler = window.PaystackPop.setup({
      key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || 'pk_test_placeholder',
      email,
      amount: Math.round(transaction.total * 100),   // Paystack expects kobo/cents
      currency: 'USD',
      ref: transaction.paystackRef || `PSK-${Date.now()}`,
      metadata: {
        transaction_id: transaction.id,
        customer_name: transaction.customer?.name,
      },
      onClose: () => { setLoading(false) },
      callback: (response) => {
        setLoading(false)
        if (response.status === 'success') {
          toast.success('Payment successful!')
          onSuccess({ ...transaction, status: 'completed', paystackRef: response.reference })
        } else {
          toast.error('Payment was not completed')
        }
      },
    })
    handler.openIframe()
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email for receipt</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="customer@example.com"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
        />
      </div>
      <button
        onClick={handlePay}
        disabled={loading}
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {loading ? (
          <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
        ) : (
          <Smartphone size={16} />
        )}
        {loading ? 'Processing…' : `Pay ${formatCurrency(transaction.total)} with Paystack`}
      </button>
      <p className="text-xs text-gray-400 text-center">Secured by Paystack — your payment details are safe</p>
    </div>
  )
}

export default function FinalizeTransactionModal({ transaction, onClose, onFinalized }) {
  const [step, setStep] = useState('confirm')   // confirm | selectMethod | paystack | cash
  const [payMethod, setPayMethod] = useState(transaction.paymentMethod || 'paystack')

  useEffect(() => {
    // Load Paystack Inline JS
    if (!document.getElementById('paystack-inline-js')) {
      const script = document.createElement('script')
      script.id  = 'paystack-inline-js'
      script.src = 'https://js.paystack.co/v1/inline.js'
      document.head.appendChild(script)
    }
  }, [])

  const handleCashConfirm = () => {
    toast.success('Cash payment confirmed!')
    onFinalized({ ...transaction, status: 'completed' })
    onClose()
  }

  const handlePaystackSuccess = (updated) => {
    onFinalized(updated)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-bold text-gray-900">Finalize Transaction</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Transaction summary */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Transaction ID</span>
              <span className="font-mono font-medium">{transaction.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Customer</span>
              <span className="font-medium">{transaction.customer?.name || 'Walk-in'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Items</span>
              <span className="font-medium">{transaction.items?.length} item(s)</span>
            </div>
            <div className="flex justify-between text-base font-bold border-t pt-2 mt-1">
              <span>Total Amount</span>
              <span className="text-emerald-600">{formatCurrency(transaction.total)}</span>
            </div>
          </div>

          {/* Payment method selector */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">Select Payment Method</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: 'paystack', label: 'Paystack', Icon: Smartphone, activeClass: 'border-emerald-500 bg-emerald-50 text-emerald-700' },
                { key: 'cash',     label: 'Cash',     Icon: Banknote,   activeClass: 'border-gray-500 bg-gray-100 text-gray-700'         },
                { key: 'card',     label: 'Card',     Icon: CreditCard, activeClass: 'border-blue-500 bg-blue-50 text-blue-700'           },
              ].map(({ key, label, Icon, activeClass }) => (
                <button
                  key={key}
                  onClick={() => setPayMethod(key)}
                  className={`flex flex-col items-center gap-1.5 py-3 rounded-lg border-2 text-xs font-medium transition-colors
                    ${payMethod === key ? activeClass : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                >
                  <Icon size={18} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Payment action */}
          {payMethod === 'paystack' ? (
            <PaystackButton transaction={transaction} onSuccess={handlePaystackSuccess} />
          ) : payMethod === 'cash' ? (
            <div className="space-y-3">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                Confirm that you have received <strong>{formatCurrency(transaction.total)}</strong> in cash from{' '}
                <strong>{transaction.customer?.name || 'the customer'}</strong>.
              </div>
              <button
                onClick={handleCashConfirm}
                className="w-full bg-gray-800 hover:bg-gray-900 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle size={16} />
                Confirm Cash Received
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                Process card payment of <strong>{formatCurrency(transaction.total)}</strong> on your card terminal, then confirm below.
              </div>
              <button
                onClick={() => {
                  toast.success('Card payment confirmed!')
                  onFinalized({ ...transaction, status: 'completed' })
                  onClose()
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
              >
                <CreditCard size={16} />
                Confirm Card Payment
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
