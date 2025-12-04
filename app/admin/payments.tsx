"use client"

import { db } from "@/config/firebase"
import { Colors } from "@/constants/Colors"
import { collection, getDocs } from "firebase/firestore"
import { Calendar, CheckCircle2, Mail, MapPin, Package, Phone, TrendingUp } from "lucide-react-native"
import { useCallback, useEffect, useState } from "react"
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

interface DeliveredOrder {
  id: string
  orderId: string
  userId: string
  userName: string
  userEmail: string
  userPhone: string
  items: any[]
  totalAmount: number
  deliveryAddress: string
  paymentMethod: string
  deliveredAt: any
  createdAt: string
}

export default function AdminPayments() {
  const [deliveredOrders, setDeliveredOrders] = useState<DeliveredOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [transactionCount, setTransactionCount] = useState(0)

  const fetchDeliveredOrders = useCallback(async () => {
    try {
      const snapshot = await getDocs(collection(db, "DeliveredOrders"))
      const orders: DeliveredOrder[] = []
      snapshot.forEach((doc) => {
        orders.push({ id: doc.id, ...doc.data() } as DeliveredOrder)
      })

      // Sort by delivered date (newest first)
      orders.sort((a, b) => {
        const dateA = a.deliveredAt?.toDate?.() || new Date(a.createdAt)
        const dateB = b.deliveredAt?.toDate?.() || new Date(b.createdAt)
        return dateB.getTime() - dateA.getTime()
      })

      setDeliveredOrders(orders)

      // Calculate totals
      const revenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0)
      setTotalRevenue(revenue)
      setTransactionCount(orders.length)
    } catch (error) {
      console.error("Error fetching delivered orders:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchDeliveredOrders()
  }, [fetchDeliveredOrders])

  const onRefresh = () => {
    setRefreshing(true)
    fetchDeliveredOrders()
  }

  const formatDateTime = (order: DeliveredOrder) => {
    try {
      let date: Date
      if (order.deliveredAt?.toDate) {
        date = order.deliveredAt.toDate()
      } else if (order.createdAt) {
        date = new Date(order.createdAt)
      } else {
        return "N/A"
      }
      return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return "N/A"
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Payment & Revenue</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <View style={styles.iconContainer}>
              <TrendingUp size={20} color={Colors.primary} />
            </View>
            <Text style={styles.summaryLabel}>Total Revenue</Text>
            <Text style={styles.summaryValue}>₹{totalRevenue.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <View style={styles.iconContainer}>
              <CheckCircle2 size={20} color="#10B981" />
            </View>
            <Text style={styles.summaryLabel}>Transactions</Text>
            <Text style={styles.summaryValue}>{transactionCount}</Text>
          </View>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={deliveredOrders}
          keyExtractor={(item) => item.id || item.orderId}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.orderId}>#{item.orderId?.substring(0, 12) || "N/A"}</Text>
                <Text style={styles.amount}>₹{item.totalAmount?.toFixed(2) || "0.00"}</Text>
              </View>

              {/* User Info Section */}
              <View style={styles.userSection}>
                <Text style={styles.userName}>{item.userName || "Unknown"}</Text>
                <View style={styles.userInfoRow}>
                  <Mail size={12} color={Colors.textMuted} />
                  <Text style={styles.userInfoText}>{item.userEmail || "N/A"}</Text>
                </View>
                <View style={styles.userInfoRow}>
                  <Phone size={12} color={Colors.textMuted} />
                  <Text style={styles.userInfoText}>{item.userPhone || "N/A"}</Text>
                </View>
                <View style={styles.userInfoRow}>
                  <MapPin size={12} color={Colors.textMuted} />
                  <Text style={styles.userInfoText} numberOfLines={1}>
                    {item.deliveryAddress || "N/A"}
                  </Text>
                </View>
              </View>

              {/* Items Section */}
              <View style={styles.itemsSection}>
                <View style={styles.itemsHeader}>
                  <Package size={14} color={Colors.charcoal} />
                  <Text style={styles.itemsTitle}>{item.items?.length || 0} Items</Text>
                </View>
                {item.items?.map((orderItem, idx) => (
                  <View key={idx} style={styles.itemRow}>
                    <Text style={styles.itemName} numberOfLines={1}>
                      {orderItem.name}
                    </Text>
                    <Text style={styles.itemQty}>x{orderItem.quantity || orderItem.totalQuantity || 1}</Text>
                    <Text style={styles.itemPrice}>
                      ₹{((orderItem.price || 0) * (orderItem.quantity || orderItem.totalQuantity || 1)).toFixed(2)}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={styles.cardFooter}>
                <View style={styles.detailsRow}>
                  <View style={styles.dateRow}>
                    <Calendar size={12} color={Colors.textMuted} />
                    <Text style={styles.date}>{formatDateTime(item)}</Text>
                  </View>
                  <View style={[styles.modeBadge, item.paymentMethod === "COD" ? styles.codBadge : styles.upiBadge]}>
                    <Text style={styles.modeText}>{item.paymentMethod || "N/A"}</Text>
                  </View>
                </View>
                <View style={styles.statusBadge}>
                  <CheckCircle2 size={12} color="#166534" />
                  <Text style={styles.statusText}>Delivered</Text>
                </View>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Package size={48} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No delivered orders yet</Text>
              <Text style={styles.emptyText}>Delivered orders will appear here</Text>
            </View>
          }
        />
      )}
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
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.charcoal,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: "row",
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconContainer: {
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  list: {
    padding: 20,
    gap: 12,
  },
  card: {
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 4,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  orderId: {
    fontSize: 14,
    fontWeight: "bold",
    color: Colors.charcoal,
  },
  amount: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.primary,
  },
  userSection: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  userName: {
    fontSize: 16,
    color: Colors.charcoal,
    fontWeight: "600",
    marginBottom: 8,
  },
  userInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  userInfoText: {
    fontSize: 12,
    color: Colors.textMuted,
    flex: 1,
  },
  itemsSection: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  itemsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  itemsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.charcoal,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    paddingLeft: 20,
  },
  itemName: {
    fontSize: 12,
    color: Colors.text,
    flex: 1,
  },
  itemQty: {
    fontSize: 12,
    color: Colors.textMuted,
    marginHorizontal: 8,
    minWidth: 30,
  },
  itemPrice: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.primary,
    minWidth: 60,
    textAlign: "right",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  date: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  modeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  codBadge: {
    backgroundColor: "#FEF3C7",
  },
  upiBadge: {
    backgroundColor: "#DBEAFE",
  },
  modeText: {
    fontSize: 10,
    fontWeight: "600",
    color: Colors.charcoal,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#166534",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.charcoal,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textMuted,
  },
})
