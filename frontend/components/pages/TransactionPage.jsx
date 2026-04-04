'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { Search, Filter, ChevronLeft, ChevronRight, Eye, X, CreditCard, DollarSign, Smartphone, RefreshCw, Receipt } from 'lucide-react'
import api from '../../lib/axios'
import ProtectedLayout from '../layout/ProtectedLayout'
import toast from 'react-hot-toast'

const PAYMENT_METHODS = [
  { value: '', label: 'All Methods' },
  { value: 'cash', label: 'Cash' },
  { value: 'paystack', label: 'Paystack' },
  { value: 'card', label: 'Card' },
  { value: 'mobile_money', label: 'Mobile Money' },
]

const STATUSES = [
  { value: '', label: 'All Statuses' },
  { value: 'completed', label: 'Completed' },
  { value: 'refunded', label: 'Refunded' },
  { value: 'void', label: 'Void' },
]

function statusBadge(status) {
  const cls = {
    completed: 'bg-green-100 text-green-800',
    refunded:  'bg-yellow-100 text-yellow-800',
    void:      'bg-red-100 text-red-700',
  }[status] || 'bg-gray-100 text-gray-600'
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{status}</span>
}

function paymentIcon(method) {
  if (method === 'cash') return <DollarSign size={14} className="text-green-600" />
  if (method === 'paystack') return <CreditCard size={14} className="text-blue-600" />
  if (method === 'card') return <CreditCard size={14} className="text-purple-600" />
  return <Smartphone size={14} className="text-orange-500" />
}

