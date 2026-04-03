'use client'
import { Search, X } from 'lucide-react'

export default function TransactionFilters({ filters, onChange, onClear }) {
  const { payment_method = 'all', status = 'all', search = '', fromDate = '', toDate = '' } = filters

  const hasFilters = payment_method !== 'all' || status !== 'all' || search || fromDate || toDate

  return (
    <div className="flex flex-wrap gap-3 items-center">
      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={e => onChange({ ...filters, search: e.target.value })}
          className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm w-52 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          placeholder="Search receipt, customer..."
        />
      </div>

      {/* Payment method */}
      <select
        value={payment_method}
        onChange={e => onChange({ ...filters, payment_method: e.target.value })}
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
      >
        <option value="all">All Methods</option>
        <option value="cash">Cash</option>
        <option value="paystack">Paystack</option>
        <option value="card">Card</option>
        <option value="mobile_money">Mobile Money</option>
      </select>

      {/* Status */}
      <select
        value={status}
        onChange={e => onChange({ ...filters, status: e.target.value })}
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
      >
        <option value="all">All Statuses</option>
        <option value="completed">Completed</option>
        <option value="pending">Pending</option>
        <option value="refunded">Refunded</option>
        <option value="void">Void</option>
      </select>

      {/* Date range */}
      <input
        type="date"
        value={fromDate}
        onChange={e => onChange({ ...filters, fromDate: e.target.value })}
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
      />
      <span className="text-gray-400 text-sm">to</span>
      <input
        type="date"
        value={toDate}
        onChange={e => onChange({ ...filters, toDate: e.target.value })}
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
      />

      {hasFilters && (
        <button
          onClick={onClear}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100"
        >
          <X size={14} /> Clear
        </button>
      )}
    </div>
  )
}
