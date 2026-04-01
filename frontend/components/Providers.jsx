'use client'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '../context/AuthContext'
import { CartProvider } from '../context/CartContext'

export function Providers({ children }) {
  return (
    <AuthProvider>
      <CartProvider>
        <Toaster position="top-right" />
        {children}
      </CartProvider>
    </AuthProvider>
  )
}
