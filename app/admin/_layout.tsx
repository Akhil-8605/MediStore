"use client"

import { useState } from "react"
import { View, StyleSheet } from "react-native"
import { Stack } from "expo-router"
import { Colors } from "../../constants/Colors"
import { AdminProvider } from "../../context/AdminContext"
import AdminDrawer from "../../components/Admin/AdminDrawer"
import { Menu } from "lucide-react-native"
import { TouchableOpacity } from "react-native"
import { useRoute } from "@react-navigation/native"

export default function AdminLayout() {
  const [drawerVisible, setDrawerVisible] = useState(false)
  const route = useRoute()

  const getActiveRoute = () => {
    if (route?.name?.includes("orders")) return "orders"
    return route?.name || "dashboard"
  }

  return (
    <AdminProvider>
      <View style={styles.container}>
        <Stack
          screenOptions={{
            headerShown: true,
            headerStyle: {
              backgroundColor: Colors.white,
            },
            headerTintColor: Colors.charcoal,
            headerTitleStyle: {
              fontWeight: "bold",
            },
            headerLeft: () => null,
            headerRight: () => (
              <TouchableOpacity style={styles.menuButton} onPress={() => setDrawerVisible(true)}>
                <Menu size={24} color={Colors.charcoal} />
              </TouchableOpacity>
            ),
          }}
        >
          <Stack.Screen
            name="dashboard"
            options={{
              title: "Dashboard",
            }}
          />
          <Stack.Screen
            name="medicines"
            options={{
              title: "Medicines",
            }}
          />
          <Stack.Screen
            name="users"
            options={{
              title: "Users",
            }}
          />
          <Stack.Screen
            name="alerts"
            options={{
              title: "Alerts",
            }}
          />
          <Stack.Screen
            name="payments"
            options={{
              title: "Payments",
            }}
          />
          <Stack.Screen
            name="orders"
            options={{
              title: "Orders Management",
            }}
          />
        </Stack>

        <AdminDrawer visible={drawerVisible} onClose={() => setDrawerVisible(false)} activeRoute={getActiveRoute()} />
      </View>
    </AdminProvider>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 0,
    marginTop: 0,
  },
  menuButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    justifyContent: "flex-end",
  },
})
