"use client"

import { useState, useEffect, useCallback } from "react"
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Colors } from "@/constants/Colors"
import { Search as SearchIcon } from "lucide-react-native"
import { firestoreService, type Medicine } from "@/services/firestoreService"
import { useCart } from "@/context/CartContext"

const CATEGORIES = ["All", "Antibiotics", "Heart", "Diabetes", "Vitamins", "Gastrointestinal"]

export default function SearchScreen() {
  const [search, setSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const { addToCart } = useCart()

  const loadMedicines = useCallback(async () => {
    try {
      const meds = await firestoreService.getAllMedicines()
      setMedicines(meds)
    } catch (error) {
      console.error("Error loading medicines:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    loadMedicines()
  }, [loadMedicines])

  const onRefresh = () => {
    setRefreshing(true)
    loadMedicines()
  }

  const filteredMeds = medicines.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) &&
      (selectedCategory === "All" || m.category === selectedCategory),
  )

  const handleAddToCart = async (medicine: Medicine) => {
    if (!isInStock(medicine)) {
      alert("This medicine is out of stock")
      return
    }
    await addToCart(medicine, 1)
  }

  const isInStock = (medicine: Medicine) => {
    const quantity = medicine.totalQuantity || medicine.totalQuantity || 0
    return quantity > 0
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <SearchIcon size={20} color={Colors.textMuted} />
          <TextInput
            style={styles.input}
            placeholder="Search medicines, diseases..."
            value={search}
            onChangeText={setSearch}
            placeholderTextColor={Colors.textMuted}
          />
        </View>

        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={CATEGORIES}
          keyExtractor={(cat) => cat}
          contentContainerStyle={styles.categories}
          renderItem={({ item: cat }) => (
            <TouchableOpacity
              style={[styles.categoryChip, selectedCategory === cat && styles.activeChip]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[styles.chipText, selectedCategory === cat && styles.activeChipText]}>{cat}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredMeds}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardImage}>
                <Text style={{ fontSize: 24 }}>💊</Text>
              </View>
              <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  {!isInStock(item) && (
                    <View style={styles.outOfStock}>
                      <Text style={styles.outOfStockText}>Out of Stock</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.cardCategory}>{item.category}</Text>
                <Text style={styles.cardDesc} numberOfLines={2}>
                  {item.description}
                </Text>
                <View style={styles.cardFooter}>
                  <Text style={styles.price}>₹{item.price.toFixed(2)}</Text>
                  <TouchableOpacity
                    style={[styles.addButton, !isInStock(item) && styles.disabledButton]}
                    disabled={!isInStock(item)}
                    onPress={() => handleAddToCart(item)}
                  >
                    <Text style={styles.addButtonText}>Add to Cart</Text>
                  </TouchableOpacity>
                </View>
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
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: Colors.text,
  },
  categories: {
    flexDirection: "row",
    marginBottom: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
    backgroundColor: Colors.white,
  },
  activeChip: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  activeChipText: {
    color: Colors.white,
    fontWeight: "600",
  },
  list: {
    padding: 20,
    gap: 16,
  },
  card: {
    flexDirection: "row",
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  cardImage: {
    width: 80,
    height: 80,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cardContent: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.charcoal,
  },
  outOfStock: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  outOfStockText: {
    fontSize: 10,
    color: "#991B1B",
    fontWeight: "600",
  },
  cardCategory: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  price: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.primary,
  },
  addButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  disabledButton: {
    backgroundColor: Colors.neutralGray,
  },
  addButtonText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textMuted,
  },
})
