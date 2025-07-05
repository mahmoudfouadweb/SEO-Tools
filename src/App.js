import { StateManager } from './managers/StateManager.js';
import { UIManager } from './managers/UIManager.js';
import { ToolManager } from './managers/ToolManager.js';

export class App {
    constructor() {
        console.log('App.js: App constructor has been called.');
        this.stateManager = new StateManager();
        this.uiManager = new UIManager(this.stateManager);
        this.toolManager = new ToolManager(this.stateManager);
        
        // Handle events from UI Manager
        this.uiManager.on('event', this.handleUIEvent.bind(this));
    }

    async init() {
        try {
            // Initialize UI with current state
            await this.uiManager.render(this.stateManager.getState());
            return true;
        } catch (error) {
            console.error('Error initializing app:', error);
            throw error;
        }
    }

    async handleUIEvent(event) {
        console.log('Handling UI event:', event);
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

                case 'run-tool':
                    const result = await this.toolManager.runTool(
                        event.payload.toolId,
                        event.payload.inputData
                    );
                    // إذا كانت الأداة هي Keyword Extractor وتم الاستخراج بنجاح، أضف النتائج إلى مدير الكلمات
                    if (event.payload.toolId === 'keyword-extractor' && result.success && result.data && result.data.success) {
                        // results: [{url, keywords: [{keyword, ...}], ...}]
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
                    this.uiManager.emit('tool-result', result);
                    break;

                case 'select-tool':
                    this.stateManager.setCurrentTool(event.payload);
                    break;

                default:
                    console.warn('Unknown event type:', event.type);
            }
        } catch (error) {
            console.error('Error handling event:', error);
            this.uiManager.emit('error', error.message);
        }
    }
}

// Log when the script is loaded
console.log('App.js script loaded');
