'use client'
import { useState, useMemo } from 'react'
import { Search, X, Eye, CheckCircle, ChevronUp, ChevronDown } from 'lucide-react'
import { DUMMY_TRANSACTIONS } from '../../../lib/dummyData'
import { formatCurrency, formatDate } from '../../../lib/formatting'
import TransactionStatusBadge from '../../../components/TransactionStatusBadge'
import PaymentMethodBadge from '../../../components/PaymentMethodBadge'
import FinalizeTransactionModal from '../../../components/FinalizeTransactionModal'

const PAGE_SIZE = 15

function TransactionDetailModal({ transaction, onClose, onFinalize }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Transaction Details</h2>
            <p className="text-xs text-gray-500 font-mono">{transaction.id} · {transaction.receiptNumber}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-5">
          {/* Customer info */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><p className="text-xs text-gray-400 mb-0.5">Customer</p><p className="font-semibold">{transaction.customer?.name}</p></div>
            <div><p className="text-xs text-gray-400 mb-0.5">Date</p><p className="font-semibold">{transaction.timestamp}</p></div>
            <div><p className="text-xs text-gray-400 mb-0.5">Email</p><p className="font-medium">{transaction.customer?.email || '—'}</p></div>
            <div><p className="text-xs text-gray-400 mb-0.5">Phone</p><p className="font-medium">{transaction.customer?.phone || '—'}</p></div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Payment Method</p>
              <PaymentMethodBadge method={transaction.paymentMethod} />
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Status</p>
              <TransactionStatusBadge status={transaction.status} />
            </div>
            {transaction.paystackRef && (
              <div className="col-span-2">
                <p className="text-xs text-gray-400 mb-0.5">Paystack Reference</p>
                <p className="font-mono text-xs font-medium text-emerald-700">{transaction.paystackRef}</p>
              </div>
            )}
          </div>

          {/* Items table */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Items</p>
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left text-xs text-gray-400">
                  <th className="px-3 py-2">Product</th>
                  <th className="px-3 py-2 text-center">Qty</th>
                  <th className="px-3 py-2 text-right">Price</th>
                  <th className="px-3 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {transaction.items?.map((item, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2">{item.product}</td>
                    <td className="px-3 py-2 text-center">{item.quantity}</td>
                    <td className="px-3 py-2 text-right">{formatCurrency(item.unitPrice)}</td>
                    <td className="px-3 py-2 text-right font-medium">{formatCurrency(item.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="space-y-1.5 text-sm border-t pt-3">
            <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>{formatCurrency(transaction.subtotal)}</span></div>
            {transaction.discount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>−{formatCurrency(transaction.discount)}</span></div>}
            {transaction.tax > 0 && <div className="flex justify-between text-gray-500"><span>Tax</span><span>{formatCurrency(transaction.tax)}</span></div>}
            <div className="flex justify-between font-bold text-base border-t pt-2 mt-1">
              <span>Total</span><span className="text-emerald-600">{formatCurrency(transaction.total)}</span>
            </div>
          </div>

          {transaction.notes && (
            <div className="bg-gray-50 rounded-lg px-4 py-3 text-sm text-gray-600">
              <span className="font-medium">Notes: </span>{transaction.notes}
            </div>
          )}

          {/* Actions */}
          {transaction.status === 'pending' && (
            <button
              onClick={() => onFinalize(transaction)}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
            >
              <CheckCircle size={16} /> Finalize Transaction
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState(DUMMY_TRANSACTIONS)
  const [search, setSearch] = useState('')
  const [methodFilter, setMethodFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sortField, setSortField] = useState('timestamp')
  const [sortDir, setSortDir] = useState('desc')
  const [page, setPage] = useState(1)
  const [viewTxn, setViewTxn] = useState(null)
  const [finalizeTxn, setFinalizeTxn] = useState(null)

  const filtered = useMemo(() => {
    let list = [...transactions]
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(t =>
        t.id.toLowerCase().includes(q) ||
        t.customer?.name.toLowerCase().includes(q) ||
        t.receiptNumber.toLowerCase().includes(q)
      )
    }
    if (methodFilter) list = list.filter(t => t.paymentMethod === methodFilter)
    if (statusFilter)  list = list.filter(t => t.status === statusFilter)
    list.sort((a, b) => {
      let av = a[sortField], bv = b[sortField]
      if (sortField === 'total') { av = a.total; bv = b.total }
      if (sortField === 'timestamp') { av = new Date(a.timestamp); bv = new Date(b.timestamp) }
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return list
  }, [transactions, search, methodFilter, statusFilter, sortField, sortDir])

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('desc') }
    setPage(1)
  }

  const handleFinalized = (updated) => {
    setTransactions(prev => prev.map(t => t.id === updated.id ? updated : t))
  }

  const clearFilters = () => { setSearch(''); setMethodFilter(''); setStatusFilter(''); setPage(1) }

  const SortIcon = ({ field }) => (
    <span className="ml-1 inline-flex flex-col">
      <ChevronUp size={10} className={sortField === field && sortDir === 'asc' ? 'text-emerald-500' : 'text-gray-300'} />
      <ChevronDown size={10} className={sortField === field && sortDir === 'desc' ? 'text-emerald-500' : 'text-gray-300'} />
    </span>
  )

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
          <p className="text-sm text-gray-500 mt-0.5">{filtered.length} of {transactions.length} transactions</p>
        </div>
        <div className="flex gap-2 text-sm">
          <span className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg font-medium">
            {transactions.filter(t => t.status === 'pending').length} pending
          </span>
          <span className="bg-green-50 text-green-700 px-3 py-1.5 rounded-lg font-medium">
            {transactions.filter(t => t.status === 'completed').length} completed
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search ID, customer…"
              className="pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm w-52 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
          <select
            value={methodFilter}
            onChange={e => { setMethodFilter(e.target.value); setPage(1) }}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
          >
            <option value="">All Methods</option>
            <option value="paystack">Paystack</option>
            <option value="cash">Cash</option>
            <option value="card">Card</option>
          </select>
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="refunded">Refunded</option>
          </select>
          {(search || methodFilter || statusFilter) && (
            <button onClick={clearFilters} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 px-2 py-2">
              <X size={14} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wide">
                <th className="px-5 py-3">ID</th>
                <th className="px-4 py-3 cursor-pointer select-none" onClick={() => handleSort('timestamp')}>
                  Date <SortIcon field="timestamp" />
                </th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3 cursor-pointer select-none" onClick={() => handleSort('total')}>
                  Amount <SortIcon field="total" />
                </th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-gray-400">No transactions match your filters.</td>
                </tr>
              ) : paginated.map(txn => (
                <tr key={txn.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 font-mono text-xs font-semibold text-gray-700">{txn.id}</td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(txn.date)}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{txn.customer?.name}</td>
                  <td className="px-4 py-3 font-semibold">{formatCurrency(txn.total)}</td>
                  <td className="px-4 py-3 text-gray-500">{txn.items?.length} item(s)</td>
                  <td className="px-4 py-3"><PaymentMethodBadge method={txn.paymentMethod} /></td>
                  <td className="px-4 py-3"><TransactionStatusBadge status={txn.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setViewTxn(txn)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View details"
                      >
                        <Eye size={15} />
                      </button>
                      {txn.status === 'pending' && (
                        <button
                          onClick={() => setFinalizeTxn(txn)}
                          className="flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition-colors"
                        >
                          <CheckCircle size={13} /> Finalize
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 text-sm text-gray-500">
          <span>{filtered.length} results · Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              ← Prev
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = Math.max(1, Math.min(totalPages - 4, page - 2)) + i
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-3 py-1.5 border rounded-lg transition-colors ${page === p ? 'bg-emerald-600 text-white border-emerald-600' : 'border-gray-200 hover:bg-gray-50'}`}
                >
                  {p}
                </button>
              )
            })}
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {viewTxn && (
        <TransactionDetailModal
          transaction={viewTxn}
          onClose={() => setViewTxn(null)}
          onFinalize={(t) => { setViewTxn(null); setFinalizeTxn(t) }}
        />
      )}
      {finalizeTxn && (
        <FinalizeTransactionModal
          transaction={finalizeTxn}
          onClose={() => setFinalizeTxn(null)}
          onFinalized={(updated) => { handleFinalized(updated); setFinalizeTxn(null) }}
        />
      )}
    </div>
  )
}
