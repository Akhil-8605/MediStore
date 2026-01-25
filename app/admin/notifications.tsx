"use client"

import { useState, useEffect, useCallback } from "react"
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Colors } from "../../constants/Colors"
import { Bell, BellRing, ShoppingCart, UserPlus, AlertTriangle, CheckCircle, X } from "lucide-react-native"
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from "firebase/firestore"
import { db } from "../../config/firebase"
import { router } from "expo-router"
import { pushNotificationService } from "../../services/pushNotificationService"

interface AdminNotification {
  id: string
  title: string
  body: string
  type: "new_order" | "new_user" | "alert" | "low_stock"
  data?: any
  timestamp: string
  read: boolean
}

export default function AdminNotificationsScreen() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([])
  const [loading, setLoading] = useState(false)

  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const notificationsQuery = query(collection(db, "AdminNotifications"), orderBy("timestamp", "desc"))
      const snapshot = await getDocs(notificationsQuery)
      const notifs: AdminNotification[] = []

      snapshot.forEach((docSnap) => {
        notifs.push({
          id: docSnap.id,
          ...docSnap.data(),
        } as AdminNotification)
      })

      setNotifications(notifs)

      // Update badge count
      const unreadCount = notifs.filter((n) => !n.read).length
      pushNotificationService.setBadgeCount(unreadCount)
    } catch (error) {
      console.error("Error fetching admin notifications:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNotifications()

    // Initialize push notifications for admin
    pushNotificationService.initialize(undefined, true)
  }, [fetchNotifications])

  const handleMarkAsRead = async (notification: AdminNotification) => {
    if (notification.read) return

    try {
      await updateDoc(doc(db, "AdminNotifications", notification.id), {
        read: true,
      })
      fetchNotifications()
    } catch (error) {
      console.error("Error marking as read:", error)
    }
  }

  const handleDeleteNotification = async (notification: AdminNotification) => {
    try {
      await deleteDoc(doc(db, "AdminNotifications", notification.id))
      fetchNotifications()
    } catch (error) {
      console.error("Error deleting notification:", error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter((n) => !n.read)
      await Promise.all(unreadNotifications.map((n) => updateDoc(doc(db, "AdminNotifications", n.id), { read: true })))
      fetchNotifications()
    } catch (error) {
      console.error("Error marking all as read:", error)
    }
  }

  const handleNotificationTap = (notification: AdminNotification) => {
    handleMarkAsRead(notification)

    switch (notification.type) {
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
    }
  }

  const formatDate = (timestamp: string) => {
    try {
      const date = new Date(timestamp)
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
    } catch {
      return "N/A"
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "new_order":
        return ShoppingCart
      case "new_user":
        return UserPlus
      case "alert":
      case "low_stock":
        return AlertTriangle
      default:
        return Bell
    }
  }

  const getIconColors = (type: string, read: boolean) => {
    if (read) {
      return { bg: "#F3F4F6", icon: Colors.textMuted }
    }

    switch (type) {
      case "new_order":
        return { bg: "#DBEAFE", icon: "#2563EB" }
      case "new_user":
        return { bg: "#DCFCE7", icon: "#059669" }
      case "alert":
      case "low_stock":
        return { bg: "#FEE2E2", icon: "#DC2626" }
      default:
        return { bg: Colors.logoback, icon: Colors.primary }
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  const renderNotificationCard = ({ item }: { item: AdminNotification }) => {
    const IconComponent = getNotificationIcon(item.type)
    const colors = getIconColors(item.type, item.read)

    return (
      <TouchableOpacity
        style={[styles.card, !item.read && styles.unreadCard]}
        onPress={() => handleNotificationTap(item)}
        activeOpacity={0.7}
      >
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

        <View style={styles.messageContainer}>
          <Text style={styles.message}>{item.body}</Text>
        </View>

        <View style={styles.typeTag}>
          <Text style={[styles.typeTagText, { color: colors.icon }]}>{item.type.replace("_", " ").toUpperCase()}</Text>
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIconContainer}>
            <BellRing size={24} color={Colors.primary} />
          </View>
          <View>
            <Text style={styles.headerTitle}>Admin Notifications</Text>
            <Text style={styles.headerSubtitle}>
              {unreadCount > 0 ? `${unreadCount} unread alerts` : "All caught up!"}
            </Text>
          </View>
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity style={styles.markAllButton} onPress={handleMarkAllAsRead}>
            <CheckCircle size={16} color={Colors.primary} />
            <Text style={styles.markAllText}>Mark all</Text>
          </TouchableOpacity>
        )}
      </View>

      {notifications.length > 0 && (
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: "#DBEAFE" }]}>
              <ShoppingCart size={16} color="#2563EB" />
            </View>
            <Text style={styles.statValue}>{notifications.filter((n) => n.type === "new_order").length}</Text>
            <Text style={styles.statLabel}>Orders</Text>
          </View>
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: "#DCFCE7" }]}>
              <UserPlus size={16} color="#059669" />
            </View>
            <Text style={styles.statValue}>{notifications.filter((n) => n.type === "new_user").length}</Text>
            <Text style={styles.statLabel}>Users</Text>
          </View>
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: "#FEE2E2" }]}>
              <AlertTriangle size={16} color="#DC2626" />
            </View>
            <Text style={styles.statValue}>
              {notifications.filter((n) => n.type === "alert" || n.type === "low_stock").length}
            </Text>
            <Text style={styles.statLabel}>Alerts</Text>
          </View>
        </View>
      )}

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
            <Text style={styles.emptyText}>New orders, user registrations, and alerts will appear here</Text>
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
    fontSize: 20,
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
    paddingHorizontal: 12,
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
    gap: 6,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.charcoal,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textMuted,
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
  typeTag: {
    paddingLeft: 60,
  },
  typeTagText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
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
