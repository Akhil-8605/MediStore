"use client"

import { cartService, type CartItem } from "@/services/cartService"
import type React from "react"
import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

interface CartContextType {
    items: CartItem[]
    total: number
    loading: boolean
    addToCart: (medicine: any, totalQuantity: number) => Promise<void>
    removeFromCart: (medicineId: string) => Promise<void>
    updateQuantity: (medicineId: string, totalQuantity: number) => Promise<void>
    clearCart: () => Promise<void>
    refreshCart: () => Promise<void>
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [items, setItems] = useState<CartItem[]>([])
    const [total, setTotal] = useState(0)
    const [loading, setLoading] = useState(true)

    const refreshCart = async () => {
        setLoading(true)
        const cartItems = await cartService.getCart()
        setItems(cartItems)
        const cartTotal = await cartService.getCartTotal()
        setTotal(cartTotal)
        setLoading(false)
    }

    useEffect(() => {
        refreshCart()
    }, [])

    const addToCart = async (medicine: any, totalQuantity: number) => {
        await cartService.addToCart(medicine, totalQuantity)
        await refreshCart()
    }

    const removeFromCart = async (medicineId: string) => {
        await cartService.removeFromCart(medicineId)
        await refreshCart()
    }

    const updateQuantity = async (medicineId: string, totalQuantity: number) => {
        await cartService.updateQuantity(medicineId, totalQuantity)
        await refreshCart()
    }

    const clearCart = async () => {
        await cartService.clearCart()
        await refreshCart()
    }

    const value = {
        items,
        total,
        loading,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        refreshCart,
    }

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export const useCart = () => {
    const context = useContext(CartContext)
    if (!context) {
        throw new Error("useCart must be used within CartProvider")
    }
    return context
}
