import React, { useState, useEffect } from 'react';
import { StyleSheet, View, FlatList, TextInput, TouchableOpacity, Image, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { router } from 'expo-router';
import { getChatList, ChatPreview } from '@/services/chatService';
import { auth } from '@/config/firebase';

export default function ChatScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [filteredChats, setFilteredChats] = useState<ChatPreview[]>([]);

  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const unsubscribe = getChatList(userId, (updatedChats) => {
      setChats(updatedChats);
      setFilteredChats(updatedChats);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredChats(chats);
    } else {
      const filtered = chats.filter(chat => 
        chat.itemTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredChats(filtered);
    }
  }, [searchQuery, chats]);

  const renderChatItem = ({ item }: { item: ChatPreview }) => (
    <TouchableOpacity 
      style={styles.chatItem}
      onPress={() => router.push({
        pathname: '/chat/[id]',
        params: { id: item.id }
      })}
    >
      <Image 
        source={{ uri: `https://picsum.photos/100?random=${item.id}` }} 
        style={styles.profileImage} 
      />
      <View style={styles.chatContent}>
        <View style={styles.chatHeader}>
          <ThemedText style={styles.itemTitle}>{item.itemTitle}</ThemedText>
          <ThemedText style={styles.timestamp}>
            {new Date(item.timestamp).toLocaleTimeString()}
          </ThemedText>
        </View>
        <View style={styles.messagePreview}>
          <View style={styles.ownerInfo}>
            <ThemedText style={styles.lastMessage}>{item.lastMessage}</ThemedText>
          </View>
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
        data={filteredChats}
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
  lastMessage: {
    fontSize: 14,
    color: '#000', // Changed color to black
    numberOfLines: 1,
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