import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Hero.css';

const Hero = () => {
  const [inputText, setInputText] = useState(""); // Stores what user types
  const navigate = useNavigate();

  const handleSearch = () => {
    // Navigate to Find Lawyers page and PASS the search text (state)
    navigate('/find-lawyers', { state: { query: inputText } });
  };

  return (
    <div className="hero-section">
      <div className="hero-content">
        <h1>Find the Right Lawyer for Your Needs</h1>
        <p>Connect with top-rated legal experts for advice, representation, and consultation.</p>
        
        <div className="search-container">
          <input 
            type="text" 
            placeholder="Search by practice area (e.g., Divorce, Property)..." 
            className="search-input"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)} // Updates state as you type
          />
          <input 
            type="text" 
            placeholder="Location (e.g., Pune, Mumbai)..." 
            className="location-input"
          />
          <button className="search-btn" onClick={handleSearch}>Search</button>
        </div>
      </div>
    </div>
  );
};

export default Hero;