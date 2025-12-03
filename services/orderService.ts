import { doc, updateDoc, arrayUnion, Timestamp, getDoc } from "firebase/firestore"
import { db } from "@/config/firebase"
import { reminderService } from "./reminderService"
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
            const orderId = `order_${Date.now()}`
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
                id: orderId,
                items,
                totalAmount,
                paymentMethod,
                paymentStatus: "Success",
                createdAt: Timestamp.now(),
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

            // Add reminders for each medicine if requested
            if (reminderDays && reminderDays > 0) {
                for (const item of items) {
                    await reminderService.addReminder(userId, {
                        medicineId: item.id,
                        medicineName: item.name,
                        quantity: item.quantity,
                        orderedDate: Timestamp.now(),
                        reminderDays,
                    })
                }
            }

            return orderId
        } catch (error) {
            console.error("[v0] Error completing order:", error)
            throw error
        }
    },
}
