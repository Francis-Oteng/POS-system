'use client'
import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import api from '../../lib/axios'
import toast from 'react-hot-toast'
import ProtectedLayout from '../layout/ProtectedLayout'

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

export default function ReportsPage() {
  const [period, setPeriod] = useState('week')
  const [salesByDay, setSalesByDay] = useState([])
  const [topProducts, setTopProducts] = useState([])
  const [byCategory, setByCategory] = useState([])
  const [cashiers, setCashiers] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    const today = new Date().toISOString().slice(0, 10)
    const from = period === 'week'
      ? new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10)
      : period === 'month'
        ? new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10)
        : today

    Promise.all([
      api.get(`/reports/summary?period=${period}`),
      api.get(`/reports/sales-by-day?from=${from}&to=${today}`),
      api.get(`/reports/top-products?from=${from}&to=${today}&limit=8`),
      api.get(`/reports/sales-by-category?from=${from}&to=${today}`),
      api.get(`/reports/cashier-performance?from=${from}&to=${today}`)
    ]).then(([s, days, prods, cats, cash]) => {
      setSummary(s.data)
      setSalesByDay(days.data)
      setTopProducts(prods.data)
      setByCategory(cats.data)
      setCashiers(cash.data)
    }).catch(() => toast.error('Failed to load reports'))
    .finally(() => setLoading(false))
  }, [period])

  return (
    <ProtectedLayout roles={['admin', 'manager']}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <div className="flex gap-2">
            {['today', 'week', 'month'].map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${period === p ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
                {p === 'today' ? 'Today' : p === 'week' ? 'Last 7 Days' : 'Last 30 Days'}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>
        ) : (
          <>
            {summary && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Total Revenue', value: `$${(summary.total_revenue || 0).toFixed(2)}`, color: 'text-blue-600' },
                  { label: 'Total Sales', value: summary.total_sales || 0, color: 'text-green-600' },
                  { label: 'Avg Transaction', value: `$${(summary.avg_transaction_value || 0).toFixed(2)}`, color: 'text-yellow-600' },
                  { label: 'Items Sold', value: summary.total_items_sold || 0, color: 'text-purple-600' },
                ].map(s => (
                  <div key={s.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <p className="text-sm text-gray-500">{s.label}</p>
                    <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <h2 className="text-base font-semibold text-gray-900 mb-4">Revenue by Day</h2>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={salesByDay}>
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={v => [`$${Number(v).toFixed(2)}`, 'Revenue']} />
                    <Bar dataKey="revenue" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <h2 className="text-base font-semibold text-gray-900 mb-4">Sales by Category</h2>
                {byCategory.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={byCategory} dataKey="revenue" nameKey="category" cx="50%" cy="50%" outerRadius={80}
                        label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}>
                        {byCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={v => [`$${Number(v).toFixed(2)}`, 'Revenue']} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <p className="text-center text-sm text-gray-400 py-16">No data for this period</p>}
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <h2 className="text-base font-semibold text-gray-900 mb-4">Top Products</h2>
                <table className="w-full text-sm">
                  <thead><tr className="text-left text-xs text-gray-400 uppercase border-b"><th className="pb-2">Product</th><th className="pb-2">Qty Sold</th><th className="pb-2 text-right">Revenue</th></tr></thead>
                  <tbody className="divide-y divide-gray-50">
                    {topProducts.length === 0
                      ? <tr><td colSpan={3} className="text-center text-gray-400 py-6 text-xs">No data</td></tr>
                      : topProducts.map((p, i) => (
                        <tr key={i}>
                          <td className="py-2">{p.name}</td>
                          <td className="py-2 text-gray-500">{p.qty_sold}</td>
                          <td className="py-2 text-right font-semibold">${(p.revenue || 0).toFixed(2)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <h2 className="text-base font-semibold text-gray-900 mb-4">Cashier Performance</h2>
                <table className="w-full text-sm">
                  <thead><tr className="text-left text-xs text-gray-400 uppercase border-b"><th className="pb-2">Cashier</th><th className="pb-2">Sales</th><th className="pb-2 text-right">Revenue</th></tr></thead>
                  <tbody className="divide-y divide-gray-50">
                    {cashiers.length === 0
                      ? <tr><td colSpan={3} className="text-center text-gray-400 py-6 text-xs">No data</td></tr>
                      : cashiers.map((c, i) => (
                        <tr key={i}>
                          <td className="py-2 font-medium">{c.full_name}</td>
                          <td className="py-2 text-gray-500">{c.sales_count}</td>
                          <td className="py-2 text-right font-semibold">${(c.total_revenue || 0).toFixed(2)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </ProtectedLayout>
  )
}
