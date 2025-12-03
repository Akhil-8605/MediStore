"use client"

import { db } from "@/config/firebase"
import { Colors } from "@/constants/Colors"
import { useAuth } from "@/context/AuthContext"
import { router } from "expo-router"
import { doc, getDoc } from "firebase/firestore"
import { Bell, ChevronRight, HelpCircle, LogOut, Package, Settings } from "lucide-react-native"
import { useState } from "react"
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

const MENU_ITEMS = [
  { icon: Package, label: "My Orders", route: "/user/orders" },
  { icon: Bell, label: "Notifications", route: "/user/notifications" },
  { icon: Settings, label: "Settings", route: "/user/settings" },
  { icon: HelpCircle, label: "Help & Support", route: "/user/help" },
]

export default function ProfileScreen() {
  const { userData, logout, user } = useAuth()
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [profileData, setProfileData] = useState(userData)

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      if (user?.uid) {
        const userRef = doc(db, "AllUsers", user.uid)
        const userSnap = await getDoc(userRef)
        if (userSnap.exists()) {
          setProfileData(userSnap.data() as any)
        }
      }
    } catch (error) {
      console.error(" Error refreshing profile:", error)
    } finally {
      setRefreshing(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    router.replace("/login")
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{profileData?.name?.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.name}>{profileData?.name}</Text>
          <Text style={styles.email}>{profileData?.email}</Text>
          <Text style={styles.mobile}>{profileData?.mobile}</Text>
        </View>

        {/* User Statistics */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{profileData?.orders?.length || 0}</Text>
            <Text style={styles.statLabel}>Total Orders</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{profileData?.reorders?.length || 0}</Text>
            <Text style={styles.statLabel}>Reorders</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{profileData?.notifications?.length || 0}</Text>
            <Text style={styles.statLabel}>Notifications</Text>
          </View>
        </View>

        <View style={styles.menu}>
          {MENU_ITEMS.map((item, index) => (
            <TouchableOpacity key={index} style={styles.menuItem} onPress={() => router.push(item.route as any)}>
              <View style={styles.menuIcon}>
                <item.icon size={20} color={Colors.primary} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <ChevronRight size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color={Colors.error} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.secondary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "bold",
    color: Colors.primary,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.charcoal,
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  mobile: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  statsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: "center",
  },
  menu: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 24,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.secondary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    color: Colors.charcoal,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    backgroundColor: "#FEF2F2",
    borderRadius: 12,
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.error,
  },
})
