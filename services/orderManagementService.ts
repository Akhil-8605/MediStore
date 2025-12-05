import { db } from "../config/firebase"
import { arrayUnion, collection, doc, getDoc, getDocs, query, updateDoc, where } from "firebase/firestore"
import { addDeliveredOrder, updateMedicineStock } from "./adminService"
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
            const userSnap = await getDocs(query(collection(db, "AllUsers"), where("uid", "==", userId)))

            if (userSnap.empty) {
                // Try finding by document ID
                const userDocRef = doc(db, "AllUsers", userId)
                const userDocSnap = await getDoc(userDocRef)

                if (!userDocSnap.exists()) {
                    throw new Error("User not found")
                }

                const userData = userDocSnap.data()
                const originalOrder = userData.orders?.find((order: any) => order.orderId === orderId)

                const updatedOrders = userData.orders.map((order: any) =>
                    order.orderId === orderId ? { ...order, status: newStatus, updatedAt: new Date().toISOString() } : order,
                )

                await updateDoc(userDocRef, {
                    orders: updatedOrders,
                })

                if (newStatus === "delivered" && originalOrder) {
                    // Add to DeliveredOrders collection
                    await addDeliveredOrder({
                        orderId: originalOrder.orderId,
                        userId: userId,
                        userName: userData.name || "Unknown",
                        userEmail: userData.email || "N/A",
                        userPhone: userData.phone || "N/A",
                        items: originalOrder.items || [],
                        totalAmount: originalOrder.total || 0,
                        deliveryAddress: originalOrder.deliveryAddress || "N/A",
                        paymentMethod: originalOrder.paymentMethod || "Unknown",
                        createdAt: originalOrder.createdAt || new Date().toISOString(),
                    })

                    // Update medicine stock (subtract quantities)
                    for (const item of originalOrder.items || []) {
                        if (item.id) {
                            await updateMedicineStock(item.id, item.quantity || 1)
                        }
                    }
                }

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

                console.log("Order status updated:", orderId, "->", newStatus)
                return true
            }

            const userData = userSnap.docs[0].data()
            const userRef = doc(db, "AllUsers", userSnap.docs[0].id)
            const originalOrder = userData.orders?.find((order: any) => order.orderId === orderId)

            const updatedOrders = userData.orders.map((order: any) =>
                order.orderId === orderId ? { ...order, status: newStatus, updatedAt: new Date().toISOString() } : order,
            )

            await updateDoc(userRef, {
                orders: updatedOrders,
            })

            if (newStatus === "delivered" && originalOrder) {
                // Add to DeliveredOrders collection
                await addDeliveredOrder({
                    orderId: originalOrder.orderId,
                    userId: userId,
                    userName: userData.name || "Unknown",
                    userEmail: userData.email || "N/A",
                    userPhone: userData.phone || "N/A",
                    items: originalOrder.items || [],
                    totalAmount: originalOrder.total || 0,
                    deliveryAddress: originalOrder.deliveryAddress || "N/A",
                    paymentMethod: originalOrder.paymentMethod || "Unknown",
                    createdAt: originalOrder.createdAt || new Date().toISOString(),
                })

                // Update medicine stock (subtract quantities)
                for (const item of originalOrder.items || []) {
                    if (item.id) {
                        await updateMedicineStock(item.id, item.quantity || 1)
                    }
                }
            }

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

            await firestoreService.addNotification(userSnap.docs[0].id, notification)

            console.log("Order status updated:", orderId, "->", newStatus)

            return true
        } catch (error) {
            console.error("Error updating order status:", error)
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
                                userPhone: userData.phone,
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

            const newOrder = {
                ...originalOrder,
                orderId: `ORD-${Date.now()}`,
                originalOrderId: orderId,
                status: "pending",
                isReorder: true,
                createdAt: new Date().toISOString(),
            }

            const userRef = doc(db, "AllUsers", userSnap.docs[0].id)

            await updateDoc(userRef, {
                orders: arrayUnion(newOrder),
                reorderCount: (userData.reorderCount || 0) + 1,
            })

            console.log("Reorder created:", newOrder.orderId)
            return newOrder
        } catch (error) {
            console.error("Error handling reorder:", error)
            throw error
        }
    },
}
