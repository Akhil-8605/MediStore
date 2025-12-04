"use client"

import { useState, useEffect, useCallback } from "react"
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Colors } from "@/constants/Colors"
import { Search, Plus, Edit2, Trash2, Filter, X } from "lucide-react-native"
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, Timestamp } from "firebase/firestore"
import { db } from "@/config/firebase"

interface Medicine {
  id?: string
  name: string
  description: string
  type: string
  price: number
  totalQuantity: number
  lowStockAlert: number
  expiryDate: string
}

export default function AdminMedicines() {
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState("")
  const [filterType, setFilterType] = useState("")
  const [filterLowStock, setFilterLowStock] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [filterModalVisible, setFilterModalVisible] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<Medicine>({
    name: "",
    description: "",
    type: "",
    price: 0,
    totalQuantity: 0,
    lowStockAlert: 0,
    expiryDate: "",
  })

  const fetchMedicines = useCallback(async () => {
    try {
      const snapshot = await getDocs(collection(db, "AllMedicines"))
      const meds: Medicine[] = []
      snapshot.forEach((doc) => {
        meds.push({ id: doc.id, ...doc.data() } as Medicine)
      })
      setMedicines(meds)
    } catch (error) {
      console.error("Error fetching medicines:", error)
      Alert.alert("Error", "Failed to fetch medicines")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchMedicines()
  }, [fetchMedicines])

  const onRefresh = () => {
    setRefreshing(true)
    fetchMedicines()
  }

  const filteredList = medicines.filter((m) => {
    let matches = true

    if (search) {
      const term = search.toLowerCase()
      matches =
        matches &&
        (m.name.toLowerCase().includes(term) ||
          m.type.toLowerCase().includes(term) ||
          m.price.toString().includes(term) ||
          m.totalQuantity.toString().includes(term))
    }

    if (filterType) {
      matches = matches && m.type === filterType
    }

    if (filterLowStock) {
      matches = matches && m.totalQuantity <= m.lowStockAlert
    }

    return matches
  })

  const medicineTypes = [...new Set(medicines.map((m) => m.type))]

  const handleOpenModal = (medicine?: Medicine) => {
    if (medicine) {
      setEditingId(medicine.id || null)
      setFormData(medicine)
    } else {
      setEditingId(null)
      setFormData({
        name: "",
        description: "",
        type: "",
        price: 0,
        totalQuantity: 0,
        lowStockAlert: 0,
        expiryDate: "",
      })
    }
    setModalVisible(true)
  }

  const handleSave = async () => {
    if (!formData.name || !formData.type || formData.price <= 0 || formData.totalQuantity < 0) {
      Alert.alert("Error", "Please fill all required fields correctly")
      return
    }

    setSaving(true)
    try {
      if (editingId) {
        // Update existing medicine
        await updateDoc(doc(db, "AllMedicines", editingId), {
          ...formData,
          updatedAt: Timestamp.now(),
        })
        Alert.alert("Success", "Medicine updated successfully")
      } else {
        // Add new medicine
        await addDoc(collection(db, "AllMedicines"), {
          ...formData,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        })
        Alert.alert("Success", "Medicine added successfully")
      }
      setModalVisible(false)
      fetchMedicines()
    } catch (error) {
      console.error("Error saving medicine:", error)
      Alert.alert("Error", "Failed to save medicine")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = (id: string) => {
    Alert.alert("Delete Medicine", "Are you sure you want to delete this medicine?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        onPress: async () => {
          try {
            await deleteDoc(doc(db, "AllMedicines", id))
            Alert.alert("Success", "Medicine deleted successfully")
            fetchMedicines()
          } catch (error) {
            console.error("Error deleting medicine:", error)
            Alert.alert("Error", "Failed to delete medicine")
          }
        },
        style: "destructive",
      },
    ])
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Medicine Management</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => handleOpenModal()}>
          <Plus size={20} color={Colors.white} />
          <Text style={styles.addButtonText}>Add New</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Search size={20} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search medicines..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor={Colors.textMuted}
        />
        <TouchableOpacity style={styles.filterButton} onPress={() => setFilterModalVisible(true)}>
          <Filter size={20} color={filterType || filterLowStock ? Colors.primary : Colors.textMuted} />
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredList}
          keyExtractor={(item) => item.id || ""}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardContent}>
                <View style={styles.row}>
                  <Text style={styles.name}>{item.name}</Text>
                  <View
                    style={[
                      styles.stockBadge,
                      item.totalQuantity <= item.lowStockAlert ? styles.lowStock : styles.inStock,
                    ]}
                  >
                    <Text
                      style={[
                        styles.stockText,
                        item.totalQuantity <= item.lowStockAlert ? styles.lowStockText : styles.inStockText,
                      ]}
                    >
                      {item.totalQuantity <= item.lowStockAlert ? "Low Stock" : "In Stock"}
                    </Text>
                  </View>
                </View>

                <Text style={styles.category}>{item.type}</Text>

                <View style={styles.detailsRow}>
                  <Text style={styles.detail}>
                    Price: <Text style={styles.bold}>₹{item.price.toFixed(2)}</Text>
                  </Text>
                  <Text style={styles.detail}>
                    Qty: <Text style={styles.bold}>{item.totalQuantity}</Text>
                  </Text>
                </View>

                <View style={styles.detailsRow}>
                  <Text style={styles.detail}>
                    Alert: <Text style={styles.bold}>{item.lowStockAlert}</Text>
                  </Text>
                  <Text style={styles.detail}>
                    Expiry: <Text style={styles.bold}>{item.expiryDate || "N/A"}</Text>
                  </Text>
                </View>
              </View>

              <View style={styles.actions}>
                <TouchableOpacity style={styles.actionButton} onPress={() => handleOpenModal(item)}>
                  <Edit2 size={18} color={Colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={() => handleDelete(item.id || "")}>
                  <Trash2 size={18} color={Colors.error} />
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No medicines found</Text>
            </View>
          }
        />
      )}

      {/* Filter Modal */}
      <Modal
        visible={filterModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.filterModalHeader}>
            <Text style={styles.modalTitle}>Filters</Text>
            <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
              <X size={24} color={Colors.charcoal} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.filterContent}>
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Filter by Type</Text>
              <View style={styles.typeButtonsContainer}>
                {medicineTypes.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.typeButton, filterType === type && styles.typeButtonActive]}
                    onPress={() => setFilterType(filterType === type ? "" : type)}
                  >
                    <Text style={[styles.typeButtonText, filterType === type && styles.typeButtonTextActive]}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.filterSection}>
              <TouchableOpacity
                style={[styles.checkboxButton, filterLowStock && styles.checkboxButtonActive]}
                onPress={() => setFilterLowStock(!filterLowStock)}
              >
                <View style={[styles.checkbox, filterLowStock && styles.checkboxActive]}>
                  {filterLowStock && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}>Show Low Stock Only</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => {
                setFilterType("")
                setFilterLowStock(false)
              }}
            >
              <Text style={styles.clearButtonText}>Clear Filters</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.applyButton} onPress={() => setFilterModalVisible(false)}>
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Add/Edit Medicine Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => !saving && setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editingId ? "Edit Medicine" : "Add New Medicine"}</Text>
            <TouchableOpacity onPress={() => !saving && setModalVisible(false)}>
              <X size={24} color={Colors.charcoal} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Medicine Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter medicine name"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholderTextColor={Colors.textMuted}
                editable={!saving}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Enter medicine description"
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                multiline
                numberOfLines={3}
                placeholderTextColor={Colors.textMuted}
                editable={!saving}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Type/Category *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Antibiotics, Pain Relief"
                value={formData.type}
                onChangeText={(text) => setFormData({ ...formData, type: text })}
                placeholderTextColor={Colors.textMuted}
                editable={!saving}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.formGroup, styles.flex]}>
                <Text style={styles.label}>Price *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  value={formData.price.toString()}
                  onChangeText={(text) => setFormData({ ...formData, price: Number.parseFloat(text) || 0 })}
                  keyboardType="decimal-pad"
                  placeholderTextColor={Colors.textMuted}
                  editable={!saving}
                />
              </View>

              <View style={[styles.formGroup, styles.flex]}>
                <Text style={styles.label}>Total Quantity *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  value={formData.totalQuantity.toString()}
                  onChangeText={(text) => setFormData({ ...formData, totalQuantity: Number.parseInt(text) || 0 })}
                  keyboardType="number-pad"
                  placeholderTextColor={Colors.textMuted}
                  editable={!saving}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.formGroup, styles.flex]}>
                <Text style={styles.label}>Low Stock Alert *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  value={formData.lowStockAlert.toString()}
                  onChangeText={(text) => setFormData({ ...formData, lowStockAlert: Number.parseInt(text) || 0 })}
                  keyboardType="number-pad"
                  placeholderTextColor={Colors.textMuted}
                  editable={!saving}
                />
              </View>

              <View style={[styles.formGroup, styles.flex]}>
                <Text style={styles.label}>Expiry Date</Text>
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  value={formData.expiryDate}
                  onChangeText={(text) => setFormData({ ...formData, expiryDate: text })}
                  placeholderTextColor={Colors.textMuted}
                  editable={!saving}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Text style={styles.saveButtonText}>{editingId ? "Update Medicine" : "Add Medicine"}</Text>
              )}
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
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
    padding: 20,
    paddingBottom: 0,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.charcoal,
    textAlign: "center",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 15,
    textAlign: "center",
    alignContent: "center",
    justifyContent: "center",
    width: "100%",
    gap: 4,
  },
  addButtonText: {
    color: Colors.white,
    fontWeight: "600",
    fontSize: 14,
    textAlign: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    margin: 20,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  filterButton: {
    padding: 4,
  },
  list: {
    padding: 20,
    paddingTop: 0,
    gap: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    flexDirection: "row",
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  cardContent: {
    flex: 1,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.charcoal,
    flex: 1,
  },
  stockBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  inStock: {
    backgroundColor: "#DCFCE7",
  },
  lowStock: {
    backgroundColor: "#FEE2E2",
  },
  stockText: {
    fontSize: 10,
    fontWeight: "600",
  },
  inStockText: {
    color: "#166534",
  },
  lowStockText: {
    color: "#991B1B",
  },
  category: {
    fontSize: 14,
    color: Colors.textMuted,
    marginBottom: 8,
    marginTop: 4,
  },
  detailsRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 4,
  },
  detail: {
    fontSize: 12,
    color: Colors.text,
  },
  bold: {
    fontWeight: "600",
    color: Colors.charcoal,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    marginLeft: 12,
  },
  actionButton: {
    padding: 8,
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
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
  filterModalHeader: {
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
    gap: 16,
  },
  filterContent: {
    padding: 20,
    gap: 20,
  },
  formGroup: {
    gap: 8,
  },
  flex: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.charcoal,
  },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.text,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  saveButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 20,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  filterSection: {
    gap: 12,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.charcoal,
  },
  typeButtonsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  typeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    backgroundColor: Colors.white,
  },
  typeButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  typeButtonText: {
    fontSize: 14,
    color: Colors.text,
  },
  typeButtonTextActive: {
    color: Colors.white,
    fontWeight: "600",
  },
  checkboxButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
  },
  checkboxButtonActive: {
    opacity: 0.8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkmark: {
    color: Colors.white,
    fontWeight: "bold",
  },
  checkboxLabel: {
    fontSize: 14,
    color: Colors.text,
  },
  clearButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  clearButtonText: {
    color: Colors.textMuted,
    fontSize: 14,
    fontWeight: "600",
  },
  applyButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 20,
  },
  applyButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
})
