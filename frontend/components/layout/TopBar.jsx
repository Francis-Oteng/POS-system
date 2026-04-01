'use client'
import { LogOut, User } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function TopBar() {
  const { user, logout } = useAuth()

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-end">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <User size={16} />
          <span className="font-medium">{user?.full_name}</span>
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full capitalize">{user?.role}</span>
        </div>
        <button onClick={logout} className="flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-50">
          <LogOut size={16} /> Logout
        </button>
      </div>
    </header>
  )
}
