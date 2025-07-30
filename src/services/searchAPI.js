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

const searchAPI = {
  // Parse natural language query into filters
  parseQuery: async (query) => {
    return api.post('/search/parse', { query });
  },

  // Parse and execute search in one step
  parseAndExecuteSearch: async (query) => {
    return api.post('/search/parse-and-execute', { query });
  },

  // Execute search with confirmed filters
  executeSearch: async (query) => {
    return api.post('/search/parse-and-execute', { query });
  },

  // Get search history
  getSearchHistory: async () => {
    return api.get('/search/history');  // No limit - fetch all searches
  },

  // Get search history with statistics
  getSearchHistoryWithStats: async () => {
    return api.get('/search/history-with-stats');  // No limit - fetch all searches
  },

  // Get specific search results
  getSearch: async (searchId) => {
    return api.get(`/search/${searchId}`);
  },

  // Update filters and re-execute search
  updateFilters: async (searchId, filters) => {
    return api.put(`/search/${searchId}/filters`, filters);
  },

  // Delete search
  deleteSearch: async (searchId) => {
    return api.delete(`/search/${searchId}`);
  },

  // Get filter options
  getFilterOptions: async () => {
    return api.get('/search/filter-options');
  },
};

export default searchAPI; 