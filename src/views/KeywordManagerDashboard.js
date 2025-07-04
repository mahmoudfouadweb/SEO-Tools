export class KeywordManagerDashboard {
    constructor(uiManager) {
        this.uiManager = uiManager;
        this.attachEventListeners();
    }

    attachEventListeners() {
        // Add Keyword Modal
        document.addEventListener('click', (e) => {
            if (e.target.id === 'add-keyword-btn') {
                document.getElementById('add-keyword-modal').classList.remove('hidden');
            }
            if (e.target.id === 'cancel-add-keyword') {
                document.getElementById('add-keyword-modal').classList.add('hidden');
            }
            if (e.target.id === 'confirm-add-keyword') {
                const term = document.getElementById('new-keyword-term').value;
                const intent = document.getElementById('new-keyword-intent').value;
                if (term) {
                    this.uiManager.emit('event', { type: 'add-keywords', payload: [{ keyword: term, intent: intent }] });
                    document.getElementById('new-keyword-term').value = '';
                    document.getElementById('add-keyword-modal').classList.add('hidden');
                }
            }
        });

        // Bulk Import Modal
        document.addEventListener('click', (e) => {
            if (e.target.id === 'bulk-import-btn') {
                document.getElementById('bulk-import-modal').classList.remove('hidden');
            }
            if (e.target.id === 'cancel-bulk-import') {
                document.getElementById('bulk-import-modal').classList.add('hidden');
            }
            if (e.target.id === 'confirm-bulk-import') {
                const data = document.getElementById('bulk-import-data').value;
                if (data) {
                    const keywords = data.split('\n').map(line => {
                        const [keyword, intent = 'informational'] = line.split(',').map(s => s.trim());
                        return { keyword, intent };
                    }).filter(k => k.keyword);
                    this.uiManager.emit('event', { type: 'bulk-import', payload: keywords });
                    document.getElementById('bulk-import-data').value = '';
                    document.getElementById('bulk-import-modal').classList.add('hidden');
                }
            }
        });

        // Edit Keyword Modal
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('edit-keyword-btn')) {
                const keywordId = e.target.dataset.keywordId;
                const keywordTerm = e.target.dataset.keywordTerm;
                const keywordIntent = e.target.dataset.keywordIntent;

                document.getElementById('edit-keyword-id').value = keywordId;
                document.getElementById('edit-keyword-term').value = keywordTerm;
                document.getElementById('edit-keyword-intent').value = keywordIntent;
                document.getElementById('edit-keyword-modal').classList.remove('hidden');
            }
            if (e.target.id === 'cancel-edit-keyword') {
                document.getElementById('edit-keyword-modal').classList.add('hidden');
            }
            if (e.target.id === 'confirm-edit-keyword') {
                const id = document.getElementById('edit-keyword-id').value;
                const term = document.getElementById('edit-keyword-term').value;
                const intent = document.getElementById('edit-keyword-intent').value;
                this.uiManager.emit('event', { type: 'edit-keyword', payload: { id, keyword: term, intent } });
                document.getElementById('edit-keyword-modal').classList.add('hidden');
            }
        });

        // Delete Keyword Modal
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-keyword-btn')) {
                const keywordId = e.target.dataset.keywordId;
                document.getElementById('delete-keyword-id').value = keywordId;
                document.getElementById('delete-keyword-modal').classList.remove('hidden');
            }
            if (e.target.id === 'cancel-delete-keyword') {
                document.getElementById('delete-keyword-modal').classList.add('hidden');
            }
            if (e.target.id === 'confirm-delete-keyword') {
                const id = document.getElementById('delete-keyword-id').value;
                this.uiManager.emit('event', { type: 'delete-keyword', payload: id });
                document.getElementById('delete-keyword-modal').classList.add('hidden');
            }
        });

        // Event listeners for the new custom events
        document.addEventListener('editKeyword', (e) => {
            const keywordId = e.detail;
            const editButton = document.querySelector(`button[data-keyword-id="${keywordId}"].edit-keyword-btn`);
            if (editButton) {
                const keywordTerm = editButton.dataset.keywordTerm;
                const keywordIntent = editButton.dataset.keywordIntent;

                document.getElementById('edit-keyword-id').value = keywordId;
                document.getElementById('edit-keyword-term').value = keywordTerm;
                document.getElementById('edit-keyword-intent').value = keywordIntent;
                document.getElementById('edit-keyword-modal').classList.remove('hidden');
            }
        });

        document.addEventListener('deleteKeyword', (e) => {
            const keywordId = e.detail;
            document.getElementById('delete-keyword-id').value = keywordId;
            document.getElementById('delete-keyword-modal').classList.remove('hidden');
        });

        // Event listener for search intent select change
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('search-intent-select')) {
                const keywordId = e.target.dataset.keywordId;
                const newIntent = e.target.value;
                this.uiManager.emit('event', { type: 'update-keyword-intent', payload: { id: keywordId, intent: newIntent } });
            }
        });
    }
