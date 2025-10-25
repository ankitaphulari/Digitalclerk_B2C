class Auth {
  constructor() {
    this.user = null;
    this.isAuthenticated = false;
  }

  async checkAuth() {
    try {
      const result = await chrome.storage.local.get(['authToken', 'user']);
      
      if (result.authToken) {
        // Verify token with backend
        const data = await api.verifyToken();
        this.user = data.user;
        this.isAuthenticated = true;
        return true;
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      await this.logout();
    }
    
    return false;
  }

  async login(email, password) {
    try {
      const data = await api.login(email, password);
      this.user = data.user;
      this.isAuthenticated = true;
      
      await chrome.storage.local.set({ user: data.user });
      
      return { success: true, user: data.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async logout() {
    await api.logout();
    await chrome.storage.local.remove(['user']);
    this.user = null;
    this.isAuthenticated = false;
  }

  getUser() {
    return this.user;
  }
}

const auth = new Auth();
