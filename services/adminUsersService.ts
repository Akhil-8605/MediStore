import { collection, doc, updateDoc, getDocs, getDoc, arrayUnion, Timestamp } from "firebase/firestore"
import { db } from "../config/firebase"

export interface UserDetail {
    id: string
    name: string
    email: string
    mobile: string
    orders: any[]
    reorders: any[]
    notifications: any[]
    reminderDates: any[]
}

export const adminUserService = {
    async getAllUsers(): Promise<UserDetail[]> {
        try {
            const usersRef = collection(db, "AllUsers")
            const snapshot = await getDocs(usersRef)

            const users: UserDetail[] = []
            snapshot.forEach((doc) => {
                users.push({
                    id: doc.id,
                    ...doc.data(),
                } as UserDetail)
            })

            return users
        } catch (error) {
            console.error("Error fetching users:", error)
            throw error
        }
    },

    async getUserById(userId: string): Promise<UserDetail | null> {
        try {
            const userRef = doc(db, "AllUsers", userId)
            const userSnap = await getDoc(userRef)

            if (userSnap.exists()) {
                return {
                    id: userSnap.id,
                    ...userSnap.data(),
                } as UserDetail
            }
            return null
        } catch (error) {
            console.error("Error fetching user:", error)
            throw error
        }
    },

    async sendCustomNotification(userId: string, title: string, message: string): Promise<void> {
        try {
            const userRef = doc(db, "AllUsers", userId)
            await updateDoc(userRef, {
                notifications: arrayUnion({
                    id: `notif_${Date.now()}`,
                    title,
                    message,
                    createdAt: Timestamp.now(),
                    read: false,
                }),
            })
        } catch (error) {
            console.error("Error sending notification:", error)
            throw error
        }
    },

    async getUsersByReminderDue(): Promise<any[]> {
        try {
            const users = await this.getAllUsers()
            const today = new Date()
            const usersWithReminders: any[] = []

            users.forEach((user) => {
                if (user.reminderDates && Array.isArray(user.reminderDates)) {
                    user.reminderDates.forEach((reminder: any) => {
                        const reminderDate = reminder.dueDate?.toDate?.() || new Date(reminder.dueDate)
                        const daysUntilReminder = Math.ceil((reminderDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

                        if (daysUntilReminder <= 5 && daysUntilReminder >= 0) {
                            usersWithReminders.push({
                                userId: user.id,
                                userName: user.name,
                                userEmail: user.email,
                                medicineName: reminder.medicineName,
                                medicineId: reminder.medicineId,
                                daysUntilReminder,
                                reminderDate,
                                quantity: reminder.quantity,
                            })
                        }
                    })
                }
            })

            return usersWithReminders.sort((a, b) => a.daysUntilReminder - b.daysUntilReminder)
        } catch (error) {
            console.error("Error fetching reminder alerts:", error)
            throw error
        }
    },
}
