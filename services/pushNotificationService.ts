import * as Notifications from "expo-notifications"
import * as Device from "expo-device"
import { Platform } from "react-native"
import { doc, updateDoc, getDoc, setDoc, onSnapshot, collection, query, orderBy, limit } from "firebase/firestore"
import { db } from "../config/firebase"
import { router } from "expo-router"

// Configure notification handler for foreground notifications
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
})

export interface PushNotification {
    id: string
    title: string
    body: string
    data?: {
        type?: "order" | "alert" | "reminder" | "new_user" | "new_order" | "low_stock" | "general"
        orderId?: string
        userId?: string
        screen?: string
        [key: string]: any
    }
    timestamp: string
    read: boolean
}

export interface AdminNotification {
    id: string
    title: string
    body: string
    type: "new_order" | "new_user" | "alert" | "low_stock"
    data?: any
    timestamp: string
    read: boolean
}

class PushNotificationService {
    private expoPushToken: string | null = null
    private notificationListener: Notifications.EventSubscription | null = null
    private responseListener: Notifications.EventSubscription | null = null
    private adminNotificationUnsubscribe: (() => void) | null = null

    // Initialize push notifications
    async initialize(userId?: string, isAdmin = false): Promise<string | null> {
        try {
            // Check if physical device
            if (!Device.isDevice) {
                console.log("Push notifications require a physical device")
                return null
            }

            // Request permissions
            const { status: existingStatus } = await Notifications.getPermissionsAsync()
            let finalStatus = existingStatus

            if (existingStatus !== "granted") {
                const { status } = await Notifications.requestPermissionsAsync()
                finalStatus = status
            }

            if (finalStatus !== "granted") {
                console.log("Failed to get push notification permissions")
                return null
            }

            // Get Expo push token
            const tokenData = await Notifications.getExpoPushTokenAsync({
                projectId: "f71e06e7-a811-4411-9c7d-5b4974a88c83",
            })
            this.expoPushToken = tokenData.data

            // Configure Android channel for high priority notifications
            if (Platform.OS === "android") {
                await Notifications.setNotificationChannelAsync("default", {
                    name: "Default",
                    importance: Notifications.AndroidImportance.MAX,
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: "#009521",
                    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
                    bypassDnd: true,
                    enableVibrate: true,
                    enableLights: true,
                    sound: "default",
                })

                await Notifications.setNotificationChannelAsync("orders", {
                    name: "Orders",
                    importance: Notifications.AndroidImportance.MAX,
                    vibrationPattern: [0, 500, 250, 500],
                    lightColor: "#009521",
                    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
                    bypassDnd: true,
                    enableVibrate: true,
                    enableLights: true,
                    sound: "default",
                })

                await Notifications.setNotificationChannelAsync("alerts", {
                    name: "Alerts",
                    importance: Notifications.AndroidImportance.MAX,
                    vibrationPattern: [0, 1000, 500, 1000],
                    lightColor: "#EF4444",
                    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
                    bypassDnd: true,
                    enableVibrate: true,
                    enableLights: true,
                    sound: "default",
                })
            }

            // Save token to user document if userId provided
            if (userId) {
                await this.saveTokenToFirestore(userId, this.expoPushToken, isAdmin)
            }

            // Set up notification listeners
            this.setupNotificationListeners(isAdmin)

            // If admin, set up real-time listeners for admin notifications
            if (isAdmin) {
                this.setupAdminNotificationListeners()
            }

            return this.expoPushToken
        } catch (error) {
            console.error("Error initializing push notifications:", error)
            return null
        }
    }

    // Save FCM/Expo token to Firestore
    private async saveTokenToFirestore(userId: string, token: string, isAdmin: boolean): Promise<void> {
        try {
            if (isAdmin) {
                // Save admin token to AdminConfig collection
                const adminTokenRef = doc(db, "AdminConfig", "pushTokens")
                const adminTokenDoc = await getDoc(adminTokenRef)

                if (adminTokenDoc.exists()) {
                    const tokens = adminTokenDoc.data().tokens || []
                    if (!tokens.includes(token)) {
                        await updateDoc(adminTokenRef, {
                            tokens: [...tokens, token],
                            updatedAt: new Date().toISOString(),
                        })
                    }
                } else {
                    await setDoc(adminTokenRef, {
                        tokens: [token],
                        updatedAt: new Date().toISOString(),
                    })
                }
            } else {
                // Save user token
                const userRef = doc(db, "AllUsers", userId)
                await updateDoc(userRef, {
                    pushToken: token,
                    pushTokenUpdatedAt: new Date().toISOString(),
                })
            }
        } catch (error) {
            console.error("Error saving push token:", error)
        }
    }

