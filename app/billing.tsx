"use client"

import { router, useLocalSearchParams, useRouter } from "expo-router"
import { MapPin, Smartphone } from "lucide-react-native"
import { useState } from "react"
import { Alert, Linking, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Button } from "../components/ui/Button"
import { Colors } from "../constants/Colors"
import { useAuth } from "../context/AuthContext"
import { useCart } from "../context/CartContext"
import { firestoreService, type Order } from "../services/firestoreService"
import { orderService } from "../services/orderService"
import { receiptService } from "../services/recieptService"

export default function BillingScreen() {
    const { items, total, clearCart } = useCart()
    const { user, userData } = useAuth()
    const [paymentMethod, setPaymentMethod] = useState<"COD" | "UPI">("COD")
    const [upiChoice, setUpiChoice] = useState<"phonpe" | "googlepay" | "other" | null>(null)
    const [deliveryAddress, setDeliveryAddress] = useState("")
    const [loading, setLoading] = useState(false)
    const [showUPIOptions, setShowUPIOptions] = useState(false)
    const routerInstance = useRouter()
    const params = useLocalSearchParams()

    const reminderDays = Number.parseInt((params.reminderDays as string) || "0")

    const finalTotal = total
    const orderId = `ORD-${Date.now()}`

    const handleUPIApp = async (app: "phonpe" | "googlepay" | "other") => {
        try {
            setLoading(true)
            setUpiChoice(app)

            const upiId = "akhilesh-adam@ybl" // must be valid VPA
            const amountStr = Number(finalTotal).toFixed(2) // e.g. "150.00"
            const payeeName = "MediStore"
            const note = `Order ${orderId}`

            // standard UPI URI (this is what most UPI apps listen for)
            const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(
                payeeName,
            )}&am=${encodeURIComponent(amountStr)}&tn=${encodeURIComponent(note)}&tr=${encodeURIComponent(
                orderId,
            )}&cu=INR`

            // Optional: if you want to prefer a particular app you can try an app-specific scheme first
            // but it's fine to use the generic upi://pay which will show installed UPI apps chooser.
            try {
                await Linking.openURL(upiUrl)
                Alert.alert("Payment Initiated", "Complete payment in your UPI app and return here")
                // NOTE: you cannot reliably detect success here — use a webhook or server-side confirmation in production.
                await completeOrderPayment()
            } catch (openError) {
                console.warn("openURL failed for UPI link:", openError)
                Alert.alert(
                    "Unable to open UPI app",
                    "Could not open UPI app. Please make sure a UPI app (PhonePe/GooglePay/etc.) is installed.",
                )
            }
        } catch (error) {
            console.error("handleUPIApp error", error)
            Alert.alert("Error", "Failed to start UPI payment")
        } finally {
            setLoading(false)
        }
    }

    const completeOrderPayment = async () => {
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

            // Save order to Firestore
            if (user) {
                await firestoreService.addOrder(user.uid, order)

                await orderService.completeOrder(user.uid, items, finalTotal, paymentMethod, reminderDays)

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
                            pathname: "/receipt",
                            params: { orderId },
                        })
                    },
                },
                {
                    text: "View Orders",
                    onPress: () => router.push("/orders"),
                },
            ])
        } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to place order")
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

            if (paymentMethod === "COD") {
                await completeOrderPayment()
            } else {
                // For UPI, show UPI app options
                setShowUPIOptions(true)
            }
        } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to place order")
        } finally {
            setLoading(false)
        }
    }

    if (showUPIOptions) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => setShowUPIOptions(false)}>
                        <Text style={styles.backButton}>← Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>Select UPI App</Text>
                </View>

                <ScrollView contentContainerStyle={styles.upiContent}>
                    <View style={styles.amountCard}>
                        <Text style={styles.amountLabel}>Total Amount</Text>
                        <Text style={styles.amountValue}>₹{finalTotal.toFixed(2)}</Text>
                    </View>

                    <View style={styles.upiOptions}>
                        <TouchableOpacity style={styles.upiOption} onPress={() => handleUPIApp("phonpe")} disabled={loading}>
                            <View style={styles.upiIconContainer}>
                                <Smartphone size={32} color="#5F27CD" />
                            </View>
                            <Text style={styles.upiOptionName}>PhonePe</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.upiOption} onPress={() => handleUPIApp("googlepay")} disabled={loading}>
                            <View style={styles.upiIconContainer}>
                                <Smartphone size={32} color="#4285F4" />
                            </View>
                            <Text style={styles.upiOptionName}>Google Pay</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.upiOption} onPress={() => handleUPIApp("other")} disabled={loading}>
                            <View style={styles.upiIconContainer}>
                                <Smartphone size={32} color="#1F2937" />
                            </View>
                            <Text style={styles.upiOptionName}>Other UPI App</Text>
                        </TouchableOpacity>
                    </View>

                    <Button
                        title="Back"
                        onPress={() => setShowUPIOptions(false)}
                        disabled={loading}
                        style={styles.backButtonStyle}
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
                        <View style={[styles.summaryRow, styles.totalRow]}>
                            <Text style={styles.totalLabel}>Total</Text>
                            <Text style={styles.totalValue}>₹{finalTotal.toFixed(2)}</Text>
                        </View>
                    </View>
                </View>

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
                            <Text style={styles.paymentDesc}>Pay using PhonePe, Google Pay, or other UPI apps</Text>
                        </View>
                    </TouchableOpacity>
                </View>

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
        padding: 20,
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
        backgroundColor: Colors.logoback,
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
    upiContent: {
        alignItems: "center",
    },
    amountCard: {
        alignItems: "center",
        backgroundColor: Colors.white,
        padding: 24,
        borderRadius: 12,
        marginBottom: 32,
        width: "100%",
        borderWidth: 1,
        borderColor: Colors.border,
    },
    amountLabel: {
        fontSize: 14,
        color: Colors.textMuted,
        marginBottom: 8,
    },
    amountValue: {
        fontSize: 32,
        fontWeight: "bold",
        color: Colors.primary,
    },
    upiOptions: {
        width: "100%",
        gap: 12,
        marginBottom: 24,
    },
    upiOption: {
        backgroundColor: Colors.white,
        borderRadius: 12,
        padding: 24,
        alignItems: "center",
        borderWidth: 2,
        borderColor: Colors.border,
    },
    upiIconContainer: {
        marginBottom: 12,
    },
    upiOptionName: {
        fontSize: 16,
        fontWeight: "600",
        color: Colors.charcoal,
    },
    backButtonStyle: {
        width: "100%",
    },
})
