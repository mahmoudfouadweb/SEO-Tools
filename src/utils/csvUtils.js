export const CsvUtils = {
    /**
     * Parses a CSV string into an array of objects.
     * Assumes the first row is the header.
     * @param {string} csvString The CSV content as a string.
     * @returns {Array<Object>} An array of objects representing the rows.
     */
    parseCSV(csvString) {
        const lines = csvString.trim().split(/\r?\n/);
        if (lines.length < 2) return []; // Must have header and at least one data row

        const headers = lines[0].split(',').map(h => h.trim());
        // This regex handles quoted fields, including commas inside them.
        const valueRegex = /(?:"([^"]*(?:""[^"]*)*)"|([^,]*))(?:,|$)/g;
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            if (!lines[i]) continue;

            const entry = {};
            let headerIndex = 0;
            // Reset regex state for each new line
            valueRegex.lastIndex = 0;

            while(headerIndex < headers.length) {
                const match = valueRegex.exec(lines[i]);
                if (!match) break;

                // Value is in group 1 if quoted, group 2 otherwise. Unescape double quotes.
                const value = (match[1] !== undefined ? match[1].replace(/""/g, '"') : match[2] || '').trim();

                if (headers[headerIndex]) {
                    entry[headers[headerIndex]] = value;
                }
                headerIndex++;
            }
            data.push(entry);
        }
        return data;
    },

    /**
     * Formats an array of keyword objects into a CSV string.
     * @param {Array<Object>} data The array of keyword objects.
     * @returns {string} A CSV formatted string.
     */
    formatCSV(data) {
        if (!data || data.length === 0) return '';
        const headers = Object.keys(data[0]);
        const csvRows = [headers.join(',')];

        const escapeCell = (cell) => {
            const str = String(cell || '');
            // If it contains a comma, a quote, or a newline, wrap it in quotes.
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                // Escape existing quotes by doubling them up
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };

        data.forEach(item => {
            const row = headers.map(header => escapeCell(item[header])).join(',');
            csvRows.push(row);
        });

        return csvRows.join('\n');
    },

    downloadCSV(csvString, filename) {
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};