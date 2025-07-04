import { EventEmitter } from '../utils/EventEmitter.js';

export class StateManager extends EventEmitter {
    constructor() {
        super();
        this.state = {
            currentProjectName: '',
            projectsList: [],
            allProjectsData: {},
            masterKeywords: [],
            activeToolState: {},
            activeProjectId: null,
            theme: 'light'
        };
        this.storageKey = 'seo-tools-platform-state';
    }

    async loadState() {
        const saved = localStorage.getItem(this.storageKey);
        if (saved) {
            this.state = JSON.parse(saved);
        } else {
            const defaultProject = { id: 'default', name: 'Default Project', pages: [] };
            this.state.projectsList = [defaultProject];
            this.state.activeProjectId = defaultProject.id;
            this.state.currentProjectName = defaultProject.name;
            this.saveState();
        }
        this.emit('stateChange', this.state);
    }

    saveState() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.state));
    }

    getState() {
        return this.state;
    }

    setActiveProject(projectId) {
        this.state.activeProjectId = projectId;
        const project = this.state.projectsList.find(p => p.id === projectId);
        this.state.currentProjectName = project ? project.name : '';
        this.saveState();
        this.emit('stateChange', this.state);
    }

    toggleTheme() {
        this.state.theme = this.state.theme === 'light' ? 'dark' : 'light';
        this.saveState();
        this.emit('stateChange', this.state);
    }

    updateKeywordIntent(keywordId, intent) {
        const keyword = this.state.masterKeywords.find(k => k.id === keywordId);
        if (keyword) {
            keyword.intent = intent;
            this.saveState();
            this.emit('stateChange', this.state);
        }
    }

    updateToolOutput(toolId, output) {
        this.state.activeToolState[toolId] = output;
        this.saveState();
        this.emit('stateChange', this.state);
    }

    addKeyword(keyword) {
        // Assign a unique ID if not provided
        if (!keyword.id) {
            keyword.id = `kw-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        }
        this.state.masterKeywords.push(keyword);
        this.saveState();
        this.emit('stateChange', this.state);
    }

    deleteKeyword(keywordId) {
        this.state.masterKeywords = this.state.masterKeywords.filter(k => k.id !== keywordId);
        this.saveState();
        this.emit('stateChange', this.state);
    }

    editKeyword(updatedKeyword) {
        const index = this.state.masterKeywords.findIndex(k => k.id === updatedKeyword.id);
        if (index !== -1) {
            this.state.masterKeywords[index] = { ...this.state.masterKeywords[index], ...updatedKeyword };
            this.saveState();
            this.emit('stateChange', this.state);
        }
    }

    bulkImportKeywords(keywords) {
        // Filter out duplicates based on a unique identifier (e.g., keyword text)
        const existingKeywords = new Set(this.state.masterKeywords.map(k => k.keyword.toLowerCase()));
        const newKeywords = keywords.filter(k => !existingKeywords.has(k.keyword.toLowerCase()));

        newKeywords.forEach(keyword => {
            if (!keyword.id) {
                keyword.id = `kw-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            }
        });

        this.state.masterKeywords = [...this.state.masterKeywords, ...newKeywords];
        this.saveState();
        this.emit('stateChange', this.state);
    }
}
