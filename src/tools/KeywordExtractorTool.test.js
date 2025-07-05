import { describe, it, expect } from 'vitest';
import { KeywordExtractorTool } from './KeywordExtractorTool.js';

function makeTool(config = {}) {
  // Minimal stateManager mock
  return new KeywordExtractorTool({ getState: () => ({}) }, config);
}

describe('KeywordExtractorTool _extractKeywords', () => {
  it('extracts most frequent words', () => {
    const tool = makeTool();
    const content = { mainContent: 'seo seo tools tools tools platform' };
    const config = { minKeywordLength: 2, excludeCommonWords: false, maxKeywordsPerUrl: 5, manualExcludedWords: [] };
    const result = tool._extractKeywords(content, config);
    expect(result[0].keyword).toBe('tools');
    expect(result[0].frequency).toBe(3);
    expect(result.some(k => k.keyword === 'seo')).toBe(true);
  });

  it('excludes stop words', () => {
    const tool = makeTool();
    const content = { mainContent: 'the a is seo tool the the' };
    const config = { minKeywordLength: 2, excludeCommonWords: true, maxKeywordsPerUrl: 5, manualExcludedWords: [] };
    const result = tool._extractKeywords(content, config);
    expect(result.some(k => k.keyword === 'the')).toBe(false);
    expect(result.some(k => k.keyword === 'seo')).toBe(true);
  });

  it('respects minKeywordLength', () => {
    const tool = makeTool();
    const content = { mainContent: 'a ab abc abcd abcde' };
    const config = { minKeywordLength: 4, excludeCommonWords: false, maxKeywordsPerUrl: 5, manualExcludedWords: [] };
    const result = tool._extractKeywords(content, config);
    expect(result.some(k => k.keyword === 'abc')).toBe(false);
    expect(result.some(k => k.keyword === 'abcd')).toBe(true);
    expect(result.some(k => k.keyword === 'abcde')).toBe(true);
  });

  it('identifies n-grams and scores them higher', () => {
    const tool = makeTool();
    const content = { mainContent: 'seo tools platform seo tools platform seo tools' };
    const config = { minKeywordLength: 2, excludeCommonWords: false, maxKeywordsPerUrl: 5, manualExcludedWords: [] };
    const result = tool._extractKeywords(content, config);
    // Should find 'seo tools' as a phrase
    expect(result.some(k => k.keyword === 'seo tools')).toBe(true);
  });

  it('ignores manually excluded words', () => {
    const tool = makeTool();
    const content = { mainContent: 'seo tools platform' };
    const config = { minKeywordLength: 2, excludeCommonWords: false, maxKeywordsPerUrl: 5, manualExcludedWords: ['tools'] };
    const result = tool._extractKeywords(content, config);
    expect(result.some(k => k.keyword === 'tools')).toBe(false);
  });
});
