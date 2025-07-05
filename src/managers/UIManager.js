import { EventEmitter } from '/src/utils/EventEmitter.js';
import { CsvUtils } from '/src/utils/csvUtils.js';
import { KeywordManagerDashboard } from '/src/views/KeywordManagerDashboard.js';

export class UIManager extends EventEmitter {
    constructor(stateManager, toolManager) {
        super();
        this.stateManager = stateManager;
        this.toolManager = toolManager;
        this.views = {
            keywordManager: new KeywordManagerDashboard(this)
        };
        this.stateManager.on('state-change', this.handleStateChange.bind(this));
        this.attachEventListeners();
    }

    attachEventListeners() {
        document.addEventListener('click', (e) => {
            // Global tool selection
            if (e.target.matches('.tool-btn')) {
                const toolId = e.target.dataset.tool;
                this.emit('event', { type: 'select-tool', payload: toolId });
                return;
            }

            // Keyword Extractor Tool actions
            if (e.target.id === 'run-extractor-btn') {
                this.handleRunExtractor();
                return;
            }

            // Internal Linking Tool actions
            if (e.target.id === 'run-linking-btn') {
                this.handleRunLinking();
                return;
            }

            // Export CSV button
            if (e.target.id === 'export-csv-btn') {
                this.handleExportCsv();
                return;
            }

            // Delegate to active view if it has a handler
            const currentViewKey = this.stateManager.getState().currentTool;
            const currentView = this.views[currentViewKey];
            if (currentView && typeof currentView.handleClick === 'function') {
                currentView.handleClick(e);
            }
        });

        document.addEventListener('change', (e) => {
            // Keyword Extractor Tool settings
            if (e.target.matches('#extractor-input-type, #extractor-exclude-numbers')) {
                this.handleExtractorSettingChange();
            }

            // Delegate to active view if it has a handler
            const currentViewKey = this.stateManager.getState().currentTool;
            const currentView = this.views[currentViewKey];
            if (currentView && typeof currentView.handleChange === 'function') {
                currentView.handleChange(e);
            }
        });
    }

    handleRunExtractor() {
        const toolState = this.stateManager.getToolState('keyword-extractor') || {};
        const config = {
            inputType: document.getElementById('extractor-input-type').value,
            maxKeywordsPerUrl: parseInt(document.getElementById('extractor-max-keywords').value, 10),
            minKeywordLength: parseInt(document.getElementById('extractor-min-length').value, 10),
            excludeNumbers: document.getElementById('extractor-exclude-numbers').checked,
            manualExcludedWords: toolState.manualExcludedWords || []
        };

        let inputData = { config };
        if (config.inputType === 'sitemap') {
            inputData.sitemapUrl = document.getElementById('extractor-sitemap').value.trim();
        } else {
            inputData.urls = document.getElementById('extractor-urls').value.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
        }
        this.emit('event', { type: 'run-tool', payload: { toolId: 'keyword-extractor', inputData } });
    }

    handleExtractorSettingChange() {
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

        const excludeNumbers = document.getElementById('extractor-exclude-numbers')?.checked;
        if (excludeNumbers !== undefined) {
            this.emit('event', {
                type: 'update-tool-setting',
                payload: {
                    toolId: 'keyword-extractor',
                    settings: { excludeNumbers }
                }
            });
        }
    }

    handleRunLinking() {
        const lines = document.getElementById('linking-keywords').value.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
        const articles = lines.map(line => {
            const [keyword, url] = line.split(',');
            return keyword && url ? { keyword: keyword.trim(), url: url.trim() } : null;
        }).filter(Boolean);
        this.emit('event', { type: 'run-tool', payload: { toolId: 'internal-linking', inputData: { articles } } });
    }

    handleExportCsv() {
        const keywords = this.stateManager.getState().masterKeywords;
        if (keywords && keywords.length > 0) {
            const csvString = CsvUtils.formatCSV(keywords);
            CsvUtils.downloadCSV(csvString, `keywords-export-${new Date().toISOString().split('T')[0]}.csv`);
        }
    }

    handleStateChange(state) {
        this.render(state);
    }

