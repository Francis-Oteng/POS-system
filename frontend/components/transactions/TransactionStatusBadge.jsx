'use client'

const STATUS_CONFIG = {
  completed: { label: 'Completed', bg: 'bg-green-100',  text: 'text-green-700' },
  pending:   { label: 'Pending',   bg: 'bg-yellow-100', text: 'text-yellow-700' },
  refunded:  { label: 'Refunded',  bg: 'bg-orange-100', text: 'text-orange-700' },
  void:      { label: 'Void',      bg: 'bg-red-100',    text: 'text-red-700' },
}

export default function TransactionStatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || { label: status, bg: 'bg-gray-100', text: 'text-gray-700' }
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  )
}
