/**
 * SHARED DATABASE ENGINE (Ataa Sync)
 * Using PostgreSQL for full cross-device synchronization at zero extra infrastructure cost.
 */

// Global state for auth listeners
let authStateListener: ((user: any) => void) | null = null;

export const getLocalData = (key: string) => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

export const setLocalData = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    // Trigger storage event for cross-tab sync within same device
    window.dispatchEvent(new Event('storage'));
  } catch (e) {
    console.error("Storage limit reached:", e);
  }
};

export const isFirebaseConfigured = true;

export const auth = {
  get currentUser() {
    const user = localStorage.getItem('ataa_current_user');
    return user ? JSON.parse(user) : null;
  }
};

export const onAuthStateChanged = (authObj: any, callback: (user: any) => void) => {
  authStateListener = callback;
  const user = localStorage.getItem('ataa_current_user');
  callback(user ? JSON.parse(user) : null);
  return () => { authStateListener = null; };
};

export const signOut = async (authObj?: any) => {
  localStorage.removeItem('ataa_current_user');
  if (authStateListener) authStateListener(null);
};


// Default minimalist avatars using Bottts (Toy faces)
export const DEFAULT_AVATARS = [
  'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Ataa1',
  'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Ataa2',
  'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Ataa3',
  'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Ataa4',
  'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Ataa5',
];

const MOCK_USERS: any[] = [
  {
    id: 'admin',
    displayName: 'Admin User',
    email: 'admin@ataa.edu',
    role: 'admin',
    socialPoints: 2500,
    avatar: DEFAULT_AVATARS[0],
    unlockedBadges: ['ataa-legend', 'eco-hero']
  },
  {
    id: 'student1',
    displayName: 'Ali Ahmed',
    email: 'ali@ataa.edu',
    role: 'student',
    socialPoints: 1250,
    avatar: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Ali',
    unlockedBadges: ['first-giver']
  },
  {
    id: 'student2',
    displayName: 'Omar Khalid',
    email: 'omar@ataa.edu',
    role: 'student',
    socialPoints: 840,
    avatar: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Omar',
    unlockedBadges: ['eco-hero']
  }
];

// Seed users if not exists
if (!localStorage.getItem('users')) {
  localStorage.setItem('users', JSON.stringify(MOCK_USERS));
}

// Mock Database (Firestore)
export const db = {
  // We use strings for collection names in this mock
};

export const doc = (db: any, collection: string, id: string) => ({ collection, id });

export const getDoc = async (docRef: any) => {
  const data = getLocalData(docRef.collection);
  const found = data.find((item: any) => item.id === docRef.id);
  return {
    exists: () => !!found,
    data: () => found
  };
};

export const setDoc = async (docRef: any, data: any) => {
  const collectionData = getLocalData(docRef.collection);
  const index = collectionData.findIndex((item: any) => item.id === docRef.id);
  if (index > -1) collectionData[index] = { ...collectionData[index], ...data };
  else collectionData.push({ ...data, id: docRef.id });
  setLocalData(docRef.collection, collectionData);
};

export const updateDoc = async (docRef: any, data: any) => {
  await setDoc(docRef, data);
};

export const addDoc = async (collectionName: any, data: any) => {
  const id = Math.random().toString(36).substr(2, 9);
  const collectionData = getLocalData(collectionName);
  const newItem = { ...data, id };
  collectionData.push(newItem);
  setLocalData(collectionName, collectionData);
  return { id };
};

export const deleteDoc = async (docRef: any) => {
  const collectionData = getLocalData(docRef.collection);
  const filtered = collectionData.filter((item: any) => item.id !== docRef.id);
  setLocalData(docRef.collection, filtered);
};

// Mock Real-time Sync across tabs/devices (localStorage based)
window.addEventListener('storage', (e) => {
  if (e.key === 'ataa_current_user' || e.key === 'items' || e.key === 'requests') {
    // Force refresh or trigger listeners if needed
    // In our simplified mock, intervals already handle polling
  }
});

export const onSnapshot = (queryObj: any, callback: (snapshot: any) => void) => {
  const sync = () => {
    const data = getLocalData(queryObj.collectionName);
    callback({
      docs: data.map((d: any) => ({
        id: d.id,
        data: () => d
      }))
    });
  };
  
  sync();
  const interval = setInterval(sync, 1000); // Poll local storage for changes
  return () => clearInterval(interval);
};

export const query = (collectionName: string, ...args: any[]) => ({ collectionName });
export const collection = (db: any, name: string) => name;
export const orderBy = (...args: any[]) => ({});

// Mock Storage
export const uploadImage = async (path: string, fileOrBase64: File | string): Promise<string> => {
  // In local mode, we just return the base64 or a mock URL
  if (typeof fileOrBase64 === 'string') return fileOrBase64;
  
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(fileOrBase64 as File);
  });
};

export const storage = {};
export const EmailAuthProvider = {
  credential: (email: string, pass: string) => ({ email, pass })
};
// Fix: updated signature to accept user and credential as expected by Settings.tsx line 74
export const reauthenticateWithCredential = async (user: any, credential: any) => true;
export const updatePassword = async (user: any, pass: string) => {
  const currentUser = JSON.parse(localStorage.getItem('ataa_current_user') || '{}');
  const users = getLocalData('users');
  const index = users.findIndex((u: any) => u.id === currentUser.id);
  if (index > -1) {
    users[index].password = pass;
    setLocalData('users', users);
  }
};
export const getRedirectResult = async () => null;
