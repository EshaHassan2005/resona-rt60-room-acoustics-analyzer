import { useState, useRef, useCallback } from "react";
import { Layers, Box, Sparkles, SlidersHorizontal, RotateCcw, Eye } from "lucide-react";
import "../styles/waterfall-3d.css";

const BAND_CONFIG = [
  { key: "125", label: "125 Hz", sub: "Sub-Bass", color: "#f59e0b", glow: "rgba(245, 158, 11, 0.6)" },
  { key: "250", label: "250 Hz", sub: "Upper Bass", color: "#fbbf24", glow: "rgba(251, 191, 36, 0.6)" },
  { key: "500", label: "500 Hz", sub: "Lower Mid", color: "#10b981", glow: "rgba(16, 185, 129, 0.6)" },
  { key: "1000", label: "1 kHz", sub: "Core Mid", color: "#06b6d4", glow: "rgba(6, 182, 212, 0.6)" },
  { key: "2000", label: "2 kHz", sub: "Upper Mid", color: "#6366f1", glow: "rgba(99, 102, 241, 0.6)" },
  { key: "4000", label: "4 kHz", sub: "High Treble", color: "#ec4899", glow: "rgba(236, 72, 153, 0.6)" },
];

const BANDS = BAND_CONFIG.length;
const SCALE_X = 280; // time axis world length
const SCALE_Z = 195; // frequency depth world length
const SCALE_Y = 115; // amplitude world height
const DEFAULT_AZ = -38;
const DEFAULT_EL = 30;

