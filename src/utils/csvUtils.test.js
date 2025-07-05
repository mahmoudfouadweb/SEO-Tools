import { CsvUtils } from './csvUtils.js';

describe('CsvUtils', () => {
    describe('parseCSV', () => {
        it('should parse a simple CSV string', () => {
            const csv = 'header1,header2\nvalue1,value2';
            const expected = [{ header1: 'value1', header2: 'value2' }];
            expect(CsvUtils.parseCSV(csv)).toEqual(expected);
        });

        it('should handle quoted values', () => {
            const csv = 'header1,header2\n"value 1","value 2"';
            const expected = [{ header1: 'value 1', header2: 'value 2' }];
            expect(CsvUtils.parseCSV(csv)).toEqual(expected);
        });

        it('should handle empty lines', () => {
            const csv = 'header1,header2\n\nvalue1,value2';
            const expected = [{ header1: 'value1', header2: 'value2' }];
            expect(CsvUtils.parseCSV(csv)).toEqual(expected);
        });

        it('should handle CSV with no data rows', () => {
            const csv = 'header1,header2';
            const expected = [];
            expect(CsvUtils.parseCSV(csv)).toEqual(expected);
        });
    });

    describe('formatCSV', () => {
        it('should format an array of objects into a CSV string', () => {
            const data = [{ header1: 'value1', header2: 'value2' }];
            const expected = 'header1,header2\nvalue1,value2';
            expect(CsvUtils.formatCSV(data)).toEqual(expected);
        });

        it('should handle special characters in values', () => {
            const data = [{ header1: 'value,1', header2: 'value"2' }];
            const expected = 'header1,header2\n"value,1","value""2"';
            expect(CsvUtils.formatCSV(data)).toEqual(expected);
        });

        it('should handle an empty array', () => {
            const data = [];
            const expected = '';
            expect(CsvUtils.formatCSV(data)).toEqual(expected);
        });
    });
});
