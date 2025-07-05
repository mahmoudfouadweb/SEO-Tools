import { describe, it, expect } from 'vitest';
import { CsvUtils } from './csvUtils.js';

describe('CsvUtils', () => {
  describe('parseCSV', () => {
    it('parses simple CSV', () => {
      const csv = 'name,age\nAlice,30\nBob,25';
      const rows = CsvUtils.parseCSV(csv);
      expect(rows).toEqual([
        { name: 'Alice', age: '30' },
        { name: 'Bob', age: '25' }
      ]);
    });

    it('handles empty lines and extra spaces', () => {
      const csv = 'name,age\n\n Alice , 30 \nBob,25\n';
      const rows = CsvUtils.parseCSV(csv);
      expect(rows).toEqual([
        { name: 'Alice', age: '30' },
        { name: 'Bob', age: '25' }
      ]);
    });

    it('returns empty array for empty input', () => {
      expect(CsvUtils.parseCSV('')).toEqual([]);
    });
  });

  describe('formatCSV', () => {
    it('formats array of objects to CSV', () => {
      const data = [
        { name: 'Alice', age: 30 },
        { name: 'Bob', age: 25 }
      ];
      const csv = CsvUtils.formatCSV(data);
      expect(csv).toContain('name,age');
      expect(csv).toContain('Alice,30');
      expect(csv).toContain('Bob,25');
    });

    it('handles empty array', () => {
      expect(CsvUtils.formatCSV([])).toBe('');
    });
  });
});
