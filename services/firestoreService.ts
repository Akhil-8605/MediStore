import { db } from "../config/firebase"
import { collection, getDocs, doc, updateDoc, arrayUnion, getDoc } from "firebase/firestore"

export interface Medicine {
    id: string
    name: string
    price: number
    category: string
    description: string
    stock: boolean
    totalQuantity?: number
    lowStockAlert?: number
}

export interface Order {
    orderId: string
    items: (Medicine & { quantity: number; totalQuantity?: number })[]
    total: number
    paymentMethod: "COD" | "UPI"
    status: "pending" | "completed" | "cancelled" | "delivered"
    createdAt: string
    deliveryAddress: string
    receipt?: string
}

export const firestoreService = {
    // Get all medicines
    async getAllMedicines(): Promise<Medicine[]> {
        const querySnapshot = await getDocs(collection(db, "AllMedicines"))
        return querySnapshot.docs.map((doc) => {
            const data = doc.data()
            return {
                id: doc.id,
                ...data,
                totalQuantity: data.totalQuantity || data.totalQuantity || 0,
            } as Medicine
        })
    },

    // Get medicine by ID
    async getMedicineById(id: string): Promise<Medicine | null> {
        const docSnap = await getDoc(doc(db, "AllMedicines", id))
        if (docSnap.exists()) {
            const data = docSnap.data()
            return {
                id: docSnap.id,
                ...data,
                totalQuantity: data.totalQuantity || data.totalQuantity || 0,
            } as Medicine
        }
        return null
    },

    // Add order to user
    async addOrder(userId: string, order: Order) {
        const userRef = doc(db, "AllUsers", userId)
        await updateDoc(userRef, {
            orders: arrayUnion(order),
        })
    },

    // Add notification to user
    async addNotification(
        userId: string,
        notification: {
            id: string
            title: string
            message: string
            timestamp: string
            read: boolean
            type?: string
            orderId?: string
            hasReorderButton?: boolean
        },
    ) {
        const userRef = doc(db, "AllUsers", userId)
        await updateDoc(userRef, {
            notifications: arrayUnion(notification),
        })
    },

    // Update user data
    async updateUserData(userId: string, data: Partial<any>) {
        const userRef = doc(db, "AllUsers", userId)
        await updateDoc(userRef, data)
    },

    async addReminder(
        userId: string,
        reminder: {
            medicineIds: string[]
            reminderDays: number
            createdAt: string
            dueAt: string
            notified: boolean
        },
    ) {
        const userRef = doc(db, "AllUsers", userId)
        await updateDoc(userRef, {
            reminders: arrayUnion(reminder),
        })
    },

    async markReminderAsNotified(userId: string, reminderDueAt: string) {
        const userSnap = await getDoc(doc(db, "AllUsers", userId))
        if (userSnap.exists()) {
            const userData = userSnap.data()
            const updatedReminders =
                userData.reminders?.map((r: any) => (r.dueAt === reminderDueAt ? { ...r, notified: true } : r)) || []
            await updateDoc(doc(db, "AllUsers", userId), {
                reminders: updatedReminders,
            })
        }
    },
}
