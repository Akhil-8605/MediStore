"use client"

import { Colors } from "@/constants/Colors"
import { router } from "expo-router"
import { DollarSign, ShoppingBag, Users, Pill, Clock } from "lucide-react-native"
import { useEffect } from "react"
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, RefreshControl } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useAdmin } from "@/context/AdminContext"
import { useAuth } from "@/context/AuthContext"

export default function AdminDashboard() {
  const { stats, lowStockMedicines, recentActivity, loading, refreshDashboard } = useAdmin()
  const { logout } = useAuth()

  useEffect(() => {
    refreshDashboard()
  }, [refreshDashboard])

  const STATS = [
    {
      title: "Total Revenue",
      value: `$${stats?.totalRevenue.toFixed(2) || "0.00"}`,
      icon: DollarSign,
      color: "#059669",
      bg: "#D1FAE5",
    },
    {
      title: "Total Orders",
      value: stats?.totalOrders || "0",
      icon: ShoppingBag,
      color: "#2563EB",
      bg: "#DBEAFE",
    },
    {
      title: "Active Users",
      value: stats?.totalUsers || "0",
      icon: Users,
      color: "#7C3AED",
      bg: "#EDE9FE",
    },
    {
      title: "Stock Medicines",
      value: stats?.totalMedicines || "0",
      icon: Pill,
      color: "#EA580C",
      bg: "#FFEDD5",
    },
  ]

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refreshDashboard} />}
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
            <Text style={styles.sectionTitle}>Low Stock Alerts</Text>
            <TouchableOpacity onPress={() => router.push("/admin/medicines")}>
              <Text style={styles.seeAll}>Manage Stock</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={Colors.primary} />
          ) : lowStockMedicines.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>All medicines are well stocked!</Text>
            </View>
          ) : (
            lowStockMedicines.map((item) => (
              <View key={item.id} style={styles.alertCard}>
                <View style={styles.alertInfo}>
                  <Text style={styles.alertName}>{item.name}</Text>
                  <Text style={styles.alertStock}>
                    Stock: <Text style={{ fontWeight: "bold" }}>{item.currentQuantity}</Text> / {item.lowStockAlert}{" "}
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

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <Text style={styles.seeAll}>Today</Text>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={Colors.primary} />
          ) : recentActivity.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No recent activity to show.</Text>
            </View>
          ) : (
            recentActivity.slice(0, 5).map((activity) => (
              <View key={activity.id} style={styles.activityCard}>
                <View style={styles.activityIconContainer}>
                  <Clock size={16} color={Colors.primary} />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityMessage}>{activity.message}</Text>
                  <Text style={styles.activityTime}>{activity.timestamp.toDate().toLocaleTimeString()}</Text>
                </View>
                {activity.details?.amount && (
                  <Text style={styles.activityAmount}>${activity.details.amount.toFixed(2)}</Text>
                )}
              </View>
            ))
          )}
        </View>
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