export default function WaterfallPlot3D({ waterfallData, title = "3D Acoustic Reverberation Waterfall" }) {
  const [viewMode, setViewMode] = useState("ribbons");
  const [hoveredBand, setHoveredBand] = useState(null);
  const [selectedBand, setSelectedBand] = useState(null);
  const [azimuth, setAzimuth] = useState(DEFAULT_AZ);
  const [elevation, setElevation] = useState(DEFAULT_EL);

  const dragRef = useRef(null);
  const isDragging = useRef(false);

  // Orbital camera drag handlers
  const onMouseDown = useCallback((e) => {
    e.preventDefault();
    isDragging.current = true;
    dragRef.current = { startX: e.clientX, startY: e.clientY, az: azimuth, el: elevation };
  }, [azimuth, elevation]);

  const onMouseMove = useCallback((e) => {
    if (!isDragging.current || !dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setAzimuth(dragRef.current.az + dx * 0.45);
    setElevation(Math.max(-10, Math.min(75, dragRef.current.el - dy * 0.35)));
  }, []);

  const onMouseUp = useCallback(() => { isDragging.current = false; }, []);

  const touchRef = useRef(null);
  const onTouchStart = useCallback((e) => {
    const t = e.touches[0];
    touchRef.current = { x: t.clientX, y: t.clientY, az: azimuth, el: elevation };
  }, [azimuth, elevation]);
  const onTouchMove = useCallback((e) => {
    if (!touchRef.current) return;
    e.preventDefault();
    const t = e.touches[0];
    setAzimuth(touchRef.current.az + (t.clientX - touchRef.current.x) * 0.45);
    setElevation(Math.max(-10, Math.min(75, touchRef.current.el - (t.clientY - touchRef.current.y) * 0.35)));
  }, []);
  const onTouchEnd = useCallback(() => { touchRef.current = null; }, []);

  const resetCamera = () => { setAzimuth(DEFAULT_AZ); setElevation(DEFAULT_EL); };

  if (!waterfallData || !waterfallData.bands) return null;

  const timePoints = waterfallData.time_points || [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.8, 1.0, 1.2];
  const maxTime = Math.max(...timePoints) || 1.2;
  const isWireframe = viewMode === "wireframe";

  const svgW = 660;
  const svgH = 310;
  const cx = svgW / 2;
  const cy = svgH / 2 + 15;

  // Pre-compute rotation trig
  const azRad = (azimuth * Math.PI) / 180;
  const elRad = (elevation * Math.PI) / 180;
  const sinAz = Math.sin(azRad), cosAz = Math.cos(azRad);
  const sinEl = Math.sin(elRad), cosEl = Math.cos(elRad);

  /**
   * Project world (wx, wy, wz) → SVG screen (sx, sy) + depth ez.
   *
   * World ranges: wx ∈ [0,1] = time, wy ∈ [0,1] = normalised dB, wz ∈ [0,1] = freq band
   *
   * Pipeline:
   *   1. Centre around origin
   *   2. Rotate around Y (azimuth) — orbits left/right
   *   3. Rotate around X (elevation) — tilts up/down
   *   4. Parallel (orthographic) projection onto SVG plane
   *
   * Returns { sx, sy, ez } where ez is the depth value used for back-to-front sorting.
   * Larger ez = farther from camera = should be drawn first.
   */
  const project = (wx, wy, wz) => {
    // Step 1 — centre
    const lx = (wx - 0.5) * SCALE_X;
    const ly = (wy - 0.5) * SCALE_Y;
    const lz = (wz - 0.5) * SCALE_Z;

    // Step 2 — rotate around Y (azimuth)
    const rx = lx * cosAz - lz * sinAz;
    const ry = ly;
    const rz = lx * sinAz + lz * cosAz;

    // Step 3 — rotate around X (elevation)
    const ex = rx;
    const ey = ry * cosEl - rz * sinEl;
    const ez = ry * sinEl + rz * cosEl; // depth: larger = farther

    return { sx: cx + ex, sy: cy - ey, ez };
  };

  // Convenience: project band index + time unit + dB value
  const bandProject = (bIdx, u, db) => {
    const wx = u;
    const wy = Math.max(0, Math.min(1, (Number(db) + 60) / 60));
    const wz = bIdx / (BANDS - 1);
    return project(wx, wy, wz);
  };

  const floorProject = (bIdx, u) => bandProject(bIdx, u, -60);

  // Depth sort bands using actual projected ez
  // Sample each band's depth at its geometric centre (u=0.5, dB=-30 midpoint).
  // Paint largest ez (farthest) first so nearer bands overlap them correctly.
  const sortedBands = [...BAND_CONFIG]
    .map((cfg, bIdx) => {
      const { ez } = project(0.5, 0.5, bIdx / (BANDS - 1));
      return { cfg, bIdx, ez };
    })
    .sort((a, b) => b.ez - a.ez); // descending: farthest first

  // Floor corners
  const fBL = floorProject(0, 0);
  const fBR = floorProject(0, 1);
  const fFR = floorProject(BANDS - 1, 1);
  const fFL = floorProject(BANDS - 1, 0);

  const timeSlices = [0, 0.25, 0.5, 0.75, 1.0];

  const activeKey = selectedBand || hoveredBand;
  const activeConfig = BAND_CONFIG.find((b) => b.key === activeKey);
  const activePoints = activeKey ? waterfallData.bands?.[activeKey] || [] : null;

  return (
    <div className="waterfall-3d-card">
      {/* Header */}
      <div className="waterfall-3d-header">
        <div className="waterfall-3d-title-group">
          <div className="waterfall-3d-title">
            <Layers size={19} color="#34d399" />
            <span>{title}</span>
            <span className="waterfall-badge-3d">
              <Box size={11} /> 3D Orbital
            </span>
          </div>
          <span className="waterfall-3d-subtitle">
            Drag to orbit · Frequency (Z) × Time (X) × Amplitude dB (Y)
          </span>
        </div>

        <div className="waterfall-controls-group">
          <div className="waterfall-view-pills">
            {/*
              RIBBONS: shows filled volumetric curtain shapes with gradient shading under
              each decay ridge — like an acoustic waterfall with solid "walls".
              Best for reading individual band decay shapes and seeing amplitude clearly.
            */}
            <button type="button"
              className={`waterfall-pill-btn ${viewMode === "ribbons" ? "active" : ""}`}
              onClick={() => setViewMode("ribbons")}
              title="Ribbons: filled volumetric curtain with gradient shading">
              <Box size={12} /> Ribbons
            </button>

            {/*
              WIREFRAME: hides all filled curtain shapes entirely. Shows only the
              glowing crest ridge lines (the decay curves) plus bright green cross-ribs
              that connect all frequency bands at fixed time slices — forming a 3D
              acoustic terrain mesh. Best for seeing the full 3D shape of the reverb field.
            */}
            <button type="button"
              className={`waterfall-pill-btn ${viewMode === "wireframe" ? "active" : ""}`}
              onClick={() => setViewMode("wireframe")}
              title="Wireframe: pure ridge lines + mesh cross-ribs, no fill">
              <Sparkles size={12} /> Wireframe
            </button>
          </div>

          <button type="button" className="waterfall-pill-btn"
            onClick={resetCamera} title="Reset camera to default angle">
            <RotateCcw size={12} /> Reset
          </button>
        </div>
      </div>

      {/* Camera angle readout */}
      <div className="waterfall-angle-readout">
        <Eye size={11} />
        <span>Az {Math.round(azimuth)}°  ·  El {Math.round(elevation)}°</span>
      </div>

      {/* SVG 3D Canvas */}
      <div className="waterfall-svg-wrapper waterfall-draggable">
        <svg
          viewBox={`0 0 ${svgW} ${svgH}`}
          className="waterfall-svg-container"
          preserveAspectRatio="xMidYMid meet"
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <defs>
            <filter id="wf-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            {BAND_CONFIG.map((cfg) => (
              <linearGradient key={cfg.key} id={`wf-grad-${cfg.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={cfg.color} stopOpacity="0.68" />
                <stop offset="50%" stopColor={cfg.color} stopOpacity="0.20" />
                <stop offset="100%" stopColor="#0a0f0d" stopOpacity="0.92" />
              </linearGradient>
            ))}

            <linearGradient id="wf-floor-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="rgba(22,32,26,0.82)" />
              <stop offset="100%" stopColor="rgba(10,15,12,0.97)" />
            </linearGradient>
          </defs>

          {/* 1. GROUND PLANE — the floor of the 3D scene */}
          <polygon
            points={`${fBL.sx},${fBL.sy} ${fBR.sx},${fBR.sy} ${fFR.sx},${fFR.sy} ${fFL.sx},${fFL.sy}`}
            fill="url(#wf-floor-grad)"
            stroke="rgba(255,255,255,0.09)"
            strokeWidth="1.2"
          />

          {/* 2. TIME GRID LINES — vertical slices at 0 / 300 / 600 / 900 / 1200 ms */}
          {timeSlices.map((u, idx) => {
            const pB = floorProject(0, u);
            const pF = floorProject(BANDS - 1, u);
            const ms = Math.round(u * maxTime * 1000);
            return (
              <g key={`tg-${idx}`}>
                <line x1={pB.sx} y1={pB.sy} x2={pF.sx} y2={pF.sy}
                  stroke="rgba(255,255,255,0.07)" strokeWidth="1" strokeDasharray="2 3" />
                <text x={pF.sx + 2} y={pF.sy + 13}
                  fill="rgba(148,163,184,0.78)" fontSize="8" fontFamily="monospace" textAnchor="middle">
                  {ms}ms
                </text>
              </g>
            );
          })}

          {/* 3. FREQUENCY BASELINES — one per band along the floor */}
          {BAND_CONFIG.map((cfg, bIdx) => {
            const pS = floorProject(bIdx, 0);
            const pE = floorProject(bIdx, 1);
            return (
              <line key={`fb-${cfg.key}`} x1={pS.sx} y1={pS.sy} x2={pE.sx} y2={pE.sy}
                stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
            );
          })}

          {/* 4. dB VERTICAL AXIS — at band 0, time 0 */}
          {(() => {
            const pGnd = floorProject(0, 0);
            const p0dB = bandProject(0, 0, 0);
            const p20dB = bandProject(0, 0, -20);
            const p40dB = bandProject(0, 0, -40);
            const pCeil = bandProject(0, 1, 0); // reference ceiling along time axis
            return (
              <g>
                {/* Vertical pole */}
                <line x1={pGnd.sx} y1={pGnd.sy} x2={p0dB.sx} y2={p0dB.sy}
                  stroke="rgba(52,211,153,0.55)" strokeWidth="1.5" />
                {/* 0 dB ceiling reference line */}
                <line x1={p0dB.sx} y1={p0dB.sy} x2={pCeil.sx} y2={pCeil.sy}
                  stroke="rgba(52,211,153,0.15)" strokeWidth="1" strokeDasharray="3 3" />
                {/* Tick marks + labels */}
                {[
                  { pt: p0dB, label: "0 dB" },
                  { pt: p20dB, label: "−20 dB" },
                  { pt: p40dB, label: "−40 dB" },
                  { pt: { sy: pGnd.sy }, label: "−60 dB" },
                ].map((t) => (
                  <g key={t.label}>
                    <line x1={pGnd.sx - 4} y1={t.pt.sy} x2={pGnd.sx} y2={t.pt.sy}
                      stroke="rgba(52,211,153,0.55)" strokeWidth="1.1" />
                    <text x={pGnd.sx - 7} y={t.pt.sy + 3}
                      fill="rgba(148,163,184,0.88)" fontSize="7.5" fontFamily="monospace" textAnchor="end">
                      {t.label}
                    </text>
                  </g>
                ))}
              </g>
            );
          })()}

          {/*
            5. CROSS-RIB MESH LINES
               These connect all frequency bands at fixed time slices (e.g. at t=0ms, t=300ms …).
               In WIREFRAME mode: bright green, solid — forms the complete acoustic terrain mesh.
               In RIBBONS mode: not shown (hidden), so the filled curtains read cleanly.
          */}
          {isWireframe &&
            [0, 0.17, 0.33, 0.5, 0.67, 0.83, 1.0].map((u, tIdx) => {
              const ribPts = BAND_CONFIG.map((cfg, bIdx) => {
                const pts = waterfallData.bands?.[cfg.key] || [];
                const pIdx = Math.min(pts.length - 1, Math.round(u * (pts.length - 1)));
                const db = pts[pIdx] ?? -60;
                return bandProject(bIdx, u, db);
              });
              const d = ribPts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.sx.toFixed(1)},${p.sy.toFixed(1)}`).join(" ");
              return (
                <path key={`rib-${tIdx}`} d={d} fill="none"
                  stroke="rgba(52,211,153,0.45)" strokeWidth="1.1" />
              );
            })
          }

          {/*
            6. VOLUMETRIC RIBBONS — rendered back-to-front via ez depth sort
               In RIBBONS mode: each band renders a filled gradient curtain (the vertical
               "wall" under its decay ridge) + a glowing crest line on top.
               In WIREFRAME mode: no fill, only the glowing crest ridge line is drawn.
               Bands are sorted by their depth (ez) after rotation so nearer bands
               always paint on top of farther ones — no incorrect occlusion.
          */}
          {sortedBands.map(({ cfg, bIdx }) => {
            const points = waterfallData.bands?.[cfg.key] || [];
            if (!points || points.length === 0) return null;

            const isFocus = activeKey === cfg.key;
            const isDimmed = activeKey && !isFocus;

            const projected = points.map((db, pIdx) => {
              const u = pIdx / (points.length - 1);
              return {
                peak: bandProject(bIdx, u, db),
                gnd: floorProject(bIdx, u),
              };
            });

            // Ridge line: the decay curve at the top of each curtain
            const ridgePath = projected
              .map((p, i) => `${i === 0 ? "M" : "L"} ${p.peak.sx.toFixed(1)},${p.peak.sy.toFixed(1)}`)
              .join(" ");

            const firstGnd = projected[0].gnd;
            const lastGnd = projected[projected.length - 1].gnd;
            const lastPeak = projected[projected.length - 1].peak;

            // Curtain: ridge + drop to floor at end + trace back along floor to start
            const curtain = `${ridgePath} L ${lastGnd.sx.toFixed(1)},${lastGnd.sy.toFixed(1)} L ${firstGnd.sx.toFixed(1)},${firstGnd.sy.toFixed(1)} Z`;

            const strokeW = isFocus ? 2.8 : (isWireframe ? 1.5 : 1.8);

            return (
              <g key={`ribbon-${cfg.key}`}
                style={{ opacity: isDimmed ? 0.28 : 1, transition: "opacity 0.22s ease" }}
                onMouseEnter={() => setHoveredBand(cfg.key)}
                onMouseLeave={() => setHoveredBand(null)}
                onClick={() => setSelectedBand(selectedBand === cfg.key ? null : cfg.key)}
              >
                {/* Filled curtain — RIBBONS mode only */}
                {!isWireframe && (
                  <path d={curtain} fill={`url(#wf-grad-${cfg.key})`}
                    stroke="rgba(0,0,0,0.28)" strokeWidth="0.5"
                    className="waterfall-ribbon-path" />
                )}

                {/* Glowing ridge crest — always shown in both modes */}
                <path d={ridgePath} fill="none"
                  stroke={cfg.color}
                  strokeWidth={strokeW}
                  filter={isFocus ? "url(#wf-glow)" : undefined} />

                {/* Frequency label tag */}
                <g transform={`translate(${lastGnd.sx + 6}, ${lastPeak.sy})`}>
                  <rect x="-2" y="-9" width="40" height="13" rx="3"
                    fill="rgba(12,20,16,0.90)"
                    stroke={isFocus ? cfg.color : "rgba(255,255,255,0.1)"} strokeWidth="1" />
                  <text x="18" y="1"
                    fill={isFocus ? "#fff" : "rgba(220,232,224,0.82)"}
                    fontSize="8" fontFamily="monospace" fontWeight="700" textAnchor="middle">
                    {cfg.label}
                  </text>
                </g>
              </g>
            );
          })}

          {/* 7. AXIS CAPTIONS */}
          <text x={fFR.sx} y={fFR.sy + 22}
            fill="rgba(148,163,184,0.85)" fontSize="8.5" fontWeight="600" textAnchor="end">
            Time (ms) →
          </text>
          <text x={fFL.sx - 6} y={fFL.sy + 6}
            fill="rgba(148,163,184,0.85)" fontSize="8.5" fontWeight="600" textAnchor="end">
            ↙ Freq (Hz)
          </text>

          {/* Drag hint */}
          <text x={svgW / 2} y={svgH - 6}
            fill="rgba(100,116,139,0.45)" fontSize="7.5" textAnchor="middle" fontFamily="monospace">
            drag to rotate · click a ribbon to inspect
          </text>
        </svg>
      </div>

      {/* Band Chip Selector */}
      <div className="waterfall-band-chips">
        <button type="button" className={`band-chip ${!activeKey ? "active" : ""}`}
          onClick={() => { setSelectedBand(null); setHoveredBand(null); }}>
          <SlidersHorizontal size={12} />
          <span>All Bands</span>
        </button>

        {BAND_CONFIG.map((cfg) => {
          const isSelected = activeKey === cfg.key;
          return (
            <button key={`chip-${cfg.key}`} type="button"
              className={`band-chip ${isSelected ? "active" : ""}`}
              style={{
                borderColor: isSelected ? cfg.color : undefined,
                boxShadow: isSelected ? `0 0 10px ${cfg.glow}` : undefined,
              }}
              onMouseEnter={() => setHoveredBand(cfg.key)}
              onMouseLeave={() => setHoveredBand(null)}
              onClick={() => setSelectedBand(selectedBand === cfg.key ? null : cfg.key)}
            >
              <span className="band-chip-indicator" style={{ backgroundColor: cfg.color }} />
              <strong>{cfg.label}</strong>
              <span style={{ fontSize: "0.7rem", opacity: 0.7 }}>({cfg.sub})</span>
            </button>
          );
        })}
      </div>

      {/* Inspector Bar */}
      {activeConfig && activePoints && (
        <div className="waterfall-inspector-bar">
          <div className="waterfall-inspector-meta">
            <div className="inspector-meta-item">
              <span style={{
                width: 9, height: 9, borderRadius: "50%",
                backgroundColor: activeConfig.color, display: "inline-block"
              }} />
              <strong>{activeConfig.label} ({activeConfig.sub})</strong>
            </div>
            <div className="inspector-meta-item">
              <span>Initial Energy:</span>
              <strong>{activePoints[0] ?? 0} dB</strong>
            </div>
            <div className="inspector-meta-item">
              <span>Residual at 500ms:</span>
              <strong>
                {activePoints[Math.min(activePoints.length - 1, Math.round(activePoints.length * 0.42))] ?? -45} dB
              </strong>
            </div>
            <div className="inspector-meta-item">
              <span>Tail Floor:</span>
              <strong>{activePoints[activePoints.length - 1] ?? -60} dB</strong>
            </div>
          </div>
          <div className="inspector-badge-status" style={{
            backgroundColor: `${activeConfig.color}22`,
            color: activeConfig.color,
            border: `1px solid ${activeConfig.color}66`,
          }}>
            {activeConfig.key === "125" || activeConfig.key === "250"
              ? "Modal Resonance Zone"
              : activeConfig.key === "4000" ? "High Air Absorption"
                : "Standard Reverberant Field"}
          </div>
        </div>
      )}
    </div>
  );
}
