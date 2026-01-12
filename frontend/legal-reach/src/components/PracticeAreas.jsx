import React from 'react';
import './PracticeAreas.css';

const services = [
  { title: "Family Law", icon: "👨‍👩‍👧‍👦", desc: "Divorce, Child Custody, and Adoption" },
  { title: "Criminal Defense", icon: "⚖️", desc: "Theft, DUI, and other criminal charges" },
  { title: "Corporate Law", icon: "🏢", desc: "Business disputes, Mergers, and Contracts" },
  { title: "Property Dispute", icon: "🏠", desc: "Land issues, Tenant rights, and Ownership" },
  { title: "Cyber Crime", icon: "💻", desc: "Online fraud, Hacking, and Data Theft" },
  { title: "Labor & Employment", icon: "👷", desc: "Workplace harassment and Unpaid wages" },
];

const PracticeAreas = () => {
  return (
    <div className="practice-section" id="services">
      <h2 className="section-title">Our Legal Practice Areas</h2>
      <p className="section-subtitle">We have expert lawyers in every field.</p>
      
      <div className="services-grid">
        {services.map((service, index) => (
          <div key={index} className="service-card">
            <div className="icon">{service.icon}</div>
            <h3>{service.title}</h3>
            <p>{service.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PracticeAreas;