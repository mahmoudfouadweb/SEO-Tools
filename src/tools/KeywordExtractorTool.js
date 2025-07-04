import { Tool } from './Tool.js';

export class KeywordExtractorTool extends Tool {
    constructor(stateManager) {
        super(stateManager);
        this.name = 'Keyword Extractor';
        this.id = 'keyword-extractor';
        this.description = 'Extract and analyze keywords from URLs or sitemap.xml';
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
                excludeCommonWords: {
                    type: 'boolean',
                    default: true,
                    description: 'Exclude common stop words'
                }
            },
            required: ['inputType', 'maxKeywordsPerUrl']
        };
    }

    async _fetchSitemap(sitemapUrl) {
        try {
            const response = await fetch(sitemapUrl);
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
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch URL: ${response.statusText}`);
            }

            const text = await response.text();
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
        const stopWords = config.excludeCommonWords ? 
            new Set(['the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at']) : 
            new Set();

        const textToAnalyze = [
            content.title.repeat(3),
            content.metaDescription.repeat(2),
            ...content.headings,
            content.mainContent
        ].join(' ');

        const words = textToAnalyze.toLowerCase()
            .replace(/[^a-z0-9\s-]/g, ' ')
            .split(/\s+/)
            .filter(word => 
                word.length >= config.minKeywordLength && 
                !stopWords.has(word)
            );

        const wordFreq = words.reduce((acc, word) => {
            acc[word] = (acc[word] || 0) + 1;
            return acc;
        }, {});

        const totalWords = words.length;
        const keywords = Object.entries(wordFreq)
            .map(([word, freq]) => ({
                keyword: word,
                frequency: freq,
                score: (freq / totalWords) * Math.log(totalWords / freq)
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, config.maxKeywordsPerUrl);

        return keywords;
    }

    async run(inputData) {
        try {
            const config = {
                ...this.getConfigSchema().properties,
                ...inputData.config
            };

            this.validateInput(inputData);

            let urls = [];
            if (config.inputType === 'sitemap') {
                urls = await this._fetchSitemap(inputData.sitemapUrl);
            } else {
                urls = inputData.urls;
            }

            const results = await Promise.all(urls.map(async url => {
                try {
                    const content = await this._fetchUrlContent(url);
                    const keywords = this._extractKeywords(content, config);
                    
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

    getInputTemplate() {
        return `
            <div class="tool-input">
                <div class="mb-4">
                    <label class="block text-sm font-medium mb-2">Input Type</label>
                    <select name="inputType" class="w-full p-2 border rounded">
                        <option value="urls">Direct URLs</option>
                        <option value="sitemap">Sitemap XML</option>
                    </select>
                </div>
                
                <div class="mb-4" id="urls-input">
                    <label class="block text-sm font-medium mb-2">URLs (one per line)</label>
                    <textarea name="urls" rows="5" 
                        class="w-full p-2 border rounded"
                        placeholder="https://example.com/page1&#10;https://example.com/page2"></textarea>
                </div>

                <div class="mb-4" id="sitemap-input" style="display: none;">
                    <label class="block text-sm font-medium mb-2">Sitemap URL</label>
                    <input type="url" name="sitemapUrl" 
                        class="w-full p-2 border rounded"
                        placeholder="https://example.com/sitemap.xml">
                </div>

                <div class="mb-4">
                    <label class="block text-sm font-medium mb-2">Max Keywords per URL</label>
                    <input type="number" name="maxKeywordsPerUrl" 
                        min="1" max="20" value="5" 
                        class="w-full p-2 border rounded">
                </div>

                <div class="mb-4">
                    <label class="block text-sm font-medium mb-2">
                        <input type="checkbox" name="excludeCommonWords" checked>
                        Exclude Common Words
                    </label>
                </div>
            </div>
        `;
    }
}
