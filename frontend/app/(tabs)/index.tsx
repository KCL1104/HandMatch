import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  FlatList,
  RefreshControl,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { ItemCard } from "@/components/ItemCard";
import { ThemedView } from "@/components/ThemedView";
import { Item } from "@/types/item";
import { router } from "expo-router";

// Mock data - replace with actual API call
const mockItems: Item[] = [
  {
    id: "1",
    title: "Vintage Chair",
    price: 150,
    distance: 2.5,
    image: "https://picsum.photos/200",
    category: "Furniture",
    location: { latitude: 37.7749, longitude: -122.4194 },
    ownerId: "99YeyTCYGdbrBgcnHiwxISvyF0q1"
  },
  {
    id: "2",
    title: "Modern Desk",
    price: 299,
    distance: 1.8,
    image: "https://picsum.photos/201",
    category: "Furniture",
    location: { latitude: 37.7750, longitude: -122.4195 },
    ownerId: "99YeyTCYGdbrBgcnHiwxISvyF0q1"
  },
  {
    id: "3",
    title: "Stylish Sofa",
    price: 450,
    distance: 3.1,
    image: "https://picsum.photos/202",
    category: "Furniture",
    location: { latitude: 37.7751, longitude: -122.4196 },
    ownerId: "99YeyTCYGdbrBgcnHiwxISvyF0q1"
  },
  {
    id: "4",
    title: "Antique Lamp",
    price: 75,
    distance: 0.9,
    image: "https://picsum.photos/203",
    category: "Furniture",
    location: { latitude: 37.7752, longitude: -122.4197 },
    ownerId: "99YeyTCYGdbrBgcnHiwxISvyF0q1"
  },
];

export default function HomeScreen() {
  const [items, setItems] = useState<Item[]>(mockItems);
  const [searchQuery, setSearchQuery] = useState("");
  const [showMap, setShowMap] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Implement refresh logic here
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleLoadMore = () => {
    // Implement infinite scroll logic here
  };

  const renderItem = ({ item }: { item: Item }) => (
    <ItemCard item={item} />
  );

  const filterCategories = [
    "All",
    "Furniture",
    "Electronics",
    "Fashion",
    "Other",
  ];

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search items..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity
          style={styles.mapButton}
          onPress={() => setShowMap(!showMap)}
        >
          <MaterialIcons
            name={showMap ? "grid-view" : "map"}
            size={24}
            color="#000"
          />
        </TouchableOpacity>
      </View>

      <View style={styles.categoryContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryList}
        >
          {filterCategories.map((item) => (
            <TouchableOpacity
              key={item}
              style={[
                styles.categoryButton,
                selectedCategory === item && styles.categoryButtonSelected,
              ]}
              onPress={() => setSelectedCategory(item === "All" ? null : item)}
            >
              <ThemedText style={[
                styles.categoryText,
                selectedCategory === item && styles.categoryTextSelected,
              ]}>{item}</ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {!showMap ? (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          contentContainerStyle={styles.itemsGrid}
        />
      ) : (
        <View style={styles.mapContainer}>
          <ThemedText>Map View - Implement with React Native Maps</ThemedText>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  categoryContainer: {
    marginBottom: 16,
  },
  categoryList: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E5E5",
    marginRight: 8,
  },
  categoryButtonSelected: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  categoryText: {
    fontSize: 14,
    color: "#000",
    fontWeight: "500",
  },
  categoryTextSelected: {
    color: "#fff",
  },
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    marginBottom: 16,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    paddingHorizontal: 16,
    backgroundColor: "#f0f0f0",
  },
  mapButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
  },
  itemsGrid: {
    gap: 16,
  },
  itemCard: {
    flex: 1,
    margin: 8,
    borderRadius: 12,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: "hidden",
  },
  imagePlaceholder: {
    height: 150,
    backgroundColor: "#f0f0f0",
  },
  itemInfo: {
    padding: 12,
  },
  itemTitle: {
    fontSize: 16,
    marginBottom: 4,
    color: "#000", //Added color to text
  },
  chatButton: {
    marginTop: 8,
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#007AFF",
    alignItems: "center",
  },
  chatButtonText: {
    color: "#000", //Added color to text
  },
  mapContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});