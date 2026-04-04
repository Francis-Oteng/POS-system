'use client'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '../context/AuthContext'

export function Providers({ children }) {
  return (
    <AuthProvider>
      <Toaster position="top-right" />
      {children}
    </AuthProvider>
  )
}
