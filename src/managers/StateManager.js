import { EventEmitter } from '../utils/EventEmitter.js';

export class StateManager extends EventEmitter {
    constructor() {
        super();
        // تحميل الحالة من localStorage إذا وجدت
        const saved = localStorage.getItem('seo-tool-state');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // toolStates تحتاج تحويل من object إلى Map
                if (parsed.toolStates && !(parsed.toolStates instanceof Map)) {
                    parsed.toolStates = new Map(Object.entries(parsed.toolStates));
                }
                this.state = parsed;
            } catch (e) {
                this.state = {
                    masterKeywords: [],
                    currentTool: null,
                    toolStates: new Map()
                };
            }
        } else {
            this.state = {
                masterKeywords: [],
                currentTool: null,
                toolStates: new Map()
            };
        }
    }

    getState() {
        return this.state;
    }

    setState(newState) {
        this.state = { ...this.state, ...newState };
        // حفظ في localStorage
        const toSave = { ...this.state, toolStates: Object.fromEntries(this.state.toolStates) };
        localStorage.setItem('seo-tool-state', JSON.stringify(toSave));
        this.emit('state-change', this.state);
    }

    addKeywords(keywords) {
        const newKeywords = keywords.map(k => ({
            id: crypto.randomUUID(),
            ...k,
            createdAt: new Date().toISOString()
        }));

        this.setState({
            masterKeywords: [...this.state.masterKeywords, ...newKeywords]
        });

        return newKeywords;
    }

    updateKeyword(id, updates) {
        const index = this.state.masterKeywords.findIndex(k => k.id === id);
        if (index === -1) {
            throw new Error(`Keyword with id ${id} not found`);
        }

        const updatedKeywords = [...this.state.masterKeywords];
        updatedKeywords[index] = {
            ...updatedKeywords[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };

        this.setState({ masterKeywords: updatedKeywords });
        return updatedKeywords[index];
    }

    deleteKeyword(id) {
        const updatedKeywords = this.state.masterKeywords.filter(k => k.id !== id);
        this.setState({ masterKeywords: updatedKeywords });
    }

    setToolState(toolId, state) {
        const toolStates = new Map(this.state.toolStates);
        toolStates.set(toolId, state);
        this.setState({ toolStates });
    }

    getToolState(toolId) {
        return this.state.toolStates.get(toolId);
    }

    setCurrentTool(toolId) {
        this.setState({ currentTool: toolId });
    }
}
