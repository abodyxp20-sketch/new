import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Navbar from '../components/Navbar';

describe('Navbar Component', () => {
  test('renders navbar with navigation links', () => {
    const mockUser = {
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
    
    render(
      <Navbar 
        user={mockUser}
        theme="light"
        language="en"
        toggleLanguage={() => {}}
      />
    );
    
    expect(screen.getByText(/Ataa/i)).toBeInTheDocument();
    expect(screen.getByText(/Marketplace/i)).toBeInTheDocument();
    expect(screen.getByText(/Upload/i)).toBeInTheDocument();
  });

  test('displays user menu when logged in', () => {
    const mockUser = {
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
    
    render(
      <Navbar 
        user={mockUser}
        theme="light"
        language="en"
        toggleLanguage={() => {}}
      />
    );
    
    expect(screen.getByText(/Test User/i)).toBeInTheDocument();
  });

  test('shows login option when not logged in', () => {
    render(
      <Navbar 
        user={null}
        theme="light"
        language="en"
        toggleLanguage={() => {}}
      />
    );
    
    expect(screen.getByText(/Login/i)).toBeInTheDocument();
  });
});