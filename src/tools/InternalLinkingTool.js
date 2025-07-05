import { Tool } from './Tool.js';

export class InternalLinkingTool extends Tool {
    constructor(stateManager) {
        super(stateManager);
        this.name = 'Internal Linking';
        this.id = 'internal-linking';
        this.description = 'Analyze and suggest internal linking opportunities';
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
                minRelevanceScore: {
                    type: 'number',
                    minimum: 0,
                    maximum: 1,
                    default: 0.5,
                    description: 'Minimum relevance score for suggesting links'
                },
                maxSuggestionsPerPage: {
                    type: 'number',
                    minimum: 1,
                    maximum: 20,
                    default: 5,
                    description: 'Maximum number of link suggestions per page'
                }
            }
        };
    }

    validateInput(inputData) {
        if (!inputData || !Array.isArray(inputData.articles)) {
            throw new Error('Input must contain an array of articles');
        }
        if (inputData.articles.length === 0) {
            throw new Error('You must provide at least one keyword and URL pair to analyze.');
        }
        return true;
    }

    _escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    _getContext(text, index, length) {
        const start = Math.max(0, index - 40);
        const end = Math.min(text.length, index + length + 40);
        const snippet = text.substring(start, end).trim();
        return `...${snippet}...`;
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
                doc: doc,
                body: doc.body,
                title: doc.title,
            };
        } catch (error) {
            throw new Error(`URL processing failed for ${url}: ${error.message}`);
        }
    }

    async run(inputData) {
        this.validateInput(inputData);

        const articles = inputData.articles;
        const articleUrls = articles.map(a => a.url);

        const articleContents = await Promise.allSettled(
            articleUrls.map(url => this._fetchUrlContent(url).then(content => ({ url, ...content, success: true })).catch(error => ({ url, error, success: false })))
        );

        const successfulFetches = articleContents.filter(r => r.status === 'fulfilled' && r.value.success).map(r => r.value);
        const failedFetches = articleContents.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success));

        const suggestions = [];
        const allFoundAnchors = {};

        for (const sourcePage of successfulFetches) {
            const cleanBody = sourcePage.body.cloneNode(true);
            const existingLinks = new Set(Array.from(cleanBody.querySelectorAll('a')).map(a => new URL(a.href, sourcePage.url).href));

            cleanBody.querySelectorAll('a').forEach(a => { a.outerHTML = a.innerHTML; });
            const textToScan = cleanBody.textContent || '';

            for (const target of articles) {
                const targetKeyword = target.keyword;
                const targetUrl = new URL(target.url).href;

                if (new URL(sourcePage.url).href === targetUrl) continue;
                if (existingLinks.has(targetUrl)) continue;

                const regex = new RegExp(`\\b${this._escapeRegex(targetKeyword)}\\b`, 'gi');
                let match;
                while ((match = regex.exec(textToScan)) !== null) {
                    const contextSnippet = this._getContext(textToScan, match.index, targetKeyword.length);
                    suggestions.push({
                        from: sourcePage.url,
                        to: target.url,
                        keyword: targetKeyword,
                        context: contextSnippet
                    });

                    if (!allFoundAnchors[target.url]) allFoundAnchors[target.url] = [];
                    allFoundAnchors[target.url].push(targetKeyword);
                }
            }
        }

        const diversityWarnings = Object.entries(allFoundAnchors)
            .map(([url, anchors]) => {
                const frequency = anchors.reduce((acc, anchor) => {
                    acc[anchor] = (acc[anchor] || 0) + 1;
                    return acc;
                }, {});
                const total = anchors.length;
                const dominantAnchor = Object.entries(frequency).find(([_, count]) => (count / total) > 0.7);
                if (total > 2 && dominantAnchor) {
                    return `Warning for ${url}: The anchor text "${dominantAnchor[0]}" is used in ${dominantAnchor[1]} of ${total} suggestions. Consider diversifying.`;
                }
                return null;
            }).filter(Boolean);

        return {
            success: true,
            results: {
                suggestions,
                warnings: diversityWarnings,
                errors: failedFetches.map(f => f.reason ? f.reason.message : (f.value && f.value.error ? f.value.error.message : 'Unknown fetch error'))
            }
        };
    }
}
