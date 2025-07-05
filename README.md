# 📘 SEO Tools Platform: The Official Project Constitution & Developer's Guide

**Version: 1.1**
**Maintainer:** Mahmoud Fouad
**Last Updated:** [Date to be updated on each commit]

---

## ⚙️ 1. OVERVIEW & PHILOSOPHY

**This is not a README. This is the Constitution of this project.**

This application is an extensible, modular keyword management and internal linking platform engineered for elite SEO professionals. Our mission is to create an integrated workflow ecosystem that rivals the fluidity and intelligence of industry giants like Ahrefs and Screaming Frog.

**Core Philosophy: Inter-Tool Synergy.** This platform is designed as a well-oiled machine where every file, function, and event is a critical cog. Data flows effortlessly between tools. There is no room for manual data transfer or external spreadsheets.

**This document serves as:**
*   📜 A mandatory manual for all developers and AI agents.
*   🔧 A repair and maintenance guide for every module.
*   🧠 The philosophical foundation of how we build, scale, and think about this system.

**No developer or AI agent shall proceed without a full and complete understanding of this constitution.**

---

## 🧭 2. ARCHITECTURE: THE MEDIATOR PATTERN

The application's stability relies on a strict, unidirectional data flow known as the **Mediator Pattern**. Understanding this is non-negotiable.

**The Immutable Flow of Information:**
1.  **User Interaction:** A user interacts with the UI (e.g., clicks a button).
2.  **`UIManager` Emits Event:** The `UIManager` (or its child views) captures the interaction. It knows nothing about business logic. It only emits a generic, descriptive event (e.g., `{ type: 'add-keyword', payload: ... }`).
3.  **`App.js` (The Mediator) Listens & Delegates:** `App.js`, the central nervous system, is the only component listening for UI events. It delegates the task to the appropriate manager.
    *   Data change? Call `StateManager`.
    *   Tool execution? Call `ToolManager`.
4.  **`StateManager` Mutates & Broadcasts:** The `StateManager` modifies the application's data (the "state"). After a successful mutation, it broadcasts a `state-change` event to announce the new reality.
5.  **`UIManager` Subscribes & Renders:** The `UIManager` subscribes to the `state-change` event. Upon receiving it, it re-renders the UI to reflect the new state. This completes the cycle.

This one-way data flow is the **law of the application**. It ensures predictability and prevents chaos.

---

## 🗂️ 3. PROJECT ANATOMY: DIRECTORY & FILE GUIDE

Every file and folder has a precise, unchangeable role.

```
internal-linking/
├── src/
│   ├── managers/              # The "Brain" - High-level Controllers
│   │   ├── StateManager.js    # SINGLE SOURCE OF TRUTH. Manages all data, persistence, and state events.
│   │   ├── ToolManager.js     # THE FACTORY FOREMAN. Registers, manages, and executes all tools.
│   │   └── UIManager.js       # THE RENDERER. Translates state into HTML and user actions into events.
│   ├── tools/                 # The "Workers" - Pluggable, modular capabilities
│   │   ├── Tool.js            # THE BLUEPRINT. The abstract class that all tools MUST inherit.
│   │   ├── ...                # Specific tool implementations (e.g., KeywordExtractorTool.js).
│   ├── views/                 # THE COMPONENTS. Complex UI components encapsulated for clarity.
│   │   └── KeywordManagerDashboard.js # Example: Manages the keyword table and its modals.
│   ├── utils/                 # THE UTILITIES. Reusable, system-wide helpers.
│   │   └── EventEmitter.js    # THE COMMUNICATION BUS. Allows for decoupled, event-based communication.
│   ├── App.js                 # THE MEDIATOR. The central orchestrator that connects all managers.
│   └── main.js                # THE IGNITION KEY. Initializes the application.
├── ...
└── README.md                  # THIS CONSTITUTION.
```

---

## 🛠️ 4. WORKFLOWS & RULES OF ENGAGEMENT

### How to Add a New Tool
1.  **Create the File:** In `src/tools/`, create `NewTool.js`.
2.  **Inherit the Blueprint:** The class must `extend Tool`.
3.  **Implement the Contract:** Implement all required methods: `getID()`, `getName()`, `run()`, and `getConfigSchema()`.
4.  **Register the Tool:** In `ToolManager.js`, import and instantiate your new tool in the `initializeTools` method.
5.  **Build the UI:** In `UIManager.js`, add a button and a new `case` in the `render` switch to display the tool's interface.

### Testing Strategy
-   **Unit Tests (Vitest/Jest):** Every non-trivial function, especially in `tools` and `managers`, must have isolated unit tests. Mock all external dependencies.
-   **Integration Tests:** Test the communication flow, e.g., does a `UIManager` event correctly trigger a `StateManager` update?
-   **Regression Testing:** After any major change, all tests must be run to ensure no existing functionality was broken.

