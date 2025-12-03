"use client"

import { db } from "@/config/firebase"
import { Colors } from "@/constants/Colors"
import { collection, getDocs } from "firebase/firestore"
import { AlertTriangle, Clock } from "lucide-react-native"
import { useEffect, useState } from "react"
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

interface ReminderAlert {
  id: string
  userName: string
  userEmail: string
  medicineName: string
  daysUntilReminder: number
  reminderDate: string
}

export default function AdminNotifications() {
  const [alerts, setAlerts] = useState<ReminderAlert[]>([])
  const [lowStockAlerts, setLowStockAlerts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchAlerts = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, "AllUsers"))
      const reminderAlerts: ReminderAlert[] = []
      const today = new Date()
      let alertId = 0

      usersSnapshot.forEach((userDoc) => {
        const userData = userDoc.data()
        if (userData.reminderDates && Array.isArray(userData.reminderDates)) {
          userData.reminderDates.forEach((reminder: any) => {
            const reminderDate = reminder.dueDate?.toDate?.() || new Date(reminder.dueDate)
            const daysUntilReminder = Math.ceil((reminderDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

            if (daysUntilReminder <= 5 && daysUntilReminder >= 0) {
              reminderAlerts.push({
                id: `reminder_${alertId++}`,
                userName: userData.name,
                userEmail: userData.email,
                medicineName: reminder.medicineName,
                daysUntilReminder,
                reminderDate: reminderDate.toLocaleDateString(),
              })
            }
          })
        }
      })

      // Fetch low stock medicines
      const medicinesSnapshot = await getDocs(collection(db, "AllMedicines"))
      const lowStock: any[] = []

      medicinesSnapshot.forEach((doc) => {
        const data = doc.data()
        const quantity = Number.parseInt(data.currentQuantity) || 0
        const threshold = Number.parseInt(data.lowStockAlert) || 0

        if (quantity <= threshold) {
          lowStock.push({
            id: doc.id,
            name: data.name,
            currentQuantity: quantity,
            lowStockAlert: threshold,
            type: "low_stock",
          })
        }
      })

      setAlerts(reminderAlerts.sort((a, b) => a.daysUntilReminder - b.daysUntilReminder))
      setLowStockAlerts(lowStock)
    } catch (error) {
      console.error(" Error fetching alerts:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchAlerts()
  }, [])

  const onRefresh = () => {
    setRefreshing(true)
    fetchAlerts()
  }

  const allAlerts = [...alerts.map((alert) => ({ ...alert, type: "reminder" })), ...lowStockAlerts]

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Alerts & Reminders</Text>
        <Text style={styles.subtitle}>Medicine reminders & stock alerts</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={allAlerts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => (
            <View style={[styles.card, item.type === "reminder" ? styles.reminderCard : styles.stockCard]}>
              <View style={[styles.iconContainer, item.type === "reminder" ? styles.reminderIcon : styles.stockIcon]}>
                {item.type === "reminder" ? (
                  <Clock size={20} color={item.daysUntilReminder <= 1 ? "#DC2626" : "#F59E0B"} />
                ) : (
                  <AlertTriangle size={20} color="#DC2626" />
                )}
              </View>
              <View style={styles.content}>
                <View style={styles.row}>
                  <Text style={styles.user}>{item.type === "reminder" ? item.userName : item.name}</Text>
                  {item.type === "reminder" && (
                    <View
                      style={[
                        styles.daysBadge,
                        item.daysUntilReminder <= 1
                          ? styles.urgentBadge
                          : item.daysUntilReminder <= 3
                            ? styles.warningBadge
                            : styles.normalBadge,
                      ]}
                    >
                      <Text style={styles.daysText}>{item.daysUntilReminder}d</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.message}>
                  {item.type === "reminder"
                    ? `Reminder for ${item.medicineName} due on ${item.reminderDate}`
                    : `Low stock alert: ${item.currentQuantity} units (Threshold: ${item.lowStockAlert})`}
                </Text>
                {item.type === "reminder" && <Text style={styles.email}>{item.userEmail}</Text>}
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No active alerts</Text>
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
    paddingBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.charcoal,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 4,
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
    flexDirection: "row",
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  reminderCard: {
    borderLeftWidth: 4,
    borderLeftColor: "#F59E0B",
  },
  stockCard: {
    borderLeftWidth: 4,
    borderLeftColor: "#DC2626",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  reminderIcon: {
    backgroundColor: "#FEF3C7",
  },
  stockIcon: {
    backgroundColor: "#FEE2E2",
  },
  content: {
    flex: 1,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  user: {
    fontSize: 14,
    fontWeight: "bold",
    color: Colors.charcoal,
    flex: 1,
  },
  daysBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  urgentBadge: {
    backgroundColor: "#FEE2E2",
  },
  warningBadge: {
    backgroundColor: "#FEF3C7",
  },
  normalBadge: {
    backgroundColor: "#DBEAFE",
  },
  daysText: {
    fontSize: 10,
    fontWeight: "bold",
    color: Colors.charcoal,
  },
  message: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 18,
    marginBottom: 4,
  },
  email: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textMuted,
  },
})
