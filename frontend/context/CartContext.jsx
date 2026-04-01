'use client'
import { createContext, useContext, useState, useMemo } from 'react'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [items, setItems] = useState([])
  const [customer, setCustomer] = useState(null)
  const [discountType, setDiscountType] = useState(null)
  const [discountValue, setDiscountValue] = useState(0)

  const addItem = (product) => {
    setItems(prev => {
      const existing = prev.find(i => i._id === product._id)
      if (existing) return prev.map(i => i._id === product._id ? { ...i, quantity: i.quantity + 1 } : i)
      return [...prev, { ...product, quantity: 1 }]
    })
  }

  const removeItem = (id) => setItems(prev => prev.filter(i => i._id !== id))

  const updateQty = (id, qty) => {
    if (qty <= 0) { removeItem(id); return }
    setItems(prev => prev.map(i => i._id === id ? { ...i, quantity: qty } : i))
  }

  const clearCart = () => { setItems([]); setCustomer(null); setDiscountType(null); setDiscountValue(0) }
  const setDiscount = (type, value) => { setDiscountType(type); setDiscountValue(parseFloat(value) || 0) }

  const subtotal = useMemo(() => items.reduce((s, i) => s + i.price * i.quantity, 0), [items])
  const discountAmount = useMemo(() => {
    if (discountType === 'percent') return (subtotal * discountValue) / 100
    if (discountType === 'fixed') return Math.min(discountValue, subtotal)
    return 0
  }, [subtotal, discountType, discountValue])
  const taxAmount = useMemo(() => items.reduce((s, i) => s + (i.price * i.quantity * (i.tax_rate || 0)) / 100, 0), [items])
  const total = useMemo(() => Math.max(0, subtotal - discountAmount + taxAmount), [subtotal, discountAmount, taxAmount])

  return (
    <CartContext.Provider value={{ items, customer, discountType, discountValue, subtotal, discountAmount, taxAmount, total, addItem, removeItem, updateQty, clearCart, setCustomer, setDiscount }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() { return useContext(CartContext) }
