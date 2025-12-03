import { doc, updateDoc, arrayUnion, Timestamp } from "firebase/firestore"
import { db } from "@/config/firebase"

export interface CustomNotification {
    userId: string
    title: string
    message: string
}

export const adminNotificationService = {
    async sendCustomNotification(notification: CustomNotification): Promise<void> {
        try {
            const userRef = doc(db, "AllUsers", notification.userId)
            await updateDoc(userRef, {
                notifications: arrayUnion({
                    id: `notif_${Date.now()}`,
                    title: notification.title,
                    message: notification.message,
                    createdAt: Timestamp.now(),
                    read: false,
                }),
            })
        } catch (error) {
            console.error("Error sending notification:", error)
            throw error
        }
    },

    async sendBulkNotification(userIds: string[], title: string, message: string): Promise<void> {
        try {
            const batch = []
            for (const userId of userIds) {
                batch.push(this.sendCustomNotification({ userId, title, message }))
            }
            await Promise.all(batch)
        } catch (error) {
            console.error("Error sending bulk notification:", error)
            throw error
        }
    },
}
