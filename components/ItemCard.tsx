
import React from 'react';
import { StyleSheet, View, TouchableOpacity, Image } from 'react-native';
import { router } from 'expo-router';
import { ThemedText } from './ThemedText';
import { Item } from '@/types/item';

interface ItemCardProps {
  item: Item;
}

export function ItemCard({ item }: ItemCardProps) {
  return (
    <View style={styles.itemCard}>
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: item.image }} 
          style={styles.image}
          resizeMode="cover"
        />
      </View>
      <View style={styles.itemInfo}>
        <ThemedText type="title" style={styles.itemTitle}>
          {item.title}
        </ThemedText>
        <ThemedText style={styles.price}>${item.price}/hr</ThemedText>
        <ThemedText style={styles.distance}>{item.distance} km away</ThemedText>
        <TouchableOpacity
          style={styles.chatButton}
          onPress={() => router.push(`/chat/${item.id}`)}
        >
          <ThemedText style={styles.chatButtonText}>Chat with Owner</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  itemCard: {
    flex: 1,
    margin: 8,
    borderRadius: 12,
    backgroundColor: '#fff',
    elevation: 3,
    overflow: 'hidden',
  },
  imageContainer: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 150,
  },
  itemInfo: {
    padding: 12,
  },
  itemTitle: {
    fontSize: 16,
    marginBottom: 4,
    color: '#000',
  },
  price: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  distance: {
    fontSize: 14,
    color: '#666',
  },
  chatButton: {
    marginTop: 8,
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  chatButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
});
