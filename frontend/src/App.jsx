import React, { useState } from 'react';
import './styles/landing.css';

import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import SpaceShowcase from './components/SpaceShowcase';
import WhatWeDoSection from './components/WhatWeDoSection';
import CounselorSection from './components/CounselorSection';
import GetStartedCTA from './components/GetStartedCTA';
import Footer from './components/Footer';

import AnalyzerModal from './components/AnalyzerModal';
import RT60InfoModal from './components/RT60InfoModal';
import ContactModal from './components/ContactModal';
import AboutModal from './components/AboutModal';

function App() {
  const [isAnalyzerOpen, setIsAnalyzerOpen] = useState(false);
  const [isRT60InfoOpen, setIsRT60InfoOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [selectedRoomType, setSelectedRoomType] = useState('studio');

  const handleSelectSpace = (roomId) => {
    setSelectedRoomType(roomId);
    setIsAnalyzerOpen(true);
  };

  return (
    <div className="resona-app">
      {/* Top Navigation */}
      <Navbar
        onOpenAnalyzer={() => setIsAnalyzerOpen(true)}
        onOpenRT60Info={() => setIsRT60InfoOpen(true)}
        onOpenContact={() => setIsContactOpen(true)}
      />

      {/* Main Landing Page Flow */}
      <main>
        {/* Hero Section */}
        <HeroSection
          onOpenAbout={() => setIsAboutOpen(true)}
          onOpenAnalyzer={() => setIsAnalyzerOpen(true)}
        />

        {/* Space Context Showcase ("YOU DO YOU") */}
        <SpaceShowcase onSelectSpace={handleSelectSpace} />

        {/* "WHAT WE DO" RT60 Breakdown */}
        <WhatWeDoSection onOpenRT60Info={() => setIsRT60InfoOpen(true)} />

        {/* "CONTACT OUR COUNSELORS" Atmospheric Banner */}
        <CounselorSection onOpenContact={() => setIsContactOpen(true)} />

        {/* "GET STARTED WITH US BY FINDING OUT THE RT60" Section */}
        <GetStartedCTA onOpenAnalyzer={() => setIsAnalyzerOpen(true)} />
      </main>

      {/* Footer Navigation */}
      <Footer
        onOpenAbout={() => setIsAboutOpen(true)}
        onOpenRT60Info={() => setIsRT60InfoOpen(true)}
        onOpenContact={() => setIsContactOpen(true)}
        onOpenAnalyzer={() => setIsAnalyzerOpen(true)}
      />

      {/* Interactive Modals */}
      <AnalyzerModal
        isOpen={isAnalyzerOpen}
        onClose={() => setIsAnalyzerOpen(false)}
        initialRoomType={selectedRoomType}
      />

      <RT60InfoModal
        isOpen={isRT60InfoOpen}
        onClose={() => setIsRT60InfoOpen(false)}
        onLaunchAnalyzer={() => setIsAnalyzerOpen(true)}
      />

      <ContactModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
      />

      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
        onLaunchAnalyzer={() => setIsAnalyzerOpen(true)}
      />
    </div>
  );
}

export default App;
