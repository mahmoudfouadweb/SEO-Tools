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
        return true;
    }

    async run(inputData) {
        // For testing purposes, just return empty results
        return {
            success: true,
            articles: []
        };
    }
}
