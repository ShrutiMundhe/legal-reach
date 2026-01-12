import React, { useState } from 'react'; // Add useState
import { useParams, useNavigate } from 'react-router-dom'; // Add useNavigate
import './LawyerDetails.css';

const LawyerDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate(); // Hook to move pages

  // ... (keep your lawyer object and other code the same) ...
  const lawyer = {
    name: "Adv. Amit Sharma",
    specialty: "Criminal Lawyer",
    location: "Pimpri-Chinchwad, Pune",
    experience: "12 Years",
    fees: "₹2000 per consultation",
    bio: "Adv. Amit Sharma is a highly experienced criminal defense lawyer...",
    image: "https://i.pravatar.cc/150?img=11"
  };

  // State for form inputs
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  const handleBooking = () => {
    if (!date || !time) {
      alert("Please select a date and time!");
      return;
    }

    // 1. Create the Appointment Object
    const newAppointment = {
      id: Date.now(), // Unique ID based on time
      lawyer: lawyer.name,
      date: date,
      time: time,
      status: "Pending"
    };

    // 2. Get existing appointments from Local Storage (or start empty)
    const existingAppointments = JSON.parse(localStorage.getItem("myAppointments")) || [];

    // 3. Add the new one
    existingAppointments.push(newAppointment);

    // 4. Save back to Local Storage
    localStorage.setItem("myAppointments", JSON.stringify(existingAppointments));

    alert("Booking Successful! Redirecting to Dashboard...");
    navigate('/user-dashboard'); // Go to dashboard to see it
  };

  return (
    <div className="details-container">
       {/* ... (Keep Header and Left Section exactly the same) ... */}
       
       <div className="profile-header">
          {/* ... same header code ... */}
          <img src={lawyer.image} alt={lawyer.name} className="profile-img-large" />
          <div className="profile-info">
             <h1>{lawyer.name}</h1>
             {/* ... etc ... */}
          </div>
       </div>

       <div className="details-body">
         <div className="left-section">
            {/* ... same bio code ... */}
            <h3>About Me</h3>
            <p>{lawyer.bio}</p>
         </div>

        {/* --- UPDATE THIS BOOKING PANEL --- */}
        <div className="booking-panel">
          <h3>Book an Appointment</h3>
          <form>
            <label>Select Date</label>
            <input 
              type="date" 
              className="booking-input" 
              onChange={(e) => setDate(e.target.value)}
            />
            
            <label>Select Time</label>
            <select 
              className="booking-input"
              onChange={(e) => setTime(e.target.value)}
            >
              <option value="">Select a Slot</option>
              <option value="10:00 AM">10:00 AM - 11:00 AM</option>
              <option value="02:00 PM">02:00 PM - 03:00 PM</option>
              <option value="05:00 PM">05:00 PM - 06:00 PM</option>
            </select>
            
            <button type="button" className="confirm-btn" onClick={handleBooking}>
              Confirm Booking
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LawyerDetails;