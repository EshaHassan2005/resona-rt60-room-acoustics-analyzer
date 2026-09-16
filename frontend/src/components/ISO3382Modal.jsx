import React from 'react';
import { X, BookOpen, CheckCircle, Info } from 'lucide-react';

const PARAMS = [
  { symbol: 'RT60', name: 'Reverberation Time', def: 'Time for SPL to decay 60 dB after source stops', unit: 's' },
  { symbol: 'T20', name: 'Early Decay Window', def: 'RT60 extrapolated from −5 dB to −25 dB slope', unit: 's' },
  { symbol: 'T30', name: 'Late Decay Window', def: 'RT60 extrapolated from −5 dB to −35 dB slope', unit: 's' },
  { symbol: 'EDT', name: 'Early Decay Time', def: 'RT60 extrapolated from 0 to −10 dB — perceptual loudness', unit: 's' },
  { symbol: 'C50', name: 'Clarity (Speech)', def: 'Energy before 50 ms vs. after — speech intelligibility', unit: 'dB' },
  { symbol: 'C80', name: 'Clarity (Music)', def: 'Energy before 80 ms vs. after — music clarity', unit: 'dB' },
  { symbol: 'D50', name: 'Definition', def: 'Fraction of early energy (0–50 ms) to total energy', unit: '%' },
];

const TARGETS = [
  { room: 'Recording Studio', rt60: '0.30 – 0.45 s', c50: '> +3 dB' },
  { room: 'Home Theater', rt60: '0.40 – 0.55 s', c50: '> +2 dB' },
  { room: 'Conference Room', rt60: '0.60 – 0.80 s', c50: '> 0 dB' },
  { room: 'Classroom', rt60: '0.40 – 0.60 s', c50: '> +1 dB' },
  { room: 'Concert Hall', rt60: '1.60 – 2.20 s', c50: 'N/A' },
];

export default function ISO3382Modal({ isOpen, onClose, onLaunchAnalyzer }) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '800px' }}
      >
        <button className="modal-close-btn" onClick={onClose} aria-label="Close Modal">
          <X size={20} />
        </button>

        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <BookOpen size={20} color="var(--color-light-sage)" />
            <span style={{ fontSize: '0.78rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--color-light-sage)', fontWeight: 700 }}>
              INTERNATIONAL STANDARD
            </span>
          </div>
          <h3 className="modal-title">ISO 3382 Acoustics Standard</h3>
          <p className="modal-subtitle">
            The global standard defining how room acoustics are measured, reported, and evaluated — and how RESONA implements it in every analysis.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* What is ISO 3382 */}
          <div style={{ background: 'rgba(18, 24, 19, 0.6)', padding: '20px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
            <h4 style={{ color: 'var(--color-cream)', fontSize: '1.05rem', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Info size={18} color="var(--color-accent-amber)" />
              What is ISO 3382?
            </h4>
            <p style={{ fontSize: '0.92rem', color: 'var(--color-text-dim)', lineHeight: 1.7, marginBottom: '14px' }}>
              ISO 3382 is the International Organization for Standardization's standard for measuring room acoustic parameters, divided into three parts:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              {[
                { part: 'Part 1', title: 'Performance Spaces', desc: 'Concert halls, opera houses, auditoria.' },
                { part: 'Part 2', title: 'Ordinary Rooms', desc: 'Offices, classrooms, meeting rooms.' },
                { part: 'Part 3', title: 'Open Plan Offices', desc: 'Large open-plan work environments.' },
              ].map((p) => (
                <div key={p.part} style={{ background: 'rgba(10, 15, 11, 0.6)', borderRadius: '10px', padding: '14px', border: '1px solid rgba(229,179,100,0.2)' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.12em', color: 'var(--color-accent-amber)', marginBottom: '4px' }}>{p.part}</div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--color-cream)', marginBottom: '6px' }}>{p.title}</div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>{p.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Parameters table */}
          <div style={{ background: 'rgba(18, 24, 19, 0.6)', padding: '20px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
            <h4 style={{ color: 'var(--color-cream)', fontSize: '1.05rem', marginBottom: '14px' }}>Defined Parameters</h4>
            <div style={{ overflowX: 'auto', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(10, 15, 11, 0.8)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <th style={{ textAlign: 'left', padding: '10px 14px', color: 'var(--color-accent-emerald)', fontWeight: 700 }}>Symbol</th>
                    <th style={{ textAlign: 'left', padding: '10px 14px', color: 'var(--color-cream)', fontWeight: 700 }}>Parameter</th>
                    <th style={{ textAlign: 'left', padding: '10px 14px', color: 'var(--color-cream)', fontWeight: 700 }}>Definition</th>
                    <th style={{ textAlign: 'left', padding: '10px 14px', color: 'var(--color-accent-amber)', fontWeight: 700 }}>Unit</th>
                  </tr>
                </thead>
                <tbody>
                  {PARAMS.map((p, i) => (
                    <tr key={p.symbol} style={{ background: i % 2 === 0 ? 'rgba(40,61,41,0.25)' : 'transparent', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '9px 14px', fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-accent-emerald)' }}>{p.symbol}</td>
                      <td style={{ padding: '9px 14px', fontWeight: 600, color: 'var(--color-cream)' }}>{p.name}</td>
                      <td style={{ padding: '9px 14px', color: 'var(--color-text-dim)' }}>{p.def}</td>
                      <td style={{ padding: '9px 14px', fontFamily: 'monospace', color: 'var(--color-accent-amber)' }}>{p.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Target values */}
          <div style={{ background: 'rgba(18, 24, 19, 0.6)', padding: '20px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
            <h4 style={{ color: 'var(--color-cream)', fontSize: '1.05rem', marginBottom: '14px' }}>ISO 3382 Target Values by Room Type</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
              {TARGETS.map((t) => (
                <div key={t.room} style={{ padding: '12px', background: 'rgba(40, 61, 41, 0.5)', borderRadius: '8px' }}>
                  <strong style={{ color: 'var(--color-cream)', fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>{t.room}</strong>
                  <p style={{ color: 'var(--color-accent-emerald)', fontWeight: 700, fontSize: '0.95rem', margin: 0 }}>{t.rt60}</p>
                  {t.c50 !== 'N/A' && <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', margin: '2px 0 0' }}>C₅₀: {t.c50}</p>}
                </div>
              ))}
            </div>
          </div>

          {/* RESONA compliance */}
          <div style={{ background: 'rgba(18, 24, 19, 0.6)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(74,222,128,0.25)' }}>
            <h4 style={{ color: 'var(--color-accent-emerald)', fontSize: '1.05rem', marginBottom: '12px' }}>How RESONA Implements ISO 3382</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                'RT60 (T20 & T30) via Schroeder backward integration on octave-band filtered impulse responses',
                'Clarity metrics C50, C80, and D50 from the first 50/80 ms energy window ratios',
                'Six octave bands analysed: 125 Hz, 250 Hz, 500 Hz, 1 kHz, 2 kHz, 4 kHz',
                'R² regression quality on all decay slope estimates',
                'Treatment recommendations based on ISO 3382 room-type targets',
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.9rem', color: 'var(--color-text-dim)' }}>
                  <CheckCircle size={15} color="var(--color-accent-emerald)" style={{ marginTop: '2px', flexShrink: 0 }} />
                  {item}
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
