import React from 'react';

export default function Footer({
  onOpenAbout,
  onOpenRT60Info,
  onOpenSchroeder,
  onOpenISO3382,
  onOpenRoomModes,
  onOpenConsulting,
  onOpenStudioCinema,
  onOpenArchitectural,
  onOpenContact,
  onOpenAnalyzer,
}) {
  const link = (label, handler) => (
    <li>
      <a href="#" onClick={(e) => { e.preventDefault(); handler(); }}>
        {label}
      </a>
    </li>
  );

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          {/* Column 1: GET TO KNOW US */}
          <div>
            <h4 className="footer-col-title">GET TO KNOW US</h4>
            <ul className="footer-links">
              {link('About Us', onOpenAbout)}
              {link('The Science of RT60', onOpenRT60Info)}
              {link('Room Modes & Standing Waves', onOpenRoomModes)}
              {link('Schroeder Decay Method', onOpenSchroeder)}
              {link('ISO 3382 Acoustics Standard', onOpenISO3382)}
            </ul>
          </div>

          {/* Column 2: DO BUSINESS WITH US */}
          <div>
            <h4 className="footer-col-title">DO BUSINESS WITH US</h4>
            <ul className="footer-links">
              {link('Acoustic Consulting', onOpenConsulting)}
              {link('Studio & Cinema Treatment', onOpenStudioCinema)}
              {link('Architectural Engineering', onOpenArchitectural)}
              {link('DSP API Integration', onOpenAnalyzer)}
            </ul>
          </div>

          {/* Column 3: LET US HELP YOU */}
          <div>
            <h4 className="footer-col-title">LET US HELP YOU</h4>
            <ul className="footer-links">
              {link('Room RT60 Generator', onOpenAnalyzer)}
              {link('C50 / C80 Clarity Index', onOpenAnalyzer)}
              {link('Absorption Treatment Plan', onOpenAnalyzer)}
              {link('Contact Support', onOpenContact)}
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <div>
            © {new Date().getFullYear()} <strong>RESONA</strong>. Room Acoustics &amp; Reverberation Analyzer.
          </div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <span>Sabine &amp; Eyring Acoustic Engine</span>
            <span>•</span>
            <span>ISO 3382 Compliant</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
