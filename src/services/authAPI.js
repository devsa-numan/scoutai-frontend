import axios from 'axios';
import tokenManager from '../utils/tokenManager';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8015/api/v1';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = tokenManager.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = tokenManager.getRefreshToken();
        if (refreshToken) {
          // Create a new axios instance for refresh to avoid interceptors
          const refreshResponse = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, {
            headers: {
              'Authorization': `Bearer ${refreshToken}`,
              'Content-Type': 'application/json'
            }
          });
          
          const { accessToken, refreshToken: newRefreshToken } = refreshResponse.data.data.tokens;
          tokenManager.setTokens(accessToken, newRefreshToken);
          
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        tokenManager.clearTokens();
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

const authAPI = {
  // Login user
  login: async (credentials) => {
    return api.post('/auth/login', credentials);
  },

  // Register user
  register: async (userData) => {
    return api.post('/auth/register', userData);
  },

  // Logout user
  logout: async () => {
    return api.post('/auth/logout');
  },

  // Get current user
  getCurrentUser: async () => {
    return api.get('/users/profile');
  },

  // Refresh token
  refreshToken: async (refreshToken) => {
    return axios.post(`${API_BASE_URL}/auth/refresh`, {}, {
      headers: {
        'Authorization': `Bearer ${refreshToken}`,
        'Content-Type': 'application/json'
      }
    });
  },

  // Forgot password
  forgotPassword: async (email) => {
    return api.post('/auth/forgotPassword', { email });
  },

  // Reset password
  resetPassword: async (token, password) => {
    return api.post(`/auth/resetPassword/${token}`, { password });
  },
};

export default authAPI; 