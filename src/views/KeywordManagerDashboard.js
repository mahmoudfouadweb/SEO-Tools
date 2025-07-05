import { CsvUtils } from '/src/utils/csvUtils.js';

export class KeywordManagerDashboard {
    constructor(uiManager) {
        this.uiManager = uiManager;
        // Per the agent's report, this listener handles the file input change.
        // It's placed here for close proximity to the input element it controls.
        document.addEventListener('change', (e) => {
            if (e.target.id === 'csv-import-input') {
                this.handleFileImport(e);
            }
        });
    }

    handleClick(e) {
        // Add Keyword Modal
        if (e.target.id === 'add-keyword-btn') {
            document.getElementById('add-keyword-modal').classList.remove('hidden');
        } else if (e.target.id === 'cancel-add-keyword') {
            document.getElementById('add-keyword-modal').classList.add('hidden');
        } else if (e.target.id === 'confirm-add-keyword') {
            const term = document.getElementById('new-keyword-term').value;
            const intent = document.getElementById('new-keyword-intent').value;
            if (term) {
                this.uiManager.emit('event', { 
                    type: 'add-keywords', 
                    payload: { keywords: [{ keyword: term, intent: intent || undefined }] } 
                });
                document.getElementById('new-keyword-term').value = '';
                document.getElementById('add-keyword-modal').classList.add('hidden');
            }
        }
        // Import/Export Buttons
        else if (e.target.id === 'import-csv-btn') {
            document.getElementById('csv-import-input').click();
        } else if (e.target.id === 'export-csv-btn') {
            const keywords = this.uiManager.stateManager.getState().masterKeywords;
            if (keywords.length > 0) {
                const csvString = CsvUtils.formatCSV(keywords);
                CsvUtils.downloadCSV(csvString, `keywords-export-${new Date().toISOString().split('T')[0]}.csv`);
            }
        }
        // Add to Exclude Filter Button and Select All Keywords
        else if (e.target.id === 'add-to-exclude-filter-btn') {
            const selectedCheckboxes = Array.from(document.querySelectorAll('.select-keyword-checkbox:checked'));
            const selectedWords = selectedCheckboxes.map(cb => cb.dataset.keywordTerm);
            if (selectedWords.length > 0) {
                this.uiManager.emit('event', { type: 'add-to-exclude-filter', payload: selectedWords });
                // Uncheck all checkboxes after adding to filter
                selectedCheckboxes.forEach(cb => cb.checked = false);
                document.getElementById('select-all-keywords').checked = false;
            }
        } else if (e.target.id === 'select-all-keywords') {
            const checkboxes = document.querySelectorAll('.select-keyword-checkbox');
            checkboxes.forEach(cb => cb.checked = e.target.checked);
        }
        // Edit Keyword Modal
        else if (e.target.classList.contains('edit-keyword-btn')) {
            const keywordId = e.target.dataset.keywordId;
            const keywordTerm = e.target.dataset.keywordTerm;
            const keywordIntent = e.target.dataset.keywordIntent;

            document.getElementById('edit-keyword-id').value = keywordId;
            document.getElementById('edit-keyword-term').value = keywordTerm;
            document.getElementById('edit-keyword-intent').value = keywordIntent || '';
            document.getElementById('edit-keyword-modal').classList.remove('hidden');
        } else if (e.target.id === 'cancel-edit-keyword') {
            document.getElementById('edit-keyword-modal').classList.add('hidden');
        } else if (e.target.id === 'confirm-edit-keyword') {
            const id = document.getElementById('edit-keyword-id').value;
            const term = document.getElementById('edit-keyword-term').value;
            const intent = document.getElementById('edit-keyword-intent').value;
            this.uiManager.emit('event', { 
                type: 'edit-keyword', 
                payload: { 
                    id, 
                    keyword: term, 
                    intent: intent || undefined 
                } 
            });
            document.getElementById('edit-keyword-modal').classList.add('hidden');
        }
        // Delete Keyword Modal
        else if (e.target.classList.contains('delete-keyword-btn')) {
            const keywordId = e.target.dataset.keywordId;
            document.getElementById('delete-keyword-id').value = keywordId;
            document.getElementById('delete-keyword-modal').classList.remove('hidden');
        } else if (e.target.id === 'cancel-delete-keyword') {
            document.getElementById('delete-keyword-modal').classList.add('hidden');
        } else if (e.target.id === 'confirm-delete-keyword') {
            const id = document.getElementById('delete-keyword-id').value;
            this.uiManager.emit('event', { type: 'delete-keyword', payload: id });
            document.getElementById('delete-keyword-modal').classList.add('hidden');
        }
    }

    handleChange(e) {
        if (e.target.classList.contains('search-intent-select')) {
            const keywordId = e.target.dataset.keywordId;
            const newIntent = e.target.value;
            this.uiManager.emit('event', { 
                type: 'update-keyword-intent', 
                payload: { 
                    id: keywordId, 
                    intent: newIntent || undefined 
                } 
            });
        }
    }

