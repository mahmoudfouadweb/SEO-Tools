import { KeywordExtractorTool } from './KeywordExtractorTool.js';

class MockStateManager {
    constructor() {
        this.state = {
            manualExcludedWords: [],
            excludeNumbers: true
        };
    }
    getState() {
        return this.state;
    }
    emit() {} // Mock emit method
}

(async () => {
    const stateManager = new MockStateManager();
    const tool = new KeywordExtractorTool(stateManager);
    
    // Test with numbers and excluded words
    const sampleContent = {
        title: 'Contact us at 123-456-7890',
        metaDescription: 'Our office opened in 2023. Call us or email at test@example.com',
        headings: ['Phone Support 24/7', '2024 Updates'],
        mainContent: 'Call us at any time: 123-456-7890. We have been serving since 1995.'
    };

    const configWithExclusions = {
        excludeNumbers: true,
        manualExcludedWords: ['email', 'call', 'contact'],
        minKeywordLength: 2,
        maxKeywordsPerUrl: 10
    };

    const configWithoutExclusions = {
        excludeNumbers: false,
        manualExcludedWords: [],
        minKeywordLength: 2,
        maxKeywordsPerUrl: 10
    };

    console.log('Testing with exclusions enabled:');
    const resultWithExclusions = tool._extractKeywords(sampleContent, configWithExclusions);
    console.log('Keywords extracted (with exclusions):', resultWithExclusions.map(k => k.keyword));

    console.log('\nTesting without exclusions:');
    const resultWithoutExclusions = tool._extractKeywords(sampleContent, configWithoutExclusions);
    console.log('Keywords extracted (without exclusions):', resultWithoutExclusions.map(k => k.keyword));

    // Test URL keyword extraction
    const testUrls = [
        'https://example.com/web-development-tips-2024',
        'https://example.com/contact-us',
        'https://example.com/blog/how-to-learn-javascript'
    ];

    console.log('\nTesting URL keyword extraction:');
    testUrls.forEach(url => {
        const keyword = tool.extractKeywordFromUrl(url);
        console.log(`URL: ${url}\nExtracted: ${keyword}\n`);
    });
})();
