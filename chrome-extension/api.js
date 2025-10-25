 class API {
  constructor() {
    this.baseURL = CONFIG.API_URL;
    this.token = null;
  }

  async setToken(token) {
    this.token = token;
    await chrome.storage.local.set({ authToken: token });
  }

  async getToken() {
    if (!this.token) {
      const result = await chrome.storage.local.get(['authToken']);
      this.token = result.authToken;
    }
    return this.token;
  }

  async request(endpoint, options = {}) {
    const token = await this.getToken();
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  }

  // Login
  async login(email, password) {
    const data = await this.request(CONFIG.ENDPOINTS.LOGIN, {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    
    if (data.token) {
      await this.setToken(data.token);
    }
    
    return data;
  }

  // Verify token
  async verifyToken() {
    return this.request(CONFIG.ENDPOINTS.VERIFY);
  }

  // Upload document and extract data
  async uploadAndExtract(file) {
    const formData = new FormData();
    formData.append('document', file);

    const token = await this.getToken();
    
    const response = await fetch(`${this.baseURL}${CONFIG.ENDPOINTS.UPLOAD_DOCUMENT}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    return response.json();
  }

  // Quick fill form
  async quickFill(documentData, formUrl) {
    return this.request(CONFIG.ENDPOINTS.QUICK_FILL, {
      method: 'POST',
      body: JSON.stringify({ documentData, formUrl })
    });
  }

  // Logout
  async logout() {
    await chrome.storage.local.remove(['authToken']);
    this.token = null;
  }
}

const api = new API();
