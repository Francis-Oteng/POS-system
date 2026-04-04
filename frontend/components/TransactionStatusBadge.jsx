export default function TransactionStatusBadge({ status }) {
  const styles = {
    completed: 'bg-green-100 text-green-700',
    pending:   'bg-yellow-100 text-yellow-700',
    refunded:  'bg-orange-100 text-orange-700',
    failed:    'bg-red-100 text-red-700',
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
      {status || 'unknown'}
    </span>
  )
}
