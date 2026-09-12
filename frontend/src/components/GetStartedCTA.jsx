import React from 'react';
import { Activity, Play, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';


export default function GetStartedCTA({ onOpenAnalyzer }) {
  return (
    <section className="get-started-section" id="get-started">
      <div className="container">
        <div className="get-started-card">
          <h2 className="get-started-title">
            GET STARTED WITH US BY FINDING OUT THE RT60 OF YOUR SPACE
          </h2>

          <p className="get-started-text">
            With our generator, find the RT60 of your space and understand how different components add up 
            to whipping up an audio profile of a given zone. Please consult with an audio engineer as some 
            of the results provided can be difficult to comprehend if you haven't dipped in the audio field 
            before. You can easily contact one of our consultants via navigating to the counselor's section.
          </p>

          <Link
            to="/generator"
            className="btn-pill-primary"
            style={{ fontSize: '0.95rem', padding: '16px 42px', fontWeight: '900', boxShadow: 'none', display: 'inline-block', textAlign: 'center' }}
            onClick={onOpenAnalyzer}
          >
            TRY OUT OUR GENERATOR
          </Link>
        </div>
      </div>
    </section>
  );
}
