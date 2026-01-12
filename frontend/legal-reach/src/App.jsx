import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Navbar from './components/navbar';
import FindLawyers from './pages/FindLawyers';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup'; // <--- Import this
import LawyerDetails from './pages/LawyerDetails';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app-wrapper">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} /> {/* <--- Add Route */}
          <Route path="/find-lawyers" element={<FindLawyers />} />
          <Route path="/lawyer/:id" element={<LawyerDetails />} />
          </Routes>
        <Footer />
      
      </div>
    </Router>
  );
}

export default App;