import { doc, updateDoc, arrayUnion, Timestamp } from "firebase/firestore"
import { db } from "../config/firebase"

export interface ReminderData {
    medicineId: string
    medicineName: string
    quantity: number
    orderedDate: Timestamp
    reminderDays: number
}

export const reminderService = {
    async addReminder(userId: string, reminder: ReminderData): Promise<void> {
        try {
            const userRef = doc(db, "AllUsers", userId)
            const dueDate = new Date(reminder.orderedDate.toMillis())
            dueDate.setDate(dueDate.getDate() + reminder.reminderDays)

            await updateDoc(userRef, {
                reminderDates: arrayUnion({
                    id: `reminder_${Date.now()}`,
                    medicineId: reminder.medicineId,
                    medicineName: reminder.medicineName,
                    quantity: reminder.quantity,
                    orderedDate: reminder.orderedDate,
                    dueDate: Timestamp.fromDate(dueDate),
                    reminderDays: reminder.reminderDays,
                    createdAt: Timestamp.now(),
                }),
            })
        } catch (error) {
            console.error("Error adding reminder:", error)
            throw error
        }
    },

    async getUserReminders(userId: string): Promise<any[]> {
        try {
            const userRef = doc(db, "AllUsers", userId)
            const userSnap = await (await import("firebase/firestore")).getDoc(userRef)

            if (userSnap.exists()) {
                const reminders = userSnap.data().reminderDates || []
                return reminders.sort(
                    (a: any, b: any) =>
                        (a.dueDate?.toDate?.() || new Date(a.dueDate)) - (b.dueDate?.toDate?.() || new Date(b.dueDate)),
                )
            }
            return []
        } catch (error) {
            console.error("Error fetching reminders:", error)
            throw error
        }
    },

    async getUpcomingReminders(userId: string): Promise<any[]> {
        try {
            const reminders = await this.getUserReminders(userId)
            const today = new Date()
            today.setHours(0, 0, 0, 0)

            return reminders.filter((reminder) => {
                const dueDate = reminder.dueDate?.toDate?.() || new Date(reminder.dueDate)
                return dueDate >= today
            })
        } catch (error) {
            console.error("Error fetching upcoming reminders:", error)
            throw error
        }
    },
}
