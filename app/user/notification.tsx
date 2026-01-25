"use client"

import { db } from "../../config/firebase"
import { Colors } from "../../constants/Colors"
import { useAuth } from "../../context/AuthContext"
import { useCart } from "../../context/CartContext"
import { router } from "expo-router"
import { arrayRemove, doc, getDoc, updateDoc } from "firebase/firestore"
import {
    AlertCircle,
    Bell,
    BellRing,
    CheckCircle,
    ChevronRight,
    Clock,
    Package,
    ShoppingCart,
    X,
} from "lucide-react-native"
import { useCallback, useEffect, useState } from "react"
import {
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Animated,
    Dimensions,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { pushNotificationService } from "../../services/pushNotificationService"

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

const { width } = Dimensions.get("window")

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
            console.error("Date formatting error:", error)
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

                // Update badge count
                const unreadCount = notifications.filter((n: Notification) => !n.read).length
                pushNotificationService.setBadgeCount(unreadCount)
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

    const handleMarkAllAsRead = async () => {
        if (!user) return

        try {
            const userDoc = await getDoc(doc(db, "AllUsers", user.uid))
            if (userDoc.exists()) {
                const currentNotifications = userDoc.data().notifications || []
                const updatedNotifications = currentNotifications.map((n: Notification) => ({ ...n, read: true }))
                await updateDoc(doc(db, "AllUsers", user.uid), {
                    notifications: updatedNotifications,
                })
                fetchNotifications()
            }
        } catch (error) {
            console.error("Error marking all as read:", error)
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

    const getIconColors = (type?: string, read?: boolean) => {
        if (read) {
            return { bg: "#F3F4F6", icon: Colors.textMuted }
        }

        switch (type) {
            case "order_status":
                return { bg: Colors.logoback, icon: Colors.primary }
            case "reminder":
                return { bg: "#FEF3C7", icon: "#D97706" }
            case "success":
                return { bg: "#DCFCE7", icon: "#059669" }
            case "alert":
                return { bg: "#FEE2E2", icon: "#DC2626" }
            default:
                return { bg: Colors.logoback, icon: Colors.primary }
        }
    }

    const unreadCount = notifications.filter((n) => !n.read).length

    const renderNotificationCard = ({ item, index }: { item: Notification; index: number }) => {
        const IconComponent = getNotificationIcon(item.type)
        const colors = getIconColors(item.type, item.read)

        return (
            <Animated.View>
                <TouchableOpacity
                    style={[styles.card, !item.read && styles.unreadCard]}
                    onPress={() => handleMarkAsRead(item)}
                    activeOpacity={0.7}
                >
                    {/* Notification Header */}
                    <View style={styles.cardHeader}>
                        <View style={[styles.iconContainer, { backgroundColor: colors.bg }]}>
                            <IconComponent size={22} color={colors.icon} />
                        </View>
                        <View style={styles.headerContent}>
                            <View style={styles.titleRow}>
                                <Text style={[styles.notifTitle, !item.read && styles.unreadTitle]} numberOfLines={1}>
                                    {item.title}
                                </Text>
                                {!item.read && <View style={styles.unreadDot} />}
                            </View>
                            <Text style={styles.timestamp}>{formatDate(item.timestamp)}</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.deleteIconButton}
                            onPress={() => handleDeleteNotification(item)}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <X size={18} color={Colors.textMuted} />
                        </TouchableOpacity>
                    </View>

                    {/* Message */}
                    <View style={styles.messageContainer}>
                        <Text style={styles.message}>{item.message}</Text>
                    </View>

                    {/* Order ID Badge */}
                    {item.orderId && (
                        <View style={styles.orderIdContainer}>
                            <Package size={14} color={Colors.primary} />
                            <Text style={styles.orderIdText}>Order #{item.orderId.substring(0, 12)}</Text>
                        </View>
                    )}

                    {/* Reorder Button */}
                    {item.hasReorderButton && (
                        <TouchableOpacity style={styles.reorderButton} onPress={() => handleReorderNow(item)} activeOpacity={0.8}>
                            <ShoppingCart size={18} color={Colors.white} />
                            <Text style={styles.reorderButtonText}>Reorder Now</Text>
                            <ChevronRight size={18} color={Colors.white} />
                        </TouchableOpacity>
                    )}
                </TouchableOpacity>
            </Animated.View>
        )
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <View style={styles.headerIconContainer}>
                        <BellRing size={24} color={Colors.primary} />
                    </View>
                    <View>
                        <Text style={styles.headerTitle}>Notifications</Text>
                        <Text style={styles.headerSubtitle}>{unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}</Text>
                    </View>
                </View>
                {unreadCount > 0 && (
                    <TouchableOpacity style={styles.markAllButton} onPress={handleMarkAllAsRead}>
                        <CheckCircle size={16} color={Colors.primary} />
                        <Text style={styles.markAllText}>Mark all read</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Notification Stats */}
            {notifications.length > 0 && (
                <View style={styles.statsContainer}>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{notifications.length}</Text>
                        <Text style={styles.statLabel}>Total</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: Colors.primary }]}>{unreadCount}</Text>
                        <Text style={styles.statLabel}>Unread</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: "#059669" }]}>{notifications.length - unreadCount}</Text>
                        <Text style={styles.statLabel}>Read</Text>
                    </View>
                </View>
            )}

            {/* Notifications List */}
            <FlatList
                data={notifications}
                keyExtractor={(item) => item.id}
                renderItem={renderNotificationCard}
                contentContainerStyle={styles.list}
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={fetchNotifications} colors={[Colors.primary]} />
                }
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyIconContainer}>
                            <Bell size={56} color={Colors.textMuted} />
                        </View>
                        <Text style={styles.emptyTitle}>No notifications yet</Text>
                        <Text style={styles.emptyText}>
                            When you receive order updates, reminders, or alerts, they will appear here
                        </Text>
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
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: Colors.white,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    headerLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    headerIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Colors.logoback,
        alignItems: "center",
        justifyContent: "center",
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: "bold",
        color: Colors.charcoal,
    },
    headerSubtitle: {
        fontSize: 13,
        color: Colors.textMuted,
        marginTop: 2,
    },
    markAllButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: Colors.logoback,
        borderRadius: 20,
    },
    markAllText: {
        fontSize: 12,
        fontWeight: "600",
        color: Colors.primary,
    },
    statsContainer: {
        flexDirection: "row",
        backgroundColor: Colors.white,
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 16,
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderWidth: 1,
        borderColor: Colors.border,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    statItem: {
        flex: 1,
        alignItems: "center",
    },
    statValue: {
        fontSize: 24,
        fontWeight: "bold",
        color: Colors.charcoal,
    },
    statLabel: {
        fontSize: 12,
        color: Colors.textMuted,
        marginTop: 4,
    },
    statDivider: {
        width: 1,
        height: "100%",
        backgroundColor: Colors.border,
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
        marginBottom: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 2,
    },
    unreadCard: {
        borderLeftWidth: 4,
        borderLeftColor: Colors.primary,
        backgroundColor: "#FAFFFE",
    },
    cardHeader: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 12,
        marginBottom: 12,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 14,
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
    },
    unreadDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: Colors.primary,
    },
    timestamp: {
        fontSize: 12,
        color: Colors.textMuted,
        marginTop: 4,
    },
    deleteIconButton: {
        padding: 4,
    },
    messageContainer: {
        marginBottom: 12,
        paddingLeft: 60,
    },
    message: {
        fontSize: 14,
        color: Colors.text,
        lineHeight: 22,
    },
    orderIdContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: Colors.logoback,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 10,
        marginBottom: 12,
        marginLeft: 60,
        alignSelf: "flex-start",
    },
    orderIdText: {
        fontSize: 13,
        color: Colors.primary,
        fontWeight: "600",
    },
    reorderButton: {
        backgroundColor: Colors.primary,
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 20,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        marginLeft: 60,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    reorderButtonText: {
        color: Colors.white,
        fontWeight: "700",
        fontSize: 15,
        flex: 1,
        textAlign: "center",
    },
    emptyContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 80,
        paddingHorizontal: 40,
    },
    emptyIconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: "#F3F4F6",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 24,
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: "bold",
        color: Colors.charcoal,
        marginBottom: 12,
        textAlign: "center",
    },
    emptyText: {
        fontSize: 15,
        color: Colors.textMuted,
        textAlign: "center",
        lineHeight: 22,
    },
})
