"use client"

import { Colors } from "../../constants/Colors"
import { router } from "expo-router"
import { DollarSign, ShoppingBag, Users, Pill, Clock, AlertTriangle } from "lucide-react-native"
import { useEffect, useState, useCallback } from "react"
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, RefreshControl } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useAuth } from "../../context/AuthContext"
import { collection, getDocs } from "firebase/firestore"
import { db } from "../../config/firebase"

interface DashboardStats {
  totalRevenue: number
  totalOrders: number
  totalUsers: number
  totalMedicines: number
  lowStockCount: number
}

interface Medicine {
  id: string
  name: string
  totalQuantity: number
  lowStockAlert: number
  type?: string
}

interface RecentActivity {
  id: string
  type: string
  message: string
  timestamp: any
  details?: any
}

export default function AdminDashboard() {
  const { logout } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [lowStockMedicines, setLowStockMedicines] = useState<Medicine[]>([])
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchDashboardData = useCallback(async () => {
    try {
      // Fetch all users and their orders
      const usersSnapshot = await getDocs(collection(db, "AllUsers"))
      let totalUsers = 0
      let totalOrders = 0
      const activities: RecentActivity[] = []
      const startOfDay = new Date()
      startOfDay.setDate(startOfDay.getDate() - 7) // Last 7 days
      startOfDay.setHours(0, 0, 0, 0)

      usersSnapshot.forEach((userDoc) => {
        totalUsers++
        const userData = userDoc.data()
        const orders = userData.orders || []
        totalOrders += orders.length

        // Collect recent activities
        orders.forEach((order: any) => {
          const orderDate = order.createdAt?.toDate?.() || new Date(order.createdAt)
          if (orderDate > startOfDay) {
            activities.push({
              id: order.orderId || Math.random().toString(),
              type: "order",
              message: `New order from ${userData.name || "User"}`,
              timestamp: order.createdAt,
              details: {
                userName: userData.name,
                amount: order.total || order.totalAmount,
                items: order.items,
              },
            })
          }
        })
      })

      // Fetch delivered orders for revenue
      const deliveredSnapshot = await getDocs(collection(db, "DeliveredOrders"))
      let totalRevenue = 0
      deliveredSnapshot.forEach((doc) => {
        const order = doc.data()
        totalRevenue += order.totalAmount || 0
      })

      // Fetch medicines for stock info
      const medicinesSnapshot = await getDocs(collection(db, "AllMedicines"))
      let totalMedicines = 0
      let lowStockCount = 0
      const lowStock: Medicine[] = []

      medicinesSnapshot.forEach((medDoc) => {
        const medicine = medDoc.data()
        totalMedicines++
        const qty = medicine.totalQuantity || 0
        const alert = medicine.lowStockAlert || 10
        if (qty <= alert) {
          lowStockCount++
          lowStock.push({
            id: medDoc.id,
            name: medicine.name,
            totalQuantity: qty,
            lowStockAlert: alert,
            type: medicine.type,
          })
        }
      })

      // Sort activities by timestamp (newest first)
      activities.sort((a, b) => {
        const dateA = a.timestamp?.toDate?.() || new Date(a.timestamp)
        const dateB = b.timestamp?.toDate?.() || new Date(b.timestamp)
        return dateB.getTime() - dateA.getTime()
      })

      // Sort low stock by quantity (lowest first)
      lowStock.sort((a, b) => a.totalQuantity - b.totalQuantity)

      setStats({
        totalRevenue,
        totalOrders,
        totalUsers,
        totalMedicines,
        lowStockCount,
      })
      setLowStockMedicines(lowStock)
      setRecentActivity(activities.slice(0, 10))
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  const onRefresh = () => {
    setRefreshing(true)
    fetchDashboardData()
  }

  const formatTime = (timestamp: any) => {
    try {
      const date = timestamp?.toDate?.() || new Date(timestamp)
      return date.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return "N/A"
    }
  }

  const STATS = [
    {
      title: "Total Revenue",
      value: `₹${stats?.totalRevenue?.toFixed(2) || "0.00"}`,
      icon: DollarSign,
      color: "#059669",
      bg: "#D1FAE5",
    },
    {
      title: "Total Orders",
      value: stats?.totalOrders?.toString() || "0",
      icon: ShoppingBag,
      color: "#2563EB",
      bg: "#DBEAFE",
    },
    {
      title: "Active Users",
      value: stats?.totalUsers?.toString() || "0",
      icon: Users,
      color: "#7C3AED",
      bg: "#EDE9FE",
    },
    {
      title: "Total Medicines",
      value: stats?.totalMedicines?.toString() || "0",
      icon: Pill,
      color: "#EA580C",
      bg: "#FFEDD5",
    },
  ]

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Dashboard</Text>
            <Text style={styles.subtitle}>Overview of your store performance</Text>
          </View>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={() => {
              logout()
              router.replace("/login")
            }}
          >
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          <>
            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              {STATS.map((stat, index) => (
                <View key={index} style={styles.statCard}>
                  <View style={[styles.iconContainer, { backgroundColor: stat.bg }]}>
                    <stat.icon size={24} color={stat.color} />
                  </View>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statTitle}>{stat.title}</Text>
                </View>
              ))}
            </View>

            {/* Low Stock Alerts */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <AlertTriangle size={18} color="#DC2626" />
                  <Text style={styles.sectionTitle}>Low Stock Alerts ({lowStockMedicines.length})</Text>
                </View>
                <TouchableOpacity onPress={() => router.push("/admin/medicines")}>
                  <Text style={styles.seeAll}>Manage Stock</Text>
                </TouchableOpacity>
              </View>

              {lowStockMedicines.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>All medicines are well stocked!</Text>
                </View>
              ) : (
                lowStockMedicines.slice(0, 5).map((item) => (
                  <View key={item.id} style={styles.alertCard}>
                    <View style={styles.alertInfo}>
                      <Text style={styles.alertName}>{item.name}</Text>
                      <Text style={styles.alertStock}>
                        Stock: <Text style={{ fontWeight: "bold" }}>{item.totalQuantity}</Text> / {item.lowStockAlert}{" "}
                        threshold
                      </Text>
                    </View>
                    <View style={styles.alertBadge}>
                      <Text style={styles.alertBadgeText}>Restock Needed</Text>
                    </View>
                  </View>
                ))
              )}
            </View>

            {/* Recent Activity */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Activity</Text>
                <Text style={styles.seeAll}>Last 7 days</Text>
              </View>

              {recentActivity.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>No recent activity to show.</Text>
                </View>
              ) : (
                recentActivity.map((activity) => (
                  <View key={activity.id} style={styles.activityCard}>
                    <View style={styles.activityIconContainer}>
                      <Clock size={16} color={Colors.primary} />
                    </View>
                    <View style={styles.activityContent}>
                      <Text style={styles.activityMessage}>{activity.message}</Text>
                      <Text style={styles.activityTime}>{formatTime(activity.timestamp)}</Text>
                    </View>
                    {activity.details?.amount && (
                      <Text style={styles.activityAmount}>₹{activity.details.amount.toFixed(2)}</Text>
                    )}
                  </View>
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 100,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.charcoal,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  logoutButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#FEE2E2",
    borderRadius: 8,
  },
  logoutText: {
    color: Colors.error,
    fontSize: 12,
    fontWeight: "600",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    width: "48%",
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "flex-start",
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.charcoal,
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.charcoal,
  },
  seeAll: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: "500",
  },
  alertCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFF1F2",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FECDD3",
    marginBottom: 12,
  },
  alertInfo: {
    flex: 1,
  },
  alertName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#881337",
    marginBottom: 4,
  },
  alertStock: {
    fontSize: 14,
    color: "#9F1239",
  },
  alertBadge: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  alertBadgeText: {
    fontSize: 10,
    color: Colors.error,
    fontWeight: "bold",
  },
  emptyCard: {
    backgroundColor: Colors.white,
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  emptyText: {
    color: Colors.textMuted,
  },
  activityCard: {
    flexDirection: "row",
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
    marginBottom: 12,
    alignItems: "center",
  },
  activityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  activityContent: {
    flex: 1,
  },
  activityMessage: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.charcoal,
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  activityAmount: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#059669",
  },
})
