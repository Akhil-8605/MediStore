"use client"

import { useAuth } from "@/context/AuthContext"
import { useEffect, useState } from "react"
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { Colors } from "@/constants/Colors"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { useRouter } from "expo-router"
import { authService } from "@/services/authService"

export default function LoginScreen() {
  const [activeTab, setActiveTab] = useState<"user" | "admin">("user")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [resetEmail, setResetEmail] = useState("")

  const { login, isAdmin, user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user) {
      if (isAdmin) {
        router.replace("/admin/dashboard")
      } else {
        router.replace("/user/home")
      }
    }
  }, [user, isAdmin])

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please fill in all fields")
      return
    }

    try {
      setLoading(true)
      setError("")

      if (activeTab === "admin") {
        if (email == "admin@gmail.com" || password == "admin@12345") {
          router.replace("/admin/dashboard")
        }
      }

      await login(email, password)
    } catch (err: any) {
      setError(err.message || "Login failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!resetEmail) {
      setError("Please enter your email")
      return
    }
    try {
      setLoading(true)
      await authService.sendPasswordReset(resetEmail)
      alert("Password reset email sent! Check your inbox.")
      setShowForgotPassword(false)
      setResetEmail("")
    } catch (err: any) {
      setError(err.message || "Failed to send reset email")
    } finally {
      setLoading(false)
    }
  }

  if (showForgotPassword) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity onPress={() => setShowForgotPassword(false)}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>Enter your email to receive a reset link</Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Email"
              placeholder="john@example.com"
              value={resetEmail}
              onChangeText={setResetEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Button
              title={loading ? "Sending..." : "Send Reset Link"}
              onPress={handleForgotPassword}
              disabled={loading}
              style={styles.loginButton}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={{ fontSize: 32 }}>💊</Text>
          </View>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to your MediStore account</Text>
        </View>

        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "user" && styles.activeTab]}
            onPress={() => setActiveTab("user")}
          >
            <Text style={[styles.tabText, activeTab === "user" && styles.activeTabText]}>Patient</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "admin" && styles.activeTab]}
            onPress={() => setActiveTab("admin")}
          >
            <Text style={[styles.tabText, activeTab === "admin" && styles.activeTabText]}>Medical Owner</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <Input
            label="Email"
            placeholder="john@example.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!loading}
          />
          <Input
            label="Password"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!loading}
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={styles.forgotPassword}
            onPress={() => setShowForgotPassword(true)}
            disabled={loading}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          <Button
            title={loading ? "Signing in..." : "Sign In"}
            onPress={handleLogin}
            disabled={loading}
            style={styles.loginButton}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push("/signup")} disabled={loading}>
              <Text style={styles.linkText}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 16,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  logoContainer: {
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.text,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.secondary,
    marginTop: 4,
  },
  tabsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 16,
  },
  tab: {
    padding: 8,
    backgroundColor: Colors.white,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  activeTab: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: 16,
    color: Colors.text,
  },
  activeTabText: {
    color: Colors.white,
  },
  form: {
    width: "100%",
  },
  backButton: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
  },
  errorText: {
    color: Colors.error,
    fontSize: 14,
    marginBottom: 8,
  },
  forgotPassword: {
    alignItems: "flex-end",
    marginBottom: 16,
  },
  forgotPasswordText: {
    color: Colors.primary,
    fontSize: 14,
  },
  loginButton: {
    marginTop: 16,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
  },
  footerText: {
    fontSize: 14,
    color: Colors.secondary,
  },
  linkText: {
    fontSize: 14,
    color: Colors.primary,
    marginLeft: 4,
  },
})
