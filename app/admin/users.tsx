"use client"

import { db } from "@/config/firebase"
import { Colors } from "@/constants/Colors"
import { arrayUnion, collection, doc, getDocs, Timestamp, updateDoc } from "firebase/firestore"
import { Mail, Phone, Phone as PhoneIcon, Send, X } from "lucide-react-native"
import { useEffect, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

interface User {
  id: string
  name: string
  email: string
  mobile: string
  orders: any[]
  reorders: any[]
  notifications?: any[]
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [notificationTitle, setNotificationTitle] = useState("")
  const [notificationMessage, setNotificationMessage] = useState("")
  const [sendingNotification, setSendingNotification] = useState(false)

  const fetchUsers = async () => {
    try {
      const snapshot = await getDocs(collection(db, "AllUsers"))
      const userData: User[] = []
      snapshot.forEach((doc) => {
        userData.push({
          id: doc.id,
          name: doc.data().name,
          email: doc.data().email,
          mobile: doc.data().mobile,
          orders: doc.data().orders || [],
          reorders: doc.data().reorders || [],
          notifications: doc.data().notifications || [],
        })
      })
      setUsers(userData)
    } catch (error) {
      console.error(" Error fetching users:", error)
      Alert.alert("Error", "Failed to fetch users")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const onRefresh = () => {
    setRefreshing(true)
    fetchUsers()
  }

  const handleUserPress = (user: User) => {
    setSelectedUser(user)
    setModalVisible(true)
  }

  const handleSendNotification = async () => {
    if (!notificationTitle.trim() || !notificationMessage.trim()) {
      Alert.alert("Error", "Please enter title and message")
      return
    }

    if (!selectedUser) return

    setSendingNotification(true)
    try {
      const userRef = doc(db, "AllUsers", selectedUser.id)
      await updateDoc(userRef, {
        notifications: arrayUnion({
          id: `notif_${Date.now()}`,
          title: notificationTitle,
          message: notificationMessage,
          createdAt: Timestamp.now(),
          read: false,
        }),
      })
      Alert.alert("Success", "Notification sent successfully")
      setNotificationTitle("")
      setNotificationMessage("")
      setModalVisible(false)
      fetchUsers()
    } catch (error) {
      console.error(" Error sending notification:", error)
      Alert.alert("Error", "Failed to send notification")
    } finally {
      setSendingNotification(false)
    }
  }

  const handleCall = (mobile: string) => {
    const url = `tel:${mobile}`
    Linking.openURL(url).catch(() => Alert.alert("Error", "Failed to open phone dialer"))
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>User Management</Text>
        <Text style={styles.subtitle}>Total Users: {users.length}</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => handleUserPress(item)}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
              </View>

              <View style={styles.info}>
                <Text style={styles.name}>{item.name}</Text>
                <View style={styles.contactRow}>
                  <Mail size={12} color={Colors.textMuted} />
                  <Text style={styles.contactText}>{item.email}</Text>
                </View>
                <View style={styles.contactRow}>
                  <Phone size={12} color={Colors.textMuted} />
                  <Text style={styles.contactText}>{item.mobile}</Text>
                </View>
              </View>

              <View style={styles.stats}>
                <Text style={styles.ordersCount}>{item.orders.length}</Text>
                <Text style={styles.ordersLabel}>Orders</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Modal for user details and notification sending */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{selectedUser?.name}</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <X size={24} color={Colors.charcoal} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* User Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>User Information</Text>
              <View style={styles.infoBox}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Name</Text>
                  <Text style={styles.infoValue}>{selectedUser?.name}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Email</Text>
                  <Text style={styles.infoValue}>{selectedUser?.email}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Mobile</Text>
                  <Text style={styles.infoValue}>{selectedUser?.mobile}</Text>
                </View>
              </View>
            </View>

            {/* Orders */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Orders ({selectedUser?.orders?.length || 0})</Text>
              {selectedUser?.orders && selectedUser.orders.length > 0 ? (
                selectedUser.orders.slice(0, 5).map((order, index) => (
                  <View key={index} style={styles.orderCard}>
                    <View style={styles.orderHeader}>
                      <Text style={styles.orderId}>Order #{index + 1}</Text>
                      <Text style={styles.orderAmount}>${order.totalAmount?.toFixed(2) || "0.00"}</Text>
                    </View>
                    <Text style={styles.orderDate}>{order.createdAt?.toDate?.()?.toLocaleDateString() || "N/A"}</Text>
                    <Text style={styles.orderItems}>{order.items?.length || 0} items</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>No orders yet</Text>
              )}
            </View>

            {/* Reorders */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Reorders ({selectedUser?.reorders?.length || 0})</Text>
              {selectedUser?.reorders && selectedUser.reorders.length > 0 ? (
                selectedUser.reorders.slice(0, 5).map((reorder, index) => (
                  <View key={index} style={styles.orderCard}>
                    <Text style={styles.reorderItem}>Reorder #{index + 1}</Text>
                    <Text style={styles.orderDate}>{reorder.createdAt?.toDate?.()?.toLocaleDateString() || "N/A"}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>No reorders yet</Text>
              )}
            </View>

            {/* Send Notification */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Send Custom Notification</Text>
              <TextInput
                style={styles.notificationInput}
                placeholder="Notification Title"
                value={notificationTitle}
                onChangeText={setNotificationTitle}
                editable={!sendingNotification}
                placeholderTextColor={Colors.textMuted}
              />
              <TextInput
                style={[styles.notificationInput, styles.messageInput]}
                placeholder="Notification Message"
                value={notificationMessage}
                onChangeText={setNotificationMessage}
                multiline
                numberOfLines={4}
                editable={!sendingNotification}
                placeholderTextColor={Colors.textMuted}
              />
              <TouchableOpacity
                style={[styles.sendButton, sendingNotification && styles.sendButtonDisabled]}
                onPress={handleSendNotification}
                disabled={sendingNotification}
              >
                {sendingNotification ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <>
                    <Send size={18} color={Colors.white} />
                    <Text style={styles.sendButtonText}>Send Notification</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Call Button */}
            <TouchableOpacity style={styles.callButton} onPress={() => handleCall(selectedUser?.mobile || "")}>
              <PhoneIcon size={20} color={Colors.white} />
              <Text style={styles.callButtonText}>Call {selectedUser?.name}</Text>
            </TouchableOpacity>
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
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.charcoal,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  list: {
    padding: 20,
    gap: 12,
  },
  card: {
    flexDirection: "row",
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.primary,
  },
  info: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.charcoal,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  contactText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  stats: {
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  ordersCount: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.charcoal,
  },
  ordersLabel: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.charcoal,
  },
  modalContent: {
    padding: 20,
    gap: 20,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.charcoal,
  },
  infoBox: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.textMuted,
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 14,
    color: Colors.charcoal,
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  orderCard: {
    backgroundColor: Colors.white,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  orderId: {
    fontSize: 14,
    fontWeight: "bold",
    color: Colors.charcoal,
  },
  orderAmount: {
    fontSize: 14,
    fontWeight: "bold",
    color: Colors.primary,
  },
  orderDate: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  orderItems: {
    fontSize: 12,
    color: Colors.text,
  },
  reorderItem: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.charcoal,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textMuted,
    fontStyle: "italic",
  },
  notificationInput: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.text,
  },
  messageInput: {
    height: 100,
    textAlignVertical: "top",
  },
  sendButton: {
    flexDirection: "row",
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 12,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: "600",
  },
  callButton: {
    flexDirection: "row",
    backgroundColor: "#059669",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 20,
  },
  callButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
})
