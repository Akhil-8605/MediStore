"use client"

import { db } from "@/config/firebase"
import { Colors } from "@/constants/Colors"
import { collection, getDocs } from "firebase/firestore"
import { CheckCircle2 } from "lucide-react-native"
import { useEffect, useState } from "react"
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

interface Payment {
  id: string
  orderId: string
  userName: string
  amount: number
  mode: string
  date: string
  items: number
}

export default function AdminPayments() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [totalRevenue, setTotalRevenue] = useState(0)

  const fetchPayments = async () => {
    try {
      const paymentsSnapshot = await getDocs(collection(db, "AllPayments"))
      const paymentsList: Payment[] = []
      let revenue = 0

      paymentsSnapshot.forEach((doc) => {
        const data = doc.data()
        const amount = Number.parseFloat(data.amount) || 0
        revenue += amount
        paymentsList.push({
          id: doc.id,
          orderId: data.orderId || `#ORD-${doc.id.slice(0, 8)}`,
          userName: data.userName || "Unknown",
          amount,
          mode: data.mode || "Unknown",
          date: data.createdAt ? new Date(data.createdAt.toDate()).toLocaleDateString() : "Unknown",
          items: data.items?.length || 0,
        })
      })

      setPayments(
        paymentsList.sort((a, b) => {
          const dateA = new Date(a.date).getTime()
          const dateB = new Date(b.date).getTime()
          return dateB - dateA
        }),
      )
      setTotalRevenue(revenue)
    } catch (error) {
      console.error(" Error fetching payments:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchPayments()
  }, [])

  const onRefresh = () => {
    setRefreshing(true)
    fetchPayments()
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Payment History</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Revenue</Text>
            <Text style={styles.summaryValue}>${totalRevenue.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Transactions</Text>
            <Text style={styles.summaryValue}>{payments.length}</Text>
          </View>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={payments}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.orderId}>{item.orderId}</Text>
                <Text style={styles.amount}>${item.amount.toFixed(2)}</Text>
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.user}>{item.userName}</Text>
                <View style={styles.detailsRow}>
                  <Text style={styles.date}>{item.date}</Text>
                  <View style={[styles.modeBadge, item.mode === "COD" ? styles.codBadge : styles.upiBADGE]}>
                    <Text style={styles.modeText}>{item.mode}</Text>
                  </View>
                </View>
                <Text style={styles.itemsCount}>{item.items} items</Text>
              </View>
              <View style={styles.cardFooter}>
                <View style={styles.statusBadge}>
                  <CheckCircle2 size={12} color="#166534" />
                  <Text style={styles.statusText}>Completed</Text>
                </View>
              </View>
            </View>
          )}
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
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
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
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  orderId: {
    fontSize: 14,
    fontWeight: "bold",
    color: Colors.charcoal,
  },
  amount: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.primary,
  },
  cardBody: {
    marginBottom: 12,
  },
  user: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: 4,
    fontWeight: "500",
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  modeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  codBadge: {
    backgroundColor: "#FEF3C7",
  },
  upiBADGE: {
    backgroundColor: "#DBEAFE",
  },
  modeText: {
    fontSize: 10,
    fontWeight: "600",
    color: Colors.charcoal,
  },
  itemsCount: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  cardFooter: {
    flexDirection: "row",
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
})
