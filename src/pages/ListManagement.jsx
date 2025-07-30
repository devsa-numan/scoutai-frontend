import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { setSidebarVisible } from '../store/slices/uiSlice';
import CandidatesList from './CandidatesList';
import candidateAPI from '../services/candidateAPI';
import { Sidebar } from '../components';

const ListManagement = () => {
  const { searchId, listType = 'long-list' } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { searchHistory } = useSelector((state) => state.search);

  const [candidates, setCandidates] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastListType, setLastListType] = useState(null);
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  
  // State variables for Sidebar component
  const [activeTab, setActiveTab] = useState('list-management');
  const [isReady, setIsReady] = useState(false);
  const [editableTags, setEditableTags] = useState([]);
  const [showCandidates, setShowCandidates] = useState(false);
  
  // Get sidebar state from global store
  const { sidebarVisible } = useSelector((state) => state.ui);

  // Map list type to status
  const statusMap = {
    'long-list': 'LONG_LIST',
    'short-list': 'SHORT_LIST',
    'golden-list': 'GOLDEN_LIST',
    'rejected': 'REJECTED'
  };

  useEffect(() => {
    console.log('ListManagement mounted with searchId:', searchId, 'listType:', listType);
    
    // Force refresh if list type changed (to ensure fresh data after candidate moves)
    const shouldForceRefresh = lastListType && lastListType !== listType;
    console.log(`List type changed from ${lastListType} to ${listType}, forceRefresh: ${shouldForceRefresh}`);
    
    loadCandidates(shouldForceRefresh);
    loadSearchQuery();
    
    // Update last list type
    setLastListType(listType);
  }, [searchId, listType]);

  const loadCandidates = async (forceRefresh = false) => {
    console.log('Loading candidates for searchId:', searchId, 'listType:', listType, 'forceRefresh:', forceRefresh);
    setIsLoading(true);
    setError(null);
    
    try {
      const status = statusMap[listType] || 'LONG_LIST';
      console.log('Mapped status:', status);

      // Use Apollo cache to get candidates (with option to force refresh)
      const result = forceRefresh 
        ? await candidateAPI.getCandidatesByStatusForceRefresh(searchId, status)
        : await candidateAPI.getCandidatesByStatus(searchId, status);
      
      console.log('API result:', result);

      if (result.data && result.data.candidates) {
        setCandidates(result.data.candidates);
        console.log(`Loaded ${result.data.candidates.length} candidates from ${result.fromCache ? 'cache' : 'API'}`);
      } else {
        setCandidates([]);
        console.log('No candidates found in result');
      }
    } catch (error) {
      console.error('Error loading candidates:', error);
      setError('Failed to load candidates. Please try again.');
      setCandidates([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSearchQuery = async () => {
    try {
      console.log('Loading search query for searchId:', searchId);
      // Get search details from API
      const response = await candidateAPI.getSearch(searchId);
      console.log('Search API response:', response);
      
      if (response.data && response.data.search) {
        const search = response.data.search;
        console.log('Search data:', search);
        // Use shortPrompt if available, otherwise use the original query
        const query = search.shortPrompt || search.query || '';
        console.log('Setting search query to:', query);
        setSearchQuery(query);
        
        // If no shortPrompt is available, try to update it
        if (!search.shortPrompt && search.originalQuery) {
          console.log('No shortPrompt found, attempting to update...');
          try {
            await candidateAPI.updateShortPrompts();
            console.log('Short prompts updated successfully');
            // Reload the search query after update
            setTimeout(() => loadSearchQuery(), 1000);
          } catch (updateError) {
            console.error('Failed to update short prompts:', updateError);
          }
        }
      } else {
        console.log('No search data found in response');
      }
    } catch (error) {
      console.error('Error loading search query:', error);
      // Fallback to search history
      if (searchHistory && searchHistory.length > 0) {
        const search = searchHistory.find(s => s.id === searchId);
        if (search) {
          console.log('Found search in history:', search);
          setSearchQuery(search.query || search.shortPrompt || '');
        }
      }
    }
  };

  const handleBackToSearch = () => {
    navigate('/dashboard');
  };

  const getListTypeDisplayName = (type) => {
    const displayNames = {
      'long-list': 'Long List',
      'short-list': 'Short List',
      'golden-list': 'Golden List',
      'rejected': 'Rejected'
    };
    return displayNames[type] || 'Long List';
  };

  const getListTypeColor = (type) => {
    const colors = {
      'long-list': 'text-blue-600',
      'short-list': 'text-green-600',
      'golden-list': 'text-yellow-600',
      'rejected': 'text-red-600'
    };
    return colors[type] || 'text-blue-600';
  };

  const handleListTypeChange = (newListType) => {
    // Force refresh when changing list types to ensure fresh data
    console.log(`Changing list type from ${listType} to ${newListType}, will force refresh`);
    navigate(`/list-management/${searchId}/${newListType}`);
  };

  const handleRefreshCandidates = () => {
    console.log('Manual refresh requested');
    loadCandidates(true); // Force refresh
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600">Loading candidates...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden">
      <style>{`
        .scrollbar-hide {
          -ms-overflow-style: none;  /* Internet Explorer 10+ */
          scrollbar-width: none;  /* Firefox */
        }
        .scrollbar-hide::-webkit-scrollbar { 
          display: none;  /* Safari and Chrome */
        }
      `}</style>
      {/* Main Sidebar */}
      <Sidebar 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        setSearchQuery={setSearchQuery}
        setIsReady={setIsReady}
        setEditableTags={setEditableTags}
        setShowCandidates={setShowCandidates}
        setCandidates={setCandidates}
        onSidebarToggle={(visible) => dispatch(setSidebarVisible(visible))}
        currentSearchId={searchId}
      />

      {/* Lists Sidebar */}
      <div className={`fixed w-50 h-full pt-12 bg-[#F8F8F8] border-ro border-l border-gray-200 z-30 overflow-y-auto transition-all duration-300 ease-in-out scrollbar-hide ${
        sidebarVisible ? 'left-60' : 'left-16'
      }`}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-2">
            
              <span style={{fontWeight: '600'}} className="text-sm font-bold font-gray-900 font-medium">Lists</span>
            </div>
          
          </div>

          <div className="space-y-1">
            <button 
              className={`w-full flex items-center text-sm space-x-3 px-2 py-1 rounded-sm text-left ${
                listType === 'long-list' 
                  ? 'bg-gray-800 text-white' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              onClick={() => handleListTypeChange('long-list')}
            >
              <img 
                src="/LongList.svg" 
                alt="Long List" 
                className={`w-4 h-4 ${listType === 'long-list' ? 'filter brightness-0 invert' : ''}`}
              />
              <span className={listType === 'long-list' ? 'font-medium' : 'font-normal'}>Long List</span>
            </button>
            <button 
              className={`w-full flex items-center text-sm space-x-3 px-2 py-1 rounded-lg text-left ${
                listType === 'short-list' 
                  ? 'bg-gray-800 text-white' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              onClick={() => handleListTypeChange('short-list')}
            >
              <img 
                src="/shortList.svg" 
                alt="Short List" 
                className={`w-4 h-4 ${listType === 'short-list' ? 'filter brightness-0 invert' : ''}`}
              />
              <span className={listType === 'short-list' ? 'font-medium' : 'font-normal'}>Short List</span>
            </button>
            <button 
              className={`w-full flex items-center text-sm space-x-3 px-2 py-1 rounded-lg text-left ${
                listType === 'golden-list' 
                  ? 'bg-gray-800 text-white' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              onClick={() => handleListTypeChange('golden-list')}
            >
              <img 
                src="/goldList.svg" 
                alt="Golden List" 
                className={`w-4 h-4 ${listType === 'golden-list' ? 'filter brightness-0 invert' : ''}`}
              />
              <span className={listType === 'golden-list' ? 'font-medium' : 'font-normal'}>Golden List</span>
            </button>
            <button 
              className={`w-full flex items-center space-x-3 px-2 text-sm py-1 rounded-lg text-left ${
                listType === 'rejected' 
                  ? 'bg-gray-800 text-white' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              onClick={() => handleListTypeChange('rejected')}
            >
              <img 
                src="/RejectedList.svg" 
                alt="Rejected List" 
                className={`w-4 h-4 ${listType === 'rejected' ? 'filter brightness-0 invert' : ''}`}
              />
              <span className={listType === 'rejected' ? 'font-medium' : 'font-normal'}>Rejected</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`flex-1 h-full flex flex-col transition-all duration-300 ease-in-out ${
        sidebarVisible ? 'ml-[29rem]' : 'ml-70'
      }`}>

  {/* Overlay - Show if showLoadingModal is true */}
  {showLoadingModal && (
 <div
 className={`fixed inset-0 bg-black opacity-50 z-40 transition-all duration-300 ease-in-out ${
   sidebarVisible ? 'ml-[27.5rem]' : 'ml-67'
 }`}
/>

  )}

  {/* Header */}
  
  {/* Error Message */}
  {error && (
    <div className="flex-shrink-0 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg m-6">
      {error}
    </div>
  )}

  {/* Candidates List */}
  <div className="flex-1 overflow-hidden">
    <CandidatesList 
      candidates={candidates} 
      searchQuery={searchQuery}
      onBackToSearch={handleBackToSearch}
      listType={listType}
      searchId={searchId}
      onCandidatesUpdate={setCandidates}
      showLoadingModal={showLoadingModal}
      setShowLoadingModal={setShowLoadingModal}
    />
  </div>
</div>

    </div>
  );
};

export default ListManagement; 