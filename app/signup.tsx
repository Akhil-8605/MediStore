"use client"

import { useState } from "react"
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from "react-native"
import { router } from "expo-router"
import { SafeAreaView } from "react-native-safe-area-context"
import { Input } from "../components/ui/Input"
import { Button } from "../components/ui/Button"
import { Colors } from "../constants/Colors"
import { useAuth } from "../context/AuthContext"

export default function SignupScreen() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    password: "",
    confirmPassword: "",
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const { signup } = useAuth()

  const handleSignup = async () => {
    if (!formData.name || !formData.email || !formData.mobile || !formData.password) {
      setError("Please fill in all fields")
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    if (formData.mobile.length < 10) {
      setError("Please enter a valid mobile number")
      return
    }

    try {
      setLoading(true)
      setError("")

      await signup(formData.email, formData.password, formData.name, formData.mobile)

      Alert.alert("Success", "Account created successfully!", [
        {
          text: "OK",
          onPress: () => router.replace("/user/home"),
        },
      ])
    } catch (err: any) {
      setError(err.message || "Signup failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join MediStore for easy medicine management</Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Full Name"
            placeholder="John Doe"
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            editable={!loading}
          />
          <Input
            label="Email"
            placeholder="john@example.com"
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
          />
          <Input
            label="Mobile Number"
            placeholder="9876543210"
            value={formData.mobile}
            onChangeText={(text) => setFormData({ ...formData, mobile: text })}
            keyboardType="phone-pad"
            editable={!loading}
          />
          <Input
            label="Password"
            placeholder="••••••••"
            value={formData.password}
            onChangeText={(text) => setFormData({ ...formData, password: text })}
            secureTextEntry
            editable={!loading}
          />
          <Input
            label="Confirm Password"
            placeholder="••••••••"
            value={formData.confirmPassword}
            onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
            secureTextEntry
            editable={!loading}
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Button
            title={loading ? "Creating account..." : "Create Account"}
            onPress={handleSignup}
            disabled={loading}
            style={styles.signupButton}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push("/login")} disabled={loading}>
              <Text style={styles.linkText}>Sign In</Text>
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
  },
  scrollContent: {
    padding: 20,
    flexGrow: 1,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.charcoal,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  form: {
    gap: 16,
  },
  errorText: {
    color: Colors.error,
    fontSize: 14,
  },
  signupButton: {
    marginTop: 8,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
  },
  footerText: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  linkText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: "600",
  },
})
