import { EventEmitter } from '../utils/EventEmitter.js';
import { KeywordManagerDashboard } from '../views/KeywordManagerDashboard.js';

export class UIManager extends EventEmitter {
    constructor(stateManager) {
        super();
        console.log('UIManager.js: UIManager constructor has been called.');
        this.stateManager = stateManager;
        this.views = {
            keywordManager: new KeywordManagerDashboard(this)
        };
        
        // Listen for state changes
        this.stateManager.on('state-change', this.handleStateChange.bind(this));
        
        // Attach event listeners
        this.attachEventListeners();
    }

    attachEventListeners() {
        console.log('UIManager attachEventListeners called');
        document.addEventListener('click', (e) => {
            if (e.target.matches('.tool-btn')) {
                const toolId = e.target.dataset.tool;
                this.emit('event', { type: 'select-tool', payload: toolId });
            }
        });
    }

    handleStateChange(state) {
        this.render(state);
    }

    async render(state) {
        console.log('UIManager render called with state:', state);
        const toolContent = document.getElementById('tool-content');
        if (!toolContent) {
            console.error('Tool content element not found');
            return;
        }

        try {
            switch (state.currentTool) {
                case 'keyword-manager':
                    toolContent.innerHTML = this.views.keywordManager.render(state);
                    break;
                case 'keyword-extractor':
                    this.renderKeywordExtractorView(toolContent, state);
                    break;
                case 'internal-linking':
                    this.renderInternalLinkingView(toolContent, state);
                    break;
                default:
                    toolContent.innerHTML = this.renderWelcome();
            }
        } catch (error) {
            console.error('Error rendering UI:', error);
            toolContent.innerHTML = `
                <div class="error-message">
                    Error rendering UI: ${error.message}
                </div>
            `;
        }
    }

    renderKeywordExtractorView(toolContent, state) {
        // واجهة متقدمة لاستخراج الكلمات المفتاحية
        toolContent.innerHTML = `
            <div class="p-4">
                <h2 class="font-bold text-lg mb-2">Keyword Extractor</h2>
                <p class="mb-2">Extract keywords from URLs or a sitemap.</p>
                <div class="mb-2">
                    <label class="font-semibold">Input Type:</label>
                    <select id="extractor-input-type" class="border p-1 rounded ml-2">
                        <option value="urls">URLs (one per line)</option>
                        <option value="sitemap">Sitemap.xml URL</option>
                    </select>
                </div>
                <div id="extractor-urls-group" class="mb-2">
                    <textarea id="extractor-urls" class="w-full border p-2" rows="4" placeholder="Enter URLs, one per line..."></textarea>
                </div>
                <div id="extractor-sitemap-group" class="mb-2" style="display:none;">
                    <input id="extractor-sitemap" class="w-full border p-2" placeholder="https://example.com/sitemap.xml" />
                </div>
                <div class="mb-2 flex gap-4">
                    <div>
                        <label>Max Keywords/URL:</label>
                        <input id="extractor-max-keywords" type="number" min="1" max="50" value="10" class="border p-1 rounded w-16 ml-1" />
                    </div>
                    <div>
                        <label>Min Keyword Length:</label>
                        <input id="extractor-min-length" type="number" min="2" max="20" value="3" class="border p-1 rounded w-16 ml-1" />
                    </div>
                    <div>
                        <label><input id="extractor-exclude-common" type="checkbox" checked class="mr-1" />Exclude common words</label>
                    </div>
                </div>
                <button id="run-extractor-btn" class="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded">Extract</button>
                <div id="extractor-results" class="mt-4"></div>
            </div>
        `;
        // منطق إظهار/إخفاء الحقول حسب نوع الإدخال
        const inputTypeSelect = toolContent.querySelector('#extractor-input-type');
        const urlsGroup = toolContent.querySelector('#extractor-urls-group');
        const sitemapGroup = toolContent.querySelector('#extractor-sitemap-group');
        function toggleInputs() {
            if (inputTypeSelect.value === 'sitemap') {
                sitemapGroup.style.display = '';
                urlsGroup.style.display = 'none';
            } else {
                sitemapGroup.style.display = 'none';
                urlsGroup.style.display = '';
            }
        }
        inputTypeSelect.addEventListener('change', toggleInputs);
        toggleInputs();
        // زر التشغيل
        toolContent.querySelector('#run-extractor-btn').onclick = () => {
            const config = {
                inputType: inputTypeSelect.value,
                maxKeywordsPerUrl: parseInt(toolContent.querySelector('#extractor-max-keywords').value, 10),
                minKeywordLength: parseInt(toolContent.querySelector('#extractor-min-length').value, 10),
                excludeCommonWords: toolContent.querySelector('#extractor-exclude-common').checked
            };
            let inputData = { config };
            if (inputTypeSelect.value === 'sitemap') {
                inputData.sitemapUrl = toolContent.querySelector('#extractor-sitemap').value.trim();
            } else {
                inputData.urls = toolContent.querySelector('#extractor-urls').value.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
            }
            this.emit('event', { type: 'run-tool', payload: { toolId: 'keyword-extractor', inputData } });
        };
    }

    renderInternalLinkingView(toolContent, state) {
        toolContent.innerHTML = `
            <div class="p-4">
                <h2 class="font-bold text-lg mb-2">Internal Linking Tool</h2>
                <p class="mb-2">Add your keywords and URLs to analyze internal linking opportunities.</p>
                <textarea id="linking-keywords" class="w-full border p-2 mb-2" rows="4" placeholder="keyword, https://url.com\n..."></textarea>
                <button id="run-linking-btn" class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded">Analyze</button>
                <div id="linking-results" class="mt-4"></div>
            </div>
        `;
        toolContent.querySelector('#run-linking-btn').onclick = () => {
            const lines = toolContent.querySelector('#linking-keywords').value.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
            const articles = lines.map(line => {
                const [keyword, url] = line.split(',');
                return keyword && url ? { keyword: keyword.trim(), url: url.trim() } : null;
            }).filter(Boolean);
            this.emit('event', { type: 'run-tool', payload: { toolId: 'internal-linking', inputData: { articles } } });
        };
    }

    renderWelcome() {
        return `
            <div class="welcome-screen">
                <h1>Welcome to Internal Linking Tool</h1>
                <p>Select a tool from above to get started:</p>
                <ul>
                    <li><strong>Keyword Manager:</strong> Manage your target keywords and their search intent</li>
                    <li><strong>Keyword Extractor:</strong> Extract keywords from URLs or sitemap</li>
                    <li><strong>Internal Linking:</strong> Analyze and optimize internal linking</li>
                </ul>
            </div>
        `;
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        document.getElementById('tool-content').appendChild(errorDiv);
    }
}
