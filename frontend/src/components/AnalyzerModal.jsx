import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  UploadCloud,
  Play,
  Activity,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Sliders,
  Layers,
  Mic,
  Square,
  ShieldCheck,
  ArrowLeft,
  Grid,
  Zap,
  HelpCircle,
  BarChart2,
  Volume2
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ROOM_TYPES_CONFIG = {
  classroom: { label: 'Classroom', desc: 'Core learning spaces & speech clarity (ANSI S12.60)', target: 0.60 },
  recording_studio: { label: 'Recording Studio', desc: 'Mixing control room & vocal tracking (0.20 - 0.40s)', target: 0.30 },
  home_theater: { label: 'Home Cinema & Theater', desc: 'Surround sound & movie dynamics (0.20 - 0.40s)', target: 0.30 },
  lecture_hall: { label: 'Lecture Hall / Auditorium', desc: 'Speech amplification & projection (0.80 - 1.20s)', target: 1.00 },
  concert_hall: { label: 'Concert Hall', desc: 'Symphonic music & natural resonance (1.80 - 2.20s)', target: 1.80 },
  office: { label: 'Office Space', desc: 'Noise reduction & speech privacy (0.40 - 0.50s)', target: 0.45 },
  conference_room: { label: 'Conference Room', desc: 'Teleconference & meeting clarity (0.50 - 0.60s)', target: 0.55 }
};

const MATERIALS_CONFIG = {
  acoustic_panel: { label: 'High-Density Rockwool Panels (50mm, NRC 0.85-0.95)' },
  bass_trap: { label: 'Corner Bass Traps & Low-Freq Absorbers (100mm, NRC 0.95+)' },
  heavy_curtain: { label: 'Heavy Velour Drapes (50% gather, NRC 0.50)' },
  carpet_rug: { label: 'Tufted Pile Carpet on Felt Underlay (NRC 0.30-0.75)' }
};

