import { EventEmitter } from 
'/src/utils/EventEmitter.js';
import { CsvUtils } from 
'/src/utils/csvUtils.js';
import { KeywordManagerDashboard } from 
'/src/views/KeywordManagerDashboard.js';

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
        this.initErrorDisplay();
    }

    initErrorDisplay() {
        let errorDisplay = document.getElementById('error-display');
        if (!errorDisplay) {
            errorDisplay = document.createElement('div');
            errorDisplay.id = 'error-display';
            errorDisplay.className = 'fixed bottom-4 right-4 bg-red-600 text-white p-3 rounded shadow-lg hidden';
            document.body.appendChild(errorDisplay);
        }
        this.errorDisplay = errorDisplay;
    }

    attachEventListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.matches('.tool-btn')) {
                const toolId = e.target.dataset.tool;
                this.emit('event', { type: 'select-tool', payload: { toolId } });
                return;
            }

            if (e.target.id === 'run-extractor-btn') {
                const inputType = document.getElementById('extractor-input-type').value;
                const maxKeywordsPerUrl = parseInt(document.getElementById('extractor-max-keywords').value, 10);
                const minKeywordLength = parseInt(document.getElementById('extractor-min-length').value, 10);
                const excludeNumbers = document.getElementById('extractor-exclude-numbers').checked;
                
                let inputData = {
                    config: {
                        inputType,
                        maxKeywordsPerUrl,
                        minKeywordLength,
                        excludeNumbers
                    }
                };

                if (inputType === 'sitemap') {
                    const sitemapUrl = document.getElementById('extractor-sitemap').value.trim();
                    if (!sitemapUrl) {
                        this.showError('Sitemap URL cannot be empty.');
                        return;
                    }
                    inputData.sitemapUrl = sitemapUrl;
                } else {
                    const urls = document.getElementById('extractor-urls').value.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
                    if (urls.length === 0) {
                        this.showError('URLs cannot be empty.');
                        return;
                    }
                    inputData.urls = urls;
                }

                if (isNaN(maxKeywordsPerUrl) || maxKeywordsPerUrl < 1) {
                    this.showError('Max Keywords/URL must be a number greater than 0.');
                    return;
                }
                if (isNaN(minKeywordLength) || minKeywordLength < 1) {
                    this.showError('Min Keyword Length must be a number greater than 0.');
                    return;
                }

                this.emit('event', { type: 'run-tool', payload: { toolId: 'keyword-extractor', inputData } });
                return;
            }

            if (e.target.id === 'run-linking-btn') {
                const lines = document.getElementById('linking-keywords').value.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
                if (lines.length === 0) {
                    this.showError('Linking keywords/URLs cannot be empty.');
                    return;
                }
                const articles = lines.map(line => {
                    const [keyword, url] = line.split(',');
                    if (!keyword || !url) {
                        this.showError('Each line for internal linking must contain a keyword and a URL separated by a comma.');
                        return null;
                    }
                    return { keyword: keyword.trim(), url: url.trim() };
                }).filter(Boolean);

                if (articles.length === 0 && lines.length > 0) { // Some lines were invalid
                    return; // Error already shown by map function
                }

                this.emit('event', { type: 'run-tool', payload: { toolId: 'internal-linking', inputData: { articles } } });
                return;
            }

            if (e.target.id === 'export-csv-btn') {
                this.emit('event', { type: 'export-csv' });
                return;
            }
            
            if (e.target.id === 'create-first-project-btn') {
                 const projectName = document.getElementById('first-project-name').value.trim();
                if (!projectName) {
                    this.showError('Project name cannot be empty.');
                    return;
                }
                this.emit('event', { type: 'create-project', payload: { projectName } });
                return;
            }

            const activeProject = this.stateManager.getActiveProject();
            if (activeProject) {
                const currentViewKey = activeProject.currentTool;
                const currentView = this.views[currentViewKey];
                if (currentView && typeof currentView.handleClick === 'function') {
                    currentView.handleClick(e);
                }
            }
        });

        document.addEventListener('change', (e) => {
            if (e.target.id === 'project-selector') {
                const projectId = e.target.value;
                this.emit('event', { type: 'set-active-project', payload: { projectId } });
            }

            if (e.target.matches('#extractor-input-type, #extractor-exclude-numbers')) {
                const inputType = document.getElementById('extractor-input-type').value;
                const excludeNumbers = document.getElementById('extractor-exclude-numbers').checked;
                this.emit('event', { type: 'extractor-setting-changed', payload: { inputType, excludeNumbers } });
            }

            const activeProject = this.stateManager.getActiveProject();
            if (activeProject) {
                const currentViewKey = activeProject.currentTool;
                const currentView = this.views[currentViewKey];
                if (currentView && typeof currentView.handleChange === 'function') {
                    currentView.handleChange(e);
                }
            }
        });
    }

    handleStateChange(state) {
        this.render(state);
    }

    render(state) {
        const toolContent = document.getElementById('tool-content');
        if (!toolContent) {
            console.error('Tool content element not found');
            return;
        }

        const activeProject = this.stateManager.getActiveProject();
        const projectList = this.stateManager.getProjectList();

        this.renderProjectSelector(projectList, state.activeProjectId);

        if (projectList.length === 0) {
            toolContent.innerHTML = this.renderCreateFirstProject();
            return;
        }
        
        if (!activeProject) {
            toolContent.innerHTML = `<p class="p-8 text-center">Please select a project from the header to begin.</p>`;
            return;
        }

        try {
            switch (activeProject.currentTool) {
                case 'keyword-manager':
                    toolContent.innerHTML = this.views.keywordManager.render(activeProject);
                    this.updateExportButtonState(activeProject.masterKeywords);
                    break;
                case 'keyword-extractor':
                    this.renderKeywordExtractorView(toolContent, activeProject);
                    break;
                case 'internal-linking':
                    this.renderInternalLinkingView(toolContent, state);
                    break;
                default:
                    toolContent.innerHTML = this.renderWelcome();
            }
            this.hideError(); // Hide error on successful render
        } catch (error) {
            console.error('Error rendering UI:', error);
            this.showError(`Error rendering UI: ${error.message}`);
        }
    }

    renderKeywordExtractorView(toolContent, projectState) {
        const toolState = projectState.toolStates?.get('keyword-extractor') || {};
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
                <div id="extractor-urls-group" class="mb-2" style="display: ${toolState.inputType === 'sitemap' ? 'none' : 'block'};
">
                    <textarea id="extractor-urls" class="w-full border p-2" rows="4" placeholder="Enter URLs, one per line..."></textarea>
                </div>
                <div id="extractor-sitemap-group" class="mb-2" style="display: ${toolState.inputType === 'sitemap' ? 'block' : 'none'};
">
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
    }

    renderInternalLinkingView(toolContent, state) {
        toolContent.innerHTML = `
            <div class="p-4">
                <h2 class="font-bold text-lg mb-2">Internal Linking Tool</h2>
                <p class="mb-2">Paste the article content below to find linking opportunities based on your master keyword list.</p>
                <textarea id="linking-content" class="w-full border p-2 mb-2" rows="10" placeholder="Paste article content here..."></textarea>
                <textarea id="linking-keywords" class="w-full border p-2 mb-2" rows="5" placeholder="Enter keywords and URLs for linking, one per line (e.g., keyword,https://example.com/article)..."></textarea>
                <button id="run-linking-btn" class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded">Analyze</button>
                <div id="linking-results" class="mt-4"></div>
            </div>
        `;
    }

    renderWelcome() {
        return `
            <div class="p-8 text-center">
                <h1 class="text-2xl font-bold">Welcome to the SEO Tools Platform</h1>
                <p>Select a tool from the navigation bar above to get started.</p>
            </div>
        `;
    }
    
    renderProjectSelector(projects, activeProjectId) {
        const selector = document.getElementById('project-selector');
        if (!selector) return;

        selector.innerHTML = projects.map(p =>
            `<option value="${p.id}" ${p.id === activeProjectId ? 'selected' : ''}>${p.name}</option>`
        ).join('');
    }

    renderCreateFirstProject() {
        return `
            <div class="text-center p-8">
                <h2 class="text-2xl font-bold mb-4">Welcome!</h2>
                <p class="mb-4">Create your first project to get started.</p>
                <input type="text" id="first-project-name" class="border p-2 rounded w-full max-w-sm mb-4 dark:bg-gray-700" placeholder="My Awesome Website">
                <button id="create-first-project-btn" class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">Create Project</button>
            </div>
        `;
    }

    updateExportButtonState(keywords) {
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
    }

    showError(message) {
        this.errorDisplay.textContent = message;
        this.errorDisplay.classList.remove('hidden');
        // Optionally hide after some time
        setTimeout(() => {
            this.hideError();
        }, 5000);
    }

    hideError() {
        this.errorDisplay.classList.add('hidden');
        this.errorDisplay.textContent = '';
    }
}


