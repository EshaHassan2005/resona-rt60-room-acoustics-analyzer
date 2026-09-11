import React from 'react';
import { Mic, Music, Tv, Briefcase, Activity, CheckCircle2 } from 'lucide-react';

export default function SpaceShowcase({ onSelectSpace }) {
  const spaces = [
    {
      id: 'recording_studio',
      title: 'Music & Recording Studio',
      subtitle: 'Critical Listening & Tracking',
      description:
        'Tuned for pristine frequency linearity, tight low-frequency decay, and controlled early reflections for accurate mixing and mastering.',
      rt60Range: '0.2s — 0.4s',
      icon: Music,
      accent: '#667a65',
      badge: 'Critical Audio',
    },
    {
      id: 'home_theater',
      title: 'Home Cinema & Theater',
      subtitle: 'Immersive Surround Experience',
      description:
        'Optimized for Dolby Atmos multichannel localization, speech dialogue clarity, and powerful, un-muddy bass response.',
      rt60Range: '0.2s — 0.4s',
      icon: Tv,
      accent: '#e5b364',
      badge: 'Surround Sound',
    },
    {
      id: 'podcast_booth',
      title: 'Podcast & Vocal Booth',
      subtitle: 'Dry & Articulate Voice Clarity',
      description:
        'Eliminates flutter echoes and room ring for intimate, upfront broadcast vocal recordings requiring minimal post-processing EQ.',
      rt60Range: '0.2s — 0.35s',
      icon: Mic,
      accent: '#4ade80',
      badge: 'High Intelligibility',
    },
    {
      id: 'office',
      title: 'Office & Meeting Room',
      subtitle: 'Speech Privacy & Focus',
      description:
        'Meets ISO 3382-3 open-plan and conference acoustic standards to prevent fatigue, reduce reverberation, and boost conversational intelligibility.',
      rt60Range: '0.4s — 0.5s',
      icon: Briefcase,
      accent: '#93a891',
      badge: 'ISO 3382 Certified',
    },
  ];

  return (
    <section className="showcase-section" id="spaces">
      <div className="container">
        <div className="section-header">
          <p className="section-tag">BUILD YOUR OWN EDEN</p>
          <h2 className="section-title">Acoustic Precision For Every Room</h2>
        </div>

        <div className="showcase-grid">
          {spaces.map((space) => {
            const IconComponent = space.icon;
            return (
              <div
                key={space.id}
                className="space-card"
                onClick={() => onSelectSpace(space.id)}
                style={{ cursor: 'pointer' }}
              >
                <div className="space-card-content">
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: 'rgba(102, 122, 101, 0.2)',
                      border: '1px solid var(--glass-border-bright)',
                      marginBottom: '16px',
                      color: space.accent,
                    }}
                  >
                    <IconComponent size={24} />
                  </div>

                  <span
                    style={{
                      float: 'right',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      padding: '4px 10px',
                      borderRadius: '999px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      color: 'var(--color-cream)',
                    }}
                  >
                    {space.badge}
                  </span>

                  <h3 className="space-card-title">{space.title}</h3>
                  <p
                    style={{
                      fontSize: '0.82rem',
                      color: 'var(--color-light-sage)',
                      fontWeight: 600,
                      marginBottom: '12px',
                    }}
                  >
                    {space.subtitle}
                  </p>
                  <p className="space-card-desc">{space.description}</p>

                  <div className="space-card-rt60">
                    <span className="rt60-label">Target RT60:</span>
                    <span className="rt60-value">{space.rt60Range}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
