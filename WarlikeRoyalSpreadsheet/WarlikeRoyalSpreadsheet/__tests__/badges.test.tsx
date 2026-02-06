import React from 'react';
import { render, screen } from '@testing-library/react';
import { ALL_BADGES } from '../App';

describe('Badge System', () => {
  test('ALL_BADGES array contains expected badges', () => {
    expect(ALL_BADGES).toHaveLength(4);
    
    const firstBadge = ALL_BADGES[0];
    expect(firstBadge.id).toBe('first-give');
    expect(firstBadge.nameEn).toBe('First Giver');
    expect(firstBadge.nameAr).toBe('شرارة العطاء');
    expect(firstBadge.icon).toBe('🌟');
    expect(firstBadge.color).toBe('bg-amber-400');
    expect(firstBadge.condition).toBe('Donate 1 item');
  });
  
  test('all badges have required properties', () => {
    ALL_BADGES.forEach(badge => {
      expect(badge).toHaveProperty('id');
      expect(badge).toHaveProperty('nameEn');
      expect(badge).toHaveProperty('nameAr');
      expect(badge).toHaveProperty('icon');
      expect(badge).toHaveProperty('color');
      expect(badge).toHaveProperty('condition');
    });
  });
});