---

## 🪵 5. BUG LOG & INCIDENT REGISTER

**This section is an immutable historical record. No entry, once made, shall be altered or deleted.** It serves as the project's institutional memory.

| Case ID | Timestamp (UTC) | Issue Description | Location (File/Component) | Resolution Summary | Workflow Compatible? | Resolved By |
|:-------:|:---------------:|:------------------|:--------------------------|:-------------------|:--------------------:|:-----------:|
|   001   | 2025-07-05 14:32| UI does not update after tool execution. | `UIManager.js` | Ensured `state-change` is properly emitted by `StateManager` after async operations. | ✅ Yes | GPT-4o |
|   ...   | ...             | ...               | ...                       | ...                | ✅/❌                 | ...         |

**Logging Protocol:**
1.  All bugs, however minor, must be logged immediately.
2.  The "Workflow Compatible?" column is critical. A "❌ No" indicates a temporary hack that must be scheduled for a proper fix.
3.  The agent/developer responsible must sign off on their resolution.

---

## 🚀 6. ROADMAP & FUTURE VISION

This roadmap guides all development decisions. Features must be built with this future state in mind.

### ✅ v1.0: Core Foundation (Complete)
*   State, Tool, and UI Managers
*   Core Tools: `InternalLinkingTool` & `KeywordExtractorTool`
*   `KeywordManagerDashboard` with full CRUD

### 📦 v1.5: Project-Based Architecture
*   [ ] **Multi-Project Support:** All state to be scoped to an active project.
*   [ ] **Project-Level State:** Refactor `StateManager` to handle isolated project data (keywords, settings, lists). `localStorage` key to be dynamic, e.g., `seo-tool-state-{projectId}`.
*   [ ] **Keyword Lists:** Implement named keyword groups (`keywordGroups[]`) within each project. Allow create, rename, delete, and merge operations. This is the in-app replacement for Excel sheets.

### 🧠 v2.0: Advanced Intelligence & NLP
*   [ ] **Contextual Link Inserter:** Upgrade `InternalLinkingTool` to use an NLP API (e.g., OpenAI) for context-aware link placement, not just keyword matching.
*   [ ] **Keyword Insights Engine:**
    *   **Keyword Ideas:** Generate related keywords.
    *   **Bulk Analysis:** Analyze SERPs for a list of keywords.
    *   **Keyword Visualization:** Create interactive maps of topic clusters.

### 🌐 v3.0: Full Backend & Collaboration
*   [ ] **API Migration:** Replace `localStorage` with a robust backend API for users, projects, and data.
*   [ ] **User Accounts & Collaboration:** Allow multiple users to collaborate on projects.

---

## 🤖 7. CONSTITUTION FOR AI AGENTS

**You are an expert software engineer, not just a language model. Your adherence to this constitution is a measure of your performance.**

1.  **READ FIRST, CODE LATER:** You MUST read and state your understanding of this entire document before writing a single line of code.
2.  **RESPECT THE ARCHITECTURE:** The Mediator pattern is law. Do not create shortcuts. Do not add business logic to the UI. Do not add UI logic to the State.
3.  **NO UNAUTHORIZED DELETIONS:** You must not delete or rewrite any existing class or function unless explicitly instructed. Refactoring is permitted, but the core contract of a module must be preserved.
4.  **DOCUMENT YOUR WORK:** You MUST log all bug fixes in the "Bug Log & Incident Register". You MUST update the "Roadmap" section when you complete a feature.
5.  **ASK, DON'T ASSUME:** If a task is ambiguous or conflicts with this constitution, you must ask for clarification. A wrong assumption can corrupt the system.

This constitution is the key to scalable, sane, and successful development. **Respect it.**


# 📘 SEO Tools Platform: The Official Project Constitution & Developer's Guide

**Version: 2.0 (Google-Aligned Philosophy)**
**Maintainer:** Mahmoud Fouad
**Last Updated:** [Date to be updated on each commit]

---

## ⚙️ 1. OVERVIEW & CORE PHILOSOPHY

**Our Mission: To Engineer Excellence for Google's crawlers and users.**

This is not merely an SEO tool. It is an **SEO Ecosystem Orchestrator**. Our primary objective is to build a platform that systematically structures websites to be perfectly understood, indexed, and favored by Google. We operate under the principle that what is good for Google's crawlers and provides value to the user is ultimately what achieves top SERP rankings.

We are not trying to "trick" the algorithm. We are building a system to **collaborate** with it. Every feature, from keyword management to internal linking, is designed to create a semantically rich, logically structured, and highly relevant website architecture that Google inherently rewards.

