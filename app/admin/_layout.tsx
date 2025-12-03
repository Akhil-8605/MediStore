import { Tabs } from "expo-router"
import { LayoutDashboard, Pill, Users, Bell, CreditCard } from "lucide-react-native"
import { Colors } from "@/constants/Colors"
import { AdminProvider } from "@/context/AdminContext"

export default function AdminLayout() {
  return (
    <AdminProvider>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: Colors.textMuted,
          tabBarStyle: {
            borderTopWidth: 1,
            borderTopColor: Colors.border,
            height: 60,
            paddingBottom: 8,
            paddingTop: 8,
          },
          headerShown: false,
        }}
      >
        <Tabs.Screen
          name="dashboard"
          options={{
            title: "Dashboard",
            tabBarIcon: ({ color, size }) => <LayoutDashboard size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="medicines"
          options={{
            title: "Medicines",
            tabBarIcon: ({ color, size }) => <Pill size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="users"
          options={{
            title: "Users",
            tabBarIcon: ({ color, size }) => <Users size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="notifications"
          options={{
            title: "Alerts",
            tabBarIcon: ({ color, size }) => <Bell size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="payments"
          options={{
            title: "Payments",
            tabBarIcon: ({ color, size }) => <CreditCard size={size} color={color} />,
          }}
        />
      </Tabs>
    </AdminProvider>
  )
}
