"use client"

import { useFonts } from "expo-font"
import { Stack, useRouter } from "expo-router"
import * as SplashScreen from "expo-splash-screen"
import { StatusBar } from "expo-status-bar"
import { useEffect, useRef, useState } from "react"
import { AuthProvider, useAuth } from "../context/AuthContext"
import { CartProvider } from "../context/CartContext"
import { pushNotificationService } from "../services/pushNotificationService"
import { authService } from "../services/authService"
import * as Notifications from "expo-notifications"

SplashScreen.preventAutoHideAsync()

function NotificationHandler() {
  const router = useRouter()
  const { user, isAdmin } = useAuth()
  const notificationResponseListener = useRef<Notifications.EventSubscription | null>(null)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    // Prevent double initialization
    if (initialized) return

    const initNotifications = async () => {
      try {
        if (user) {
          await pushNotificationService.initialize(user.uid, isAdmin)
          setInitialized(true)
        } else {
          // Check if admin is logged in
          const adminLoggedIn = await authService.isAdminLoggedIn()
          if (adminLoggedIn) {
            await pushNotificationService.initialize(undefined, true)
            setInitialized(true)
          }
        }
      } catch (error) {
        console.error("Error initializing notifications:", error)
      }
    }

    initNotifications()

    // Handle notification response
    notificationResponseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data

      if (isAdmin) {
        switch (data?.type) {
          case "new_order":
            router.push("/admin/orders")
            break
          case "new_user":
            router.push("/admin/users")
            break
          case "alert":
          case "low_stock":
            router.push("/admin/alerts")
            break
          default:
            router.push("/admin/notifications")
        }
      } else {
        // User navigation - always go to notifications
        router.push("/user/notification")
      }
    })

    return () => {
      if (notificationResponseListener.current) {
        notificationResponseListener.current.remove()
      }
      pushNotificationService.cleanup()
    }
  }, [user, isAdmin, router, initialized])

  return null
}

function RootLayoutContent() {
  return (
    <>
      <StatusBar style="dark" />
      <NotificationHandler />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="user" />
        <Stack.Screen name="admin" />
        <Stack.Screen name="reciept" />
        <Stack.Screen name="billing" />
        <Stack.Screen name="orders" />
      </Stack>
    </>
  )
}

export default function RootLayout() {
  const [loaded] = useFonts({})

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync()
    }
  }, [loaded])

  if (!loaded) {
    return null
  }

  return (
    <AuthProvider>
      <CartProvider>
        <RootLayoutContent />
      </CartProvider>
    </AuthProvider>
  )
}
