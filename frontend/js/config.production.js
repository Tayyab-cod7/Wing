// Production Configuration
const CONFIG = {
    NODE_ENV: 'production',
    // Point API calls to Railway backend
    API_URL: 'https://wing-production.up.railway.app/api',
    // Point base URL to Railway backend
    BASE_URL: 'https://wing-production.up.railway.app'
};

// Make config available globally
window.APP_CONFIG = CONFIG; 