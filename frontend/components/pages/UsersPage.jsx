'use client'
import { useEffect, useState, useCallback } from 'react'
import { Plus, Edit, Trash2, X, Loader2 } from 'lucide-react'
import api from '../../lib/axios'
import toast from 'react-hot-toast'
import ProtectedLayout from '../layout/ProtectedLayout'

function UserModal({ user, onClose, onSaved }) {
  const [form, setForm] = useState(user
    ? { full_name: user.full_name, email: user.email, role: user.role, is_active: user.is_active, password: '' }
    : { username: '', full_name: '', email: '', role: 'cashier', password: '' })
  const [loading, setLoading] = useState(false)
  const f = field => ({ value: form[field] !== undefined ? String(form[field]) : '', onChange: e => setForm(p => ({ ...p, [field]: e.target.value })) })
  const cls = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const data = { ...form }
      if (!data.password) delete data.password
      if (user) { await api.put(`/users/${user._id}`, data); toast.success('User updated') }
      else { await api.post('/users', data); toast.success('User created') }
      onSaved()
    } catch (err) { toast.error(err.response?.data?.message || 'Error') }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">{user ? 'Edit User' : 'New User'}</h2>
          <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          {!user && <div><label className="block text-xs font-medium text-gray-600 mb-1">Username *</label><input {...f('username')} required className={cls} /></div>}
          <div><label className="block text-xs font-medium text-gray-600 mb-1">Full Name *</label><input {...f('full_name')} required className={cls} /></div>
          <div><label className="block text-xs font-medium text-gray-600 mb-1">Email *</label><input {...f('email')} type="email" required className={cls} /></div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Role</label>
            <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} className={cls}>
              <option value="cashier">Cashier</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          {user && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
              <select value={String(form.is_active)} onChange={e => setForm(p => ({ ...p, is_active: e.target.value === 'true' }))} className={cls}>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          )}
          <div><label className="block text-xs font-medium text-gray-600 mb-1">{user ? 'New Password (leave blank to keep)' : 'Password *'}</label><input {...f('password')} type="password" required={!user} className={cls} /></div>
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

export default function UsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try { const res = await api.get('/users'); setUsers(res.data) }
    catch { toast.error('Failed to load users') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const handleDeactivate = async (id) => {
    if (!confirm('Deactivate this user?')) return
    try { await api.delete(`/users/${id}`); toast.success('User deactivated'); load() }
    catch { toast.error('Failed') }
  }

  const roleColor = r => ({ admin: 'bg-purple-100 text-purple-700', manager: 'bg-blue-100 text-blue-700', cashier: 'bg-green-100 text-green-700' }[r] || 'bg-gray-100 text-gray-700')

  return (
    <ProtectedLayout roles={['admin']}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <button onClick={() => setModal('new')} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
            <Plus size={16} /> Add User
          </button>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          {loading ? <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div> : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left text-xs text-gray-500 uppercase">
                  <th className="px-3 py-3">Name</th><th className="px-3 py-3">Username</th><th className="px-3 py-3">Email</th><th className="px-3 py-3">Role</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map(u => (
                  <tr key={u._id} className="hover:bg-gray-50">
                    <td className="px-3 py-3 font-medium text-gray-900">{u.full_name}</td>
                    <td className="px-3 py-3 text-gray-600">{u.username}</td>
                    <td className="px-3 py-3 text-gray-600">{u.email}</td>
                    <td className="px-3 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${roleColor(u.role)}`}>{u.role}</span></td>
                    <td className="px-3 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{u.is_active ? 'Active' : 'Inactive'}</span></td>
                    <td className="px-3 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => setModal(u)} className="text-blue-600 hover:text-blue-700"><Edit size={16} /></button>
                        <button onClick={() => handleDeactivate(u._id)} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      {modal && <UserModal user={modal === 'new' ? null : modal} onClose={() => setModal(null)} onSaved={() => { setModal(null); load() }} />}
    </ProtectedLayout>
  )
}
