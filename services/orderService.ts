import { db } from "../config/firebase"
import { doc, getDoc, Timestamp } from "firebase/firestore"
import { addPaymentRecord, updateMedicineStock } from "./adminService"

export const orderService = {
    async processOrderSideEffects(
        userId: string,
        orderId: string,
        items: any[],
        totalAmount: number,
        paymentMethod: "COD" | "UPI",
        reminderDays?: number,
    ): Promise<void> {
        try {
            const userRef = doc(db, "AllUsers", userId)

            const userSnap = await getDoc(userRef)
            if (!userSnap.exists()) {
                throw new Error("User not found")
            }

            const userData = userSnap.data()
            const userName = userData.name || "Unknown User"
            const userEmail = userData.email || "unknown@email.com"

            // Add payment record (no duplicate order creation)
            await addPaymentRecord({
                orderId,
                userName,
                userEmail,
                amount: totalAmount,
                mode: paymentMethod,
                items,
                createdAt: Timestamp.now(),
            })

            // Update medicine stock
            for (const item of items) {
                await updateMedicineStock(item.id, item.quantity)
            }

            // Handle reminders if specified
            if (reminderDays && reminderDays > 0) {
                const { updateDoc, arrayUnion } = await import("firebase/firestore")
                const dueDate = new Date()
                dueDate.setDate(dueDate.getDate() + reminderDays)

                const reminder = {
                    id: `reminder_${Date.now()}`,
                    orderId,
                    reminderDays,
                    createdAt: new Date().toISOString(),
                    dueAt: dueDate.toISOString(),
                    notified: false,
                    medicineIds: items.map((item) => item.id),
                }

                await updateDoc(userRef, {
                    reminders: arrayUnion(reminder),
                })
            }

            console.log("Order side effects processed for:", orderId)
        } catch (error) {
            console.error("Error processing order side effects:", error)
            throw error
        }
    },

    // Keep legacy function for backward compatibility but mark as deprecated
    /** @deprecated Use processOrderSideEffects instead to avoid duplicate orders */
    async completeOrder(
        userId: string,
        items: any[],
        totalAmount: number,
        paymentMethod: "COD" | "UPI",
        reminderDays?: number,
    ): Promise<string> {
        // Generate orderId for backward compatibility
        const orderId = `ORD-${Date.now()}`
        await this.processOrderSideEffects(userId, orderId, items, totalAmount, paymentMethod, reminderDays)
        return orderId
    },
}
