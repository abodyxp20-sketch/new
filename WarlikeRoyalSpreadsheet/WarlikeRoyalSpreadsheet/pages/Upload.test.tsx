import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { mockUser } from '../__mocks__/data';
import Upload from './Upload';

describe('Upload Component', () => {
  test('renders upload form for authenticated user', () => {
    render(
      <Upload 
        user={mockUser}
        language="en"
        onUpload={() => {}}
      />
    );
    
    expect(screen.getByText(/Donate Item/i)).toBeInTheDocument();
    expect(screen.getByText(/Item Name/i)).toBeInTheDocument();
  });

  test('shows error message for unauthenticated user', () => {
    render(
      <Upload 
        user={null}
        language="en"
        onUpload={() => {}}
      />
    );
    
    expect(screen.getByText(/Please log in to donate items./i)).toBeInTheDocument();
  });

  test('handles form input changes', () => {
    render(
      <Upload 
        user={mockUser}
        language="en"
        onUpload={() => {}}
      />
    );
    
    const nameInput = screen.getByLabelText(/Item Name/i);
    fireEvent.change(nameInput, { target: { value: 'Test Item' } });
    
    expect((nameInput as HTMLInputElement).value).toBe('Test Item');
  });
});