    handleFileImport(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const keywords = CsvUtils.parseCSV(event.target.result);
                this.uiManager.emit('event', { type: 'add-keywords', payload: { keywords } });
            } catch (error) {
                this.uiManager.emit('error', `CSV parsing failed: ${error.message}`);
            }
        };
        reader.readAsText(file);
        e.target.value = ''; // Reset file input
    }

    render(state) {
        const keywords = state?.masterKeywords || [];
        return `
            <div class="keyword-manager">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-xl font-bold">Keyword Manager</h2>
                    <div>
                        <button id="add-keyword-btn" class="bg-blue-500 hover:bg-blue-700 text-white px-4 py-2 rounded mr-2">
                            Add Keyword
                        </button>
                        <button id="import-csv-btn" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded mr-2">
                            Import from CSV
                        </button>
                        <button id="export-csv-btn" class="${keywords.length > 0 ? 'bg-teal-600 hover:bg-teal-700' : 'bg-gray-400 cursor-not-allowed'} text-white px-4 py-2 rounded mr-2" ${keywords.length === 0 ? 'disabled' : ''}>
                            Export to CSV
                        </button>
                        <button id="add-to-exclude-filter-btn" class="bg-purple-600 hover:bg-purple-800 text-white px-4 py-2 rounded">
                            Add to Exclude Filter
                        </button>
                    </div>
                </div>

                <input type="file" id="csv-import-input" class="hidden" accept=".csv" />

                <div class="overflow-x-auto">
                    <table class="min-w-full bg-white border">
                        <thead>
                            <tr>
                                <th class="px-4 py-2 border"><input type="checkbox" id="select-all-keywords"></th>
                                <th class="px-4 py-2 border">#</th>
                                <th class="px-4 py-2 border">Keyword</th>
                                <th class="px-4 py-2 border">URL</th>
                                <th class="px-4 py-2 border">Search Intent</th>
                                <th class="px-4 py-2 border">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${keywords.map((keyword, idx) => `
                                <tr>
                                    <td class="px-4 py-2 border text-center">
                                        <input type="checkbox" class="select-keyword-checkbox" data-keyword-term="${keyword.keyword}">
                                    </td>
                                    <td class="px-4 py-2 border text-center">${idx + 1}</td>
                                    <td class="px-4 py-2 border font-semibold">${keyword.keyword}</td>
                                    <td class="px-4 py-2 border">
                                        ${keyword.url ? `<a href="${keyword.url}" target="_blank" class="text-blue-600 underline break-all">رابط المقال</a>` : '<span class="text-gray-400">—</span>'}
                                    </td>
                                    <td class="px-4 py-2 border">
                                        <select class="search-intent-select" data-keyword-id="${keyword.id}">
                                            <option value="" ${!keyword.intent ? 'selected' : ''}>Not Specified</option>
                                            <option value="informational" ${keyword.intent === 'informational' ? 'selected' : ''}>Informational</option>
                                            <option value="navigational" ${keyword.intent === 'navigational' ? 'selected' : ''}>Navigational</option>
                                            <option value="transactional" ${keyword.intent === 'transactional' ? 'selected' : ''}>Transactional</option>
                                        </select>
                                    </td>
                                    <td class="px-4 py-2 border">
                                        <button class="edit-keyword-btn bg-yellow-500 hover:bg-yellow-700 text-white px-2 py-1 rounded mr-2"
                                                data-keyword-id="${keyword.id}"
                                                data-keyword-term="${keyword.keyword}"
                                                data-keyword-intent="${keyword.intent || ''}">
                                            Edit
                                        </button>
                                        <button class="delete-keyword-btn bg-red-500 hover:bg-red-700 text-white px-2 py-1 rounded"
                                                data-keyword-id="${keyword.id}">
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

                <!-- Add Keyword Modal -->
                <div id="add-keyword-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div class="bg-white p-6 rounded-lg">
                        <h3 class="text-lg font-bold mb-4">Add New Keyword</h3>
                        <input type="text" id="new-keyword-term" placeholder="Enter keyword" class="w-full p-2 border rounded mb-2">
                        <select id="new-keyword-intent" class="w-full p-2 border rounded mb-4">
                            <option value="">-- Select Intent (Optional) --</option>
                            <option value="informational">Informational</option>
                            <option value="navigational">Navigational</option>
                            <option value="transactional">Transactional</option>
                        </select>
                        <div class="flex justify-end">
                            <button id="cancel-add-keyword" class="bg-gray-500 hover:bg-gray-700 text-white px-4 py-2 rounded mr-2">Cancel</button>
                            <button id="confirm-add-keyword" class="bg-blue-500 hover:bg-blue-700 text-white px-4 py-2 rounded">Add</button>
                        </div>
                    </div>
                </div>

                <!-- Edit Keyword Modal -->
                <div id="edit-keyword-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div class="bg-white p-6 rounded-lg">
                        <h3 class="text-lg font-bold mb-4">Edit Keyword</h3>
                        <input type="hidden" id="edit-keyword-id">
                        <input type="text" id="edit-keyword-term" placeholder="Enter keyword" class="w-full p-2 border rounded mb-2">
                        <select id="edit-keyword-intent" class="w-full p-2 border rounded mb-4">
                            <option value="">Not Specified</option>
                            <option value="informational">Informational</option>
                            <option value="navigational">Navigational</option>
                            <option value="transactional">Transactional</option>
                        </select>
                        <div class="flex justify-end">
                            <button id="cancel-edit-keyword" class="bg-gray-500 hover:bg-gray-700 text-white px-4 py-2 rounded mr-2">Cancel</button>
                            <button id="confirm-edit-keyword" class="bg-blue-500 hover:bg-blue-700 text-white px-4 py-2 rounded">Save</button>
                        </div>
                    </div>
                </div>

                <!-- Delete Keyword Modal -->
                <div id="delete-keyword-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div class="bg-white p-6 rounded-lg">
                        <h3 class="text-lg font-bold mb-4">Delete Keyword</h3>
                        <p>Are you sure you want to delete this keyword?</p>
                        <input type="hidden" id="delete-keyword-id">
                        <div class="flex justify-end mt-4">
                            <button id="cancel-delete-keyword" class="bg-gray-500 hover:bg-gray-700 text-white px-4 py-2 rounded mr-2">Cancel</button>
                            <button id="confirm-delete-keyword" class="bg-red-500 hover:bg-red-700 text-white px-4 py-2 rounded">Delete</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}
