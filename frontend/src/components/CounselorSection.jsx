import React from 'react';
import counselorBg from '../assets/counselor-bg.jpg';
import { Volume2, Sparkles, UserCheck } from 'lucide-react';

export default function CounselorSection({ onOpenContact }) {
  return (
    <section
      className="counselor-section"
      style={{ backgroundImage: `url(${counselorBg})` }}
      id="counselors"
    >
      <div className="counselor-overlay"></div>

      <div className="container" style={{ position: 'relative', zIndex: 2 }}>
        <div className="counselor-content">
          {/* Audio Waveform Mark */}
          <div className="counselor-icon-wrapper">
            <div className="brand-logo-icon" style={{ height: '32px' }}>
              <span style={{ height: '10px' }}></span>
              <span style={{ height: '20px' }}></span>
              <span style={{ height: '32px' }}></span>
              <span style={{ height: '18px' }}></span>
              <span style={{ height: '24px' }}></span>
              <span style={{ height: '12px' }}></span>
            </div>
          </div>

          <p className="counselor-text">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam eu
            finibus nibh. Maecenas velit est, sagittis non iaculis nec, posuere eget
            ante. Aliquam erat volutpat. Aliquam semper ex ut turpis porta
            suscipit. Duis sit amet maximus enim. Mauris magna ipsum, interdum eu
            lacus ac, iaculis blandit justo. Donec semper est odio, nec efficitur
            nunc accumsan quis. Mauris interdum at justo sed euismod.
          </p>

          <button
            className="btn-pill-primary"
            onClick={onOpenContact}
          >
            CONTACT OUR COUNSELORS
          </button>
        </div>
      </div>
    </section>
  );
}
