import React from 'react';
import { render, screen } from '@testing-library/react';
import { mockUser, mockItems, mockRequests } from '../__mocks__/data';
import Marketplace from './Marketplace';

describe('Marketplace Component', () => {
  test('renders marketplace with items', () => {
    render(
      <Marketplace 
        items={mockItems} 
        requests={mockRequests}
        user={mockUser}
        language="en"
        theme="light"
        onPostRequest={() => {}}
      />
    );
    
    expect(screen.getByText(/Marketplace/i)).toBeInTheDocument();
    expect(screen.getByText(mockItems[0].name)).toBeInTheDocument();
  });

  test('filters items by category', () => {
    render(
      <Marketplace 
        items={mockItems} 
        requests={mockRequests}
        user={mockUser}
        language="en"
        theme="light"
        onPostRequest={() => {}}
      />
    );
    
    const filterButton = screen.getByText('All Categories');
    expect(filterButton).toBeInTheDocument();
  });
});