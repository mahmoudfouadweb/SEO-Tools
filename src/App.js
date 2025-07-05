import { StateManager } from '/src/managers/StateManager.js';
import { UIManager } from '/src/managers/UIManager.js';
import { ToolManager } from '/src/managers/ToolManager.js';

export class App {
    constructor() {
        this.stateManager = new StateManager();
        this.toolManager = new ToolManager(this.stateManager);
        this.uiManager = new UIManager(this.stateManager, this.toolManager);
        // Handle events from UI Manager
        this.uiManager.on('event', this.handleUIEvent.bind(this));
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
            console.error('Error initializing app:', error);
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
                    // Gather input data from DOM based on toolId
                    let inputData = {};
                    if (event.payload.toolId === 'keyword-extractor') {
                        const toolState = this.stateManager.getToolState('keyword-extractor') || {};
                        const config = {
                            inputType: document.getElementById('extractor-input-type').value,
                            maxKeywordsPerUrl: parseInt(document.getElementById('extractor-max-keywords').value, 10),
                            minKeywordLength: parseInt(document.getElementById('extractor-min-length').value, 10),
                            excludeNumbers: document.getElementById('extractor-exclude-numbers').checked,
                            manualExcludedWords: toolState.manualExcludedWords || []
                        };
                        inputData.config = config;
                        if (config.inputType === 'sitemap') {
                            inputData.sitemapUrl = document.getElementById('extractor-sitemap').value.trim();
                        } else {
                            inputData.urls = document.getElementById('extractor-urls').value.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
                        }
                    } else if (event.payload.toolId === 'internal-linking') {
                        const lines = document.getElementById('linking-keywords').value.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
                        const articles = lines.map(line => {
                            const [keyword, url] = line.split(',');
                            return keyword && url ? { keyword: keyword.trim(), url: url.trim() } : null;
                        }).filter(Boolean);
                        inputData.articles = articles;
                    }
                    const result = await this.toolManager.runTool(
                        event.payload.toolId,
                        inputData
                    );
                    // If tool is Keyword Extractor and extraction was successful, add results to keyword manager
                    if (event.payload.toolId === 'keyword-extractor' && result.success && result.data && result.data.success) {
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
                }
                case 'extractor-setting-changed': {
                    // Handle extractor settings change and update tool state
                    const excludeNumbers = document.getElementById('extractor-exclude-numbers')?.checked;
                    if (excludeNumbers !== undefined) {
                        this.stateManager.setToolState('keyword-extractor', { excludeNumbers });
                    }
                    // Toggle input visibility
                    const inputTypeSelect = document.getElementById('extractor-input-type');
                    const urlsGroup = document.getElementById('extractor-urls-group');
                    const sitemapGroup = document.getElementById('extractor-sitemap-group');
                    if (inputTypeSelect && urlsGroup && sitemapGroup) {
                        if (inputTypeSelect.value === 'sitemap') {
                            sitemapGroup.style.display = '';
                            urlsGroup.style.display = 'none';
                        } else {
                            sitemapGroup.style.display = 'none';
                            urlsGroup.style.display = '';
                        }
                    }
                    break;
                }
                case 'export-csv': {
                    const activeProject = this.stateManager.getActiveProject();
                    const keywords = activeProject?.masterKeywords || [];
                    const exportBtn = document.getElementById('export-csv-btn');
                    if (exportBtn) {
                        if (!keywords || keywords.length === 0) {
                            exportBtn.disabled = true;
                            exportBtn.classList.add('bg-gray-400', 'cursor-not-allowed');
                            exportBtn.classList.remove('bg-teal-600', 'hover:bg-teal-700');
                        } else {
                            exportBtn.disabled = false;
                            exportBtn.classList.remove('bg-gray-400', 'cursor-not-allowed');
                            exportBtn.classList.add('bg-teal-600', 'hover:bg-teal-700');
                        }
                    }
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
                    // Update selected tool in state and re-render UI
                    this.stateManager.setCurrentTool(event.payload.toolId);
                    await this.uiManager.render(this.stateManager.getState());
                    break;
                }

                default:
                    console.warn('Unknown event type:', event.type);
            }
        } catch (error) {
            console.error('Error handling event:', error);
            this.uiManager.emit('error', error.message);
        }
    }
}
