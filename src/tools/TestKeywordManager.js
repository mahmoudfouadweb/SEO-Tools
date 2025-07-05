// Test file for Keyword Manager functionality
import { App } from '../App.js';

async function testKeywordManager() {
    console.log('Starting Keyword Manager Tests...');
    const app = new App();
    await app.init();

    // Test 1: Basic keyword addition
    console.log('\nTest 1: Basic keyword addition');
    app.handleUIEvent({
        type: 'add-keywords',
        payload: {
            keywords: [
                { keyword: 'test keyword', intent: 'informational' },
                { keyword: 'السيو العربي', intent: 'navigational' }
            ]
        }
    });

    // Test 2: Bulk import with mixed content
    console.log('\nTest 2: Bulk import with mixed content');
    app.handleUIEvent({
        type: 'bulk-import',
        payload: {
            keywords: [
                { keyword: 'keyword 1' },
                { keyword: 'تحسين محركات البحث' },
                { keyword: 'test with numbers 123' },
                { keyword: 'keyword with special chars @#$' },
                { keyword: '' }, // Invalid keyword
                { keyword: 'duplicate keyword' },
                { keyword: 'duplicate keyword' } // Duplicate
            ]
        }
    });

    // Test 3: Edit keyword
    console.log('\nTest 3: Edit keyword');
    const state = app.stateManager.getState();
    if (state.masterKeywords && state.masterKeywords.length > 0) {
        const firstKeyword = state.masterKeywords[0];
        app.handleUIEvent({
            type: 'edit-keyword',
            payload: {
                id: firstKeyword.id,
                keyword: 'edited keyword',
                intent: 'transactional'
            }
        });
    }

    // Test 4: Delete keyword
    console.log('\nTest 4: Delete keyword');
    const updatedState = app.stateManager.getState();
    if (updatedState.masterKeywords && updatedState.masterKeywords.length > 0) {
        const lastKeyword = updatedState.masterKeywords[updatedState.masterKeywords.length - 1];
        app.handleUIEvent({
            type: 'delete-keyword',
            payload: lastKeyword.id
        });
    }

    // Test 5: Common words exclusion
    console.log('\nTest 5: Common words exclusion');
    app.handleUIEvent({
        type: 'add-keywords',
        payload: {
            keywords: [
                { keyword: 'the test keyword' },
                { keyword: 'a sample keyword' },
                { keyword: 'keyword with and without' }
            ]
        }
    });

    // Test 6: Arabic text handling
    console.log('\nTest 6: Arabic text handling');
    app.handleUIEvent({
        type: 'add-keywords',
        payload: {
            keywords: [
                { keyword: 'كلمة مفتاحية للاختبار' },
                { keyword: 'تحسين محركات البحث العربية' },
                { keyword: 'السيو العربي مع أرقام 123' }
            ]
        }
    });

    // Test 7: Edge cases
    console.log('\nTest 7: Edge cases');
    app.handleUIEvent({
        type: 'add-keywords',
        payload: {
            keywords: [
                { keyword: ' ' }, // Empty space
                { keyword: '   trimmed   ' }, // Needs trimming
                { keyword: null }, // Null
                { keyword: undefined }, // Undefined
                { keyword: '😀 emoji test' }, // Emoji
                { keyword: 'very'.repeat(100) } // Very long keyword
            ]
        }
    });

    // Print final state
    console.log('\nFinal state:', app.stateManager.getState().masterKeywords);
}

// Run tests
testKeywordManager().catch(console.error);
