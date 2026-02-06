import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { mockUser } from '../__mocks__/data';
import Settings from './Settings';

describe('Settings Component', () => {
  test('renders settings page with user info', () => {
    const mockSetUser = jest.fn();
    const mockSetTheme = jest.fn();
    
    render(
      <Settings 
        user={mockUser}
        setUser={mockSetUser}
        theme="light"
        setTheme={mockSetTheme}
        language="en"
        toggleLanguage={() => {}}
      />
    );
    
    expect(screen.getByText(/Settings/i)).toBeInTheDocument();
    expect(screen.getByText(mockUser.displayName)).toBeInTheDocument();
  });

  test('allows theme selection', () => {
    const mockSetUser = jest.fn();
    const mockSetTheme = jest.fn();
    
    render(
      <Settings 
        user={mockUser}
        setUser={mockSetUser}
        theme="light"
        setTheme={mockSetTheme}
        language="en"
        toggleLanguage={() => {}}
      />
    );
    
    const themeSelector = screen.getByRole('combobox');
    expect(themeSelector).toBeInTheDocument();
  });
});