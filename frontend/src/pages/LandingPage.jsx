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
import SchroederModal from '../components/SchroederModal';
import ISO3382Modal from '../components/ISO3382Modal';
import AcousticConsultingModal from '../components/AcousticConsultingModal';
import StudioCinemaModal from '../components/StudioCinemaModal';
import ArchitecturalModal from '../components/ArchitecturalModal';

export default function LandingPage() {
  const navigate = useNavigate();

  const [isRT60InfoOpen, setIsRT60InfoOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isSchroederOpen, setIsSchroederOpen] = useState(false);
  const [isISO3382Open, setIsISO3382Open] = useState(false);
  const [isConsultingOpen, setIsConsultingOpen] = useState(false);
  const [isStudioCinemaOpen, setIsStudioCinemaOpen] = useState(false);
  const [isArchitecturalOpen, setIsArchitecturalOpen] = useState(false);

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
        <HeroSection
          onOpenAbout={() => setIsAboutOpen(true)}
          onOpenAnalyzer={() => handleOpenGenerator()}
        />
        <SpaceShowcase onSelectSpace={(spaceId) => handleOpenGenerator(spaceId)} />
        <WhatWeDoSection onOpenRT60Info={() => setIsRT60InfoOpen(true)} />
        <CounselorSection onOpenContact={() => setIsContactOpen(true)} />
        <GetStartedCTA onOpenAnalyzer={() => handleOpenGenerator()} />
      </main>

      {/* Footer Navigation */}
      <Footer
        onOpenAbout={() => setIsAboutOpen(true)}
        onOpenRT60Info={() => setIsRT60InfoOpen(true)}
        onOpenSchroeder={() => setIsSchroederOpen(true)}
        onOpenISO3382={() => setIsISO3382Open(true)}
        onOpenConsulting={() => setIsConsultingOpen(true)}
        onOpenStudioCinema={() => setIsStudioCinemaOpen(true)}
        onOpenArchitectural={() => setIsArchitecturalOpen(true)}
        onOpenContact={() => setIsContactOpen(true)}
        onOpenAnalyzer={() => handleOpenGenerator()}
      />

      {/* All Modals */}
      <RT60InfoModal isOpen={isRT60InfoOpen} onClose={() => setIsRT60InfoOpen(false)} onLaunchAnalyzer={() => handleOpenGenerator()} />
      <ContactModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} />
      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} onLaunchAnalyzer={() => handleOpenGenerator()} />
      <SchroederModal isOpen={isSchroederOpen} onClose={() => setIsSchroederOpen(false)} onLaunchAnalyzer={() => handleOpenGenerator()} />
      <ISO3382Modal isOpen={isISO3382Open} onClose={() => setIsISO3382Open(false)} onLaunchAnalyzer={() => handleOpenGenerator()} />
      <AcousticConsultingModal isOpen={isConsultingOpen} onClose={() => setIsConsultingOpen(false)} />
      <StudioCinemaModal isOpen={isStudioCinemaOpen} onClose={() => setIsStudioCinemaOpen(false)} />
      <ArchitecturalModal isOpen={isArchitecturalOpen} onClose={() => setIsArchitecturalOpen(false)} />
    </div>
  );
}
