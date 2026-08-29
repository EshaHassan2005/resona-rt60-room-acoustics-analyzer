import React from 'react';
import { Activity, Play, Zap } from 'lucide-react';

export default function GetStartedCTA({ onOpenAnalyzer }) {
  return (
    <section className="get-started-section" id="get-started">
      <div className="container">
        <div className="get-started-card">
          <h2 className="get-started-title">
            GET STARTED WITH US BY FINDING OUT THE RT60 OF YOUR SPACE
          </h2>

          <p className="get-started-text">
            Pellentesque sed odio tempor tortor facilisis suscipit sit amet justo.
            Phasellus tempor, nunc vitae luctus euismod, leo diam tempor justo, id
            euismod dolor odio non nunc. Sed massa dolor, malesuada blandit urna nec,
            tempus egestas est. Phasellus ut sagittis libero. Donec varius, mi et
            gravida tempus, lacus lacus consequat justo, et porta sapien ipsum at
            elit. Proin vel erat nec ante commodo auctor. Curabitur ultricies leo
            arcu at posuere. Suspendisse sagittis diam sit amet augue mollis, in
            feugiat elit dictum. Praesent ultrices egestas est ut efficitur.
            Vestibulum sodales tellus eros, a dictum mi imperdiet sit amet. Duis
            consectetur sit amet diam quis commodo.
          </p>

          <button
            className="btn-pill-primary"
            onClick={onOpenAnalyzer}
            style={{ fontSize: '0.95rem', padding: '16px 42px',fontWeight:'900',boxShadow:'none' }}
          >
            TRY OUT OUR GENERATOR
          </button>
        </div>
      </div>
    </section>
  );
}
