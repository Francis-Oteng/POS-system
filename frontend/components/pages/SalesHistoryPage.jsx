'use client'
import { useEffect, useState, useCallback } from 'react'
import { Search, Eye, X } from 'lucide-react'
import api from '../../lib/axios'
import toast from 'react-hot-toast'
import ProtectedLayout from '../layout/ProtectedLayout'

function SaleDetailModal({ saleId, onClose }) {
  const [sale, setSale] = useState(null)

  useEffect(() => {
    api.get(`/sales/${saleId}`).then(r => setSale(r.data)).catch(() => toast.error('Failed to load sale'))
  }, [saleId])

  if (!sale) return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white" />
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Sale #{sale.receipt_number}</h2>
          <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm mb-4">
          <div><span className="text-gray-500">Cashier:</span> <span className="font-medium">{sale.cashier_id?.full_name}</span></div>
          <div><span className="text-gray-500">Customer:</span> <span className="font-medium">{sale.customer_id?.full_name || 'Walk-in'}</span></div>
          <div><span className="text-gray-500">Payment:</span> <span className="font-medium capitalize">{sale.payment_method}</span></div>
          <div><span className="text-gray-500">Status:</span> <span className={`font-medium capitalize ${sale.payment_status === 'void' ? 'text-red-600' : 'text-green-600'}`}>{sale.payment_status}</span></div>
          <div><span className="text-gray-500">Date:</span> <span className="font-medium">{new Date(sale.createdAt).toLocaleString()}</span></div>
        </div>
        <table className="w-full text-sm mb-4">
          <thead className="bg-gray-50">
            <tr className="text-left text-xs text-gray-500">
              <th className="px-2 py-2">Item</th><th className="px-2 py-2">Qty</th><th className="px-2 py-2">Price</th><th className="px-2 py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {sale.items?.map((item, i) => (
              <tr key={i}>
                <td className="px-2 py-2">{item.product_name}</td>
                <td className="px-2 py-2">{item.quantity}</td>
                <td className="px-2 py-2">${item.unit_price?.toFixed(2)}</td>
                <td className="px-2 py-2 text-right">${item.line_total?.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="space-y-1 text-sm border-t pt-3">
          <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>${sale.subtotal?.toFixed(2)}</span></div>
          {sale.discount_amount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-${sale.discount_amount?.toFixed(2)}</span></div>}
          {sale.tax_amount > 0 && <div className="flex justify-between"><span className="text-gray-500">Tax</span><span>${sale.tax_amount?.toFixed(2)}</span></div>}
          <div className="flex justify-between font-bold border-t pt-2"><span>Total</span><span>${sale.total_amount?.toFixed(2)}</span></div>
          <div className="flex justify-between text-gray-500"><span>Paid</span><span>${sale.amount_paid?.toFixed(2)}</span></div>
          {sale.change_due > 0 && <div className="flex justify-between text-blue-600"><span>Change</span><span>${sale.change_due?.toFixed(2)}</span></div>}
        </div>
      </div>
    </div>
  )
}

export default function SalesHistoryPage() {
  const [sales, setSales] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [loading, setLoading] = useState(true)
  const [viewId, setViewId] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      let url = `/sales?page=${page}&limit=15`
      if (search) url += `&search=${search}`
      if (from) url += `&from=${from}`
      if (to) url += `&to=${to}`
      const res = await api.get(url)
      setSales(res.data.data)
      setTotal(res.data.total)
    } catch { toast.error('Failed to load sales') }
    finally { setLoading(false) }
  }, [page, search, from, to])

  useEffect(() => { load() }, [load])

  return (
    <ProtectedLayout roles={['admin', 'manager']}>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Sales History</h1>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
                className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm w-48 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Receipt #..." />
            </div>
            <input type="date" value={from} onChange={e => { setFrom(e.target.value); setPage(1) }}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            <input type="date" value={to} onChange={e => { setTo(e.target.value); setPage(1) }}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            {(from || to || search) && (
              <button onClick={() => { setSearch(''); setFrom(''); setTo(''); setPage(1) }} className="text-sm text-gray-500 hover:text-gray-700 px-2">Clear</button>
            )}
          </div>
          {loading ? <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div> : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left text-xs text-gray-500 uppercase">
                  <th className="px-3 py-3">Receipt</th><th className="px-3 py-3">Date</th><th className="px-3 py-3">Cashier</th><th className="px-3 py-3">Customer</th><th className="px-3 py-3">Payment</th><th className="px-3 py-3">Total</th><th className="px-3 py-3">Status</th><th className="px-3 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sales.map(s => (
                  <tr key={s._id} className="hover:bg-gray-50">
                    <td className="px-3 py-3 font-mono text-xs">{s.receipt_number}</td>
                    <td className="px-3 py-3 text-gray-600">{new Date(s.createdAt).toLocaleDateString()}</td>
                    <td className="px-3 py-3">{s.cashier_id?.full_name || 'N/A'}</td>
                    <td className="px-3 py-3 text-gray-600">{s.customer_id?.full_name || 'Walk-in'}</td>
                    <td className="px-3 py-3 capitalize text-gray-600">{s.payment_method}</td>
                    <td className="px-3 py-3 font-semibold">${(s.total_amount || 0).toFixed(2)}</td>
                    <td className="px-3 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${s.payment_status === 'completed' ? 'bg-green-100 text-green-700' : s.payment_status === 'void' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                        {s.payment_status}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <button onClick={() => setViewId(s._id)} className="text-blue-600 hover:text-blue-700"><Eye size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
            <span>{total} sales</span>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 border rounded disabled:opacity-40 hover:bg-gray-50">Prev</button>
              <span className="px-3 py-1">Page {page}</span>
              <button disabled={page * 15 >= total} onClick={() => setPage(p => p + 1)} className="px-3 py-1 border rounded disabled:opacity-40 hover:bg-gray-50">Next</button>
            </div>
          </div>
        </div>
      </div>
      {viewId && <SaleDetailModal saleId={viewId} onClose={() => setViewId(null)} />}
    </ProtectedLayout>
  )
}
