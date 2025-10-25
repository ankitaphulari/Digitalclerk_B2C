// src/api/client.ts
// Main API client for communicating with our custom backend

const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || 'http://localhost:5000/api';

// ==================== TYPES ====================

interface SignupData {
  companyName: string;
  email: string;
  password: string;
  phone: string;
  location: string;
  plan: 'Starter' | 'Professional' | 'Enterprise';
}

interface LoginData {
  email: string;
  password: string;
}

interface User {
  id: string;
  companyName: string;
  email: string;
  plan: string;
  documentsUsed: number;
  documentLimit: number;
  subscriptionStatus: string;
}

interface DocumentData {
  fileName: string;
  fileType: string;
  extractedData: any;
}

// ==================== HELPER FUNCTIONS ====================

const getToken = (): string | null => {
  return localStorage.getItem('digitalclerk_token');
};

const saveToken = (token: string): void => {
  localStorage.setItem('digitalclerk_token', token);
};

const removeToken = (): void => {
  localStorage.removeItem('digitalclerk_token');
};

// ==================== API CLIENT ====================

export const api = {
  // 1. SIGNUP
  signup: async (data: SignupData) => {
    const response = await fetch(`${API_BASE_URL}/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Signup failed');
    }

    return await response.json();
  },

  // 2. LOGIN
  login: async (data: LoginData): Promise<{ token: string; user: User }> => {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    const result = await response.json();
    saveToken(result.token);
    return result;
  },

  // 3. LOGOUT
  logout: () => {
    removeToken();
  },

  // 4. CREATE RAZORPAY ORDER
  createOrder: async (amount: number, plan: string, userId: string) => {
    const response = await fetch(`${API_BASE_URL}/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        currency: 'INR',
        plan,
        userId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Order creation failed');
    }

    return await response.json();
  },

  // 5. VERIFY PAYMENT
  verifyPayment: async (paymentData: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    userId: string;
  }) => {
    const response = await fetch(`${API_BASE_URL}/verify-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Payment verification failed');
    }

    return await response.json();
  },

  // 6. GET USER PROFILE (Protected)
  getUserProfile: async (): Promise<{ user: User }> => {
    const token = getToken();
    
    if (!token) {
      throw new Error('No token found. Please login.');
    }

    const response = await fetch(`${API_BASE_URL}/user/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        removeToken();
        throw new Error('Session expired. Please login again.');
      }
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch profile');
    }

    return await response.json();
  },

  // 7. SAVE DOCUMENT (Protected)
  saveDocument: async (data: DocumentData) => {
    const token = getToken();
    
    if (!token) {
      throw new Error('No token found. Please login.');
    }

    const response = await fetch(`${API_BASE_URL}/documents/save`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      if (response.status === 401) {
        removeToken();
        throw new Error('Session expired. Please login again.');
      }
      const error = await response.json();
      throw new Error(error.error || 'Failed to save document');
    }

    return await response.json();
  },

  // 8. GET DOCUMENTS (Protected)
  getDocuments: async () => {
    const token = getToken();
    
    if (!token) {
      throw new Error('No token found. Please login.');
    }

    const response = await fetch(`${API_BASE_URL}/documents`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        removeToken();
        throw new Error('Session expired. Please login again.');
      }
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch documents');
    }

    return await response.json();
  },

  // 9. CHECK IF USER IS LOGGED IN
  isLoggedIn: (): boolean => {
    return !!getToken();
  },

  // 10. HEALTH CHECK
  healthCheck: async () => {
    const response = await fetch(`${API_BASE_URL}/health`);
    return await response.json();
  },
};

// Default export
export default api;
