import { describe, test, expect, vi } from 'vitest';
import InternalLinkingTool from './InternalLinkingTool';

// Mock fetch globally
global.fetch = vi.fn();

describe('InternalLinkingTool', () => {
    let tool;

    beforeEach(() => {
        tool = new InternalLinkingTool();
        // Reset fetch mock before each test
        global.fetch.mockClear();
    });

    describe('getName, getID, getDescription', () => {
        test('should return correct name', () => {
            expect(tool.getName()).toBe('Internal Linking');
        });

        test('should return correct ID', () => {
            expect(tool.getID()).toBe('internal-linking');
        });

        test('should return correct description', () => {
            expect(tool.getDescription()).toBe('Analyze and suggest internal linking opportunities');
        });
    });

    describe('getConfigSchema', () => {
        test('should return a valid configuration schema', () => {
            const schema = tool.getConfigSchema();
            expect(schema).toBeDefined();
            expect(schema.type).toBe('object');
            expect(schema.properties).toHaveProperty('minRelevanceScore');
            expect(schema.properties).toHaveProperty('maxSuggestionsPerPage');
        });
    });

    describe('validateInput', () => {
        test('should validate valid input', () => {
            const input = {
                articles: [
                    { url: 'http://example.com/page1', keyword: 'keyword1' },
                    { url: 'http://example.com/page2', keyword: 'keyword2' }
                ]
            };
            
            expect(() => tool.validateInput(input)).not.toThrow();
        });

        test('should throw error for missing articles array', () => {
            const input = {};
            
            expect(() => tool.validateInput(input)).toThrow('Invalid input: articles array is required');
        });

        test('should throw error for article without url or keyword', () => {
            const input = {
                articles: [
                    { keyword: 'keyword1' }, // Missing url
                    { url: 'http://example.com/page2' } // Missing keyword
                ]
            };
            
            expect(() => tool.validateInput(input)).toThrow('Invalid article format');
        });
    });

    describe('_escapeRegex', () => {
        test('should escape regex special characters', () => {
            const input = 'test*+?^$.()|[]\{}';
            const expected = 'test\\*\\+\\?\\^\\$\\.\\(\\)\\|\\[\\]\\\\\\{\\}';
            
            expect(tool._escapeRegex(input)).toBe(expected);
        });
    });

    describe('_getContext', () => {
        test('should return a snippet with ellipses', () => {
            const text = 'This is a long sentence to test context extraction.';
            const index = text.indexOf('test');
            const length = 'test'.length;
            const context = tool._getContext(text, index, length);
            expect(context).toContain('...sentence to test context extraction...');
            expect(context).toMatch(/^\.\.\..*\.\.\.$/);
        });

        test('should handle start of string', () => {
            const text = 'Test context extraction from the beginning.';
            const index = text.indexOf('Test');
            const length = 'Test'.length;
            const context = tool._getContext(text, index, length);
            expect(context).toContain('Test context extraction...');
            expect(context).not.toMatch(/^\.\.\./); // Should not have leading ellipses if at start
        });

        test('should handle end of string', () => {
            const text = 'Context extraction at the end of the string test.';
            const index = text.indexOf('test');
            const length = 'test'.length;
            const context = tool._getContext(text, index, length);
            expect(context).toContain('...string test.');
            expect(context).not.toMatch(/\.\.\.$/); // Should not have trailing ellipses if at end
        });
    });

    describe('_fetchUrlContent', () => {
        test('should fetch content from URL', async () => {
            const mockHtml = '<html><body><h1>Test Content</h1></body></html>';
            
            global.fetch.mockImplementationOnce(() => 
                Promise.resolve({
                    ok: true,
                    text: () => Promise.resolve(mockHtml)
                })
            );

            const result = await tool._fetchUrlContent('http://example.com/test');
            
            expect(result).toBe(mockHtml);
            expect(global.fetch).toHaveBeenCalledWith('http://example.com/test');
        });

        test('should throw error for failed fetch', async () => {
            global.fetch.mockImplementationOnce(() => 
                Promise.reject(new Error('Network error'))
            );

            await expect(tool._fetchUrlContent('http://example.com/error'))
                .rejects
                .toThrow('Network error');
        });

        test('should throw error for empty content', async () => {
            global.fetch.mockImplementationOnce(() => 
                Promise.resolve({
                    ok: true,
                    text: () => Promise.resolve('')
                })
            );

            await expect(tool._fetchUrlContent('http://example.com/empty'))
                .rejects
                .toThrow('Proxy returned empty content for URL: http://example.com/empty');
        });
    });

    describe('run', () => {
        test('should return suggestions and no warnings/errors for valid input', async () => {
            const input = {
                articles: [
                    { url: 'http://example.com/page1', keyword: 'keyword1' },
                    { url: 'http://example.com/page2', keyword: 'keyword2' },
                ],
            };

            global.fetch
                .mockImplementationOnce(() =>
                    Promise.resolve({
                        ok: true,
                        text: () => Promise.resolve('<html><body><p>This is page1 with keyword2.</p></body></html>'),
                    })
                )
                .mockImplementationOnce(() =>
                    Promise.resolve({
                        ok: true,
                        text: () => Promise.resolve('<html><body><p>This is page2 with keyword1.</p></body></html>'),
                    })
                );

            const result = await tool.run(input);
            expect(result.success).toBe(true);
            expect(result.results.suggestions).toHaveLength(2);
            expect(result.results.suggestions[0].keyword).toBe('keyword2');
            expect(result.results.suggestions[1].keyword).toBe('keyword1');
            expect(result.results.warnings).toHaveLength(0);
            expect(result.results.errors).toHaveLength(0);
        });

        test('should avoid self-linking', async () => {
            const input = {
                articles: [
                    { url: 'http://example.com/page1', keyword: 'keyword1' },
                ],
            };

            global.fetch.mockImplementationOnce(() =>
                Promise.resolve({
                    ok: true,
                    text: () => Promise.resolve('<html><body><p>This is page1 with keyword1.</p></body></html>'),
                })
            );

            const result = await tool.run(input);
            expect(result.success).toBe(true);
            expect(result.results.suggestions).toHaveLength(0);
        });

        test('should avoid suggesting links to pages that already have a link', async () => {
            const input = {
                articles: [
                    { url: 'http://example.com/page1', keyword: 'keyword1' },
                    { url: 'http://example.com/page2', keyword: 'keyword2' },
                ],
            };

            global.fetch
                .mockImplementationOnce(() =>
                    Promise.resolve({
                        ok: true,
                        text: () => Promise.resolve('<html><body><p>This is page1 with keyword2. <a href="http://example.com/page2">existing link</a></p></body></html>'),
                    })
                )
                .mockImplementationOnce(() =>
                    Promise.resolve({
                        ok: true,
                        text: () => Promise.resolve('<html><body><p>This is page2 with keyword1.</p></body></html>'),
                    })
                );

            const result = await tool.run(input);
            expect(result.success).toBe(true);
            expect(result.results.suggestions).toHaveLength(1); // Only page2 to page1 suggestion
            expect(result.results.suggestions[0].keyword).toBe('keyword1');
            expect(result.results.suggestions[0].from).toBe('http://example.com/page2');
            expect(result.results.suggestions[0].to).toBe('http://example.com/page1');
        });

        test('should generate diversity warnings if anchor text is not diversified', async () => {
            const input = {
                articles: [
                    { url: 'http://example.com/page1', keyword: 'keywordA' },
                    { url: 'http://example.com/page2', keyword: 'keywordA' },
                    { url: 'http://example.com/page3', keyword: 'keywordA' },
                ],
            };

            global.fetch
                .mockImplementation(() =>
                    Promise.resolve({
                        ok: true,
                        text: () => Promise.resolve('<html><body><p>This page mentions keywordA multiple times.</p></body></html>'),
                    })
                );

            const result = await tool.run(input);
            expect(result.success).toBe(true);
            expect(result.results.warnings).toHaveLength(3); // One warning per target URL
            expect(result.results.warnings[0]).toContain('Consider diversifying');
        });

        test('should report errors for failed fetches', async () => {
            const input = {
                articles: [
                    { url: 'http://example.com/page1', keyword: 'keyword1' },
                    { url: 'http://example.com/page_fail', keyword: 'keyword2' },
                ],
            };

            global.fetch
                .mockImplementationOnce(() =>
                    Promise.resolve({
                        ok: true,
                        text: () => Promise.resolve('<html><body><p>This is page1 with keyword2.</p></body></html>'),
                    })
                )
                .mockImplementationOnce(() => Promise.reject(new Error('Failed to connect')));

            const result = await tool.run(input);
            expect(result.success).toBe(true);
            expect(result.results.suggestions).toHaveLength(1);
            expect(result.results.errors).toHaveLength(1);
            expect(result.results.errors[0]).toContain('Failed to connect');
        });
    });
});
