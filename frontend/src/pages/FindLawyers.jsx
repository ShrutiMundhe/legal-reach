import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL from '../utils/config';
import './FindLawyers.css';

const FindLawyers = () => {
  const location = useLocation();
  const [lawyers, setLawyers] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // State for the input fields
  const [searchName, setSearchName] = useState(location.state?.searchName || location.state?.query || '');
  const [searchCity, setSearchCity] = useState(location.state?.searchCity || '');
  const [selectedSpecialization, setSelectedSpecialization] = useState(location.state?.filterSpecialization || '');

  const specializations = [
    'All Specializations',
    'Criminal Defense',
    'Family Law',
    'Corporate Law',
    'Property Law',
    'Civil Litigation',
    'Consumer Law',
    'Labor & Employment Law',
    'Tax Law',
    'Intellectual Property Law',
    'Constitutional Law'
  ];

  const fetchLawyers = async (params = {}) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/auth/lawyers`, { params });
      setLawyers(response.data);
    } catch (error) {
      console.error('Error fetching lawyers:', error);
      setLawyers([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch all lawyers on initial render
  useEffect(() => {
    fetchLawyers();
  }, []);

  const handleSearch = () => {
    const params = {};
    if (searchName) params.name = searchName;
    if (searchCity) params.city = searchCity;
    if (selectedSpecialization && selectedSpecialization !== 'All Specializations') {
      params.specialization = selectedSpecialization;
    }
    fetchLawyers(params);
  };

  const handleClearFilters = () => {
    setSearchName('');
    setSearchCity('');
    setSelectedSpecialization('');
    fetchLawyers(); // Fetch all lawyers again
  };

  return (
    <div className="find-lawyers-container">
      <div className="filters-sidebar">
        <h3>Filter Lawyers</h3>
        
        <div className="filter-group">
          <label>Lawyer Name</label>
          <input 
            type="text" 
            placeholder="Enter name" 
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            className="filter-input"
          />
        </div>
        
        <div className="filter-group">
          <label>City</label>
          <input 
            type="text" 
            placeholder="e.g. Pune" 
            value={searchCity}
            onChange={(e) => setSearchCity(e.target.value)}
            className="filter-input"
          />
        </div>
        
        <div className="filter-group">
          <label>Specialization</label>
          <select 
            value={selectedSpecialization || 'All Specializations'}
            onChange={(e) => setSelectedSpecialization(e.target.value)}
            className="filter-select"
          >
            {specializations.map((spec, index) => (
              <option key={index} value={spec}>{spec}</option>
            ))}
          </select>
        </div>

        <button 
          onClick={handleSearch}
          className="search-btn"
          disabled={loading}
        >
          {loading ? 'Searching...' : 'Search'}
        </button>

        <button 
          onClick={handleClearFilters}
          className="clear-filters-btn"
        >
          Clear Filters
        </button>
      </div>

      <div className="results-area">
        <div className="results-header">
          <h2>{lawyers.length} Lawyers Found</h2>
          {selectedSpecialization && selectedSpecialization !== 'All Specializations' && (
            <span className="filter-badge">{selectedSpecialization}</span>
          )}
        </div>
        
        {loading ? (
          <div className="loading">Loading lawyers...</div>
        ) : (
          <div className="results-grid">
            {lawyers.map(lawyer => (
              <div key={lawyer._id} className="result-card">
                <div className="card-header">
                  <h3>{lawyer.name}</h3>
                  <span className="badge">{lawyer.specialization}</span>
                </div>
                
                <div className="card-details">
                  <div className="detail-item">
                    <strong>Location:</strong> {lawyer.city}
                  </div>
                  <div className="detail-item">
                    <strong>Experience:</strong> {lawyer.experience || 'Not specified'}
                  </div>
                  {lawyer.barCouncilRegNumber && (
                    <div className="detail-item">
                      <strong>Bar Council:</strong> {lawyer.barCouncilRegNumber}
                    </div>
                  )}
                  {lawyer.phone && (
                    <div className="detail-item">
                      <strong>Contact:</strong> {lawyer.phone}
                    </div>
                  )}
                </div>

                {lawyer.bio && (
                  <p className="lawyer-bio">{lawyer.bio.substring(0, 120)}...</p>
                )}
                
                <Link to={`/lawyer/${lawyer._id}`}>
                  <button className="view-profile-btn">View Full Profile</button>
                </Link>
              </div>
            ))}
            
            {lawyers.length === 0 && (
              <div className="no-results">
                <h3>No lawyers found</h3>
                <p>Try adjusting your search criteria or clearing the filters.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FindLawyers;