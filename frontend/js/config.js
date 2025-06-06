const CONFIG = {
    development: {
        API_URL: 'http://localhost:5000/api',
        BASE_URL: 'http://localhost:5000'
    },
    production: {
        API_URL: 'https://wing-production.up.railway.app/api',
        BASE_URL: 'https://wing-production.up.railway.app'
    }
};

// Check if we're in production based on the URL
const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

// Export the configuration based on environment
const currentConfig = isProduction ? CONFIG.production : CONFIG.development;

// Make config available globally
window.APP_CONFIG = currentConfig; 