    async render(state) {
        const toolContent = document.getElementById('tool-content');
        if (!toolContent) {
            console.error('Tool content element not found');
            return;
        }

        try {
            switch (state.currentTool) {
                case 'keyword-manager':
                    toolContent.innerHTML = this.views.keywordManager.render(state);
                    break;
                case 'keyword-extractor':
                    this.renderKeywordExtractorView(toolContent, state);
                    break;
                case 'internal-linking':
                    this.renderInternalLinkingView(toolContent, state);
                    break;
                default:
                    toolContent.innerHTML = this.renderWelcome();
            }
        } catch (error) {
            console.error('Error rendering UI:', error);
            toolContent.innerHTML = `
                <div class="error-message">
                    Error rendering UI: ${error.message}
                </div>
            `;
        }
    }

    renderKeywordExtractorView(toolContent, state) {
        const toolState = this.stateManager.getToolState('keyword-extractor') || {};
        const schema = this.toolManager.getTool('keyword-extractor').getConfigSchema().properties;

        toolContent.innerHTML = `
            <div class="p-4">
                <h2 class="font-bold text-lg mb-2">Keyword Extractor</h2>
                <p class="mb-2">Extract keywords from URLs or a sitemap.</p>
                <div class="mb-2">
                    <label class="font-semibold">Input Type:</label>
                    <select id="extractor-input-type" class="border p-1 rounded ml-2" name="inputType">
                        <option value="urls" ${toolState.inputType === 'urls' ? 'selected' : ''}>URLs (one per line)</option>
                        <option value="sitemap" ${toolState.inputType === 'sitemap' ? 'selected' : ''}>Sitemap.xml URL</option>
                    </select>
                </div>
                <div id="extractor-urls-group" class="mb-2">
                    <textarea id="extractor-urls" class="w-full border p-2" rows="4" placeholder="Enter URLs, one per line..."></textarea>
                </div>
                <div id="extractor-sitemap-group" class="mb-2" style="display:none;">
                    <input id="extractor-sitemap" class="w-full border p-2" placeholder="https://example.com/sitemap.xml"/>
                </div>
                <div class="mb-2 flex gap-4">
                    <div>
                        <label>Max Keywords/URL:</label>
                        <input id="extractor-max-keywords" type="number" min="1" max="50" value="${toolState.maxKeywordsPerUrl || schema.maxKeywordsPerUrl.default}" class="border p-1 rounded w-16 ml-1" />
                    </div>
                    <div>
                        <label>Min Keyword Length:</label>
                        <input id="extractor-min-length" type="number" min="2" max="20" value="${toolState.minKeywordLength || schema.minKeywordLength.default}" class="border p-1 rounded w-16 ml-1" />
                    </div>
                    <div>
                        <label><input id="extractor-exclude-numbers" name="excludeNumbers" type="checkbox" ${toolState.excludeNumbers !== false ? 'checked' : ''} class="mr-1" />Exclude numbers</label>
                    </div>
                </div>
                <button id="run-extractor-btn" class="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded">Extract</button>
                <div id="extractor-results" class="mt-4"></div>
            </div>
        `;
        this.handleExtractorSettingChange(); // Set initial visibility based on state
    }

    renderInternalLinkingView(toolContent, state) {
        toolContent.innerHTML = `
            <div class="p-4">
                <h2 class="font-bold text-lg mb-2">Internal Linking Tool</h2>
                <p class="mb-2">Add your keywords and URLs to analyze internal linking opportunities.</p>
                <textarea id="linking-keywords" class="w-full border p-2 mb-2" rows="4" placeholder="keyword, https://url.com\n..."></textarea>
                <button id="run-linking-btn" class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded">Analyze</button>
                <div id="linking-results" class="mt-4"></div>
            </div>
        `;
    }

    renderWelcome() {
        return `
            <div class="welcome-screen">
                <h1>Welcome to Internal Linking Tool</h1>
                <p>Select a tool from above to get started:</p>
                <ul>
                    <li><strong>Keyword Manager:</strong> Manage your target keywords and their search intent</li>
                    <li><strong>Keyword Extractor:</strong> Extract keywords from URLs or sitemap</li>
                    <li><strong>Internal Linking:</strong> Analyze and optimize internal linking</li>
                </ul>
            </div>
        `;
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        document.getElementById('tool-content').appendChild(errorDiv);
    }
}
