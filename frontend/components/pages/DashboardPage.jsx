'use client'
import { useEffect, useState } from 'react'
import { DollarSign, ShoppingBag, TrendingUp, Package, AlertTriangle } from 'lucide-react'
import api from '../../lib/axios'
import ProtectedLayout from '../layout/ProtectedLayout'

function StatCard({ title, value, icon: Icon, color }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${color}`}><Icon size={24} className="text-white" /></div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [summary, setSummary] = useState(null)
  const [lowStock, setLowStock] = useState([])
  const [recentSales, setRecentSales] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/reports/summary?period=today'),
      api.get('/inventory/low-stock'),
      api.get('/sales?page=1&limit=5')
    ]).then(([s, ls, sales]) => {
      setSummary(s.data)
      setLowStock(ls.data)
      setRecentSales(sales.data.data || [])
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  return (
    <ProtectedLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="Today's Revenue" value={`$${(summary?.total_revenue || 0).toFixed(2)}`} icon={DollarSign} color="bg-blue-500" />
              <StatCard title="Sales Today" value={summary?.total_sales || 0} icon={ShoppingBag} color="bg-green-500" />
              <StatCard title="Avg Transaction" value={`$${(summary?.avg_transaction_value || 0).toFixed(2)}`} icon={TrendingUp} color="bg-yellow-500" />
              <StatCard title="Items Sold" value={summary?.total_items_sold || 0} icon={Package} color="bg-purple-500" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {lowStock.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-4">
                    <AlertTriangle size={18} className="text-yellow-500" /> Low Stock Alerts ({lowStock.length})
                  </h2>
                  <div className="space-y-2">
                    {lowStock.slice(0, 6).map(item => (
                      <div key={item._id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                        <span className="text-sm font-medium text-gray-700">{item.name}</span>
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{item.stock_qty} {item.unit} left</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-4">Recent Sales</h2>
                {recentSales.length === 0 ? (
                  <p className="text-sm text-gray-400">No sales yet today.</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-400 text-xs border-b">
                        <th className="pb-2">Receipt</th>
                        <th className="pb-2">Cashier</th>
                        <th className="pb-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentSales.map(s => (
                        <tr key={s._id} className="border-b border-gray-50 last:border-0">
                          <td className="py-2 font-mono text-xs">{s.receipt_number}</td>
                          <td className="py-2 text-gray-600">{s.cashier_id?.full_name || 'N/A'}</td>
                          <td className="py-2 text-right font-semibold">${(s.total_amount || 0).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </ProtectedLayout>
  )
}
