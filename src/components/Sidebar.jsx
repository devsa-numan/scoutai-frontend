import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logoutUser } from '../store/slices/authSlice';
import { getSearchHistory, clearSearchResults } from '../store/slices/searchSlice';
import { toggleSidebar, setSidebarVisible } from '../store/slices/uiSlice';

const Sidebar = ({ 
  activeTab, 
  setActiveTab, 
  setSearchQuery, 
  setIsReady, 
  setEditableTags, 
  setShowCandidates, 
  setCandidates,
  onNewChat,
  onSidebarToggle,
  currentSearchId 
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { searchHistory, isLoading } = useSelector((state) => state.search);
  const { sidebarVisible } = useSelector((state) => state.ui);

  // Load search history when component mounts
  useEffect(() => {
    dispatch(getSearchHistory()).catch(error => {
      console.error('Error loading search history:', error);
    });
  }, [dispatch]);

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate('/login');
  };

  const handleNewChat = () => {
    setActiveTab('search');
    setSearchQuery('');
    setIsReady(false);
    setEditableTags([]);
    setShowCandidates(false);
    setCandidates([]);
    dispatch(clearSearchResults());
    // Load search history when user clicks New chat
    dispatch(getSearchHistory());
    
    // Call the parent's onNewChat if provided
    if (onNewChat) {
      onNewChat();
    }
  };

  const handleHistoryClick = (query) => {
    setSearchQuery(query);
    setIsReady(false);
    setEditableTags([]);
    setShowCandidates(false);
    setCandidates([]);
    dispatch(clearSearchResults());
    
    // Auto-focus the search query display area in the main content
    setTimeout(() => {
      // Look for the search query display element
      const searchQueryElement = document.querySelector('[data-search-query]');
      if (searchQueryElement) {
        searchQueryElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
        // Add a brief highlight effect
        searchQueryElement.classList.add('bg-yellow-100');
        setTimeout(() => {
          searchQueryElement.classList.remove('bg-yellow-100');
        }, 2000);
      }
    }, 100);
  };

  const handleToggleSidebar = () => {
    dispatch(toggleSidebar());
    if (onSidebarToggle) {
      onSidebarToggle(!sidebarVisible);
    }
  };

  // Ensure searchHistory is an array
  const safeSearchHistory = Array.isArray(searchHistory) ? searchHistory : [];

  return (
    <div className={`fixed left-0 h-full bg-[#FAFAFA] pt-2 transition-all duration-300 ease-in-out z-40 ${
      sidebarVisible ? 'w-60' : 'w-16'
    }`}>
      <div className={`h-full flex flex-col ${sidebarVisible ? 'px-4 pb-4' : 'px-2 pb-4'}`}>
        {/* Campaign Dashboard */}
        <div className='mb-5' style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <img src="/scout-ai-logo1.png" alt="Scout AI Logo" className="h-6" />
          <button 
            onClick={handleToggleSidebar}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <img src="/hideShow.svg" alt="Hide Show" className="h-6 w-6" />
          </button>
        </div>

        {/* Campaign Dashboard Section */}
        <div className={`${sidebarVisible ? 'block' : 'hidden'}`}>
          <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '7px',backgroundColor:'#F1F1F1',padding:'4px',borderRadius:'5.31px' }}>
            <img src="/compaignDashboard.svg" alt="Campaign Dashboard" className="h-[16.49px] w-[17px]" /> &nbsp;
            <p className='text-[#1B1B1B] text-[14.33px] font-medium'>Campaign Dashboard</p>
          </div>
        </div>

        {/* Collapsed Campaign Dashboard Label */}
        <div className={`${sidebarVisible ? 'hidden' : 'block'}`}>
          <div className="relative">
            <div className="flex justify-center mb-2">
              <img src="/compaignDashboard.svg" alt="Campaign Dashboard" className="h-5 w-5" />
            </div>
            <div className="absolute left-full top-0 ml-2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity">
              Campaign Dashboard
            </div>
          </div>
        </div>

        {/* Prompts Section */}
        <div className={`${sidebarVisible ? 'block' : 'hidden'} mt-8 flex-shrink-0`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <img src="/aisvg.svg" alt="AI Icon" className="w-4 h-4" />
              <span className="text-sm font-bold font-medium">Prompts</span>
            </div>
            <img src="/writing.svg" alt="Writing" className="w-6 h-6" />
          </div>

          {/* New Chat */}
          <button 
            className={`w-full flex items-center space-x-3 px-2 py-1 rounded-lg text-left mb-1.5 bg-[#F1F1F1] `}
            onClick={handleNewChat}
          >
            <span className="font-medium">New chat</span>
          </button>
        </div>

        {/* Search History - Scrollable Section */}
        <div className={`${sidebarVisible ? 'block' : 'hidden'} flex-1 overflow-y-auto mt-4`}>
          <div className="space-y-1">
            {isLoading && safeSearchHistory.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-400">
                Loading history...
              </div>
            ) : safeSearchHistory.length > 0 ? (
              safeSearchHistory.map((search, index) => (
                <button
                  key={search.id || index}
                  onClick={() => {
                    console.log('Search history clicked, navigating to long list with search ID:', search.id);
                    // Call handleHistoryClick to set the search query and auto-focus
                    handleHistoryClick(search.shortPrompt || search.query || search);
                    navigate(`/list-management/${search.id}/long-list`);
                  }}
                  className={`w-full text-left px-1 py-1.5 text-sm rounded truncate ${
                    currentSearchId && currentSearchId === search.id 
                      ? 'bg-gray-200 text-gray-800 font-medium' 
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                  title={search.shortPrompt || search.query || search} // Show short prompt on hover
                >
                  {search.shortPrompt || search.query || search}
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-gray-400 italic">
                No search history yet
              </div>
            )}
          </div>
        </div>

        {/* Campaign Section */}
 
        {/* Collapsed Prompts Icon */}
        <div className={`${sidebarVisible ? 'hidden' : 'block'} mt-8 flex-shrink-0`}>
          <div className="flex justify-center mb-2">
            <img src="/aisvg.svg" alt="Prompts" className="h-5 w-5" />
          </div>
        </div>

        {/* Collapsed Toggle Button */}
        <div className={`${sidebarVisible ? 'hidden' : 'block'} mt-8 flex-shrink-0`}>
          <button 
            onClick={handleToggleSidebar}
            className="w-full flex justify-center p-2 hover:bg-gray-100 rounded"
            title="Expand sidebar"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar; 