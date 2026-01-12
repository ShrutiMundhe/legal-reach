import React from 'react';
import Hero from '../components/Hero';
import PracticeAreas from '../components/PracticeAreas';
import FeaturedLawyers from '../components/FeaturedLawyers';

const Home = () => {
  return (
    <div>
      {/* 1. Big Search Banner */}
      <Hero />
      
      {/* 2. Services / Categories */}
      <PracticeAreas />
      
      {/* 3. Top Lawyers Grid */}
      <FeaturedLawyers />
    </div>
  );
};

export default Home;