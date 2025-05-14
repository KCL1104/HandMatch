import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  User
} from 'firebase/auth';
import { auth } from '@/config/firebase';
import { db } from '@/config/firebase';
import { setDoc, doc } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
}

// 註冊新用戶
export const registerUser = async (
  email: string,
  password: string,
  displayName: string
): Promise<UserProfile | null> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 更新用戶資料
    await updateProfile(user, {
      displayName,
      photoURL: `https://picsum.photos/200?random=${user.uid}`
    });

    // 寫入 Firestore users 集合
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email!,
      displayName: displayName,
      photoURL: `https://picsum.photos/200?random=${user.uid}`,
      createdAt: new Date()
    });

    return {
      uid: user.uid,
      email: user.email!,
      displayName: user.displayName!,
      photoURL: user.photoURL || undefined
    };
  } catch (error) {
    console.error('Error registering user:', error);
    throw error;
  }
};

// 用戶登入
export const loginUser = async (
  email: string,
  password: string
): Promise<UserProfile | null> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    return {
      uid: user.uid,
      email: user.email!,
      displayName: user.displayName!,
      photoURL: user.photoURL || undefined
    };
  } catch (error) {
    console.error('Error logging in:', error);
    throw error;
  }
};

// 用戶登出
export const logoutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error logging out:', error);
    throw error;
  }
};

// 獲取當前用戶
export const getCurrentUser = (): UserProfile | null => {
  const user = auth.currentUser;
  if (!user) return null;

  return {
    uid: user.uid,
    email: user.email!,
    displayName: user.displayName!,
    photoURL: user.photoURL || undefined
  };
}; 