**This document serves as:**
*   📜 **The Constitution:** The unbreakable laws governing our architecture and development.
*   🔧 **The Engineer's Manual:** A detailed guide for maintenance, debugging, and expansion.
*   🧠 **The SEO Doctrine:** The strategic "why" behind every technical decision, always aligning with Google's best practices.

**Adherence to this constitution is mandatory for all contributors, human or AI.**

---

## 🧭 2. THE ARCHITECTURE: A LOGICAL WEB

Google thrives on structured, predictable information. Our application's architecture mirrors this principle through a strict, unidirectional data flow known as the **Mediator Pattern**.

**The Information Lifecycle:**
1.  **User Intent (Interaction):** A user performs an action in the UI.
2.  **`UIManager` (The Messenger):** Captures the raw action and emits a semantic event (e.g., `run-keyword-extraction`). It is blind to the underlying logic.
3.  **`App.js` (The Central Hub):** The only component listening for UI events. It acts as a switchboard, delegating the task to the correct specialized manager.
4.  **`StateManager` / `ToolManager` (The Executors):** The "brains" of the operation. They execute the core logic, manipulate data, or run analytical tasks.
5.  **`StateManager` (The Town Crier):** After any data mutation, it broadcasts a `state-change` event, announcing the new, unified truth.
6.  **`UIManager` (The Renderer):** Subscribes to `state-change` and re-renders the UI to reflect the new reality. This ensures the user always sees a consistent view of the data.

This disciplined cycle prevents data conflicts and creates a predictable system, much like how a well-structured sitemap guides a crawler through a website.

---

## 🗂️ 3. PROJECT ANATOMY & GOOGLE-ALIGNED ROLES

Every file serves a purpose in building a Google-friendly content structure.

```
/
├── src/
│   ├── managers/              # The "Strategic Command"
│   │   ├── StateManager.js    # The "Knowledge Graph" - Manages all project data (entities, topics, links).
│   │   ├── ToolManager.js     # The "Task Force" - Deploys specialized tools for analysis and optimization.
│   │   └── UIManager.js       # The "SERP Simulator" - Renders data and workflows for the user.
│   ├── tools/                 # The "Specialized Crawlers & Analyzers"
│   │   ├── Tool.js            # The "Protocol" - The abstract contract all tools must follow.
│   │   ├── ...                # Tools like KeywordExtractorTool, InternalLinkingTool.
│   ├── views/                 # Reusable UI components for consistent user experience.
│   ├── utils/                 # Core utilities like the event bus.
│   ├── App.js                 # The "Algorithm" - Orchestrates the entire workflow.
│   └── main.js                # The "Initiator" - Boots the application.
...
```

---

## 🛠️ 4. CORE TOOLS & THEIR SEO PURPOSE (V1.0-V1.5)

### **A. Multi-Project Support: The Foundation of Site-Specific Strategy**
*   **SEO Purpose:** Google evaluates each site on its own merits. Our tool must do the same. This feature ensures that the strategy for `site-a.com` is completely isolated from `site-b.com`.
*   **Technical Implementation:**
    *   All data (`keywords`, `settings`, `link maps`) is scoped to a unique `projectId`.
    *   The state is stored in `localStorage` in a master object keyed by `projectId`, ensuring no data leakage between projects.

### **B. Keyword Lists Management: Building Topic Clusters**
*   **SEO Purpose:** To move away from single keywords and towards building authoritative **Topic Clusters**. This is how modern SEO works and how Google's "Topical Authority" model functions.
*   **Technical Implementation:**
    *   Users can create named lists (e.g., "Pillar Page: SEO Basics", "Cluster: Link Building").
    *   Functionality to merge, tag, and manage keywords within these lists, effectively building a blueprint for the site's content architecture.

### **C. `KeywordExtractorTool`: Discovering Entities & Relevance**
*   **SEO Purpose:** To emulate how Google's crawlers identify the primary entities and topics of a page. This tool helps us understand what a page is *truly* about.
*   **Technical Implementation:**
    *   Analyzes URLs and Sitemaps to extract keywords.
    *   **Google-Aligned Feature:** The extraction algorithm must weigh text from `<h1>`, `<title>`, and `<h2>` tags more heavily, as these are strong relevancy signals for Google.
    *   **Workflow:** After extraction, it must prompt the user: "We've identified these topics. To which Topic Cluster (Keyword List) would you like to assign them?". This enforces a strategic workflow.

