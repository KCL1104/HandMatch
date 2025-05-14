import { useLocalSearchParams } from 'expo-router';
import { ChatRoom } from '@/components/ChatRoom';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { auth } from '@/config/firebase';

export default function ChatRoomScreen() {
  const { id } = useLocalSearchParams();
  const [chatData, setChatData] = useState<any>(null);
  const currentUser = auth.currentUser;

  useEffect(() => {
    const fetchChatData = async () => {
      if (!id || !currentUser) return;
      
      const chatDoc = await getDoc(doc(db, 'chats', id as string));
      if (chatDoc.exists()) {
        const data = chatDoc.data();
        // 找出接收者 ID（不是當前用戶的那個）
        const receiverId = data.participants.find((id: string) => id !== currentUser.uid);
        setChatData({
          ...data,
          receiverId
        });
      }
    };

    fetchChatData();
  }, [id, currentUser]);

  if (!chatData) {
    return null; // 或顯示載入中
  }

  return (
    <ChatRoom 
      chatId={id as string}
      itemTitle={chatData.itemTitle}
      itemId={chatData.itemId}
      receiverId={chatData.receiverId}
    />
  );
}
