import React from 'react';
import { X, Grid, Activity, Zap, Sliders, ArrowRight } from 'lucide-react';

export default function RoomModesModal({ isOpen, onClose, onLaunchAnalyzer }) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '820px' }}
      >
        <button className="modal-close-btn" onClick={onClose} aria-label="Close Modal">
          <X size={20} />
        </button>

        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Grid size={20} color="var(--color-light-sage)" />
            <span style={{ fontSize: '0.78rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--color-light-sage)', fontWeight: 700 }}>
              ACOUSTIC WAVE SCIENCE
            </span>
          </div>
          <h3 className="modal-title">Room Modes &amp; Standing Waves</h3>
          <p className="modal-subtitle">
            Wave acoustics, resonant frequencies, and the Schroeder Cutoff (f_s) transition in enclosed spaces.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* What Are Room Modes */}
          <div style={{ background: 'rgba(18, 24, 19, 0.6)', padding: '20px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
            <h4 style={{ color: 'var(--color-cream)', fontSize: '1.05rem', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={18} color="var(--color-accent-emerald)" />
              What Are Room Modes?
            </h4>
            <p style={{ fontSize: '0.92rem', color: 'var(--color-text-dim)', lineHeight: 1.7 }}>
              In enclosed rectangular spaces, low-frequency sound waves reflect back and forth between parallel boundaries. When the round-trip distance equals integer multiples of half-wavelengths (λ/2), constructive interference creates <strong>standing waves</strong> (room modes).
            </p>
            <p style={{ fontSize: '0.92rem', color: 'var(--color-text-dim)', lineHeight: 1.7, marginTop: '8px' }}>
              Standing waves produce stationary <strong>pressure antinodes (peaks)</strong> where bass sounds boomy, and <strong>nodes (nulls)</strong> where specific bass frequencies cancel out.
            </p>
          </div>

          {/* Rayleigh Formula */}
          <div style={{ background: 'rgba(18, 24, 19, 0.6)', padding: '20px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
            <h4 style={{ color: 'var(--color-cream)', fontSize: '1.05rem', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={18} color="var(--color-accent-amber)" />
              The Rayleigh 3D Modal Frequency Formula
            </h4>
            <div style={{ background: 'rgba(10, 15, 11, 0.8)', padding: '16px', borderRadius: '10px', textAlign: 'center', fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-cream)', letterSpacing: '0.05em', fontFamily: 'monospace' }}>
              f(nₓ, n_y, n_z) = (c / 2) · √((nₓ/L)² + (n_y/W)² + (n_z/H)²)
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginTop: '10px', textAlign: 'center' }}>
              Where <em>c = 343 m/s</em>, and <em>nₓ, n_y, n_z</em> are modal integer indices along Length (L), Width (W), and Height (H).
            </p>
          </div>

          {/* 3 Types */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
            {[
              { title: '1. Axial Modes (1D)', color: '#4ade80', text: 'Waves reflecting between 2 opposing parallel boundaries (L, W, or H). Carries 100% modal energy — primary cause of boomy bass peaks and deep nulls.' },
              { title: '2. Tangential Modes (2D)', color: '#f59e0b', text: 'Waves reflecting between 4 room surfaces. Carries ~50% modal energy with moderate wall damping.' },
              { title: '3. Oblique Modes (3D)', color: '#93a891', text: 'Corner-to-corner waves bouncing between all 6 surfaces. Carries ~25% energy and decays rapidly.' },
            ].map((m) => (
              <div key={m.title} style={{ background: 'rgba(18, 24, 19, 0.6)', padding: '16px', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: m.color, marginBottom: '6px' }}>{m.title}</div>
                <p style={{ fontSize: '0.82rem', color: 'var(--color-text-dim)', lineHeight: 1.6, margin: 0 }}>{m.text}</p>
              </div>
            ))}
          </div>

          {/* Schroeder */}
          <div style={{ background: 'rgba(18, 24, 19, 0.6)', padding: '20px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
            <h4 style={{ color: 'var(--color-cream)', fontSize: '1.05rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sliders size={18} color="var(--color-light-sage)" />
              The Schroeder Transition Frequency (f_s)
            </h4>
            <p style={{ fontSize: '0.90rem', color: 'var(--color-text-dim)', lineHeight: 1.7 }}>
              Formulated by Manfred Schroeder in 1962: <strong>f_s = 2000 · √(RT60 / V)</strong>. Below f_s, individual standing wave modes dominate room acoustics. Above f_s, modal density becomes dense enough for the sound field to act diffusely — the transition from modal to statistical acoustics.
            </p>
          </div>
        </div>

        <div className="modal-footer" style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button
            className="btn-secondary"
            onClick={onClose}
            style={{ padding: '8px 18px', borderRadius: '8px', background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--color-cream)', cursor: 'pointer' }}
          >
            Close
          </button>
          {onLaunchAnalyzer && (
            <button
              className="btn-primary"
              onClick={() => { onClose(); onLaunchAnalyzer(); }}
              style={{ padding: '8px 20px', borderRadius: '8px', background: 'var(--color-accent-emerald)', color: '#000', fontWeight: 700, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <span>Analyze Your Room Modes</span>
              <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
 
