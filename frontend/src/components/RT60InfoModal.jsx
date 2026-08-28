import React from 'react';
import { X, BookOpen, CheckCircle, Sliders, Waves, Layers } from 'lucide-react';

export default function RT60InfoModal({ isOpen, onClose, onLaunchAnalyzer }) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '800px' }}
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
            <BookOpen size={20} color="var(--color-light-sage)" />
            <span style={{ fontSize: '0.78rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--color-light-sage)', fontWeight: 700 }}>
              ACOUSTIC SCIENCE
            </span>
          </div>
          <h3 className="modal-title">Understanding RT60 & Room Acoustics</h3>
          <p className="modal-subtitle">
            How reverberation time dictates clarity, spectral balance, and speech intelligibility.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Section 1: What is RT60? */}
          <div style={{ background: 'rgba(18, 24, 19, 0.6)', padding: '20px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
            <h4 style={{ color: 'var(--color-cream)', fontSize: '1.1rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Waves size={18} color="var(--color-accent-emerald)" />
              What is Reverberation Time (RT60)?
            </h4>
            <p style={{ fontSize: '0.92rem', color: 'var(--color-text-dim)', lineHeight: 1.7 }}>
              Reverberation time (RT60) is the time required for the sound pressure level in an enclosed space to decrease by <strong>60 decibels (dB)</strong> after the sound excitation source has ceased. It is the international standard defined by <strong>ISO 3382</strong> for characterizing the acoustic decay of rooms.
            </p>
          </div>

          {/* Section 2: Sabine & Eyring Formula */}
          <div style={{ background: 'rgba(18, 24, 19, 0.6)', padding: '20px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
            <h4 style={{ color: 'var(--color-cream)', fontSize: '1.1rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={18} color="var(--color-accent-amber)" />
              The Sabine Reverberation Equation
            </h4>
            <p style={{ fontSize: '0.92rem', color: 'var(--color-text-dim)', lineHeight: 1.7, marginBottom: '12px' }}>
              Wallace Clement Sabine established the foundational relationship connecting room volume and total surface absorption:
            </p>
            <div style={{ background: 'rgba(10, 15, 11, 0.8)', padding: '14px', borderRadius: '8px', textAlign: 'center', fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-cream)', letterSpacing: '0.05em' }}>
              RT₆₀ = (0.161 × V) / A
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginTop: '8px', textAlign: 'center' }}>
              Where <em>V</em> is room volume in m³, and <em>A</em> is total absorption area in metric Sabins (Σ Sᵢ × αᵢ).
            </p>
          </div>

          {/* Section 3: Recommended RT60 Targets */}
          <div style={{ background: 'rgba(18, 24, 19, 0.6)', padding: '20px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
            <h4 style={{ color: 'var(--color-cream)', fontSize: '1.1rem', marginBottom: '12px' }}>
              Recommended Target RT60 Values
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
              <div style={{ padding: '10px', background: 'rgba(40, 61, 41, 0.5)', borderRadius: '8px' }}>
                <strong style={{ color: 'var(--color-cream)', fontSize: '0.85rem' }}>Recording Studios:</strong>
                <p style={{ color: 'var(--color-accent-emerald)', fontWeight: 700, fontSize: '0.95rem' }}>0.30s – 0.45s</p>
              </div>
              <div style={{ padding: '10px', background: 'rgba(40, 61, 41, 0.5)', borderRadius: '8px' }}>
                <strong style={{ color: 'var(--color-cream)', fontSize: '0.85rem' }}>Home Theaters:</strong>
                <p style={{ color: 'var(--color-accent-emerald)', fontWeight: 700, fontSize: '0.95rem' }}>0.40s – 0.55s</p>
              </div>
              <div style={{ padding: '10px', background: 'rgba(40, 61, 41, 0.5)', borderRadius: '8px' }}>
                <strong style={{ color: 'var(--color-cream)', fontSize: '0.85rem' }}>Conference Rooms:</strong>
                <p style={{ color: 'var(--color-accent-emerald)', fontWeight: 700, fontSize: '0.95rem' }}>0.60s – 0.80s</p>
              </div>
              <div style={{ padding: '10px', background: 'rgba(40, 61, 41, 0.5)', borderRadius: '8px' }}>
                <strong style={{ color: 'var(--color-cream)', fontSize: '0.85rem' }}>Concert Halls:</strong>
                <p style={{ color: 'var(--color-accent-emerald)', fontWeight: 700, fontSize: '0.95rem' }}>1.60s – 2.20s</p>
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '8px' }}>
            <button
              className="btn-pill-primary"
              onClick={() => {
                onClose();
                onLaunchAnalyzer();
              }}
              style={{ width: '100%', padding: '14px' }}
            >
              LAUNCH INTERACTIVE RT60 GENERATOR
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
