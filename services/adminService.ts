import { db } from "@/config/firebase"
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, Timestamp, updateDoc } from "firebase/firestore"

export interface Medicine {
    id?: string
    name: string
    description: string
    type: string
    price: number
    totalQuantity: number
    currentQuantity: number
    lowStockAlert: number
    expiryDate: string
    createdAt?: Timestamp
    updatedAt?: Timestamp
}

export interface DashboardStats {
    totalRevenue: number
    totalOrders: number
    totalUsers: number
    totalMedicines: number
    lowStockCount: number
}

export interface RecentActivity {
    id: string
    type: "order" | "user" | "medicine"
    message: string
    timestamp: Timestamp
    details?: any
}

// Get dashboard statistics
export const getDashboardStats = async (): Promise<DashboardStats> => {
    try {
        // Get total users
        const usersSnapshot = await getDocs(collection(db, "AllUsers"))
        const totalUsers = usersSnapshot.size

        // Get all orders and calculate revenue
        let totalOrders = 0
        let totalRevenue = 0
        usersSnapshot.forEach((userDoc) => {
            const userData = userDoc.data()
            const orders = userData.orders || []
            totalOrders += orders.length
            orders.forEach((order: any) => {
                totalRevenue += order.totalAmount || 0
            })
        })

        // Get medicines stats
        const medicinesSnapshot = await getDocs(collection(db, "AllMedicines"))
        const totalMedicines = medicinesSnapshot.size
        let lowStockCount = 0
        medicinesSnapshot.forEach((medDoc) => {
            const medicine = medDoc.data() as Medicine
            if (medicine.currentQuantity < medicine.lowStockAlert) {
                lowStockCount++
            }
        })

        return {
            totalRevenue,
            totalOrders,
            totalUsers,
            totalMedicines,
            lowStockCount,
        }
    } catch (error) {
        console.error(" Error fetching dashboard stats:", error)
        throw error
    }
}

// Get low stock medicines
export const getLowStockMedicines = async (): Promise<Medicine[]> => {
    try {
        const medicinesSnapshot = await getDocs(collection(db, "AllMedicines"))
        const lowStockMedicines: Medicine[] = []
        medicinesSnapshot.forEach((doc) => {
            const medicine = { id: doc.id, ...doc.data() } as Medicine
            if (medicine.currentQuantity < medicine.lowStockAlert) {
                lowStockMedicines.push(medicine)
            }
        })
        return lowStockMedicines.sort((a, b) => a.currentQuantity - b.currentQuantity)
    } catch (error) {
        console.error(" Error fetching low stock medicines:", error)
        throw error
    }
}

// Get recent orders from today
export const getRecentActivity = async (days = 1): Promise<RecentActivity[]> => {
    try {
        const activities: RecentActivity[] = []
        const startOfDay = new Date()
        startOfDay.setDate(startOfDay.getDate() - days)
        startOfDay.setHours(0, 0, 0, 0)

        const usersSnapshot = await getDocs(collection(db, "AllUsers"))
        usersSnapshot.forEach((userDoc) => {
            const userData = userDoc.data()
            const orders = userData.orders || []
            orders.forEach((order: any) => {
                if (order.createdAt && order.createdAt.toDate() > startOfDay) {
                    activities.push({
                        id: order.id || Math.random().toString(),
                        type: "order",
                        message: `New order from ${userData.name}`,
                        timestamp: order.createdAt,
                        details: {
                            userName: userData.name,
                            amount: order.totalAmount,
                            items: order.items,
                        },
                    })
                }
            })
        })

        return activities.sort((a, b) => b.timestamp.toDate().getTime() - a.timestamp.toDate().getTime())
    } catch (error) {
        console.error(" Error fetching recent activity:", error)
        throw error
    }
}

// Add new medicine
export const addMedicine = async (medicine: Medicine): Promise<string> => {
    try {
        const docRef = await addDoc(collection(db, "AllMedicines"), {
            ...medicine,
            currentQuantity: medicine.totalQuantity,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        })
        return docRef.id
    } catch (error) {
        console.error(" Error adding medicine:", error)
        throw error
    }
}

// Update medicine
export const updateMedicine = async (id: string, medicine: Partial<Medicine>): Promise<void> => {
    try {
        const docRef = doc(db, "AllMedicines", id)
        await updateDoc(docRef, {
            ...medicine,
            updatedAt: Timestamp.now(),
        })
    } catch (error) {
        console.error(" Error updating medicine:", error)
        throw error
    }
}

