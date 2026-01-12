import React from 'react';
import './Hero.css';

const Hero = () => {
  return (
    <div className="hero-section">
      <div className="hero-content">
        <h1>Find the Right Lawyer for Your Needs</h1>
        <p>Connect with top-rated legal experts for advice, representation, and consultation.</p>
        
        {/* Search Bar Container */}
        <div className="search-container">
          <input 
            type="text" 
            placeholder="Search by practice area (e.g., Divorce, Property, Criminal)..." 
            className="search-input"
          />
          <input 
            type="text" 
            placeholder="Location (e.g., Pune, Mumbai)..." 
            className="location-input"
          />
          <button className="search-btn">Search</button>
        </div>
      </div>
    </div>
  );
};

export default Hero;