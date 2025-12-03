import AsyncStorage from "@react-native-async-storage/async-storage"
import type { Medicine } from "./firestoreService"

export interface CartItem extends Medicine {
    quantity: number
    addedAt: string
}

const CART_KEY = "@medistore_cart"

export const cartService = {
    // Get cart items
    async getCart(): Promise<CartItem[]> {
        try {
            const cart = await AsyncStorage.getItem(CART_KEY)
            return cart ? JSON.parse(cart) : []
        } catch (error) {
            console.error("Error getting cart:", error)
            return []
        }
    },

    // Add item to cart
    async addToCart(medicine: Medicine, quantity = 1) {
        const cart = await this.getCart()
        const existingItem = cart.find((item) => item.id === medicine.id)

        if (existingItem) {
            existingItem.quantity += quantity
        } else {
            cart.push({
                ...medicine,
                quantity,
                addedAt: new Date().toISOString(),
            })
        }

        await AsyncStorage.setItem(CART_KEY, JSON.stringify(cart))
    },

    // Remove item from cart
    async removeFromCart(medicineId: string) {
        const cart = await this.getCart()
        const filtered = cart.filter((item) => item.id !== medicineId)
        await AsyncStorage.setItem(CART_KEY, JSON.stringify(filtered))
    },

    // Update item quantity
    async updateQuantity(medicineId: string, quantity: number) {
        const cart = await this.getCart()
        const item = cart.find((item) => item.id === medicineId)
        if (item) {
            item.quantity = Math.max(0, quantity)
            if (item.quantity === 0) {
                await this.removeFromCart(medicineId)
            } else {
                await AsyncStorage.setItem(CART_KEY, JSON.stringify(cart))
            }
        }
    },

    // Clear cart
    async clearCart() {
        await AsyncStorage.removeItem(CART_KEY)
    },

    // Get cart total
    async getCartTotal(): Promise<number> {
        const cart = await this.getCart()
        return cart.reduce((total, item) => total + item.price * item.quantity, 0)
    },
}
