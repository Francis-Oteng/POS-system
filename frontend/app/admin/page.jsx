'use client'
import { useState } from 'react'
import Link from 'next/link'
import { DollarSign, ShoppingBag, TrendingUp, CreditCard, ArrowRight, CheckCircle } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { DUMMY_TRANSACTIONS, DASHBOARD_STATS, REVENUE_CHART_DATA, PAYMENT_METHOD_DATA } from '../../lib/dummyData'
import { formatCurrency, formatDate } from '../../lib/formatting'
import TransactionStatusBadge from '../../components/TransactionStatusBadge'
import PaymentMethodBadge from '../../components/PaymentMethodBadge'
import FinalizeTransactionModal from '../../components/FinalizeTransactionModal'

function StatCard({ title, value, sub, icon: Icon, color }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon size={22} className="text-white" />
        </div>
      </div>
    </div>
  )
}

export default function AdminDashboardPage() {
  const [transactions, setTransactions] = useState(DUMMY_TRANSACTIONS)
  const [finalizing, setFinalizing] = useState(null)

  const recent = [...transactions].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10)

  const stats = {
    totalRevenue: transactions.filter(t => t.status === 'completed').reduce((s, t) => s + t.total, 0),
    count: transactions.length,
    avg: transactions.reduce((s, t) => s + t.total, 0) / transactions.length,
    paystackPct: Math.round((transactions.filter(t => t.paymentMethod === 'paystack').length / transactions.length) * 100),
    pending: transactions.filter(t => t.status === 'pending').length,
  }

  const handleFinalized = (updated) => {
    setTransactions(prev => prev.map(t => t.id === updated.id ? updated : t))
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Overview of your store performance</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/transactions"
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            All Transactions <ArrowRight size={14} />
          </Link>
          <Link
            href="/admin/new-transaction"
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
          >
            + New Transaction
          </Link>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Revenue" value={formatCurrency(stats.totalRevenue)} sub="From completed transactions" icon={DollarSign} color="bg-emerald-500" />
        <StatCard title="Total Transactions" value={stats.count} sub={`${stats.pending} pending`} icon={ShoppingBag} color="bg-blue-500" />
        <StatCard title="Avg Transaction" value={formatCurrency(stats.avg)} sub="Per transaction" icon={TrendingUp} color="bg-yellow-500" />
        <StatCard title="Paystack Usage" value={`${stats.paystackPct}%`} sub="Of all transactions" icon={CreditCard} color="bg-purple-500" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue trend */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Revenue Trend</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={REVENUE_CHART_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} tickFormatter={v => `$${v}`} />
              <Tooltip formatter={v => [formatCurrency(v), 'Revenue']} />
              <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Payment method breakdown */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Payment Methods</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={PAYMENT_METHOD_DATA} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                {PAYMENT_METHOD_DATA.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Legend iconType="circle" iconSize={10} />
              <Tooltip formatter={(v, name) => [`${v} (${Math.round(v / transactions.length * 100)}%)`, name]} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent transactions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Recent Transactions</h2>
          <Link href="/admin/transactions" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1">
            View all <ArrowRight size={14} />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wide">
                <th className="px-6 py-3">ID</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recent.map(txn => (
                <tr key={txn.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3 font-mono text-xs font-medium text-gray-700">{txn.id}</td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(txn.date)}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{txn.customer?.name}</td>
                  <td className="px-4 py-3 font-semibold">{formatCurrency(txn.total)}</td>
                  <td className="px-4 py-3"><PaymentMethodBadge method={txn.paymentMethod} /></td>
                  <td className="px-4 py-3"><TransactionStatusBadge status={txn.status} /></td>
                  <td className="px-4 py-3">
                    {txn.status === 'pending' ? (
                      <button
                        onClick={() => setFinalizing(txn)}
                        className="flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition-colors"
                      >
                        <CheckCircle size={13} /> Finalize
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Finalize modal */}
      {finalizing && (
        <FinalizeTransactionModal
          transaction={finalizing}
          onClose={() => setFinalizing(null)}
          onFinalized={(updated) => { handleFinalized(updated); setFinalizing(null) }}
        />
      )}
    </div>
  )
}
