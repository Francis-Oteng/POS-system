import './globals.css'
import { Providers } from '../components/Providers'

export const metadata = { title: 'POS System', description: 'Point of Sale System' }

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
