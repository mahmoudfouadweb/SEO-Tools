import { EventEmitter } from '/src/utils/EventEmitter.js';
import { CsvUtils } from '/src/utils/csvUtils.js';
import { KeywordManagerDashboard } from '/src/views/KeywordManagerDashboard.js';

export class UIManager extends EventEmitter {
    constructor(stateManager, toolManager) {
        super();
        this.stateManager = stateManager;
        this.toolManager = toolManager; // toolManager is now passed in
        this.views = {
            // Pass `this` (the UIManager instance) to the dashboard
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
                this.emit('event', { type: 'run-tool', payload: { toolId: 'keyword-extractor' } });
                return;
            }

            // Internal Linking Tool actions
            if (e.target.id === 'run-linking-btn') {
                this.emit('event', { type: 'run-tool', payload: { toolId: 'internal-linking' } });
                return;
            }

            // Export CSV button
            if (e.target.id === 'export-csv-btn') {
                this.emit('event', { type: 'export-csv' });
                return;
            }
            
            // Project Management UI actions
            if (e.target.id === 'create-first-project-btn') {
                 const projectName = document.getElementById('first-project-name').value.trim();
                if (projectName) {
                    this.emit('event', { type: 'create-project', payload: { projectName } });
                }
                return;
            }

            // Delegate to active view if it has a handler
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
            // Project Selector
            if (e.target.id === 'project-selector') {
                const projectId = e.target.value;
                this.emit('event', { type: 'set-active-project', payload: { projectId } });
            }

            // Keyword Extractor Tool settings
            if (e.target.matches('#extractor-input-type, #extractor-exclude-numbers')) {
                this.emit('event', { type: 'extractor-setting-changed' });
            }

            // Delegate to active view if it has a handler
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
            // No need for separate listener attachment here, main listener handles it.
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
                    break;
                case 'keyword-extractor':
                    this.renderKeywordExtractorView(toolContent, activeProject);
                    break;
                case 'internal-linking':
                    this.renderInternalLinkingView(toolContent, state); // Note: might need activeProject too
                    break;
                default:
                    toolContent.innerHTML = this.renderWelcome();
            }
        } catch (error) {
            console.error('Error rendering UI:', error);
            toolContent.innerHTML = `<div class="error-message">Error rendering UI: ${error.message}</div>`;
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
                <div id="extractor-urls-group" class="mb-2" style="display: ${toolState.inputType === 'sitemap' ? 'none' : 'block'};">
                    <textarea id="extractor-urls" class="w-full border p-2" rows="4" placeholder="Enter URLs, one per line..."></textarea>
                </div>
                <div id="extractor-sitemap-group" class="mb-2" style="display: ${toolState.inputType === 'sitemap' ? 'block' : 'none'};">
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

    showError(message) {
        // A more robust error display could be implemented here, e.g., a toast notification.
        alert(`Error: ${message}`);
    }
}
