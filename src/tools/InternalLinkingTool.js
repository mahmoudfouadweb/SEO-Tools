import { Tool } from './Tool.js';

export class InternalLinkingTool extends Tool {
    constructor(stateManager) {
        super(stateManager);
        this.name = 'Internal Linking Tool';
        this.id = 'internal-linking';
        this.description = 'Generate balanced internal links between articles while building topical authority clusters.';
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
                linkingStrategy: {
                    type: 'string',
                    enum: ['balanced', 'authority'],
                    default: 'balanced',
                    description: 'Strategy for generating internal links'
                },
                maxLinksPerArticle: {
                    type: 'number',
                    minimum: 1,
                    maximum: 50,
                    default: 10,
                    description: 'Maximum number of links per article'
                },
                minTopicalRelevance: {
                    type: 'number',
                    minimum: 0,
                    maximum: 1,
                    default: 0.3,
                    description: 'Minimum topical relevance score (0-1)'
                }
            },
            required: ['linkingStrategy', 'maxLinksPerArticle']
        };
    }

    _calculateTopicalRelevance(article1, article2) {
        const keywords1 = new Set(article1.keywords);
        const keywords2 = new Set(article2.keywords);
        const intersection = new Set([...keywords1].filter(x => keywords2.has(x)));
        const union = new Set([...keywords1, ...keywords2]);
        return intersection.size / union.size;
    }

    _generateTopicalClusters(articles) {
        const clusters = [];
        const unclustered = [...articles];

        while (unclustered.length > 0) {
            const seed = unclustered.shift();
            const cluster = [seed];

            for (let i = unclustered.length - 1; i >= 0; i--) {
                const article = unclustered[i];
                const relevance = this._calculateTopicalRelevance(seed, article);

                if (relevance >= this.config.minTopicalRelevance) {
                    cluster.push(article);
                    unclustered.splice(i, 1);
                }
            }

            clusters.push(cluster);
        }

        return clusters;
    }

    _calculateTopicalAuthorityScore(article, cluster) {
        const baseScore = (article.inboundLinks * 2) + (article.outboundLinks * 0.5);
        const clusterScore = cluster.reduce((score, clusterArticle) => {
            if (clusterArticle.id !== article.id) {
                const relevance = this._calculateTopicalRelevance(article, clusterArticle);
                return score + (relevance * 1.5);
            }
            return score;
        }, 0);

        return baseScore + clusterScore;
    }

    async _generateBalancedLinking(articles, config) {
        const clusters = this._generateTopicalClusters(articles);
        
        clusters.forEach(cluster => {
            cluster.forEach(article => {
                article.topicalAuthorityScore = this._calculateTopicalAuthorityScore(article, cluster);

                const potentialLinks = cluster
                    .filter(target => target.id !== article.id)
                    .sort((a, b) => {
                        const relevanceA = this._calculateTopicalRelevance(article, a);
                        const relevanceB = this._calculateTopicalRelevance(article, b);
                        return relevanceB - relevanceA;
                    })
                    .slice(0, config.maxLinksPerArticle);

                article.suggestedLinks = potentialLinks.map(target => ({
                    targetId: target.id,
                    targetTitle: target.title,
                    relevance: this._calculateTopicalRelevance(article, target),
                    authorityScore: target.topicalAuthorityScore
                }));
            });
        });

        return articles;
    }

    async _generateAuthorityLinking(articles, config) {
        const clusters = this._generateTopicalClusters(articles);
        
        clusters.forEach(cluster => {
            cluster.forEach(article => {
                article.topicalAuthorityScore = this._calculateTopicalAuthorityScore(article, cluster);
            });

            cluster.forEach(article => {
                const potentialLinks = cluster
                    .filter(target => target.id !== article.id)
                    .sort((a, b) => {
                        const scoreA = (a.topicalAuthorityScore * 0.7) + 
                                     (this._calculateTopicalRelevance(article, a) * 0.3);
                        const scoreB = (b.topicalAuthorityScore * 0.7) + 
                                     (this._calculateTopicalRelevance(article, b) * 0.3);
                        return scoreB - scoreA;
                    })
                    .slice(0, config.maxLinksPerArticle);

                article.suggestedLinks = potentialLinks.map(target => ({
                    targetId: target.id,
                    targetTitle: target.title,
                    relevance: this._calculateTopicalRelevance(article, target),
                    authorityScore: target.topicalAuthorityScore
                }));
            });
        });

        return articles;
    }

    async run(inputData) {
        try {
            const { articles, config = {} } = inputData;
            this.config = {
                ...this.getConfigSchema().properties,
                ...config
            };

            this.validateInput(inputData);

            const processedArticles = this.config.linkingStrategy === 'authority'
                ? await this._generateAuthorityLinking(articles, this.config)
                : await this._generateBalancedLinking(articles, this.config);

            return {
                success: true,
                articles: processedArticles,
                clusters: this._generateTopicalClusters(processedArticles),
                metadata: {
                    totalArticles: articles.length,
                    averageAuthorityScore: processedArticles.reduce((sum, article) => 
                        sum + article.topicalAuthorityScore, 0) / articles.length
                }
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    validateInput(inputData) {
        if (!Array.isArray(inputData.articles)) {
            throw new Error('Input must contain an array of articles');
        }

        if (inputData.articles.length === 0) {
            throw new Error('At least one article is required');
        }

        inputData.articles.forEach(article => {
            if (!article.id || !article.title || !Array.isArray(article.keywords)) {
                throw new Error('Each article must have an id, title, and keywords array');
            }
        });

        return true;
    }

    getInputTemplate() {
        return `
            <div class="tool-input">
                <div class="mb-4">
                    <label class="block text-sm font-medium mb-2">Linking Strategy</label>
                    <select name="linkingStrategy" class="w-full p-2 border rounded">
                        <option value="balanced">Balanced Distribution</option>
                        <option value="authority">Authority-Based</option>
                    </select>
                </div>
                <div class="mb-4">
                    <label class="block text-sm font-medium mb-2">Max Links per Article</label>
                    <input type="number" name="maxLinksPerArticle" 
                           min="1" max="50" value="10" 
                           class="w-full p-2 border rounded">
                </div>
                <div class="mb-4">
                    <label class="block text-sm font-medium mb-2">Min Topical Relevance</label>
                    <input type="range" name="minTopicalRelevance" 
                           min="0" max="1" step="0.1" value="0.3"
                           class="w-full">
                </div>
            </div>
        `;
    }
}
