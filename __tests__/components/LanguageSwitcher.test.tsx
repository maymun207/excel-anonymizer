import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LanguageProvider } from '@/hooks/useLanguage';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import React from 'react';

describe('UI Components', () => {
  it('LanguageSwitcher should toggle languages', () => {
    render(
      <LanguageProvider>
        <LanguageSwitcher />
      </LanguageProvider>
    );

    const button = screen.getByRole('button');
    
    // Initial state: locale is 'en', so button shows 'TR'
    expect(button).toHaveTextContent('TR'); 

    // Click to switch to TR, button should now show 'EN'
    fireEvent.click(button);
    expect(button).toHaveTextContent('EN');
  });
});
