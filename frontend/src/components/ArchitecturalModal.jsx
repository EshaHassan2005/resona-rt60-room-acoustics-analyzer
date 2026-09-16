import React, { useState } from 'react';
import { X, Building2, Ruler, ClipboardCheck, FileText, Layers, Send, CheckCircle2 } from 'lucide-react';

const STAGES = [
  { icon: <Ruler size={16} color="var(--color-accent-emerald)" />, title: 'Acoustic Design', desc: 'We work with your architectural plans to model room modes, HVAC noise, and early reflection patterns before construction begins.' },
  { icon: <Layers size={16} color="var(--color-accent-amber)" />, title: '3D Acoustic Modeling', desc: 'Ray-tracing simulation of the acoustic field predicts RT60, C50/C80, and STI across all octave bands.' },
  { icon: <Building2 size={16} color="var(--color-light-sage)" />, title: 'Implementation', desc: 'Material specifications and contractor-ready blueprints integrated with your architectural drawings.' },
  { icon: <ClipboardCheck size={16} color="var(--color-accent-emerald)" />, title: 'ISO 3382 Certification', desc: 'Post-construction measurement session confirming all parameters meet ISO 3382 targets for your room classification.' },
];

export default function ArchitecturalModal({ isOpen, onClose }) {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', org: '', projectType: 'new', message: '' });

  if (!isOpen) return null;

  const handleClose = () => {
    setSubmitted(false);
    setFormData({ name: '', email: '', org: '', projectType: 'new', message: '' });
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
            <Building2 size={20} color="var(--color-light-sage)" />
            <span style={{ fontSize: '0.78rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--color-light-sage)', fontWeight: 700 }}>
              ARCHITECTURAL SERVICES
            </span>
          </div>
          <h3 className="modal-title">Architectural Engineering</h3>
          <p className="modal-subtitle">
            End-to-end acoustic engineering for new builds and renovation projects — from concept design to ISO 3382 post-construction certification.
          </p>
        </div>

        {submitted ? (
          <div style={{ textAlign: 'center', padding: '36px 12px' }}>
            <CheckCircle2 size={56} color="var(--color-accent-emerald)" style={{ margin: '0 auto 16px' }} />
            <h4 style={{ fontSize: '1.4rem', color: 'var(--color-cream)', marginBottom: '8px' }}>Project Inquiry Received!</h4>
            <p style={{ color: 'var(--color-text-dim)', fontSize: '0.95rem', maxWidth: '420px', margin: '0 auto 24px' }}>
              Our architectural acoustic team will contact you within 48 hours.
            </p>
            <button className="btn-pill-primary" onClick={handleClose}>Back to RESONA</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Project Scope */}
            <div style={{ background: 'rgba(18, 24, 19, 0.6)', padding: '20px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <FileText size={18} color="var(--color-light-sage)" />
                <h4 style={{ color: 'var(--color-cream)', fontSize: '1.05rem' }}>Project Scope</h4>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {[
                  'New construction — acoustic design from the ground up',
                  'Renovation projects — retrofit treatment to existing buildings',
                  'Open-plan offices — ISO 3382-3 distraction distance compliance',
                  'Educational facilities — classroom speech intelligibility (STI > 0.60)',
                  'Healthcare spaces — low RT60 for patient communication',
                  'Concert halls & performance venues — full ISO 3382-1 compliance',
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.88rem', color: 'var(--color-text-dim)' }}>
                    <CheckCircle2 size={14} color="var(--color-accent-emerald)" style={{ marginTop: '2px', flexShrink: 0 }} />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* Project Stages */}
            <div style={{ background: 'rgba(18, 24, 19, 0.6)', padding: '20px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
              <h4 style={{ color: 'var(--color-cream)', fontSize: '1.05rem', marginBottom: '14px' }}>Project Stages</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {STAGES.map((stage, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(18,24,19,0.9)', border: '1px solid rgba(255,255,255,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {stage.icon}
                    </div>
                    <div>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-cream)' }}>{stage.title} — </span>
                      <span style={{ fontSize: '0.88rem', color: 'var(--color-text-dim)' }}>{stage.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Metrics */}
            <div style={{ background: 'rgba(18, 24, 19, 0.6)', padding: '20px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
              <h4 style={{ color: 'var(--color-cream)', fontSize: '1.05rem', marginBottom: '12px' }}>Key Acoustic Metrics We Target</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                {[
                  { metric: 'RT60', desc: 'Reverberation time per ISO 3382', color: 'var(--color-accent-emerald)' },
                  { metric: 'STI', desc: 'Speech Transmission Index', color: 'var(--color-accent-amber)' },
                  { metric: 'Lp,A', desc: 'Spatial decay rate (open plan)', color: 'var(--color-light-sage)' },
                  { metric: 'NR/NC', desc: 'Noise rating for HVAC systems', color: 'var(--color-accent-emerald)' },
                ].map((m, i) => (
                  <div key={i} style={{ background: 'rgba(10, 15, 11, 0.6)', borderRadius: '10px', padding: '12px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontWeight: 800, fontFamily: 'monospace', fontSize: '1rem', color: m.color, marginBottom: '4px' }}>{m.metric}</div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', lineHeight: 1.4 }}>{m.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Form */}
            <div style={{ background: 'rgba(18, 24, 19, 0.6)', padding: '20px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
              <h4 style={{ color: 'var(--color-cream)', fontSize: '1.05rem', marginBottom: '14px' }}>Submit a Project Inquiry</h4>
              <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-grid" style={{ marginBottom: 0 }}>
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input required type="text" placeholder="e.g. Dr. Sarah Lee" className="form-input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input required type="email" placeholder="you@firm.com" className="form-input" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                  </div>
                </div>
                <div className="form-grid" style={{ marginBottom: 0 }}>
                  <div className="form-group">
                    <label className="form-label">Organization / Firm</label>
                    <input type="text" placeholder="e.g. Lee & Partners Architects" className="form-input" value={formData.org} onChange={e => setFormData({ ...formData, org: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Project Type</label>
                    <select className="form-select" value={formData.projectType} onChange={e => setFormData({ ...formData, projectType: e.target.value })}>
                      <option value="new">New Construction</option>
                      <option value="renovation">Renovation / Retrofit</option>
                      <option value="compliance">ISO 3382 Compliance Audit</option>
                      <option value="consultation">Consultation Only</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Project Description</label>
                  <textarea rows="3" className="form-textarea" placeholder="e.g. 400-seat concert hall renovation, targeting RT60 of 1.8 s at mid-frequencies..." value={formData.message} onChange={e => setFormData({ ...formData, message: e.target.value })} />
                </div>
                <button type="submit" className="btn-pill-primary" style={{ width: '100%', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <Send size={18} /> SUBMIT PROJECT INQUIRY
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
