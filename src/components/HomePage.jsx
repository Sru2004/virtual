import React from 'react';
import HeroSection from './HeroSection';
import WhyChooseUs from './WhyChooseUs';
import FeaturesSection from './FeaturesSection';
import LatestCreations from './LatestCreations';

const HomePage = () => {

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-rose-50">
      <HeroSection />
      <WhyChooseUs />
      <FeaturesSection />
      <LatestCreations />
    </div>
  );
};

export default HomePage;
