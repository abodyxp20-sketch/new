/**
 * Ataa Local Database Engine
 * ---------------------------------
 * This file provides a lightweight, browser-native data layer that mimics
 * a subset of Firebase APIs while keeping data persistent and reactive.
 */

type CollectionName = 'users' | 'items' | 'requests' | 'conversations';

type Subscriber = () => void;

interface QueryShape {
  collectionName: string;
}

const STORAGE_PREFIX = 'ataa_db_';
const CHANNEL_NAME = 'ataa_realtime_channel';
const listeners = new Map<string, Set<Subscriber>>();
const authListeners = new Set<(user: any) => void>();
const broadcast = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel(CHANNEL_NAME)
  : null;

const withId = <T extends Record<string, any>>(data: T, id = crypto.randomUUID()) => ({ ...data, id });
const now = () => Date.now();

const getStorageKey = (collectionName: string) => `${STORAGE_PREFIX}${collectionName}`;

export const getLocalData = (key: string) => {
  const raw = localStorage.getItem(getStorageKey(key));
  return raw ? JSON.parse(raw) : [];
};

export const setLocalData = (key: string, data: any) => {
  localStorage.setItem(getStorageKey(key), JSON.stringify(data));
  notifyCollection(key);
};

const subscribe = (collectionName: string, cb: Subscriber) => {
  if (!listeners.has(collectionName)) {
    listeners.set(collectionName, new Set());
  }
  listeners.get(collectionName)!.add(cb);
  return () => listeners.get(collectionName)?.delete(cb);
};

const notifyCollection = (collectionName: string) => {
  listeners.get(collectionName)?.forEach((fn) => fn());
  broadcast?.postMessage({ type: 'collection:update', collectionName });
};

broadcast?.addEventListener('message', (event) => {
  if (event.data?.type === 'collection:update') {
    listeners.get(event.data.collectionName)?.forEach((fn) => fn());
  }
});

window.addEventListener('storage', (event) => {
  if (!event.key?.startsWith(STORAGE_PREFIX)) return;
  const collectionName = event.key.replace(STORAGE_PREFIX, '');
  listeners.get(collectionName)?.forEach((fn) => fn());
});

const seedData = () => {
  if (getLocalData('users').length === 0) {
    setLocalData('users', [
      {
        id: 'admin',
        displayName: 'Ataa Admin',
        email: 'admin@ataa.edu',
        role: 'Admin',
        socialPoints: 2500,
        avatar: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=AtaaAdmin',
        profilePic: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=AtaaAdmin',
        unlockedBadges: ['ataa-legend', 'eco-hero'],
        preferences: {
          theme: 'system',
          language: 'ar',
          notifications: { email: true, inApp: true },
          privacyShowHistory: true,
        },
      },
    ]);
  }

  if (getLocalData('items').length === 0) {
    setLocalData('items', [
      {
        id: 'item-seed-1',
        name: 'Geometry Kit',
        description: 'Complete geometry set in excellent condition.',
        category: 'Stationery',
        condition: 'Like New',
        pickupLocation: 'Building A - Library',
        imageUrl: 'https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=900&q=80',
        donorId: 'admin',
        donorName: 'Ataa Admin',
        donorEmail: 'admin@ataa.edu',
        isAvailable: true,
        status: 'approved',
        createdAt: now(),
      },
    ]);
  }

  if (getLocalData('requests').length === 0) {
    setLocalData('requests', []);
  }

  if (getLocalData('conversations').length === 0) {
    setLocalData('conversations', []);
  }
};

seedData();

export const isFirebaseConfigured = true;

export const auth = {
  get currentUser() {
    const user = localStorage.getItem('ataa_current_user');
    return user ? JSON.parse(user) : null;
  },
};

export const onAuthStateChanged = (_authObj: any, callback: (user: any) => void) => {
  authListeners.add(callback);
  callback(auth.currentUser);
  return () => authListeners.delete(callback);
};

const notifyAuthListeners = () => {
  const user = auth.currentUser;
  authListeners.forEach((cb) => cb(user));
};

export const signOut = async () => {
  localStorage.removeItem('ataa_current_user');
  notifyAuthListeners();
};

export const db = {};

export const doc = (_db: any, collection: string, id: string) => ({ collection, id });
export const collection = (_db: any, name: string) => name;
export const query = (collectionName: string) => ({ collectionName });
export const where = (..._args: any[]) => ({}) as any;
export const orderBy = (..._args: any[]) => ({}) as any;
export const serverTimestamp = () => ({ toDate: () => new Date() });

export const getDoc = async (docRef: { collection: string; id: string }) => {
  const data = getLocalData(docRef.collection);
  const found = data.find((item: any) => item.id === docRef.id);
  return {
    exists: () => Boolean(found),
    data: () => found,
  };
};

