import React from 'react';
import whatWeDoImg from '../assets/what-we-do.jpg';
import { Activity, Sliders } from 'lucide-react';

export default function WhatWeDoSection({ onOpenRT60Info }) {
  return (
    <section className="what-we-do-section" id="what-we-do">
      <div className="container">
        <div className="what-we-do-grid">
          {/* Left Text Column */}
          <div className="what-we-do-content">
            <h2 className="what-we-do-title">WHAT WE DO</h2>

            <div className="what-we-do-text">
              <p>
                Evaluating a space's sound quality, reverberation time is an
                essential parameter for room acoustics. Reverberation time, also
                known as RT60, measures the time it takes for sound to decay in a
                room after turning off the sound source. It defines the time
                required for the sound pressure level to decrease by 60 decibels
                (dB) from its initial level.
              </p>

              <p>
                The room's size, shape, acoustic properties, and presence of
                absorbent or reflective surfaces influence RT60. Acoustic treatment
                can adjust the RT60 of a room to achieve the desired acoustic
                environment.
              </p>

              <p>
                For you, we calculate the RT60 value for your specific space and
                enable you to fix the acoustic parameters by tweaking certain
                aspects of the given space.
              </p>
            </div>

            <div style={{ marginTop: '12px' }}>
              <button
                className="btn-pill-primary"
                onClick={onOpenRT60Info}
              >
                LEARN MORE ABOUT RT60
              </button>
            </div>
          </div>

          {/* Right Image Column */}
          <div className="what-we-do-image-wrapper">
            <img
              src={whatWeDoImg}
              alt="Sound engineer analyzing room acoustics at mixing console"
              className="what-we-do-image"
            />
            <div className="image-badge">
              <span className="badge-dot"></span>
              <span>DSP Energy Decay & Schroeder Integration Active</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
