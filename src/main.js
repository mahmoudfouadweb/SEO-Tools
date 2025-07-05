import { App } from '/src/App.js';

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('Initializing application...');
        const app = new App();
        await app.init();
        console.log('Application initialized successfully');
    } catch (error) {
        console.error('Error initializing application:', error);
        document.getElementById('tool-content').innerHTML = `
            <div class="error-message">
                Error initializing application: ${error.message}
            </div>
        `;
    }
});

// Add global error handler
window.addEventListener('error', function(event) {
    console.error('Global error:', event.error);
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = `Application error: ${event.error.message}`;
    document.body.appendChild(errorDiv);
});

// Add unhandled promise rejection handler
window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = `Promise error: ${event.reason.message}`;
    document.body.appendChild(errorDiv);
});
