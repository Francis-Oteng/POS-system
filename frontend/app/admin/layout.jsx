import AdminLayoutClient from './AdminLayoutClient'

export const metadata = { title: 'Admin — POS System' }

export default function AdminLayout({ children }) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>
}
