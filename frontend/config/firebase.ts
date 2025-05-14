import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDTRXx9zcouW2IYQ7n5wGsE6qyxdtU3KyE",
  authDomain: "chat-ed219.firebaseapp.com",
  projectId: "chat-ed219",
  storageBucket: "chat-ed219.firebasestorage.app",
  messagingSenderId: "751787294804",
  appId: "1:751787294804:web:e50cd57ccd2ab2e6af6dc1",
  measurementId: "G-T8LTGGH38T"
};

// 檢查配置是否完整
if (!firebaseConfig.apiKey) {
  throw new Error('Firebase API Key is missing. Please check your .env file.');
}

// 初始化 Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider(); 