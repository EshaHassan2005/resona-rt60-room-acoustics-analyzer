import React from 'react';
import heroBg from '../assets/hero-bg.jpg';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function HeroSection({ onOpenAbout, onOpenAnalyzer }) {
  return (
    <section
      className="hero-section"
      style={{ backgroundImage: `url(${heroBg})` }}
      id="hero"
    >
      <div className="hero-overlay"></div>

      <div className="container hero-content">
        <span className="hero-tag">
          Acoustic Engineering & Reverberation Analysis
        </span>

        <h1 className="hero-title">RESONA</h1>

        <p className="hero-description">
          Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium
          doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore
          veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim
          ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia
          consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.
        </p>

        <div className="hero-actions">
          <button
            className="btn-pill-primary"
            onClick={onOpenAbout}
          >
            LEARN MORE ABOUT US
          </button>
          <button
            className="btn-pill-secondary"
            onClick={onOpenAnalyzer}
          >
            TRY OUT GENERATOR
          </button>
        </div>
      </div>
    </section>
  );
}
