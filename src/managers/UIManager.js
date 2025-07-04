import { EventEmitter } from '../utils/EventEmitter.js';
import { KeywordManagerDashboard } from '../views/KeywordManagerDashboard.js';
import { InternalLinkingTool } from '../tools/InternalLinkingTool.js';
import { KeywordExtractorTool } from '../tools/KeywordExtractorTool.js';

export class UIManager extends EventEmitter {
    constructor() {
        super();
        this.projectSelector = document.getElementById('project-selector');
        this.openProjectBtn = document.getElementById('open-project-btn');
        this.themeToggleBtn = document.getElementById('theme-toggle-btn');
        this.toolContent = document.getElementById('tool-content');
        this.toolButtons = document.querySelectorAll('.tool-btn');

        this.keywordManagerDashboard = new KeywordManagerDashboard(this);

        this.attachEventListeners();
    }

    attachEventListeners() {
        this.openProjectBtn.addEventListener('click', () => {
            const projectId = this.projectSelector.value;
            this.emit('event', { type: 'open-project', payload: { projectId } });
        });

        this.themeToggleBtn.addEventListener('click', () => {
            this.emit('event', { type: 'toggle-theme' });
        });

        this.toolButtons.forEach(button => {
            button.addEventListener('click', () => {
                const toolId = button.getAttribute('data-tool');
                this.renderTool(toolId);
            });
        });

        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('search-intent-select')) {
                const keywordId = e.target.getAttribute('data-keyword-id');
                const intent = e.target.value;
                this.emit('event', { type: 'update-keyword-intent', payload: { keywordId, intent } });
            }
        });

        window.addEventListener('editKeyword', (e) => {
            this.emit('event', { type: 'edit-keyword', payload: e.detail });
        });

        window.addEventListener('deleteKeyword', (e) => {
            this.emit('event', { type: 'delete-keyword', payload: e.detail });
        });

        window.addEventListener('addKeywords', (e) => {
            this.emit('event', { type: 'add-keywords', payload: e.detail });
        });

        window.addEventListener('bulkImport', (e) => {
            this.emit('event', { type: 'bulk-import', payload: e.detail });
        });
    }

    render(state) {
        this.renderProjectSelector(state.projectsList, state.activeProjectId);
        this.applyTheme(state.theme);
        if (this.currentToolId) {
            this.renderTool(this.currentToolId, state);
        }
    }

    renderProjectSelector(projects, activeProjectId) {
        this.projectSelector.innerHTML = '';
        projects.forEach(project => {
            const option = document.createElement('option');
            option.value = project.id;
            option.textContent = project.name;
            if (project.id === activeProjectId) option.selected = true;
            this.projectSelector.appendChild(option);
        });
    }

    applyTheme(theme) {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }

    renderTool(toolId, state) {
        this.currentToolId = toolId;
        switch (toolId) {
            case 'internal-linking':
                this.renderInternalLinkingTool(state);
                break;
            case 'keyword-extractor':
                this.renderKeywordExtractorTool(state);
                break;
            case 'keyword-manager':
                this.renderKeywordManager(state);
                break;
            default:
                this.toolContent.innerHTML = '<p>Tool not found.</p>';
        }
    }

    renderInternalLinkingTool(state) {
        const tool = new InternalLinkingTool();
        this.toolContent.innerHTML = tool.getInputTemplate();
        this.addRunButton(tool);
    }

    renderKeywordExtractorTool(state) {
        const tool = new KeywordExtractorTool();
        this.toolContent.innerHTML = tool.getInputTemplate();
        this.addRunButton(tool);
    }

    renderKeywordManager(state) {
        this.toolContent.innerHTML = this.keywordManagerDashboard.render(state);
    }

    addRunButton(tool) {
        const runBtn = document.createElement('button');
        runBtn.textContent = 'Run Tool';
        runBtn.className = 'mt-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded';
        this.toolContent.appendChild(runBtn);

        runBtn.addEventListener('click', () => {
            const inputData = this.collectInputData();
            this.emit('event', { type: 'run-tool', payload: { toolId: tool.getID(), inputData } });
        });
    }

    collectInputData() {
        const inputs = this.toolContent.querySelectorAll('input, select, textarea');
        const data = {};
        inputs.forEach(input => {
            if (input.type === 'checkbox') {
                data[input.name] = input.checked;
            } else if (input.tagName.toLowerCase() === 'textarea') {
                data[input.name] = input.value.split('\n').map(s => s.trim()).filter(Boolean);
            } else {
                data[input.name] = input.value;
            }
        });
        return data;
    }
}
