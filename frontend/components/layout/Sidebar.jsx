'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ShoppingCart, Package, Warehouse, Users, ClipboardList, BarChart3, UserCog, Receipt } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['admin','manager','cashier'] },
  { to: '/pos', icon: ShoppingCart, label: 'Point of Sale', roles: ['admin','manager','cashier'] },
  { to: '/transactions', icon: Receipt, label: 'Transactions', roles: ['admin','manager'] },
  { to: '/products', icon: Package, label: 'Products', roles: ['admin','manager'] },
  { to: '/inventory', icon: Warehouse, label: 'Inventory', roles: ['admin','manager'] },
  { to: '/customers', icon: Users, label: 'Customers', roles: ['admin','manager','cashier'] },
  { to: '/sales', icon: ClipboardList, label: 'Sales History', roles: ['admin','manager'] },
  { to: '/reports', icon: BarChart3, label: 'Reports', roles: ['admin','manager'] },
  { to: '/users', icon: UserCog, label: 'Users', roles: ['admin'] },
]

export default function Sidebar() {
  const { user } = useAuth()
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col flex-shrink-0">
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-xl font-bold text-blue-400">POS System</h1>
        <p className="text-xs text-gray-400 mt-1">{user?.full_name}</p>
      </div>
      <nav className="flex-1 py-4 px-2 space-y-1">
        {navItems.filter(n => n.roles.includes(user?.role)).map(({ to, icon: Icon, label }) => {
          const isActive = pathname === to
          return (
            <Link key={to} href={to} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}>
              <Icon size={18} />
              {label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