export const setDoc = async (docRef: { collection: string; id: string }, data: any) => {
  const collectionData = getLocalData(docRef.collection);
  const index = collectionData.findIndex((item: any) => item.id === docRef.id);

  if (index > -1) {
    collectionData[index] = { ...collectionData[index], ...data, id: docRef.id };
  } else {
    collectionData.push({ ...data, id: docRef.id });
  }

  setLocalData(docRef.collection, collectionData);
};

export const updateDoc = async (docRef: { collection: string; id: string }, data: any) => {
  await setDoc(docRef, data);
};

export const addDoc = async (collectionName: string, data: any) => {
  const collectionData = getLocalData(collectionName);
  const newItem = withId(data);
  collectionData.push(newItem);
  setLocalData(collectionName, collectionData);
  return { id: newItem.id };
};

export const deleteDoc = async (docRef: { collection: string; id: string }) => {
  const collectionData = getLocalData(docRef.collection);
  setLocalData(
    docRef.collection,
    collectionData.filter((item: any) => item.id !== docRef.id),
  );
};

export const getDocs = async (queryObj: QueryShape | string) => {
  const collectionName = typeof queryObj === 'string' ? queryObj : queryObj.collectionName;
  const docs = getLocalData(collectionName).map((entry: any) => ({ id: entry.id, data: () => entry }));
  return { docs };
};

export const onSnapshot = (queryObj: QueryShape | string, callback: (snapshot: any) => void) => {
  const collectionName = typeof queryObj === 'string' ? queryObj : queryObj.collectionName;

  const sync = () => {
    const data = getLocalData(collectionName);
    callback({
      docs: data.map((entry: any) => ({ id: entry.id, data: () => entry })),
    });
  };

  sync();
  return subscribe(collectionName, sync);
};

export const uploadImage = async (_path: string, fileOrBase64: File | string): Promise<string> => {
  if (typeof fileOrBase64 === 'string') return fileOrBase64;

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(fileOrBase64);
  });
};

export const storage = {};
export const EmailAuthProvider = {
  credential: (email: string, pass: string) => ({ email, pass }),
};
export const reauthenticateWithCredential = async (_user: any, _credential: any) => true;
export const updatePassword = async (_user: any, pass: string) => {
  const currentUser = auth.currentUser;
  if (!currentUser?.id) return;

  const users = getLocalData('users');
  const userIndex = users.findIndex((user: any) => user.id === currentUser.id);
  if (userIndex > -1) {
    users[userIndex].password = pass;
    setLocalData('users', users);
  }
};
export const getRedirectResult = async () => null;

/** Messaging (subcollection-like storage) */
const getMessagesCollectionName = (conversationId: string) => `messages_${conversationId}`;

export const createConversation = async (participants: string[], itemIds: string[]): Promise<string> => {
  const created = await addDoc('conversations', {
    participants,
    itemIds,
    createdAt: now(),
    lastMessageAt: now(),
    lastMessage: '',
  });
  return created.id;
};

export const sendMessage = async (conversationId: string, senderId: string, senderName: string, content: string) => {
  const messagesCollection = getMessagesCollectionName(conversationId);
  const timestamp = { toDate: () => new Date() };

  const message = await addDoc(messagesCollection, {
    senderId,
    senderName,
    content,
    timestamp,
    read: false,
  });

  await updateDoc(doc(db, 'conversations', conversationId), {
    lastMessage: content,
    lastMessageAt: now(),
  });

  return message.id;
};

export const getConversationsForUser = (userId: string, callback: (conversations: any[]) => void) => {
  return onSnapshot({ collectionName: 'conversations' }, (snapshot: any) => {
    const conversations = snapshot.docs
      .map((entry: any) => ({ id: entry.id, ...entry.data() }))
      .filter((entry: any) => entry.participants?.includes(userId))
      .sort((a: any, b: any) => (b.lastMessageAt || 0) - (a.lastMessageAt || 0));

    callback(conversations);
  });
};

export const getMessagesForConversation = (conversationId: string, callback: (messages: any[]) => void) => {
  return onSnapshot({ collectionName: getMessagesCollectionName(conversationId) }, (snapshot: any) => {
    const messages = snapshot.docs
      .map((entry: any) => ({ id: entry.id, ...entry.data() }))
      .sort((a: any, b: any) => {
        const aTime = a.timestamp?.toDate ? a.timestamp.toDate().getTime() : 0;
        const bTime = b.timestamp?.toDate ? b.timestamp.toDate().getTime() : 0;
        return aTime - bTime;
      });

    callback(messages);
  });
};
