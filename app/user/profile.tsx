"use client"

import { db } from "../../config/firebase"
import { Colors } from "../../constants/Colors"
import { useAuth } from "../../context/AuthContext"
import { router } from "expo-router"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { Bell, ChevronRight, HelpCircle, Lock, LogOut, Package, Settings, Edit2 } from "lucide-react-native"
import { useState } from "react"
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
  TextInput,
  Alert,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Button } from "../../components/ui/Button"
import { passwordService } from "../../services/passwordServices"

const MENU_ITEMS = [
  { icon: Package, label: "My Orders", route: "/orders" },
  { icon: Bell, label: "Notifications", route: "/user/notifications" },
]

export default function ProfileScreen() {
  const { userData, logout, user } = useAuth()
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [profileData, setProfileData] = useState(userData)
  const [showEditProfile, setShowEditProfile] = useState(false)
  const [editName, setEditName] = useState(userData?.name || "")
  const [editMobile, setEditMobile] = useState(userData?.mobile || "")
  const [editLoading, setEditLoading] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [forgotEmail, setForgotEmail] = useState(userData?.email || "")
  const [forgotLoading, setForgotLoading] = useState(false)

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      if (user?.uid) {
        const userRef = doc(db, "AllUsers", user.uid)
        const userSnap = await getDoc(userRef)
        if (userSnap.exists()) {
          setProfileData(userSnap.data() as any)
          setEditName(userSnap.data().name)
          setEditMobile(userSnap.data().mobile)
        }
      }
    } catch (error) {
      console.error("Error refreshing profile:", error)
    } finally {
      setRefreshing(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!editName.trim() || !editMobile.trim()) {
      Alert.alert("Error", "Name and mobile cannot be empty")
      return
    }

    if (editMobile.length < 10) {
      Alert.alert("Error", "Please enter a valid mobile number")
      return
    }

    try {
      setEditLoading(true)
      if (user?.uid) {
        const userRef = doc(db, "AllUsers", user.uid)
        await updateDoc(userRef, {
          name: editName,
          mobile: editMobile,
        })

        setProfileData((prev: any) => ({
          ...prev,
          name: editName,
          mobile: editMobile,
        }))

        Alert.alert("Success", "Profile updated successfully")
        setShowEditProfile(false)
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to update profile")
    } finally {
      setEditLoading(false)
    }
  }

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert("Error", "All password fields are required")
      return
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "New passwords do not match")
      return
    }

    if (newPassword.length < 6) {
      Alert.alert("Error", "New password must be at least 6 characters")
      return
    }

    try {
      setPasswordLoading(true)
      await passwordService.changePassword(currentPassword, newPassword)
      Alert.alert("Success", "Password changed successfully")
      setShowChangePassword(false)
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to change password")
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!forgotEmail.trim()) {
      Alert.alert("Error", "Please enter your email")
      return
    }

    try {
      setForgotLoading(true)
      await passwordService.sendPasswordReset(forgotEmail)
      Alert.alert("Success", "Password reset email sent! Check your inbox for the reset link.")
      setShowForgotPassword(false)
      setForgotEmail(userData?.email || "")
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to send reset email")
    } finally {
      setForgotLoading(false)
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
          <View style={styles.headerTop}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>{profileData?.name?.charAt(0).toUpperCase()}</Text>
            </View>
            <TouchableOpacity style={styles.editButton} onPress={() => setShowEditProfile(true)}>
              <Edit2 size={20} color={Colors.primary} />
            </TouchableOpacity>
          </View>
          <Text style={styles.name}>{profileData?.name}</Text>
          <Text style={styles.email}>{profileData?.email}</Text>
          <Text style={styles.mobile}>{profileData?.mobile}</Text>
        </View>

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

        <View style={styles.menu}>
          <TouchableOpacity style={styles.menuItem} onPress={() => setShowChangePassword(true)}>
            <View style={styles.menuIcon}>
              <Lock size={20} color={Colors.primary} />
            </View>
            <Text style={styles.menuLabel}>Change Password</Text>
            <ChevronRight size={20} color={Colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, styles.lastMenuItem]} onPress={() => setShowForgotPassword(true)}>
            <View style={styles.menuIcon}>
              <Lock size={20} color={Colors.primary} />
            </View>
            <Text style={styles.menuLabel}>Forgot Password</Text>
            <ChevronRight size={20} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color={Colors.error} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={showEditProfile}
        transparent
        animationType="slide"
        onRequestClose={() => !editLoading && setShowEditProfile(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Profile</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={editName}
                onChangeText={setEditName}
                placeholder="Enter your name"
                editable={!editLoading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mobile Number</Text>
              <TextInput
                style={styles.input}
                value={editMobile}
                onChangeText={setEditMobile}
                placeholder="Enter your mobile number"
                keyboardType="phone-pad"
                editable={!editLoading}
              />
            </View>

            <View style={styles.modalActions}>
              <Button
                title={editLoading ? "Saving..." : "Save Changes"}
                onPress={handleSaveProfile}
                disabled={editLoading}
              />
              <Button
                title="Cancel"
                onPress={() => {
                  setShowEditProfile(false)
                  setEditName(profileData?.name || "")
                  setEditMobile(profileData?.mobile || "")
                }}
                disabled={editLoading}
                style={styles.cancelButton}
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <Modal
        visible={showChangePassword}
        transparent
        animationType="slide"
        onRequestClose={() => !passwordLoading && setShowChangePassword(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Password</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Current Password</Text>
              <TextInput
                style={styles.input}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Enter current password"
                secureTextEntry
                editable={!passwordLoading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>New Password</Text>
              <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter new password"
                secureTextEntry
                editable={!passwordLoading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm New Password</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm new password"
                secureTextEntry
                editable={!passwordLoading}
              />
            </View>

            <View style={styles.modalActions}>
              <Button
                title={passwordLoading ? "Updating..." : "Update Password"}
                onPress={handleChangePassword}
                disabled={passwordLoading}
              />
              <Button
                title="Cancel"
                onPress={() => {
                  setShowChangePassword(false)
                  setCurrentPassword("")
                  setNewPassword("")
                  setConfirmPassword("")
                }}
                disabled={passwordLoading}
                style={styles.cancelButton}
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <Modal
        visible={showForgotPassword}
        transparent
        animationType="slide"
        onRequestClose={() => !forgotLoading && setShowForgotPassword(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <ScrollView contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalTitle}>Reset Password</Text>
            <Text style={styles.modalSubtitle}>We'll send a password reset link to your email address</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.input}
                value={forgotEmail}
                onChangeText={setForgotEmail}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!forgotLoading}
              />
            </View>

            <View style={styles.modalActions}>
              <Button
                title={forgotLoading ? "Sending..." : "Send Reset Link"}
                onPress={handleForgotPassword}
                disabled={forgotLoading}
              />
              <Button
                title="Cancel"
                onPress={() => {
                  setShowForgotPassword(false)
                  setForgotEmail(userData?.email || "")
                }}
                disabled={forgotLoading}
                style={styles.cancelButton}
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    position: "relative",
    width: "100%",
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.logoback,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "bold",
    color: Colors.primary,
  },
  editButton: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
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
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.logoback,
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
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalContent: {
    padding: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.charcoal,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.charcoal,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: Colors.text,
  },
  modalActions: {
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    backgroundColor: Colors.neutralGray,
  },
})
