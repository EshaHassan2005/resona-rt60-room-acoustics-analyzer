import React, { useState } from 'react';
import { Menu, X, Sliders, Volume2, Info, Headphones } from 'lucide-react';

export default function Navbar({ onOpenAnalyzer, onOpenRT60Info, onOpenContact }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        {/* Brand Logo & Slogan */}
        <div className="nav-brand"  style={{color:'#27362A'}} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} >
          <div className="brand-logo-icon">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
          </div>
          <span className='brandname' style={{opacity:'8',color:'#e7e2e2',fontWeight:'500'}}>RESONA</span>
          <span className="nav-slogan" style={{ marginLeft: '45px',paddingLeft:'310px',opacity:'.7' }}>
            Find and create your own space with us
          </span>
        </div>

        {/* Desktop Nav Links */}
        <ul className="nav-links">
          <li><a href="#what-we-do">What We Do</a></li>
          <li><a href="#spaces">Spaces</a></li>
          <li><a href="#counselors" onClick={(e) => { e.preventDefault(); onOpenContact(); }}>Counselors</a></li>
        </ul>

        {/* Mobile Hamburger Toggle */}
        <button
          className="mobile-menu-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-nav-drawer">
          <a href="#what-we-do" onClick={() => setMobileMenuOpen(false)}>What We Do</a>
          <a href="#spaces" onClick={() => setMobileMenuOpen(false)}>Spaces</a>
          <a href="#rt60" onClick={() => { setMobileMenuOpen(false); onOpenRT60Info(); }}>Learn About RT60</a>
          <a href="#counselors" onClick={() => { setMobileMenuOpen(false); onOpenContact(); }}>Consult Counselors</a>
          <button
            className="btn-pill-primary"
            style={{ width: '100%', marginTop: '8px' }}
            onClick={() => { setMobileMenuOpen(false); onOpenAnalyzer(); }}
          >
            Launch RT60 Generator
          </button>
        </div>
      )}
    </nav>
  );
}
