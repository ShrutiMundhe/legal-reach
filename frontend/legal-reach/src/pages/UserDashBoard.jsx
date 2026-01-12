import React, { useState } from 'react';
import './Dashboard.css'; // We will create a shared CSS for dashboards

const UserDashboard = () => {
  const [activeTab, setActiveTab] = useState('appointments');

  // Dummy Data: Appointments the user has booked
  const appointments = [
    { id: 1, lawyer: "Adv. Amit Sharma", date: "2026-01-15", time: "10:00 AM", status: "Confirmed" },
    { id: 2, lawyer: "Adv. Priya Desai", date: "2026-01-20", time: "02:00 PM", status: "Pending" },
  ];

  return (
    <div className="dashboard-container">
      
      {/* Sidebar */}
      <div className="dashboard-sidebar">
        <div className="user-profile">
          <div className="avatar-circle">VD</div>
          <h3>Vishnu Priya</h3>
          <p>Client Account</p>
        </div>
        
        <ul className="sidebar-menu">
          <li 
            className={activeTab === 'appointments' ? 'active' : ''} 
            onClick={() => setActiveTab('appointments')}
          >
            📅 My Appointments
          </li>
          <li 
            className={activeTab === 'profile' ? 'active' : ''} 
            onClick={() => setActiveTab('profile')}
          >
            👤 Profile Settings
          </li>
          <li className="logout-btn">🚪 Logout</li>
        </ul>
      </div>

      {/* Main Content Area */}
      <div className="dashboard-content">
        
        {activeTab === 'appointments' && (
          <div>
            <h2>My Appointments</h2>
            <div className="appointments-list">
              {appointments.map(app => (
                <div key={app.id} className="appointment-card">
                  <div>
                    <h3>{app.lawyer}</h3>
                    <p>📅 {app.date} at {app.time}</p>
                  </div>
                  <span className={`status-badge ${app.status.toLowerCase()}`}>
                    {app.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div>
            <h2>Profile Settings</h2>
            <form className="profile-form">
              <label>Full Name</label>
              <input type="text" defaultValue="Vishnu Priya" />
              
              <label>Email</label>
              <input type="email" defaultValue="vishnu@example.com" />
              
              <label>Phone</label>
              <input type="text" defaultValue="+91 9876543210" />
              
              <button className="save-btn">Save Changes</button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};

export default UserDashboard;