    // Set up notification listeners
    private setupNotificationListeners(isAdmin: boolean): void {
        // Handle notification received while app is in foreground
        this.notificationListener = Notifications.addNotificationReceivedListener((notification) => {
            console.log("Notification received:", notification)
        })

        // Handle notification response (user tapped notification)
        this.responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
            const data = response.notification.request.content.data
            this.handleNotificationNavigation(data, isAdmin)
        })
    }

    // Handle navigation when notification is tapped
    private handleNotificationNavigation(data: any, isAdmin: boolean): void {
        if (isAdmin) {
            // Admin navigation
            switch (data?.type) {
                case "new_order":
                    router.push("/admin/orders")
                    break
                case "new_user":
                    router.push("/admin/users")
                    break
                case "alert":
                case "low_stock":
                    router.push("/admin/alerts")
                    break
                default:
                    router.push("/admin/notifications")
            }
        } else {
            // User navigation - always go to notifications screen
            router.push("/user/notification")
        }
    }

    // Set up real-time listeners for admin notifications
    private setupAdminNotificationListeners(): void {
        // Listen for new orders
        const ordersQuery = query(collection(db, "PendingOrders"), orderBy("createdAt", "desc"), limit(1))

        let lastOrderTimestamp: string | null = null

        this.adminNotificationUnsubscribe = onSnapshot(ordersQuery, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === "added") {
                    const orderData = change.doc.data()
                    const orderTimestamp = orderData.createdAt

                    // Only notify for genuinely new orders (not on initial load)
                    if (lastOrderTimestamp && orderTimestamp > lastOrderTimestamp) {
                        this.sendLocalNotification({
                            title: "New Order Received!",
                            body: `Order from ${orderData.userName || "Customer"} - Rs. ${orderData.total?.toFixed(2) || "0.00"}`,
                            data: {
                                type: "new_order",
                                orderId: change.doc.id,
                            },
                            channelId: "orders",
                        })
                    }
                    lastOrderTimestamp = orderTimestamp
                }
            })
        })
    }

    // Send local notification
    async sendLocalNotification(config: {
        title: string
        body: string
        data?: any
        channelId?: string
    }): Promise<void> {
        try {
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: config.title,
                    body: config.body,
                    data: config.data || {},
                    sound: true,
                },
                trigger: null, // Send immediately
            })
        } catch (error) {
            console.error("Error sending local notification:", error)
        }
    }

    // Send push notification to specific user via Expo Push API
    async sendPushNotificationToUser(
        userId: string,
        notification: {
            title: string
            body: string
            data?: any
        },
    ): Promise<boolean> {
        try {
            const userRef = doc(db, "AllUsers", userId)
            const userDoc = await getDoc(userRef)

            if (!userDoc.exists()) return false

            const userData = userDoc.data()
            const pushToken = userData.pushToken

            if (!pushToken) {
                console.log("User has no push token")
                return false
            }

            // Send via Expo Push API
            const message = {
                to: pushToken,
                sound: "default",
                title: notification.title,
                body: notification.body,
                data: notification.data || {},
                priority: "high",
                channelId: "default",
            }

            const response = await fetch("https://exp.host/--/api/v2/push/send", {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Accept-encoding": "gzip, deflate",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(message),
            })

            const result = await response.json()
            return result.data?.status === "ok"
        } catch (error) {
            console.error("Error sending push notification:", error)
            return false
        }
    }

    // Send push notification to all admins
    async sendPushNotificationToAdmins(notification: {
        title: string
        body: string
        data?: any
    }): Promise<void> {
        try {
            const adminTokenRef = doc(db, "AdminConfig", "pushTokens")
            const adminTokenDoc = await getDoc(adminTokenRef)

            if (!adminTokenDoc.exists()) return

            const tokens = adminTokenDoc.data().tokens || []

            if (tokens.length === 0) return

            const messages = tokens.map((token: string) => ({
                to: token,
                sound: "default",
                title: notification.title,
                body: notification.body,
                data: notification.data || {},
                priority: "high",
                channelId: notification.data?.type === "alert" ? "alerts" : "orders",
            }))

            await fetch("https://exp.host/--/api/v2/push/send", {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Accept-encoding": "gzip, deflate",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(messages),
            })
        } catch (error) {
            console.error("Error sending push notification to admins:", error)
        }
    }

    // Store admin notification in Firestore
    async storeAdminNotification(notification: Omit<AdminNotification, "id" | "timestamp" | "read">): Promise<void> {
        try {
            const notificationId = `${Date.now()}`
            const notificationRef = doc(db, "AdminNotifications", notificationId)
            await setDoc(notificationRef, {
                ...notification,
                id: notificationId,
                timestamp: new Date().toISOString(),
                read: false,
            })
        } catch (error) {
            console.error("Error storing admin notification:", error)
        }
    }

    // Get push token
    getToken(): string | null {
        return this.expoPushToken
    }

    // Cleanup listeners
    cleanup(): void {
        if (this.notificationListener) {
            this.notificationListener.remove()
            this.notificationListener = null
        }
        if (this.responseListener) {
            this.responseListener.remove()
            this.responseListener = null
        }
        if (this.adminNotificationUnsubscribe) {
            this.adminNotificationUnsubscribe()
            this.adminNotificationUnsubscribe = null
        }
    }

    // Set badge count
    async setBadgeCount(count: number): Promise<void> {
        try {
            await Notifications.setBadgeCountAsync(count)
        } catch (error) {
            console.error("Error setting badge count:", error)
        }
    }
}

