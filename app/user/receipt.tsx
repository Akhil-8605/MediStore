"use client"

import { useState, useEffect, useRef } from "react"
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Colors } from "@/constants/Colors"
import { useAuth } from "@/context/AuthContext"
import { useLocalSearchParams, router } from "expo-router"
import { Button } from "@/components/ui/Button"
import ViewShot from "react-native-view-shot"
import * as FileSystem from "expo-file-system"
import * as Sharing from "expo-sharing"

export default function ReceiptScreen() {
    const { orderId } = useLocalSearchParams()
    const { userData } = useAuth()
    const [loading, setLoading] = useState(true)
    const [orderData, setOrderData] = useState<any>(null)
    const viewShotRef = useRef<any>(null)

    useEffect(() => {
        if (userData && orderId) {
            const order = userData.orders?.find((o: any) => o.orderId === orderId)
            if (order) {
                setOrderData(order)
            }
            setLoading(false)
        }
    }, [userData, orderId])

    const handleDownloadReceipt = async () => {
        try {
            setLoading(true)

            const uri = await viewShotRef.current?.capture?.()

            if (uri) {
                const filename = `receipt_${orderId}_${Date.now()}.png`
                const filepath = FileSystem.documentDirectory + filename

                await FileSystem.copyAsync({ from: uri, to: filepath })

                Alert.alert("Success", "Receipt downloaded successfully")
            }
        } catch (error) {
            Alert.alert("Error", "Failed to download receipt")
        } finally {
            setLoading(false)
        }
    }

    const handleShareReceipt = async () => {
        try {
            setLoading(true)

            const uri = await viewShotRef.current?.capture?.()

            if (uri && (await Sharing.isAvailableAsync())) {
                await Sharing.shareAsync(uri)
            }
        } catch (error) {
            Alert.alert("Error", "Failed to share receipt")
        } finally {
            setLoading(false)
        }
    }

    if (loading || !orderData) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                    <Text style={styles.loadingText}>Loading receipt...</Text>
                </View>
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.title}>Order Receipt</Text>
                </View>

                <ViewShot ref={viewShotRef} options={{ format: "png", quality: 0.95 }} style={styles.receipt}>
                    <View style={styles.receiptContent}>
                        {/* Logo */}
                        <View style={styles.receiptHeader}>
                            <Text style={styles.logoText}>💊</Text>
                            <Text style={styles.logoName}>MediStore</Text>
                            <Text style={styles.logoTagline}>Your Health, Delivered</Text>
                        </View>

                        {/* Order Info */}
                        <View style={styles.infoSection}>
                            <Text style={styles.infoLabel}>Order ID</Text>
                            <Text style={styles.infoValue}>{orderData.orderId}</Text>

                            <Text style={styles.infoLabel}>Date</Text>
                            <Text style={styles.infoValue}>{new Date(orderData.createdAt).toLocaleDateString()}</Text>

                            <Text style={styles.infoLabel}>Customer</Text>
                            <Text style={styles.infoValue}>{userData?.name}</Text>

                            <Text style={styles.infoLabel}>Email</Text>
                            <Text style={styles.infoValue}>{userData?.email}</Text>

                            <Text style={styles.infoLabel}>Delivery Address</Text>
                            <Text style={styles.infoValue}>{orderData.deliveryAddress}</Text>
                        </View>

                        {/* Items */}
                        <View style={styles.itemsSection}>
                            <Text style={styles.itemsTitle}>Order Items</Text>
                            {orderData.items &&
                                orderData.items.map((item: any, index: number) => (
                                    <View key={index} style={styles.itemRow}>
                                        <View style={styles.itemDetails}>
                                            <Text style={styles.itemName}>{item.name}</Text>
                                            <Text style={styles.itemQty}>
                                                Qty: {item.quantity} × ₹{item.price.toFixed(2)}
                                            </Text>
                                        </View>
                                        <Text style={styles.itemPrice}>₹{(item.price * item.quantity).toFixed(2)}</Text>
                                    </View>
                                ))}
                        </View>

                        {/* Summary - No Shipping */}
                        <View style={styles.summarySection}>
                            <View style={[styles.summaryRow, styles.totalRow]}>
                                <Text style={styles.totalLabel}>Total Amount</Text>
                                <Text style={styles.totalValue}>₹{orderData.total.toFixed(2)}</Text>
                            </View>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Payment Method</Text>
                                <Text style={styles.summaryValue}>{orderData.paymentMethod}</Text>
                            </View>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Status</Text>
                                <Text style={[styles.summaryValue, { textTransform: "capitalize" }]}>{orderData.status}</Text>
                            </View>
                        </View>

                        {/* Footer */}
                        <View style={styles.receiptFooter}>
                            <Text style={styles.footerText}>Thank you for your purchase!</Text>
                            <Text style={styles.footerSubtext}>This is a computer-generated receipt.</Text>
                        </View>
                    </View>
                </ViewShot>

                {/* Actions */}
                <View style={styles.actions}>
                    <Button
                        title="Download Receipt"
                        onPress={handleDownloadReceipt}
                        disabled={loading}
                        style={styles.actionButton}
                    />
                    <Button title="Share Receipt" onPress={handleShareReceipt} disabled={loading} style={styles.actionButton} />
                    <Button
                        title="Back to Home"
                        onPress={() => router.replace("/user/home")}
                        disabled={loading}
                        style={styles.actionButton}
                    />
                </View>
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
    title: {
        fontSize: 24,
        fontWeight: "bold",
        color: Colors.charcoal,
    },
    receipt: {
        marginBottom: 24,
    },
    receiptContent: {
        backgroundColor: Colors.white,
        padding: 24,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    receiptHeader: {
        alignItems: "center",
        marginBottom: 24,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        paddingBottom: 16,
    },
    logoText: {
        fontSize: 32,
        marginBottom: 8,
    },
    logoName: {
        fontSize: 20,
        fontWeight: "bold",
        color: Colors.charcoal,
    },
    logoTagline: {
        fontSize: 12,
        color: Colors.textMuted,
    },
    infoSection: {
        marginBottom: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    infoLabel: {
        fontSize: 12,
        color: Colors.textMuted,
        marginBottom: 4,
    },
    infoValue: {
        fontSize: 14,
        color: Colors.text,
        fontWeight: "500",
        marginBottom: 12,
    },
    itemsSection: {
        marginBottom: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    itemsTitle: {
        fontSize: 14,
        fontWeight: "600",
        color: Colors.charcoal,
        marginBottom: 12,
    },
    itemRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 8,
    },
    itemDetails: {
        flex: 1,
    },
    itemName: {
        fontSize: 13,
        color: Colors.text,
        fontWeight: "500",
    },
    itemQty: {
        fontSize: 12,
        color: Colors.textMuted,
        marginTop: 2,
    },
    itemPrice: {
        fontSize: 13,
        fontWeight: "600",
        color: Colors.primary,
    },
    summarySection: {
        marginBottom: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    summaryRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 8,
    },
    summaryLabel: {
        fontSize: 13,
        color: Colors.textMuted,
    },
    summaryValue: {
        fontSize: 13,
        color: Colors.text,
        fontWeight: "500",
    },
    totalRow: {
        marginBottom: 12,
    },
    totalLabel: {
        fontSize: 14,
        fontWeight: "bold",
        color: Colors.charcoal,
    },
    totalValue: {
        fontSize: 16,
        fontWeight: "bold",
        color: Colors.primary,
    },
    receiptFooter: {
        alignItems: "center",
    },
    footerText: {
        fontSize: 13,
        color: Colors.charcoal,
        fontWeight: "500",
        marginBottom: 4,
    },
    footerSubtext: {
        fontSize: 11,
        color: Colors.textMuted,
    },
    actions: {
        gap: 12,
    },
    actionButton: {
        marginBottom: 8,
    },
    loadingContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    loadingText: {
        fontSize: 16,
        color: Colors.textMuted,
        marginTop: 12,
    },
})
