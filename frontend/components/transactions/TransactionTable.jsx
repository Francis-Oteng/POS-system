'use client'
import { useState } from 'react'
import { ChevronUp, ChevronDown, Eye } from 'lucide-react'
import PaymentMethodBadge from './PaymentMethodBadge'
import TransactionStatusBadge from './TransactionStatusBadge'

function SortIcon({ field, sort }) {
  if (sort.field !== field) return <ChevronUp size={14} className="text-gray-300" />
  return sort.dir === 'asc' ? <ChevronUp size={14} className="text-blue-500" /> : <ChevronDown size={14} className="text-blue-500" />
}

export default function TransactionTable({ transactions, onView, sort, onSort }) {
  const cols = [
    { key: 'receipt_number', label: 'Receipt #', sortable: true },
    { key: 'createdAt',      label: 'Date',       sortable: true },
    { key: 'customer_name',  label: 'Customer',   sortable: false },
    { key: 'total_amount',   label: 'Amount',     sortable: true },
    { key: 'payment_method', label: 'Method',     sortable: false },
    { key: 'payment_status', label: 'Status',     sortable: false },
    { key: 'actions',        label: '',           sortable: false },
  ]

  const handleSort = (key) => {
    if (!onSort) return
    onSort({ field: key, dir: sort?.field === key && sort?.dir === 'asc' ? 'desc' : 'asc' })
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            {cols.map(col => (
              <th
                key={col.key}
                onClick={() => col.sortable && handleSort(col.key)}
                className={`px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider ${col.sortable ? 'cursor-pointer hover:text-gray-700 select-none' : ''}`}
              >
                <div className="flex items-center gap-1">
                  {col.label}
                  {col.sortable && <SortIcon field={col.key} sort={sort || {}} />}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {transactions.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-4 py-12 text-center text-gray-400 text-sm">
                No transactions found
              </td>
            </tr>
          ) : transactions.map(tx => (
            <tr key={tx._id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 font-mono text-xs text-gray-700">{tx.receipt_number}</td>
              <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                {new Date(tx.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                <span className="text-xs text-gray-400 ml-1">{new Date(tx.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
              </td>
              <td className="px-4 py-3 text-gray-800">
                {tx.customer_name || tx.customer_id?.full_name || 'Walk-in'}
              </td>
              <td className="px-4 py-3 font-semibold text-gray-900">
                ${(tx.total_amount || 0).toFixed(2)}
              </td>
              <td className="px-4 py-3">
                <PaymentMethodBadge method={tx.payment_method} />
              </td>
              <td className="px-4 py-3">
                <TransactionStatusBadge status={tx.payment_status} />
              </td>
              <td className="px-4 py-3">
                <button
                  onClick={() => onView && onView(tx)}
                  className="text-blue-500 hover:text-blue-700 p-1 rounded hover:bg-blue-50 transition-colors"
                  title="View details"
                >
                  <Eye size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
