"use client"

import { useFonts } from "expo-font"
import { Stack } from "expo-router"
import * as SplashScreen from "expo-splash-screen"
import { StatusBar } from "expo-status-bar"
import { useEffect } from "react"
import { AuthProvider } from "../context/AuthContext"
import { CartProvider } from "../context/CartContext"

SplashScreen.preventAutoHideAsync()

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
        <>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="login" />
            <Stack.Screen name="signup" />
            <Stack.Screen name="user" />
            <Stack.Screen name="admin" />
            <Stack.Screen name="reci" />
          </Stack>
        </>
      </CartProvider>
    </AuthProvider>
  )
}
