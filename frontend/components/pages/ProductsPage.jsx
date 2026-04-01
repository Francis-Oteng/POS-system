'use client'
import { useEffect, useState, useCallback } from 'react'
import { Plus, Search, Edit, Trash2, X, Loader2 } from 'lucide-react'
import api from '../../lib/axios'
import toast from 'react-hot-toast'
import ProtectedLayout from '../layout/ProtectedLayout'

const EMPTY = { name: '', description: '', barcode: '', sku: '', category: 'General', price: '', cost_price: '', tax_rate: '0', stock_qty: '', low_stock_threshold: '10', unit: 'pcs' }

function ProductModal({ product, onClose, onSaved }) {
  const [form, setForm] = useState(product ? {
    ...product,
    price: product.price?.toString(),
    cost_price: product.cost_price?.toString(),
    tax_rate: product.tax_rate?.toString(),
    stock_qty: product.stock_qty?.toString(),
    low_stock_threshold: product.low_stock_threshold?.toString()
  } : EMPTY)
  const [loading, setLoading] = useState(false)
  const f = field => ({ value: form[field] || '', onChange: e => setForm(p => ({ ...p, [field]: e.target.value })) })
  const cls = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (product) {
        await api.put(`/products/${product._id}`, form)
        toast.success('Product updated')
      } else {
        await api.post('/products', form)
        toast.success('Product created')
      }
      onSaved()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving product')
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">{product ? 'Edit Product' : 'New Product'}</h2>
          <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><label className="block text-xs font-medium text-gray-600 mb-1">Product Name *</label><input {...f('name')} required className={cls} placeholder="Product name" /></div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1">Barcode</label><input {...f('barcode')} className={cls} placeholder="Optional" /></div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1">SKU</label><input {...f('sku')} className={cls} placeholder="Optional" /></div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1">Category</label><input {...f('category')} className={cls} /></div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1">Unit</label><input {...f('unit')} className={cls} placeholder="pcs, kg, L..." /></div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1">Selling Price *</label><input {...f('price')} type="number" step="0.01" min="0" required className={cls} /></div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1">Cost Price</label><input {...f('cost_price')} type="number" step="0.01" min="0" className={cls} /></div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1">Tax Rate (%)</label><input {...f('tax_rate')} type="number" step="0.01" min="0" className={cls} /></div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1">Low Stock Alert</label><input {...f('low_stock_threshold')} type="number" min="0" className={cls} /></div>
          {!product && <div><label className="block text-xs font-medium text-gray-600 mb-1">Initial Stock</label><input {...f('stock_qty')} type="number" min="0" className={cls} /></div>}
          <div className="col-span-2"><label className="block text-xs font-medium text-gray-600 mb-1">Description</label><textarea {...f('description')} rows={2} className={cls} /></div>
          <div className="col-span-2 flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
              {loading && <Loader2 size={14} className="animate-spin" />} Save
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get(`/products?page=${page}&limit=15&search=${search}`)
      setProducts(res.data.data)
      setTotal(res.data.total)
    } catch { toast.error('Failed to load products') }
    finally { setLoading(false) }
  }, [page, search])

  useEffect(() => { load() }, [load])

  const handleDeactivate = async (id) => {
    if (!confirm('Deactivate this product?')) return
    try { await api.delete(`/products/${id}`); toast.success('Product deactivated'); load() }
    catch { toast.error('Failed') }
  }

  return (
    <ProtectedLayout roles={['admin', 'manager']}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <button onClick={() => setModal('new')} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
            <Plus size={16} /> Add Product
          </button>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="relative mb-4">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
              className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm w-72 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Search products..." />
          </div>
          {loading ? <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div> : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left text-xs text-gray-500 uppercase">
                  <th className="px-3 py-3">Name</th><th className="px-3 py-3">Category</th><th className="px-3 py-3">Price</th><th className="px-3 py-3">Stock</th><th className="px-3 py-3">Barcode</th><th className="px-3 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {products.map(p => (
                  <tr key={p._id} className="hover:bg-gray-50">
                    <td className="px-3 py-3"><p className="font-medium text-gray-900">{p.name}</p><p className="text-xs text-gray-400">{p.sku || '—'}</p></td>
                    <td className="px-3 py-3 text-gray-600">{p.category}</td>
                    <td className="px-3 py-3 font-semibold">${p.price.toFixed(2)}</td>
                    <td className="px-3 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.stock_qty <= p.low_stock_threshold ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {p.stock_qty} {p.unit}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-gray-400 font-mono text-xs">{p.barcode || '—'}</td>
                    <td className="px-3 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => setModal(p)} className="text-blue-600 hover:text-blue-700"><Edit size={16} /></button>
                        <button onClick={() => handleDeactivate(p._id)} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
            <span>{total} products total</span>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 border rounded disabled:opacity-40 hover:bg-gray-50">Prev</button>
              <span className="px-3 py-1">Page {page}</span>
              <button disabled={page * 15 >= total} onClick={() => setPage(p => p + 1)} className="px-3 py-1 border rounded disabled:opacity-40 hover:bg-gray-50">Next</button>
            </div>
          </div>
        </div>
      </div>
      {modal && <ProductModal product={modal === 'new' ? null : modal} onClose={() => setModal(null)} onSaved={() => { setModal(null); load() }} />}
    </ProtectedLayout>
  )
}