// Delete medicine
export const deleteMedicine = async (id: string): Promise<void> => {
    try {
        await deleteDoc(doc(db, "AllMedicines", id))
    } catch (error) {
        console.error(" Error deleting medicine:", error)
        throw error
    }
}

// Get all medicines
export const getAllMedicines = async (): Promise<Medicine[]> => {
    try {
        const snapshot = await getDocs(collection(db, "AllMedicines"))
        const medicines: Medicine[] = []
        snapshot.forEach((doc) => {
            medicines.push({ id: doc.id, ...doc.data() } as Medicine)
        })
        return medicines
    } catch (error) {
        console.error(" Error fetching medicines:", error)
        throw error
    }
}

// Get single medicine
export const getMedicineById = async (id: string): Promise<Medicine | null> => {
    try {
        const docRef = doc(db, "AllMedicines", id)
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as Medicine
        }
        return null
    } catch (error) {
        console.error(" Error fetching medicine:", error)
        throw error
    }
}

// Update medicine stock after order
export const updateMedicineStock = async (medicineId: string, quantity: number): Promise<void> => {
    try {
        const docRef = doc(db, "AllMedicines", medicineId)
        const currentDoc = await getDoc(docRef)
        if (currentDoc.exists()) {
            const currentQuantity = (currentDoc.data() as Medicine).currentQuantity || 0
            await updateDoc(docRef, {
                currentQuantity: Math.max(0, currentQuantity - quantity),
                updatedAt: Timestamp.now(),
            })
        }
    } catch (error) {
        console.error(" Error updating medicine stock:", error)
        throw error
    }
}

// Add payment record to AllPayments collection
export const addPaymentRecord = async (paymentData: {
    orderId: string
    userName: string
    userEmail: string
    amount: number
    mode: "COD" | "UPI"
    items: any[]
    createdAt?: Timestamp
}): Promise<string> => {
    try {
        const docRef = await addDoc(collection(db, "AllPayments"), {
            ...paymentData,
            createdAt: paymentData.createdAt || Timestamp.now(),
        })
        return docRef.id
    } catch (error) {
        console.error(" Error adding payment record:", error)
        throw error
    }
}

// Get all payments
export const getAllPayments = async (): Promise<any[]> => {
    try {
        const snapshot = await getDocs(collection(db, "AllPayments"))
        const payments: any[] = []
        snapshot.forEach((doc) => {
            payments.push({ id: doc.id, ...doc.data() })
        })
        return payments.sort(
            (a, b) => (b.createdAt?.toDate?.() || new Date(b.createdAt)) - (a.createdAt?.toDate?.() || new Date(a.createdAt)),
        )
    } catch (error) {
        console.error(" Error fetching payments:", error)
        throw error
    }
}

// Get payments by date range
export const getPaymentsByDate = async (startDate: Date, endDate: Date): Promise<any[]> => {
    try {
        const payments = await getAllPayments()
        return payments.filter((payment) => {
            const paymentDate = payment.createdAt?.toDate?.() || new Date(payment.createdAt)
            return paymentDate >= startDate && paymentDate <= endDate
        })
    } catch (error) {
        console.error(" Error fetching payments by date:", error)
        throw error
    }
}

// Search medicines with advanced filtering
export const searchMedicinesAdvanced = async (
    searchTerm?: string,
    filterType?: string,
    filterLowStock?: boolean,
    priceRange?: { min: number; max: number },
): Promise<Medicine[]> => {
    try {
        const medicines = await getAllMedicines()

        return medicines.filter((medicine) => {
            let matches = true

            if (searchTerm) {
                const term = searchTerm.toLowerCase()
                matches =
                    matches &&
                    (medicine.name.toLowerCase().includes(term) ||
                        medicine.description?.toLowerCase().includes(term) ||
                        medicine.price.toString().includes(term) ||
                        medicine.currentQuantity.toString().includes(term))
            }

            if (filterType) {
                matches = matches && medicine.type === filterType
            }

            if (filterLowStock) {
                matches = matches && medicine.currentQuantity <= medicine.lowStockAlert
            }

            if (priceRange) {
                matches = matches && medicine.price >= priceRange.min && medicine.price <= priceRange.max
            }

            return matches
        })
    } catch (error) {
        console.error("Error searching medicines:", error)
        throw error
    }
}
