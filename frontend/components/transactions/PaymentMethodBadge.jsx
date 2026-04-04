'use client'

const METHOD_CONFIG = {
  paystack: { label: 'Paystack', bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
  cash:     { label: 'Cash',     bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
  card:     { label: 'Card',     bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-500' },
  mobile_money: { label: 'Mobile Money', bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500' },
}

export default function PaymentMethodBadge({ method }) {
  const config = METHOD_CONFIG[method] || { label: method, bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-400' }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  )
}
