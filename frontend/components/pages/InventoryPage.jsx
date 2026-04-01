'use client'
import { useEffect, useState, useCallback } from 'react'
import { Plus, Search, AlertTriangle, Loader2, X } from 'lucide-react'
import api from '../../lib/axios'
import toast from 'react-hot-toast'
import ProtectedLayout from '../layout/ProtectedLayout'

function AdjustModal({ onClose, onSaved }) {
  const [productSearch, setProductSearch] = useState('')
  const [productResults, setProductResults] = useState([])
  const [selected, setSelected] = useState(null)
  const [qtyChange, setQtyChange] = useState('')
  const [changeType, setChangeType] = useState('restock')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const searchProducts = async (val) => {
    setProductSearch(val)
    if (!val.trim()) { setProductResults([]); return }
    try {
      const res = await api.get(`/products?search=${val}&limit=8`)
      setProductResults(res.data.data)
    } catch {}
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selected || !qtyChange) return
    setLoading(true)
    try {
      await api.post('/inventory/adjust', {
        adjustments: [{ product_id: selected._id, qty_change: parseInt(qtyChange), notes }],
        change_type: changeType
      })
      toast.success('Stock adjusted')
      onSaved()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Adjustment failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Stock Adjustment</h2>
          <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Product</label>
            {selected ? (
              <div className="flex items-center justify-between p-2 border border-green-300 rounded-lg bg-green-50">
                <span className="text-sm font-medium text-green-700">{selected.name} (Stock: {selected.stock_qty})</span>
                <button type="button" onClick={() => { setSelected(null); setProductSearch('') }}><X size={14} className="text-green-500" /></button>
              </div>
            ) : (
              <div className="relative">
                <input value={productSearch} onChange={e => searchProducts(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Search product..." />
                {productResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                    {productResults.map(p => (
                      <button key={p._id} type="button" onClick={() => { setSelected(p); setProductSearch(p.name); setProductResults([]) }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b border-gray-50 last:border-0">
                        {p.name} <span className="text-gray-400">({p.stock_qty} {p.unit})</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
            <select value={changeType} onChange={e => setChangeType(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option value="restock">Restock</option>
              <option value="adjustment">Adjustment</option>
              <option value="return">Return</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Quantity Change (use negative to reduce)</label>
            <input type="number" value={qtyChange} onChange={e => setQtyChange(e.target.value)} required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="+50 to add, -10 to reduce" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
            <input value={notes} onChange={e => setNotes(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Optional" />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={loading || !selected} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
              {loading && <Loader2 size={14} className="animate-spin" />} Apply
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function InventoryPage() {
  const [inventory, setInventory] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [lowOnly, setLowOnly] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showAdjust, setShowAdjust] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get(`/inventory?page=${page}&limit=15&search=${search}${lowOnly ? '&low_stock=true' : ''}`)
      setInventory(res.data.data)
      setTotal(res.data.total)
    } catch { toast.error('Failed to load inventory') }
    finally { setLoading(false) }
  }, [page, search, lowOnly])

  useEffect(() => { load() }, [load])

  return (
    <ProtectedLayout roles={['admin', 'manager']}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          <button onClick={() => setShowAdjust(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
            <Plus size={16} /> Adjust Stock
          </button>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex gap-3 mb-4">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
                className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm w-60 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Search products..." />
            </div>
            <button onClick={() => { setLowOnly(l => !l); setPage(1) }}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-colors ${lowOnly ? 'bg-red-50 border-red-300 text-red-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
              <AlertTriangle size={14} /> Low Stock Only
            </button>
          </div>
          {loading ? <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div> : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left text-xs text-gray-500 uppercase">
                  <th className="px-3 py-3">Product</th><th className="px-3 py-3">Category</th><th className="px-3 py-3">Stock</th><th className="px-3 py-3">Threshold</th><th className="px-3 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {inventory.map(item => (
                  <tr key={item._id} className="hover:bg-gray-50">
                    <td className="px-3 py-3"><p className="font-medium text-gray-900">{item.name}</p><p className="text-xs text-gray-400">{item.barcode || '—'}</p></td>
                    <td className="px-3 py-3 text-gray-600">{item.category}</td>
                    <td className="px-3 py-3 font-semibold">{item.stock_qty} {item.unit}</td>
                    <td className="px-3 py-3 text-gray-500">{item.low_stock_threshold}</td>
                    <td className="px-3 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${item.stock_qty <= item.low_stock_threshold ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {item.stock_qty <= item.low_stock_threshold ? 'Low Stock' : 'In Stock'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
            <span>{total} items</span>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 border rounded disabled:opacity-40 hover:bg-gray-50">Prev</button>
              <span className="px-3 py-1">Page {page}</span>
              <button disabled={page * 15 >= total} onClick={() => setPage(p => p + 1)} className="px-3 py-1 border rounded disabled:opacity-40 hover:bg-gray-50">Next</button>
            </div>
          </div>
        </div>
      </div>
      {showAdjust && <AdjustModal onClose={() => setShowAdjust(false)} onSaved={() => { setShowAdjust(false); load() }} />}
    </ProtectedLayout>
  )
}
