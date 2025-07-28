import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logoutUser } from '../store/slices/authSlice';
import { executeSearch, getSearchHistory, clearError, clearSearchResults, parseQuery } from '../store/slices/searchSlice';
import CandidatesList from './CandidatesList';

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { searchHistory, isLoading, error, searchResults, parsedFilters } = useSelector((state) => state.search);

  const [activeTab, setActiveTab] = useState('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [isReady, setIsReady] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [editableTags, setEditableTags] = useState([]);
  const [lastAddedTagId, setLastAddedTagId] = useState(null);
  const [showCandidates, setShowCandidates] = useState(false);
  const [candidates, setCandidates] = useState([]);

  // Clear any existing search results on component mount
  useEffect(() => {
    dispatch(clearSearchResults());
    setShowCandidates(false);
    setCandidates([]);
  }, [dispatch]);

  // Load search history when component mounts
  useEffect(() => {
    dispatch(getSearchHistory()).catch(error => {
      console.error('Error loading search history:', error);
    });
  }, [dispatch]);

  // Watch for parsedFilters changes to update isReady state and set editable tags
  useEffect(() => {
    if (parsedFilters) {
      setIsReady(true);
      // Convert parsedFilters to editable format
      const tags = [];
      if (parsedFilters.parsedFilters) {
        Object.entries(parsedFilters.parsedFilters).forEach(([key, value]) => {
          // Skip pagination fields
          if (key === 'page' || key === 'per_page') {
            return;
          }
          
          let displayText = '';
          if (Array.isArray(value)) {
            displayText = value.join(', ');
          } else if (typeof value === 'object' && value !== null) {
            displayText = Object.values(value).join(', ');
          } else {
            displayText = String(value);
          }
          
          // Only add tags that have meaningful content
          if (displayText && displayText.trim() !== '') {
            tags.push({ id: key, key, value: displayText, originalValue: value });
          }
        });
      }
      setEditableTags(tags);
      console.log('Tags from backend:', parsedFilters.parsedFilters);
    } else {
      setIsReady(false);
      setEditableTags([]);
    }
  }, [parsedFilters]);

  // Remove automatic search history loading
  // useEffect(() => {
  //   // Only load search history when user clicks on history or after first search
  //   if (!historyLoaded) {
  //     dispatch(getSearchHistory());
  //     setHistoryLoaded(true);
  //   }
  // }, [dispatch, historyLoaded]);

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
  };

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    dispatch(clearError());
    
    try {
      if (!isReady) {
        // First step: Parse the query
        const result = await dispatch(parseQuery(searchQuery));
        if (result.payload) {
          setIsReady(true);
        }
      } else {
        // Second step: Execute the search
        const searchResult = await dispatch(executeSearch(searchQuery));
        if (searchResult.payload) {
          // Show candidates after successful search
          setShowCandidates(true);
          setCandidates(searchResult.payload.data?.candidates || []);
        }
        setSearchQuery('');
        setIsReady(false);
        setEditableTags([]);
        dispatch(clearSearchResults()); // This will clear parsedFilters
        // Load updated search history after search
        dispatch(getSearchHistory());
      }
    } catch (error) {
      console.error('Error in search process:', error);
    }
  };

  const handleShowCandidates = () => {
    setShowCandidates(true);
  };

  const handleBackToSearch = () => {
    setShowCandidates(false);
    setCandidates([]);
    setActiveTab('search');
  };

  const handleAddTag = () => {
    const newTagId = Date.now();
    const newTag = { id: newTagId, key: 'custom', value: '', originalValue: '' };
    setEditableTags([...editableTags, newTag]);
    setLastAddedTagId(newTagId);
  };

  const handleRemoveTag = (tagId) => {
    setEditableTags(editableTags.filter(tag => tag.id !== tagId));
  };

  const handleTagChange = (tagId, newValue) => {
    setEditableTags(editableTags.map(tag => 
      tag.id === tagId ? { ...tag, value: newValue } : tag
    ));
  };

  const handleTagKeyDown = (e, tagId) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      // If the tag is empty, remove it
      const currentTag = editableTags.find(tag => tag.id === tagId);
      if (currentTag && currentTag.value.trim() === '') {
        handleRemoveTag(tagId);
      } else {
        // Just blur the input to complete editing
        e.target.blur();
      }
    }
  };

  useEffect(() => {
    if (lastAddedTagId) {
      const inputElement = document.getElementById(`tag-input-${lastAddedTagId}`);
      if (inputElement) {
        inputElement.focus();
        inputElement.select();
      }
      setLastAddedTagId(null);
    }
  }, [lastAddedTagId, editableTags]);

  const handleHistoryClick = (query) => {
    setSearchQuery(query);
    setIsReady(false);
    setEditableTags([]);
    setShowCandidates(false);
    setCandidates([]);
    dispatch(clearSearchResults());
  };

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  // Ensure searchHistory is an array
  const safeSearchHistory = Array.isArray(searchHistory) ? searchHistory : [];

  return (
    <div className="min-h-screen bg-white flex">
   

      {/* Left Sidebar */}
      <div className={`fixed left-0 h-full bg-white pt-2 transition-all duration-300 ease-in-out z-40 overflow-y-auto ${
        sidebarVisible ? 'w-64' : 'w-16'
      }`}>
        <div className={`${sidebarVisible ? 'px-4 pb-4' : 'px-2 pb-4'}`}>
          {/* Campaign Dashboard */}
          <div className='mb-5' style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <img src="/scout-ai-logo1.png" alt="Scout AI Logo" className="h-6" />
            <button 
              onClick={toggleSidebar}
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
          <div className={`${sidebarVisible ? 'block' : 'hidden'} mb-6 mt-8`}>
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

            {/* Search History */}
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {isLoading && safeSearchHistory.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-400">
                  Loading history...
                </div>
              ) : safeSearchHistory.length > 0 ? (
                safeSearchHistory.map((search, index) => (
                  <button
                    key={search.id || index}
                    onClick={() => handleHistoryClick(search.query || search)}
                    className="w-full text-left px-1 py-1.5 text-sm text-gray-600 hover:bg-gray-50 rounded truncate"
                    title={search.query || search} // Show full query on hover
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
          <div className={`${sidebarVisible ? 'block' : 'hidden'} mb-6`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <img src="/briefcase.svg" alt="Briefcase" className="w-4 h-4" />
                <span className="text-sm font-bold font-medium">Campaign</span>
              </div>
            </div>
            <button 
              className={`w-full flex items-center space-x-3 px-2 py-1 rounded-lg text-left bg-[#F1F1F1] `}
              onClick={() => setActiveTab('dashboard')}
            >
              <span className="font-medium">Campaign Details</span>
            </button>
          </div>

          {/* Collapsed Prompts Icon */}
          <div className={`${sidebarVisible ? 'hidden' : 'block'} mt-8`}>
            <div className="flex justify-center mb-2">
              <img src="/aisvg.svg" alt="Prompts" className="h-5 w-5" />
            </div>
          </div>

          {/* Collapsed Toggle Button */}
          <div className={`${sidebarVisible ? 'hidden' : 'block'} mt-8`}>
            <button 
              onClick={toggleSidebar}
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

      {/* Main Content Area */}
      <div className={`flex-1 pt-12 transition-all duration-300 ease-in-out ${
        sidebarVisible ? (showCandidates ? 'ml-80' : 'ml-64') : (showCandidates ? 'ml-80' : 'ml-16')
      }`}>
        
        {/* Lists Sidebar - Only show when in candidates view */}
        {showCandidates && (
          <div className={`fixed top-12 w-64 h-full bg-white border-r border-gray-200 z-10 overflow-y-auto transition-all duration-300 ease-in-out ${
            sidebarVisible ? 'left-64' : 'left-16'
          }`}>
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span className="text-sm font-bold font-medium">Lists</span>
                </div>
              </div>

              <div className="space-y-1">
                <button 
                  className="w-full flex items-center space-x-3 px-2 py-1 rounded-lg text-left bg-gray-800 text-white"
                  onClick={() => setActiveTab('longList')}
                >
                  <span className="font-medium">Long List</span>
                </button>
                <button 
                  className="w-full flex items-center space-x-3 px-2 py-1 rounded-lg text-left text-gray-600 hover:bg-gray-50"
                  onClick={() => setActiveTab('shortList')}
                >
                  <span className="font-medium">Short List</span>
                </button>
                <button 
                  className="w-full flex items-center space-x-3 px-2 py-1 rounded-lg text-left text-gray-600 hover:bg-gray-50"
                  onClick={() => setActiveTab('rejectedList')}
                >
                  <span className="font-medium">Rejected List</span>
                </button>
                <button 
                  className="w-full flex items-center space-x-3 px-2 py-1 rounded-lg text-left text-gray-600 hover:bg-gray-50"
                  onClick={() => setActiveTab('goldList')}
                >
                  <span className="font-medium">Gold List</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {!showCandidates && activeTab === 'search' && (
          <div className="max-w-4xl mx-auto px-8 py-35">
            {/* Scout AI Branding */}
            <div className="text-center mb-12 flex flex-col items-center justify-center">
            <img src="/scout-ai-logo.png" alt="" className='h-15' />
              <p className="text-gray-500 text-sm mt-4">Find exactly who you're looking for, just in seconds.</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="max-w-2xl mx-auto mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Search Input Section */}
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
               <img src="/ailogoBlack.svg" alt="" className='h-5' />
                  <h2 className="text-md font-semibold text-gray-900">What are you looking for?</h2>
                </div>
                <div className="flex space-x-2">
                <button className="flex items-center space-x-2 px-2 py-1 text-sm font-medium text-black-800 hover:text-gray-800 border border-gray-300 rounded-lg">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className='text-xs font-medium'>Add job description</span>
                  </button>
               
                </div>
              </div>

              {/* Search Input - Step 1 */}
              {!isReady && (
                <form onSubmit={handleSearchSubmit} className="relative">
                  <div className="relative">
                    <div className="rounded-2xl p-[2px] bg-gray-300 focus-within:bg-gradient-to-r focus-within:from-[#F54242] focus-within:to-[#1310B0] transition">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Find CTOs in New York with 5 years of experience"
                        className="w-full h-12 px-4 py-3 text-base rounded-2xl bg-white focus:outline-none border-none pr-12"
                        disabled={isLoading}
                      />
                    </div>
                    
                    <button
                      type="submit"
                      disabled={isLoading || !searchQuery.trim()}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-black rounded flex items-center justify-center hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* Search Review - Step 2 */}
              {isReady && (
                <div className="relative">
                  <div className="rounded-2xl p-[2px] bg-gradient-to-r from-[#F54242] to-[#1310B0]">
                    <div className="w-full bg-white rounded-2xl p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {/* Prompt Section */}
                          <div className="mb-4 flex flex-row" >
                            <span className='text-sm font-medium text-gray-1000'>Prompt:</span>
                            <p className="text-sm font-medium text-gray-600 ml-3 font-family-sans">{searchQuery}</p>
                          </div>
                          
                          {/* Filters Section */}
                          <div className='flex flex-row'>
                          <span className='text-sm font-medium text-gray-1000'>Filters:</span>
                            <div className="flex flex-wrap gap-2 items-center ml-4.5">
                                                             {editableTags.map((tag) => (
                                 <div key={tag.id} className="relative inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border group" style={{ backgroundColor: '#f4fff0', color: '#2c920a', borderColor: '#95d67f' }}>
                                   <input
                                     id={`tag-input-${tag.id}`}
                                     type="text"
                                     value={tag.value}
                                     onChange={(e) => handleTagChange(tag.id, e.target.value)}
                                     onKeyDown={(e) => handleTagKeyDown(e, tag.id)}
                                     className="bg-transparent border-none outline-none text-sm font-medium w-auto pr-6"
                                     style={{ color: '#2c920a', minWidth: '20px', width: `${Math.max(tag.value.length * 8, 60)}px` }}
                                     placeholder="Type and press Enter..."
                                   />
                                   <button
                                     type="button"
                                     onClick={() => handleRemoveTag(tag.id)}
                                     className="absolute -top-1 -right-1 w-4 h-4 bg-red-100 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-400"
                                   >
                                     <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                     </svg>
                                   </button>
                                 </div>
                               ))}
                                                             <button
                                 type="button"
                                 onClick={handleAddTag}
                                 className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border" 
                                 style={{ backgroundColor: '#f8f9fa', color: '#6c757d', borderColor: '#dee2e6' }}
                               >
                                 + Add tag
                               </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditableTags([]);
                                  setIsReady(false);
                                }}
                                className="text-sm text-black hover:text-gray-700 underline cursor-pointer"
                              >
                                Clear all
                              </button>
                            </div>
                          </div>
                        </div>
                        
                        {/* Send Button */}
                        <button
                          type="button"
                          onClick={handleSearchSubmit}
                          disabled={isLoading}
                          className="ml-4 w-8 h-8 bg-black rounded flex items-center justify-center hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                        >
                          {isLoading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Search Results Summary */}
              {searchResults && (
                <div className="mt-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <p className="text-sm font-medium text-green-800">
                        Search completed! Found {searchResults.totalResults || 0} candidates.
                      </p>
                    </div>
                    <p className="text-sm text-green-700 mt-1">
                      Check the sidebar lists to view your candidates.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div className="p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Campaign Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Active Campaigns</h3>
                <p className="text-3xl font-bold text-blue-600">12</p>
              </div>
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Candidates</h3>
                <p className="text-3xl font-bold text-green-600">1,247</p>
              </div>
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Emails Sent</h3>
                <p className="text-3xl font-bold text-purple-600">3,456</p>
              </div>
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Response Rate</h3>
                <p className="text-3xl font-bold text-orange-600">23%</p>
              </div>
            </div>
          </div>
        )}
        
        {showCandidates && (
          <CandidatesList 
            candidates={candidates} 
            searchQuery={searchQuery}
            onBackToSearch={handleBackToSearch}
          />
        )}
      </div>
    </div>
  );
};

export default Dashboard; 