"use client"

import { useState } from "react"
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Colors } from "@/constants/Colors"
import { useAuth } from "@/context/AuthContext"
import { useCart } from "@/context/CartContext"
import type { Order } from "@/services/firestoreService"
import { Button } from "@/components/ui/Button"
import { MapPin } from "lucide-react-native"
import { router } from "expo-router"

export default function OrdersScreen() {
    const { userData } = useAuth()
    const { addToCart } = useCart()
    const [loading, setLoading] = useState(false)

    const orders: Order[] = userData?.orders || []

    const getStatusColor = (status: string) => {
        switch (status) {
            case "completed":
                return "#10B981"
            case "pending":
                return "#F59E0B"
            case "cancelled":
                return "#EF4444"
            default:
                return Colors.textMuted
        }
    }

    const getStatusIcon = (status: string) => {
        if (status === "completed") return "✓"
        if (status === "pending") return "⏱"
        return "✕"
    }

    const handleReorder = async (order: Order) => {
        try {
            setLoading(true)

            // Add all items from order to cart
            for (const item of order.items) {
                await addToCart(item, item.currentQuantity)
            }

            Alert.alert("Success", "Items added to cart!", [
                {
                    text: "View Cart",
                    onPress: () => router.push("/user/cart"),
                },
                {
                    text: "Continue Shopping",
                    onPress: () => router.back(),
                },
            ])
        } catch (error) {
            Alert.alert("Error", "Failed to reorder items")
        } finally {
            setLoading(false)
        }
    }

    if (orders.length === 0) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>My Orders</Text>
                </View>
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyIcon}>📦</Text>
                    <Text style={styles.emptyTitle}>No Orders Yet</Text>
                    <Text style={styles.emptyText}>Start shopping to see your orders here</Text>
                    <Button title="Start Shopping" onPress={() => router.push("/user/search")} style={styles.emptyButton} />
                </View>
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>My Orders</Text>
            </View>

            <FlatList
                data={orders}
                keyExtractor={(item) => item.orderId}
                contentContainerStyle={styles.list}
                renderItem={({ item }) => (
                    <View style={styles.orderCard}>
                        {/* Header */}
                        <View style={styles.cardHeader}>
                            <View style={styles.orderId}>
                                <Text style={styles.orderIdText}>{item.orderId}</Text>
                                <Text style={styles.orderDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                            </View>
                            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + "20" }]}>
                                <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                                    {getStatusIcon(item.status)} {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                                </Text>
                            </View>
                        </View>

                        {/* Items */}
                        <View style={styles.itemsContainer}>
                            <Text style={styles.itemsLabel}>Items ({item.items.length})</Text>
                            {item.items.slice(0, 2).map((product, index) => (
                                <Text key={index} style={styles.itemName}>
                                    • {product.name} x{product.currentQuantity}
                                </Text>
                            ))}
                            {item.items.length > 2 && <Text style={styles.moreItems}>+{item.items.length - 2} more items</Text>}
                        </View>

                        {/* Details */}
                        <View style={styles.details}>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Amount</Text>
                                <Text style={styles.detailValue}>₹{item.total.toFixed(2)}</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Payment</Text>
                                <Text style={styles.detailValue}>{item.paymentMethod}</Text>
                            </View>
                        </View>

                        {/* Address */}
                        <View style={styles.addressSection}>
                            <MapPin size={14} color={Colors.textMuted} />
                            <Text style={styles.addressText} numberOfLines={2}>
                                {item.deliveryAddress}
                            </Text>
                        </View>

                        {/* Actions */}
                        <View style={styles.actions}>
                            <TouchableOpacity
                                style={styles.viewButton}
                                onPress={() => {
                                    router.push({
                                        pathname: "/user/receipt",
                                        params: { orderId: item.orderId },
                                    })
                                }}
                            >
                                <Text style={styles.viewButtonText}>View Receipt</Text>
                            </TouchableOpacity>
                            {item.status !== "cancelled" && (
                                <TouchableOpacity
                                    style={[styles.reorderButton, loading && styles.disabledButton]}
                                    onPress={() => handleReorder(item)}
                                    disabled={loading}
                                >
                                    <Text style={styles.reorderButtonText}>Reorder</Text>
                                </TouchableOpacity>
                            )}
                        </View>
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
        paddingHorizontal: 20,
        paddingVertical: 16,
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
        padding: 16,
        gap: 12,
    },
    orderCard: {
        backgroundColor: Colors.white,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    orderId: {
        flex: 1,
    },
    orderIdText: {
        fontSize: 14,
        fontWeight: "600",
        color: Colors.charcoal,
    },
    orderDate: {
        fontSize: 12,
        color: Colors.textMuted,
        marginTop: 2,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 12,
        fontWeight: "600",
    },
    itemsContainer: {
        backgroundColor: "#F9FAFB",
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
    },
    itemsLabel: {
        fontSize: 12,
        fontWeight: "600",
        color: Colors.textMuted,
        marginBottom: 8,
    },
    itemName: {
        fontSize: 13,
        color: Colors.text,
        marginBottom: 4,
    },
    moreItems: {
        fontSize: 12,
        color: Colors.primary,
        fontWeight: "500",
        marginTop: 4,
    },
    details: {
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: Colors.border,
        paddingVertical: 12,
        marginBottom: 12,
    },
    detailRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 8,
    },
    detailLabel: {
        fontSize: 13,
        color: Colors.textMuted,
    },
    detailValue: {
        fontSize: 13,
        fontWeight: "600",
        color: Colors.text,
    },
    addressSection: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginBottom: 12,
        gap: 8,
    },
    addressText: {
        fontSize: 12,
        color: Colors.textMuted,
        flex: 1,
    },
    actions: {
        flexDirection: "row",
        gap: 8,
    },
    viewButton: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.primary,
        alignItems: "center",
    },
    viewButtonText: {
        fontSize: 13,
        fontWeight: "600",
        color: Colors.primary,
    },
    reorderButton: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: Colors.primary,
        alignItems: "center",
    },
    reorderButtonText: {
        fontSize: 13,
        fontWeight: "600",
        color: Colors.white,
    },
    disabledButton: {
        opacity: 0.6,
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
