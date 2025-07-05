import { EventEmitter } from 
'/src/utils/EventEmitter.js';

export class StateManager extends EventEmitter {
    constructor() {
        super();
        
        // Read meta information first
        const meta = localStorage.getItem('seo-platform-meta');
        let projects = [];
        let activeProjectId = null;
        
        if (meta) {
            try {
                const parsedMeta = JSON.parse(meta);
                projects = parsedMeta.projects || [];
                activeProjectId = parsedMeta.activeProjectId || null;
            } catch (e) {
                // Invalid meta data, initialize defaults
            }
        }

        // Load active project's data
        let projectData = {};
        if (activeProjectId) {
            const projectState = localStorage.getItem(`project-${activeProjectId}`);
            if (projectState) {
                try {
                    projectData = JSON.parse(projectState);
                } catch (e) {
                    // Invalid project data, leave empty
                }
            }
        }

        // Initialize state with meta and project data
        this.state = {
            projects,
            activeProjectId,
            currentTool: null,
            toolStates: new Map(Object.entries(projectData.toolStates || {})),
            masterKeywords: projectData.masterKeywords || []
        };
    }

    _saveMeta() {
        const meta = {
            projects: this.state.projects,
            activeProjectId: this.state.activeProjectId
        };
        localStorage.setItem('seo-platform-meta', JSON.stringify(meta));
    }

    _saveProjectData(projectId, data) {
        localStorage.setItem(`project-${projectId}`, JSON.stringify(data));
    }

    _loadProjectData(projectId) {
        const projectState = localStorage.getItem(`project-${projectId}`);
        if (projectState) {
            try {
                return JSON.parse(projectState);
            } catch (e) {
                console.error(`Error parsing project data for ${projectId}:`, e);
            }
        }
        return { toolStates: {}, masterKeywords: [] };
    }

    createProject(name) {
        const project = {
            id: crypto.randomUUID(),
            name,
            createdAt: new Date().toISOString()
        };
        
        const projectData = {
            toolStates: {},
            masterKeywords: []
        };
        
        this._saveProjectData(project.id, projectData);
        
        this.state.projects = [...this.state.projects, project];
        this.state.activeProjectId = project.id;
        this.state.currentTool = 'keyword-manager';
        this.state.masterKeywords = projectData.masterKeywords;
        this.state.toolStates = new Map(Object.entries(projectData.toolStates));

        this._saveMeta();
        this.emit('state-change', this.state);
        
        return project;
    }

    getProjectList() {
        return this.state.projects;
    }

    getActiveProject() {
        if (!this.state.activeProjectId) return null;
        return this.state.projects.find(p => p.id === this.state.activeProjectId);
    }

    setActiveProject(projectId) {
        if (!this.state.projects.some(p => p.id === projectId)) {
            throw new Error(`Project with id ${projectId} not found`);
        }
        this.state.activeProjectId = projectId;
        const projectData = this._loadProjectData(projectId);
        this.state.masterKeywords = projectData.masterKeywords;
        this.state.toolStates = new Map(Object.entries(projectData.toolStates));

        this._saveMeta();
        this.emit('state-change', this.state);
    }

    deleteProject(projectId) {
        localStorage.removeItem(`project-${projectId}`);
        
        const updatedProjects = this.state.projects.filter(p => p.id !== projectId);
        this.state.projects = updatedProjects;
        
        if (this.state.activeProjectId === projectId) {
            this.state.activeProjectId = updatedProjects.length > 0 ? updatedProjects[0].id : null;
            if (this.state.activeProjectId) {
                const newActiveProjectData = this._loadProjectData(this.state.activeProjectId);
                this.state.masterKeywords = newActiveProjectData.masterKeywords;
                this.state.toolStates = new Map(Object.entries(newActiveProjectData.toolStates));
            } else {
                this.state.masterKeywords = [];
                this.state.toolStates = new Map();
            }
        }
        
        this._saveMeta();
        this.emit('state-change', this.state);
    }

    getState() {
        return this.state;
    }

    _updateStateAndPersist(updates) {
        // Apply updates to the current state
        Object.assign(this.state, updates);

        // Persist meta data if projects or activeProjectId changed
        if (updates.projects !== undefined || updates.activeProjectId !== undefined) {
            this._saveMeta();
        }

        // Persist active project data if masterKeywords or toolStates changed
        if (this.state.activeProjectId && (updates.masterKeywords !== undefined || updates.toolStates !== undefined)) {
            const projectData = {
                masterKeywords: this.state.masterKeywords,
                toolStates: Object.fromEntries(this.state.toolStates)
            };
            this._saveProjectData(this.state.activeProjectId, projectData);
        }
        
        this.emit('state-change', this.state);
    }

    addKeywords(keywords) {
        const activeProjectId = this.state.activeProjectId;
        if (!activeProjectId) {
            throw new Error('No active project');
        }

        const newKeywords = keywords.map(k => ({
            id: crypto.randomUUID(),
            ...k,
            createdAt: new Date().toISOString()
        }));

        this._updateStateAndPersist({
            masterKeywords: [...this.state.masterKeywords, ...newKeywords]
        });
        
        return newKeywords;
    }

    updateKeyword(id, updates) {
        const activeProject = this.getActiveProject();
        if (!activeProject) {
            throw new Error('No active project');
        }

        const keywordIndex = this.state.masterKeywords.findIndex(k => k.id === id);
        if (keywordIndex === -1) {
            throw new Error(`Keyword with id ${id} not found`);
        }

        const updatedKeywords = [...this.state.masterKeywords];
        updatedKeywords[keywordIndex] = {
            ...updatedKeywords[keywordIndex],
            ...updates,
            updatedAt: new Date().toISOString()
        };

        this._updateStateAndPersist({ masterKeywords: updatedKeywords });
        
        return updatedKeywords[keywordIndex];
    }

    deleteKeyword(id) {
        const activeProject = this.getActiveProject();
        if (!activeProject) {
            throw new Error('No active project');
        }

        this._updateStateAndPersist({
            masterKeywords: this.state.masterKeywords.filter(k => k.id !== id)
        });
    }

    setToolState(toolId, state) {
        const toolStates = new Map(this.state.toolStates);
        const currentState = toolStates.get(toolId) || {};
        toolStates.set(toolId, {
            ...currentState,
            ...state
        });
        this._updateStateAndPersist({ toolStates });
    }

    getToolState(toolId) {
        return this.state.toolStates.get(toolId);
    }

    setCurrentTool(toolId) {
        this._updateStateAndPersist({ currentTool: toolId });
    }

    getActiveProjectId() {
        return this.state.activeProjectId;
    }
}

