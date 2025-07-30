import { createSlice } from '@reduxjs/toolkit';

// Get initial state from localStorage or default to true
const getInitialSidebarState = () => {
  try {
    const saved = localStorage.getItem('sidebarVisible');
    return saved !== null ? JSON.parse(saved) : true;
  } catch (error) {
    console.error('Error reading sidebar state from localStorage:', error);
    return true;
  }
};

const initialState = {
  sidebarVisible: getInitialSidebarState(),
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarVisible = !state.sidebarVisible;
      // Save to localStorage
      try {
        localStorage.setItem('sidebarVisible', JSON.stringify(state.sidebarVisible));
      } catch (error) {
        console.error('Error saving sidebar state to localStorage:', error);
      }
    },
    setSidebarVisible: (state, action) => {
      state.sidebarVisible = action.payload;
      // Save to localStorage
      try {
        localStorage.setItem('sidebarVisible', JSON.stringify(state.sidebarVisible));
      } catch (error) {
        console.error('Error saving sidebar state to localStorage:', error);
      }
    },
  },
});

export const { toggleSidebar, setSidebarVisible } = uiSlice.actions;
export default uiSlice.reducer; 