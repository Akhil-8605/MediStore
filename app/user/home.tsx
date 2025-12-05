"use client"

import { Colors } from "../../constants/Colors"
import { router } from "expo-router"
import { ArrowRight, Search } from "lucide-react-native"
import { useState, useEffect, useCallback } from "react"
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, RefreshControl } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useAuth } from "../../context/AuthContext"
import { firestoreService, type Medicine } from "../../services/firestoreService"
import { useCart } from "../../context/CartContext"

export default function HomeScreen() {
  const { userData } = useAuth()
  const { addToCart } = useCart()
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadMedicines = useCallback(async () => {
    try {
      const meds = await firestoreService.getAllMedicines()
      setMedicines(meds.slice(0, 4))
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

  const handleAddToCart = async (medicine: Medicine) => {
    await addToCart(medicine, 1)
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, {userData?.name?.split(" ")[0]} 👋</Text>
            <Text style={styles.location}>Welcome back</Text>
          </View>
          <TouchableOpacity style={styles.profileButton} onPress={() => router.push("/user/profile")}>
            <View style={styles.avatar}>
              <Text style={{ color: Colors.primary, fontWeight: "bold" }}>
                {userData?.name?.charAt(0).toUpperCase()}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.searchBar} onPress={() => router.push("/user/search")}>
          <Search size={20} color={Colors.textMuted} />
          <Text style={styles.placeholder}>Search for medicines...</Text>
        </TouchableOpacity>

        <View style={styles.hero}>
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>Your Health,{"\n"}Delivered.</Text>
            <Text style={styles.heroSubtitle}>Order medicines & get reminders.</Text>
            <TouchableOpacity style={styles.heroButton} onPress={() => router.push("/user/search")}>
              <Text style={styles.heroButtonText}>Order Now</Text>
              <ArrowRight size={16} color={Colors.primary} />
            </TouchableOpacity>
          </View>
          <View style={styles.heroDecoration} />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Popular Medicines</Text>
          <TouchableOpacity onPress={() => router.push("/user/search")}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={Colors.primary} />
        ) : (
          <View style={styles.productsGrid}>
            {medicines.map((item) => (
              <TouchableOpacity key={item.id} style={styles.productCard}>
                <View style={styles.productImagePlaceholder}>
                  <Text style={{ fontSize: 24 }}>💊</Text>
                </View>
                <View style={styles.productInfo}>
                  <Text style={styles.productCategory}>{item.category}</Text>
                  <Text style={styles.productName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <View style={styles.priceRow}>
                    <Text style={styles.price}>₹{item.price.toFixed(2)}</Text>
                    <TouchableOpacity style={styles.addButton} onPress={() => handleAddToCart(item)}>
                      <Text style={{ color: Colors.white }}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
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
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  greeting: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.charcoal,
  },
  location: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  profileButton: {
    padding: 4,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.logoback,
    alignItems: "center",
    justifyContent: "center",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 12,
    marginBottom: 24,
    gap: 12,
  },
  placeholder: {
    color: Colors.textMuted,
    fontSize: 15,
  },
  hero: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    padding: 24,
    marginBottom: 32,
    overflow: "hidden",
    position: "relative",
  },
  heroContent: {
    zIndex: 1,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.white,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    marginBottom: 16,
  },
  heroButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: "flex-start",
    gap: 8,
  },
  heroButtonText: {
    color: Colors.primary,
    fontWeight: "600",
    fontSize: 14,
  },
  heroDecoration: {
    position: "absolute",
    right: -20,
    bottom: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.charcoal,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  seeAll: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: "500",
  },
  productsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  productCard: {
    width: "48%",
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  productImagePlaceholder: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  productInfo: {
    gap: 4,
  },
  productCategory: {
    fontSize: 10,
    color: Colors.textMuted,
    textTransform: "uppercase",
  },
  productName: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.charcoal,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  price: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.primary,
  },
  addButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
})