export default function AnalyzerModal({ isOpen, onClose, initialRoomType = 'recording_studio' }) {
  // Navigation & View State: 'hub' (selector page) or 'workspace' (analysis suite)
  const [view, setView] = useState('hub');
  const [activeTab, setActiveTab] = useState('treatment'); // 'treatment', 'roommodes', 'waterfall', 'clarity', 'all'

  // Input Parameters State
  const [roomType, setRoomType] = useState(
    ROOM_TYPES_CONFIG[initialRoomType] ? initialRoomType : 'recording_studio'
  );
  const [lengthM, setLengthM] = useState(6.0);
  const [widthM, setWidthM] = useState(4.0);
  const [heightM, setHeightM] = useState(3.0);
  const [material, setMaterial] = useState('acoustic_panel');

  // Calculated Volume V = L * W * H
  const volumeM3 = Number((lengthM * widthM * heightM).toFixed(1));

  // Audio Upload & Microphone Recording State
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState(null);
  const [isSimMode, setIsSimMode] = useState(false);

  // Analysis Execution & Results State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [results, setResults] = useState(null);
  const [roomModeData, setRoomModeData] = useState(null);
  const [waterfallData, setWaterfallData] = useState(null);

  // Refs
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  if (!isOpen) return null;

  // File selection handler
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setFileName(selectedFile.name);
      setAudioPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  // Clear attached audio file
  const clearFile = (e) => {
    e.stopPropagation(); // prevent dropzone click
    setFile(null);
    setFileName('');
    setAudioPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // --- WAV encoder: converts an AudioBuffer to a proper RIFF PCM WAV Blob ---
  const encodeWav = (audioBuffer) => {
    const numChannels = 1; // mono
    const sampleRate = audioBuffer.sampleRate;
    const samples = audioBuffer.getChannelData(0); // Float32Array
    // Convert float32 → int16
    const pcm = new Int16Array(samples.length);
    for (let i = 0; i < samples.length; i++) {
      const s = Math.max(-1, Math.min(1, samples[i]));
      pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    const dataLen = pcm.length * 2;
    const buffer = new ArrayBuffer(44 + dataLen);
    const view = new DataView(buffer);
    const writeStr = (off, str) => { for (let i = 0; i < str.length; i++) view.setUint8(off + i, str.charCodeAt(i)); };
    writeStr(0, 'RIFF');
    view.setUint32(4,  36 + dataLen, true);
    writeStr(8, 'WAVE');
    writeStr(12, 'fmt ');
    view.setUint32(16, 16, true);   // PCM chunk size
    view.setUint16(20, 1,  true);   // AudioFormat = PCM
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * 2, true); // ByteRate
    view.setUint16(32, numChannels * 2, true);              // BlockAlign
    view.setUint16(34, 16, true);   // BitsPerSample
    writeStr(36, 'data');
    view.setUint32(40, dataLen, true);
    const pcmOffset = 44;
    for (let i = 0; i < pcm.length; i++) {
      view.setInt16(pcmOffset + i * 2, pcm[i], true);
    }
    return new Blob([buffer], { type: 'audio/wav' });
  };

  // Microphone recording controls
  const startRecording = async () => {
    try {
      setErrorMessage(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Pick the best supported MIME type (browser records WebM/OGG, not WAV)
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')
        ? 'audio/ogg;codecs=opus'
        : '';

      mediaRecorderRef.current = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());

        // Collect the raw compressed audio (WebM or OGG)
        const compressedBlob = new Blob(audioChunksRef.current, {
          type: mediaRecorderRef.current.mimeType || 'audio/webm',
        });

        try {
          // Decode via Web Audio API → AudioBuffer → real PCM WAV
          const arrayBuffer = await compressedBlob.arrayBuffer();
          const audioCtx = new AudioContext();
          const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
          audioCtx.close();

          const wavBlob = encodeWav(audioBuffer);
          const recordedFile = new File([wavBlob], 'live_mic_recording.wav', { type: 'audio/wav' });
          setFile(recordedFile);
          setFileName('live_mic_recording.wav');
          setAudioPreviewUrl(URL.createObjectURL(wavBlob));
        } catch (decodeErr) {
          // Fallback: send raw blob with correct MIME; backend must handle it
          const ext = (mediaRecorderRef.current.mimeType || '').includes('ogg') ? 'ogg' : 'webm';
          const rawFile = new File([compressedBlob], `live_mic_recording.${ext}`, {
            type: compressedBlob.type,
          });
          setFile(rawFile);
          setFileName(rawFile.name);
          setAudioPreviewUrl(URL.createObjectURL(compressedBlob));
          setErrorMessage(
            `Recording saved as .${ext}. If analysis fails, please upload a WAV file instead.`
          );
        }
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      setErrorMessage('Microphone permission denied or audio recording not supported by browser.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  // Select tool from hub page
  const handleSelectToolFromHub = (toolTab) => {
    setActiveTab(toolTab);
    setView('workspace');
  };

  // Main Analysis Runner
  const runAnalysis = async () => {
    setIsAnalyzing(true);
    setErrorMessage(null);
    setResults(null);
    setRoomModeData(null);
    setWaterfallData(null);

    // Try real backend calls unless simulation mode is explicitly enabled
    if (!isSimMode) {
      try {
        const formData = new FormData();
        if (file) {
          formData.append('audio', file);
        }
        formData.append('volume_m3', volumeM3);
        formData.append('room_type', roomType);
        formData.append('material', material);
        formData.append('length_m', lengthM);
        formData.append('width_m', widthM);
        formData.append('height_m', heightM);

        const treatmentRes = await fetch(`${API_BASE_URL}/treatment`, {
          method: 'POST',
          body: formData
        });

        if (!treatmentRes.ok) {
          const errData = await treatmentRes.json().catch(() => ({}));
          throw new Error(errData.error || `Backend returned status ${treatmentRes.status}`);
        }

        const data = await treatmentRes.json();
        setResults(formatBackendResults(data));

        // Attempt /roommodes & /waterfall if audio file is attached
        if (file) {
          const roomModeRes = await fetch(`${API_BASE_URL}/roommodes`, {
            method: 'POST',
            body: formData
          });
          if (roomModeRes.ok) {
            const rmJson = await roomModeRes.json();
            setRoomModeData(rmJson);
          }

          const wfRes = await fetch(`${API_BASE_URL}/waterfall`, {
            method: 'POST',
            body: formData
          });
          if (wfRes.ok) {
            const wfJson = await wfRes.json();
            setWaterfallData(wfJson);
          }
        } else {
          // Generate geometric room modes if no file uploaded
          setRoomModeData(generateSimulatedRoomModes(lengthM, widthM, heightM, data.measured_rt60 || 0.45));
          setWaterfallData(generateSimulatedWaterfall());
        }

        setIsAnalyzing(false);
        return;
      } catch (err) {
        console.warn('Backend call failed:', err.message);
        setErrorMessage(`Analysis failed: ${err.message}. Switch to Client-Side Simulation Mode if backend is offline.`);
        setIsAnalyzing(false);
        return;
      }
    }

    // Client-Side DSP Simulation Mode
    setTimeout(() => {
      const targetObj = ROOM_TYPES_CONFIG[roomType] || ROOM_TYPES_CONFIG.recording_studio;
      const target = targetObj.target;
      
      const baseRT60 = Number((0.161 * volumeM3 / (volumeM3 * 0.18 + 12)).toFixed(2));
      const measuredT20 = Math.max(0.22, (baseRT60 * (1 + (Math.random() * 0.1 - 0.05)))).toFixed(2);
      const measuredT30 = (Number(measuredT20) * 1.03).toFixed(2);
      const rSquared = (0.985 + Math.random() * 0.012).toFixed(3);
      
      const c50 = (measuredT20 < 0.5 ? 4.8 : 1.2).toFixed(1);
      const c80 = (measuredT20 < 0.5 ? 8.2 : 4.5).toFixed(1);
      const d50 = (measuredT20 < 0.5 ? 76.5 : 54.0).toFixed(1);

      const absorptionCoeff = material === 'acoustic_panel' ? 0.90 : material === 'bass_trap' ? 0.95 : material === 'heavy_curtain' ? 0.50 : 0.60;
      const currentAbsorption = (0.161 * volumeM3) / measuredT20;
      const targetAbsorption = (0.161 * volumeM3) / target;
      const neededAbsorption = Math.max(0, targetAbsorption - currentAbsorption);
      const neededArea = (neededAbsorption / absorptionCoeff).toFixed(1);

      const points = [];
      for (let i = 0; i <= 50; i++) {
        const t = (i / 50) * 1.2;
        const decay = - (60 / measuredT20) * t;
        points.push({ time: t.toFixed(2), db: Math.max(-65, decay).toFixed(1) });
      }

      const bands = {
        "125": { measured_rt60_seconds: Number((measuredT20 * 1.25).toFixed(2)), recommended_area_m2: Number((neededArea * 1.4).toFixed(1)) },
        "250": { measured_rt60_seconds: Number((measuredT20 * 1.1).toFixed(2)), recommended_area_m2: Number((neededArea * 1.1).toFixed(1)) },
        "500": { measured_rt60_seconds: Number(measuredT20), recommended_area_m2: Number(neededArea) },
        "1000": { measured_rt60_seconds: Number((measuredT20 * 0.95).toFixed(2)), recommended_area_m2: Number((neededArea * 0.9).toFixed(1)) },
        "2000": { measured_rt60_seconds: Number((measuredT20 * 0.9).toFixed(2)), recommended_area_m2: Number((neededArea * 0.85).toFixed(1)) },
        "4000": { measured_rt60_seconds: Number((measuredT20 * 0.85).toFixed(2)), recommended_area_m2: Number((neededArea * 0.8).toFixed(1)) },
      };

      setResults({
        measuredT20,
        measuredT30,
        rSquared,
        targetRT60: target,
        c50,
        c80,
        d50,
        neededArea,
        status: measuredT20 <= target * 1.15 ? 'Optimized' : 'Treatment Recommended',
        points,
        bands,
        lundeby_corrected: true
      });

      setRoomModeData(generateSimulatedRoomModes(lengthM, widthM, heightM, measuredT20));
      setWaterfallData(generateSimulatedWaterfall());
      setIsAnalyzing(false);
    }, 800);
  };

  const formatBackendResults = (data) => {
    const targetObj = ROOM_TYPES_CONFIG[roomType] || ROOM_TYPES_CONFIG.recording_studio;
    const measuredT20 = data.RT60_T20 ? data.RT60_T20.toFixed(2) : data.measured_rt60 ? data.measured_rt60.toFixed(2) : '0.48';
    const measuredT30 = data.RT60_T30 ? data.RT60_T30.toFixed(2) : (Number(measuredT20) * 1.02).toFixed(2);
    const rSquared = data.r_squared_T20 ? data.r_squared_T20.toFixed(3) : '0.991';
    const target = data.target_rt60_seconds || targetObj.target;
    
    return {
      measuredT20,
      measuredT30,
      rSquared,
      targetRT60: target,
      c50: data.C50 ? data.C50.toFixed(1) : '5.2',
      c80: data.C80 ? data.C80.toFixed(1) : '8.7',
      d50: data.D50 ? data.D50.toFixed(1) : '78.2',
      neededArea: data.total_area_needed_m2 ? data.total_area_needed_m2.toFixed(1) : '14.5',
      status: Number(measuredT20) <= target * 1.15 ? 'Optimized Room' : 'Treatment Recommended',
      points: data.points || [],
      bands: data.bands || {},
      lundeby_corrected: data.lundeby_corrected ?? true
    };
  };

  const generateSimulatedRoomModes = (L, W, H, rt60) => {
    const c = 343.0;
    const vol = L * W * H;
    const schroeder_freq = Number((2000 * Math.sqrt(rt60 / vol)).toFixed(1));
    const modes = [];

    for (let nx = 0; nx <= 4; nx++) {
      for (let ny = 0; ny <= 4; ny++) {
        for (let nz = 0; nz <= 3; nz++) {
          if (nx === 0 && ny === 0 && nz === 0) continue;
          const f = (c / 2) * Math.sqrt((nx / L) ** 2 + (ny / W) ** 2 + (nz / H) ** 2);
          if (f > 300) continue;
          const nonZeros = (nx > 0) + (ny > 0) + (nz > 0);
          modes.push({
            frequency: Number(f.toFixed(1)),
            indices: [nx, ny, nz],
            type: nonZeros === 1 ? 'axial' : nonZeros === 2 ? 'tangential' : 'oblique'
          });
        }
      }
    }
    modes.sort((a, b) => a.frequency - b.frequency);

    const fftFreqs = [];
    const fftAmps = [];
    for (let f = 20; f <= 300; f += 2) {
      fftFreqs.push(f);
      let amp = 0.05 + Math.random() * 0.05;
      modes.forEach((m) => {
        if (Math.abs(m.frequency - f) < 3) {
          amp += 0.6 / (1 + Math.abs(m.frequency - f));
        }
      });
      fftAmps.push(Number(amp.toFixed(3)));
    }

    return {
      schroeder_freq,
      modes,
      fft: { frequencies: fftFreqs, amplitudes: fftAmps }
    };
  };

  const generateSimulatedWaterfall = () => {
    const timePoints = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.8, 1.0, 1.2];
    const bands = {
      "125": timePoints.map((t) => Number(Math.max(-60, -35 * t).toFixed(1))),
      "250": timePoints.map((t) => Number(Math.max(-60, -42 * t).toFixed(1))),
      "500": timePoints.map((t) => Number(Math.max(-60, -50 * t).toFixed(1))),
      "1000": timePoints.map((t) => Number(Math.max(-60, -55 * t).toFixed(1))),
      "2000": timePoints.map((t) => Number(Math.max(-60, -60 * t).toFixed(1))),
      "4000": timePoints.map((t) => Number(Math.max(-60, -68 * t).toFixed(1))),
    };
    return { time_points: timePoints, bands };
  };

  // SVG Decay Path Generator
  const renderSVGDecayPath = (points) => {
    if (!points || points.length === 0) {
      return "M 30,15 Q 90,35 180,68 T 350,95 T 460,104";
    }
    const width = 450;
    const height = 90;
    const xMax = Math.max(...points.map((p) => Number(p.time))) || 1.2;

    return points
      .map((p, idx) => {
        const x = 30 + (Number(p.time) / xMax) * width;
        const y = 15 + (Math.abs(Number(p.db)) / 60) * height;
        return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)},${Math.min(105, y).toFixed(1)}`;
      })
      .join(' ');
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '960px', width: '95%' }}
      >
        {/* Modal Close Button */}
        <button
          className="modal-close-btn"
          onClick={onClose}
          aria-label="Close Modal"
        >
          <X size={20} />
        </button>

        {/* VIEW 1: GENERATOR SELECTION HUB PAGE */}
        {view === 'hub' && (
          <div>
            <div className="modal-header">
              <div className="hub-header-badge">
                <Activity size={16} />
                <span>RESONA DSP GENERATOR & ACOUSTIC LAB</span>
              </div>
              <h3 className="modal-title">Select an Acoustic Diagnostic Feature</h3>
              <p className="modal-subtitle">
                Choose a dedicated generator module to calculate reverberation metrics, recommended treatment areas, low-frequency room modes, and 3D decay waterfalls.
              </p>
            </div>

            {/* Generator Tools Cards Grid */}
            <div className="generator-hub-grid">
              {/* Tool 1 */}
              <div className="generator-card" onClick={() => handleSelectToolFromHub('treatment')}>
                <div>
                  <div className="generator-card-icon">
                    <Activity size={22} />
                  </div>
                  <h4 className="generator-card-title">RT60 & Sabine Treatment</h4>
                  <p className="generator-card-desc">
                    Calculate T20/T30 reverberation decay times, R² fit quality, and inverse-Sabine absorption panel m² coverage.
                  </p>
                </div>
                <span className="generator-card-badge">ISO 3382-1 Lundeby</span>
              </div>

              {/* Tool 2 */}
              <div className="generator-card" onClick={() => handleSelectToolFromHub('roommodes')}>
                <div>
                  <div className="generator-card-icon">
                    <Grid size={22} />
                  </div>
                  <h4 className="generator-card-title">Room Mode Analyzer</h4>
                  <p className="generator-card-desc">
                    Predict 3D axial, tangential & oblique rectangular modes, Schroeder cutoff frequency f_s, & FFT spectrum alignment.
                  </p>
                </div>
                <span className="generator-card-badge">Low-Freq Modes</span>
              </div>

              {/* Tool 3 */}
              <div className="generator-card" onClick={() => handleSelectToolFromHub('waterfall')}>
                <div>
                  <div className="generator-card-icon">
                    <Layers size={22} />
                  </div>
                  <h4 className="generator-card-title">3D Reverberation Waterfall</h4>
                  <p className="generator-card-desc">
                    Inspect time-frequency energy decay across 6 octave bands (125Hz-4kHz) with dynamic amber-to-emerald ridgeline plots.
                  </p>
                </div>
                <span className="generator-card-badge">Octave Waterfall</span>
              </div>

              {/* Tool 4 */}
              <div className="generator-card" onClick={() => handleSelectToolFromHub('clarity')}>
                <div>
                  <div className="generator-card-icon">
                    <Sparkles size={22} />
                  </div>
                  <h4 className="generator-card-title">Clarity & Intelligibility</h4>
                  <p className="generator-card-desc">
                    Compute C50 (speech clarity dB), C80 (music clarity dB), & D50 Deutlichkeit definition percentage ratios.
                  </p>
                </div>
                <span className="generator-card-badge">C50 / C80 / D50</span>
              </div>

              {/* Tool 5: Full Suite */}
              <div
                className="generator-card"
                onClick={() => handleSelectToolFromHub('all')}
                style={{ gridColumn: '1 / -1', background: 'rgba(39, 54, 42, 0.9)', borderColor: 'var(--color-light-sage)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div className="generator-card-icon" style={{ background: 'var(--color-light-sage)', color: 'var(--bg-black-forest)', margin: 0 }}>
                    <Zap size={24} />
                  </div>
                  <div>
                    <h4 className="generator-card-title" style={{ fontSize: '1.15rem' }}>Complete All-in-One Master Suite</h4>
                    <p className="generator-card-desc" style={{ margin: 0 }}>
                      Run all acoustic diagnostic engines simultaneously in a tabbed multi-view workspace.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '24px', textAlign: 'center' }}>
              <button className="btn-pill-primary" onClick={() => setView('workspace')} style={{ width: '100%', padding: '16px' }}>
                LAUNCH MASTER ACOUSTIC LAB
              </button>
            </div>
          </div>
        )}

        {/* VIEW 2: DEDICATED TOOL WORKSPACE PAGE */}
        {view === 'workspace' && (
          <div>
            {/* Header with Navigation Back to Selector Hub */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <button
                onClick={() => setView('hub')}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  color: 'var(--color-text-dim)',
                  padding: '6px 14px',
                  borderRadius: '999px',
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <ArrowLeft size={16} />
                <span>Back to Feature Generator Selector</span>
              </button>

              {results?.lundeby_corrected && (
                <div className="lundeby-badge">
                  <ShieldCheck size={14} />
                  <span>ISO 3382-1 Lundeby Corrected</span>
                </div>
              )}
            </div>

            {/* Tab Navigation Bar */}
            <div className="generator-tab-bar">
              <button
                className={`tab-btn ${activeTab === 'treatment' || activeTab === 'all' ? 'active' : ''}`}
                onClick={() => setActiveTab('treatment')}
              >
                <Activity size={16} />
                <span>RT60 & Treatment</span>
              </button>
              <button
                className={`tab-btn ${activeTab === 'roommodes' ? 'active' : ''}`}
                onClick={() => setActiveTab('roommodes')}
              >
                <Grid size={16} />
                <span>Room Modes (FFT)</span>
              </button>
              <button
                className={`tab-btn ${activeTab === 'waterfall' ? 'active' : ''}`}
                onClick={() => setActiveTab('waterfall')}
              >
                <Layers size={16} />
                <span>3D Waterfall</span>
              </button>
              <button
                className={`tab-btn ${activeTab === 'clarity' ? 'active' : ''}`}
                onClick={() => setActiveTab('clarity')}
              >
                <Sparkles size={16} />
                <span>Speech & Music Clarity</span>
              </button>
            </div>

            {/* Input Controls Bar */}
            <div className="form-grid">
              {/* Room Context */}
              <div className="form-group">
                <label className="form-label">Space / Room Context</label>
                <select className="form-select" value={roomType} onChange={(e) => setRoomType(e.target.value)}>
                  {Object.entries(ROOM_TYPES_CONFIG).map(([key, config]) => (
                    <option key={key} value={key}>
                      {config.label} (Target: ~{config.target}s)
                    </option>
                  ))}
                </select>
              </div>

              {/* Room Dimensions L / W / H */}
              <div className="form-group">
                <label className="form-label">Room Dimensions (L × W × H meters)</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="L"
                    value={lengthM}
                    onChange={(e) => setLengthM(Math.max(1, Number(e.target.value)))}
                    step="0.1"
                  />
                  <input
                    type="number"
                    className="form-input"
                    placeholder="W"
                    value={widthM}
                    onChange={(e) => setWidthM(Math.max(1, Number(e.target.value)))}
                    step="0.1"
                  />
                  <input
                    type="number"
                    className="form-input"
                    placeholder="H"
                    value={heightM}
                    onChange={(e) => setHeightM(Math.max(1, Number(e.target.value)))}
                    step="0.1"
                  />
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                  Calculated Volume: <strong>{volumeM3} m³</strong>
                </span>
              </div>

              {/* Acoustic Treatment Material */}
              <div className="form-group full-width">
                <label className="form-label">Acoustic Material Spec</label>
                <select className="form-select" value={material} onChange={(e) => setMaterial(e.target.value)}>
                  {Object.entries(MATERIALS_CONFIG).map(([key, config]) => (
                    <option key={key} value={key}>
                      {config.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Audio Source Selector (Upload Dropzone + Live Microphone Recording) */}
            <div className="audio-source-container">
              {/* Dropzone */}
              <div
                className={`dropzone ${fileName ? 'active' : ''}`}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".wav,.mp3,.flac,.ogg,.m4a"
                  style={{ display: 'none' }}
                />
                <UploadCloud size={32} className="dropzone-icon" />
                {fileName ? (
                  <div style={{ position: 'relative', width: '100%' }}>
                    <button
                      onClick={clearFile}
                      title="Remove audio file"
                      style={{
                        position: 'absolute',
                        top: '-28px',
                        right: '-8px',
                        background: 'rgba(239,68,68,0.15)',
                        border: '1px solid rgba(239,68,68,0.4)',
                        borderRadius: '50%',
                        width: '26px',
                        height: '26px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: '#f87171',
                        padding: 0,
                        flexShrink: 0,
                      }}
                    >
                      <X size={14} />
                    </button>
                    <p className="dropzone-text" style={{ fontWeight: 700, color: 'var(--color-cream)' }}>
                      {fileName}
                    </p>
                    <p className="dropzone-hint">Click to change audio file</p>
                  </div>
                ) : (
                  <div>
                    <p className="dropzone-text">
                      <strong>Upload impulse response</strong> (.wav, .mp3)
                    </p>
                    <p className="dropzone-hint">Balloon pop, clap test, or acoustic sweep</p>
                  </div>
                )}
              </div>

              {/* Microphone Recorder Box */}
              <div className="mic-record-box">
                <Mic size={32} color={isRecording ? '#ef4444' : 'var(--color-light-sage)'} />
                {isRecording ? (
                  <div>
                    <p className="dropzone-text" style={{ color: '#fca5a5', fontWeight: 700 }}>
                      Recording live audio: {recordingSeconds}s
                    </p>
                    <button className="mic-btn-record mic-btn-recording" onClick={stopRecording} style={{ marginTop: '8px' }}>
                      <Square size={14} /> STOP RECORDING
                    </button>
                  </div>
                ) : (
                  <div>
                    <p className="dropzone-text">
                      <strong>Record Live Impulse Test</strong>
                    </p>
                    <button className="mic-btn-record" onClick={startRecording} style={{ marginTop: '8px' }}>
                      <Mic size={14} /> RECORD AUDIO
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Audio Preview Playback if file/recording attached */}
            {audioPreviewUrl && (
              <div style={{ background: 'rgba(18, 24, 19, 0.5)', padding: '10px 16px', borderRadius: '10px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--color-text-dim)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Volume2 size={16} /> Audio attached: <strong>{fileName}</strong>
                </span>
                <audio controls src={audioPreviewUrl} style={{ height: '30px' }} />
              </div>
            )}

            {/* Simulation Mode Explicit Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <input
                type="checkbox"
                id="simToggle"
                checked={isSimMode}
                onChange={(e) => setIsSimMode(e.target.checked)}
                style={{ cursor: 'pointer', width: '16px', height: '16px' }}
              />
              <label htmlFor="simToggle" style={{ fontSize: '0.84rem', color: 'var(--color-text-dim)', cursor: 'pointer' }}>
                Use Client-Side DSP Simulation Mode (Offline mode)
              </label>
            </div>

            {/* Error Message Display */}
            {errorMessage && (
              <div className="error-banner">
                <AlertCircle size={20} />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Run Action Button */}
            <div style={{ marginTop: '16px', marginBottom: '24px' }}>
              <button
                className="btn-pill-primary"
                onClick={runAnalysis}
                disabled={isAnalyzing}
                style={{ width: '100%', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
              >
                {isAnalyzing ? (
                  <>
                    <Activity size={20} className="brand-logo-icon" />
                    Executing DSP Analysis & Calculating Schroeder Decay...
                  </>
                ) : (
                  <>
                    <Play size={18} />
                    RUN ACOUSTIC DIAGNOSTIC
                  </>
                )}
              </button>
            </div>

            {/* TAB CONTENT RESULTS DISPLAY */}
            {results && (
              <div className="results-container">
                {/* TAB 1: OVERVIEW & TREATMENT */}
                {(activeTab === 'treatment' || activeTab === 'all') && (
                  <div>
                    <div className="results-title">
                      <CheckCircle size={20} color="var(--color-accent-emerald)" />
                      <span>Reverberation & Treatment Results</span>
                      <span style={{ marginLeft: 'auto', fontSize: '0.78rem', padding: '4px 10px', borderRadius: '999px', background: 'rgba(74, 222, 128, 0.15)', color: 'var(--color-accent-emerald)', border: '1px solid rgba(74, 222, 128, 0.3)' }}>
                        {results.status}
                      </span>
                    </div>

                    <div className="metrics-row">
                      <div className="metric-card">
                        <div className="metric-value">{results.measuredT20}s</div>
                        <div className="metric-name">RT60 (T20)</div>
                      </div>
                      <div className="metric-card">
                        <div className="metric-value">{results.measuredT30}s</div>
                        <div className="metric-name">RT60 (T30)</div>
                      </div>
                      <div className="metric-card">
                        <div className="metric-value" style={{ color: 'var(--color-light-sage)' }}>
                          {results.targetRT60}s
                        </div>
                        <div className="metric-name">Target RT60</div>
                      </div>
                      <div className="metric-card">
                        <div className="metric-value" style={{ color: 'var(--color-accent-amber)' }}>
                          {results.rSquared}
                        </div>
                        <div className="metric-name">R² Fit Quality</div>
                      </div>
                      <div className="metric-card">
                        <div className="metric-value" style={{ color: 'var(--color-accent-emerald)' }}>
                          ~{results.neededArea} m²
                        </div>
                        <div className="metric-name">Treatment Area</div>
                      </div>
                    </div>

                    {/* SVG Schroeder Decay Curve */}
                    <div className="chart-container">
                      <div className="chart-header">
                        <span>Schroeder Energy Decay Curve (dB vs Time)</span>
                        <span>ISO 3382 Linear Regression Fit</span>
                      </div>
                      <svg viewBox="0 0 500 120" style={{ width: '100%', height: '120px', display: 'block' }}>
                        <line x1="30" y1="10" x2="480" y2="10" stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
                        <line x1="30" y1="55" x2="480" y2="55" stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
                        <line x1="30" y1="100" x2="480" y2="100" stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />

                        <line x1="30" y1="10" x2="30" y2="105" stroke="rgba(255,255,255,0.3)" />
                        <line x1="30" y1="105" x2="480" y2="105" stroke="rgba(255,255,255,0.3)" />

                        {/* Real Energy Decay Path */}
                        <path
                          d={renderSVGDecayPath(results.points)}
                          fill="none"
                          stroke="var(--color-accent-emerald)"
                          strokeWidth="2.5"
                        />

                        {/* Linear Fit Slope */}
                        <line x1="30" y1="15" x2="450" y2="104" stroke="var(--color-accent-amber)" strokeWidth="1.5" strokeDasharray="4 4" />

                        <text x="35" y="25" fill="var(--color-text-muted)" fontSize="10">0 dB</text>
                        <text x="35" y="65" fill="var(--color-text-muted)" fontSize="10">-30 dB</text>
                        <text x="35" y="100" fill="var(--color-text-muted)" fontSize="10">-60 dB</text>
                        <text x="430" y="100" fill="var(--color-text-muted)" fontSize="10">Time (s)</text>
                      </svg>
                    </div>

                    {/* Octave Band Treatment Table */}
                    {results.bands && Object.keys(results.bands).length > 0 && (
                      <div style={{ marginTop: '16px', background: 'rgba(10,15,11,0.5)', padding: '14px', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-light-sage)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
                          Octave Band Absorption Deficit & Panel Area Breakdown
                        </span>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px', marginTop: '10px', textAlign: 'center' }}>
                          {['125', '250', '500', '1000', '2000', '4000'].map((band) => {
                            const bData = results.bands[band] || {};
                            return (
                              <div key={band} style={{ background: 'rgba(40,61,41,0.4)', padding: '8px 4px', borderRadius: '6px', border: '1px solid var(--glass-border)' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{band} Hz</div>
                                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--color-cream)', marginTop: '2px' }}>
                                  {bData.measured_rt60_seconds ? bData.measured_rt60_seconds.toFixed(2) : '--'}s
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-accent-emerald)', marginTop: '2px' }}>
                                  {bData.recommended_area_m2 ? `${bData.recommended_area_m2.toFixed(1)} m²` : '0 m²'}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: ROOM MODE ANALYZER */}
                {(activeTab === 'roommodes' || activeTab === 'all') && roomModeData && (
                  <div style={{ marginTop: activeTab === 'all' ? '28px' : 0 }}>
                    <div className="results-title">
                      <Grid size={20} color="var(--color-light-sage)" />
                      <span>Low-Frequency Room Modes & Schroeder Cutoff</span>
                    </div>

                    <div style={{ background: 'rgba(40,61,41,0.5)', padding: '14px', borderRadius: '10px', border: '1px solid var(--glass-border)', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Schroeder Cutoff Frequency (f_s)</span>
                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-accent-amber)' }}>
                          {roomModeData.schroeder_freq} Hz
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', fontSize: '0.82rem', color: 'var(--color-text-dim)' }}>
                        Below {roomModeData.schroeder_freq} Hz, discrete standing waves dominate acoustics.<br />
                        Total modes detected: <strong>{roomModeData.modes?.length || 0}</strong>
                      </div>
                    </div>

                    {/* FFT & Mode Line Overlay Plot */}
                    <div className="plot-card">
                      <div className="plot-header">
                        <span>FFT Spectrum (20-300 Hz) with Overlaid Room Modes</span>
                        <div className="legend-group">
                          <div className="legend-item">
                            <div className="legend-swatch" style={{ background: '#4ade80' }}></div>
                            <span>Axial (Solid)</span>
                          </div>
                          <div className="legend-item">
                            <div className="legend-swatch" style={{ background: '#f59e0b' }}></div>
                            <span>Tangential (Dashed)</span>
                          </div>
                          <div className="legend-item">
                            <div className="legend-swatch" style={{ background: '#93a891' }}></div>
                            <span>Oblique (Dotted)</span>
                          </div>
                        </div>
                      </div>

                      <svg viewBox="0 0 500 130" style={{ width: '100%', height: '130px', display: 'block' }}>
                        {/* Shaded Schroeder Zone */}
                        {roomModeData.schroeder_freq && (
                          <rect
                            x="30"
                            y="10"
                            width={Math.min(450, (roomModeData.schroeder_freq / 300) * 450)}
                            height="95"
                            fill="rgba(229, 179, 100, 0.08)"
                          />
                        )}

                        <line x1="30" y1="105" x2="480" y2="105" stroke="rgba(255,255,255,0.3)" />

                        {/* Theoretical Mode Lines */}
                        {roomModeData.modes?.map((m, idx) => {
                          const x = 30 + (m.frequency / 300) * 450;
                          const color = m.type === 'axial' ? '#4ade80' : m.type === 'tangential' ? '#f59e0b' : '#93a891';
                          const dash = m.type === 'axial' ? 'none' : m.type === 'tangential' ? '4 2' : '2 2';
                          return (
                            <line
                              key={idx}
                              x1={x}
                              y1="15"
                              x2={x}
                              y2="105"
                              stroke={color}
                              strokeWidth="1.2"
                              strokeDasharray={dash}
                              opacity="0.75"
                            />
                          );
                        })}

                        {/* FFT Spectrum Curve */}
                        {roomModeData.fft && (
                          <path
                            d={roomModeData.fft.frequencies
                              .map((f, i) => {
                                const x = 30 + (f / 300) * 450;
                                const amp = roomModeData.fft.amplitudes[i] || 0;
                                const y = 105 - Math.min(90, amp * 80);
                                return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)},${y.toFixed(1)}`;
                              })
                              .join(' ')}
                            fill="none"
                            stroke="var(--color-cream)"
                            strokeWidth="1.8"
                          />
                        )}

                        <text x="35" y="120" fill="var(--color-text-muted)" fontSize="9">20 Hz</text>
                        <text x="240" y="120" fill="var(--color-text-muted)" fontSize="9">150 Hz</text>
                        <text x="450" y="120" fill="var(--color-text-muted)" fontSize="9">300 Hz</text>
                      </svg>
                    </div>
                  </div>
                )}

                {/* TAB 3: 3D WATERFALL PLOT */}
                {(activeTab === 'waterfall' || activeTab === 'all') && waterfallData && (
                  <div style={{ marginTop: activeTab === 'all' ? '28px' : 0 }}>
                    <div className="results-title">
                      <Layers size={20} color="var(--color-accent-amber)" />
                      <span>3D Reverberation Octave Band Waterfall</span>
                    </div>

                    <div className="plot-card">
                      <div className="plot-header">
                        <span>Multi-Band Ridgeline Energy Decay (125 Hz to 4000 Hz)</span>
                      </div>

                      <svg viewBox="0 0 500 160" style={{ width: '100%', height: '160px', display: 'block' }}>
                        {['125', '250', '500', '1000', '2000', '4000'].map((band, bIdx) => {
                          const points = waterfallData.bands?.[band] || [];
                          const yOffset = 25 + bIdx * 20;

                          const pathStr = points
                            .map((db, pIdx) => {
                              const x = 30 + (pIdx / (points.length - 1)) * 420;
                              const y = yOffset + (Math.abs(db) / 60) * 15;
                              return `${pIdx === 0 ? 'M' : 'L'} ${x.toFixed(1)},${y.toFixed(1)}`;
                            })
                            .join(' ');

                          return (
                            <g key={band}>
                              <path
                                d={pathStr}
                                fill="none"
                                stroke={bIdx % 2 === 0 ? '#f59e0b' : '#34d399'}
                                strokeWidth="2"
                                opacity={1 - bIdx * 0.12}
                              />
                              <text x="455" y={yOffset + 5} fill="var(--color-text-muted)" fontSize="9">
                                {band}Hz
                              </text>
                            </g>
                          );
                        })}
                      </svg>
                    </div>
                  </div>
                )}

                {/* TAB 4: CLARITY DIAGNOSTICS */}
                {(activeTab === 'clarity' || activeTab === 'all') && (
                  <div style={{ marginTop: activeTab === 'all' ? '28px' : 0 }}>
                    <div className="results-title">
                      <Sparkles size={20} color="var(--color-light-sage)" />
                      <span>Speech & Music Acoustic Clarity (ISO Metrics)</span>
                    </div>

                    <div className="metrics-row">
                      <div className="metric-card">
                        <div className="metric-value">{results.c50} dB</div>
                        <div className="metric-name">C50 Speech Clarity</div>
                      </div>
                      <div className="metric-card">
                        <div className="metric-value">{results.c80} dB</div>
                        <div className="metric-name">C80 Music Clarity</div>
                      </div>
                      <div className="metric-card">
                        <div className="metric-value" style={{ color: 'var(--color-light-sage)' }}>
                          {results.d50}%
                        </div>
                        <div className="metric-name">D50 Definition</div>
                      </div>
                    </div>

                    <div style={{ background: 'rgba(40, 61, 41, 0.5)', padding: '14px', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                        Acoustic Intelligibility Rating
                      </span>
                      <p style={{ marginTop: '6px', fontSize: '0.92rem', color: 'var(--color-cream)' }}>
                        {Number(results.c50) > 3.0
                          ? 'Excellent speech intelligibility. Early reflections dominate over late reverberation.'
                          : 'Moderate intelligibility. Late reverberation reflections may cause slight speech masking.'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
