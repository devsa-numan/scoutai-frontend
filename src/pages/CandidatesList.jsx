import React, { useState } from 'react';

const CandidatesList = ({ candidates, searchQuery, onBackToSearch }) => {
  const [selectedCandidates, setSelectedCandidates] = useState([]);
  const [bulkSelect, setBulkSelect] = useState(false);

  // Sample data for testing when no candidates are provided
  const sampleCandidates = [
    {
      id: 1,
      name: 'Martin Kim',
      jobTitle: 'CTO',
      email: 'martinkimwell@gmail.com',
      company: 'insitro',
      workHistory: '3 years',
      linkedinUrl: 'https://linkedin.com/in/martinkim',
      githubUrl: 'https://github.com/martinkim',
      twitterUrl: 'https://twitter.com/martinkim'
    },
    {
      id: 2,
      name: 'Sarah Johnson',
      jobTitle: 'CTO',
      email: 'sarah.johnson@techcorp.com',
      company: 'TechCorp',
      workHistory: '5 years',
      linkedinUrl: 'https://linkedin.com/in/sarahjohnson',
      githubUrl: 'https://github.com/sarahjohnson',
      twitterUrl: 'https://twitter.com/sarahjohnson'
    },
    {
      id: 3,
      name: 'Michael Chen',
      jobTitle: 'CTO',
      email: 'michael.chen@startup.io',
      company: 'StartupIO',
      workHistory: '4 years',
      linkedinUrl: 'https://linkedin.com/in/michaelchen',
      githubUrl: 'https://github.com/michaelchen',
      twitterUrl: 'https://twitter.com/michaelchen'
    }
  ];

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
        headline: 'Unknown'
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

  // Use sample data if no candidates are provided (for testing)
  const displayCandidates = candidates && candidates.length > 0 ? candidates : sampleCandidates;

  const handleSelectCandidate = (candidateId) => {
    if (selectedCandidates.includes(candidateId)) {
      setSelectedCandidates(selectedCandidates.filter(id => id !== candidateId));
    } else {
      setSelectedCandidates([...selectedCandidates, candidateId]);
    }
  };

  const handleBulkSelect = () => {
    if (bulkSelect) {
      setSelectedCandidates([]);
    } else {
      setSelectedCandidates(displayCandidates.map(candidate => candidate.id));
    }
    setBulkSelect(!bulkSelect);
  };

  const handleSelectAll = () => {
    if (selectedCandidates.length === displayCandidates.length) {
      setSelectedCandidates([]);
    } else {
      setSelectedCandidates(displayCandidates.map(candidate => candidate.id));
    }
  };

  return (
    <div className="flex-1 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-900">
            {searchQuery} (Long List)
          </h1>
        </div>
        <div className="flex items-center space-x-3">
          <button className="px-4 py-2 bg-gradient-to-r from-red-500 to-purple-600 text-white rounded-lg font-medium hover:opacity-90 transition-opacity">
            Filter Candidate
          </button>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={bulkSelect}
              onChange={handleBulkSelect}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Bulk Select</span>
          </label>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedCandidates.length === displayCandidates.length && displayCandidates.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Job title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Work History
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {displayCandidates.length > 0 ? (
                displayCandidates.map((candidate, index) => {
                  const candidateData = getCandidateData(candidate);
                  return (
                    <tr key={candidateData.id || index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedCandidates.includes(candidateData.id || index)}
                          onChange={() => handleSelectCandidate(candidateData.id || index)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-medium text-gray-900">
                            {candidateData.name}
                          </span>
                          <div className="flex space-x-1">
                            <a href={candidateData.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-600">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                              </svg>
                            </a>
                            <a href={candidateData.githubUrl} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-600">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                              </svg>
                            </a>
                            <a href={candidateData.twitterUrl} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-400">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                              </svg>
                            </a>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {candidateData.jobTitle}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {candidateData.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {candidateData.company}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {candidateData.workHistory}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button className="text-blue-600 hover:text-blue-900">View</button>
                          <button className="text-green-600 hover:text-green-900">Shortlist</button>
                          <button className="text-red-600 hover:text-red-900">Reject</button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <svg className="w-12 h-12 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <p className="text-lg font-medium">No candidates found</p>
                      <p className="text-sm">Try adjusting your search criteria</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {displayCandidates.length > 0 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {displayCandidates.length} of {displayCandidates.length} candidates
          </div>
          <div className="flex items-center space-x-2">
            <button className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
              Previous
            </button>
            <span className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md">
              1
            </span>
            <button className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidatesList; 