import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import candidateAPI from '../services/candidateAPI';

const CandidatesList = ({ candidates, searchQuery, onBackToSearch, listType, searchId, onCandidatesUpdate, showLoadingModal, setShowLoadingModal }) => {
  // Get sidebar state from global store
  const { sidebarVisible } = useSelector((state) => state.ui);
  console.log('CandidatesList received props:', { 
    candidatesCount: candidates?.length || 0, 
    searchQuery, 
    listType, 
    searchId, 
    sidebarVisible 
  });
  const [selectedCandidates, setSelectedCandidates] = useState([]);
  const [bulkSelectMode, setBulkSelectMode] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [filterLoading, setFilterLoading] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [hasFilteredCandidates, setHasFilteredCandidates] = useState(false);
  const [isLoadingFilterStatus, setIsLoadingFilterStatus] = useState(true);

  // Helper function to safely extract candidate data
  const getCandidateData = (candidate) => {
    if (!candidate || typeof candidate !== 'object') {
      return {
        id: 'unknown',
        name: 'Unknown',
        jobTitle: 'Unknown',
        email: 'unknown@example.com',
        company: 'Unknown',
        workHistory: 'Unknown',
        linkedinUrl: '#',
        githubUrl: '#',
        twitterUrl: '#',
        location: 'Unknown',
        seniority: 'Unknown',
        headline: 'Unknown',
        qualityTags: []
      };
    }

    return {
      id: candidate.id || candidate._id || 'unknown',
      name: candidate.name || 'Unknown',
      jobTitle: candidate.jobTitle || candidate.title || 'Unknown',
      email: candidate.email || 'unknown@example.com',
      company: candidate.company || candidate.organization_name || 'Unknown',
      workHistory: candidate.workHistory ? 
        (Array.isArray(candidate.workHistory) ? 
          `${candidate.workHistory.length} positions` : 
          'Experience available') : 
        'No experience data',
      linkedinUrl: candidate.linkedinUrl || candidate.linkedin_url || '#',
      githubUrl: candidate.githubUrl || candidate.github_url || '#',
      twitterUrl: candidate.twitterUrl || candidate.twitter_url || '#',
      location: candidate.location || 'Unknown',
      seniority: candidate.seniority || 'Unknown',
      headline: candidate.headline || candidate.jobTitle || 'Unknown',
      companyWebsite: candidate.companyWebsite || candidate.company_website || null,
      companyLinkedin: candidate.companyLinkedin || candidate.company_linkedin || null,
      departments: candidate.departments || [],
      functions: candidate.functions || [],
      intentStrength: candidate.intentStrength || candidate.intent_strength || null,
      aiScore: candidate.aiScore || candidate.ai_score || null,
      qualityTags: candidate.qualityTags || candidate.quality_tags || []
    };
  };

  // Use only real candidates data
  const displayCandidates = candidates || [];

  // Load AI filter status from backend
  useEffect(() => {
    const loadAIFilterStatus = async () => {
      if (!searchId) return;
      
      try {
        setIsLoadingFilterStatus(true);
        const response = await candidateAPI.getAIFilterStatus(searchId);
        
        if (response.status === 'success') {
          setHasFilteredCandidates(response.data.aiFilterExecuted);
        }
      } catch (error) {
        console.error('Error loading AI filter status:', error);
        // Default to false if there's an error
        setHasFilteredCandidates(false);
      } finally {
        setIsLoadingFilterStatus(false);
      }
    };

    loadAIFilterStatus();
  }, [searchId]);

  // Get list type display name
  const getListDisplayName = (type) => {
    const displayNames = {
      'long-list': 'Long List',
      'short-list': 'Short List',
      'golden-list': 'Golden List',
      'rejected': 'Rejected List'
    };
    return displayNames[type] || 'Long List';
  };

  const handleSelectCandidate = (candidateId) => {
    if (selectedCandidates.includes(candidateId)) {
      const newSelected = selectedCandidates.filter(id => id !== candidateId);
      setSelectedCandidates(newSelected);
    } else {
      const newSelected = [...selectedCandidates, candidateId];
      setSelectedCandidates(newSelected);
    }
  };

  const handleSelectAll = () => {
    if (selectedCandidates.length === displayCandidates.length) {
      setSelectedCandidates([]);
    } else {
      setSelectedCandidates(displayCandidates.map(candidate => getCandidateData(candidate).id));
    }
  };

  const handleBulkSelectToggle = () => {
    if (bulkSelectMode) {
      // If in bulk select mode, execute move to short list
      handleMoveToShortList();
    } else {
      // Enter bulk select mode
      setBulkSelectMode(true);
      setSelectedCandidates([]);
    }
  };

  const handleCancelBulkSelect = () => {
    setBulkSelectMode(false);
    setSelectedCandidates([]);
  };

  const handleMoveToShortList = async () => {
    if (selectedCandidates.length === 0) {
      alert('Please select candidates first');
      return;
    }

    setBulkActionLoading(true);
    setShowLoadingModal(true);

    try {
      const response = await candidateAPI.bulkMoveToShortlist(
        selectedCandidates,
        `Bulk moved to Short List from ${getListDisplayName(listType)}`
      );

      if (response.status === 'success') {
        // Remove selected candidates from the current list
        const updatedCandidates = displayCandidates.filter(
          candidate => !selectedCandidates.includes(getCandidateData(candidate).id)
        );
        if (onCandidatesUpdate) {
          onCandidatesUpdate(updatedCandidates);
        }
        
        // Reset bulk select mode
        setSelectedCandidates([]);
        setBulkSelectMode(false);
        
        // Show success message
        alert(`Successfully moved ${selectedCandidates.length} candidates to Short List`);
      }
    } catch (error) {
      console.error('Error moving candidates to short list:', error);
      alert('Failed to move candidates to Short List. Please try again.');
    } finally {
      setBulkActionLoading(false);
      setShowLoadingModal(false);
    }
  };

  const handleFilterCandidates = async () => {
    if (!searchId) {
      alert('Search ID is required for filtering candidates');
      return;
    }

    setFilterLoading(true);
    setShowFilterModal(true);
    setShowLoadingModal(true); // Add this line to trigger the overlay

    try {
      const response = await candidateAPI.filterCandidates(searchId);
      
      if (response.status === 'success') {
        // Mark that candidates have been filtered
        setHasFilteredCandidates(true);
        
        // Show success message
        alert(`AI filtering completed! ${response.data.shortListCount} candidates shortlisted from ${response.data.longListCount}.`);
        
        // Optionally refresh the page or update the candidates list
        // You might want to redirect to the short list or refresh the current list
        window.location.reload();
      }
    } catch (error) {
      console.error('Error filtering candidates:', error);
      alert('Failed to filter candidates. Please try again.');
    } finally {
      setFilterLoading(false);
      setShowFilterModal(false);
      setShowLoadingModal(false); // Add this line to hide the overlay
    }
  };

  const handleAcceptCandidate = async (candidateId) => {
    try {
      const response = await candidateAPI.updateCandidateStatus(
        candidateId, 
        'ACCEPT', 
        'GOLDEN_LIST', 
        'Accepted from Short List'
      );
      if (response.status === 'success') {
        // Remove candidate from current list
        const updatedCandidates = displayCandidates.filter(
          candidate => getCandidateData(candidate).id !== candidateId
        );
        if (onCandidatesUpdate) {
          onCandidatesUpdate(updatedCandidates);
        }
        alert('Candidate accepted and moved to Golden List successfully!');
      }
    } catch (error) {
      console.error('Error accepting candidate:', error);
      alert('Failed to accept candidate. Please try again.');
    }
  };

  const handleRejectCandidate = async (candidateId) => {
    try {
      const response = await candidateAPI.updateCandidateStatus(
        candidateId, 
        'REJECT', 
        'REJECTED', 
        'Rejected from Short List'
      );
      if (response.status === 'success') {
        // Remove candidate from current list
        const updatedCandidates = displayCandidates.filter(
          candidate => getCandidateData(candidate).id !== candidateId
        );
        if (onCandidatesUpdate) {
          onCandidatesUpdate(updatedCandidates);
        }
        alert('Candidate rejected and moved to Rejected List successfully!');
      }
    } catch (error) {
      console.error('Error rejecting candidate:', error);
      alert('Failed to reject candidate. Please try again.');
    }
  };

  // Render quality tags
  const renderQualityTags = (tags) => {
    if (!tags || tags.length === 0) {
      return <span className="text-xs text-gray-400">No tags</span>;
    }
    
    return (
      <div className="flex flex-wrap gap-1">
        {tags.slice(0, 2).map((tag, index) => (
          <span 
            key={index}
            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
            style={{
              backgroundColor: '#ececec',
              color: '#7A7A7A',
              border: '1.06px solid #C0C0C033'
            }}
          >
            {tag}
            {index === 0 && tags.length > 1 && <span className="ml-1" style={{ color: '#7A7A7A' }}>+{tags.length - 1}</span>}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="w-full h-full bg-white pr-6">
      <style>{`
        .spinner {
          width: 80px;
          height: 80px;
          position: relative;
        }
        
        .rotate-135 {
          transform: rotate(135deg);
        }
        
        .rotate-45 {
          transform: rotate(45deg);
        }
        
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
        
        .animate-spin {
          animation: spin 1.5s linear infinite;
        }
      `}</style>
      <div className="h-full overflow-y-auto pt-16" >
      {/* Header */}
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-medium text-gray-900" data-search-query>{searchQuery} ({getListDisplayName(listType)})</h2>
            </div>
            <div className="flex items-center space-x-2 pr-2">
             
              
              {/* Only show bulk actions for non-short-list */}
              {listType == 'long-list' && !hasFilteredCandidates && !isLoadingFilterStatus && (
                <>
                 <button 
                onClick={handleFilterCandidates}
                disabled={filterLoading || !searchId || displayCandidates.length === 0}
                className="px-2 py-1 bg-gradient-to-r from-[#F54242] to-[#1310B0] text-white rounded text-xs font-medium hover:opacity-90 transition-opacity flex items-center space-x-2 gap-x-1 disabled:opacity-50"
              >
                <span><img className='' src="/filterCandidates.svg" alt="" /></span> 
                {filterLoading ? 'Filtering...' : 'Filter Candidates'}
              </button>
                  {bulkSelectMode ? (
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={handleBulkSelectToggle}
                        disabled={selectedCandidates.length === 0 || bulkActionLoading}
                        className="px-2 bg-white text-black rounded text-xs font-medium hover:opacity-90 transition-opacity flex items-center space-x-2 gap-x-1 disabled:opacity-50 border border-black-200"
                        style={{ paddingTop: '5.5px',paddingBottom: '5.5px' }}
                      >
                        <span><img className='' src="/shortList.svg" alt="" /></span> 
                        {bulkActionLoading ? 'Moving...' : `Move to Short List (${selectedCandidates.length})`}
                      </button>
                      <button 
                        onClick={handleCancelBulkSelect}
                        className="py-2 bg-[#F1F1F1] text-black rounded text-xs font-extrabold hover:opacity-90 transition-opacity"
                      style={{paddingLeft: '14px',paddingRight: '14px'}}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={handleBulkSelectToggle}
                      className="px-2 py-1 bg-[#F1F1F1] text-black rounded text-xs font-medium hover:opacity-90 transition-opacity flex items-center space-x-2 gap-x-1"
                    >
                      <span><img className='' src="/bulkSelect.svg" alt="" /></span> Bulk Select
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

      

        {/* Simple Table with Visible Lines */}
        <div className="bg-white border-t border-b border-gray-100 overflow-hidden">
          <table className="w-full border-collapse">
            <thead className="bg-white">
              <tr>
                {bulkSelectMode && listType !== 'short-list' && (
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-900 border-b border-r border-gray-100 w-12">
                  <input
                    type="checkbox"
                    checked={selectedCandidates.length === displayCandidates.length && displayCandidates.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </th>
                )}
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-900 border-b border-r border-gray-100">Name</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-900 border-b border-r border-gray-100">Job title</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-900 border-b border-r border-gray-100">Email</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-900 border-b border-r border-gray-100">Company</th>
                {listType !== 'short-list' && (
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-900 border-b border-r border-gray-100">Work History</th>
                )}
                {listType !== 'long-list' && (
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-900 border-b border-r border-gray-100">Quality Tag</th>
                )}
                {listType === 'short-list' && (
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-900 border-b border-gray-100">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {displayCandidates.length > 0 ? (
                displayCandidates.map((candidate, index) => {
                  const candidateData = getCandidateData(candidate);
                  return (
                    <tr key={candidateData.id || index} className="hover:bg-gray-50">
                      {bulkSelectMode && listType !== 'short-list' && (
                        <td className="px-3 py-2 border-b border-r border-gray-100 w-12">
                        <input
                          type="checkbox"
                            checked={selectedCandidates.includes(candidateData.id)}
                            onChange={() => handleSelectCandidate(candidateData.id)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </td>
                      )}
                      <td className="px-3 py-2 border-b border-r border-gray-100">
                        <div className="flex items-center justify-between">
                          <span 
                            className={`text-xs text-gray-900 ${bulkSelectMode ? 'cursor-pointer hover:text-blue-600' : ''}`}
                            onClick={bulkSelectMode ? () => handleSelectCandidate(candidateData.id) : undefined}
                          >
                            {candidateData.name}
                          </span>
                          <div className="flex space-x-1">
                            <a href={candidateData.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-600">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                              </svg>
                            </a>
                            <a href={candidateData.githubUrl} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-600">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                              </svg>
                            </a>
                            <a href={candidateData.twitterUrl} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-400">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                              </svg>
                            </a>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-900 border-b border-r border-gray-100">{candidateData.jobTitle}</td>
                      <td className="px-3 py-2 text-xs text-gray-900 border-b border-r border-gray-100">{candidateData.email}</td>
                      <td className="px-3 py-2 text-xs text-gray-900 border-b border-r border-gray-100">{candidateData.company}</td>
                      {listType !== 'short-list' && (
                        <td className="px-3 py-2 text-xs text-gray-900 border-b border-r border-gray-100">{candidateData.workHistory}</td>
                      )}
                      {listType !== 'long-list' && (
                        <td className="px-3 py-2 text-xs text-gray-900 border-b border-r border-gray-100">
                          {renderQualityTags(candidateData.qualityTags)}
                      </td>
                      )}
                      {listType === 'short-list' && (
                        <td className="px-3 py-2 border-b border-gray-100">
                          <div className="flex items-center space-x-2">
                            {sidebarVisible ? (
                              <>
                              
                                <button
                                  onClick={() => handleRejectCandidate(candidateData.id)}
                                  className="w-6 h-5 bg-[#F54242] text-white rounded-sm flex items-center justify-center hover:bg-red-600 transition-colors"
                                  title="Reject"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleAcceptCandidate(candidateData.id)}
                                  className="w-6 h-5 bg-[#29A101] text-white rounded-sm flex items-center justify-center hover:bg-green-600 transition-colors"
                                  title="Accept"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleRejectCandidate(candidateData.id)}
                                  className="px-2 py-1 bg-[#F54242] text-white rounded text-xs font-medium hover:bg-red-600 transition-colors"
                                >
                                  Reject
                                </button>
                                <button
                                  onClick={() => handleAcceptCandidate(candidateData.id)}
                                  className="px-2 py-1 bg-[#29A101] text-white rounded text-xs font-medium hover:bg-green-600 transition-colors"
                                >
                                  Accept
                                </button>
                              
                              </>
                            )}
                        </div>
                      </td>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={(() => {
                    let count = bulkSelectMode ? 1 : 0; // Checkbox column
                    count += 4; // Name, Job title, Email, Company
                    if (listType !== 'short-list') count += 1; // Work History
                    if (listType !== 'long-list') count += 1; // Quality Tag
                    if (listType === 'short-list') count += 1; // Actions
                    return count;
                  })()} className="px-6 py-12 text-center text-gray-500 border-b border-gray-100">
                    <div className="flex flex-col items-center">
                      <svg className="w-12 h-12 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <p className="text-lg font-medium">No candidates found in {getListDisplayName(listType)}</p>
                      <p className="text-sm">
                        {listType === 'long-list' 
                          ? 'Try running a new search to find candidates' 
                          : listType === 'short-list'
                          ? 'No candidates have been shortlisted yet'
                          : listType === 'golden-list'
                          ? 'No candidates have been accepted yet'
                          : 'No candidates have been rejected yet'
                        }
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

   

      {/* Loading Modal for AI Filtering */}
    {/* Loading Modal for AI Filtering */}
    {showFilterModal && (
  <div className="fixed top-0 bottom-0 right-[10%] top-[25%] overflow-y-auto h-full z-50">
    <div className="bg-white rounded-2xl p-8 w-[40vw] h-[36vh] mx-4 shadow-xl">
      <div className="flex flex-col items-center">
        {/* Circular Loader */}
        <div className="relative w-15 h-15 mb-5">
          {/* Red arc (outer circle) */}
          <div 
            className="absolute inset-0 rounded-full border-3 border-transparent animate-spin"
            style={{
              borderTopColor: '#ef4444',
              borderRightColor: '#ef4444', 
              borderLeftColor: '#ef4444',
              borderBottomColor: 'transparent',
              animationDuration: '1.5s'
            }}
          />
          {/* Blue arc (inner circle) */}
          <div 
            className="absolute inset-2 rounded-full border-transparent animate-spin"
            style={{
              borderTopColor: '#4338ca',
              borderRightColor: '#4338ca',
              borderBottomColor: '#4338ca', 
              borderLeftColor: 'transparent',
              borderWidth: '3px',
              animationDuration: '1.5s'
            }}
          />
        </div>
        <h2 className="text-lg font-medium text-gray-700 mb-5">Please wait</h2>
        <p className="text-sm text-gray-500 text-center leading-relaxed">
          While we are shifting ideal candidates to Short List
        </p>
      </div>
    </div>
  </div>
)}


    </div>
  );
};

export default CandidatesList; 