import { collection, getDocs } from "firebase/firestore"
import { db } from "../config/firebase"

interface DashboardStats {
    totalRevenue: number
    totalOrders: number
    activeUsers: number
    totalMedicinesInStock: number
    lowStockMedicines: any[]
    recentActivity: any[]
}

export const adminAnalyticsService = {
    async getDashboardStats(): Promise<DashboardStats> {
        try {
            const today = new Date()
            today.setHours(0, 0, 0, 0)

            // Get total revenue and orders from AllPayments
            const paymentsRef = collection(db, "AllPayments")
            const paymentsSnap = await getDocs(paymentsRef)

            let totalRevenue = 0
            const paymentsList: any[] = []
            paymentsSnap.forEach((doc) => {
                const data = doc.data()
                totalRevenue += Number.parseFloat(data.amount) || 0
                paymentsList.push({ id: doc.id, ...data })
            })

            // Get recent activity (orders from today)
            const recentActivity = paymentsList
                .filter((payment) => {
                    const paymentDate = payment.createdAt?.toDate?.() || new Date(payment.createdAt)
                    return paymentDate >= today
                })
                .sort(
                    (a, b) =>
                        (b.createdAt?.toDate?.() || new Date(b.createdAt)) - (a.createdAt?.toDate?.() || new Date(a.createdAt)),
                )
                .slice(0, 10)

            // Get active users (users with at least one order)
            const usersRef = collection(db, "AllUsers")
            const usersSnap = await getDocs(usersRef)
            let activeUsers = 0
            usersSnap.forEach((doc) => {
                const data = doc.data()
                if (data.orders && data.orders.length > 0) {
                    activeUsers++
                }
            })

            // Get medicines stats
            const medicinesRef = collection(db, "AllMedicines")
            const medicinesSnap = await getDocs(medicinesRef)

            let totalMedicinesInStock = 0
            const lowStockMedicines: any[] = []

            medicinesSnap.forEach((doc) => {
                const data = doc.data()
                const quantity = Number.parseInt(data.quantity) || 0
                const lowQuantityAlert = Number.parseInt(data.lowQuantityAlertValue) || 0

                totalMedicinesInStock += quantity

                if (quantity <= lowQuantityAlert && quantity > 0) {
                    lowStockMedicines.push({
                        id: doc.id,
                        name: data.name,
                        quantity,
                        threshold: lowQuantityAlert,
                        expiryDate: data.expiryDate,
                    })
                }
            })

            return {
                totalRevenue,
                totalOrders: paymentsList.length,
                activeUsers,
                totalMedicinesInStock,
                lowStockMedicines,
                recentActivity,
            }
        } catch (error) {
            console.error("Error fetching dashboard stats:", error)
            throw error
        }
    },

    async getLowStockAlerts() {
        try {
            const medicinesRef = collection(db, "AllMedicines")
            const medicinesSnap = await getDocs(medicinesRef)

            const lowStockMedicines: any[] = []

            medicinesSnap.forEach((doc) => {
                const data = doc.data()
                const quantity = Number.parseInt(data.quantity) || 0
                const lowQuantityAlert = Number.parseInt(data.lowQuantityAlertValue) || 0

                if (quantity <= lowQuantityAlert) {
                    lowStockMedicines.push({
                        id: doc.id,
                        name: data.name,
                        quantity,
                        threshold: lowQuantityAlert,
                        expiryDate: data.expiryDate,
                        description: data.description,
                    })
                }
            })

            return lowStockMedicines
        } catch (error) {
            console.error("Error fetching low stock alerts:", error)
            throw error
        }
    },

    async getReminderAlerts() {
        try {
            const usersRef = collection(db, "AllUsers")
            const usersSnap = await getDocs(usersRef)

            const reminderAlerts: any[] = []
            const today = new Date()

            usersSnap.forEach((doc) => {
                const userData = doc.data()
                if (userData.reminderDates && Array.isArray(userData.reminderDates)) {
                    userData.reminderDates.forEach((reminder: any) => {
                        const reminderDate = reminder.dueDate?.toDate?.() || new Date(reminder.dueDate)
                        const daysUntilReminder = Math.ceil((reminderDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

                        if (daysUntilReminder <= 5 && daysUntilReminder >= 0) {
                            reminderAlerts.push({
                                userId: doc.id,
                                userName: userData.name,
                                userEmail: userData.email,
                                medicineName: reminder.medicineName,
                                daysUntilReminder,
                                reminderDate,
                            })
                        }
                    })
                }
            })

            return reminderAlerts.sort((a, b) => a.daysUntilReminder - b.daysUntilReminder)
        } catch (error) {
            console.error("Error fetching reminder alerts:", error)
            throw error
        }
    },
}
