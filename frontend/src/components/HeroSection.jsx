import React from 'react';
import heroBg from '../assets/orchestra.png';
import { ArrowRight } from 'lucide-react';

export default function HeroSection({ onOpenAbout, onOpenAnalyzer }) {
  return (
    <section
      className="hero-section"
      style={{
        backgroundImage: `url(${heroBg})`,
        justifyContent: 'flex-start',
        textAlign: 'left'
      }}
      id="hero"
    >
      <div className="hero-overlay"></div>

      <div className="container" style={{ width: '100%', position: 'relative', zIndex: 2 }}>
        <div
          className="hero-content"
          style={{
            maxWidth: '780px',
            margin: '0',
            textAlign: 'left'
          }}
        >
          <h1
            className="hero-title"
            style={{
              margin: '0 0 16px 0',
              fontSize: 'clamp(2.8rem, 6vw, 4.5rem)',
              fontWeight: '600',
              color: '#FFFAFD',
              textShadow: 'none',
              letterSpacing: '0.08em',
              textAlign: 'left',
              lineHeight: 1.1
            }}
          >
            RESONA
          </h1>

          <div
            style={{
              backgroundColor: '#FFFAFD',
              width: '100%',
              maxWidth: '750px',
              height: '2px',
              opacity: 0.5,
              marginBottom: '24px'
            }}
          ></div>

          <p
            className="hero-description"
            style={{
              textAlign: 'left',
              margin: '0 0 32px 0',
              maxWidth: '750px',
              fontSize: 'clamp(0.95rem, 1.4vw, 1.12rem)',
              lineHeight: 1.8,
              color: 'var(--color-text-dim)'
            }}
          >
            Here at <span className="bolded" style={{ fontWeight: '700', color: 'var(--color-cream)' }}>Resona</span>, we accede to your acoustic demands via 
            providing routes to dissecting, analyzing and tuning the auditory characteristics of your space. We have always 
            coveted for the highest degree of customer satisfaction through utilizing the most recent and innovative methods available 
            in the realm of sound technology. A space's acoustic character is what brings it to life and makes the 
            audience feel engulfed in whatever melody the space decides to convey. Start your journey with us via learning 
            more about what we do.
          </p>

          <div className="hero-actions" style={{ justifyContent: 'flex-start', gap: '16px' }}>
            <button 
              className="btn-pill-primary"
              style={{
                backgroundColor: '#2B3D2F',
                color: '#ffffff',
                opacity: 0.9,
                fontSize: '16px',
                fontWeight: '500',
                padding: '14px 28px',
                cursor: 'pointer'
              }}
              onClick={onOpenAbout}
            >
              LEARN MORE ABOUT US
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
