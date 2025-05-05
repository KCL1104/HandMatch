
import { useLocalSearchParams } from 'expo-router';
import { ChatRoom } from '@/components/ChatRoom';

export default function ChatRoomScreen() {
  const { id } = useLocalSearchParams();
  return <ChatRoom chatId={id as string} />;
}
