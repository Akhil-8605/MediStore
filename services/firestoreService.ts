import { db } from "@/config/firebase"
import { collection, getDocs, doc, updateDoc, arrayUnion, getDoc } from "firebase/firestore"

export interface Medicine {
    id: string
    name: string
    price: number
    category: string
    description: string
    stock: boolean
    currentQuantity?: number
    lowStockAlert?: number
}

export interface Order {
    orderId: string
    items: (Medicine & { currentQuantity: number })[]
    total: number
    paymentMethod: "COD" | "UPI"
    status: "pending" | "completed" | "cancelled"
    createdAt: string
    deliveryAddress: string
    receipt?: string
}

export const firestoreService = {
    // Get all medicines
    async getAllMedicines(): Promise<Medicine[]> {
        const querySnapshot = await getDocs(collection(db, "AllMedicines"))
        return querySnapshot.docs.map(
            (doc) =>
                ({
                    id: doc.id,
                    ...doc.data(),
                }) as Medicine,
        )
    },

    // Get medicine by ID
    async getMedicineById(id: string): Promise<Medicine | null> {
        const docSnap = await getDoc(doc(db, "AllMedicines", id))
        return docSnap.exists() ? ({ id: docSnap.id, ...docSnap.data() } as Medicine) : null
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
}