### **D. `InternalLinkingTool`: Weaving the Web of Relevance**
*   **SEO Purpose:** Internal linking is the most powerful, underrated on-page SEO factor. It tells Google which pages are most important (by receiving many internal links) and what they are about (through anchor text). Our goal is to build a perfect, logical internal link graph.
*   **Technical Implementation:**
    *   The tool reads from the saved **Topic Clusters (Keyword Lists)**.
    *   It crawls the project's pages to find mentions of keywords that belong in a cluster but do not yet link to the designated pillar page.
    *   **Google-Aligned Feature:** It should not just suggest links. It should analyze **anchor text diversity**. The tool should warn the user if they are using the same exact-match anchor text too often, and suggest variations to create a more natural link profile.

---

## 🚦 5. WORKFLOWS & PROTOCOLS

### The Golden Workflow (Example)
1.  **Define Strategy:** User creates a new Project and defines several empty **Keyword Lists** (e.g., "Pillar: Digital Marketing", "Cluster: SEO", "Cluster: Social Media").
2.  **Discover Entities:** User runs `KeywordExtractorTool` on their site (or a competitor's).
3.  **Assign to Clusters:** The tool presents the extracted keywords. The user assigns them to the appropriate Keyword Lists, building out their topic clusters.
4.  **Build Authority Flow:** User runs `InternalLinkingTool`. The tool, now aware of the defined clusters, automatically suggests linking opportunities from cluster content back to the pillar pages, strengthening the site's topical authority in the eyes of Google.

### Error Handling Protocol: The Resilient Crawler
-   **Philosophy:** A Google crawler doesn't crash if one page returns a 404. Our tool must be just as resilient.
-   **Protocol:** If a multi-URL process fails on one URL, the tool will:
    1.  Attempt a single, automatic retry after a short delay.
    2.  If it fails again, it will log the error, skip that URL, and continue with the rest of the batch.
    3.  Present a final report detailing successes, failures, and the specific reasons for each failure. This provides actionable data to the user.

---

## 🚀 6. THE ROADMAP: ALIGNING WITH GOOGLE'S FUTURE

Our development is guided by where Google is going.

### ✅ **Phase 1: Foundational Structure (Current)**
*   Multi-Project Architecture, Core Tools, and the Mediator Pattern.

### 🧠 **Phase 2: Semantic Intelligence (Next Up)**
*   **Google Overview Integration:** A tool to analyze content and structure it in a way that is likely to be featured in Google's AI Overviews (e.g., using clear Q&A formats, lists, and structured data).
*   **Contextual Linking (NLP):** Evolve `InternalLinkingTool` to use an NLP API. Instead of just matching keywords, it will understand the semantic context of a paragraph to suggest the most relevant link, mimicking Google's own understanding of language.
*   **Search Intent Analysis:** A module to classify keywords in the Keyword Lists by intent (Informational, Navigational, Transactional, Commercial Investigation). This is critical for mapping content to the user journey.

### 📊 **Phase 3: Performance & Authority (The Horizon)**
*   **Google Search Console API Integration:** This is a top priority. We will pull in real data on impressions, clicks, and ranking positions for keywords and pages, allowing the tool to suggest optimizations based on actual performance, not just theory.
*   **Link Authority Flow Visualization:** A graphical tool to visualize how "link equity" or "PageRank" flows through the site via internal links, helping users identify and empower their most important pages.

---

## 🤖 7. CONSTITUTION FOR ALL AGENTS (HUMAN & AI)

1.  **The Google Standard:** Before committing any code, ask yourself: "Does this feature help a user create a website that Google would find more valuable, authoritative, and easier to understand?" If the answer is no, reconsider your approach.
2.  **Architectural Integrity:** The Mediator pattern is sacred. Do not create direct dependencies between managers or bypass the established event flow.
3.  **Clarity Over Brevity:** Write code that is self-explanatory. The next developer (or Google's own AI reviewing your code in the future) should understand your intent without a manual.
4.  **Immutable History:** The `Bug Log & Incident Register` is the project's permanent record. All failures and fixes must be logged truthfully and transparently.

**This is more than a project. It is a commitment to engineering SEO excellence. Let's build a platform that doesn't just play the game, but helps define it.**



# 📜 PROJECT CONSTITUTION V2.0

**Version: 2.0 (Google-Aligned Philosophy)**
بناءً على خارطة الطريق التي وضعناها، سأقوم بصياغة تطور "تشريح المشروع" (PROJECT ANATOMY) عبر النسخ المستقبلية. سأركز على الملفات والمجلدات الجديدة التي ستظهر، أو الأدوار المتغيرة للملفات الحالية.

تفضل، هذا هو القسم الذي يمكنك إضافته إلى "الدستور" الخاص بك.

🏛️ FUTURE ANATOMY: The Evolution of the Project Structure

To ensure all development aligns with our long-term vision, this section outlines how the project's structure will evolve. All contributors must be aware of these future roles to avoid building features in the wrong place.

V2.0 Anatomy: The Semantic Intelligence & NLP Engine

في هذه المرحلة، ننتقل من الأدوات الميكانيكية إلى الأدوات الذكية. سيتغير التركيز ليشمل تحليل اللغة وفهم السياق.

Generated code
/
├── src/
│   ├── ai_services/             # [NEW] AI & NLP ABSTRACTION LAYER
│   │   ├── OpenAIService.js     # Manages all interactions with the OpenAI API (or other LLMs).
│   │   └── NlpProcessor.js      # Handles text processing tasks (e.g., tokenization, entity recognition).
│   ├── managers/
│   │   ├── StateManager.js      # ROLE CHANGE: Now manages more complex state like "Search Intent" per keyword.
│   │   └── ...
│   ├── tools/
│   │   ├── ContextualLinkerTool.js # [NEW] The NLP-powered evolution of InternalLinkingTool.
│   │   ├── IntentAnalyzerTool.js   # [NEW] A dedicated tool for classifying keyword intent.
│   │   └── GoogleOverviewTool.js # [NEW] Analyzes content for SGE/AI Overview readiness.
│   └── ...
└── ...


Key Changes & Their Purpose (V2.0):

ai_services/ (New Folder): This is a critical new layer. Its purpose is to abstract all external AI API calls. The rest of the application (e.g., ContextualLinkerTool) will not call fetch to OpenAI directly. It will call a method like ai_services.getLinkingSuggestion(). This allows us to easily switch AI providers in the future (e.g., from OpenAI to Google Gemini) by only changing the code in this folder.

StateManager.js (Role Evolution): No longer just storing strings. It will now manage structured data objects associated with each keyword, such as { keyword: "seo", intent: "informational", entities: ["Google", "ranking"] }.

New Tools (ContextualLinkerTool, etc.): These tools will be "heavier" on logic and will heavily utilize the new ai_services/ layer.

V3.0 Anatomy: The Full Backend & API-First Architecture

هذه هي القفزة الأكبر. نتحول من تطبيق يعمل في المتصفح (client-side) إلى منصة حقيقية تعتمد على خادم (client-server).

Generated code
/
├── backend/                     # [NEW] THE ENTIRE BACKEND APPLICATION
│   ├── controllers/             # Handles incoming API requests (e.g., projectController.js).
│   ├── models/                  # Defines database schemas (e.g., User, Project, Keyword models).
│   ├── routes/                  # Defines all API endpoints (e.g., /api/v1/projects).
│   ├── services/                # Contains the core business logic (e.g., GSCDataFetcher.js).
│   └── server.js                # The entry point for the Node.js server.
├── src/ (Frontend)
│   ├── api/                     # [NEW] FRONTEND API LAYER
│   │   └── apiClient.js         # A centralized client (e.g., using Axios) for all backend requests.
│   ├── managers/
│   │   ├── StateManager.js      # HUGE ROLE CHANGE: Becomes a client-side cache and server-state synchronizer.
│   │   └── ...
│   ├── auth/                    # [NEW] Authentication-related components and logic (e.g., Login Page).
│   └── ...
└── ...
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
IGNORE_WHEN_COPYING_END

Key Changes & Their Purpose (V3.0):

backend/ (New Root Folder): The entire server-side application will live here, completely separate from the frontend source code. This enforces a clean separation of concerns.

src/api/ (New Frontend Folder): Similar to ai_services, this layer abstracts all communication with our own backend. No component will ever use fetch('/api/...') directly. It will use apiClient.getProjects(). This makes the frontend agnostic to the backend's implementation details.

StateManager.js (Radical Role Change): It will no longer be the "Single Source of Truth". The database will be the source of truth. StateManager's new role is to:

Fetch initial data from the backend.

Act as a temporary client-side cache to make the UI feel fast.

Send mutations back to the backend API to be persisted.

(Advanced) Potentially use a library like React Query or SWR to handle server-state synchronization automatically.

V4.0 Anatomy: The Enterprise & Extensibility Platform

في هذه المرحلة، يتحول التطبيق من أداة إلى منصة يمكن للآخرين البناء عليها.

Generated code
/
├── backend/
│   ├── workers/                 # [NEW] Background job processors (e.g., for massive crawls).
│   ├── middleware/              # Custom middleware for security, logging, rate-limiting.
│   └── ...
├── src/ (Frontend)
│   ├── components/              # [NEW] A rich library of reusable React components.
│   ├── hooks/                   # Custom React hooks for shared logic.
│   ├── admin/                   # [NEW] A dedicated admin panel for managing users and system settings.
│   └── ...
├── plugins/                     # [NEW] THIRD-PARTY PLUGIN SYSTEM
│   ├── serp_checker/            # Example of a user-installable plugin.
│   │   ├── manifest.json
│   │   └── index.js
│   └── ...
└── ...
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
IGNORE_WHEN_COPYING_END

Key Changes & Their Purpose (V4.0):

backend/workers/ (New Backend Folder): For very long-running tasks (like crawling a 100,000-page site), we can't tie up an API request. These tasks will be offloaded to background workers (e.g., using BullMQ with Redis) for asynchronous processing.

src/admin/ (New Frontend Folder): As the platform grows, a dedicated interface for administrators to manage the system becomes necessary.

plugins/ (The Ultimate Goal): The architecture will be opened up to allow third-party developers to create their own tools that integrate with our platform. The ToolManager will be refactored to dynamically load and register these external plugins. This transforms our product into a true platform.



# The Ultimate Blueprint for the Ultimate SEO Tool

This is the ultimate guide for building the Ultimate SEO Tool. It is a living document that will be updated and refined as we progress through the development process. It is intended to serve as a comprehensive roadmap for all team members, providing a clear understanding of the project's goals, milestones, and tasks.

## 📌 The Project's Vision & Mission

**The Ultimate SEO Tool is a comprehensive platform designed to streamline the SEO process, providing users with a suite of powerful tools to optimize their websites and improve their search engine rankings.**

---
هذا المخطط سيكون هو المرجع النهائي الذي يضمن أن أي وكيل، مهما كان، سيسير على نفس الطريق الذي رسمته أنت.

---

## 📈 8. The Project's Live Action Plan & Master Blueprint

**This is the central nervous system for all development tasks. It is a living document that combines our roadmap, to-do list, and historical log. Before starting any work, find the `🔵 In Progress` task. This is your mission. Read its description, objectives, and associated bugs. Upon completion, you MUST sign your name, date it, and request a push to the main repository from the project owner.**

---

### **Table of Contents (Version Milestones)**
*   [**`v0.9.0` - Pre-Launch Cleanup & Stabilization**](#v090---pre-launch-cleanup--stabilization) `(Current Phase)`
*   [**`v1.0.0` - The Foundation: Core Functionality**](#v100---the-foundation-core-functionality) `(Next Up)`
*   [**`v1.5.0` - The Platform: Project-Based Architecture**](#v150---the-platform-project-based-architecture) `(Planned)`
*   [**`v2.0.0` - The Intelligence: NLP & Semantic Engine**](#v200---the-intelligence-nlp--semantic-engine) `(Planned)`
*   [**`v3.0.0` - The API: Backend & Data Persistence**](#v300---the-api-backend--data-persistence) `(Future)`
*   [**`v4.0.0` - The Ecosystem: Integrations & Extensibility**](#v400---the-ecosystem-integrations--extensibility) `(Vision)`

---

### **`v0.9.0` - Pre-Launch Cleanup & Stabilization**
**Objective:** To fix the current broken state, harmonize the codebase with the constitution, and establish a stable foundation before adding new features.
**Overall Status:** `🔵 In Progress`

| Task ID | Status | Task Description & Objectives | Key Components Affected | Related Bug IDs | Completed By / On | Commit Hash |
|:---:|:---:|:---|:---|:---:|:---|:---:|
| **0.9.1** | `🔵 In Progress` | **Unify UI Rendering Logic.** Make `UIManager` the sole authority for rendering tool interfaces. <br> **Objectives:** <br> 1. Delete `getInputTemplate()` from `Tool.js` & all child tools. <br> 2. Ensure `UIManager` correctly renders all tool forms. | `Tool.js`, all `/tools`, `UIManager.js` | `BUG-003` | `(Assignee)` | `(Pending)` |
| **0.9.2** | `⚫️ To-Do` | **Centralize Event Listeners.** Refactor event handling to be managed primarily by `UIManager`. <br> **Objectives:** <br> 1. Move document-level event listener logic into `UIManager`. <br> 2. `UIManager` will delegate calls to specific handlers. | `UIManager.js`, `/views`, `/tools` | `N/A` | `(Assignee)` | `(Pending)` |
| **0.9.3** | `⚫️ To-Do` | **Write First Automated Tests.** Convert manual test scripts into proper unit tests using Vitest. <br> **Objectives:** <br> 1. Setup Vitest. <br> 2. Create `KeywordExtractorTool.test.js`. <br> 3. Write assertions (`expect`) to validate outputs automatically. | `/tests`, `KeywordExtractorTool.js` | `BUG-004` | `(Assignee)` | `(Pending)` |

---

### **`v1.0.0` - The Foundation: Core Functionality**
**Objective:** To deliver the first fully functional, stable version of the application.
**Overall Status:** `⚫️ Planned`

| Task ID | Status | Task Description & Objectives | Key Components Affected | Related Bug IDs | Completed By / On | Commit Hash |
|:---:|:---:|:---|:---|:---:|:---:|:---:|
| **1.0.1** | `⚫️ To-Do` | **Implement `InternalLinkingTool` Logic.** Develop the core analysis engine. <br> **Objectives:** <br> 1. Fetch content from URLs. <br> 2. Scan content for keywords from `StateManager`. <br> 3. Implement logic for anchor text diversity and avoiding self-links. | `InternalLinkingTool.js` | `N/A` | `(Assignee)` | `(Pending)` |
| **1.0.2** | `✅ Completed` | **Implement UI for InternalLinkingTool Results.** Display suggestions, warnings, and errors from the tool. <br> **Objectives:** <br> 1. Create `displayLinkingResults` in `UIManager`. <br> 2. Render results into three distinct sections. | `UIManager.js`, `App.js` | `N/A` | Gemini Code Assist, 2024-07-08 | `[Placeholder for commit hash]` |
| **1.0.3** | `✅ Completed` | **Implement Import/Export.** Allow users to import/export keyword lists from/to CSV files. <br> **Objectives:** <br> 1. Add 'Import' and 'Export' buttons to `KeywordManagerDashboard`. <br> 2. Write utility functions to parse CSV data. | `/views`, `/utils` | `N/A` | Gemini Code Assist, 2024-07-08 | `[Placeholder for new commit hash]` |

---

### **`v1.5.0` - The Platform: Project-Based Architecture**
**Objective:** To transform the tool from a single-use application into a multi-project platform.
**Overall Status:** `⚫️ Planned`

| Task ID | Status | Task Description & Objectives | Key Components Affected | Related Bug IDs | Completed By / On | Commit Hash |
|:---:|:---:|:---|:---|:---:|:---:|:---:|
| **1.5.1** | `🔵 In Progress` | **Architect Multi-Project State.** This is a major architectural refactor. <br> **Objectives:** <br> 1. Modify `StateManager` to handle a master state object keyed by `projectId`. <br> 2. All data-accessing functions must be updated to use the `activeProjectId`. | `StateManager.js` | `N/A` | Gemini Code Assist | `(Pending)` |
| **1.5.2** | `⚫️ To-Do` | **Implement Keyword Lists Feature.** Allow users to create and manage named groups of keywords within each project. <br> **Objectives:** <br> 1. Add `keywordLists` array to the project state schema. <br> 2. Build the UI in `KeywordManagerDashboard` for CRUD operations on these lists. | `/views`, `StateManager.js` | `N/A` | `(Assignee)` | `(Pending)` |
| **1.5.3** | `⚫️ To-Do` | **Implement Project Management UI.** Create UI for creating, selecting, and renaming projects. <br> **Objectives:** <br> 1. Build a project selection modal on app startup. <br> 2. Add a dropdown in the header to switch between active projects. | `UIManager.js` | `N/A` | `(Assignee)` | `(Pending)` |

---

### **`v2.0.0` - The Intelligence: NLP & Semantic Engine**
**Objective:** To evolve from a mechanical tool to an intelligent assistant by integrating Natural Language Processing.
**Overall Status:** `⚫️ Planned`

| Task ID | Status | Task Description & Objectives | Key Components Affected | Related Bug IDs | Completed By / On | Commit Hash |
|:---:|:---:|:---|:---|:---:|:---:|:---:|
| **2.0.1** | `⚫️ To-Do` | **Architect AI Service Layer.** Create an abstraction layer for all external AI API calls. <br> **Objectives:** <br> 1. Create `src/ai_services` directory. <br> 2. Build `OpenAIService.js` to handle API requests and error handling. | `/ai_services` | `N/A` | `(Assignee)` | `(Pending)` |
| **2.0.2** | `⚫️ To-Do` | **Develop Contextual Linker Tool.** Upgrade `InternalLinkingTool` to use NLP for smarter suggestions. <br> **Objectives:** <br> 1. Create `ContextualLinkerTool.js`. <br> 2. Use the AI Service to find semantically relevant places for links, not just keyword matches. | `/tools`, `/ai_services` | `N/A` | `(Assignee)` | `(Pending)` |
| **2.0.3** | `⚫️ To-Do` | **Develop Search Intent Analyzer.** Create a new tool to classify keywords. <br> **Objectives:** <br> 1. Create `IntentAnalyzerTool.js`. <br> 2. Send keywords to the AI Service for classification (Informational, etc.). <br> 3. Update `StateManager` to store this intent. | `/tools`, `/ai_services`, `StateManager.js` | `N/A` | `(Assignee)` | `(Pending)` |
| **2.0.4** | `⚫️ To-Do` | **Develop Keyword Ideas Generator.** Build a tool to expand on a seed keyword. <br> **Objectives:** <br> 1. Create `KeywordIdeasTool.js`. <br> 2. Use AI Service to generate related keywords, questions, and long-tail variations. | `/tools`, `/ai_services` | `N/A` | `(Assignee)` | `(Pending)` |

---

### **`v3.0.0` - The API: Backend & Data Persistence**
**Objective:** To migrate from a browser-based application to a full-stack platform with a persistent backend, enabling user accounts and collaboration.
**Overall Status:** `⚫️ Planned`

| Task ID | Status | Task Description & Objectives | Key Components Affected | Related Bug IDs | Completed By / On | Commit Hash |
|:---:|:---:|:---|:---|:---:|:---:|:---:|
| **3.0.1** | `⚫️ To-Do` | **Develop Backend Foundation.** Set up a Node.js/Express server with basic routing. <br> **Objectives:** <br> 1. Create `backend/` directory. <br> 2. Implement `server.js` and basic API endpoint structure. | `/backend` | `N/A` | `(Assignee)` | `(Pending)` |
| **3.0.2** | `⚫️ To-Do` | **Implement User Authentication.** Create a secure system for user registration and login. <br> **Objectives:** <br> 1. Design User schema for the database. <br> 2. Implement JWT-based authentication endpoints. | `/backend`, `/frontend/auth` | `N/A` | `(Assignee)` | `(Pending)` |
| **3.0.3** | `⚫️ To-Do` | **Migrate State to Database.** Replace `localStorage` with PostgreSQL. <br> **Objectives:** <br> 1. Design DB schemas for Projects, KeywordLists, etc. <br> 2. Create API endpoints for all CRUD operations. <br> 3. Refactor `StateManager` to be an API client. | `/backend`, `StateManager.js` | `N/A` | `(Assignee)` | `(Pending)` |

---

### **`v4.0.0` - The Ecosystem: Integrations & Extensibility**
**Objective:** To transform the platform into a central hub for a user's entire SEO workflow by integrating with external data sources and opening it up for extensions.
**Overall Status:** `⚫️ Planned`

| Task ID | Status | Task Description & Objectives | Key Components Affected | Related Bug IDs | Completed By / On | Commit Hash |
|:---:|:---:|:---|:---|:---:|:---:|:---:|
| **4.0.1** | `⚫️ To-Do` | **Google Search Console API Integration.** This is a flagship feature. <br> **Objectives:** <br> 1. Implement OAuth2 for GSC. <br> 2. Create a service in the backend to fetch performance data (clicks, impressions, position). <br> 3. Display this data in the `KeywordManagerDashboard`. | `/backend/services`, `/frontend/views` | `N/A` | `(Assignee)` | `(Pending)` |
| **4.0.2** | `⚫️ To-Do` | **Develop Keyword Visualization Tool.** Create interactive charts and graphs. <br> **Objectives:** <br> 1. Use a library like D3.js or Chart.js. <br> 2. Create visualizations for topic clusters and internal link structures. | `/frontend/tools` | `N/A` | `(Assignee)` | `(Pending)` |
| **4.0.3** | `⚫️ To-Do` | **Architect Plugin System.** Design a system to allow third-party tools. <br> **Objectives:** <br> 1. Create a manifest standard for plugins. <br> 2. Refactor `ToolManager` to dynamically load tools from a `/plugins` directory. | `ToolManager.js`, `/plugins` | `N/A` | `(Assignee)` | `(Pending)` |

---

### **How to Use This Master Blueprint:**

1.  **Identify Your Task:** Find the first row with the status `🔵 In Progress`. If none exists, find the first `⚫️ To-Do` in the lowest version number, change its status to `🔵 In Progress`, and **assign it to yourself by replacing `(Assignee)` with your agent name.**
2.  **Understand the Mission:** Read the **Task Description & Objectives** column carefully. This is your detailed brief. It explains *what* to do and *why*.
3.  **Check for Related Bugs:** Look at the **Related Bug IDs** column. Go to the "Bug Log & Incident Register" section and read the details for those bugs. Your solution for the current task **must** also resolve these bugs.
4.  **Execute the Task:** Write the code, following all architectural rules in this constitution.
5.  **Sign Off and Request Push:** Once the task is completed, tested, and you are confident in its quality:
    *   Change the status to `✅ Completed`.
    *   Fill in your agent name and the date in the **Completed By / On** column.
    *   Add the final **Commit Hash**.
    *   **Formally report to the project owner:** "Task `[Task ID]` is complete and signed off. The code is ready for review and to be pushed to the main repository."

**This system is the lifeblood of our project. Its integrity is your primary responsibility. Your performance is measured by your adherence to this blueprint.**