'use client'
import { useState } from 'react'
import { CreditCard, Download } from 'lucide-react'
import ProtectedLayout from '../../../components/layout/ProtectedLayout'
import TransactionList from '../../../components/transactions/TransactionList'
import PaymentModal from '../../../components/PaymentModal'
import { getDummySummary } from '../../../lib/dummyData'

export default function AdminTransactionsPage() {
  const summary = getDummySummary()
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  return (
    <ProtectedLayout roles={['admin', 'manager']}>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
            <p className="text-sm text-gray-500 mt-1">
              {summary.total_transactions} total &bull; ${summary.total_revenue.toFixed(2)} revenue
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowPaymentModal(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-colors"
            >
              <CreditCard size={16} /> New Payment
            </button>
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Completed', value: summary.completed, color: 'text-green-700 bg-green-50 border-green-200' },
            { label: 'Pending', value: summary.pending, color: 'text-yellow-700 bg-yellow-50 border-yellow-200' },
            { label: 'Refunded', value: summary.refunded, color: 'text-orange-700 bg-orange-50 border-orange-200' },
            { label: 'Total Revenue', value: `$${summary.total_revenue.toFixed(2)}`, color: 'text-blue-700 bg-blue-50 border-blue-200' },
          ].map(({ label, value, color }) => (
            <div key={label} className={`rounded-xl border p-4 ${color}`}>
              <p className="text-xs font-medium opacity-70 mb-1">{label}</p>
              <p className="text-xl font-bold">{value}</p>
            </div>
          ))}
        </div>

        {/* Transaction list with filters */}
        <TransactionList useDummy={true} />
      </div>

      {showPaymentModal && (
        <PaymentModal
          amount={99.99}
          onClose={() => setShowPaymentModal(false)}
          onComplete={() => setShowPaymentModal(false)}
          customerEmail="customer@example.com"
        />
      )}
    </ProtectedLayout>
  )
}
