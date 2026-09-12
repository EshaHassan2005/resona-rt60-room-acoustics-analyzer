import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/landing.css';

import Navbar from '../components/Navbar';
import HeroSection from '../components/HeroSection';
import SpaceShowcase from '../components/SpaceShowcase';
import WhatWeDoSection from '../components/WhatWeDoSection';
import CounselorSection from '../components/CounselorSection';
import GetStartedCTA from '../components/GetStartedCTA';
import Footer from '../components/Footer';

import RT60InfoModal from '../components/RT60InfoModal';
import ContactModal from '../components/ContactModal';
import AboutModal from '../components/AboutModal';

export default function LandingPage() {
  const navigate = useNavigate();

  const [isRT60InfoOpen, setIsRT60InfoOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  const handleOpenGenerator = (spaceId = '') => {
    if (spaceId && spaceId !== 'studio') {
      navigate(`/generator?space=${spaceId}`);
    } else {
      navigate('/generator');
    }
  };

  return (
    <div className="resona-app">
      {/* Top Navigation */}
      <Navbar
        onOpenAnalyzer={() => handleOpenGenerator()}
        onOpenRT60Info={() => setIsRT60InfoOpen(true)}
        onOpenContact={() => setIsContactOpen(true)}
      />

      {/* Main Landing Page Flow */}
      <main>
        {/* Hero Section */}
        <HeroSection
          onOpenAbout={() => setIsAboutOpen(true)}
          onOpenAnalyzer={() => handleOpenGenerator()}
        />

        {/* Space Context Showcase ("YOU DO YOU") */}
        <SpaceShowcase onSelectSpace={(spaceId) => handleOpenGenerator(spaceId)} />

        {/* "WHAT WE DO" RT60 Breakdown */}
        <WhatWeDoSection onOpenRT60Info={() => setIsRT60InfoOpen(true)} />

        {/* "CONTACT OUR COUNSELORS" Atmospheric Banner */}
        <CounselorSection onOpenContact={() => setIsContactOpen(true)} />

        {/* "GET STARTED WITH US BY FINDING OUT THE RT60" Section */}
        <GetStartedCTA onOpenAnalyzer={() => handleOpenGenerator()} />
      </main>

      {/* Footer Navigation */}
      <Footer
        onOpenAbout={() => setIsAboutOpen(true)}
        onOpenRT60Info={() => setIsRT60InfoOpen(true)}
        onOpenContact={() => setIsContactOpen(true)}
        onOpenAnalyzer={() => handleOpenGenerator()}
      />

      {/* Informational Modals */}
      <RT60InfoModal
        isOpen={isRT60InfoOpen}
        onClose={() => setIsRT60InfoOpen(false)}
        onLaunchAnalyzer={() => handleOpenGenerator()}
      />

      <ContactModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
      />

      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
        onLaunchAnalyzer={() => handleOpenGenerator()}
      />
    </div>
  );
}
