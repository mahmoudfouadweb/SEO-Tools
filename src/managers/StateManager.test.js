import { describe, it, expect, beforeEach } from 'vitest';
import { StateManager } from './StateManager.js';

// Mock localStorage
const localStorageMock = (function () {
  let store = {};
  return {
    getItem(key) {
      return store[key] || null;
    },
    setItem(key, value) {
      store[key] = value.toString();
    },
    removeItem(key) {
      delete store[key];
    },
    clear() {
      store = {};
    },
    getAll() {
      return { ...store };
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('StateManager', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    window.localStorage.clear();
  });

  describe('createProject()', () => {
    it('should create a new project and store its data in localStorage', () => {
      const manager = new StateManager();
      const project = manager.createProject('Test Project');
      
      // Check that the project was created
      expect(project).toHaveProperty('id');
      expect(project).toHaveProperty('name', 'Test Project');
      
      // Check that the meta information was updated
      const meta = JSON.parse(window.localStorage.getItem('seo-platform-meta'));
      expect(meta).toHaveProperty('projects');
      expect(meta.projects).toHaveLength(1);
      expect(meta.projects[0].id).toBe(project.id);
      expect(meta.activeProjectId).toBe(project.id);
      
      // Check that the project-specific data was stored
      const projectData = JSON.parse(window.localStorage.getItem(`project-${project.id}`));
      expect(projectData).toHaveProperty('toolStates', {});
      expect(projectData).toHaveProperty('masterKeywords', []);
    });
  });

  describe('deleteProject()', () => {
    it('should delete a project and update meta information', () => {
      const manager = new StateManager();
      const project1 = manager.createProject('Project 1');
      const project2 = manager.createProject('Project 2');
      
      // Store some test data in project2's storage
      const project2Data = {
        toolStates: { testTool: { value: 42 } },
        masterKeywords: [{ id: 'kw1', keyword: 'test' }]
      };
      window.localStorage.setItem(`project-${project2.id}`, JSON.stringify(project2Data));
      
      // Delete project1
      manager.deleteProject(project1.id);
      
      // Check that project1's data was removed
      expect(window.localStorage.getItem(`project-${project1.id}`)).toBeNull();
      
      // Check that meta information was updated
      const meta = JSON.parse(window.localStorage.getItem('seo-platform-meta'));
      expect(meta.projects).toHaveLength(1);
      expect(meta.projects[0].id).toBe(project2.id);
      expect(meta.activeProjectId).toBe(project2.id);
      
      // Check that project2's data remains unchanged
      const storedProject2Data = JSON.parse(window.localStorage.getItem(`project-${project2.id}`));
      expect(storedProject2Data).toEqual(project2Data);
    });
    
    it('should switch active project when deleting the active one', () => {
      const manager = new StateManager();
      const project1 = manager.createProject('Project 1');
      const project2 = manager.createProject('Project 2');
      
      // Delete the active project (which should be project2 at this point)
      manager.deleteProject(project2.id);
      
      // Check that project1 is now active
      const meta = JSON.parse(window.localStorage.getItem('seo-platform-meta'));
      expect(meta.activeProjectId).toBe(project1.id);
    });
    
    it('should set activeProjectId to null when deleting the last project', () => {
      const manager = new StateManager();
      const project = manager.createProject('Project 1');
      
      manager.deleteProject(project.id);
      
      // Check that no active project exists
      const meta = JSON.parse(window.localStorage.getItem('seo-platform-meta'));
      expect(meta.activeProjectId).toBeNull();
    });
  });

  describe('setActiveProject()', () => {
    it('should update the activeProjectId in meta information', () => {
      const manager = new StateManager();
      const project1 = manager.createProject('Project 1');
      const project2 = manager.createProject('Project 2');
      
      // Set project2 as active
      manager.setActiveProject(project2.id);
      
      // Check that activeProjectId was updated
      const meta = JSON.parse(window.localStorage.getItem('seo-platform-meta'));
      expect(meta.activeProjectId).toBe(project2.id);
      
      // Set project1 as active
      manager.setActiveProject(project1.id);
      
      // Check that activeProjectId was updated again
      const updatedMeta = JSON.parse(window.localStorage.getItem('seo-platform-meta'));
      expect(updatedMeta.activeProjectId).toBe(project1.id);
    });
    
    it('should throw an error when trying to set a non-existent project as active', () => {
      const manager = new StateManager();
      const project = manager.createProject('Project 1');
      
      // Try to set a non-existent project as active
      expect(() => manager.setActiveProject('non-existent-id')).toThrowError();
    });
  });

  describe('Data Modification (addKeywords)', () => {
    it('should modify keywords only for the active project', () => {
      const manager = new StateManager();
      
      // Create project A and add keywords
      const projectA = manager.createProject('Project A');
      window.localStorage.setItem(`project-${projectA.id}`, JSON.stringify({
        toolStates: {},
        masterKeywords: []
      }));
      manager.setActiveProject(projectA.id);
      manager.addKeywords([{ keyword: 'test1' }]);
      
      // Create project B and add different keywords
      const projectB = manager.createProject('Project B');
      window.localStorage.setItem(`project-${projectB.id}`, JSON.stringify({
        toolStates: {},
        masterKeywords: []
      }));
      manager.setActiveProject(projectB.id);
      manager.addKeywords([{ keyword: 'test2' }]);
      
      // Check project A's data
      const projectAData = JSON.parse(window.localStorage.getItem(`project-${projectA.id}`));
      expect(projectAData.masterKeywords).toHaveLength(1);
      expect(projectAData.masterKeywords[0]).toHaveProperty('keyword', 'test1');
      
      // Check project B's data
      const projectBData = JSON.parse(window.localStorage.getItem(`project-${projectB.id}`));
      expect(projectBData.masterKeywords).toHaveLength(1);
      expect(projectBData.masterKeywords[0]).toHaveProperty('keyword', 'test2');
    });
  });

  describe('Constructor', () => {
    it('should correctly load pre-populated localStorage data', () => {
      // Pre-populate localStorage with test data
      const project1Id = 'proj_123';
      const project2Id = 'proj_456';
      
      // Set meta information
      const meta = {
        projects: [
          { id: project1Id, name: 'Project 1', createdAt: '2023-07-01T00:00:00Z' },
          { id: project2Id, name: 'Project 2', createdAt: '2023-07-02T00:00:00Z' }
        ],
        activeProjectId: project2Id
      };
      window.localStorage.setItem('seo-platform-meta', JSON.stringify(meta));
      
      // Set project 1 data
      const project1Data = {
        toolStates: { testTool: { value: 42 } },
        masterKeywords: [{ id: 'kw1', keyword: 'project1' }]
      };
      window.localStorage.setItem(`project-${project1Id}`, JSON.stringify(project1Data));
      
      // Set project 2 data
      const project2Data = {
        toolStates: { anotherTool: { count: 5 } },
        masterKeywords: [{ id: 'kw2', keyword: 'project2' }]
      };
      window.localStorage.setItem(`project-${project2Id}`, JSON.stringify(project2Data));
      
      // Create StateManager instance
      const manager = new StateManager();
      
      // Check that active project was loaded correctly
      expect(manager.getActiveProjectId()).toBe(project2Id);
      
      // Check that project data was loaded correctly
      const state = manager.getState();
      expect(state.masterKeywords).toEqual(project2Data.masterKeywords);
      expect(Object.fromEntries(state.toolStates)).toEqual(project2Data.toolStates);
      
      // Check that all projects are available
      expect(state.projects).toHaveLength(2);
      expect(state.projects[0].id).toBe(project1Id);
      expect(state.projects[1].id).toBe(project2Id);
    });
  });
});