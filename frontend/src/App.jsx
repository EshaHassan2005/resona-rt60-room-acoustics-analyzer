import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import GeneratorPage from './pages/GeneratorPage';
import './styles/landing.css';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/generator" element={<GeneratorPage />} />
      <Route path="/analyzer" element={<GeneratorPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
