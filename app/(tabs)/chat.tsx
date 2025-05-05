import React, { useState } from 'react';
import { StyleSheet, View, FlatList, TextInput, TouchableOpacity, Image, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { router } from 'expo-router';

interface ChatPreview {
  id: string;
  itemTitle: string;
  lastMessage: string;
  timestamp: string;
  ownerName: string;
  ownerImage: string;
  itemImage: string;
  unread: boolean;
}

const mockChats: ChatPreview[] = [
  {
    id: '1',
    itemTitle: 'Vintage Chair',
    lastMessage: 'Is this still available?',
    timestamp: '2m ago',
    ownerName: 'John Doe',
    ownerImage: 'https://picsum.photos/100',
    itemImage: 'https://picsum.photos/200',
    unread: true,
  },
  {
    id: '2',
    itemTitle: 'Modern Desk',
    lastMessage: 'When can I pick it up?',
    timestamp: '1h ago',
    ownerName: 'Jane Smith',
    ownerImage: 'https://picsum.photos/101',
    itemImage: 'https://picsum.photos/201',
    unread: false,
  },
];

export default function ChatScreen() {
  const [searchQuery, setSearchQuery] = useState('');

  const renderChatItem = ({ item }: { item: ChatPreview }) => (
    <TouchableOpacity 
      style={styles.chatItem}
      onPress={() => router.push({
        pathname: '/chat/[id]',
        params: { id: item.id }
      })}
    >
      <Image source={{ uri: item.ownerImage }} style={styles.profileImage} />
      <View style={styles.chatContent}>
        <View style={styles.chatHeader}>
          <ThemedText style={styles.itemTitle}>{item.itemTitle}</ThemedText>
          <ThemedText style={styles.timestamp}>{item.timestamp}</ThemedText>
        </View>
        <View style={styles.messagePreview}>
          <View style={styles.ownerInfo}>
            <ThemedText style={styles.ownerName}>{item.ownerName}</ThemedText>
            <ThemedText style={styles.lastMessage}>{item.lastMessage}</ThemedText>
          </View>
          <Image source={{ uri: item.itemImage }} style={styles.itemImage} />
        </View>
        {item.unread && <View style={styles.unreadBadge} />}
      </View>
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.headerTitle}>Messages</ThemedText>
      </View>

      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={24} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search messages..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#666"
        />
      </View>

      <FlatList
        data={mockChats}
        renderItem={renderChatItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.chatList}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000', // Added color for header title
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f5f5f5',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000', // Changed color to black
  },
  chatList: {
    paddingHorizontal: 16,
  },
  chatItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    alignItems: 'center',
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  chatContent: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000', // Added color for item title
  },
  timestamp: {
    fontSize: 12,
    color: '#333', // Changed color to darker gray
  },
  messagePreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ownerInfo: {
    flex: 1,
    marginRight: 8,
  },
  ownerName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000', // Changed color to black
    marginBottom: 2,
  },
  lastMessage: {
    fontSize: 14,
    color: '#000', // Changed color to black
    numberOfLines: 1,
  },
  itemImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  unreadBadge: {
    position: 'absolute',
    right: 0,
    top: '50%',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
  },
  separator: {
    height: 1,
    backgroundColor: '#eee',
  },
});