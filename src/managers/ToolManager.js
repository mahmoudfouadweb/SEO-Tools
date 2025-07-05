import { KeywordExtractorTool } from '../tools/KeywordExtractorTool.js';
import { InternalLinkingTool } from '../tools/InternalLinkingTool.js';

export class ToolManager {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.tools = new Map();
        this.initializeTools();
    }

    initializeTools() {
        const tools = [
            new KeywordExtractorTool(this.stateManager),
            new InternalLinkingTool(this.stateManager)
        ];

        tools.forEach(tool => {
            this.tools.set(tool.getID(), tool);
        });
    }

    async runTool(toolId, inputData) {
        console.log(`Running tool ${toolId} with input:`, inputData);
        
        try {
            const tool = this.tools.get(toolId);
            if (!tool) {
                throw new Error(`Tool ${toolId} not found`);
            }

            // Validate input
            tool.validateInput(inputData);

            // Run the tool
            const result = await tool.run(inputData);

            return {
                success: true,
                data: result
            };
        } catch (error) {
            console.error(`Error running tool ${toolId}:`, error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    getTool(toolId) {
        return this.tools.get(toolId);
    }

    getTools() {
        return Array.from(this.tools.values());
    }
}
