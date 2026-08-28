import React from 'react';

export default function Footer({ onOpenAbout, onOpenRT60Info, onOpenContact, onOpenAnalyzer }) {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          {/* Column 1: GET TO KNOW US */}
          <div>
            <h4 className="footer-col-title">GET TO KNOW US</h4>
            <ul className="footer-links">
              <li><a href="#about" onClick={(e) => { e.preventDefault(); onOpenAbout(); }}>About Us</a></li>
              <li><a href="#rt60" onClick={(e) => { e.preventDefault(); onOpenRT60Info(); }}>The Science of RT60</a></li>
              <li><a href="#methodology" onClick={(e) => { e.preventDefault(); onOpenRT60Info(); }}>Schroeder Decay Method</a></li>
              <li><a href="#standards" onClick={(e) => { e.preventDefault(); onOpenRT60Info(); }}>ISO 3382 Acoustics Standard</a></li>
            </ul>
          </div>

          {/* Column 2: DO BUSINESS WITH US */}
          <div>
            <h4 className="footer-col-title">DO BUSINESS WITH US</h4>
            <ul className="footer-links">
              <li><a href="#counseling" onClick={(e) => { e.preventDefault(); onOpenContact(); }}>Acoustic Consulting</a></li>
              <li><a href="#commercial" onClick={(e) => { e.preventDefault(); onOpenContact(); }}>Studio & Cinema Treatment</a></li>
              <li><a href="#enterprise" onClick={(e) => { e.preventDefault(); onOpenContact(); }}>Architectural Engineering</a></li>
              <li><a href="#api" onClick={(e) => { e.preventDefault(); onOpenAnalyzer(); }}>DSP API Integration</a></li>
            </ul>
          </div>

          {/* Column 3: LET US HELP YOU */}
          <div>
            <h4 className="footer-col-title">LET US HELP YOU</h4>
            <ul className="footer-links">
              <li><a href="#generator" onClick={(e) => { e.preventDefault(); onOpenAnalyzer(); }}>Room RT60 Generator</a></li>
              <li><a href="#clarity" onClick={(e) => { e.preventDefault(); onOpenAnalyzer(); }}>C50 / C80 Clarity Index</a></li>
              <li><a href="#calculator" onClick={(e) => { e.preventDefault(); onOpenAnalyzer(); }}>Absorption Treatment Plan</a></li>
              <li><a href="#contact" onClick={(e) => { e.preventDefault(); onOpenContact(); }}>Contact Support</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <div>
            © {new Date().getFullYear()} <strong>RESONA</strong>. Room Acoustics & Reverberation Analyzer.
          </div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <span>Sabine & Eyring Acoustic Engine</span>
            <span>•</span>
            <span>ISO 3382 Compliant</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
