/**
 * @file App.js
 * @description This application is built on a "State-Driven UI" architecture.
 *
 * ARCHITECTURAL RATIONALE FOR FUTURE REACT MIGRATION:
 * 1.  STATE-VIEW SEPARATION: All application data is held in a central 'StateManager'. The 'UIManager' is a "dumb" rendering layer that only visualizes the state.
 * 2.  UNI-DIRECTIONAL DATA FLOW: User actions in the UI create events. The App core handles these events, updates the state via the StateManager, and the StateManager then triggers a UI re-render.
 * 3.  MIGRATION PATH: To migrate to React, we will only need to replace the 'UIManager'. The React components will become the new view layer. The 'StateManager' and 'Tool' classes contain the core business logic and will require minimal to no changes, ensuring a smooth, predictable, and efficient migration.
 */

import { StateManager } from './managers/StateManager.js';
import { UIManager } from './managers/UIManager.js';
import { ToolManager } from './managers/ToolManager.js';

export class App {
    constructor() {
        this.stateManager = new StateManager();
        this.uiManager = new UIManager();
        this.toolManager = new ToolManager(this.stateManager);

        this.uiManager.on('event', this.handleUIEvent.bind(this));
        this.stateManager.on('stateChange', this.handleStateChange.bind(this));
    }

    async init() {
        await this.stateManager.loadState();
        this.uiManager.render(this.stateManager.getState());
    }

    handleUIEvent(event) {
        const { type, payload } = event;
        switch (type) {
            case 'open-project':
                this.stateManager.setActiveProject(payload.projectId);
                break;
            case 'toggle-theme':
                this.stateManager.toggleTheme();
                break;
            case 'run-tool':
                this.runTool(payload.toolId, payload.inputData);
                break;
            case 'update-keyword-intent':
                this.stateManager.updateKeywordIntent(payload.keywordId, payload.intent);
                break;
            case 'edit-keyword':
                this.handleEditKeyword(payload.keywordId);
                break;
            case 'delete-keyword':
                this.handleDeleteKeyword(payload.keywordId);
                break;
            case 'add-keywords':
                this.handleAddKeywords(payload.keywords);
                break;
            case 'bulk-import':
                this.handleBulkImport(payload.data);
                break;
            default:
                console.warn(`Unhandled UI event: ${type}`);
        }
    }

    async runTool(toolId, inputData) {
        try {
            const result = await this.toolManager.runTool(toolId, inputData);
            if (result.success) {
                this.stateManager.updateToolOutput(toolId, result.data);
            } else {
                console.error(`Tool ${toolId} failed:`, result.error);
                // TODO: Show error in UI
            }
        } catch (error) {
            console.error(`Error running tool ${toolId}:`, error);
            // TODO: Show error in UI
        }
    }

    handleStateChange(newState) {
        this.uiManager.render(newState);
    }

    handleEditKeyword(keyword) {
        this.stateManager.editKeyword(keyword);
    }

    handleDeleteKeyword(keywordId) {
        this.stateManager.deleteKeyword(keywordId);
    }

    handleAddKeywords(keywords) {
        keywords.forEach(keyword => this.stateManager.addKeyword(keyword));
    }

    handleBulkImport(data) {
        this.stateManager.bulkImportKeywords(data);
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.init().catch(console.error);
});
