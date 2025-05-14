import { db } from '@/config/firebase';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  Timestamp,
  doc,
  getDoc,
  updateDoc,
  setDoc,
  serverTimestamp,
  getDocs,
  writeBatch
} from 'firebase/firestore';

export interface Message {
  id: string;
  text: string;
  senderId: string;
  receiverId: string;
  timestamp: Date;
  itemId: string;
  status: 'sending' | 'sent' | 'delivered' | 'read';
}

export interface ChatPreview {
  id: string;
  itemId: string;
  itemTitle: string;
  lastMessage: string;
  timestamp: Date;
  participants: string[];
  unread: boolean;
  participantInfo: {
    [key: string]: {
      name: string;
      avatar: string;
    }
  };
}

// 創建或獲取聊天會話
export const getOrCreateChat = async (
  senderId: string,
  receiverId: string,
  itemId: string,
  itemTitle: string
) => {
  try {
    // 查詢所有 itemId 相同且 participants 包含 senderId 的聊天室
    const chatRef = collection(db, 'chats');
    const chatQuery = query(
      chatRef,
      where('itemId', '==', itemId),
      where('participants', 'array-contains', senderId)
    );
    const querySnapshot = await getDocs(chatQuery);
    let chatId: string | null = null;

    // 檢查 participants 是否同時包含 senderId 和 receiverId
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (
        Array.isArray(data.participants) &&
        data.participants.length === 2 &&
        data.participants.includes(senderId) &&
        data.participants.includes(receiverId) &&
        data.itemId === itemId  // 確保 itemId 完全匹配
      ) {
        chatId = docSnap.id;
      }
    });

    if (!chatId) {
      // 創建新聊天
      const newChatRef = await addDoc(chatRef, {
        participants: [senderId, receiverId],
        itemId,
        itemTitle,
        lastMessage: '',
        lastMessageTime: serverTimestamp(),
        unread: {
          [senderId]: false,
          [receiverId]: false
        },
        participantInfo: {
          [senderId]: {
            name: 'You',
            avatar: `https://picsum.photos/100?random=${senderId}`
          },
          [receiverId]: {
            name: 'Other User',
            avatar: `https://picsum.photos/100?random=${receiverId}`
          }
        },
        createdAt: serverTimestamp()
      });
      chatId = newChatRef.id;
    }

    return chatId;
  } catch (error) {
    console.error('Error in getOrCreateChat:', error);
    throw error;
  }
};

// 發送消息
export const sendMessage = async (
  text: string,
  senderId: string,
  receiverId: string,
  itemId: string,
  itemTitle: string
) => {
  try {
    // 獲取或創建聊天會話
    const chatId = await getOrCreateChat(senderId, receiverId, itemId, itemTitle);

    // 創建消息
    const messageData = {
      text,
      senderId,
      receiverId,
      itemId,
      chatId,
      timestamp: serverTimestamp(),
      status: 'sending'
    };

    // 添加消息
    const messageRef = await addDoc(collection(db, 'messages'), messageData);

    // 更新聊天會話
    const chatRef = doc(db, 'chats', chatId);
    await updateDoc(chatRef, {
      lastMessage: text,
      lastMessageTime: serverTimestamp(),
      unread: {
        [receiverId]: true
      }
    });

    // 更新消息狀態
    await updateDoc(doc(db, 'messages', messageRef.id), {
      status: 'sent'
    });

    return true;
  } catch (error) {
    console.error('Error sending message:', error);
    return false;
  }
};

// 標記消息為已讀
export const markMessagesAsRead = async (chatId: string, userId: string) => {
  try {
    const chatRef = doc(db, 'chats', chatId);
    await updateDoc(chatRef, {
      [`unread.${userId}`]: false
    });

    // 更新所有未讀消息的狀態
    const messagesRef = collection(db, 'messages');
    const messagesQuery = query(
      messagesRef,
      where('chatId', '==', chatId),
      where('receiverId', '==', userId),
      where('status', 'in', ['sent', 'delivered'])
    );

    const querySnapshot = await getDocs(messagesQuery);
    const batch = writeBatch(db);

    querySnapshot.forEach((doc) => {
      batch.update(doc.ref, { status: 'read' });
    });

    await batch.commit();
    return true;
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return false;
  }
};

// 獲取聊天列表
export const getChatList = (
  userId: string,
  onUpdate: (chats: ChatPreview[]) => void
) => {
  const chatRef = collection(db, 'chats');
  const chatQuery = query(
    chatRef,
    where('participants', 'array-contains', userId),
    orderBy('lastMessageTime', 'desc')
  );

  return onSnapshot(chatQuery, (snapshot) => {
    const chats: ChatPreview[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      chats.push({
        id: doc.id,
        itemId: data.itemId,
        itemTitle: data.itemTitle,
        lastMessage: data.lastMessage,
        timestamp: data.lastMessageTime?.toDate() || new Date(),
        participants: data.participants,
        unread: data.unread[userId] || false,
        participantInfo: data.participantInfo
      });
    });
    onUpdate(chats);
  });
};

// 獲取特定聊天的消息
export const getChatMessages = (
  chatId: string,
  onUpdate: (messages: Message[]) => void
) => {
  const messagesRef = collection(db, 'messages');
  const messagesQuery = query(
    messagesRef,
    where('chatId', '==', chatId),
    orderBy('timestamp', 'asc')
  );

  return onSnapshot(messagesQuery, (snapshot) => {
    const messages: Message[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      messages.push({
        id: doc.id,
        text: data.text,
        senderId: data.senderId,
        receiverId: data.receiverId,
        timestamp: data.timestamp?.toDate() || new Date(),
        itemId: data.itemId,
        status: data.status || 'sent'
      });
    });
    onUpdate(messages);
  });
}; 