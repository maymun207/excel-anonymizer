import { describe, it, expect } from 'vitest';
import { translations } from '@/lib/i18n';

describe('i18n Consistency', () => {
  it('every translation key should have both en and tr versions', () => {
    Object.entries(translations).forEach(([key, value]) => {
      expect(value).toHaveProperty('en');
      expect(value).toHaveProperty('tr');
      
      // Ensure values are either strings, functions, or objects (for nested labels)
      expect(['string', 'function', 'object']).toContain(typeof value.en);
      expect(['string', 'function', 'object']).toContain(typeof value.tr);
    });
  });

  it('function-based translations should accept the same number of arguments', () => {
    Object.entries(translations).forEach(([key, value]) => {
      if (typeof value.en === 'function' && typeof value.tr === 'function') {
        expect(value.en.length).toBe(value.tr.length);
      }
    });
  });
});
