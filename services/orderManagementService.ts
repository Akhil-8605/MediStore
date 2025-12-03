import { db } from "@/config/firebase"
import { collection, doc, updateDoc, arrayUnion, query, where, getDocs } from "firebase/firestore"
import { firestoreService } from "./firestoreService"

export type OrderStatus = "pending" | "delivered" | "cancelled"

export interface OrderStatusUpdate {
    orderId: string
    status: OrderStatus
    timestamp: string
    notes?: string
}

export const orderManagementService = {
    // Admin: Update order status and notify user
    async updateOrderStatus(userId: string, orderId: string, newStatus: OrderStatus, notes?: string) {
        try {
            const userRef = doc(db, "AllUsers", userId)
            const userSnap = await getDocs(query(collection(db, "AllUsers"), where("uid", "==", userId)))

            if (userSnap.empty) {
                throw new Error("User not found")
            }

            const userData = userSnap.docs[0].data()
            const updatedOrders = userData.orders.map((order: any) =>
                order.orderId === orderId ? { ...order, status: newStatus, updatedAt: new Date().toISOString() } : order,
            )

            await updateDoc(userRef, {
                orders: updatedOrders,
            })

            // Send notification to user
            const statusMessages = {
                pending: `Your order ${orderId} is being processed`,
                delivered: `Your order ${orderId} has been delivered! Thank you for your purchase.`,
                cancelled: `Your order ${orderId} has been cancelled.`,
            }

            const notification = {
                id: `order-${orderId}-${Date.now()}`,
                title: "Order Status Updated",
                message: statusMessages[newStatus],
                timestamp: new Date().toISOString(),
                read: false,
                type: "order_status",
                orderId,
                status: newStatus,
            }

            await firestoreService.addNotification(userId, notification)

            console.log("[v0] Order status updated:", orderId, "->", newStatus)

            return true
        } catch (error) {
            console.error("Error updating order status:", error)
            throw error
        }
    },

    // Subtract medicine stock after order
    async subtractMedicineStock(medicineId: string, quantity: number) {
        try {
            const medicineRef = doc(db, "AllMedicines", medicineId)
            const medicineSnap = await getDocs(query(collection(db, "AllMedicines"), where("id", "==", medicineId)))

            if (medicineSnap.empty) {
                throw new Error("Medicine not found")
            }

            const medicineData = medicineSnap.docs[0].data()
            const newQuantity = (medicineData.quantity || 0) - quantity

            await updateDoc(medicineRef, {
                quantity: Math.max(0, newQuantity),
            })

            console.log("[v0] Stock subtracted for medicine:", medicineId, "New quantity:", Math.max(0, newQuantity))
        } catch (error) {
            console.error("Error subtracting medicine stock:", error)
            throw error
        }
    },

    // Get all orders by status
    async getOrdersByStatus(status: OrderStatus) {
        try {
            const usersSnap = await getDocs(collection(db, "AllUsers"))
            const orders: any[] = []

            usersSnap.docs.forEach((userDoc) => {
                const userData = userDoc.data()
                if (userData.orders) {
                    userData.orders.forEach((order: any) => {
                        if (order.status === status) {
                            orders.push({
                                ...order,
                                userId: userDoc.id,
                                userName: userData.name,
                                userEmail: userData.email,
                            })
                        }
                    })
                }
            })

            return orders
        } catch (error) {
            console.error("Error fetching orders by status:", error)
            return []
        }
    },

    // Handle reorder - add to reorders array instead of orders
    async handleReorder(userId: string, orderId: string) {
        try {
            const userSnap = await getDocs(query(collection(db, "AllUsers"), where("uid", "==", userId)))

            if (userSnap.empty) {
                throw new Error("User not found")
            }

            const userData = userSnap.docs[0].data()
            const originalOrder = userData.orders.find((order: any) => order.orderId === orderId)

            if (!originalOrder) {
                throw new Error("Original order not found")
            }

            // Create new reorder
            const reorder = {
                ...originalOrder,
                orderId: `REORDER-${Date.now()}`,
                originalOrderId: orderId,
                status: "pending",
                createdAt: new Date().toISOString(),
            }

            const userRef = doc(db, "AllUsers", userSnap.docs[0].id)

            // Add to reorders array (separate from orders)
            await updateDoc(userRef, {
                reorders: arrayUnion(reorder),
            })

            // Subtract stock for reordered items
            for (const item of reorder.items) {
                await this.subtractMedicineStock(item.id, item.quantity)
            }

            console.log("Reorder created:", reorder.orderId)
            return reorder
        } catch (error) {
            console.error("Error handling reorder:", error)
            throw error
        }
    },
}
