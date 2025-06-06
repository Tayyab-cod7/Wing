// Local Development Configuration
const CONFIG = {
    NODE_ENV: 'development',
    // Point API calls to your local backend
    API_URL: 'http://localhost:5000/api',
    // Point base URL to your local backend
    BASE_URL: 'http://localhost:5000'
};

// Make config available globally
window.APP_CONFIG = CONFIG; 