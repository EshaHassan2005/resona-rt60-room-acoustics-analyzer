import React from "react";
import { Activity, ArrowRight } from "lucide-react";

export default function SpaceShowcase({ onStartAnalysis }) {
  return (
    <section className="showcase-section" id="spaces">
      <div className="container">
        <div className="section-header">
          <p className="section-tag">ACOUSTIC ANALYSIS</p>
          <h2 className="section-title">Analyze Any Room With RESONA</h2>
          <p className="section-subtitle">
            Start with one analysis flow, then choose the room type that matches
            your space.
          </p>
        </div>
        <button
          type="button"
          className="analysis-launch-card"
          onClick={onStartAnalysis}
        >
          <div className="analysis-launch-icon">
            <Activity size={28} />
          </div>
          <div className="analysis-launch-copy">
            <span className="analysis-launch-label">
              START ACOUSTIC ANALYSIS
            </span>
            <h3>Find the right acoustic target for your room</h3>
            <p>
              Choose a room type first. You’ll then get room-specific
              requirements and treatment recommendations before entering your
              measurements.
            </p>
          </div>
          <span className="analysis-launch-arrow">
            <ArrowRight size={22} />
          </span>
        </button>
      </div>
    </section>
  );
}
