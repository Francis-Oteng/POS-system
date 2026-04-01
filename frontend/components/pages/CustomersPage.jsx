'use client'
import { useEffect, useState, useCallback } from 'react'
import { Plus, Search, X, Loader2, Edit } from 'lucide-react'
import api from '../../lib/axios'
import toast from 'react-hot-toast'
import ProtectedLayout from '../layout/ProtectedLayout'

function CustomerModal({ customer, onClose, onSaved }) {
  const [form, setForm] = useState(customer
    ? { full_name: customer.full_name, phone: customer.phone || '', email: customer.email || '', address: customer.address || '' }
    : { full_name: '', phone: '', email: '', address: '' })
  const [loading, setLoading] = useState(false)
  const f = field => ({ value: form[field], onChange: e => setForm(p => ({ ...p, [field]: e.target.value })) })
  const cls = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (customer) { await api.put(`/customers/${customer._id}`, form); toast.success('Customer updated') }
      else { await api.post('/customers', form); toast.success('Customer created') }
      onSaved()
    } catch (err) { toast.error(err.response?.data?.message || 'Error') }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">{customer ? 'Edit Customer' : 'New Customer'}</h2>
          <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div><label className="block text-xs font-medium text-gray-600 mb-1">Full Name *</label><input {...f('full_name')} required className={cls} /></div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1">Phone</label><input {...f('phone')} className={cls} /></div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1">Email</label><input {...f('email')} type="email" className={cls} /></div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1">Address</label><textarea {...f('address')} rows={2} className={cls} /></div>
          <div className="flex gap-3 pt-2">
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

export default function CustomersPage() {
  const [customers, setCustomers] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get(`/customers?page=${page}&limit=15&search=${search}`)
      setCustomers(res.data.data)
      setTotal(res.data.total)
    } catch { toast.error('Failed to load customers') }
    finally { setLoading(false) }
  }, [page, search])

  useEffect(() => { load() }, [load])

  return (
    <ProtectedLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <button onClick={() => setModal('new')} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
            <Plus size={16} /> Add Customer
          </button>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="relative mb-4">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
              className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm w-72 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Search by name, phone, email..." />
          </div>
          {loading ? <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div> : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left text-xs text-gray-500 uppercase">
                  <th className="px-3 py-3">Name</th><th className="px-3 py-3">Phone</th><th className="px-3 py-3">Email</th><th className="px-3 py-3">Points</th><th className="px-3 py-3">Total Spent</th><th className="px-3 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {customers.map(c => (
                  <tr key={c._id} className="hover:bg-gray-50">
                    <td className="px-3 py-3 font-medium text-gray-900">{c.full_name}</td>
                    <td className="px-3 py-3 text-gray-600">{c.phone || '—'}</td>
                    <td className="px-3 py-3 text-gray-600">{c.email || '—'}</td>
                    <td className="px-3 py-3"><span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full text-xs font-medium">{c.loyalty_points} pts</span></td>
                    <td className="px-3 py-3 font-semibold">${(c.total_spent || 0).toFixed(2)}</td>
                    <td className="px-3 py-3"><button onClick={() => setModal(c)} className="text-blue-600 hover:text-blue-700"><Edit size={16} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
            <span>{total} customers</span>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 border rounded disabled:opacity-40 hover:bg-gray-50">Prev</button>
              <span className="px-3 py-1">Page {page}</span>
              <button disabled={page * 15 >= total} onClick={() => setPage(p => p + 1)} className="px-3 py-1 border rounded disabled:opacity-40 hover:bg-gray-50">Next</button>
            </div>
          </div>
        </div>
      </div>
      {modal && <CustomerModal customer={modal === 'new' ? null : modal} onClose={() => setModal(null)} onSaved={() => { setModal(null); load() }} />}
    </ProtectedLayout>
  )
}
