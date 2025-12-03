"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Modal, Alert } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Colors } from "@/constants/Colors"
import { orderManagementService, type OrderStatus } from "@/services/orderManagementService"

interface Order {
    orderId: string
    userId: string
    userName: string
    userEmail: string
    items: any[]
    total: number
    status: OrderStatus
    createdAt: string
    paymentMethod: string
}

export default function AdminOrdersScreen() {
    const [allOrders, setAllOrders] = useState<Order[]>([])
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [showStatusModal, setShowStatusModal] = useState(false)

    useEffect(() => {
        loadAllOrders()
    }, [])

    const loadAllOrders = async () => {
        try {
            // Load all orders from all statuses
            const pending = await orderManagementService.getOrdersByStatus("pending")
            const delivered = await orderManagementService.getOrdersByStatus("delivered")
            const cancelled = await orderManagementService.getOrdersByStatus("cancelled")

            const allOrders = [...pending, ...delivered, ...cancelled]
            setAllOrders(allOrders)
        } catch (error) {
            console.error("Error loading orders:", error)
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    const onRefresh = () => {
        setRefreshing(true)
        loadAllOrders()
    }

    const handleStatusChange = async (newStatus: OrderStatus) => {
        if (!selectedOrder) return

        try {
            await orderManagementService.updateOrderStatus(selectedOrder.userId, selectedOrder.orderId, newStatus)

            Alert.alert("Success", `Order status updated to ${newStatus}`)
            setShowStatusModal(false)
            setSelectedOrder(null)
            loadAllOrders()
        } catch (error) {
            Alert.alert("Error", "Failed to update order status")
        }
    }

    const getStatusColor = (status: OrderStatus) => {
        switch (status) {
            case "pending":
                return "#F59E0B"
            case "delivered":
                return "#10B981"
            case "cancelled":
                return "#EF4444"
            default:
                return Colors.textMuted
        }
    }

    const renderOrder = ({ item }: { item: Order }) => (
        <TouchableOpacity
            style={styles.orderCard}
            onPress={() => {
                setSelectedOrder(item)
                setShowStatusModal(true)
            }}
        >
            <View style={styles.orderHeader}>
                <View>
                    <Text style={styles.orderId}>{item.orderId}</Text>
                    <Text style={styles.userName}>{item.userName}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                    <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
                </View>
            </View>

            <View style={styles.orderDetails}>
                <Text style={styles.itemCount}>{item.items.length} items</Text>
                <Text style={styles.amount}>₹{item.total.toFixed(2)}</Text>
            </View>

            <View style={styles.orderFooter}>
                <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                <Text style={styles.payment}>{item.paymentMethod}</Text>
            </View>
        </TouchableOpacity>
    )

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Orders Management</Text>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Loading orders...</Text>
                </View>
            ) : (
                <FlatList
                    data={allOrders}
                    keyExtractor={(item) => item.orderId}
                    renderItem={renderOrder}
                    contentContainerStyle={styles.list}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No orders found</Text>
                        </View>
                    }
                />
            )}

            {/* Status Update Modal */}
            <Modal
                visible={showStatusModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowStatusModal(false)}
            >
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Update Order Status</Text>

                        {selectedOrder && (
                            <View style={styles.selectedOrderInfo}>
                                <Text style={styles.infoLabel}>Order ID</Text>
                                <Text style={styles.infoValue}>{selectedOrder.orderId}</Text>

                                <Text style={styles.infoLabel}>Customer</Text>
                                <Text style={styles.infoValue}>{selectedOrder.userName}</Text>

                                <Text style={styles.infoLabel}>Current Status</Text>
                                <Text style={[styles.infoValue, { color: getStatusColor(selectedOrder.status) }]}>
                                    {selectedOrder.status.toUpperCase()}
                                </Text>
                            </View>
                        )}

                        <View style={styles.statusOptions}>
                            {(["pending", "delivered", "cancelled"] as OrderStatus[]).map((status) => (
                                <TouchableOpacity
                                    key={status}
                                    style={[styles.statusOption, selectedOrder?.status === status && styles.statusOptionActive]}
                                    onPress={() => handleStatusChange(status)}
                                >
                                    <Text
                                        style={[styles.statusOptionText, selectedOrder?.status === status && styles.statusOptionTextActive]}
                                    >
                                        {status.toUpperCase()}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TouchableOpacity style={styles.closeButton} onPress={() => setShowStatusModal(false)}>
                            <Text style={styles.closeButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </Modal>
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
        paddingBottom: 16,
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
    orderHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 12,
    },
    orderId: {
        fontSize: 16,
        fontWeight: "bold",
        color: Colors.charcoal,
    },
    userName: {
        fontSize: 14,
        color: Colors.textMuted,
        marginTop: 4,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 12,
        fontWeight: "bold",
        color: Colors.white,
    },
    orderDetails: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 12,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: Colors.border,
    },
    itemCount: {
        fontSize: 14,
        color: Colors.textMuted,
    },
    amount: {
        fontSize: 18,
        fontWeight: "bold",
        color: Colors.primary,
    },
    orderFooter: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 12,
    },
    date: {
        fontSize: 12,
        color: Colors.textMuted,
    },
    payment: {
        fontSize: 12,
        fontWeight: "600",
        color: Colors.primary,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    loadingText: {
        fontSize: 16,
        color: Colors.textMuted,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
    },
    emptyText: {
        fontSize: 16,
        color: Colors.textMuted,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    modalContent: {
        padding: 20,
        flex: 1,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: "bold",
        color: Colors.charcoal,
        marginBottom: 24,
    },
    selectedOrderInfo: {
        backgroundColor: Colors.white,
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    infoLabel: {
        fontSize: 12,
        color: Colors.textMuted,
        marginBottom: 4,
    },
    infoValue: {
        fontSize: 16,
        fontWeight: "600",
        color: Colors.charcoal,
        marginBottom: 12,
    },
    statusOptions: {
        gap: 12,
        marginBottom: 24,
    },
    statusOption: {
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: Colors.border,
        backgroundColor: Colors.white,
    },
    statusOptionActive: {
        borderColor: Colors.primary,
        backgroundColor: Colors.primary,
    },
    statusOptionText: {
        fontSize: 16,
        fontWeight: "600",
        color: Colors.charcoal,
        textAlign: "center",
    },
    statusOptionTextActive: {
        color: Colors.white,
    },
    closeButton: {
        paddingVertical: 14,
        paddingHorizontal: 16,
        backgroundColor: Colors.neutralGray,
        borderRadius: 12,
        marginTop: "auto",
    },
    closeButtonText: {
        fontSize: 16,
        fontWeight: "600",
        color: Colors.charcoal,
        textAlign: "center",
    },
})
