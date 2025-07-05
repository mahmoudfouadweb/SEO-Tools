import { Tool } from './Tool.js';

export class KeywordExtractorTool extends Tool {
    constructor(stateManager) {
        super(stateManager);
        this.name = 'Keyword Extractor';
        this.id = 'keyword-extractor';
        this.description = 'Extract and analyze keywords from URLs or sitemap.xml';
        if (typeof document !== 'undefined') {
            this.attachEventListeners();
        }
    }

    getName() {
        return this.name;
    }

    getID() {
        return this.id;
    }

    getDescription() {
        return this.description;
    }

    getConfigSchema() {
        return {
            type: 'object',
            properties: {
                inputType: {
                    type: 'string',
                    enum: ['urls', 'sitemap'],
                    default: 'urls',
                    description: 'Input type: direct URLs or sitemap.xml'
                },
                maxKeywordsPerUrl: {
                    type: 'number',
                    minimum: 1,
                    maximum: 20,
                    default: 5,
                    description: 'Maximum keywords to extract per URL'
                },
                minKeywordLength: {
                    type: 'number',
                    minimum: 2,
                    maximum: 50,
                    default: 3,
                    description: 'Minimum keyword length'
                },
                excludeNumbers: {
                    type: 'boolean',
                    default: true,
                    description: 'Exclude numbers (phone numbers, years, etc.)'
                },
                manualExcludedWords: {
                    type: 'array',
                    items: { type: 'string' },
                    default: [],
                    description: 'Manually excluded words'
                }
            },
            required: ['inputType', 'maxKeywordsPerUrl']
        };
    }

    attachEventListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.id === 'add-excluded-word') {
                const input = document.getElementById('new-excluded-word');
                const word = input.value.trim();
                if (word) {
                    const state = this.stateManager.getState();
                    const manualExcludedWords = Array.from(new Set([...(state.manualExcludedWords || []), word]));
                    this.stateManager.emit('event', { type: 'update-manual-excluded-words', payload: manualExcludedWords });
                    input.value = '';
                }
            } else if (e.target.classList.contains('remove-excluded-word')) {
                const wordToRemove = e.target.dataset.word;
                const state = this.stateManager.getState();
                const manualExcludedWords = (state.manualExcludedWords || []).filter(w => w !== wordToRemove);
                this.stateManager.emit('event', { type: 'update-manual-excluded-words', payload: manualExcludedWords });
            }
        });

        document.addEventListener('change', (e) => {
            if (e.target.name === 'excludeNumbers') {
                this.stateManager.emit('event', { type: 'set-exclude-numbers', payload: e.target.checked });
            }
        });
    }

    async _fetchSitemap(sitemapUrl) {
        try {
            const proxyUrl = 'https://api.codetabs.com/v1/proxy?quest=' + encodeURIComponent(sitemapUrl);
            const response = await fetch(proxyUrl);
            if (!response.ok) {
                throw new Error(`Failed to fetch sitemap: ${response.statusText}`);
            }
            const text = await response.text();
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(text, 'text/xml');

            const parserError = xmlDoc.querySelector('parsererror');
            if (parserError) {
                throw new Error('Invalid sitemap XML format');
            }

            const urls = [
                ...xmlDoc.getElementsByTagName('loc'),
                ...xmlDoc.getElementsByTagName('news:link')
            ].map(node => node.textContent.trim());

            return [...new Set(urls)];
        } catch (error) {
            throw new Error(`Sitemap processing failed: ${error.message}`);
        }
    }

    async _fetchUrlContent(url) {
        try {
            const proxyUrl = 'https://api.codetabs.com/v1/proxy?quest=' + encodeURIComponent(url);
            const response = await fetch(proxyUrl);
            if (!response.ok) {
                throw new Error(`Failed to fetch URL: ${response.statusText}`);
            }

            const text = await response.text();
            if (!text) {
                throw new Error(`Proxy returned empty content for URL: ${url}`);
            }
            const parser = new DOMParser();
            const doc = parser.parseFromString(text, 'text/html');

            return {
                title: doc.title,
                metaDescription: doc.querySelector('meta[name="description"]')?.content || '',
                headings: Array.from(doc.querySelectorAll('h1, h2, h3')).map(h => h.textContent),
                mainContent: doc.body.textContent
            };
        } catch (error) {
            throw new Error(`URL processing failed: ${error.message}`);
        }
    }

    _extractKeywords(content, config) {
        const manualExcludedSet = new Set((config.manualExcludedWords || []).map(w => w.toLowerCase()));
        const commonWords = new Set([
            'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he',
            'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the', 'to', 'was', 'were', 'will', 'with',
            // Arabic common words
            'في', 'من', 'على', 'إلى', 'عن', 'هو', 'هي', 'هم', 'هن', 'هذا', 'هذه', 'ذلك', 'تلك', 'كان', 'يكون', 'قد', 'تم'
        ]);

        const textToAnalyze = [
            (content.title || '').repeat(3),
            (content.metaDescription || '').repeat(2),
            ...content.headings,
            (content.mainContent || '')
        ].join(' ');

        // 1. Pre-process text and get a clean list of words
        const rawWords = textToAnalyze.toLowerCase()
            .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '')
            .replace(/https?:\/\/[^\s]+/g, '')
            .replace(config.excludeNumbers ? /\d+/g : '', ' ')
            .replace(/[^\w\s-]/g, ' ')
            .replace(/[-_]+/g, ' ')
            .replace(/\s+/g, ' ')
            .split(' ')
            .filter(Boolean);

        // 2. Generate n-grams (bigrams and trigrams)
        const generateNgrams = (wordList, n) => {
            const ngrams = [];
            for (let i = 0; i <= wordList.length - n; i++) {
                ngrams.push(wordList.slice(i, i + n).join(' '));
            }
            return ngrams;
        };

        const bigrams = generateNgrams(rawWords, 2);
        const trigrams = generateNgrams(rawWords, 3);

        // 3. Combine all potential keywords and filter them
        const allPotentialKeywords = [...rawWords, ...bigrams, ...trigrams];

        const filteredKeywords = allPotentialKeywords.filter(keyword => {
            if (!keyword) return false;

            const wordsInKeyword = keyword.split(' ');
            
            // Filter by length
            if (wordsInKeyword.some(w => w.length < config.minKeywordLength)) return false;
            
            // Filter by manual exclusion list
            if (wordsInKeyword.some(w => manualExcludedSet.has(w))) return false;

            // Filter n-grams that start or end with a common word
            if (wordsInKeyword.length > 1) {
                if (commonWords.has(wordsInKeyword[0]) || commonWords.has(wordsInKeyword[wordsInKeyword.length - 1])) {
                    return false;
                }
            } else { // Filter single common words
                if (commonWords.has(keyword)) return false;
            }

            if (/^(com|net|org|edu|gov|mil|biz|info|name|museum|coop|aero|[a-z]{2,3})$/i.test(keyword)) return false;
            return true;
        });

        // 4. Calculate frequency of the filtered keywords
        const keywordFreq = filteredKeywords.reduce((acc, keyword) => {
            acc[word] = (acc[word] || 0) + 1;
            return acc;
        }, {});
        
        // 5. Score, rank, and return the top keywords
        const rankedKeywords = Object.entries(keywordFreq)
            .map(([keyword, freq]) => {
                const wordCount = keyword.split(' ').length;
                // Score boosts for frequency and for being a multi-word phrase
                const score = freq * (1 + (wordCount - 1) * 0.75);
                return { keyword, frequency: freq, score };
            })
            // Filter out single-occurrence single words, which are likely noise
            .filter(k => k.frequency > 1 || k.keyword.includes(' '))
            .sort((a, b) => b.score - a.score)
            .slice(0, config.maxKeywordsPerUrl);

        return rankedKeywords;
    }

    extractKeywordFromUrl(url) {
        try {
            const path = new URL(url).pathname;
            // Remove leading/trailing slashes and get the last path segment
            const slug = path.replace(/^\/+|\/+$/g, '').split('/').pop();
            if (!slug) return '';
            const decoded = decodeURIComponent(slug);
            // Replace hyphens and underscores with spaces and clean up extra spaces
            return decoded.replace(/[-_]+/g, ' ').trim();
        } catch (e) {
            return '';
        }
    }

    async run(inputData) {
        try {
            const config = {
                ...this.getConfigSchema().properties,
                ...inputData.config
            };

            this.validateInput(inputData);

            let urls = [];
            let isSitemap = false;
            if (config.inputType === 'sitemap') {
                urls = await this._fetchSitemap(inputData.sitemapUrl);
                isSitemap = true;
            } else {
                urls = inputData.urls;
            }

            const results = await Promise.all(urls.map(async url => {
                try {
                    let content, keywords;
                    if (isSitemap) {
                        const keyword = this.extractKeywordFromUrl(url);
                        keywords = keyword ? [{ keyword, frequency: 1, score: 1 }] : [];
                        content = { title: '', metaDescription: '', headings: [], mainContent: '' };
                    } else {
                        try {
                            content = await this._fetchUrlContent(url);
                            keywords = this._extractKeywords(content, config);
                        } catch (fetchErr) {
                            const keyword = this.extractKeywordFromUrl(url);
                            keywords = keyword ? [{ keyword, frequency: 1, score: 1 }] : [];
                            content = { title: '', metaDescription: '', headings: [], mainContent: '' };
                        }
                        if (!keywords || keywords.length === 0) {
                            const keyword = this.extractKeywordFromUrl(url);
                            keywords = keyword ? [{ keyword, frequency: 1, score: 1 }] : [];
                        }
                    }
                    return {
                        url,
                        success: true,
                        title: content.title,
                        keywords,
                        metadata: {
                            processedAt: new Date().toISOString(),
                            keywordCount: keywords.length
                        }
                    };
                } catch (error) {
                    return {
                        url,
                        success: false,
                        error: error.message
                    };
                }
            }));

            return {
                success: true,
                results,
                metadata: {
                    totalUrls: urls.length,
                    successfulExtractions: results.filter(r => r.success).length,
                    failedExtractions: results.filter(r => !r.success).length,
                    processingTime: new Date().toISOString()
                }
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    validateInput(inputData) {
        const { inputType } = inputData.config || {};

        if (inputType === 'sitemap') {
            if (!inputData.sitemapUrl) {
                throw new Error('Sitemap URL is required when input type is "sitemap"');
            }
            if (!inputData.sitemapUrl.match(/^https?:\/\/.+\.xml$/)) {
                throw new Error('Invalid sitemap URL format');
            }
        } else {
            if (!Array.isArray(inputData.urls)) {
                throw new Error('URLs array is required when input type is "urls"');
            }
            if (inputData.urls.length === 0) {
                throw new Error('At least one URL is required');
            }
            inputData.urls.forEach(url => {
                if (!url.match(/^https?:\/\//)) {
                    throw new Error(`Invalid URL format: ${url}`);
                }
            });
        }

        return true;
    }
}
