"use client"

import { Tabs } from "expo-router"
import { Home, Search, ShoppingCart, Bell, User } from "lucide-react-native"
import { Colors } from "../../constants/Colors"
import { useCart } from "../../context/CartContext"
import { useAuth } from "../../context/AuthContext"
import { View, Text } from "react-native"

export default function TabLayout() {
  const { items } = useCart()
  const { userData } = useAuth()

  const unreadNotifications = userData?.notifications?.filter((n) => !n.read).length || 0
  const cartCount = items.length

  return (
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
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarIcon: ({ color, size }) => <Search size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: "Cart",
          tabBarIcon: ({ color, size }) => (
            <View>
              <ShoppingCart size={size} color={color} />
              {cartCount > 0 && (
                <View
                  style={{
                    position: "absolute",
                    right: -8,
                    top: -8,
                    backgroundColor: Colors.error,
                    borderRadius: 10,
                    width: 20,
                    height: 20,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: "white", fontSize: 10, fontWeight: "bold" }}>{cartCount}</Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: "Notifications",
          tabBarIcon: ({ color, size }) => (
            <View>
              <Bell size={size} color={color} />
              {unreadNotifications > 0 && (
                <View
                  style={{
                    position: "absolute",
                    right: -8,
                    top: -8,
                    backgroundColor: Colors.error,
                    borderRadius: 10,
                    width: 20,
                    height: 20,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: "white", fontSize: 10, fontWeight: "bold" }}>{unreadNotifications}</Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  )
}
