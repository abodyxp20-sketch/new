import { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  avatar: string;
  profilePic: string;
  socialPoints: number;
  unlockedBadges: string[];
  role: 'Student' | 'Teacher' | 'Admin';
  phoneNumber?: string;
  preferences: {
    theme: 'light' | 'dark' | 'system';
    notifications: {
      email: boolean;
      inApp: boolean;
    };
    language: 'en' | 'ar';
    privacyShowHistory: boolean;
  };
}

export interface SchoolItem {
  id: string;
  name: string;
  description: string;
  category: Category;
  condition: 'New' | 'Like New' | 'Good' | 'Fair';
  pickupLocation: string;
  imageUrl: string;
  donorId: string;
  donorName: string;
  donorEmail: string;
  donorPhoneNumber?: string;
  isAvailable: boolean;
  status: 'pending' | 'approved' | 'rejected' | 'claimed';
  createdAt: number;
  notes?: string;
  coordinates?: { lat: number; lng: number };
}

export interface ItemRequest {
  id: string;
  studentId: string;
  studentName: string;
  itemName: string;
  category: Category;
  createdAt: number;
}

export interface Conversation {
  id: string;
  participants: string[];
  itemIds: string[]; // Items related to this conversation
  createdAt: Timestamp;
  lastMessageAt: Timestamp;
  lastMessage: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Timestamp;
  read: boolean;
}

export type Category = 'Stationery' | 'Electronics' | 'Books' | 'Uniforms' | 'Art Supplies' | 'Other';

export type Language = 'en' | 'ar';
export type ThemeMode = 'light' | 'dark' | 'system';

export interface Badge {
  id: string;
  nameEn: string;
  nameAr: string;
  icon: string;
  color: string;
  condition: string;
}