function TransactionDetailModal({ sale, onClose }) {
  if (!sale) return null
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Transaction Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div><span className="text-gray-500">Receipt #</span><p className="font-mono font-semibold">{sale.receipt_number}</p></div>
            <div><span className="text-gray-500">Date</span><p>{new Date(sale.createdAt).toLocaleString()}</p></div>
            <div><span className="text-gray-500">Cashier</span><p>{sale.cashier_id?.full_name || '—'}</p></div>
            <div><span className="text-gray-500">Customer</span><p>{sale.customer_id?.full_name || 'Walk-in'}</p></div>
            <div><span className="text-gray-500">Payment Method</span><p className="flex items-center gap-1">{paymentIcon(sale.payment_method)} {sale.payment_method}</p></div>
            <div><span className="text-gray-500">Status</span><p>{statusBadge(sale.payment_status)}</p></div>
            {sale.payment_reference && (
              <div className="col-span-2"><span className="text-gray-500">Payment Reference</span><p className="font-mono text-xs break-all">{sale.payment_reference}</p></div>
            )}
          </div>
          <hr />
          <h3 className="font-semibold text-gray-700">Items</h3>
          <div className="space-y-1">
            {sale.items?.map((item, i) => (
              <div key={i} className="flex justify-between">
                <span>{item.product_name} <span className="text-gray-400">x{item.quantity}</span></span>
                <span>${(item.line_total || 0).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <hr />
          <div className="space-y-1">
            <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>${(sale.subtotal || 0).toFixed(2)}</span></div>
            {sale.discount_amount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-${sale.discount_amount.toFixed(2)}</span></div>}
            {sale.tax_amount > 0 && <div className="flex justify-between"><span className="text-gray-500">Tax</span><span>${sale.tax_amount.toFixed(2)}</span></div>}
            <div className="flex justify-between font-bold"><span>Total</span><span>${(sale.total_amount || 0).toFixed(2)}</span></div>
          </div>
        </div>
        <button onClick={onClose} className="mt-6 w-full border border-gray-300 py-2 rounded-lg text-sm hover:bg-gray-50">Close</button>
      </div>
    </div>
  )
}

export default function TransactionPage() {
  const [transactions, setTransactions] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [paymentStatus, setPaymentStatus] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [selectedSale, setSelectedSale] = useState(null)
  const searchTimeout = useRef(null)
  const limit = 15

  const fetchTransactions = useCallback(async (opts = {}) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: opts.page ?? page,
        limit,
        ...(opts.search ?? search ? { search: opts.search ?? search } : {}),
        ...(opts.paymentMethod ?? paymentMethod ? { payment_method: opts.paymentMethod ?? paymentMethod } : {}),
        ...(opts.paymentStatus ?? paymentStatus ? { payment_status: opts.paymentStatus ?? paymentStatus } : {}),
        ...(opts.from ?? from ? { from: opts.from ?? from } : {}),
        ...(opts.to ?? to ? { to: opts.to ?? to } : {}),
      })
      const res = await api.get(`/sales?${params}`)
      setTransactions(res.data.data || [])
      setTotal(res.data.total || 0)
    } catch {
      toast.error('Failed to load transactions')
    } finally {
      setLoading(false)
    }
  }, [page, search, paymentMethod, paymentStatus, from, to])

  useEffect(() => { fetchTransactions() }, [fetchTransactions])

  const handleSearchChange = (val) => {
    setSearch(val)
    clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => {
      setPage(1)
      fetchTransactions({ search: val, page: 1 })
    }, 400)
  }

  const handleFilter = (field, val) => {
    setPage(1)
    if (field === 'paymentMethod') { setPaymentMethod(val); fetchTransactions({ paymentMethod: val, page: 1 }) }
    if (field === 'paymentStatus') { setPaymentStatus(val); fetchTransactions({ paymentStatus: val, page: 1 }) }
    if (field === 'from') { setFrom(val); fetchTransactions({ from: val, page: 1 }) }
    if (field === 'to') { setTo(val); fetchTransactions({ to: val, page: 1 }) }
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <ProtectedLayout roles={['admin', 'manager']}>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
            <p className="text-sm text-gray-500 mt-0.5">{total} total transactions</p>
          </div>
          <button onClick={() => fetchTransactions()} className="flex items-center gap-2 text-sm text-gray-600 border border-gray-300 px-3 py-2 rounded-lg hover:bg-gray-50">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Filter size={15} /> Filters
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search */}
            <div className="relative sm:col-span-2 lg:col-span-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={e => handleSearchChange(e.target.value)}
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Search receipt #..." />
            </div>
            {/* Payment method */}
            <select value={paymentMethod} onChange={e => handleFilter('paymentMethod', e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
              {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
            {/* Status */}
            <select value={paymentStatus} onChange={e => handleFilter('paymentStatus', e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
              {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            {/* Date range */}
            <div className="flex gap-2 sm:col-span-2 lg:col-span-1">
              <input type="date" value={from} onChange={e => handleFilter('from', e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-2 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none" />
              <input type="date" value={to} onChange={e => handleFilter('to', e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-2 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <Receipt size={40} className="mx-auto mb-3 opacity-30" />
              <p>No transactions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    <th className="px-4 py-3">Receipt #</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Cashier</th>
                    <th className="px-4 py-3">Payment</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {transactions.map(tx => (
                    <tr key={tx._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-mono font-medium text-blue-700">{tx.receipt_number}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                      <td className="px-4 py-3 text-gray-700">{tx.customer_id?.full_name || <span className="text-gray-400">Walk-in</span>}</td>
                      <td className="px-4 py-3 text-gray-600">{tx.cashier_id?.full_name || '—'}</td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1.5 capitalize">{paymentIcon(tx.payment_method)}{tx.payment_method === 'mobile_money' ? 'Mobile Money' : tx.payment_method}</span>
                      </td>
                      <td className="px-4 py-3 font-semibold">${(tx.total_amount || 0).toFixed(2)}</td>
                      <td className="px-4 py-3">{statusBadge(tx.payment_status)}</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => setSelectedSale(tx)}
                          className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50">
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between text-sm">
            <p className="text-gray-500">Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="p-2 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50">
                <ChevronLeft size={16} />
              </button>
              <span className="px-3 py-1 bg-blue-600 text-white rounded-lg font-medium">{page}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="p-2 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedSale && <TransactionDetailModal sale={selectedSale} onClose={() => setSelectedSale(null)} />}
    </ProtectedLayout>
  )
}
