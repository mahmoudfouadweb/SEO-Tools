- NLP Integration: The platform is designed to incorporate Natural Language Processing (NLP) enhancements. New NLP-powered tools can be added following the standard workflow, likely involving API calls to services like OpenAI or Google Cloud AI within the run method of a tool.
- React Migration: The strict separation of concerns is intentional. To migrate to React, only the UIManager.js and /views will need to be replaced with React components. The core logic in StateManager and ToolManager will remain largely unchanged.

---

## 5. Project Status & Development Roadmap

Instructions for AI Agent: Before starting any work, you MUST read this section to understand the project's current state. At the end of your session, you MUST update this section to reflect the work you have completed. Sections 1, 2, 3, and 4 of this document are the permanent constitution and MUST NOT be modified.

Current Phase: Keyword management features have been implemented. Awaiting manual testing of these new features before V1.0 completion.

### Roadmap Checklist:

Phase 1: Core Architecture & Foundation (V1.0)
- [x] Setup State-Driven UI Architecture (`App`, StateManager, `UIManager`)
- [x] Implement ToolManager and base Tool class
- [x] Implement InternalLinkingTool
- [x] Implement KeywordExtractorTool
- [x] Implement KeywordManagerDashboard view
- [x] Integrate all components and perform initial code review
- [x] Implement keyword editing, deletion, adding, and bulk import features
- [ ] CURRENT TASK: Perform manual end-to-end testing of the new keyword management features.

Phase 2: NLP-Powered Features (V1.1)
- [ ] Develop "Contextual Link Inserter" to replace static templates in InternalLinkingTool.
- [ ] Develop "Search Intent Analysis" tool for KeywordManagerDashboard.
- [ ] Develop "Entity Extraction" from article content.

Phase 3: Backend Integration (V2.0)
- [ ] Design database schema (e.g., for Projects, Users, Keywords).
- [ ] Create backend API endpoints for state management.
- [ ] Refactor StateManager to replace localStorage with API calls.

---

## 6. Project Cleanup Status

The following files and directories are obsolete and must be deleted to ensure a clean project structure before starting any new development work.

- index-oop.html
- script-oop.js
- script-oop.js.backup
- script-oop.js.new
- script-oop.js.obsolete
- test_dashboard.html
- test_dashboard.js
- test_internal_linking.js
- test_keyword_extractor.js
- legacy-version/ (entire directory)