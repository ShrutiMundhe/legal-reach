import React from 'react';
import Hero from '../components/slider.jsx';
import PracticeAreas from '../components/PracticeAreas.jsx';
import FeaturedLawyers from '../components/FeaturedLawyers.jsx';
import About from '../components/About.jsx';
import RagbotWidget from '../components/RagbotWidget.jsx';

const Home = () => {
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    user = null;
  }
  const role = (user?.role || '').toLowerCase();
  const showRagbot = role === 'client' || role === 'lawyer' || role === 'user';

  return (
    <div>
      <Hero />
      <PracticeAreas />
      <FeaturedLawyers />
      <About />
      {showRagbot && <RagbotWidget />}
    </div>
  );
};

export default Home;