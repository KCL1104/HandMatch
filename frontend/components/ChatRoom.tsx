import React, { useState, useEffect } from 'react';
import { StyleSheet, View, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { router } from 'expo-router';
import { getChatMessages, sendMessage, Message, markMessagesAsRead } from '@/services/chatService';
import { auth } from '@/config/firebase';

interface ChatRoomProps {
  chatId: string;
  itemTitle?: string;
  itemId?: string;
  receiverId?: string;
}

export function ChatRoom({ chatId, itemTitle = 'Chat', itemId, receiverId }: ChatRoomProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = getChatMessages(chatId, (updatedMessages) => {
      setMessages(updatedMessages);
    });

    // 標記消息為已讀
    markMessagesAsRead(chatId, currentUser.uid);

    return () => unsubscribe();
  }, [chatId, currentUser]);

  const handleSendMessage = async () => {
    if (!currentUser || !newMessage.trim() || isSending || !receiverId || !itemId) return;

    setIsSending(true);
    try {
      const success = await sendMessage(
        newMessage,
        currentUser.uid,
        receiverId,
        itemId,
        itemTitle
      );

      if (success) {
        setNewMessage('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isCurrentUser = item.senderId === currentUser?.uid;

    return (
      <View style={[
        styles.messageContainer,
        isCurrentUser ? styles.userMessage : styles.otherMessage
      ]}>
        <ThemedText style={[
          styles.messageText,
          isCurrentUser ? styles.userMessageText : styles.otherMessageText
        ]}>
          {item.text}
        </ThemedText>
        <View style={styles.messageFooter}>
          <ThemedText style={styles.timestamp}>
            {new Date(item.timestamp).toLocaleTimeString()}
          </ThemedText>
          {isCurrentUser && (
            <MaterialIcons 
              name={
                item.status === 'read' ? 'done-all' :
                item.status === 'delivered' ? 'done-all' :
                item.status === 'sent' ? 'done' : 'schedule'
              } 
              size={16} 
              color={item.status === 'read' ? '#007AFF' : '#666'} 
              style={styles.statusIcon}
            />
          )}
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <ThemedText style={styles.headerName}>{itemTitle}</ThemedText>
        </View>
      </View>
      
      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.messagesList}
        inverted={false}
      />
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
          placeholderTextColor="#666"
          multiline
          maxLength={1000}
        />
        <TouchableOpacity 
          style={[styles.sendButton, isSending && styles.sendButtonDisabled]}
          onPress={handleSendMessage}
          disabled={isSending || !newMessage.trim()}
        >
          {isSending ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <MaterialIcons name="send" size={24} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  backButton: {
    marginRight: 16,
  },
  messagesList: {
    padding: 16,
  },
  messageContainer: {
    maxWidth: '80%',
    marginVertical: 4,
    padding: 12,
    borderRadius: 16,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#F0F0F0',
  },
  messageText: {
    fontSize: 16,
  },
  userMessageText: {
    color: '#fff',
  },
  otherMessageText: {
    color: '#000',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
  },
  statusIcon: {
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    marginRight: 12,
    padding: 12,
    backgroundColor: '#F0F0F0',
    borderRadius: 24,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
});
