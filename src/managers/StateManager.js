import { EventEmitter } from '/src/utils/EventEmitter.js';

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

    createProject(name) {
        const project = {
            id: crypto.randomUUID(),
            name,
            createdAt: new Date().toISOString()
        };
        
        // Initialize empty project data
        const projectData = {
            toolStates: {},
            masterKeywords: []
        };
        
        // Save project data to localStorage
        localStorage.setItem(`project-${project.id}`, JSON.stringify(projectData));
        
        // Update meta info
        this.setState({
            projects: [...this.state.projects, project],
            activeProjectId: project.id,
            currentTool: 'keyword-manager'
        });
        
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
        this.setState({ activeProjectId: projectId });
    }

    deleteProject(projectId) {
        // Remove project data from localStorage
        localStorage.removeItem(`project-${projectId}`);
        
        const updatedProjects = this.state.projects.filter(p => p.id !== projectId);
        const updates = { projects: updatedProjects };
        
        // If we're deleting the active project, switch to another one
        if (this.state.activeProjectId === projectId) {
            updates.activeProjectId = updatedProjects.length > 0 ? updatedProjects[0].id : null;
        }
        
        // Update the state without persisting any project data
        this.state = {
            ...this.state,
            ...updates
        };
        
        // Persist meta info
        const meta = {
            projects: this.state.projects,
            activeProjectId: this.state.activeProjectId
        };
        localStorage.setItem('seo-platform-meta', JSON.stringify(meta));
        
        // Emit state change
        this.emit('state-change', this.state);
    }

    getState() {
        // Always get the current project's data from localStorage to ensure we have the latest version
        if (this.state.activeProjectId) {
            const currentProjectData = localStorage.getItem(`project-${this.state.activeProjectId}`);
            if (currentProjectData) {
                try {
                    const projectData = JSON.parse(currentProjectData);
                    return {
                        ...this.state,
                        masterKeywords: projectData.masterKeywords || [],
                        toolStates: new Map(Object.entries(projectData.toolStates || {}))
                    };
                } catch (e) {
                    // Invalid data, return current state
                }
            }
        }
        
        return this.state;
    }

    setState(newState) {
        // Extract just the meta fields (projects and activeProjectId) from newState
        const metaFields = {};
        if (newState.projects !== undefined) {
            metaFields.projects = newState.projects;
        }
        if (newState.activeProjectId !== undefined) {
            metaFields.activeProjectId = newState.activeProjectId;
        }
        
        // Create a new state object with just the meta fields
        const newStateCopy = {
            ...this.state,
            ...metaFields
        };
        
        // Save meta info
        const meta = {
            projects: newStateCopy.projects,
            activeProjectId: newStateCopy.activeProjectId
        };
        localStorage.setItem('seo-platform-meta', JSON.stringify(meta));
        
        // Update the state without touching project-specific data
        this.state = newStateCopy;
        this.emit('state-change', this.state);
    }

    addKeywords(keywords) {
        const activeProjectId = this.state.activeProjectId;
        if (!activeProjectId) {
            throw new Error('No active project');
        }

        // Get the current project's data from localStorage
        const currentProjectData = localStorage.getItem(`project-${activeProjectId}`);
        let projectData = { toolStates: {}, masterKeywords: [] };
        
        if (currentProjectData) {
            try {
                projectData = JSON.parse(currentProjectData);
            } catch (e) {
                // Invalid data, start fresh
            }
        }

        const newKeywords = keywords.map(k => ({
            id: crypto.randomUUID(),
            ...k,
            createdAt: new Date().toISOString()
        }));

        // Update only the active project's keywords
        const updatedProjectData = {
            toolStates: projectData.toolStates,
            masterKeywords: [...(projectData.masterKeywords || []), ...newKeywords]
        };

        localStorage.setItem(
            `project-${activeProjectId}`,
            JSON.stringify(updatedProjectData)
        );

        // Create a new state object with just the current project's keywords
        const currentState = this.getState();
        const newState = {
            ...currentState,
            masterKeywords: updatedProjectData.masterKeywords
        };
        
        // Update the state
        this.state = newState;
        this.emit('state-change', this.state);
        
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

        this.setState({ masterKeywords: updatedKeywords });
        
        return updatedKeywords[keywordIndex];
    }

    deleteKeyword(id) {
        const activeProject = this.getActiveProject();
        if (!activeProject) {
            throw new Error('No active project');
        }

        this.setState({
            masterKeywords: this.state.masterKeywords.filter(k => k.id !== id)
        });
    }

    setToolState(toolId, state) {
        const toolStates = new Map(this.state.toolStates);
        const currentState = toolStates.get(toolId) || {};
        // Merge new state with current state
        toolStates.set(toolId, {
            ...currentState,
            ...state
        });
        this.setState({ toolStates });
    }

    getToolState(toolId) {
        return this.state.toolStates.get(toolId);
    }

    setCurrentTool(toolId) {
        this.setState({ currentTool: toolId });
    }

    getActiveProjectId() {
        return this.state.activeProjectId;
    }
}
