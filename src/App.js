import { StateManager } from 
'/src/managers/StateManager.js';
import { UIManager } from 
'/src/managers/UIManager.js';
import { ToolManager } from 
'/src/managers/ToolManager.js';
import { CsvUtils } from 
'/src/utils/csvUtils.js';

export class App {
    constructor() {
        this.stateManager = new StateManager();
        this.toolManager = new ToolManager(this.stateManager);
        this.uiManager = new UIManager(this.stateManager, this.toolManager);
        // Handle events from UI Manager
        this.uiManager.on('event', this.handleUIEvent.bind(this));
        this.uiManager.on('tool-result', this.handleToolResult.bind(this));
        this.uiManager.on('error', this.handleUIError.bind(this));
    }

    async init() {
        try {
            // On first load, ensure a project exists.
            if (this.stateManager.getProjectList().length === 0) {
                // UIManager will render the "Create First Project" modal
            } else if (!this.stateManager.getActiveProjectId()) {
                // If projects exist but none are active, activate the first one.
                const firstProjectId = this.stateManager.getProjectList()[0].id;
                this.stateManager.setActiveProject(firstProjectId);
            }

            await this.uiManager.render(this.stateManager.getState());
            return true;
        } catch (error) {
            console.error('Error initializing application:', error);
            this.uiManager.showError(`Error initializing application: ${error.message}`);
            throw error;
        }
    }

    async handleUIEvent(event) {
        try {
            switch (event.type) {
                case 'add-keywords':
                    this.stateManager.addKeywords(event.payload.keywords);
                    break;

                case 'bulk-import':
                    this.stateManager.addKeywords(event.payload.keywords);
                    break;

                case 'edit-keyword':
                    this.stateManager.updateKeyword(event.payload.id, {
                        keyword: event.payload.keyword,
                        intent: event.payload.intent
                    });
                    break;

                case 'delete-keyword':
                    this.stateManager.deleteKeyword(event.payload);
                    break;

                case 'update-keyword-intent':
                    this.stateManager.updateKeyword(event.payload.id, {
                        intent: event.payload.intent
                    });
                    break;

                case 'run-tool': {
                    const result = await this.toolManager.runTool(
                        event.payload.toolId,
                        event.payload.inputData
                    );
                    this.uiManager.emit('tool-result', result);
                    break;
                }
                case 'extractor-setting-changed': {
                    this.stateManager.setToolState('keyword-extractor', event.payload);
                    break;
                }
                case 'export-csv': {
                    const activeProject = this.stateManager.getActiveProject();
                    const keywords = activeProject?.masterKeywords || [];
                    if (keywords && keywords.length > 0) {
                        const csvString = CsvUtils.formatCSV(keywords);
                        CsvUtils.downloadCSV(csvString, `keywords-export-${new Date().toISOString().split('T')[0]}.csv`);
                    }
                    break;
                }

                // Project Management Events
                case 'create-project':
                    this.stateManager.createProject(event.payload.projectName);
                    await this.uiManager.render(this.stateManager.getState());
                    break;

                case 'set-active-project':
                    this.stateManager.setActiveProject(event.payload.projectId);
                    break;

                case 'delete-project':
                    this.stateManager.deleteProject(event.payload.projectId);
                    break;

                case 'select-tool': {
                    this.stateManager.setCurrentTool(event.payload.toolId);
                    await this.uiManager.render(this.stateManager.getState());
                    break;
                }

                default:
                    console.warn('Unknown event type:', event.type);
            }
        } catch (error) {
            console.error('Error handling event:', error);
            this.uiManager.showError(`Error handling event: ${error.message}`);
        }
    }

    handleToolResult(result) {
        // If tool is Keyword Extractor and extraction was successful, add results to keyword manager
        if (result.toolId === 'keyword-extractor' && result.success && result.data && result.data.success) {
            const allKeywords = [];
            for (const res of result.data.results) {
                if (res.success && Array.isArray(res.keywords)) {
                    res.keywords.forEach(k => {
                        if (k.keyword) {
                            allKeywords.push({ keyword: k.keyword, url: res.url });
                        }
                    });
                }
            }
            if (allKeywords.length > 0) {
                this.stateManager.addKeywords(allKeywords);
            }
        }
        // UIManager will handle displaying the tool result to the user
    }

    handleUIError(message) {
        // Centralized error handling for UI-related errors, if needed.
        // For now, UIManager.showError directly handles it.
        console.error('UI Error:', message);
    }
}


