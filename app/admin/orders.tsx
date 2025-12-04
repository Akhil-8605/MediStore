"use client"

import { Button } from "@/components/ui/Button"
import { Colors } from "@/constants/Colors"
import { orderManagementService, type OrderStatus } from "@/services/orderManagementService"
import { CheckCircle2, Clock, CreditCard, MapPin, Package, User, XCircle } from "lucide-react-native"
import { useCallback, useEffect, useState } from "react"
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

interface Order {
    orderId: string
    userId: string
    userName: string
    userEmail: string
    userPhone?: string
    items: any[]
    total: number
    status: OrderStatus
    createdAt: string
    deliveryAddress: string
    paymentMethod: string
}

export default function AdminOrdersScreen() {
    const [allOrders, setAllOrders] = useState<Order[]>([])
    const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [showStatusModal, setShowStatusModal] = useState(false)
    const [filterStatus, setFilterStatus] = useState<OrderStatus | "all">("all")
    const [updatingStatus, setUpdatingStatus] = useState(false)

    const loadAllOrders = useCallback(async () => {
        try {
            // Load all orders from all statuses
            const pending = await orderManagementService.getOrdersByStatus("pending")
            const delivered = await orderManagementService.getOrdersByStatus("delivered")
            const cancelled = await orderManagementService.getOrdersByStatus("cancelled")

            const allOrdersList = [...pending, ...delivered, ...cancelled].sort(
                (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
            )
            setAllOrders(allOrdersList)
        } catch (error) {
            console.error("Error loading orders:", error)
            Alert.alert("Error", "Failed to load orders")
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }, [])

    useEffect(() => {
        loadAllOrders()
    }, [loadAllOrders])

    useEffect(() => {
        if (filterStatus === "all") {
            setFilteredOrders(allOrders)
        } else {
            setFilteredOrders(allOrders.filter((order) => order.status === filterStatus))
        }
    }, [allOrders, filterStatus])

    const onRefresh = () => {
        setRefreshing(true)
        loadAllOrders()
    }

    const handleStatusChange = async (newStatus: OrderStatus) => {
        if (!selectedOrder) return

        try {
            setUpdatingStatus(true)
            await orderManagementService.updateOrderStatus(selectedOrder.userId, selectedOrder.orderId, newStatus)

            Alert.alert("Success", `Order status updated to ${newStatus}`)
            setShowStatusModal(false)
            setSelectedOrder(null)
            loadAllOrders()
        } catch (error) {
            Alert.alert("Error", "Failed to update order status")
            console.error("Error:", error)
        } finally {
            setUpdatingStatus(false)
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

    const getStatusIcon = (status: OrderStatus) => {
        switch (status) {
            case "pending":
                return Clock
            case "delivered":
                return CheckCircle2
            case "cancelled":
                return XCircle
            default:
                return Clock
        }
    }

    const formatDateTime = (dateValue: any) => {
        try {
            let date: Date
            if (dateValue?.toDate) {
                date = dateValue.toDate()
            } else if (typeof dateValue === "string") {
                date = new Date(dateValue)
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

    const renderOrder = ({ item }: { item: Order }) => {
        const StatusIcon = getStatusIcon(item.status)
        return (
            <TouchableOpacity
                style={styles.orderCard}
                onPress={() => {
                    setSelectedOrder(item)
                    setShowStatusModal(true)
                }}
            >
                <View style={styles.orderHeader}>
                    <View style={styles.orderInfo}>
                        <Text style={styles.orderId}>{item.orderId}</Text>
                        <Text style={styles.userName}>{item.userName}</Text>
                        <Text style={styles.userEmail}>{item.userEmail}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                        <StatusIcon size={14} color="white" />
                        <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
                    </View>
                </View>

                <View style={styles.orderDetails}>
                    <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Items</Text>
                        <Text style={styles.detailValue}>{item.items.length}</Text>
                    </View>
                    <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Amount</Text>
                        <Text style={styles.detailValue}>₹{item.total.toFixed(2)}</Text>
                    </View>
                    <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Payment</Text>
                        <Text style={styles.detailValue}>{item.paymentMethod}</Text>
                    </View>
                </View>

                <View style={styles.orderFooter}>
                    <Text style={styles.date}>{formatDateTime(item.createdAt)}</Text>
                    <Text style={styles.address} numberOfLines={1}>
                        {item.deliveryAddress}
                    </Text>
                </View>
            </TouchableOpacity>
        )
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.filterContainer}>
                <TouchableOpacity
                    style={[styles.filterChip, filterStatus === "all" && styles.filterChipActive]}
                    onPress={() => setFilterStatus("all")}
                >
                    <Text style={[styles.filterText, filterStatus === "all" && styles.filterTextActive]}>
                        All ({allOrders.length})
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.filterChip, filterStatus === "pending" && styles.filterChipActive]}
                    onPress={() => setFilterStatus("pending")}
                >
                    <Text style={[styles.filterText, filterStatus === "pending" && styles.filterTextActive]}>Pending</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.filterChip, filterStatus === "delivered" && styles.filterChipActive]}
                    onPress={() => setFilterStatus("delivered")}
                >
                    <Text style={[styles.filterText, filterStatus === "delivered" && styles.filterTextActive]}>Delivered</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.filterChip, filterStatus === "cancelled" && styles.filterChipActive]}
                    onPress={() => setFilterStatus("cancelled")}
                >
                    <Text style={[styles.filterText, filterStatus === "cancelled" && styles.filterTextActive]}>Cancelled</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={filteredOrders}
                    keyExtractor={(item) => item.orderId}
                    renderItem={renderOrder}
                    contentContainerStyle={styles.list}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Package size={48} color={Colors.textMuted} />
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
                onRequestClose={() => {
                    if (!updatingStatus) setShowStatusModal(false)
                }}
            >
                <SafeAreaView style={styles.modalContainer}>
                    <ScrollView contentContainerStyle={styles.modalContent}>
                        <Text style={styles.modalTitle}>Update Order Status</Text>

                        {selectedOrder && (
                            <View style={styles.selectedOrderInfo}>
                                {/* Order ID */}
                                <View style={styles.infoSection}>
                                    <View style={styles.infoIconRow}>
                                        <Package size={16} color={Colors.primary} />
                                        <Text style={styles.infoSectionTitle}>Order Details</Text>
                                    </View>
                                    <View style={styles.infoRow}>
                                        <Text style={styles.infoLabel}>Order ID</Text>
                                        <Text style={styles.infoValue}>{selectedOrder.orderId}</Text>
                                    </View>
                                    <View style={styles.infoRow}>
                                        <Text style={styles.infoLabel}>Date</Text>
                                        <Text style={styles.infoValue}>{formatDateTime(selectedOrder.createdAt)}</Text>
                                    </View>
                                </View>

                                {/* Customer Info */}
                                <View style={styles.infoSection}>
                                    <View style={styles.infoIconRow}>
                                        <User size={16} color={Colors.primary} />
                                        <Text style={styles.infoSectionTitle}>Customer</Text>
                                    </View>
                                    <View style={styles.infoRow}>
                                        <Text style={styles.infoLabel}>Name</Text>
                                        <Text style={styles.infoValue}>{selectedOrder.userName}</Text>
                                    </View>
                                    <View style={styles.infoRow}>
                                        <Text style={styles.infoLabel}>Email</Text>
                                        <Text style={styles.infoValue}>{selectedOrder.userEmail}</Text>
                                    </View>
                                    {selectedOrder.userPhone && (
                                        <View style={styles.infoRow}>
                                            <Text style={styles.infoLabel}>Phone</Text>
                                            <Text style={styles.infoValue}>{selectedOrder.userPhone}</Text>
                                        </View>
                                    )}
                                </View>

                                {/* Payment & Address */}
                                <View style={styles.infoSection}>
                                    <View style={styles.infoIconRow}>
                                        <CreditCard size={16} color={Colors.primary} />
                                        <Text style={styles.infoSectionTitle}>Payment & Delivery</Text>
                                    </View>
                                    <View style={styles.infoRow}>
                                        <Text style={styles.infoLabel}>Amount</Text>
                                        <Text style={[styles.infoValue, { color: Colors.primary, fontWeight: "bold" }]}>
                                            ₹{selectedOrder.total.toFixed(2)}
                                        </Text>
                                    </View>
                                    <View style={styles.infoRow}>
                                        <Text style={styles.infoLabel}>Payment</Text>
                                        <Text style={styles.infoValue}>{selectedOrder.paymentMethod}</Text>
                                    </View>
                                    <View style={styles.infoRow}>
                                        <Text style={styles.infoLabel}>Status</Text>
                                        <Text style={[styles.infoValue, { color: getStatusColor(selectedOrder.status) }]}>
                                            {selectedOrder.status.toUpperCase()}
                                        </Text>
                                    </View>
                                </View>

                                {/* Address */}
                                <View style={styles.infoSection}>
                                    <View style={styles.infoIconRow}>
                                        <MapPin size={16} color={Colors.primary} />
                                        <Text style={styles.infoSectionTitle}>Delivery Address</Text>
                                    </View>
                                    <Text style={styles.addressText}>{selectedOrder.deliveryAddress}</Text>
                                </View>

                                {/* Items */}
                                <View style={styles.itemsContainer}>
                                    <Text style={styles.itemsTitle}>Items ({selectedOrder.items.length})</Text>
                                    {selectedOrder.items.map((item, idx) => (
                                        <View key={idx} style={styles.itemRow}>
                                            <Text style={styles.itemName}>{item.name}</Text>
                                            <Text style={styles.itemQty}>x{item.quantity || item.totalQuantity || 1}</Text>
                                            <Text style={styles.itemPrice}>
                                                ₹{((item.price || 0) * (item.quantity || item.totalQuantity || 1)).toFixed(2)}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}

                        <Text style={styles.changeStatusTitle}>Change Status</Text>
                        <View style={styles.statusOptions}>
                            {(["pending", "delivered", "cancelled"] as OrderStatus[]).map((status) => (
                                <TouchableOpacity
                                    key={status}
                                    style={[
                                        styles.statusOption,
                                        selectedOrder?.status === status && styles.statusOptionActive,
                                        updatingStatus && styles.statusOptionDisabled,
                                    ]}
                                    onPress={() => handleStatusChange(status)}
                                    disabled={updatingStatus}
                                >
                                    {updatingStatus && selectedOrder?.status !== status ? (
                                        <ActivityIndicator size="small" color={Colors.charcoal} />
                                    ) : (
                                        <Text
                                            style={[
                                                styles.statusOptionText,
                                                selectedOrder?.status === status && styles.statusOptionTextActive,
                                            ]}
                                        >
                                            {status.toUpperCase()}
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Button
                            title={updatingStatus ? "Updating..." : "Close"}
                            onPress={() => {
                                if (!updatingStatus) setShowStatusModal(false)
                            }}
                            disabled={updatingStatus}
                            style={styles.closeButton}
                        />
                    </ScrollView>
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
    filterContainer: {
        flexDirection: "row",
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: Colors.white,
        gap: 8,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    filterChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: Colors.border,
        backgroundColor: Colors.white,
    },
    filterChipActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    filterText: {
        fontSize: 12,
        fontWeight: "600",
        color: Colors.textMuted,
    },
    filterTextActive: {
        color: Colors.white,
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
        marginBottom: 8,
    },
    orderHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 12,
    },
    orderInfo: {
        flex: 1,
    },
    orderId: {
        fontSize: 14,
        fontWeight: "bold",
        color: Colors.charcoal,
        marginBottom: 4,
    },
    userName: {
        fontSize: 14,
        color: Colors.text,
        fontWeight: "500",
    },
    userEmail: {
        fontSize: 12,
        color: Colors.textMuted,
    },
    statusBadge: {
        flexDirection: "row",
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        alignItems: "center",
        gap: 4,
    },
    statusText: {
        fontSize: 10,
        fontWeight: "bold",
        color: Colors.white,
    },
    orderDetails: {
        flexDirection: "row",
        gap: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: Colors.border,
        marginBottom: 12,
    },
    detailItem: {
        flex: 1,
    },
    detailLabel: {
        fontSize: 12,
        color: Colors.textMuted,
        marginBottom: 4,
    },
    detailValue: {
        fontSize: 14,
        fontWeight: "bold",
        color: Colors.charcoal,
    },
    orderFooter: {
        gap: 4,
    },
    date: {
        fontSize: 12,
        color: Colors.textMuted,
    },
    address: {
        fontSize: 12,
        color: Colors.text,
        fontWeight: "500",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
        gap: 12,
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
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: "bold",
        color: Colors.charcoal,
        marginBottom: 20,
    },
    selectedOrderInfo: {
        backgroundColor: Colors.white,
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    infoSection: {
        marginBottom: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    infoIconRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 12,
    },
    infoSectionTitle: {
        fontSize: 14,
        fontWeight: "bold",
        color: Colors.charcoal,
    },
    infoRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 8,
    },
    infoLabel: {
        fontSize: 13,
        color: Colors.textMuted,
    },
    infoValue: {
        fontSize: 13,
        fontWeight: "600",
        color: Colors.charcoal,
    },
    addressText: {
        fontSize: 13,
        color: Colors.text,
        lineHeight: 20,
    },
    itemsContainer: {
        paddingTop: 12,
    },
    itemsTitle: {
        fontSize: 14,
        fontWeight: "bold",
        color: Colors.charcoal,
        marginBottom: 12,
    },
    itemRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    itemName: {
        fontSize: 13,
        color: Colors.text,
        flex: 1,
    },
    itemQty: {
        fontSize: 13,
        color: Colors.textMuted,
        marginHorizontal: 12,
    },
    itemPrice: {
        fontSize: 13,
        fontWeight: "600",
        color: Colors.primary,
    },
    changeStatusTitle: {
        fontSize: 16,
        fontWeight: "bold",
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
        alignItems: "center",
    },
    statusOptionActive: {
        borderColor: Colors.primary,
        backgroundColor: Colors.primary,
    },
    statusOptionDisabled: {
        opacity: 0.6,
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
        marginTop: "auto",
    },
})
