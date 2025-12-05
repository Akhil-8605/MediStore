"use client"

import { useState } from "react"
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Colors } from "../../constants/Colors"
import { Trash2, Plus, Minus } from "lucide-react-native"
import { Button } from "../../components/ui/Button"
import { useCart } from "../../context/CartContext"
import { router } from "expo-router"
import { useAuth } from "../../context/AuthContext"
import { Input } from "../../components/ui/Input"

export default function CartScreen() {
  const { items, total, removeFromCart, updateQuantity, clearCart } = useCart()
  const { userData } = useAuth()
  const [refreshing, setRefreshing] = useState(false)
  const [selectedReminder, setSelectedReminder] = useState<number>(0)
  const [customDays, setCustomDays] = useState<string>("")

  const finalTotal = total

  const handleRefresh = () => {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 500)
  }

  const handleCheckout = () => {
    if (items.length === 0) {
      Alert.alert("Error", "Cart is empty")
      return
    }

    const reminderDays = selectedReminder === -1 ? Number.parseInt(customDays || "0") : selectedReminder

    router.push({
      pathname: "/user/billing",
      params: { reminderDays: reminderDays.toString() },
    } as any)
  }

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Shopping Cart</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🛒</Text>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptyText}>Add some medicines to get started</Text>
          <Button title="Start Shopping" onPress={() => router.push("/user/search")} style={styles.emptyButton} />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Shopping Cart</Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardImage}>
              <Text style={{ fontSize: 24 }}>💊</Text>
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.cardSubtitle}>{item.category}</Text>
              <Text style={styles.price}>₹{(item.price * item.quantity).toFixed(2)}</Text>
            </View>
            <View style={styles.quantityControl}>
              <TouchableOpacity style={styles.qtyButton} onPress={() => updateQuantity(item.id, item.quantity - 1)}>
                <Minus size={16} color={Colors.primary} />
              </TouchableOpacity>
              <Text style={styles.quantity}>{item.quantity}</Text>
              <TouchableOpacity style={styles.qtyButton} onPress={() => updateQuantity(item.id, item.quantity + 1)}>
                <Plus size={16} color={Colors.primary} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.deleteButton} onPress={() => removeFromCart(item.id)}>
              <Trash2 size={20} color={Colors.error} />
            </TouchableOpacity>
          </View>
        )}
        ListFooterComponent={() => (
          <View style={styles.footer}>
            <View style={styles.reminderSection}>
              <Text style={styles.reminderTitle}>Remind me in (optional)</Text>
              <View style={styles.reminderButtonsContainer}>
                {[
                  { label: "No", value: 0 },
                  { label: "30 days", value: 30 },
                  { label: "60 days", value: 60 },
                  { label: "Custom", value: -1 },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[styles.reminderButton, selectedReminder === option.value && styles.reminderButtonActive]}
                    onPress={() => setSelectedReminder(option.value)}
                  >
                    <Text
                      style={[
                        styles.reminderButtonText,
                        selectedReminder === option.value && styles.reminderButtonTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {selectedReminder === -1 && (
                <View>
                  <Input
                    label="Days"
                    placeholder="Enter number of days"
                    value={customDays}
                    onChangeText={setCustomDays}
                    keyboardType="number-pad"
                  />
                </View>
              )}
            </View>

            <View style={styles.summary}>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Subtotal</Text>
                <Text style={styles.rowValue}>₹{total.toFixed(2)}</Text>
              </View>
              <View style={[styles.row, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>₹{finalTotal.toFixed(2)}</Text>
              </View>
            </View>

            <Button title="Proceed to Checkout" onPress={handleCheckout} size="lg" style={styles.checkoutButton} />
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
  },
  list: {
    padding: 20,
    gap: 16,
  },
  card: {
    flexDirection: "row",
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    gap: 12,
  },
  cardImage: {
    width: 64,
    height: 64,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.charcoal,
  },
  cardSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
  },
  price: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.primary,
    marginTop: 4,
  },
  quantityControl: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    paddingHorizontal: 4,
  },
  qtyButton: {
    padding: 6,
  },
  quantity: {
    marginHorizontal: 8,
    fontWeight: "600",
    color: Colors.text,
  },
  deleteButton: {
    padding: 8,
  },
  footer: {
    gap: 24,
    marginTop: 8,
  },
  reminderSection: {
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  reminderTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.charcoal,
  },
  reminderButtonsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  reminderButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    backgroundColor: Colors.white,
  },
  reminderButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  reminderButtonText: {
    fontSize: 12,
    color: Colors.text,
    fontWeight: "500",
  },
  reminderButtonTextActive: {
    color: Colors.white,
  },
  summary: {
    backgroundColor: Colors.white,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  rowLabel: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  rowValue: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: "500",
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 12,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.charcoal,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.primary,
  },
  checkoutButton: {
    marginBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.charcoal,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: "center",
    marginBottom: 24,
  },
  emptyButton: {
    width: "80%",
  },
})
