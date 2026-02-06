import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy, onSnapshot, serverTimestamp, getDoc, setDoc } from 'firebase/firestore';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import { GoogleAuthProvider, signInWithPopup, signOut, getAuth, onAuthStateChanged as firebaseOnAuthStateChanged, User } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDCRWf6Mg5juU37N9GwEEURFylpXwfhL4Y",
  authDomain: "educational-item-sharing.firebaseapp.com",
  projectId: "educational-item-sharing",
  storageBucket: "educational-item-sharing.appspot.com",
  messagingSenderId: "1022263553885",
  appId: "1:1022263553885:web:04549226e051e0c2bd38f6"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

// Firestore helpers
const firestoreHelpers = {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  getDoc,
  setDoc
};

// Auth helpers
const authHelpers = {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged: (callback: (user: User | null) => void) => {
    return firebaseOnAuthStateChanged(auth, callback);
  }
};

// Storage helpers
const storageHelpers = {
  ref,
  uploadString,
  getDownloadURL
};

// Combined export
export {
  db,
  auth,
  storage,
  ...firestoreHelpers,
  ...authHelpers,
  ...storageHelpers
};

// Specialized functions
export const uploadImage = async (path: string, imageData: string): Promise<string> => {
  const imageRef = ref(storage, path);
  await uploadString(imageRef, imageData, 'data_url');
  return await getDownloadURL(imageRef);
};

// Conversation and messaging functions
export const createConversation = async (participants: string[], itemIds: string[]): Promise<string> => {
  const convRef = await addDoc(collection(db, 'conversations'), {
    participants,
    itemIds,
    createdAt: serverTimestamp(),
    lastMessageAt: serverTimestamp(),
    lastMessage: ''
  });
  return convRef.id;
};

export const sendMessage = async (conversationId: string, senderId: string, senderName: string, content: string) => {
  const messageRef = await addDoc(collection(db, 'conversations', conversationId, 'messages'), {
    senderId,
    senderName,
    content,
    timestamp: serverTimestamp(),
    read: false
  });

  // Update the last message in the conversation
  await updateDoc(doc(db, 'conversations', conversationId), {
    lastMessage: content,
    lastMessageAt: serverTimestamp()
  });

  return messageRef.id;
};

export const getConversationsForUser = (userId: string, callback: (conversations: any[]) => void) => {
  const q = query(
    collection(db, 'conversations'),
    where('participants', 'array-contains', userId),
    orderBy('lastMessageAt', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const conversations = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(conversations);
  });
};

export const getMessagesForConversation = (conversationId: string, callback: (messages: any[]) => void) => {
  const q = query(
    collection(db, 'conversations', conversationId, 'messages'),
    orderBy('timestamp', 'asc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(messages);
  });
};