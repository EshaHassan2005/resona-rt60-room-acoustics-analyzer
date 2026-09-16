import React from 'react';
import { X, BarChart2, Activity, Layers, TrendingDown } from 'lucide-react';

export default function SchroederModal({ isOpen, onClose, onLaunchAnalyzer }) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '780px' }}
      >
        <button className="modal-close-btn" onClick={onClose} aria-label="Close Modal">
          <X size={20} />
        </button>

        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <BarChart2 size={20} color="var(--color-light-sage)" />
            <span style={{ fontSize: '0.78rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--color-light-sage)', fontWeight: 700 }}>
              ACOUSTIC SCIENCE
            </span>
          </div>
          <h3 className="modal-title">Schroeder Decay Method</h3>
          <p className="modal-subtitle">
            The mathematical backbone behind every RT60 measurement RESONA performs — backward energy integration for precise, reliable decay curve analysis.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* What is it */}
          <div style={{ background: 'rgba(18, 24, 19, 0.6)', padding: '20px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
            <h4 style={{ color: 'var(--color-cream)', fontSize: '1.05rem', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={18} color="var(--color-accent-emerald)" />
              What is the Schroeder Method?
            </h4>
            <p style={{ fontSize: '0.92rem', color: 'var(--color-text-dim)', lineHeight: 1.7 }}>
              Developed by Manfred R. Schroeder in 1965, the <strong>Schroeder backward integration</strong> method transforms a noisy impulse response decay curve into a smooth, monotonically decreasing Energy Decay Curve (EDC). It accumulates energy from the tail of the response backward — computing how much energy remains at each point in time, eliminating random noise fluctuations.
            </p>
          </div>

          {/* Formula */}
          <div style={{ background: 'rgba(18, 24, 19, 0.6)', padding: '20px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
            <h4 style={{ color: 'var(--color-cream)', fontSize: '1.05rem', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={18} color="var(--color-accent-amber)" />
              The Integration Formula
            </h4>
            <p style={{ fontSize: '0.92rem', color: 'var(--color-text-dim)', lineHeight: 1.7, marginBottom: '14px' }}>
              The Energy Decay Curve (EDC) is the reverse-time cumulative integral of the squared impulse response:
            </p>
            <div style={{ background: 'rgba(10, 15, 11, 0.8)', padding: '16px', borderRadius: '10px', textAlign: 'center', fontSize: '1.3rem', fontWeight: 700, color: 'var(--color-cream)', letterSpacing: '0.05em' }}>
              EDC(t) = ∫<sub>t</sub><sup>∞</sup> h²(τ) dτ
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginTop: '10px', textAlign: 'center' }}>
              Where <em>h(τ)</em> is the room impulse response. Result: a smooth dB energy curve from which decay slopes are extracted.
            </p>
          </div>

          {/* T20 vs T30 */}
          <div style={{ background: 'rgba(18, 24, 19, 0.6)', padding: '20px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
            <h4 style={{ color: 'var(--color-cream)', fontSize: '1.05rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingDown size={18} color="var(--color-light-sage)" />
              T20 vs T30 Decay Windows
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {[
                { label: 'T20', range: '−5 dB to −25 dB', desc: 'More robust in noisy environments — avoids the noise-floor-dominated tail. Used when signal-to-noise ratio is limited.', color: 'var(--color-accent-emerald)' },
                { label: 'T30', range: '−5 dB to −35 dB', desc: 'Wider evaluation range yielding a more statistically stable estimate. Best used in controlled, quiet acoustic environments.', color: 'var(--color-accent-amber)' },
              ].map((item) => (
                <div key={item.label} style={{ background: 'rgba(10, 15, 11, 0.6)', borderRadius: '10px', padding: '16px', border: `1px solid rgba(255,255,255,0.08)` }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: item.color, marginBottom: '4px' }}>{item.label}</div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: item.color, marginBottom: '8px', opacity: 0.8 }}>{item.range}</div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-dim)', lineHeight: 1.6 }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* R² */}
          <div style={{ background: 'rgba(18, 24, 19, 0.6)', padding: '20px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
            <h4 style={{ color: 'var(--color-cream)', fontSize: '1.05rem', marginBottom: '10px' }}>R² Regression Quality Metric</h4>
            <p style={{ fontSize: '0.92rem', color: 'var(--color-text-dim)', lineHeight: 1.7, marginBottom: '14px' }}>
              RESONA fits a least-squares linear regression to the EDC decay window. The <strong>R²</strong> value tells you how well the room follows a theoretical linear decay:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              {[
                { range: 'R² ≥ 0.99', label: 'Excellent', color: 'var(--color-accent-emerald)' },
                { range: '0.95 – 0.99', label: 'Good', color: 'var(--color-accent-amber)' },
                { range: '< 0.95', label: 'Investigate Room', color: '#f87171' },
              ].map((r) => (
                <div key={r.range} style={{ background: 'rgba(10, 15, 11, 0.7)', borderRadius: '10px', padding: '14px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', color: r.color, marginBottom: '4px' }}>{r.range}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{r.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '4px' }}>
            <button
              className="btn-pill-primary"
              onClick={() => { onClose(); onLaunchAnalyzer(); }}
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
