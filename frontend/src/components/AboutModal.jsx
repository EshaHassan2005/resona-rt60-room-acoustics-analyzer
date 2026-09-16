import React from 'react';
import { X, Sparkles, Target, Award, Users, GitFork, GraduationCap } from 'lucide-react';

const TEAM = [
  {
    id: 1,
    name: 'Tarana Ahmed',
    studentID: '2305040',
    department: 'Department of Computer Science and Engineering (CSE)',
    university: 'Bangladesh University of Engineering and Technology',
    color: 'var(--color-accent-emerald)',
    github: 'https://github.com/sademu',
  },
  {
    id: 2,
    name: 'Sanjana Hassan',
    studentID: '2305051',
    department: 'Department of Computer Science and Engineering (CSE)',
    university: 'Bangladesh University of Engineering and Technology',
    color: 'var(--color-accent-amber)',
    github: 'https://github.com/EshaHassan2005',
  },
  {
    id: 3,
    name: 'Azrin Karim',
    studentID: '2305053',
    department: 'Department of Computer Science and Engineering (CSE)',
    university: 'Bangladesh University of Engineering and Technology',
    color: 'var(--color-accent-cyan)',
    github: 'https://github.com/helloaiki',
  },
];

export default function AboutModal({ isOpen, onClose, onLaunchAnalyzer }) {
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
            <Sparkles size={20} color="var(--color-light-sage)" />
            <span style={{ fontSize: '0.78rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--color-light-sage)', fontWeight: 700 }}>
              ABOUT US
            </span>
          </div>
          <h3 className="modal-title">Welcome to RESONA</h3>
          <p className="modal-subtitle">
            A student-built acoustic analysis platform developed by students of Bangladesh University of Engineering and Technology (BUET), combining rigorous DSP mathematics with a modern, accessible interface.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Mission + Vision */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ background: 'rgba(18, 24, 19, 0.6)', padding: '20px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
              <h4 style={{ color: 'var(--color-cream)', fontSize: '1.05rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Target size={18} color="var(--color-accent-emerald)" />
                Our Mission
              </h4>
              <p style={{ fontSize: '0.92rem', color: 'var(--color-text-dim)', lineHeight: 1.7 }}>
                At <strong>RESONA</strong>, we believe every space possesses a unique sonic fingerprint. We combine mathematical impulse analysis (Schroeder integration, octave-band filtering, Sabine &amp; Eyring formulas) with practical room treatment designs.
              </p>
            </div>
            <div style={{ background: 'rgba(18, 24, 19, 0.6)', padding: '20px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
              <h4 style={{ color: 'var(--color-cream)', fontSize: '1.05rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Award size={18} color="var(--color-accent-amber)" />
                Our Vision
              </h4>
              <p style={{ fontSize: '0.92rem', color: 'var(--color-text-dim)', lineHeight: 1.7 }}>
                To democratize professional acoustic analysis. Tools that once required expensive equipment should be accessible to any student, hobbyist, or engineer with a browser.
              </p>
            </div>
          </div>

          {/* Team Section */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={18} color="var(--color-light-sage)" />
                <span style={{ fontSize: '0.78rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--color-light-sage)', fontWeight: 700 }}>
                  THE TEAM
                </span>
              </div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                borderRadius: '20px',
                background: 'rgba(34, 197, 94, 0.08)',
                border: '1px solid rgba(34, 197, 94, 0.25)',
                fontSize: '0.78rem',
                color: 'var(--color-light-sage)',
                fontWeight: 600,
              }}>
                <GraduationCap size={15} color="var(--color-accent-emerald)" />
                <span>BUET • Department of CSE</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
              {TEAM.map((member) => {
                const initials = member.name.split(' ').map((n) => n[0]).join('');
                return (
                  <div
                    key={member.id}
                    style={{
                      background: 'rgba(18, 24, 19, 0.6)',
                      padding: '20px',
                      borderRadius: '12px',
                      border: '1px solid var(--glass-border)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                    }}
                  >
                    {/* Avatar */}
                    <div style={{
                      width: '52px',
                      height: '52px',
                      borderRadius: '50%',
                      background: 'var(--bg-olive-forest)',
                      border: `2px solid ${member.color}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.1rem',
                      fontWeight: 800,
                      color: member.color,
                    }}>
                      {initials}
                    </div>

                    {/* Member Details */}
                    <div>
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-cream)', marginBottom: '4px' }}>
                        {member.name}
                      </div>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: member.color, letterSpacing: '0.04em', marginBottom: '6px' }}>
                        Student ID: {member.studentID}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-light-sage)', marginBottom: '3px', fontWeight: 500 }}>
                        {member.department}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--color-text-dim)', lineHeight: 1.4 }}>
                        {member.university}
                      </div>
                    </div>

                    {/* Social links */}
                    <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: '6px' }}>
                      {[
                        { href: member.github, icon: <GitFork size={13} />, label: 'GitHub' },
                      ].map((s) => (
                        <a
                          key={s.label}
                          href={s.href}
                          aria-label={s.label}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '30px',
                            height: '30px',
                            borderRadius: '8px',
                            background: 'rgba(255, 255, 255, 0.07)',
                            color: 'var(--color-light-sage)',
                            transition: 'var(--transition-smooth)',
                          }}
                        >
                          {s.icon}
                        </a>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Engine block */}
          <div style={{ background: 'rgba(18, 24, 19, 0.6)', padding: '20px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
            <h4 style={{ color: 'var(--color-cream)', fontSize: '1.05rem', marginBottom: '8px' }}>The RESONA Engine</h4>
            <p style={{ fontSize: '0.92rem', color: 'var(--color-text-dim)', lineHeight: 1.7 }}>
              Our DSP algorithms calculate RT60 (T₂₀ and T₃₀ decay times) with R² regression quality metrics, frequency-by-frequency octave breakdowns from 125 Hz to 4 kHz, and clarity metrics (C₅₀, C₈₀, D₅₀) so you know exactly which frequency ranges need absorption or diffusion.
            </p>
          </div>

          {/* CTA */}
          <div style={{ textAlign: 'center', marginTop: '4px' }}>
            <button
              className="btn-pill-primary"
              onClick={() => { onClose(); onLaunchAnalyzer(); }}
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
