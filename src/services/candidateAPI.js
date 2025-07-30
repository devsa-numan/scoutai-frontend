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

// Apollo cache management
class ApolloCache {
  constructor() {
    this.cache = new Map();
    this.cacheExpiry = new Map();
    this.defaultExpiry = 5 * 60 * 1000; // 5 minutes
  }

  // Generate cache key
  generateKey(searchId, listType = null) {
    return listType ? `search_${searchId}_${listType}` : `search_${searchId}_all`;
  }

  // Set cache with expiry
  set(key, data, expiryMs = this.defaultExpiry) {
    this.cache.set(key, data);
    this.cacheExpiry.set(key, Date.now() + expiryMs);
  }

  // Get cache if not expired
  get(key) {
    const expiry = this.cacheExpiry.get(key);
    if (!expiry || Date.now() > expiry) {
      this.delete(key);
      return null;
    }
    return this.cache.get(key);
  }

  // Delete cache
  delete(key) {
    this.cache.delete(key);
    this.cacheExpiry.delete(key);
  }

  // Clear all cache
  clear() {
    this.cache.clear();
    this.cacheExpiry.clear();
  }

  // Get cache for specific search and list type
  getCandidatesBySearch(searchId, listType = null) {
    const key = this.generateKey(searchId, listType);
    return this.get(key);
  }

  // Set cache for specific search and list type
  setCandidatesBySearch(searchId, data, listType = null, expiryMs = this.defaultExpiry) {
    const key = this.generateKey(searchId, listType);
    this.set(key, data, expiryMs);
  }

