'use client'
import { useState } from 'react'
import { DollarSign, ShoppingBag, CreditCard, RotateCcw, TrendingUp, Clock, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import ProtectedLayout from '../../components/layout/ProtectedLayout'
import TransactionList from '../../components/transactions/TransactionList'
import { getDummySummary, dummyTransactions } from '../../lib/dummyData'
import PaymentMethodBadge from '../../components/transactions/PaymentMethodBadge'
import TransactionStatusBadge from '../../components/transactions/TransactionStatusBadge'
import PaymentModal from '../../components/PaymentModal'

function StatCard({ title, value, icon: Icon, color, sub }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon size={22} className="text-white" />
        </div>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const summary = getDummySummary()
  const recent = dummyTransactions.slice(0, 5)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [demoAmount] = useState(89.99)

  return (
    <ProtectedLayout roles={['admin', 'manager']}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">Manage transactions and payments</p>
          </div>
          <button
            onClick={() => setShowPaymentModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-colors"
          >
            <CreditCard size={16} /> New Payment
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Revenue"
            value={`$${summary.total_revenue.toFixed(2)}`}
            icon={DollarSign}
            color="bg-blue-500"
            sub={`${summary.completed} completed`}
          />
          <StatCard
            title="Total Transactions"
            value={summary.total_transactions}
            icon={ShoppingBag}
            color="bg-green-500"
            sub="Last 30 days"
          />
          <StatCard
            title="Paystack Revenue"
            value={`$${summary.paystack_revenue.toFixed(2)}`}
            icon={CreditCard}
            color="bg-purple-500"
            sub="Online payments"
          />
          <StatCard
            title="Pending / Refunded"
            value={`${summary.pending} / ${summary.refunded}`}
            icon={Clock}
            color="bg-yellow-500"
            sub="Needs attention"
          />
        </div>

        {/* Payment method breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp size={18} className="text-blue-500" /> Revenue Breakdown
            </h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Cash</span>
                  <span className="font-semibold">${summary.cash_revenue.toFixed(2)}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${summary.total_revenue > 0 ? (summary.cash_revenue / summary.total_revenue) * 100 : 0}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Paystack</span>
                  <span className="font-semibold">${summary.paystack_revenue.toFixed(2)}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${summary.total_revenue > 0 ? (summary.paystack_revenue / summary.total_revenue) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Status summary */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <ShoppingBag size={18} className="text-green-500" /> Status Summary
            </h2>
            <div className="space-y-3">
              {[
                { label: 'Completed', value: summary.completed, color: 'bg-green-100 text-green-700' },
                { label: 'Pending', value: summary.pending, color: 'bg-yellow-100 text-yellow-700' },
                { label: 'Refunded', value: summary.refunded, color: 'bg-orange-100 text-orange-700' },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${color}`}>{label}</span>
                  <span className="font-bold text-gray-800">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <Link href="/admin/transactions" className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 border border-gray-100 transition-colors">
                <span className="text-sm font-medium text-gray-700">View All Transactions</span>
                <ArrowRight size={16} className="text-gray-400" />
              </Link>
              <Link href="/pos" className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 border border-gray-100 transition-colors">
                <span className="text-sm font-medium text-gray-700">Point of Sale</span>
                <ArrowRight size={16} className="text-gray-400" />
              </Link>
              <Link href="/reports" className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 border border-gray-100 transition-colors">
                <span className="text-sm font-medium text-gray-700">Sales Reports</span>
                <ArrowRight size={16} className="text-gray-400" />
              </Link>
              <button onClick={() => setShowPaymentModal(true)} className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-blue-50 border border-blue-100 transition-colors">
                <span className="text-sm font-medium text-blue-700">Process Payment (Demo)</span>
                <CreditCard size={16} className="text-blue-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Recent transactions panel */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">Recent Transactions</h2>
            <Link href="/admin/transactions" className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr className="text-xs text-gray-500 uppercase">
                  <th className="px-4 py-3 text-left">Receipt</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Customer</th>
                  <th className="px-4 py-3 text-left">Amount</th>
                  <th className="px-4 py-3 text-left">Method</th>
                  <th className="px-4 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recent.map(tx => (
                  <tr key={tx._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-700">{tx.receipt_number}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{new Date(tx.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-gray-800">{tx.customer_name}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">${tx.total_amount.toFixed(2)}</td>
                    <td className="px-4 py-3"><PaymentMethodBadge method={tx.payment_method} /></td>
                    <td className="px-4 py-3"><TransactionStatusBadge status={tx.payment_status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showPaymentModal && (
        <PaymentModal
          amount={demoAmount}
          onClose={() => setShowPaymentModal(false)}
          onComplete={() => setShowPaymentModal(false)}
          customerEmail="demo@example.com"
        />
      )}
    </ProtectedLayout>
  )
}
