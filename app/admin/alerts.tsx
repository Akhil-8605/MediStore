"use client"

import { useState, useEffect } from "react"
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Modal,
    Alert,
    RefreshControl,
    TextInput,
    ScrollView,
    ActivityIndicator,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Colors } from "../../constants/Colors"
import { Bell, X, Send, Package, Mail, Phone, MapPin, Calendar, ShoppingCart } from "lucide-react-native"
import { getDocs, collection, updateDoc, doc, arrayUnion } from "firebase/firestore"
import { db } from "../../config/firebase"

interface DeliveredOrderReminder {
    id: string
    orderId: string
    userName: string
    userEmail: string
    userPhone: string
    userId: string
    reminderDate: Date
    items: any[]
    totalAmount: number
    deliveryAddress: string
    deliveredAt: any
    createdAt: string
}

export default function AdminAlertsScreen() {
    const [orders, setOrders] = useState<DeliveredOrderReminder[]>([])
    const [loading, setLoading] = useState(false)
    const [selectedOrder, setSelectedOrder] = useState<DeliveredOrderReminder | null>(null)
    const [modalVisible, setModalVisible] = useState(false)
    const [messageText, setMessageText] = useState("")
    const [sendingNotification, setSendingNotification] = useState(false)

    const fetchDeliveredOrders = async () => {
        setLoading(true)
        try {
            const deliveredSnapshot = await getDocs(collection(db, "DeliveredOrders"))
            const deliveredOrders: DeliveredOrderReminder[] = []

            deliveredSnapshot.forEach((docSnap) => {
                const data = docSnap.data()
                const deliveredDate = data.deliveredAt?.toDate?.() || new Date(data.createdAt)
                // Calculate reminder date (e.g., 30 days from delivery)
                const reminderDate = new Date(deliveredDate)
                reminderDate.setDate(reminderDate.getDate() + 30)

                deliveredOrders.push({
                    id: docSnap.id,
                    orderId: data.orderId,
                    userName: data.userName || "Unknown",
                    userEmail: data.userEmail || "N/A",
                    userPhone: data.userPhone || "N/A",
                    userId: data.userId,
                    reminderDate,
                    items: data.items || [],
                    totalAmount: data.totalAmount || 0,
                    deliveryAddress: data.deliveryAddress || "N/A",
                    deliveredAt: data.deliveredAt,
                    createdAt: data.createdAt,
                })
            })

            // Sort by reminder date (closest first)
            deliveredOrders.sort((a, b) => a.reminderDate.getTime() - b.reminderDate.getTime())
            setOrders(deliveredOrders)
        } catch (error) {
            console.error("Error fetching delivered orders:", error)
            Alert.alert("Error", "Failed to load delivered orders")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchDeliveredOrders()
    }, [])

    const generateNotificationText = (order: DeliveredOrderReminder) => {
        const itemsList = order.items.map((item: any) => item.name).join(", ")
        return `Hello ${order.userName}, your order #${order.orderId.substring(0, 10)} items (${itemsList}) are getting over. Would you like to reorder?`
    }

    const handleOpenOrderDetail = (order: DeliveredOrderReminder) => {
        setSelectedOrder(order)
        setMessageText(generateNotificationText(order))
        setModalVisible(true)
    }

    const handleSendReminder = async () => {
        if (!selectedOrder || !messageText.trim()) {
            Alert.alert("Error", "Please enter a message")
            return
        }

        setSendingNotification(true)
        try {
            const userRef = doc(db, "AllUsers", selectedOrder.userId)
            const notification = {
                id: `reminder-${selectedOrder.orderId}-${Date.now()}`,
                title: "Reorder Reminder",
                message: messageText,
                timestamp: new Date().toISOString(),
                read: false,
                type: "reminder",
                orderId: selectedOrder.orderId,
                hasReorderButton: true,
                items: selectedOrder.items,
            }

            await updateDoc(userRef, {
                notifications: arrayUnion(notification),
            })

            Alert.alert("Success", "Reminder notification sent to user!")
            setModalVisible(false)
            setMessageText("")
            setSelectedOrder(null)
        } catch (error) {
            console.error("Error sending reminder:", error)
            Alert.alert("Error", "Failed to send reminder")
        } finally {
            setSendingNotification(false)
        }
    }

    const formatDate = (date: Date | any) => {
        try {
            const d = date?.toDate?.() || new Date(date)
            return d.toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
            })
        } catch {
            return "N/A"
        }
    }

    const getDaysUntilReminder = (reminderDate: Date) => {
        const now = new Date()
        const diff = reminderDate.getTime() - now.getTime()
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
        return days
    }

    const renderOrderCard = ({ item }: { item: DeliveredOrderReminder }) => {
        const daysUntil = getDaysUntilReminder(item.reminderDate)
        const isOverdue = daysUntil <= 0
        const isUrgent = daysUntil > 0 && daysUntil <= 7

        return (
            <TouchableOpacity style={styles.card} onPress={() => handleOpenOrderDetail(item)} activeOpacity={0.7}>
                {/* Header */}
                <View style={styles.cardHeader}>
                    <View style={styles.orderInfo}>
                        <Text style={styles.orderId}>#{item.orderId.substring(0, 10)}</Text>
                        <Text style={styles.userName}>{item.userName}</Text>
                    </View>
                    <View
                        style={[
                            styles.reminderBadge,
                            { backgroundColor: isOverdue ? "#FEE2E2" : isUrgent ? "#FEF3C7" : "#DCFCE7" },
                        ]}
                    >
                        <Text style={[styles.reminderText, { color: isOverdue ? "#991B1B" : isUrgent ? "#92400E" : "#166534" }]}>
                            {isOverdue ? "Overdue" : `${daysUntil}d`}
                        </Text>
                    </View>
                </View>

                {/* Order Details */}
                <View style={styles.orderDetails}>
                    <View style={styles.detailRow}>
                        <Package size={14} color={Colors.textMuted} />
                        <Text style={styles.detailText}>{item.items.length} items</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <Calendar size={14} color={Colors.textMuted} />
                        <Text style={styles.detailText}>Delivered: {formatDate(item.deliveredAt)}</Text>
                    </View>
                </View>

                {/* Amount */}
                <View style={styles.amountRow}>
                    <Text style={styles.amountLabel}>Total Amount</Text>
                    <Text style={styles.amountValue}>₹{item.totalAmount.toFixed(2)}</Text>
                </View>

                {/* Action Button */}
                <TouchableOpacity style={styles.openButton} onPress={() => handleOpenOrderDetail(item)}>
                    <Bell size={16} color={Colors.white} />
                    <Text style={styles.openButtonText}>View & Send Reminder</Text>
                </TouchableOpacity>
            </TouchableOpacity>
        )
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Delivered Orders</Text>
                <Text style={styles.subtitle}>Send reorder reminders to users</Text>
            </View>

            <FlatList
                data={orders}
                keyExtractor={(item) => item.id}
                renderItem={renderOrderCard}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchDeliveredOrders} />}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Bell size={48} color={Colors.textMuted} />
                        <Text style={styles.emptyTitle}>No delivered orders</Text>
                        <Text style={styles.emptyText}>Delivered orders will appear here for reminder management</Text>
                    </View>
                }
            />

            {/* Order Detail Modal */}
            <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <View>
                            <Text style={styles.modalTitle}>Order Details</Text>
                            <Text style={styles.modalSubtitle}>#{selectedOrder?.orderId.substring(0, 12)}</Text>
                        </View>
                        <TouchableOpacity onPress={() => setModalVisible(false)}>
                            <X size={24} color={Colors.charcoal} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={styles.modalContent}>
                        {/* User Information Card */}
                        <View style={styles.infoCard}>
                            <Text style={styles.infoCardTitle}>Customer Information</Text>
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Name</Text>
                                <Text style={styles.infoValue}>{selectedOrder?.userName}</Text>
                            </View>
                            <View style={styles.divider} />
                            <View style={styles.infoRow}>
                                <View style={styles.infoRowIcon}>
                                    <Mail size={14} color={Colors.textMuted} />
                                </View>
                                <Text style={styles.infoValue}>{selectedOrder?.userEmail}</Text>
                            </View>
                            <View style={styles.divider} />
                            <View style={styles.infoRow}>
                                <View style={styles.infoRowIcon}>
                                    <Phone size={14} color={Colors.textMuted} />
                                </View>
                                <Text style={styles.infoValue}>{selectedOrder?.userPhone}</Text>
                            </View>
                            <View style={styles.divider} />
                            <View style={styles.infoRow}>
                                <View style={styles.infoRowIcon}>
                                    <MapPin size={14} color={Colors.textMuted} />
                                </View>
                                <Text style={[styles.infoValue, styles.addressText]} numberOfLines={2}>
                                    {selectedOrder?.deliveryAddress}
                                </Text>
                            </View>
                        </View>

                        {/* Order Items Card */}
                        <View style={styles.infoCard}>
                            <Text style={styles.infoCardTitle}>Order Items</Text>
                            {selectedOrder?.items.map((item: any, idx: number) => (
                                <View key={idx} style={styles.itemRow}>
                                    <View style={styles.itemIcon}>
                                        <ShoppingCart size={14} color={Colors.primary} />
                                    </View>
                                    <Text style={styles.itemName}>{item.name}</Text>
                                    <Text style={styles.itemQty}>x{item.quantity || 1}</Text>
                                    <Text style={styles.itemPrice}>₹{((item.price || 0) * (item.quantity || 1)).toFixed(2)}</Text>
                                </View>
                            ))}
                            <View style={styles.totalRow}>
                                <Text style={styles.totalLabel}>Total Amount</Text>
                                <Text style={styles.totalValue}>₹{selectedOrder?.totalAmount.toFixed(2)}</Text>
                            </View>
                        </View>

                        {/* Notification Message */}
                        <View style={styles.messageSection}>
                            <Text style={styles.messageSectionTitle}>Notification Message</Text>
                            <Text style={styles.messageHint}>This message will be sent to the user with a reorder button</Text>
                            <TextInput
                                style={styles.messageInput}
                                multiline
                                placeholder="Enter reminder message"
                                placeholderTextColor={Colors.textMuted}
                                value={messageText}
                                onChangeText={setMessageText}
                                editable={!sendingNotification}
                            />
                        </View>

                        {/* Send Button */}
                        <TouchableOpacity
                            style={[styles.sendButton, sendingNotification && styles.sendButtonDisabled]}
                            onPress={handleSendReminder}
                            disabled={sendingNotification}
                        >
                            {sendingNotification ? (
                                <ActivityIndicator size="small" color={Colors.white} />
                            ) : (
                                <>
                                    <Send size={18} color={Colors.white} />
                                    <Text style={styles.sendButtonText}>Send Notification</Text>
                                </>
                            )}
                        </TouchableOpacity>
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
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
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
        marginBottom: 4,
    },
    cardHeader: {
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
        fontWeight: "600",
        color: Colors.primary,
        marginBottom: 4,
    },
    userName: {
        fontSize: 16,
        fontWeight: "bold",
        color: Colors.charcoal,
    },
    reminderBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
    },
    reminderText: {
        fontSize: 12,
        fontWeight: "bold",
    },
    orderDetails: {
        flexDirection: "row",
        gap: 16,
        marginBottom: 12,
    },
    detailRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    detailText: {
        fontSize: 13,
        color: Colors.textMuted,
    },
    amountRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        marginBottom: 12,
    },
    amountLabel: {
        fontSize: 14,
        color: Colors.textMuted,
    },
    amountValue: {
        fontSize: 18,
        fontWeight: "bold",
        color: Colors.primary,
    },
    openButton: {
        backgroundColor: Colors.primary,
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "center",
        gap: 8,
    },
    openButtonText: {
        color: Colors.white,
        fontWeight: "600",
        fontSize: 14,
    },
    emptyContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 60,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: Colors.charcoal,
        marginTop: 16,
    },
    emptyText: {
        fontSize: 14,
        color: Colors.textMuted,
        marginTop: 8,
        textAlign: "center",
        paddingHorizontal: 40,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        backgroundColor: Colors.white,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: Colors.charcoal,
    },
    modalSubtitle: {
        fontSize: 14,
        color: Colors.textMuted,
        marginTop: 2,
    },
    modalContent: {
        padding: 20,
        gap: 16,
    },
    infoCard: {
        backgroundColor: Colors.white,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    infoCardTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: Colors.charcoal,
        marginBottom: 12,
    },
    infoRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 8,
    },
    infoRowIcon: {
        width: 24,
    },
    infoLabel: {
        fontSize: 14,
        color: Colors.textMuted,
        width: 60,
    },
    infoValue: {
        fontSize: 14,
        color: Colors.charcoal,
        fontWeight: "500",
        flex: 1,
    },
    addressText: {
        lineHeight: 20,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.border,
    },
    itemRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 8,
        gap: 8,
    },
    itemIcon: {
        width: 28,
        height: 28,
        borderRadius: 6,
        backgroundColor: Colors.logoback,
        alignItems: "center",
        justifyContent: "center",
    },
    itemName: {
        fontSize: 14,
        color: Colors.charcoal,
        flex: 1,
    },
    itemQty: {
        fontSize: 13,
        color: Colors.textMuted,
        minWidth: 30,
    },
    itemPrice: {
        fontSize: 14,
        fontWeight: "600",
        color: Colors.primary,
        minWidth: 70,
        textAlign: "right",
    },
    totalRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingTop: 12,
        marginTop: 8,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    totalLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: Colors.charcoal,
    },
    totalValue: {
        fontSize: 18,
        fontWeight: "bold",
        color: Colors.primary,
    },
    messageSection: {
        gap: 8,
    },
    messageSectionTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: Colors.charcoal,
    },
    messageHint: {
        fontSize: 12,
        color: Colors.textMuted,
    },
    messageInput: {
        backgroundColor: Colors.white,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 12,
        padding: 16,
        fontSize: 14,
        color: Colors.text,
        minHeight: 120,
        textAlignVertical: "top",
    },
    sendButton: {
        flexDirection: "row",
        backgroundColor: Colors.primary,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        marginBottom: 20,
    },
    sendButtonDisabled: {
        opacity: 0.6,
    },
    sendButtonText: {
        color: Colors.white,
        fontSize: 16,
        fontWeight: "bold",
    },
})
