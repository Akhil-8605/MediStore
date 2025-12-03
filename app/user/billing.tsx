"use client"

import { useState } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, Alert } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Colors } from "@/constants/Colors"
import { useCart } from "@/context/CartContext"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/Button"
import { MapPin } from "lucide-react-native"
import { paymentService } from "@/services/paymentService"
import { firestoreService, type Order } from "@/services/firestoreService"
import { receiptService } from "@/services/recieptService"
import { router } from "expo-router"

const SHIPPING_COST = 50

export default function BillingScreen() {
    const { items, total, clearCart } = useCart()
    const { user, userData } = useAuth()
    const [paymentMethod, setPaymentMethod] = useState<"COD" | "UPI">("COD")
    const [deliveryAddress, setDeliveryAddress] = useState("")
    const [loading, setLoading] = useState(false)
    const [qrCode, setQrCode] = useState<string | null>(null)
    const [showQRCode, setShowQRCode] = useState(false)

    const finalTotal = total + SHIPPING_COST
    const orderId = `ORD-${Date.now()}`

    const handleGenerateQR = async () => {
        try {
            setLoading(true)
            const qr = await paymentService.generateUPIQRCode(finalTotal)
            setQrCode(qr)
            setShowQRCode(true)
        } catch (error) {
            Alert.alert("Error", "Failed to generate QR code")
        } finally {
            setLoading(false)
        }
    }

    const handlePayment = async () => {
        if (!deliveryAddress.trim()) {
            Alert.alert("Error", "Please enter delivery address")
            return
        }

        if (items.length === 0) {
            Alert.alert("Error", "Cart is empty")
            return
        }

        try {
            setLoading(true)

            // Create order object
            const order: Order = {
                orderId,
                items,
                total: finalTotal,
                paymentMethod,
                status: "pending",
                createdAt: new Date().toISOString(),
                deliveryAddress,
                receipt: receiptService.generateReceiptData(
                    {
                        orderId,
                        items,
                        total: finalTotal,
                        paymentMethod,
                        status: "pending",
                        createdAt: new Date().toISOString(),
                        deliveryAddress,
                    },
                    userData?.name || "Customer",
                    userData?.email || "",
                ),
            }

            // Process payment
            if (paymentMethod === "COD") {
                const success = await paymentService.processCODPayment(orderId, finalTotal)
                if (!success) {
                    Alert.alert("Error", "Payment processing failed")
                    return
                }
            } else {
                // For UPI, show QR code
                await handleGenerateQR()
            }

            // Save order to Firestore
            if (user) {
                await firestoreService.addOrder(user.uid, order)

                // Add notification
                await firestoreService.addNotification(user.uid, {
                    id: orderId,
                    title: "Order Placed",
                    message: `Your order ${orderId} has been placed successfully`,
                    timestamp: new Date().toISOString(),
                    read: false,
                })
            }

            // Clear cart
            await clearCart()

            Alert.alert("Success", "Order placed successfully!", [
                {
                    text: "View Receipt",
                    onPress: () => {
                        router.push({
                            pathname: "/user/receipt",
                            params: { orderId },
                        })
                    },
                },
                {
                    text: "View Orders",
                    onPress: () => router.push("/user/orders"),
                },
            ])
        } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to place order")
        } finally {
            setLoading(false)
        }
    }

    if (showQRCode && qrCode) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => setShowQRCode(false)}>
                        <Text style={styles.backButton}>← Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>Scan to Pay</Text>
                </View>

                <ScrollView contentContainerStyle={styles.qrContent}>
                    <View style={styles.qrContainer}>
                        <Image source={{ uri: qrCode }} style={styles.qrImage} />
                        <Text style={styles.qrAmount}>Amount: ₹{finalTotal.toFixed(2)}</Text>
                        <Text style={styles.upiId}>To: 8605050804-2@ybl</Text>
                    </View>

                    <Button
                        title="Confirm Payment"
                        onPress={() => {
                            Alert.alert("Success", "Payment confirmed!")
                            handlePayment()
                        }}
                        style={styles.confirmButton}
                    />
                </ScrollView>
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.title}>Billing Details</Text>
                </View>

                {/* Order Summary */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Order Summary</Text>
                    <View style={styles.summaryCard}>
                        {items.map((item) => (
                            <View key={item.id} style={styles.summaryItem}>
                                <Text style={styles.itemName}>{item.name}</Text>
                                <Text style={styles.itemPrice}>₹{(item.price * item.quantity).toFixed(2)}</Text>
                            </View>
                        ))}
                        <View style={styles.divider} />
                        <View style={styles.summaryRow}>
                            <Text style={styles.label}>Subtotal</Text>
                            <Text style={styles.value}>₹{total.toFixed(2)}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.label}>Shipping</Text>
                            <Text style={styles.value}>₹{SHIPPING_COST.toFixed(2)}</Text>
                        </View>
                        <View style={[styles.summaryRow, styles.totalRow]}>
                            <Text style={styles.totalLabel}>Total</Text>
                            <Text style={styles.totalValue}>₹{finalTotal.toFixed(2)}</Text>
                        </View>
                    </View>
                </View>

                {/* Delivery Address */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Delivery Address</Text>
                    <View style={styles.addressInput}>
                        <MapPin size={20} color={Colors.primary} />
                        <TextInput
                            style={styles.input}
                            placeholder="Enter your delivery address"
                            value={deliveryAddress}
                            onChangeText={setDeliveryAddress}
                            multiline
                            editable={!loading}
                        />
                    </View>
                </View>

                {/* Payment Method */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Payment Method</Text>

                    <TouchableOpacity
                        style={[styles.paymentOption, paymentMethod === "COD" && styles.selectedPayment]}
                        onPress={() => setPaymentMethod("COD")}
                        disabled={loading}
                    >
                        <View style={styles.radio}>{paymentMethod === "COD" && <View style={styles.radioDot} />}</View>
                        <View style={styles.paymentContent}>
                            <Text style={styles.paymentTitle}>Cash on Delivery</Text>
                            <Text style={styles.paymentDesc}>Pay when you receive the order</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.paymentOption, paymentMethod === "UPI" && styles.selectedPayment]}
                        onPress={() => setPaymentMethod("UPI")}
                        disabled={loading}
                    >
                        <View style={styles.radio}>{paymentMethod === "UPI" && <View style={styles.radioDot} />}</View>
                        <View style={styles.paymentContent}>
                            <Text style={styles.paymentTitle}>Online Payment (UPI)</Text>
                            <Text style={styles.paymentDesc}>Secure payment via QR code</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Place Order Button */}
                <Button
                    title={loading ? "Processing..." : "Place Order"}
                    onPress={handlePayment}
                    disabled={loading || items.length === 0}
                    style={styles.placeButton}
                />
            </ScrollView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    header: {
        marginBottom: 24,
    },
    backButton: {
        color: Colors.primary,
        fontSize: 16,
        fontWeight: "600",
        marginBottom: 8,
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        color: Colors.charcoal,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: Colors.charcoal,
        marginBottom: 12,
    },
    summaryCard: {
        backgroundColor: Colors.white,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    summaryItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 8,
    },
    itemName: {
        fontSize: 14,
        color: Colors.text,
    },
    itemPrice: {
        fontSize: 14,
        fontWeight: "600",
        color: Colors.primary,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.border,
        marginVertical: 12,
    },
    summaryRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 8,
    },
    label: {
        fontSize: 14,
        color: Colors.textMuted,
    },
    value: {
        fontSize: 14,
        fontWeight: "500",
        color: Colors.text,
    },
    totalRow: {
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        paddingTop: 8,
        marginTop: 8,
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: "bold",
        color: Colors.charcoal,
    },
    totalValue: {
        fontSize: 18,
        fontWeight: "bold",
        color: Colors.primary,
    },
    addressInput: {
        flexDirection: "row",
        alignItems: "flex-start",
        backgroundColor: Colors.white,
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: Colors.border,
        gap: 8,
    },
    input: {
        flex: 1,
        fontSize: 14,
        color: Colors.text,
        minHeight: 80,
    },
    paymentOption: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: Colors.white,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    selectedPayment: {
        borderColor: Colors.primary,
        backgroundColor: Colors.secondary,
    },
    radio: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: Colors.primary,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    radioDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: Colors.primary,
    },
    paymentContent: {
        flex: 1,
    },
    paymentTitle: {
        fontSize: 14,
        fontWeight: "600",
        color: Colors.charcoal,
        marginBottom: 4,
    },
    paymentDesc: {
        fontSize: 12,
        color: Colors.textMuted,
    },
    placeButton: {
        marginTop: 16,
        marginBottom: 20,
    },
    qrContent: {
        padding: 20,
        alignItems: "center",
        justifyContent: "center",
    },
    qrContainer: {
        alignItems: "center",
        backgroundColor: Colors.white,
        padding: 20,
        borderRadius: 12,
        marginBottom: 24,
    },
    qrImage: {
        width: 250,
        height: 250,
        marginBottom: 16,
    },
    qrAmount: {
        fontSize: 20,
        fontWeight: "bold",
        color: Colors.primary,
        marginBottom: 8,
    },
    upiId: {
        fontSize: 14,
        color: Colors.textMuted,
    },
    confirmButton: {
        width: "100%",
    },
})
