import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import searchAPI from '../../services/searchAPI';

// Async thunks
export const parseQuery = createAsyncThunk(
  'search/parseQuery',
  async (query, { rejectWithValue }) => {
    try {
      const response = await searchAPI.parseQuery(query);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to parse query');
    }
  }
);

export const executeSearch = createAsyncThunk(
  'search/executeSearch',
  async (query, { rejectWithValue }) => {
    try {
      const response = await searchAPI.parseAndExecuteSearch(query);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to execute search');
    }
  }
);

export const getSearchHistory = createAsyncThunk(
  'search/getSearchHistory',
  async (_, { rejectWithValue }) => {
    try {
      const response = await searchAPI.getSearchHistoryWithStats();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get search history');
    }
  }
);

export const getSearch = createAsyncThunk(
  'search/getSearch',
  async (searchId, { rejectWithValue }) => {
    try {
      const response = await searchAPI.getSearch(searchId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get search');
    }
  }
);

const initialState = {
  currentSearch: null,
  searchHistory: [],
  searchResults: null,
  parsedFilters: null,
  isLoading: false,
  error: null,
};

const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSearchResults: (state) => {
      state.searchResults = null;
      state.parsedFilters = null;
    },
    setCurrentSearch: (state, action) => {
      state.currentSearch = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Parse Query
      .addCase(parseQuery.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(parseQuery.fulfilled, (state, action) => {
        state.isLoading = false;
        state.parsedFilters = action.payload.data;
      })
      .addCase(parseQuery.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Execute Search
      .addCase(executeSearch.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(executeSearch.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentSearch = action.payload.data;
        state.searchResults = action.payload.data;
      })
      .addCase(executeSearch.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Get Search History
      .addCase(getSearchHistory.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getSearchHistory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.searchHistory = action.payload.data.searches || action.payload.data;
      })
      .addCase(getSearchHistory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Get Search
      .addCase(getSearch.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getSearch.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentSearch = action.payload.data;
        state.searchResults = action.payload.data;
      })
      .addCase(getSearch.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearSearchResults, setCurrentSearch } = searchSlice.actions;
export default searchSlice.reducer; 