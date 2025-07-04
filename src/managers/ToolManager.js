import { InternalLinkingTool } from '../tools/InternalLinkingTool.js';
import { KeywordExtractorTool } from '../tools/KeywordExtractorTool.js';

export class ToolManager {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.tools = new Map();

        // Register tools
        this.registerTool(new InternalLinkingTool(stateManager));
        this.registerTool(new KeywordExtractorTool(stateManager));
    }

    registerTool(toolInstance) {
        this.tools.set(toolInstance.getID(), toolInstance);
    }

    async runTool(toolId, inputData) {
        const tool = this.tools.get(toolId);
        if (!tool) {
            return { success: false, error: `Tool with ID ${toolId} not found` };
        }

        try {
            const result = await tool.run(inputData);
            return {
                success: true,
                data: result
            };
        } catch (error) {
            return {
                success: false,
                error: error.message || 'Tool execution failed'
            };
        }
    }

    getTool(toolId) {
        return this.tools.get(toolId);
    }

    getRegisteredTools() {
        return Array.from(this.tools.values()).map(tool => ({
            id: tool.getID(),
            name: tool.getName(),
            description: tool.getDescription?.() || ''
        }));
    }
}
