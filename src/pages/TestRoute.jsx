import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const TestRoute = () => {
  const { searchId, listType } = useParams();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-4">Route Test Page</h1>
        
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">URL Parameters:</h2>
          <div className="bg-gray-50 p-4 rounded">
            <p><strong>Search ID:</strong> {searchId}</p>
            <p><strong>List Type:</strong> {listType}</p>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Test Navigation:</h2>
          <div className="space-x-2">
            <button
              onClick={() => navigate('/list-management/test-123/long-list')}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Test Long List
            </button>
            <button
              onClick={() => navigate('/list-management/test-456/short-list')}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Test Short List
            </button>
            <button
              onClick={() => navigate('/list-management/test-789/golden-list')}
              className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
            >
              Test Golden List
            </button>
            <button
              onClick={() => navigate('/list-management/test-999/rejected')}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Test Rejected
            </button>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Navigation:</h2>
          <div className="space-x-2">
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Back to Dashboard
            </button>
            <button
              onClick={() => navigate('/list-management/actual-search-id/long-list')}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              Go to Actual List Management
            </button>
          </div>
        </div>

        <div className="text-sm text-gray-600">
          <p>This page helps verify that the routing is working correctly.</p>
          <p>If you can see this page, the route parameters are being passed correctly.</p>
        </div>
      </div>
    </div>
  );
};

export default TestRoute; 