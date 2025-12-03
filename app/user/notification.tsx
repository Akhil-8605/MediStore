"use client"

import { db } from "@/config/firebase"
import { Colors } from "@/constants/Colors"
import { useAuth } from "@/context/AuthContext"
import { arrayRemove, doc, getDoc, updateDoc } from "firebase/firestore"
import { Bell, Trash2, X } from "lucide-react-native"
import { useEffect, useState } from "react"
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    SectionList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

interface Notification {
    id: string
    title: string
    message: string
    createdAt: any
    read: boolean
}

export default function NotificationsScreen() {
    const { userData, user } = useAuth()
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)

    const fetchNotifications = async () => {
        try {
            if (!user?.uid) return

            const userRef = doc(db, "AllUsers", user.uid)
            const userSnap = await getDoc(userRef)

            if (userSnap.exists()) {
                const notifs = userSnap.data().notifications || []
                const sorted = notifs.sort((a: any, b: any) => {
                    const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt)
                    const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt)
                    return dateB - dateA
                })
                setNotifications(sorted)
            }
        } catch (error) {
            console.error(" Error fetching notifications:", error)
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    useEffect(() => {
        fetchNotifications()
    }, [user?.uid])

    const handleRefresh = () => {
        setRefreshing(true)
        fetchNotifications()
    }

    const handleDeleteNotification = async (notifId: string, notifData: Notification) => {
        try {
            if (!user?.uid) return

            const userRef = doc(db, "AllUsers", user.uid)
            await updateDoc(userRef, {
                notifications: arrayRemove({
                    id: notifData.id,
                    title: notifData.title,
                    message: notifData.message,
                    createdAt: notifData.createdAt,
                    read: notifData.read,
                }),
            })

            // Update local state
            setNotifications(notifications.filter((n) => n.id !== notifId))
            Alert.alert("Success", "Notification deleted")
        } catch (error) {
            console.error(" Error deleting notification:", error)
            Alert.alert("Error", "Failed to delete notification")
        }
    }

    const handleClearAll = () => {
        Alert.alert("Clear All Notifications", "Are you sure you want to delete all notifications?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete All",
                style: "destructive",
                onPress: async () => {
                    try {
                        if (!user?.uid) return

                        const userRef = doc(db, "AllUsers", user.uid)
                        await updateDoc(userRef, {
                            notifications: [],
                        })

                        setNotifications([])
                        Alert.alert("Success", "All notifications cleared")
                    } catch (error) {
                        console.error(" Error clearing notifications:", error)
                        Alert.alert("Error", "Failed to clear notifications")
                    }
                },
            },
        ])
    }

    // Group notifications by read status
    const unread = notifications.filter((n) => !n.read)
    const read = notifications.filter((n) => n.read)

    const sections = [
        ...(unread.length > 0 ? [{ title: "New", data: unread }] : []),
        ...(read.length > 0 ? [{ title: "Earlier", data: read }] : []),
    ]

    const getNotificationIcon = (title: string) => {
        if (title.includes("Order")) return "📦"
        if (title.includes("Delivery")) return "🚚"
        if (title.includes("Payment")) return "💳"
        if (title.includes("Reminder")) return "⏰"
        if (title.includes("Reorder")) return "🔄"
        return "📢"
    }

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Notifications</Text>
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            </SafeAreaView>
        )
    }

    if (notifications.length === 0) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Notifications</Text>
                </View>
                <View style={styles.emptyContainer}>
                    <Bell size={48} color={Colors.textMuted} />
                    <Text style={styles.emptyTitle}>No Notifications</Text>
                    <Text style={styles.emptyText}>You're all caught up! New updates will appear here</Text>
                </View>
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.headerSection}>
                <View style={styles.header}>
                    <Text style={styles.title}>Notifications</Text>
                    {notifications.length > 0 && (
                        <TouchableOpacity onPress={handleClearAll} style={styles.clearButton}>
                            <X size={20} color={Colors.error} />
                        </TouchableOpacity>
                    )}
                </View>
                {unread.length > 0 && (
                    <View style={styles.unreadBadgeContainer}>
                        <View style={styles.unreadBadge}>
                            <Text style={styles.unreadBadgeText}>{unread.length}</Text>
                        </View>
                        <Text style={styles.unreadText}>
                            {unread.length} unread notification{unread.length !== 1 ? "s" : ""}
                        </Text>
                    </View>
                )}
            </View>

            <SectionList
                sections={sections}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
                renderSectionHeader={({ section: { title } }) => <Text style={styles.sectionHeader}>{title}</Text>}
                renderItem={({ item }) => (
                    <View style={[styles.notificationCard, !item.read && styles.unreadCard]}>
                        <View style={styles.iconContainer}>
                            <Text style={styles.icon}>{getNotificationIcon(item.title)}</Text>
                            {!item.read && <View style={styles.unreadDot} />}
                        </View>

                        <View style={styles.content}>
                            <View style={styles.contentHeader}>
                                <Text style={styles.notificationTitle} numberOfLines={1}>
                                    {item.title}
                                </Text>
                                <Text style={styles.timestamp}>
                                    {item.createdAt?.toDate?.()?.toLocaleDateString?.() || new Date(item.createdAt).toLocaleDateString()}
                                </Text>
                            </View>
                            <Text style={[styles.notificationMessage, !item.read && styles.unreadMessage]} numberOfLines={2}>
                                {item.message}
                            </Text>
                        </View>

                        <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteNotification(item.id, item)}>
                            <Trash2 size={16} color={Colors.error} />
                        </TouchableOpacity>
                    </View>
                )}
            />
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    headerSection: {
        backgroundColor: Colors.white,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    header: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        color: Colors.charcoal,
    },
    clearButton: {
        padding: 8,
    },
    unreadBadgeContainer: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingBottom: 12,
        gap: 8,
    },
    unreadBadge: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
    },
    unreadBadgeText: {
        color: Colors.white,
        fontSize: 12,
        fontWeight: "bold",
    },
    unreadText: {
        fontSize: 12,
        color: Colors.text,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    list: {
        padding: 16,
    },
    sectionHeader: {
        fontSize: 14,
        fontWeight: "600",
        color: Colors.textMuted,
        marginBottom: 12,
        marginTop: 16,
    },
    notificationCard: {
        flexDirection: "row",
        backgroundColor: Colors.white,
        borderRadius: 12,
        padding: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: Colors.border,
        alignItems: "flex-start",
    },
    unreadCard: {
        backgroundColor: Colors.secondary,
        borderColor: Colors.primary,
    },
    iconContainer: {
        position: "relative",
        marginRight: 12,
    },
    icon: {
        fontSize: 24,
    },
    unreadDot: {
        position: "absolute",
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.primary,
        top: -4,
        right: -4,
    },
    content: {
        flex: 1,
    },
    contentHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 4,
    },
    notificationTitle: {
        fontSize: 14,
        fontWeight: "600",
        color: Colors.charcoal,
        flex: 1,
    },
    timestamp: {
        fontSize: 11,
        color: Colors.textMuted,
        marginLeft: 8,
    },
    notificationMessage: {
        fontSize: 13,
        color: Colors.textMuted,
        lineHeight: 18,
    },
    unreadMessage: {
        color: Colors.text,
    },
    deleteButton: {
        padding: 8,
        marginLeft: 8,
    },
    emptyContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: Colors.charcoal,
        marginTop: 16,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: Colors.textMuted,
        textAlign: "center",
    },
})
