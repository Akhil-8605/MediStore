"use client"

import { db } from "../../config/firebase"
import { Colors } from "../../constants/Colors"
import { useAuth } from "../../context/AuthContext"
import { useCart } from "../../context/CartContext"
import { router } from "expo-router"
import { arrayRemove, doc, getDoc, updateDoc } from "firebase/firestore"
import { AlertCircle, Bell, CheckCircle, ChevronRight, Clock, Package, ShoppingCart, Trash2 } from "lucide-react-native"
import { useCallback, useEffect, useState } from "react"
import { Alert, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

interface Notification {
    id: string
    title: string
    message: string
    timestamp: string
    read: boolean
    type?: string
    orderId?: string
    hasReorderButton?: boolean
    items?: any[]
}

export default function NotificationsScreen() {
    const { user } = useAuth()
    const { addToCart } = useCart()
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(false)

    const formatDate = (dateString: string) => {
        try {
            let date: Date

            if (typeof dateString === "string") {
                date = new Date(dateString)
            } else if (dateString && typeof dateString === "object" && "toDate" in dateString) {
                date = (dateString as any).toDate()
            } else {
                return "Date unavailable"
            }

            if (isNaN(date.getTime())) {
                return "Date unavailable"
            }

            const now = new Date()
            const diffMs = now.getTime() - date.getTime()
            const diffMins = Math.floor(diffMs / 60000)
            const diffHours = Math.floor(diffMs / 3600000)
            const diffDays = Math.floor(diffMs / 86400000)

            if (diffMins < 1) return "Just now"
            if (diffMins < 60) return `${diffMins}m ago`
            if (diffHours < 24) return `${diffHours}h ago`
            if (diffDays < 7) return `${diffDays}d ago`

            return date.toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
            })
        } catch (error) {
            console.error("[v0] Date formatting error:", error)
            return "Invalid date"
        }
    }

    const fetchNotifications = useCallback(async () => {
        if (!user) return

        setLoading(true)
        try {
            const userDoc = await getDoc(doc(db, "AllUsers", user.uid))
            if (userDoc.exists()) {
                const notifications = userDoc.data().notifications || []
                setNotifications(
                    notifications.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
                )
            }
        } catch (error) {
            console.error("Error fetching notifications:", error)
            Alert.alert("Error", "Failed to load notifications")
        } finally {
            setLoading(false)
        }
    }, [user])

    useEffect(() => {
        fetchNotifications()
    }, [fetchNotifications])

    const handleReorderNow = async (notification: Notification) => {
        if (!user || !notification.orderId) return

        try {
            const userDoc = await getDoc(doc(db, "AllUsers", user.uid))
            if (userDoc.exists()) {
                const originalOrder = userDoc.data().orders?.find((o: any) => o.orderId === notification.orderId)

                if (originalOrder && originalOrder.items) {
                    for (const item of originalOrder.items) {
                        await addToCart(item, item.quantity || item.totalQuantity || 1)
                    }

                    await updateDoc(doc(db, "AllUsers", user.uid), {
                        notifications: arrayRemove(notification),
                    })

                    Alert.alert("Success", "Items added to cart!", [
                        {
                            text: "Go to Cart",
                            onPress: () => router.push("/user/cart"),
                        },
                        {
                            text: "Continue Shopping",
                            onPress: () => { },
                        },
                    ])

                    fetchNotifications()
                }
            }
        } catch (error) {
            console.error("Error processing reorder:", error)
            Alert.alert("Error", "Failed to add items to cart")
        }
    }

    const handleDeleteNotification = async (notification: Notification) => {
        if (!user) return

        try {
            await updateDoc(doc(db, "AllUsers", user.uid), {
                notifications: arrayRemove(notification),
            })
            fetchNotifications()
        } catch (error) {
            console.error("Error deleting notification:", error)
        }
    }

    const handleMarkAsRead = async (notification: Notification) => {
        if (!user || notification.read) return

        try {
            const userDoc = await getDoc(doc(db, "AllUsers", user.uid))
            if (userDoc.exists()) {
                const currentNotifications = userDoc.data().notifications || []
                const updatedNotifications = currentNotifications.map((n: Notification) =>
                    n.id === notification.id ? { ...n, read: true } : n,
                )
                await updateDoc(doc(db, "AllUsers", user.uid), {
                    notifications: updatedNotifications,
                })
                fetchNotifications()
            }
        } catch (error) {
            console.error("Error marking as read:", error)
        }
    }

    const getNotificationIcon = (type?: string) => {
        switch (type) {
            case "order_status":
                return Package
            case "reminder":
                return Clock
            case "success":
                return CheckCircle
            case "alert":
                return AlertCircle
            default:
                return Bell
        }
    }

    const getIconBgColor = (type?: string, read?: boolean) => {
        if (read) return "#F3F4F6"
        switch (type) {
            case "order_status":
                return "#DBEAFE"
            case "reminder":
                return "#FEF3C7"
            case "success":
                return "#DCFCE7"
            case "alert":
                return "#FEE2E2"
            default:
                return "#EDE9FE"
        }
    }

    const getIconColor = (type?: string, read?: boolean) => {
        if (read) return Colors.textMuted
        switch (type) {
            case "order_status":
                return "#2563EB"
            case "reminder":
                return "#D97706"
            case "success":
                return "#059669"
            case "alert":
                return "#DC2626"
            default:
                return "#7C3AED"
        }
    }

    const renderNotificationCard = ({ item }: { item: Notification }) => {
        const IconComponent = getNotificationIcon(item.type)
        const iconBgColor = getIconBgColor(item.type, item.read)
        const iconColor = getIconColor(item.type, item.read)

        return (
            <TouchableOpacity
                style={[styles.card, !item.read && styles.unreadCard]}
                onPress={() => handleMarkAsRead(item)}
                activeOpacity={0.7}
            >
                {/* Header Row */}
                <View style={styles.cardHeader}>
                    <View style={[styles.iconContainer, { backgroundColor: iconBgColor }]}>
                        <IconComponent size={20} color={iconColor} />
                    </View>
                    <View style={styles.headerContent}>
                        <View style={styles.titleRow}>
                            <Text style={[styles.notifTitle, !item.read && styles.unreadTitle]}>{item.title}</Text>
                            {!item.read && <View style={styles.unreadDot} />}
                        </View>
                        <Text style={styles.timestamp}>{formatDate(item.timestamp)}</Text>
                    </View>
                </View>

                {/* Message */}
                <View style={styles.messageContainer}>
                    <Text style={styles.message}>{item.message}</Text>
                </View>

                {/* Order ID if present */}
                {item.orderId && (
                    <View style={styles.orderIdContainer}>
                        <Package size={14} color={Colors.primary} />
                        <Text style={styles.orderIdText}>Order #{item.orderId.substring(0, 12)}</Text>
                    </View>
                )}

                {/* Actions */}
                <View style={styles.actionsContainer}>
                    {item.hasReorderButton && (
                        <TouchableOpacity style={styles.reorderButton} onPress={() => handleReorderNow(item)}>
                            <ShoppingCart size={16} color={Colors.white} />
                            <Text style={styles.reorderButtonText}>Reorder Now</Text>
                            <ChevronRight size={16} color={Colors.white} />
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity
                        style={[styles.deleteButton, item.hasReorderButton && styles.deleteButtonSmall]}
                        onPress={() => handleDeleteNotification(item)}
                    >
                        <Trash2 size={18} color={Colors.error} />
                        {!item.hasReorderButton && <Text style={styles.deleteButtonText}>Delete</Text>}
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        )
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>Notifications</Text>
                    <Text style={styles.headerSubtitle}>{notifications.filter((n) => !n.read).length} unread notifications</Text>
                </View>
            </View>

            <FlatList
                data={notifications}
                keyExtractor={(item) => item.id}
                renderItem={renderNotificationCard}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchNotifications} />}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyIconContainer}>
                            <Bell size={48} color={Colors.textMuted} />
                        </View>
                        <Text style={styles.emptyTitle}>No notifications yet</Text>
                        <Text style={styles.emptyText}>When you receive notifications, they will appear here</Text>
                    </View>
                }
            />
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        padding: 20,
        backgroundColor: Colors.white,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: "bold",
        color: Colors.charcoal,
    },
    headerSubtitle: {
        fontSize: 14,
        color: Colors.textMuted,
        marginTop: 4,
    },
    list: {
        padding: 16,
        gap: 12,
    },
    card: {
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.border,
        marginBottom: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    unreadCard: {
        borderLeftWidth: 4,
        borderLeftColor: Colors.primary,
        backgroundColor: "#FAFBFF",
    },
    cardHeader: {
        flexDirection: "row",
        gap: 12,
        marginBottom: 12,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    headerContent: {
        flex: 1,
    },
    titleRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    notifTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: Colors.charcoal,
        flex: 1,
    },
    unreadTitle: {
        fontWeight: "700",
        color: Colors.charcoal,
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.primary,
    },
    timestamp: {
        fontSize: 12,
        color: Colors.textMuted,
        marginTop: 2,
    },
    messageContainer: {
        marginBottom: 12,
        paddingLeft: 56,
    },
    message: {
        fontSize: 14,
        color: Colors.text,
        lineHeight: 20,
    },
    orderIdContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: "#F0F9FF",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        marginBottom: 12,
        marginLeft: 56,
        alignSelf: "flex-start",
    },
    orderIdText: {
        fontSize: 13,
        color: Colors.primary,
        fontWeight: "600",
    },
    actionsContainer: {
        flexDirection: "row",
        gap: 8,
        marginLeft: 56,
    },
    reorderButton: {
        flex: 1,
        backgroundColor: Colors.primary,
        borderRadius: 10,
        paddingVertical: 12,
        paddingHorizontal: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
    },
    reorderButtonText: {
        color: Colors.white,
        fontWeight: "600",
        fontSize: 14,
        flex: 1,
        textAlign: "center",
    },
    deleteButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 10,
        backgroundColor: "#FEF2F2",
        borderWidth: 1,
        borderColor: "#FECACA",
    },
    deleteButtonSmall: {
        paddingHorizontal: 12,
    },
    deleteButtonText: {
        color: Colors.error,
        fontWeight: "600",
        fontSize: 14,
    },
    emptyContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 80,
    },
    emptyIconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: "#F3F4F6",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: Colors.charcoal,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: Colors.textMuted,
        textAlign: "center",
        paddingHorizontal: 40,
    },
})
