import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { mockUser, mockItems, mockRequests } from '../__mocks__/data';
import Home from './Home';

describe('Home Component', () => {
  test('renders home page with welcome message', () => {
    render(
      <Home 
        user={mockUser} 
        language="en" 
        items={mockItems} 
      />
    );
    
    expect(screen.getByText(/Welcome/i)).toBeInTheDocument();
    expect(screen.getByText(mockUser.displayName)).toBeInTheDocument();
  });

  test('displays items on home page', () => {
    render(
      <Home 
        user={mockUser} 
        language="en" 
        items={mockItems} 
      />
    );
    
    expect(screen.getByText(mockItems[0].name)).toBeInTheDocument();
    expect(screen.getByText(mockItems[0].description)).toBeInTheDocument();
  });
});