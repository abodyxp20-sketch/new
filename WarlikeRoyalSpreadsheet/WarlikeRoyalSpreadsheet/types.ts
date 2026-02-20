
export type Category = 'Stationery' | 'Electronics' | 'Books' | 'Uniforms' | 'Art Supplies' | 'Other';
export type ItemStatus = 'pending' | 'approved' | 'rejected' | 'taken';
export type Language = 'ar' | 'en';
export type ThemeMode = 'light' | 'dark' | 'system';

export interface Badge {
  id: string;
  nameEn: string;
  nameAr: string;
  icon: string;
  color: string;
  condition: string;
}

export interface SchoolItem {
  id: string;
  name: string;
  description: string;
  notes?: string;
  region?: string;
  donorPhoneNumber?: string;
  category: Category;
  condition: 'New' | 'Like New' | 'Good' | 'Fair';
  pickupLocation: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  imageUrl: string;
  donorId: string;
  donorName: string;
  isAvailable: boolean;
  status: ItemStatus;
  createdAt: number;
}

export interface ItemRequest {
  id: string;
  studentId: string;
  studentName: string;
  itemName: string;
  category: Category;
  quantity?: number;
  region?: string;
  contactNumber?: string;
  neededBefore?: string;
  notes?: string;
  createdAt: number;
}

export interface BorrowRequest {
  id: string;
  itemId: string;
  itemName: string;
  ownerId: string;
  ownerName: string;
  borrowerId: string;
  borrowerName: string;
  borrowerContact: string;
  region: string;
  notes?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: number;
}

export interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  grade?: string;
  bio?: string;
  interests?: string[];
  avatar: string;
  profilePic: string;
  socialPoints: number;
  unlockedBadges: string[];
  role: 'Student' | 'Teacher' | 'Admin';
  preferences: {
    theme: ThemeMode;
    notifications: {
      email: boolean;
      inApp: boolean;
    };
    language: Language;
    privacyShowHistory: boolean;
  };
}
