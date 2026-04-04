export default function PaymentMethodBadge({ method }) {
  const styles = {
    paystack: 'bg-emerald-100 text-emerald-700',
    cash:     'bg-gray-100 text-gray-700',
    card:     'bg-blue-100 text-blue-700',
  }
  const labels = { paystack: 'Paystack', cash: 'Cash', card: 'Card' }
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[method] || 'bg-gray-100 text-gray-700'}`}>
      {labels[method] || method || '—'}
    </span>
  )
}
