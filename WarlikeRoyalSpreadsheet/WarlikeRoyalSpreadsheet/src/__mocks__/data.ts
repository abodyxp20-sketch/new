import { render, screen } from '@testing-library/react';
import { UserProfile, SchoolItem, ItemRequest } from '../types';

// Mock data for testing
export const mockUser: UserProfile = {
  id: 'test-user-id',
  displayName: 'Test User',
  email: 'test@example.com',
  avatar: 'avatar-url',
  profilePic: 'profile-pic-url',
  socialPoints: 100,
  unlockedBadges: [],
  role: 'Student',
  preferences: {
    theme: 'light',
    notifications: {
      email: true,
      inApp: true,
    },
    language: 'en',
    privacyShowHistory: true,
  }
};

export const mockItems: SchoolItem[] = [
  {
    id: 'item-1',
    name: 'Pencil Case',
    description: 'A nice pencil case',
    category: 'Stationery',
    condition: 'New',
    pickupLocation: 'School Front Desk',
    imageUrl: 'image-url',
    donorId: 'test-user-id',
    donorName: 'Test User',
    isAvailable: true,
    status: 'approved',
    createdAt: Date.now(),
  }
];

export const mockRequests: ItemRequest[] = [
  {
    id: 'request-1',
    studentId: 'student-1',
    studentName: 'Jane Doe',
    itemName: 'Math Book',
    category: 'Books',
    createdAt: Date.now(),
  }
];