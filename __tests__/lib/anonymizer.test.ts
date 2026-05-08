import { describe, it, expect } from 'vitest';
import { buildMapping } from '@/lib/anonymizer';
import type { SheetColumnConfig } from '@/lib/types';

describe('Anonymizer Core Logic', () => {
  describe('buildMapping', () => {
    it('should correctly map PERSON and ORG types', () => {
      const sheetData = {
        'Sheet1': [
          ['Ahmet Yılmaz', 'Arçelik', '123'],
          ['Fatma Kaya', 'Beko', '456'],
          ['Ahmet Yılmaz', 'Arçelik', '789'], // Duplicate check
        ]
      };

      const columnConfig: SheetColumnConfig = {
        'Sheet1': {
          '0': 'PERSON',
          '1': 'ORG',
          '2': 'none'
        }
      };

      const mapping = buildMapping(sheetData, columnConfig);

      // Verify Ahmet Yılmaz is mapped consistently
      expect(mapping['Ahmet Yılmaz']).toBe('KİŞİ_001');
      expect(mapping['Fatma Kaya']).toBe('KİŞİ_002');
      
      // Verify Arçelik is mapped
      expect(mapping['Arçelik']).toBe('FİRMA_001');
      expect(mapping['Beko']).toBe('FİRMA_002');

      // Verify 'Other' column (123, 456, 789) is NOT mapped
      expect(mapping['123']).toBeUndefined();
      expect(mapping['456']).toBeUndefined();
    });

    it('should handle empty or null values', () => {
      const sheetData = {
        'Sheet1': [
          [null, undefined, ' '],
          ['Valid Name', 'Valid Org', 'Data'],
        ]
      };

      const columnConfig: SheetColumnConfig = {
        'Sheet1': {
          '0': 'PERSON',
          '1': 'ORG'
        }
      };

      const mapping = buildMapping(sheetData, columnConfig);
      
      expect(Object.keys(mapping)).toHaveLength(2);
      expect(mapping['Valid Name']).toBe('KİŞİ_001');
      expect(mapping['Valid Org']).toBe('FİRMA_001');
    });

    it('should handle multi-sheet mapping', () => {
      const sheetData = {
        'S1': [['A']],
        'S2': [['B']]
      };
      const columnConfig: SheetColumnConfig = {
        'S1': { '0': 'PERSON' },
        'S2': { '0': 'PERSON' }
      };

      const mapping = buildMapping(sheetData, columnConfig);
      expect(mapping['A']).toBe('KİŞİ_001');
      expect(mapping['B']).toBe('KİŞİ_002');
    });
  });
});
