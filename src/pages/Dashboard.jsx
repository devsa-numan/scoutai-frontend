import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { executeSearch, clearError, clearSearchResults, parseQuery } from '../store/slices/searchSlice';
import { setSidebarVisible } from '../store/slices/uiSlice';
import CandidatesList from './CandidatesList';
import { Sidebar } from '../components';

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { searchHistory, isLoading, error, searchResults, parsedFilters } = useSelector((state) => state.search);

  const [activeTab, setActiveTab] = useState('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [isReady, setIsReady] = useState(false);
  const [editableTags, setEditableTags] = useState([]);
  const [lastAddedTagId, setLastAddedTagId] = useState(null);
  const [showCandidates, setShowCandidates] = useState(false);
  const [candidates, setCandidates] = useState([]);
  
  // Get sidebar state from global store
  const { sidebarVisible } = useSelector((state) => state.ui);

  // Clear any existing search results on component mount
  useEffect(() => {
    dispatch(clearSearchResults());
    setShowCandidates(false);
    setCandidates([]);
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
          // Get the search ID from the response
          const searchId = searchResult.payload.data?.searchId || searchResult.payload.data?.id;
          console.log('Search completed, search ID:', searchId);
          
          // Navigate to the long list for this search
          if (searchId) {
            navigate(`/list-management/${searchId}/long-list`);
          } else {
            // Fallback: show candidates in dashboard
            setShowCandidates(true);
            setCandidates(searchResult.payload.data?.candidates || []);
          }
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





  return (
    <div className="min-h-screen bg-white flex">
   

      {/* Left Sidebar */}
      <Sidebar 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        setSearchQuery={setSearchQuery}
        setIsReady={setIsReady}
        setEditableTags={setEditableTags}
        setShowCandidates={setShowCandidates}
        setCandidates={setCandidates}
        onSidebarToggle={(visible) => dispatch(setSidebarVisible(visible))}
        currentSearchId={null}
      />

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
                  onClick={() => {
                    // This will be handled by the ListManagement component
                    console.log('Long List button clicked in dashboard');
                  }}
                >
                  <span className="font-medium">Long List</span>
                </button>
                <button 
                  className="w-full flex items-center space-x-3 px-2 py-1 rounded-lg text-left text-gray-600 hover:bg-gray-50"
                  onClick={() => {
                    // This will be handled by the ListManagement component
                    console.log('Short List button clicked in dashboard');
                  }}
                >
                  <span className="font-medium">Short List</span>
                </button>
                <button 
                  className="w-full flex items-center space-x-3 px-2 py-1 rounded-lg text-left text-gray-600 hover:bg-gray-50"
                  onClick={() => {
                    // This will be handled by the ListManagement component
                    console.log('Rejected List button clicked in dashboard');
                  }}
                >
                  <span className="font-medium">Rejected List</span>
                </button>
                <button 
                  className="w-full flex items-center space-x-3 px-2 py-1 rounded-lg text-left text-gray-600 hover:bg-gray-50"
                  onClick={() => {
                    // This will be handled by the ListManagement component
                    console.log('Gold List button clicked in dashboard');
                  }}
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
                            <p className="text-sm font-medium text-gray-600 ml-3">{searchQuery}</p>
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
            onCandidatesUpdate={setCandidates}
          />
        )}
      </div>
    </div>
  );
};

export default Dashboard; 