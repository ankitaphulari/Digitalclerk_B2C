const CONFIG = {
  API_URL: 'https://api.digitalclerk.app', // Change to your backend URL
  // For development:
  // API_URL: 'http://localhost:5000',
  
  ENDPOINTS: {
    LOGIN: '/api/auth/login',
    VERIFY: '/api/auth/verify',
    UPLOAD_DOCUMENT: '/api/document/upload',
    EXTRACT_DATA: '/api/document/extract',
    QUICK_FILL: '/api/extension/quick-fill',
    GET_USER: '/api/user/profile'
  }
};
