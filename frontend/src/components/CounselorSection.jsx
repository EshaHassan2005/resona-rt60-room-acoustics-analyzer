import React from 'react';
import counselorBg from '../assets/classroom.png';
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
            Our principles are rooted in helping you find solace in what we provide as proposition 
            to your acoustic needs. To achieve our goals, we have hired the best audio consultants who 
            have been deemed as  <span style={{fontStyle:'italic'}}> cream of the crop </span> in the field of sonic analysis. So feel free 
            to let your imagination run wild and let our staff bring them to life.
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
