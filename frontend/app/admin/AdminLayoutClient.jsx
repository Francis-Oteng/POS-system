'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ClipboardList, PlusCircle, BarChart3, Settings, LogOut } from 'lucide-react'

const navItems = [
  { href: '/admin',                icon: LayoutDashboard, label: 'Dashboard'          },
  { href: '/admin/transactions',   icon: ClipboardList,   label: 'Transactions'       },
  { href: '/admin/new-transaction',icon: PlusCircle,      label: 'New Transaction'    },
  { href: '/reports',              icon: BarChart3,       label: 'Reports'            },
  { href: '/admin/settings',       icon: Settings,        label: 'Settings'           },
]

export default function AdminLayoutClient({ children }) {
  const pathname = usePathname()

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col flex-shrink-0">
        <div className="p-5 border-b border-gray-700">
          <h1 className="text-xl font-bold text-emerald-400">POS Admin</h1>
          <p className="text-xs text-gray-400 mt-0.5">Admin Dashboard</p>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1">
          {navItems.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href || (href !== '/admin' && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${isActive ? 'bg-emerald-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}
              >
                <Icon size={18} />
                {label}
              </Link>
            )
          })}
        </nav>
        <div className="p-3 border-t border-gray-700">
          <Link
            href="/login"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <LogOut size={18} />
            Logout
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between flex-shrink-0">
          <div>
            <p className="text-sm text-gray-500">Welcome back,</p>
            <p className="text-base font-semibold text-gray-900">System Administrator</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full font-medium">Admin</span>
            <span className="text-sm text-gray-500">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