  // Invalidate cache for a search (when candidates are updated)
  invalidateSearch(searchId) {
    const keysToDelete = [];
    for (const key of this.cache.keys()) {
      if (key.includes(`search_${searchId}`)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.delete(key));
  }

  // Invalidate specific status cache for a search
  invalidateStatus(searchId, status) {
    const key = this.generateKey(searchId, status);
    this.delete(key);
    console.log(`Invalidated cache for search ${searchId}, status ${status}`);
  }
}

// Create global Apollo cache instance
const apolloCache = new ApolloCache();

const candidateAPI = {
  // Get all candidates for a search (with Apollo cache)
  getAllCandidatesBySearch: async (searchId, useCache = true) => {
    try {
      // Check cache first
      if (useCache) {
        const cachedData = apolloCache.getCandidatesBySearch(searchId);
        if (cachedData) {
          console.log('Returning cached candidates for search:', searchId);
          return { data: cachedData, fromCache: true };
        }
      }

      // Fetch from API using the correct endpoint
      console.log('Fetching candidates from API for search:', searchId);
      const response = await api.get(`/candidates/search/${searchId}/all`);
      
      // Store in cache
      apolloCache.setCandidatesBySearch(searchId, response.data.data);
      
      return { data: response.data.data, fromCache: false };
    } catch (error) {
      console.error('Error fetching candidates by search:', error);
      throw error;
    }
  },

  // Get candidates by status for a search (with Apollo cache)
  getCandidatesByStatus: async (searchId, status, useCache = true) => {
    try {
      // Check cache first
      if (useCache) {
        const cachedData = apolloCache.getCandidatesBySearch(searchId, status);
        if (cachedData) {
          console.log(`Returning cached ${status} candidates for search:`, searchId);
          return { data: cachedData, fromCache: true };
        }
      }

      // Fetch directly from API with status filter
      console.log(`Fetching ${status} candidates from API for search:`, searchId);
      const response = await api.get('/candidates', {
        params: {
          searchId: searchId,
          status: status,
          limit: 1000 // Get all candidates for this status
        }
      });

      // Store in cache
      apolloCache.setCandidatesBySearch(searchId, response.data.data, status);

      return { data: response.data.data, fromCache: false };
    } catch (error) {
      console.error(`Error fetching ${status} candidates:`, error);
      throw error;
    }
  },

  // Get candidates by status with force refresh (ignores cache)
  getCandidatesByStatusForceRefresh: async (searchId, status) => {
    try {
      // Force refresh by invalidating cache first
      apolloCache.invalidateStatus(searchId, status);
      
      // Fetch directly from API with status filter
      console.log(`Force refreshing ${status} candidates from API for search:`, searchId);
      const response = await api.get('/candidates', {
        params: {
          searchId: searchId,
          status: status,
          limit: 1000 // Get all candidates for this status
        }
      });

      // Store in cache
      apolloCache.setCandidatesBySearch(searchId, response.data.data, status);

      return { data: response.data.data, fromCache: false };
    } catch (error) {
      console.error(`Error force refreshing ${status} candidates:`, error);
      throw error;
    }
  },

  // Get candidates with pagination (no cache for pagination)
  getCandidates: async (params = {}) => {
    try {
      const response = await api.get('/candidates', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching candidates:', error);
      throw error;
    }
  },

  // Get candidate details
  getCandidate: async (candidateId) => {
    try {
      const response = await api.get(`/candidates/${candidateId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching candidate details:', error);
      throw error;
    }
  },

  // Update candidate status
  updateCandidateStatus: async (candidateId, action, toStatus, reason) => {
    try {
      let endpoint;
      let data = { reason };

      switch (action) {
        case 'ACCEPT':
          endpoint = `/candidates/${candidateId}/accept`;
          break;
        case 'REJECT':
          endpoint = `/candidates/${candidateId}/reject`;
          break;
        case 'REVERT':
          endpoint = `/candidates/${candidateId}/revert`;
          data = { toStatus, reason };
          break;
        default:
          throw new Error('Invalid action');
      }

      const response = await api.post(endpoint, data);
      
      // Invalidate cache for this candidate's search
      if (response.data.data?.candidate?.searchId) {
        const searchId = response.data.data.candidate.searchId;
        
        // Invalidate all status caches for this search to ensure fresh data
        apolloCache.invalidateSearch(searchId);
        
        // Also invalidate specific status caches that might be affected
        const statusesToInvalidate = ['LONG_LIST', 'SHORT_LIST', 'GOLDEN_LIST', 'REJECTED'];
        statusesToInvalidate.forEach(status => {
          apolloCache.invalidateStatus(searchId, status);
        });
        
        console.log(`Invalidated all caches for search ${searchId} after ${action} action`);
      }

      return response.data;
    } catch (error) {
      console.error('Error updating candidate status:', error);
      throw error;
    }
  },

  // Bulk actions
  bulkAction: async (candidateIds, action, toStatus, reason) => {
    try {
      const response = await api.post('/candidates/bulk-action', {
        candidateIds,
        action,
        toStatus,
        reason
      });

      // Invalidate cache for affected searches
      if (response.data.data?.affectedSearches) {
        response.data.data.affectedSearches.forEach(searchId => {
          // Invalidate all status caches for this search to ensure fresh data
          apolloCache.invalidateSearch(searchId);
          
          // Also invalidate specific status caches that might be affected
          const statusesToInvalidate = ['LONG_LIST', 'SHORT_LIST', 'GOLDEN_LIST', 'REJECTED'];
          statusesToInvalidate.forEach(status => {
            apolloCache.invalidateStatus(searchId, status);
          });
        });
      }

      return response.data;
    } catch (error) {
      console.error('Error performing bulk action:', error);
      throw error;
    }
  },

  // Bulk move to Short List
  bulkMoveToShortlist: async (candidateIds, reason) => {
    try {
      const response = await api.post('/candidates/bulk-move-to-shortlist', {
        candidateIds,
        reason
      });

      // Invalidate cache for affected searches
      if (response.data.data?.affectedSearches) {
        response.data.data.affectedSearches.forEach(searchId => {
          // Invalidate all status caches for this search to ensure fresh data
          apolloCache.invalidateSearch(searchId);
          
          // Also invalidate specific status caches that might be affected
          const statusesToInvalidate = ['LONG_LIST', 'SHORT_LIST', 'GOLDEN_LIST', 'REJECTED'];
          statusesToInvalidate.forEach(status => {
            apolloCache.invalidateStatus(searchId, status);
          });
        });
      }

      return response.data;
    } catch (error) {
      console.error('Error moving candidates to short list:', error);
      throw error;
    }
  },

  // AI Filter candidates
  filterCandidates: async (searchId) => {
    try {
      const response = await api.post('/candidates/filter', { searchId });
      
      // Invalidate cache for this search
      apolloCache.invalidateSearch(searchId);
      
      return response.data;
    } catch (error) {
      console.error('Error filtering candidates:', error);
      throw error;
    }
  },

  // Get search details
  getSearch: async (searchId) => {
    try {
      const response = await api.get(`/search/${searchId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching search details:', error);
      throw error;
    }
  },

  // Get AI filter status for a search
  getAIFilterStatus: async (searchId) => {
    try {
      const response = await api.get(`/search/${searchId}/ai-filter-status`);
      return response.data;
    } catch (error) {
      console.error('Error fetching AI filter status:', error);
      throw error;
    }
  },

  // Update existing searches with short prompts
  updateShortPrompts: async () => {
    try {
      const response = await api.post('/search/update-short-prompts');
      return response.data;
    } catch (error) {
      console.error('Error updating short prompts:', error);
      throw error;
    }
  },

  // Get list statistics
  getListStatistics: async (searchId = null) => {
    try {
      const params = searchId ? { searchId } : {};
      const response = await api.get('/candidates/stats', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching list statistics:', error);
      throw error;
    }
  },

  // Export golden list
  exportGoldenList: async (searchId = null) => {
    try {
      const params = searchId ? { searchId } : {};
      const response = await api.get('/candidates/export/golden-list', { 
        params,
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Error exporting golden list:', error);
      throw error;
    }
  },

  // Cache management methods
  cache: {
    // Clear all cache
    clear: () => apolloCache.clear(),
    
    // Invalidate cache for specific search
    invalidateSearch: (searchId) => apolloCache.invalidateSearch(searchId),
    
    // Get cache info
    getInfo: () => ({
      size: apolloCache.cache.size,
      keys: Array.from(apolloCache.cache.keys())
    })
  }
};

export default candidateAPI; 