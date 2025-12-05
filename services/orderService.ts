import { db } from "../config/firebase"
import { arrayUnion, doc, getDoc, Timestamp, updateDoc } from "firebase/firestore"
import { addPaymentRecord, updateMedicineStock } from "./adminService"

export const orderService = {
    async completeOrder(
        userId: string,
        items: any[],
        totalAmount: number,
        paymentMethod: "COD" | "UPI",
        reminderDays?: number,
    ): Promise<string> {
        try {
            const orderId = `ORD-${Date.now()}`
            const userRef = doc(db, "AllUsers", userId)

            const userSnap = await getDoc(userRef)
            if (!userSnap.exists()) {
                throw new Error("User not found")
            }
            const userData = userSnap.data()
            const userName = userData.name || "Unknown User"
            const userEmail = userData.email || "unknown@email.com"

            // Create order object
            const order = {
                orderId,
                items,
                total: totalAmount,
                paymentMethod,
                paymentStatus: "Success",
                status: "pending",
                createdAt: new Date().toISOString(),
            }

            // Add order to user's orders array
            await updateDoc(userRef, {
                orders: arrayUnion(order),
            })

            await addPaymentRecord({
                orderId,
                userName,
                userEmail,
                amount: totalAmount,
                mode: paymentMethod,
                items,
                createdAt: Timestamp.now(),
            })

            for (const item of items) {
                await updateMedicineStock(item.id, item.quantity)
            }

            if (reminderDays && reminderDays > 0) {
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

            console.log("Order completed:", orderId)
            return orderId
        } catch (error) {
            console.error("Error completing order:", error)
            throw error
        }
    },
}
