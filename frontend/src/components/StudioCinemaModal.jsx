import React, { useState } from 'react';
import { X, Music, Film, Mic2, PanelTop, Send, CheckCircle2 } from 'lucide-react';

const SPACES = [
  { icon: <Music size={18} color="var(--color-accent-emerald)" />, title: 'Recording Studios', target: '0.30 – 0.45 s', desc: 'Ultra-controlled environment for clean recordings. Bass traps, broadband panels, and rear diffusers for flat, frequency-neutral response.' },
  { icon: <Film size={18} color="var(--color-accent-amber)" />, title: 'Home Theaters & Cinema', target: '0.40 – 0.55 s', desc: 'Immersive listening environment with controlled early reflections. Targets THX and Dolby Atmos room standards.' },
  { icon: <Mic2 size={18} color="var(--color-light-sage)" />, title: 'Mastering & Mixing Suites', target: '0.25 – 0.35 s', desc: 'Tightest acoustic control. Eliminates problematic modes and ensures flat spectral response at the mix position.' },
  { icon: <PanelTop size={18} color="var(--color-accent-amber)" />, title: 'Podcast & Voiceover', target: '0.20 – 0.30 s', desc: 'Dry, intimate vocal environments for broadcast-quality recordings. C50 > +3 dB is the primary design goal.' },
];

export default function StudioCinemaModal({ isOpen, onClose }) {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', spaceType: 'studio', size: '', message: '' });

  if (!isOpen) return null;

  const handleClose = () => {
    setSubmitted(false);
    setFormData({ name: '', email: '', spaceType: 'studio', size: '', message: '' });
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={handleClose}>
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '800px' }}
      >
        <button className="modal-close-btn" onClick={handleClose} aria-label="Close Modal">
          <X size={20} />
        </button>

        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Music size={20} color="var(--color-light-sage)" />
            <span style={{ fontSize: '0.78rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--color-light-sage)', fontWeight: 700 }}>
              STUDIO & CINEMA TREATMENT
            </span>
          </div>
          <h3 className="modal-title">Studio & Cinema Treatment</h3>
          <p className="modal-subtitle">
            Complete acoustic treatment plans for home recording studios, private cinemas, mastering suites, and podcast booths — designed to hit your exact RT60 and clarity targets.
          </p>
        </div>

        {submitted ? (
          <div style={{ textAlign: 'center', padding: '36px 12px' }}>
            <CheckCircle2 size={56} color="var(--color-accent-emerald)" style={{ margin: '0 auto 16px' }} />
            <h4 style={{ fontSize: '1.4rem', color: 'var(--color-cream)', marginBottom: '8px' }}>Treatment Plan Request Received!</h4>
            <p style={{ color: 'var(--color-text-dim)', fontSize: '0.95rem', maxWidth: '420px', margin: '0 auto 24px' }}>
              We'll be in touch within 24 hours with your treatment plan quote.
            </p>
            <button className="btn-pill-primary" onClick={handleClose}>Back to RESONA</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Space types */}
            <div style={{ background: 'rgba(18, 24, 19, 0.6)', padding: '20px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
              <h4 style={{ color: 'var(--color-cream)', fontSize: '1.05rem', marginBottom: '14px' }}>Spaces We Treat</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {SPACES.map((s, i) => (
                  <div key={i} style={{ background: 'rgba(10, 15, 11, 0.5)', borderRadius: '10px', padding: '14px', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      {s.icon}
                      <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-cream)' }}>{s.title}</span>
                    </div>
                    <div style={{ fontSize: '0.78rem', fontFamily: 'monospace', color: 'var(--color-accent-emerald)', marginBottom: '6px' }}>RT60 target: {s.target}</div>
                    <p style={{ fontSize: '0.82rem', color: 'var(--color-text-dim)', lineHeight: 1.55 }}>{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Treatment types */}
            <div style={{ background: 'rgba(18, 24, 19, 0.6)', padding: '20px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
              <h4 style={{ color: 'var(--color-cream)', fontSize: '1.05rem', marginBottom: '14px' }}>Treatment Types We Design</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { name: 'Bass Trapping', desc: 'Corner-mounted broadband absorbers targeting 80–250 Hz low-frequency buildup.' },
                  { name: 'Acoustic Panels', desc: 'Mid-frequency absorbers at first reflection points — side walls, ceiling clouds, and rear wall.' },
                  { name: 'Diffusion Panels', desc: 'QRD and skyline diffusers break up flutter echo while preserving room liveliness.' },
                  { name: 'Isolation Decoupling', desc: 'Floating floors, resilient channels, and mass-loaded vinyl for sound isolation between rooms.' },
                ].map((t, i) => (
                  <div key={i} style={{ display: 'flex', gap: '12px', fontSize: '0.9rem' }}>
                    <span style={{ fontWeight: 700, color: 'var(--color-accent-emerald)', minWidth: '140px', flexShrink: 0 }}>{t.name}</span>
                    <span style={{ color: 'var(--color-text-dim)' }}>{t.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Form */}
            <div style={{ background: 'rgba(18, 24, 19, 0.6)', padding: '20px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
              <h4 style={{ color: 'var(--color-cream)', fontSize: '1.05rem', marginBottom: '14px' }}>Get Your Treatment Plan</h4>
              <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-grid" style={{ marginBottom: 0 }}>
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input required type="text" placeholder="e.g. Alex Morgan" className="form-input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input required type="email" placeholder="alex@studio.com" className="form-input" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                  </div>
                </div>
                <div className="form-grid" style={{ marginBottom: 0 }}>
                  <div className="form-group">
                    <label className="form-label">Space Type</label>
                    <select className="form-select" value={formData.spaceType} onChange={e => setFormData({ ...formData, spaceType: e.target.value })}>
                      <option value="studio">Music Recording Studio</option>
                      <option value="cinema">Home Theater / Cinema</option>
                      <option value="mastering">Mastering Suite</option>
                      <option value="podcast">Podcast / Voiceover Studio</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Room Size (m²)</label>
                    <input type="text" placeholder="e.g. 20 m²" className="form-input" value={formData.size} onChange={e => setFormData({ ...formData, size: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Describe Your Acoustic Problems</label>
                  <textarea rows="3" className="form-textarea" placeholder="e.g. Flutter echo, harsh high frequencies, bass buildup in corners..." value={formData.message} onChange={e => setFormData({ ...formData, message: e.target.value })} />
                </div>
                <button type="submit" className="btn-pill-primary" style={{ width: '100%', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <Send size={18} /> REQUEST TREATMENT PLAN
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
