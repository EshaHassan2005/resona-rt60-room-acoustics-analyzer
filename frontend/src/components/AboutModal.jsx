import React from 'react';
import { X, Sparkles, Target, Compass, Award } from 'lucide-react';

export default function AboutModal({ isOpen, onClose, onLaunchAnalyzer }) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '760px' }}
      >
        <button
          className="modal-close-btn"
          onClick={onClose}
          aria-label="Close Modal"
        >
          <X size={20} />
        </button>

        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Sparkles size={20} color="var(--color-light-sage)" />
            <span style={{ fontSize: '0.78rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--color-light-sage)', fontWeight: 700 }}>
              ABOUT US
            </span>
          </div>
          <h3 className="modal-title">Welcome to RESONA</h3>
          <p className="modal-subtitle">
            Bridging cutting-edge digital signal processing with architectural acoustic engineering.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ background: 'rgba(18, 24, 19, 0.6)', padding: '20px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
            <h4 style={{ color: 'var(--color-cream)', fontSize: '1.05rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Target size={18} color="var(--color-accent-emerald)" />
              Our Mission
            </h4>
            <p style={{ fontSize: '0.92rem', color: 'var(--color-text-dim)', lineHeight: 1.7 }}>
              At <strong>RESONA</strong>, we believe every space possesses a unique sonic fingerprint. Whether you are producing Grammy-winning records, mastering audio tracks, building a private cinema, or designing quiet modern workspaces, precise acoustic control is essential. We combine mathematical impulse analysis (Schroeder integration, octave-band filtering, Sabine & Eyring formulas) with practical room treatment designs.
            </p>
          </div>

          <div style={{ background: 'rgba(18, 24, 19, 0.6)', padding: '20px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
            <h4 style={{ color: 'var(--color-cream)', fontSize: '1.05rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award size={18} color="var(--color-accent-amber)" />
              The Resona Engine
            </h4>
            <p style={{ fontSize: '0.92rem', color: 'var(--color-text-dim)', lineHeight: 1.7 }}>
              Our DSP algorithms calculate RT60 ($T_{20}$ and $T_{30}$ decay times) with $R^2$ regression quality metrics, frequency-by-frequency octave breakdowns from 125 Hz to 4 kHz, and clarity metrics ($C_{50}$, $C_{80}$, $D_{50}$) so you know exactly which frequency ranges need absorption or diffusion.
            </p>
          </div>

          <div style={{ textAlign: 'center', marginTop: '10px' }}>
            <button
              className="btn-pill-primary"
              onClick={() => {
                onClose();
                onLaunchAnalyzer();
              }}
              style={{ width: '100%', padding: '14px' }}
            >
              TEST YOUR SPACE WITH OUR GENERATOR
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