export const pushNotificationService = new PushNotificationService()

// Helper functions for common notification scenarios
export const notifyUserOrderPlaced = async (userId: string, orderId: string, total: number) => {
    await pushNotificationService.sendPushNotificationToUser(userId, {
        title: "Order Placed Successfully!",
        body: `Your order #${orderId.substring(0, 8)} for Rs. ${total.toFixed(2)} has been confirmed.`,
        data: { type: "order", orderId, screen: "/user/notification" },
    })
}

export const notifyUserOrderStatusChanged = async (userId: string, orderId: string, status: string) => {
    const statusMessages: Record<string, { title: string; body: string }> = {
        delivered: {
            title: "Order Delivered!",
            body: `Your order #${orderId.substring(0, 8)} has been delivered. Thank you for shopping!`,
        },
        cancelled: {
            title: "Order Cancelled",
            body: `Your order #${orderId.substring(0, 8)} has been cancelled.`,
        },
        pending: {
            title: "Order Processing",
            body: `Your order #${orderId.substring(0, 8)} is being processed.`,
        },
    }

    const message = statusMessages[status] || {
        title: "Order Update",
        body: `Your order #${orderId.substring(0, 8)} status has been updated to ${status}.`,
    }

    await pushNotificationService.sendPushNotificationToUser(userId, {
        ...message,
        data: { type: "order", orderId, status, screen: "/user/notification" },
    })
}

export const notifyAdminNewOrder = async (orderData: { orderId: string; userName: string; total: number }) => {
    const notification = {
        title: "New Order Received!",
        body: `Order from ${orderData.userName} - Rs. ${orderData.total.toFixed(2)}`,
        data: { type: "new_order" as const, orderId: orderData.orderId },
    }

    await pushNotificationService.sendPushNotificationToAdmins(notification)
    await pushNotificationService.storeAdminNotification({
        title: notification.title,
        body: notification.body,
        type: "new_order",
        data: notification.data,
    })
}

export const notifyAdminNewUser = async (userData: { name: string; email: string; userId: string }) => {
    const notification = {
        title: "New User Registered!",
        body: `${userData.name} (${userData.email}) just signed up.`,
        data: { type: "new_user" as const, userId: userData.userId },
    }

    await pushNotificationService.sendPushNotificationToAdmins(notification)
    await pushNotificationService.storeAdminNotification({
        title: notification.title,
        body: notification.body,
        type: "new_user",
        data: notification.data,
    })
}

export const notifyAdminLowStock = async (medicineName: string, quantity: number) => {
    const notification = {
        title: "Low Stock Alert!",
        body: `${medicineName} is running low (${quantity} left).`,
        data: { type: "alert" as const },
    }

    await pushNotificationService.sendPushNotificationToAdmins(notification)
    await pushNotificationService.storeAdminNotification({
        title: notification.title,
        body: notification.body,
        type: "low_stock",
        data: notification.data,
    })
}
