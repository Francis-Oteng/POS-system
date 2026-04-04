'use client'
import { useState, useCallback, useEffect } from 'react'
import { X, CreditCard, Package } from 'lucide-react'
import TransactionFilters from './TransactionFilters'
import TransactionTable from './TransactionTable'
import PaymentMethodBadge from './PaymentMethodBadge'
import TransactionStatusBadge from './TransactionStatusBadge'
import { dummyTransactions, filterDummyTransactions } from '../../lib/dummyData'

const LIMIT = 15

function TransactionDetailModal({ tx, onClose }) {
  if (!tx) return null
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Transaction Details</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><X size={20} className="text-gray-500" /></button>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500 text-xs mb-1">Receipt Number</p>
              <p className="font-mono font-medium text-gray-800">{tx.receipt_number}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs mb-1">Date</p>
              <p className="font-medium text-gray-800">{new Date(tx.createdAt).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs mb-1">Customer</p>
              <p className="font-medium text-gray-800">{tx.customer_name || tx.customer_id?.full_name || 'Walk-in'}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs mb-1">Cashier</p>
              <p className="font-medium text-gray-800">{tx.cashier_name || tx.cashier_id?.full_name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs mb-1">Payment Method</p>
              <PaymentMethodBadge method={tx.payment_method} />
            </div>
            <div>
              <p className="text-gray-500 text-xs mb-1">Status</p>
              <TransactionStatusBadge status={tx.payment_status} />
            </div>
            {tx.payment_reference && (
              <div className="col-span-2">
                <p className="text-gray-500 text-xs mb-1">Payment Reference</p>
                <p className="font-mono text-xs text-gray-700 bg-gray-50 px-2 py-1 rounded">{tx.payment_reference}</p>
              </div>
            )}
          </div>

          {tx.items && tx.items.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
                <Package size={14} /> Items
              </h3>
              <div className="bg-gray-50 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-500 border-b border-gray-200">
                      <th className="px-3 py-2 text-left">Product</th>
                      <th className="px-3 py-2 text-center">Qty</th>
                      <th className="px-3 py-2 text-right">Price</th>
                      <th className="px-3 py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {tx.items.map((item, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2 text-gray-800">{item.product_name}</td>
                        <td className="px-3 py-2 text-center text-gray-600">{item.quantity}</td>
                        <td className="px-3 py-2 text-right text-gray-600">${item.unit_price?.toFixed(2)}</td>
                        <td className="px-3 py-2 text-right font-medium">${item.line_total?.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="space-y-2 text-sm border-t pt-4">
            <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>${(tx.subtotal || 0).toFixed(2)}</span></div>
            {tx.discount_amount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-${tx.discount_amount.toFixed(2)}</span></div>}
            {tx.tax_amount > 0 && <div className="flex justify-between text-gray-600"><span>Tax</span><span>${tx.tax_amount.toFixed(2)}</span></div>}
            <div className="flex justify-between font-bold text-base border-t pt-2"><span>Total</span><span>${(tx.total_amount || 0).toFixed(2)}</span></div>
            <div className="flex justify-between text-gray-500"><span>Amount Paid</span><span>${(tx.amount_paid || 0).toFixed(2)}</span></div>
            {tx.change_due > 0 && <div className="flex justify-between text-blue-600"><span>Change</span><span>${tx.change_due.toFixed(2)}</span></div>}
          </div>

          {tx.notes && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
              <p className="text-xs text-yellow-800"><span className="font-semibold">Notes:</span> {tx.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const DEFAULT_FILTERS = { payment_method: 'all', status: 'all', search: '', fromDate: '', toDate: '' }

export default function TransactionList({ useDummy = true }) {
  const [transactions, setTransactions] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [sort, setSort] = useState({ field: 'createdAt', dir: 'desc' })
  const [loading, setLoading] = useState(true)
  const [viewTx, setViewTx] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    if (useDummy) {
      const filtered = filterDummyTransactions(filters)
      const sorted = [...filtered].sort((a, b) => {
        const va = sort.field === 'total_amount' ? a.total_amount : new Date(a[sort.field])
        const vb = sort.field === 'total_amount' ? b.total_amount : new Date(b[sort.field])
        return sort.dir === 'asc' ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1)
      })
      setTotal(sorted.length)
      setTransactions(sorted.slice((page - 1) * LIMIT, page * LIMIT))
      setLoading(false)
    }
  }, [useDummy, filters, sort, page])

  useEffect(() => { load() }, [load])

  const handleFiltersChange = (newFilters) => { setFilters(newFilters); setPage(1) }
  const handleClearFilters = () => { setFilters(DEFAULT_FILTERS); setPage(1) }

  const pages = Math.ceil(total / LIMIT)

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <TransactionFilters filters={filters} onChange={handleFiltersChange} onClear={handleClearFilters} />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : (
          <>
            <TransactionTable
              transactions={transactions}
              sort={sort}
              onSort={setSort}
              onView={setViewTx}
            />
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm text-gray-500">
              <span>{total} transaction{total !== 1 ? 's' : ''}</span>
              <div className="flex items-center gap-2">
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                  className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors">Prev</button>
                <span className="px-2">Page {page} of {Math.max(1, pages)}</span>
                <button disabled={page >= pages} onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors">Next</button>
              </div>
            </div>
          </>
        )}
      </div>

      {viewTx && <TransactionDetailModal tx={viewTx} onClose={() => setViewTx(null)} />}
    </div>
  )
}
