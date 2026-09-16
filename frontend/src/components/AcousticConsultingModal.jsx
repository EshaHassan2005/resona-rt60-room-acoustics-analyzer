import React, { useState } from 'react';
import { X, Headphones, Send, CheckCircle2, Mic, Building2 } from 'lucide-react';

const PROCESS = [
  { num: '01', title: 'Room Assessment', desc: 'We collect room dimensions, surface materials, and intended use to build an acoustic profile.' },
  { num: '02', title: 'Impulse Response Analysis', desc: 'Using our DSP engine, we analyze the room\'s impulse response across all six octave bands.' },
  { num: '03', title: 'Treatment Design', desc: 'Our consultants generate a custom absorption/diffusion layout targeting your RT60 and clarity goals.' },
  { num: '04', title: 'Report Delivery', desc: 'You receive a full written report with panel placement diagrams, material specs, and projected RT60.' },
];

export default function AcousticConsultingModal({ isOpen, onClose }) {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', roomType: 'studio', dimensions: '', message: '' });

  if (!isOpen) return null;

  const handleClose = () => {
    setSubmitted(false);
    setFormData({ name: '', email: '', roomType: 'studio', dimensions: '', message: '' });
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
            <Headphones size={20} color="var(--color-light-sage)" />
            <span style={{ fontSize: '0.78rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--color-light-sage)', fontWeight: 700 }}>
              DO BUSINESS WITH US
            </span>
          </div>
          <h3 className="modal-title">Acoustic Consulting</h3>
          <p className="modal-subtitle">
            Personalized room diagnosis, impulse response analysis, and treatment layout blueprints — tailored for your specific space and acoustic goals.
          </p>
        </div>

        {submitted ? (
          <div style={{ textAlign: 'center', padding: '36px 12px' }}>
            <CheckCircle2 size={56} color="var(--color-accent-emerald)" style={{ margin: '0 auto 16px' }} />
            <h4 style={{ fontSize: '1.4rem', color: 'var(--color-cream)', marginBottom: '8px' }}>Consultation Request Received!</h4>
            <p style={{ color: 'var(--color-text-dim)', fontSize: '0.95rem', maxWidth: '420px', margin: '0 auto 24px' }}>
              Our acoustic engineers will review your room specs and contact you within 24 hours with a custom plan.
            </p>
            <button className="btn-pill-primary" onClick={handleClose}>Back to RESONA</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* What's included */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              {[
                { icon: <Mic size={18} color="var(--color-accent-emerald)" />, title: 'Room Diagnosis', desc: 'Full acoustic profile: RT60 per octave, C50/C80 clarity, early decay time, problem-frequency identification.' },
                { icon: <Headphones size={18} color="var(--color-accent-amber)" />, title: 'Custom Treatment Plan', desc: 'Panel type, placement and coverage area calculated for your room shape and ISO 3382 RT60 target.' },
                { icon: <Building2 size={18} color="var(--color-light-sage)" />, title: 'Written Report', desc: 'PDF report with placement diagrams, material recommendations, and projected post-treatment RT60.' },
              ].map((item, i) => (
                <div key={i} style={{ background: 'rgba(18, 24, 19, 0.6)', padding: '16px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                  <div style={{ marginBottom: '8px' }}>{item.icon}</div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--color-cream)', marginBottom: '6px' }}>{item.title}</div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--color-text-dim)', lineHeight: 1.55 }}>{item.desc}</p>
                </div>
              ))}
            </div>

            {/* Process */}
            <div style={{ background: 'rgba(18, 24, 19, 0.6)', padding: '20px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
              <h4 style={{ color: 'var(--color-cream)', fontSize: '1.05rem', marginBottom: '14px' }}>Our Process</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {PROCESS.map((p) => (
                  <div key={p.num} style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                    <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-accent-emerald)', opacity: 0.4, lineHeight: 1, flexShrink: 0, minWidth: '24px' }}>{p.num}</span>
                    <div>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-cream)' }}>{p.title} — </span>
                      <span style={{ fontSize: '0.88rem', color: 'var(--color-text-dim)' }}>{p.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Form */}
            <div style={{ background: 'rgba(18, 24, 19, 0.6)', padding: '20px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
              <h4 style={{ color: 'var(--color-cream)', fontSize: '1.05rem', marginBottom: '14px' }}>Request a Consultation</h4>
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
                    <label className="form-label">Room Type</label>
                    <select className="form-select" value={formData.roomType} onChange={e => setFormData({ ...formData, roomType: e.target.value })}>
                      <option value="studio">Music Recording Studio</option>
                      <option value="cinema">Home Theater / Cinema</option>
                      <option value="podcast">Broadcast / Voiceover Booth</option>
                      <option value="office">Conference / Commercial Office</option>
                      <option value="other">Custom Architectural Project</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Approx. Dimensions (L × W × H)</label>
                    <input type="text" placeholder="e.g. 5m × 4m × 2.8m" className="form-input" value={formData.dimensions} onChange={e => setFormData({ ...formData, dimensions: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Acoustic Challenges / Goals</label>
                  <textarea rows="3" className="form-textarea" placeholder="e.g. Flutter echo, boomy low end at 80 Hz, sound leakage..." value={formData.message} onChange={e => setFormData({ ...formData, message: e.target.value })} />
                </div>
                <button type="submit" className="btn-pill-primary" style={{ width: '100%', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <Send size={18} /> REQUEST CONSULTATION
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
