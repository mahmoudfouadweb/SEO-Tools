import { describe, it, expect, vi } from 'vitest';
import { KeywordExtractorTool } from './KeywordExtractorTool.js';

// Mock stateManager
const mockStateManager = {
  getState: vi.fn(() => ({})),
};

describe('KeywordExtractorTool', () => {
  describe('_extractKeywords', () => {
    it('should extract the most frequent words', () => {
      const tool = new KeywordExtractorTool(mockStateManager);
      const content = {
        mainContent: 'seo tools platform seo tools platform seo tools',
      };
      const config = {
        minKeywordLength: 3,
        excludeCommonWords: false,
        excludeNumbers: false,
        maxKeywordsPerUrl: 5,
        manualExcludedWords: [],
      };
      const keywords = tool._extractKeywords(content, config);
      expect(keywords).toEqual([
        { keyword: 'seo', frequency: 3, score: 3 },
        { keyword: 'tools', frequency: 3, score: 3 },
        { keyword: 'platform', frequency: 2, score: 2 },
      ]);
    });

    it('should exclude stop words when excludeCommonWords is true', () => {
      const tool = new KeywordExtractorTool(mockStateManager);
      const content = {
        mainContent: 'this is a test of the stop words removal',
      };
      const config = {
        minKeywordLength: 2,
        excludeCommonWords: true,
        excludeNumbers: false,
        maxKeywordsPerUrl: 5,
        manualExcludedWords: [],
      };
      const keywords = tool._extractKeywords(content, config);
      // Only 'test', 'stop', 'words', 'removal' should remain
      expect(keywords).toEqual([
        { keyword: 'test', frequency: 1, score: 1 },
        { keyword: 'stop', frequency: 1, score: 1 },
        { keyword: 'words', frequency: 1, score: 1 },
        { keyword: 'removal', frequency: 1, score: 1 },
      ]);
    });

    it('should respect minKeywordLength', () => {
      const tool = new KeywordExtractorTool(mockStateManager);
      const content = {
        mainContent: 'a ab abc abcd abcde',
      };
      const config = {
        minKeywordLength: 4,
        excludeCommonWords: false,
        excludeNumbers: false,
        maxKeywordsPerUrl: 5,
        manualExcludedWords: [],
      };
      const keywords = tool._extractKeywords(content, config);
      // Only words of length >=4: 'abcd', 'abcde'
      expect(keywords).toEqual([
        { keyword: 'abcd', frequency: 1, score: 1 },
        { keyword: 'abcde', frequency: 1, score: 1 },
      ]);
    });

    it('should identify n-grams and score them higher', () => {
      const tool = new KeywordExtractorTool(mockStateManager);
      const content = {
        mainContent: 'search engine optimization is important for search engine rankings',
      };
      const config = {
        minKeywordLength: 3,
        excludeCommonWords: false,
        excludeNumbers: false,
        maxKeywordsPerUrl: 5,
        manualExcludedWords: [],
      };
      const keywords = tool._extractKeywords(content, config);
      // Bigram "search engine" should have higher score than single words
      const bigram = keywords.find(k => k.keyword === 'search engine');
      expect(bigram).toBeDefined();
      expect(bigram.frequency).toBe(2);
      expect(bigram.score).toBeGreaterThan(2); // Score should be boosted for n-gram
    });

    it('should exclude manually excluded words', () => {
      const tool = new KeywordExtractorTool(mockStateManager);
      const content = {
        mainContent: 'seo tools platform',
      };
      const config = {
        minKeywordLength: 3,
        excludeCommonWords: false,
        excludeNumbers: false,
        maxKeywordsPerUrl: 5,
        manualExcludedWords: ['tools'],
      };
      const keywords = tool._extractKeywords(content, config);
      expect(keywords).toEqual([
        { keyword: 'seo', frequency: 1, score: 1 },
        { keyword: 'platform', frequency: 1, score: 1 },
      ]);
    });

    it('should exclude numbers when excludeNumbers is true', () => {
      const tool = new KeywordExtractorTool(mockStateManager);
      const content = {
        mainContent: 'seo 2024 tools 123',
      };
      const config = {
        minKeywordLength: 2,
        excludeCommonWords: false,
        excludeNumbers: true,
        maxKeywordsPerUrl: 5,
        manualExcludedWords: [],
      };
      const keywords = tool._extractKeywords(content, config);
      // Numbers should be excluded
      expect(keywords).toEqual([
        { keyword: 'seo', frequency: 1, score: 1 },
        { keyword: 'tools', frequency: 1, score: 1 },
      ]);
    });

    it('should handle mixed content with special characters', () => {
      const tool = new KeywordExtractorTool(mockStateManager);
      const content = {
        mainContent: 'SEO-tools (platform) for 2024: best@example.com +1-800-123-4567',
      };
      const config = {
        minKeywordLength: 3,
        excludeCommonWords: false,
        excludeNumbers: true,
        maxKeywordsPerUrl: 5,
        manualExcludedWords: [],
      };
      const keywords = tool._extractKeywords(content, config);
      expect(keywords).toEqual([
        { keyword: 'seo tools', frequency: 1, score: 1.75 },
        { keyword: 'platform', frequency: 1, score: 1 },
      ]);
    });
  });
});
