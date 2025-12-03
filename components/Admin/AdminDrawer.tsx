import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from "react-native"
import { router } from "expo-router"
import { LayoutDashboard, Pill, Users, Bell, CreditCard, LogOut, X } from "lucide-react-native"
import { Colors } from "@/constants/Colors"
import { authService } from "@/services/authService"

interface AdminDrawerProps {
    visible: boolean
    onClose: () => void
    activeRoute?: string
}

const MENU_ITEMS = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, route: "/admin/dashboard" },
    { id: "medicines", label: "Medicines", icon: Pill, route: "/admin/medicines" },
    { id: "users", label: "Users", icon: Users, route: "/admin/users" },
    { id: "alerts", label: "Alerts", icon: Bell, route: "/admin/alerts" },
    { id: "payments", label: "Payments", icon: CreditCard, route: "/admin/payments" },
]

export default function AdminDrawer({ visible, onClose, activeRoute }: AdminDrawerProps) {
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
            {/* Overlay */}
            <TouchableOpacity style={styles.overlay} onPress={onClose} activeOpacity={1} />

            {/* Drawer */}
            <View style={styles.drawer}>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.headerTitle}>MediCare Admin</Text>
                        <Text style={styles.headerSubtitle}>Management Panel</Text>
                    </View>
                    <TouchableOpacity onPress={onClose}>
                        <X size={24} color={Colors.charcoal} />
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {MENU_ITEMS.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            style={[styles.menuItem, activeRoute?.includes(item.id) && styles.menuItemActive]}
                            onPress={() => handleMenuPress(item.route)}
                        >
                            <item.icon size={20} color={activeRoute?.includes(item.id) ? Colors.primary : Colors.textMuted} />
                            <Text style={[styles.menuLabel, activeRoute?.includes(item.id) && styles.menuLabelActive]}>
                                {item.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <View style={styles.footer}>
                    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                        <LogOut size={20} color={Colors.error} />
                        <Text style={styles.logoutText}>Logout</Text>
                    </TouchableOpacity>
                </View>
            </View>
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
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: Colors.charcoal,
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 12,
        color: Colors.textMuted,
    },
    content: {
        flex: 1,
        paddingVertical: 8,
    },
    menuItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 12,
        gap: 12,
        marginVertical: 2,
    },
    menuItemActive: {
        backgroundColor: `${Colors.primary}15`,
        borderLeftWidth: 4,
        borderLeftColor: Colors.primary,
        paddingLeft: 16,
    },
    menuLabel: {
        fontSize: 16,
        color: Colors.text,
        fontWeight: "500",
    },
    menuLabelActive: {
        color: Colors.primary,
        fontWeight: "700",
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
        paddingVertical: 10,
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
