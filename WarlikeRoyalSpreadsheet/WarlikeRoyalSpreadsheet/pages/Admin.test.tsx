import React from 'react';
import { render, screen } from '@testing-library/react';
import { mockUser, mockItems } from '../__mocks__/data';
import Admin from './Admin';

describe('Admin Component', () => {
  test('renders admin panel with items', () => {
    const mockOnApprove = jest.fn();
    const mockOnReject = jest.fn();
    
    render(
      <Admin 
        items={mockItems}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
        language="en"
      />
    );
    
    expect(screen.getByText(/Admin Panel/i)).toBeInTheDocument();
    expect(screen.getByText(mockItems[0].name)).toBeInTheDocument();
  });

  test('shows pending items for review', () => {
    const mockOnApprove = jest.fn();
    const mockOnReject = jest.fn();
    
    const pendingItems = [{
      ...mockItems[0],
      status: 'pending'
    }];
    
    render(
      <Admin 
        items={pendingItems}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
        language="en"
      />
    );
    
    expect(screen.getByText(/Pending Items/i)).toBeInTheDocument();
  });
});