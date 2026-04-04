'use client'
import { useState, useRef, useCallback } from 'react'
import { Barcode, Search, Trash2, Plus, Minus, User, CreditCard, Loader2, Printer, X } from 'lucide-react'
import { useCart } from '../../context/CartContext'
import api from '../../lib/axios'
import toast from 'react-hot-toast'
import ProtectedLayout from '../layout/ProtectedLayout'
import { openPaystackPopup } from '../../lib/paystack'

function ReceiptModal({ sale, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
        <h2 className="text-lg font-bold text-center mb-1">Receipt</h2>
        <p className="text-center text-sm text-gray-500 mb-4">#{sale.receipt_number}</p>
        <div className="border-t border-b border-dashed border-gray-300 py-4 space-y-1 mb-4">
          {sale.items?.map((item, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span>{item.product_name} x{item.quantity}</span>
              <span>${(item.line_total || 0).toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="space-y-1 text-sm mb-6">
          <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>${(sale.subtotal || 0).toFixed(2)}</span></div>
          {sale.discount_amount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-${sale.discount_amount.toFixed(2)}</span></div>}
          {sale.tax_amount > 0 && <div className="flex justify-between"><span className="text-gray-500">Tax</span><span>${sale.tax_amount.toFixed(2)}</span></div>}
          <div className="flex justify-between font-bold text-base border-t pt-2"><span>Total</span><span>${(sale.total_amount || 0).toFixed(2)}</span></div>
          <div className="flex justify-between text-gray-500"><span>Paid ({sale.payment_method})</span><span>${(sale.amount_paid || 0).toFixed(2)}</span></div>
          {sale.change_due > 0 && <div className="flex justify-between text-blue-600"><span>Change</span><span>${sale.change_due.toFixed(2)}</span></div>}
        </div>
        <div className="flex gap-3">
          <button onClick={() => window.print()} className="flex-1 flex items-center justify-center gap-2 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">
            <Printer size={16} /> Print
          </button>
          <button onClick={onClose} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-blue-700">New Sale</button>
        </div>
      </div>
    </div>
  )
}

function CheckoutModal({ onClose, onComplete }) {
  const { items, subtotal, discountAmount, taxAmount, total, discountType, discountValue, setDiscount, customer } = useCart()
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [amountPaid, setAmountPaid] = useState('')
  const [paystackEmail, setPaystackEmail] = useState(customer?.email || '')
  const [loading, setLoading] = useState(false)
  const change = Math.max(0, parseFloat(amountPaid || 0) - total)

  const createSale = async (paymentReference = null) => {
    const res = await api.post('/sales', {
      customer_id: customer?._id || null,
      items: items.map(i => ({ product_id: i._id, quantity: i.quantity })),
      discount_type: discountType || undefined,
      discount_value: discountValue,
      payment_method: paymentMethod,
      amount_paid: paymentMethod === 'paystack' ? total : (parseFloat(amountPaid) || total),
      payment_reference: paymentReference
    })
    return res.data
  }

  const handleCashCheckout = async () => {
    setLoading(true)
    try {
      const sale = await createSale()
      onComplete(sale)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Checkout failed')
    } finally { setLoading(false) }
  }

  const handlePaystackCheckout = async () => {
    if (!paystackEmail) { toast.error('Please enter a customer email for Paystack payment'); return }
    const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
    if (!publicKey) { toast.error('Paystack is not configured. Please add NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY to your environment.'); return }
    setLoading(true)
    try {
      const reference = `POS-${crypto.randomUUID().replace(/-/g, '').slice(0, 16).toUpperCase()}`
      await openPaystackPopup({
        key: publicKey,
        email: paystackEmail,
        amount: total,
        reference,
        onSuccess: async (transaction) => {
          try {
            // Verify on backend then create sale
            await api.post('/payments/paystack/verify', { reference: transaction.reference })
            const sale = await createSale(transaction.reference)
            onComplete(sale)
          } catch (err) {
            toast.error(err.response?.data?.message || 'Payment verified but sale creation failed')
          } finally { setLoading(false) }
        },
        onClose: () => {
          toast('Payment cancelled')
          setLoading(false)
        }
      })
    } catch (err) {
      toast.error(err.message || 'Failed to open Paystack')
      setLoading(false)
    }
  }

  const handleCheckout = () => {
    if (paymentMethod === 'paystack') handlePaystackCheckout()
    else handleCashCheckout()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Checkout</h2>
          <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {['cash', 'mobile_money', 'card', 'paystack'].map(m => (
            <button key={m} onClick={() => setPaymentMethod(m)}
              className={`py-2 rounded-lg text-sm font-medium border-2 transition-colors ${paymentMethod === m ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
              {m === 'mobile_money' ? 'Mobile Money' : m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>
        {paymentMethod === 'paystack' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer Email <span className="text-red-500">*</span></label>
            <input type="email" value={paystackEmail} onChange={e => setPaystackEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="customer@example.com" />
            <p className="text-xs text-gray-400 mt-1">Required to process Paystack payment</p>
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Discount</label>
          <div className="flex gap-2">
            <select value={discountType || ''} onChange={e => setDiscount(e.target.value || null, discountValue)} className="border border-gray-300 rounded-lg px-2 py-2 text-sm">
              <option value="">None</option>
              <option value="percent">%</option>
              <option value="fixed">Fixed</option>
            </select>
            <input type="number" min="0" value={discountValue} onChange={e => setDiscount(discountType, e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="0" />
          </div>
        </div>
        <div className="space-y-1 text-sm border-t pt-3">
          <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
          {discountAmount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-${discountAmount.toFixed(2)}</span></div>}
          {taxAmount > 0 && <div className="flex justify-between"><span className="text-gray-500">Tax</span><span>${taxAmount.toFixed(2)}</span></div>}
          <div className="flex justify-between font-bold text-base"><span>Total</span><span>${total.toFixed(2)}</span></div>
        </div>
        {paymentMethod !== 'paystack' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount Received</label>
            <input type="number" step="0.01" value={amountPaid} onChange={e => setAmountPaid(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder={total.toFixed(2)} />
            {parseFloat(amountPaid) > 0 && <p className="text-sm text-green-600 mt-1">Change: ${change.toFixed(2)}</p>}
          </div>
        )}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
          <button onClick={handleCheckout} disabled={loading || items.length === 0}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2">
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? 'Processing...' : paymentMethod === 'paystack' ? 'Pay with Paystack' : 'Confirm Payment'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function POSPage() {
  const { items, addItem, removeItem, updateQty, clearCart, customer, setCustomer, subtotal, discountAmount, taxAmount, total } = useCart()
  const [barcode, setBarcode] = useState('')
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [customerSearch, setCustomerSearch] = useState('')
  const [customerResults, setCustomerResults] = useState([])
  const [showCheckout, setShowCheckout] = useState(false)
  const [receipt, setReceipt] = useState(null)
  const barcodeRef = useRef(null)
  const searchTimeout = useRef(null)

  const handleBarcodeSubmit = async (e) => {
    e.preventDefault()
    if (!barcode.trim()) return
    try {
      const res = await api.get(`/products/barcode/${barcode.trim()}`)
      addItem(res.data)
      toast.success(`Added: ${res.data.name}`)
      setBarcode('')
    } catch {
      toast.error('Product not found')
      setBarcode('')
    }
    barcodeRef.current?.focus()
  }

  const handleProductSearch = useCallback((val) => {
    setSearch(val)
    clearTimeout(searchTimeout.current)
    if (!val.trim()) { setSearchResults([]); return }
    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await api.get(`/products?search=${val}&limit=8`)
        setSearchResults(res.data.data || [])
      } catch {}
    }, 300)
  }, [])

  const handleCustomerSearch = useCallback((val) => {
    setCustomerSearch(val)
    clearTimeout(searchTimeout.current)
    if (!val.trim()) { setCustomerResults([]); return }
    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await api.get(`/customers?search=${val}&limit=5`)
        setCustomerResults(res.data.data || [])
      } catch {}
    }, 300)
  }, [])

  const handleSaleComplete = (saleData) => { setShowCheckout(false); setReceipt(saleData) }
  const handleReceiptClose = () => { setReceipt(null); clearCart(); barcodeRef.current?.focus() }

  return (
    <ProtectedLayout>
      <div className="flex gap-4 h-[calc(100vh-8rem)]">
        {/* Left panel */}
        <div className="flex-1 space-y-4 overflow-y-auto">
          {/* Barcode input */}
          <form onSubmit={handleBarcodeSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Barcode size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input ref={barcodeRef} value={barcode} onChange={e => setBarcode(e.target.value)} autoFocus
                className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Scan barcode or enter manually..." />
            </div>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm hover:bg-blue-700">Add</button>
          </form>

          {/* Product search */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => handleProductSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Search products by name..." />
            {searchResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                {searchResults.map(p => (
                  <button key={p._id} onClick={() => { addItem(p); setSearch(''); setSearchResults([]); toast.success(`Added: ${p.name}`) }}
                    className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 text-sm text-left border-b border-gray-50 last:border-0">
                    <div>
                      <p className="font-medium text-gray-800">{p.name}</p>
                      <p className="text-xs text-gray-400">{p.category} • Stock: {p.stock_qty}</p>
                    </div>
                    <span className="font-semibold text-blue-600">${p.price.toFixed(2)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Customer search */}
          <div className="relative">
            <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            {customer ? (
              <div className="flex items-center gap-2 pl-9 pr-3 py-2.5 border border-green-300 rounded-lg bg-green-50">
                <span className="text-sm text-green-700 font-medium flex-1">{customer.full_name} ({customer.loyalty_points} pts)</span>
                <button onClick={() => { setCustomer(null); setCustomerSearch('') }} className="text-green-500 hover:text-green-700"><Trash2 size={14} /></button>
              </div>
            ) : (
              <input value={customerSearch} onChange={e => handleCustomerSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Search customer (optional)..." />
            )}
            {customerResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                {customerResults.map(c => (
                  <button key={c._id} onClick={() => { setCustomer(c); setCustomerSearch(''); setCustomerResults([]) }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 text-sm text-left border-b border-gray-50 last:border-0">
                    <User size={14} className="text-gray-400" />
                    <div>
                      <p className="font-medium">{c.full_name}</p>
                      <p className="text-xs text-gray-400">{c.phone} • {c.loyalty_points} pts</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right panel: Cart */}
        <div className="w-80 flex flex-col bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Cart ({items.length} items)</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {items.length === 0 && <p className="text-sm text-gray-400 text-center py-8">No items in cart</p>}
            {items.map(item => (
              <div key={item._id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                  <p className="text-xs text-gray-500">${item.price.toFixed(2)} each</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => updateQty(item._id, item.quantity - 1)} className="w-6 h-6 flex items-center justify-center bg-gray-200 rounded text-gray-600 hover:bg-gray-300"><Minus size={12} /></button>
                  <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                  <button onClick={() => updateQty(item._id, item.quantity + 1)} className="w-6 h-6 flex items-center justify-center bg-gray-200 rounded text-gray-600 hover:bg-gray-300"><Plus size={12} /></button>
                </div>
                <span className="text-sm font-semibold w-16 text-right">${(item.price * item.quantity).toFixed(2)}</span>
                <button onClick={() => removeItem(item._id)} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-gray-100 space-y-2">
            <div className="flex justify-between text-sm text-gray-500"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
            {discountAmount > 0 && <div className="flex justify-between text-sm text-green-600"><span>Discount</span><span>-${discountAmount.toFixed(2)}</span></div>}
            {taxAmount > 0 && <div className="flex justify-between text-sm text-gray-500"><span>Tax</span><span>${taxAmount.toFixed(2)}</span></div>}
            <div className="flex justify-between font-bold text-lg border-t pt-2"><span>Total</span><span>${total.toFixed(2)}</span></div>
            <div className="flex gap-2 pt-1">
              <button onClick={clearCart} disabled={items.length === 0} className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-40">Clear</button>
              <button onClick={() => setShowCheckout(true)} disabled={items.length === 0}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-1">
                <CreditCard size={16} /> Checkout
              </button>
            </div>
          </div>
        </div>
      </div>

      {showCheckout && <CheckoutModal onClose={() => setShowCheckout(false)} onComplete={handleSaleComplete} />}
      {receipt && <ReceiptModal sale={receipt} onClose={handleReceiptClose} />}
    </ProtectedLayout>
  )
}
