"use client"

import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Animated } from "react-native"
import { router } from "expo-router"
import { LayoutDashboard, Pill, Users, CreditCard, LogOut, X, AlertCircle } from "lucide-react-native"
import { Colors } from "@/constants/Colors"
import { authService } from "@/services/authService"
import { useEffect, useRef } from "react"

interface AdminDrawerProps {
    visible: boolean
    onClose: () => void
    activeRoute?: string
}

const MENU_ITEMS = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, route: "/admin/dashboard" },
    { id: "medicines", label: "Medicines", icon: Pill, route: "/admin/medicines" },
    { id: "orders", label: "Orders", icon: LayoutDashboard, route: "/admin/orders" },
    { id: "users", label: "Users", icon: Users, route: "/admin/users" },
    { id: "alerts", label: "Alerts", icon: AlertCircle, route: "/admin/alerts" },
    { id: "payments", label: "Payments", icon: CreditCard, route: "/admin/payments" },
]

export default function AdminDrawer({ visible, onClose, activeRoute }: AdminDrawerProps) {
    const slideAnim = useRef(new Animated.Value(1000)).current
    const fadeAnim = useRef(new Animated.Value(10)).current

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: false,
                }),
            ]).start()
        } else {
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: 1000,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 0,
                    useNativeDriver: false,
                }),
            ]).start()
        }
    }, [visible, slideAnim, fadeAnim])

    const handleLogout = () => {
        Alert.alert("Logout", "Are you sure you want to logout?", [
            { text: "Cancel", onPress: () => { } },
            {
                text: "Logout",
                onPress: async () => {
                    try {
                        await authService.logout()
                        router.replace("/login")
                        onClose()
                    } catch (error) {
                        Alert.alert("Error", "Failed to logout")
                    }
                },
            },
        ])
    }

    const handleMenuPress = (route: string) => {
        router.push(route as any)
        onClose()
    }

    if (!visible) return null

    return (
        <View style={styles.container}>
            <Animated.View
                style={[
                    styles.overlay,
                    {
                        opacity: fadeAnim,
                    },
                ]}
            >
                <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={onClose} activeOpacity={1} />
            </Animated.View>

            <Animated.View
                style={[
                    styles.drawer,
                    {
                        transform: [{ translateX: slideAnim }],
                    },
                ]}
            >
                <View style={styles.header}>
                    <View style={styles.logoContainer}>
                        <View style={styles.logoBadge}>
                            <Text style={styles.logoText}>M</Text>
                        </View>
                        <View>
                            <Text style={styles.headerTitle}>MediStore Admin</Text>
                            <Text style={styles.headerSubtitle}>Management Hub</Text>
                        </View>
                    </View>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <X size={24} color={Colors.charcoal} />
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {MENU_ITEMS.map((item, index) => (
                        <TouchableOpacity
                            key={item.id}
                            style={[styles.menuItem, activeRoute?.includes(item.id) && styles.menuItemActive]}
                            onPress={() => handleMenuPress(item.route)}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.iconContainer, activeRoute?.includes(item.id) && styles.iconContainerActive]}>
                                <item.icon size={20} color={activeRoute?.includes(item.id) ? Colors.white : Colors.primary} />
                            </View>
                            <Text style={[styles.menuLabel, activeRoute?.includes(item.id) && styles.menuLabelActive]}>
                                {item.label}
                            </Text>
                            {activeRoute?.includes(item.id) && <View style={styles.activeIndicator} />}
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <View style={styles.footer}>
                    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
                        <LogOut size={20} color={Colors.error} />
                        <Text style={styles.logoutText}>Logout</Text>
                    </TouchableOpacity>
                </View>
            </Animated.View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        flexDirection: "row",
        zIndex: 1000,
    },
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    drawer: {
        width: "75%",
        backgroundColor: Colors.white,
        paddingTop: 16,
        flexDirection: "column",
        shadowColor: "#000",
        shadowOffset: { width: 2, height: 0 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 12,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 20,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    logoContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        flex: 1,
    },
    logoBadge: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.primary,
        alignItems: "center",
        justifyContent: "center",
    },
    logoText: {
        fontSize: 20,
        fontWeight: "700",
        color: Colors.white,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: Colors.charcoal,
        marginBottom: 2,
    },
    headerSubtitle: {
        fontSize: 12,
        color: Colors.textMuted,
    },
    closeButton: {
        padding: 8,
    },
    content: {
        flex: 1,
        paddingVertical: 8,
    },
    menuItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 14,
        gap: 12,
        marginVertical: 2,
        marginHorizontal: 8,
        borderRadius: 8,
    },
    menuItemActive: {
        backgroundColor: `${Colors.primary}15`,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "transparent",
    },
    iconContainerActive: {
        backgroundColor: Colors.primary,
    },
    menuLabel: {
        fontSize: 15,
        color: Colors.text,
        fontWeight: "500",
        flex: 1,
    },
    menuLabelActive: {
        color: Colors.primary,
        fontWeight: "700",
    },
    activeIndicator: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: Colors.primary,
    },
    footer: {
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        padding: 16,
        gap: 8,
    },
    logoutButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 12,
        gap: 8,
        borderRadius: 8,
        backgroundColor: "#FEE2E2",
    },
    logoutText: {
        fontSize: 14,
        fontWeight: "600",
        color: Colors.error,
    },
})
