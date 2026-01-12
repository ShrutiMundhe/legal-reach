import React from 'react';
import { useParams } from 'react-router-dom';
import './LawyerDetails.css';

const LawyerDetails = () => {
  const { id } = useParams(); // Get the ID from the URL

  // In a real app, you would fetch data from backend using this ID.
  // For now, we will just simulate a single lawyer's data.
  const lawyer = {
    name: "Adv. Amit Sharma",
    specialty: "Criminal Lawyer",
    location: "Pimpri-Chinchwad, Pune",
    experience: "12 Years",
    fees: "₹2000 per consultation",
    bio: "Adv. Amit Sharma is a highly experienced criminal defense lawyer with a success rate of 95%. He specializes in bail matters, cyber crime, and property disputes.",
    image: "https://i.pravatar.cc/150?img=11"
  };

  return (
    <div className="details-container">
      <div className="profile-header">
        <img src={lawyer.image} alt={lawyer.name} className="profile-img-large" />
        <div className="profile-info">
          <h1>{lawyer.name}</h1>
          <span className="badge-lg">{lawyer.specialty}</span>
          <p className="location-text">📍 {lawyer.location}</p>
          <p>💼 {lawyer.experience} Experience</p>
          <p className="fees-text">💰 {lawyer.fees}</p>
        </div>
      </div>

      <div className="details-body">
        <div className="left-section">
          <h3>About Me</h3>
          <p>{lawyer.bio}</p>
          
          <h3>Practice Areas</h3>
          <ul className="tags-list">
            <li>Criminal Defense</li>
            <li>Cyber Crime</li>
            <li>Bail Matters</li>
            <li>Fraud Cases</li>
          </ul>
        </div>

        {/* Booking Form Side Panel */}
        <div className="booking-panel">
          <h3>Book an Appointment</h3>
          <form>
            <label>Select Date</label>
            <input type="date" className="booking-input" />
            
            <label>Select Time</label>
            <select className="booking-input">
              <option>10:00 AM - 11:00 AM</option>
              <option>02:00 PM - 03:00 PM</option>
              <option>05:00 PM - 06:00 PM</option>
            </select>
            
            <button type="button" className="confirm-btn" onClick={() => alert("Booking Request Sent!")}>
              Confirm Booking
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LawyerDetails;