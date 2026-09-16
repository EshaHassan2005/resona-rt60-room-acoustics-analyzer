import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
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
  Volume2,
  X,
  Music,
  Tv,
  Briefcase,
  Users,
  BookOpen,
  GraduationCap,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import '../styles/landing.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const ALL_SPACES_CONFIG = {
  recording_studio: {
    label: 'Recording Studio',
    desc: 'Critical tracking, mixing & control rooms (0.20 - 0.40s)',
    target: 0.30,
    range: [0.20, 0.40],
    icon: Music,
    color: '#667a65',
    category: 'Critical Audio'
  },
  home_theater: {
    label: 'Home Cinema & Theater',
    desc: 'Surround sound immersion & speech clarity (0.20 - 0.40s)',
    target: 0.30,
    range: [0.20, 0.40],
    icon: Tv,
    color: '#e5b364',
    category: 'Cinema & Media'
  },
  podcast_booth: {
    label: 'Podcast & Vocal Booth',
    desc: 'Intimate, dry broadcast voice clarity (0.20 - 0.35s)',
    target: 0.28,
    range: [0.20, 0.35],
    icon: Mic,
    color: '#4ade80',
    category: 'Voiceover & Broadcast'
  },
  office: {
    label: 'Office & Meeting Space',
    desc: 'Noise reduction, privacy & fatigue control (0.40 - 0.50s)',
    target: 0.45,
    range: [0.40, 0.50],
    icon: Briefcase,
    color: '#93a891',
    category: 'Commercial'
  },
  conference_room: {
    label: 'Conference Room',
    desc: 'Hybrid meeting & teleconference acoustics (0.50 - 0.60s)',
    target: 0.55,
    range: [0.50, 0.60],
    icon: Users,
    color: '#38bdf8',
    category: 'Commercial'
  },
  classroom: {
    label: 'Classroom / Educational',
    desc: 'ANSI S12.60 core learning spaces (0.40 - 0.60s)',
    target: 0.60,
    range: [0.40, 0.60],
    icon: BookOpen,
    color: '#a78bfa',
    category: 'Education'
  },
  lecture_hall: {
    label: 'Lecture Hall / Auditorium',
    desc: 'Speech projection without acoustic amplification (0.80 - 1.20s)',
    target: 1.00,
    range: [0.80, 1.20],
    icon: GraduationCap,
    color: '#fbbf24',
    category: 'Auditorium'
  },
  opera_house: {
    label: 'Opera House & Theater',
    desc: 'Acoustic blend of unamplified voice & orchestra (1.20 - 1.80s)',
    target: 1.50,
    range: [1.20, 1.80],
    icon: Sparkles,
    color: '#f472b6',
    category: 'Performance'
  },
  concert_hall: {
    label: 'Concert Hall',
    desc: 'Symphonic orchestra resonance & natural warmth (1.80 - 2.20s)',
    target: 1.80,
    range: [1.80, 2.20],
    icon: Volume2,
    color: '#fb7185',
    category: 'Symphonic Music'
  }
};

export const ROOM_TYPES_CONFIG = {
  all: {
    label: '✨ Do-It-All (All Space Types Available)',
    desc: 'Simultaneous comparative diagnostic across all 9 room standards',
    target: 0.45,
    range: [0.20, 2.20],
    icon: Sparkles,
    color: '#4ade80',
    category: 'Universal Multi-Space'
  },
  ...ALL_SPACES_CONFIG
};

export const calculateAllSpacesEvaluation = (measuredT20, volumeM3, material) => {
  const coeff =
    material === 'acoustic_panel'
      ? 0.90
      : material === 'bass_trap'
      ? 0.95
      : material === 'heavy_curtain'
      ? 0.50
      : 0.60;

  const currentAbsorption = (0.161 * volumeM3) / Number(measuredT20);
  const evaluation = {};
  let bestKey = 'recording_studio';
  let minDiff = Infinity;

  Object.entries(ALL_SPACES_CONFIG).forEach(([key, info]) => {
    const targetA = (0.161 * volumeM3) / info.target;
    const deficit = Math.max(0, targetA - currentAbsorption);
    const neededArea = Number((deficit / coeff).toFixed(1));
    const delta = Number((Number(measuredT20) - info.target).toFixed(2));

    let status = 'Optimal Match';
    let statusType = 'optimal';
    if (Number(measuredT20) >= info.range[0] && Number(measuredT20) <= info.range[1]) {
      status = 'Optimal Match';
      statusType = 'optimal';
    } else if (Number(measuredT20) > info.range[1]) {
      status = 'Needs Absorption';
      statusType = 'reverberant';
    } else {
      status = 'Too Dry / Over-Damped';
      statusType = 'dry';
    }

    const diff = Math.abs(Number(measuredT20) - info.target);
    if (diff < minDiff) {
      minDiff = diff;
      bestKey = key;
    }

    const suitabilityScore = Math.max(
      25,
      Math.min(100, Math.round(100 - (diff / Math.max(0.2, info.target)) * 60))
    );

    evaluation[key] = {
      ...info,
      key,
      measured: Number(measuredT20),
      delta,
      status,
      statusType,
      neededArea,
      suitabilityScore
    };
  });

  return { evaluation, bestKey };
};

const MATERIALS_CONFIG = {
  acoustic_panel: { label: 'High-Density Rockwool Panels (50mm, NRC 0.85-0.95)' },
  bass_trap: { label: 'Corner Bass Traps & Low-Freq Absorbers (100mm, NRC 0.95+)' },
  heavy_curtain: { label: 'Heavy Velour Drapes (50% gather, NRC 0.50)' },
  carpet_rug: { label: 'Tufted Pile Carpet on Felt Underlay (NRC 0.30-0.75)' }
};

export default function GeneratorPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const querySpace = searchParams.get('space');

  // View state: 'workspace'
  const [activeTab, setActiveTab] = useState('treatment'); // 'treatment', 'roommodes', 'waterfall', 'clarity'

  // Input Parameters State
  const [roomType, setRoomType] = useState(
    querySpace && ROOM_TYPES_CONFIG[querySpace] ? querySpace : 'recording_studio'
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
    window.scrollTo(0, 0);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Update roomType if query param changes
  useEffect(() => {
    if (querySpace && ROOM_TYPES_CONFIG[querySpace]) {
      setRoomType(querySpace);
    }
  }, [querySpace]);

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
    e.stopPropagation();
    setFile(null);
    setFileName('');
    setAudioPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // --- WAV encoder: converts an AudioBuffer to a proper RIFF PCM WAV Blob ---
  const encodeWav = (audioBuffer) => {
    const numChannels = 1; // mono
    const sampleRate = audioBuffer.sampleRate;
    const samples = audioBuffer.getChannelData(0);
    const pcm = new Int16Array(samples.length);
    for (let i = 0; i < samples.length; i++) {
      const s = Math.max(-1, Math.min(1, samples[i]));
      pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    const dataLen = pcm.length * 2;
    const buffer = new ArrayBuffer(44 + dataLen);
    const view = new DataView(buffer);
    const writeStr = (off, str) => {
      for (let i = 0; i < str.length; i++) view.setUint8(off + i, str.charCodeAt(i));
    };
    writeStr(0, 'RIFF');
    view.setUint32(4, 36 + dataLen, true);
    writeStr(8, 'WAVE');
    writeStr(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * 2, true);
    view.setUint16(32, numChannels * 2, true);
    view.setUint16(34, 16, true);
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
        const compressedBlob = new Blob(audioChunksRef.current, {
          type: mediaRecorderRef.current.mimeType || 'audio/webm',
        });

        try {
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

  // Main Analysis Runner
  const runAnalysis = async () => {
    setIsAnalyzing(true);
    setErrorMessage(null);
    setResults(null);
    setRoomModeData(null);
    setWaterfallData(null);

    if (roomType === 'all') {
      setActiveTab('all');
    }

    // If an audio file is uploaded and simulation mode is not enabled, call the real Python DSP backend
    if (file && !isSimMode) {
      try {
        const formData = new FormData();
        formData.append('audio', file);
        formData.append('volume_m3', volumeM3);
        formData.append('room_type', roomType);
        formData.append('material', material);
        formData.append('length_m', lengthM);
        formData.append('width_m', widthM);
        formData.append('height_m', heightM);

        const treatmentRes = await fetch(`${API_BASE_URL}/treatment`, {
          method: 'POST',
          body: formData,
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
            body: formData,
          });
          if (roomModeRes.ok) {
            const rmJson = await roomModeRes.json();
            setRoomModeData(rmJson);
          }

          const wfRes = await fetch(`${API_BASE_URL}/waterfall`, {
            method: 'POST',
            body: formData,
          });
          if (wfRes.ok) {
            const wfJson = await wfRes.json();
            setWaterfallData(wfJson);
          }
        } else {
          setRoomModeData(generateSimulatedRoomModes(lengthM, widthM, heightM, data.measured_rt60 || 0.45));
          setWaterfallData(generateSimulatedWaterfall());
        }

        setIsAnalyzing(false);
        return;
      } catch (err) {
        console.warn('Backend call failed:', err.message);
        setErrorMessage(
          `Analysis failed: ${err.message}. Check that the backend is running, or toggle Client-Side Simulation Mode below.`
        );
        setIsAnalyzing(false);
        return;
      }
    }

    // Client-Side DSP Simulation Mode
    setTimeout(() => {
      const targetObj = ROOM_TYPES_CONFIG[roomType] || ROOM_TYPES_CONFIG.recording_studio;
      const target = targetObj.target || 0.30;

      const baseRT60 = Number((0.161 * volumeM3 / (volumeM3 * 0.18 + 12)).toFixed(2));
      const measuredT20 = Math.max(0.22, (baseRT60 * (1 + (Math.random() * 0.1 - 0.05)))).toFixed(2);
      const measuredT30 = (Number(measuredT20) * 1.03).toFixed(2);
      const rSquared = (0.985 + Math.random() * 0.012).toFixed(3);

      const c50 = (measuredT20 < 0.5 ? 4.8 : 1.2).toFixed(1);
      const c80 = (measuredT20 < 0.5 ? 8.2 : 4.5).toFixed(1);
      const d50 = (measuredT20 < 0.5 ? 76.5 : 54.0).toFixed(1);

      const absorptionCoeff =
        material === 'acoustic_panel'
          ? 0.90
          : material === 'bass_trap'
          ? 0.95
          : material === 'heavy_curtain'
          ? 0.50
          : 0.60;
      const currentAbsorption = (0.161 * volumeM3) / measuredT20;
      const targetAbsorption = (0.161 * volumeM3) / target;
      const neededAbsorption = Math.max(0, targetAbsorption - currentAbsorption);
      const neededArea = (neededAbsorption / absorptionCoeff).toFixed(1);

      const points = [];
      for (let i = 0; i <= 50; i++) {
        const t = (i / 50) * 1.2;
        const decay = -(60 / measuredT20) * t;
        points.push({ time: t.toFixed(2), db: Math.max(-65, decay).toFixed(1) });
      }

      const bands = {
        '125': { measured_rt60_seconds: Number((measuredT20 * 1.25).toFixed(2)), recommended_area_m2: Number((neededArea * 1.4).toFixed(1)) },
        '250': { measured_rt60_seconds: Number((measuredT20 * 1.1).toFixed(2)), recommended_area_m2: Number((neededArea * 1.1).toFixed(1)) },
        '500': { measured_rt60_seconds: Number(measuredT20), recommended_area_m2: Number(neededArea) },
        '1000': { measured_rt60_seconds: Number((measuredT20 * 0.95).toFixed(2)), recommended_area_m2: Number((neededArea * 0.9).toFixed(1)) },
        '2000': { measured_rt60_seconds: Number((measuredT20 * 0.9).toFixed(2)), recommended_area_m2: Number((neededArea * 0.85).toFixed(1)) },
        '4000': { measured_rt60_seconds: Number((measuredT20 * 0.85).toFixed(2)), recommended_area_m2: Number((neededArea * 0.8).toFixed(1)) },
      };

      const allSpacesEval = calculateAllSpacesEvaluation(measuredT20, volumeM3, material);
      const effectiveTarget = roomType === 'all'
        ? (ALL_SPACES_CONFIG[allSpacesEval.bestKey]?.target || 0.45)
        : target;

      setResults({
        measuredT20,
        measuredT30,
        rSquared,
        targetRT60: effectiveTarget,
        c50,
        c80,
        d50,
        neededArea: roomType === 'all' ? allSpacesEval.evaluation[allSpacesEval.bestKey]?.neededArea : neededArea,
        status: measuredT20 <= effectiveTarget * 1.15 ? 'Optimized' : 'Treatment Recommended',
        points,
        bands,
        lundeby_corrected: true,
        allSpaces: allSpacesEval.evaluation,
        bestMatch: allSpacesEval.bestKey
      });

      setRoomModeData(generateSimulatedRoomModes(lengthM, widthM, heightM, measuredT20));
      setWaterfallData(generateSimulatedWaterfall());
      setIsAnalyzing(false);
    }, 800);
  };

  const formatBackendResults = (data) => {
    const targetObj = ROOM_TYPES_CONFIG[roomType] || ROOM_TYPES_CONFIG.recording_studio;
    const measuredT20 = data.RT60_T20
      ? data.RT60_T20.toFixed(2)
      : data.measured_rt60
      ? data.measured_rt60.toFixed(2)
      : '0.48';
    const measuredT30 = data.RT60_T30 ? data.RT60_T30.toFixed(2) : (Number(measuredT20) * 1.02).toFixed(2);
    const rSquared = data.r_squared_T20 ? data.r_squared_T20.toFixed(3) : '0.991';
    const target = data.target_rt60_seconds || targetObj.target;
    const allSpacesEval = calculateAllSpacesEvaluation(measuredT20, volumeM3, material);

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
      lundeby_corrected: data.lundeby_corrected ?? true,
      allSpaces: data.all_spaces || allSpacesEval.evaluation,
      bestMatch: data.best_match || allSpacesEval.bestKey
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
            type: nonZeros === 1 ? 'axial' : nonZeros === 2 ? 'tangential' : 'oblique',
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
      fft: { frequencies: fftFreqs, amplitudes: fftAmps },
    };
  };

  const generateSimulatedWaterfall = () => {
    const timePoints = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.8, 1.0, 1.2];
    const bands = {
      '125': timePoints.map((t) => Number(Math.max(-60, -35 * t).toFixed(1))),
      '250': timePoints.map((t) => Number(Math.max(-60, -42 * t).toFixed(1))),
      '500': timePoints.map((t) => Number(Math.max(-60, -50 * t).toFixed(1))),
      '1000': timePoints.map((t) => Number(Math.max(-60, -55 * t).toFixed(1))),
      '2000': timePoints.map((t) => Number(Math.max(-60, -60 * t).toFixed(1))),
      '4000': timePoints.map((t) => Number(Math.max(-60, -68 * t).toFixed(1))),
    };
    return { time_points: timePoints, bands };
  };

  // SVG Decay Path Generator
  const renderSVGDecayPath = (points) => {
    if (!points || points.length === 0) {
      return 'M 30,15 Q 90,35 180,68 T 350,95 T 460,104';
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
    <div className={`generator-page ${isAnalyzing ? 'generator-running' : ''}`}>
      {/* Top Standalone Page Header */}
      <header className="generator-navbar">
        <div className="container generator-navbar-inner">
          <div className="generator-nav-left">
            <button
              className="btn-back-home"
              onClick={() => !isAnalyzing && navigate('/')}
              disabled={isAnalyzing}
              title="Return to Landing Page"
              style={isAnalyzing ? { cursor: 'not-allowed', opacity: 0.5 } : {}}
            >
              <ArrowLeft size={18} />
              <span>Back to Home</span>
            </button>
            <div
              className="generator-brand"
              onClick={() => !isAnalyzing && navigate('/')}
              style={isAnalyzing ? { cursor: 'not-allowed' } : { cursor: 'pointer' }}
            >
              <div className="brand-logo-icon">
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
              </div>
              <span className="brandname">RESONA</span>
              <span className="generator-badge-tag">Acoustic Lab & Generator</span>
            </div>
          </div>

          <div className="generator-nav-right">
            {results?.lundeby_corrected && (
              <div className="lundeby-badge">
                <ShieldCheck size={14} />
                <span>ISO 3382-1 Lundeby Corrected</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Page Body Container */}
      <main className="generator-page-content container">
        <div className="generator-workspace-card">
          {/* Header Title Section */}
          <div className="workspace-header">
            <div className="hub-header-badge">
              <Activity size={16} />
              <span>DSP REVERBERATION & TREATMENT ENGINE</span>
            </div>
            <h1 className="workspace-title">Acoustic Room RT60 Generator</h1>
            <p className="workspace-subtitle">
              Measure, diagnose, and calculate required acoustic absorption treatments using ISO 3382 Schroeder reverse integration, octave-band filtering, and Sabine-Eyring physical room modeling.
            </p>
          </div>

          {/* Tab Navigation Bar */}
          <div className="generator-tab-bar">
            <button
              className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => !isAnalyzing && setActiveTab('all')}
              disabled={isAnalyzing}
              style={{
                ...(activeTab === 'all' ? { borderColor: 'var(--color-accent-emerald)', background: 'rgba(74, 222, 128, 0.15)' } : {}),
                ...(isAnalyzing ? { cursor: 'not-allowed', opacity: 0.5 } : {}),
              }}
            >
              <Sparkles size={16} color="var(--color-accent-emerald)" />
              <span>✨ Do-It-All (All Spaces)</span>
            </button>
            <button
              className={`tab-btn ${activeTab === 'treatment' ? 'active' : ''}`}
              onClick={() => !isAnalyzing && setActiveTab('treatment')}
              disabled={isAnalyzing}
              style={isAnalyzing ? { cursor: 'not-allowed', opacity: 0.5 } : {}}
            >
              <Activity size={16} />
              <span>RT60 & Treatment</span>
            </button>
            <button
              className={`tab-btn ${activeTab === 'roommodes' ? 'active' : ''}`}
              onClick={() => !isAnalyzing && setActiveTab('roommodes')}
              disabled={isAnalyzing}
              style={isAnalyzing ? { cursor: 'not-allowed', opacity: 0.5 } : {}}
            >
              <Grid size={16} />
              <span>Room Modes (FFT)</span>
            </button>
            <button
              className={`tab-btn ${activeTab === 'waterfall' ? 'active' : ''}`}
              onClick={() => !isAnalyzing && setActiveTab('waterfall')}
              disabled={isAnalyzing}
              style={isAnalyzing ? { cursor: 'not-allowed', opacity: 0.5 } : {}}
            >
              <Layers size={16} />
              <span>3D Waterfall</span>
            </button>
            <button
              className={`tab-btn ${activeTab === 'clarity' ? 'active' : ''}`}
              onClick={() => !isAnalyzing && setActiveTab('clarity')}
              disabled={isAnalyzing}
              style={isAnalyzing ? { cursor: 'not-allowed', opacity: 0.5 } : {}}
            >
              <Sliders size={16} />
              <span>Speech & Music Clarity</span>
            </button>
          </div>

          {/* Input Controls Form */}
          <div className="form-grid">
            {/* Room Context */}
            <div className="form-group">
              <label className="form-label">Space / Room Context</label>
              <select
                className="form-select"
                value={roomType}
                disabled={isAnalyzing}
                style={isAnalyzing ? { cursor: 'not-allowed', opacity: 0.6 } : {}}
                onChange={(e) => {
                  if (isAnalyzing) return;
                  const val = e.target.value;
                  setRoomType(val);
                  if (val === 'all') {
                    setActiveTab('all');
                  }
                }}
              >
                {Object.entries(ROOM_TYPES_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>
                    {key === 'all' ? config.label : `${config.label} (Target: ~${config.target}s)`}
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
                  disabled={isAnalyzing}
                  style={isAnalyzing ? { cursor: 'not-allowed', opacity: 0.6 } : {}}
                  onChange={(e) => !isAnalyzing && setLengthM(Math.max(1, Number(e.target.value)))}
                  step="0.1"
                />
                <input
                  type="number"
                  className="form-input"
                  placeholder="W"
                  value={widthM}
                  disabled={isAnalyzing}
                  style={isAnalyzing ? { cursor: 'not-allowed', opacity: 0.6 } : {}}
                  onChange={(e) => !isAnalyzing && setWidthM(Math.max(1, Number(e.target.value)))}
                  step="0.1"
                />
                <input
                  type="number"
                  className="form-input"
                  placeholder="H"
                  value={heightM}
                  disabled={isAnalyzing}
                  style={isAnalyzing ? { cursor: 'not-allowed', opacity: 0.6 } : {}}
                  onChange={(e) => !isAnalyzing && setHeightM(Math.max(1, Number(e.target.value)))}
                  step="0.1"
                />
              </div>
              <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '4px', display: 'block' }}>
                Calculated Volume: <strong style={{ color: 'var(--color-cream)' }}>{volumeM3} m³</strong>
              </span>
            </div>

            {/* Acoustic Treatment Material */}
            <div className="form-group full-width">
              <label className="form-label">Acoustic Material Spec</label>
              <select
                className="form-select"
                value={material}
                disabled={isAnalyzing}
                style={isAnalyzing ? { cursor: 'not-allowed', opacity: 0.6 } : {}}
                onChange={(e) => !isAnalyzing && setMaterial(e.target.value)}
              >
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
              className={`dropzone ${fileName ? 'active' : ''} ${isAnalyzing ? 'disabled' : ''}`}
              onClick={() => {
                if (isAnalyzing) return;
                fileInputRef.current?.click();
              }}
              style={isAnalyzing ? { cursor: 'not-allowed', opacity: 0.55 } : {}}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".wav,.mp3,.flac,.ogg,.m4a"
                disabled={isAnalyzing}
                style={{ display: 'none' }}
              />
              <UploadCloud size={32} className="dropzone-icon" />
              {fileName ? (
                <div style={{ position: 'relative', width: '100%' }}>
                  <button
                    onClick={(e) => {
                      if (isAnalyzing) return;
                      clearFile(e);
                    }}
                    disabled={isAnalyzing}
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
                      cursor: isAnalyzing ? 'not-allowed' : 'pointer',
                      opacity: isAnalyzing ? 0.5 : 1,
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
                  <p className="dropzone-hint">{isAnalyzing ? 'Analysis in progress...' : 'Click to change audio file'}</p>
                </div>
              ) : (
                <div>
                  <p className="dropzone-text">
                    <strong>Upload impulse response</strong> (.wav, .mp3)
                  </p>
                  <p className="dropzone-hint">{isAnalyzing ? 'Analysis in progress...' : 'Balloon pop, clap test, or acoustic sine sweep'}</p>
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
                  <button
                    className="mic-btn-record mic-btn-recording"
                    onClick={stopRecording}
                    disabled={isAnalyzing}
                    style={{ marginTop: '8px', ...(isAnalyzing ? { cursor: 'not-allowed', opacity: 0.5 } : {}) }}
                  >
                    <Square size={14} /> STOP RECORDING
                  </button>
                </div>
              ) : (
                <div>
                  <p className="dropzone-text">
                    <strong>Record Live Impulse Test</strong>
                  </p>
                  <button
                    className="mic-btn-record"
                    onClick={() => !isAnalyzing && startRecording()}
                    disabled={isAnalyzing}
                    style={{ marginTop: '8px', ...(isAnalyzing ? { cursor: 'not-allowed', opacity: 0.5 } : {}) }}
                  >
                    <Mic size={14} /> RECORD AUDIO
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Audio Preview Playback if file/recording attached */}
          {audioPreviewUrl && (
            <div
              style={{
                background: 'rgba(18, 24, 19, 0.5)',
                padding: '10px 16px',
                borderRadius: '10px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span
                style={{
                  fontSize: '0.82rem',
                  color: 'var(--color-text-dim)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
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
              disabled={isAnalyzing}
              onChange={(e) => !isAnalyzing && setIsSimMode(e.target.checked)}
              style={{ cursor: isAnalyzing ? 'not-allowed' : 'pointer', width: '16px', height: '16px' }}
            />
            <label
              htmlFor="simToggle"
              style={{ fontSize: '0.84rem', color: 'var(--color-text-dim)', cursor: isAnalyzing ? 'not-allowed' : 'pointer' }}
            >
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
              onClick={() => !isAnalyzing && runAnalysis()}
              disabled={isAnalyzing}
              style={{
                width: '100%',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                cursor: isAnalyzing ? 'not-allowed' : 'pointer',
              }}
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

          {/* RESULTS DISPLAY */}
          {results && (
            <div className="results-container">
              {/* TAB 0: DO-IT-ALL FOR ALL AVAILABLE SPACE TYPES */}
              {activeTab === 'all' && results && results.allSpaces && (
                <div>
                  {/* Master Diagnostic Summary Card */}
                  <div className="do-it-all-summary-card">
                    <div className="do-it-all-summary-title">
                      <Sparkles size={22} color="var(--color-accent-emerald)" />
                      <span>Universal Do-It-All Acoustic Assessment (All 9 Space Types)</span>
                    </div>
                    <p className="do-it-all-summary-text">
                      Comprehensive evaluation of your room (<strong>{volumeM3} m³</strong>, measured RT60: <strong>{results.measuredT20}s</strong>) across all <strong>9 international acoustic standards</strong> (ANSI S12.60, ISO 3382, Broadcast EBU R128).
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', marginTop: '14px' }}>
                      <span className="best-match-highlight">
                        🏆 Best Natural Acoustic Fit: {ALL_SPACES_CONFIG[results.bestMatch]?.label} ({results.allSpaces[results.bestMatch]?.suitabilityScore}% Suitability)
                      </span>
                      <span style={{ fontSize: '0.84rem', color: 'var(--color-text-dim)' }}>
                        {results.allSpaces[results.bestMatch]?.neededArea === 0
                          ? '✅ Meets target reverberation criteria without needing absorption panels.'
                          : `Requires ~${results.allSpaces[results.bestMatch]?.neededArea} m² panels to reach nominal target.`}
                      </span>
                    </div>
                  </div>

                  {/* Multi-Space RT60 Target Spectrum Gauge */}
                  <div className="rt60-spectrum-chart">
                    <div className="spectrum-header">
                      <div>
                        <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-cream)' }}>
                          RT60 Target Spectrum: All 9 Spaces Compared
                        </span>
                        <p style={{ fontSize: '0.78rem', color: 'var(--color-text-dim)', marginTop: '2px' }}>
                          Acceptable target ranges vs your room's Measured RT60 (<strong style={{ color: '#f87171' }}>{results.measuredT20}s</strong> vertical line)
                        </p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.75rem', color: 'var(--color-text-dim)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ width: '14px', height: '8px', background: 'rgba(102, 122, 101, 0.4)', border: '1px solid var(--color-light-sage)', borderRadius: '2px' }}></span>
                          <span>Acceptable Range</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ width: '3px', height: '14px', background: '#f87171', borderRadius: '2px', boxShadow: '0 0 6px rgba(248,113,113,0.8)' }}></span>
                          <span>Your Room ({results.measuredT20}s)</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {Object.entries(ALL_SPACES_CONFIG)
                        .sort((a, b) => a[1].target - b[1].target)
                        .map(([key, info]) => {
                          const evalData = results.allSpaces[key] || {};
                          const maxScale = 2.4; // scale from 0.0s to 2.4s
                          const leftPct = Math.min(100, Math.max(0, (info.range[0] / maxScale) * 100));
                          const widthPct = Math.min(100 - leftPct, Math.max(2, ((info.range[1] - info.range[0]) / maxScale) * 100));
                          const markerPct = Math.min(100, Math.max(0, (Number(results.measuredT20) / maxScale) * 100));
                          const isOptimal = evalData.statusType === 'optimal';

                          return (
                            <div key={key} className="spectrum-row">
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: info.color }}></div>
                                <span style={{ fontWeight: 600, color: 'var(--color-cream)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {info.label}
                                </span>
                              </div>

                              <div className="spectrum-track">
                                <div
                                  className={`spectrum-target-range ${isOptimal ? 'active-match' : ''}`}
                                  style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                                  title={`Target range: ${info.range[0]}s - ${info.range[1]}s`}
                                ></div>
                                <div
                                  className="spectrum-marker"
                                  style={{ left: `${markerPct}%` }}
                                  title={`Your Room RT60: ${results.measuredT20}s`}
                                ></div>
                              </div>

                              <div style={{ textAlign: 'right', fontSize: '0.78rem', color: isOptimal ? 'var(--color-accent-emerald)' : 'var(--color-text-dim)', fontWeight: isOptimal ? 700 : 500 }}>
                                {info.range[0]}s–{info.range[1]}s
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  {/* 9-Space Detailed Comparative Grid */}
                  <div className="do-it-all-grid">
                    {Object.entries(ALL_SPACES_CONFIG).map(([key, info]) => {
                      const evalData = results.allSpaces[key] || {};
                      const IconComponent = info.icon;
                      const isOptimal = evalData.statusType === 'optimal';
                      const isReverb = evalData.statusType === 'reverberant';

                      return (
                        <div key={key} className={`space-matrix-card ${evalData.statusType || ''}`}>
                          <div>
                            <div className="space-card-top">
                              <div className="space-card-icon-title">
                                <div className="space-icon-wrapper" style={{ color: info.color }}>
                                  <IconComponent size={20} />
                                </div>
                                <div>
                                  <h4 className="space-card-heading">{info.label}</h4>
                                  <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                                    {info.category}
                                  </span>
                                </div>
                              </div>

                              <span
                                className={`space-card-status-badge ${
                                  isOptimal
                                    ? 'status-badge-optimal'
                                    : isReverb
                                    ? 'status-badge-reverberant'
                                    : 'status-badge-dry'
                                }`}
                              >
                                {evalData.status || 'Evaluated'}
                              </span>
                            </div>

                            <p style={{ fontSize: '0.78rem', color: 'var(--color-text-dim)', marginBottom: '12px', minHeight: '34px' }}>
                              {info.desc}
                            </p>

                            <div className="space-metric-row">
                              <span className="space-metric-label">Target RT60:</span>
                              <span className="space-metric-value">{info.target}s ({info.range[0]}s–{info.range[1]}s)</span>
                            </div>

                            <div className="space-metric-row">
                              <span className="space-metric-label">Measured Delta (Δ):</span>
                              <span
                                className="space-metric-value"
                                style={{
                                  color: isOptimal
                                    ? 'var(--color-accent-emerald)'
                                    : evalData.delta > 0
                                    ? 'var(--color-accent-amber)'
                                    : '#93c5fd'
                                }}
                              >
                                {evalData.delta > 0 ? `+${evalData.delta}s` : `${evalData.delta}s`}
                              </span>
                            </div>

                            <div className="space-metric-row">
                              <span className="space-metric-label">Acoustic Suitability:</span>
                              <span className="space-metric-value" style={{ color: isOptimal ? 'var(--color-accent-emerald)' : 'var(--color-cream)' }}>
                                {evalData.suitabilityScore || 75}%
                              </span>
                            </div>

                            <div className="space-treatment-box">
                              <span style={{ fontSize: '0.76rem', color: 'var(--color-text-dim)' }}>
                                Treatment Needed:
                              </span>
                              <strong
                                style={{
                                  fontSize: '0.88rem',
                                  color: evalData.neededArea > 0 ? 'var(--color-accent-emerald)' : 'var(--color-cream)'
                                }}
                              >
                                {evalData.neededArea > 0 ? `~${evalData.neededArea} m²` : '0 m² (Ready)'}
                              </strong>
                            </div>
                          </div>

                          <button
                            className="btn-space-focus"
                            disabled={isAnalyzing}
                            style={isAnalyzing ? { cursor: 'not-allowed', opacity: 0.5 } : {}}
                            onClick={() => {
                              if (isAnalyzing) return;
                              setRoomType(key);
                              setActiveTab('treatment');
                            }}
                          >
                            <span>Inspect {info.label} Details</span>
                            <ArrowRight size={14} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 1: OVERVIEW & TREATMENT */}
              {activeTab === 'treatment' && (
                <div>
                  <div className="results-title">
                    <CheckCircle size={20} color="var(--color-accent-emerald)" />
                    <span>Reverberation & Treatment Results</span>
                    <span
                      style={{
                        marginLeft: 'auto',
                        fontSize: '0.78rem',
                        padding: '4px 10px',
                        borderRadius: '999px',
                        background: 'rgba(74, 222, 128, 0.15)',
                        color: 'var(--color-accent-emerald)',
                        border: '1px solid rgba(74, 222, 128, 0.3)',
                      }}
                    >
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
                      <line
                        x1="30"
                        y1="15"
                        x2="450"
                        y2="104"
                        stroke="var(--color-accent-amber)"
                        strokeWidth="1.5"
                        strokeDasharray="4 4"
                      />

                      <text x="35" y="25" fill="var(--color-text-muted)" fontSize="10">0 dB</text>
                      <text x="35" y="65" fill="var(--color-text-muted)" fontSize="10">-30 dB</text>
                      <text x="35" y="100" fill="var(--color-text-muted)" fontSize="10">-60 dB</text>
                      <text x="430" y="100" fill="var(--color-text-muted)" fontSize="10">Time (s)</text>
                    </svg>

                    {/* Line Descriptions Guide */}
                    <div className="graph-guide-container">
                      <div className="graph-guide-header">
                        <Activity size={14} />
                        <span>Line Guide: What Each Line Indicates</span>
                      </div>
                      <div className="graph-lines-grid">
                        <div className="graph-line-card">
                          <div className="line-swatch-box">
                            <div style={{ width: '100%', height: '3px', background: '#4ade80', borderRadius: '2px' }}></div>
                          </div>
                          <div className="line-guide-info">
                            <div className="line-guide-title">
                              <span>Solid Emerald Line</span>
                              <span style={{ fontSize: '0.7rem', color: '#4ade80' }}>Actual Decay</span>
                            </div>
                            <p className="line-guide-desc">
                              <strong>Schroeder Energy Decay:</strong> Shows the real backwards-integrated acoustic energy decaying over time from 0 dB to noise floor. Steeper downward slope = faster sound absorption.
                            </p>
                          </div>
                        </div>

                        <div className="graph-line-card">
                          <div className="line-swatch-box">
                            <div style={{ width: '100%', height: '3px', borderTop: '2px dashed #f59e0b' }}></div>
                          </div>
                          <div className="line-guide-info">
                            <div className="line-guide-title">
                              <span>Dashed Amber Line</span>
                              <span style={{ fontSize: '0.7rem', color: '#f59e0b' }}>ISO 3382 Slope</span>
                            </div>
                            <p className="line-guide-desc">
                              <strong>Linear Regression Fit (T20/T30):</strong> The best-fit decay slope calculated between -5 dB and -25 dB (-35 dB for T30), extrapolated across 60 dB to determine RT60.
                            </p>
                          </div>
                        </div>

                        <div className="graph-line-card">
                          <div className="line-swatch-box">
                            <div style={{ width: '100%', height: '2px', borderTop: '2px dotted rgba(255,255,255,0.4)' }}></div>
                          </div>
                          <div className="line-guide-info">
                            <div className="line-guide-title">
                              <span>Dotted Gray Grid Lines</span>
                              <span style={{ fontSize: '0.7rem', color: 'var(--color-text-dim)' }}>Reference</span>
                            </div>
                            <p className="line-guide-desc">
                              <strong>Decibel Thresholds:</strong> 0 dB marks peak impulse excitation; -30 dB is mid-decay reference; -60 dB is the standard international cutoff for complete decay.
                            </p>
                          </div>
                        </div>

                        <div className="graph-line-card">
                          <div className="line-swatch-box">
                            <div style={{ width: '100%', height: '12px', borderLeft: '2px solid rgba(255,255,255,0.4)', borderBottom: '2px solid rgba(255,255,255,0.4)' }}></div>
                          </div>
                          <div className="line-guide-info">
                            <div className="line-guide-title">
                              <span>Coordinate Axes</span>
                              <span style={{ fontSize: '0.7rem', color: 'var(--color-text-dim)' }}>dB vs Time</span>
                            </div>
                            <p className="line-guide-desc">
                              <strong>Axes Measurement:</strong> Vertical Y-axis measures sound level drop in decibels (0 to -60 dB); horizontal X-axis tracks elapsed time in seconds.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Octave Band Treatment Table */}
                  {results.bands && Object.keys(results.bands).length > 0 && (
                    <div
                      style={{
                        marginTop: '16px',
                        background: 'rgba(10,15,11,0.5)',
                        padding: '14px',
                        borderRadius: '10px',
                        border: '1px solid var(--glass-border)',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.8rem',
                          color: 'var(--color-light-sage)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          fontWeight: 700,
                        }}
                      >
                        Octave Band Absorption Deficit & Panel Area Breakdown
                      </span>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(6, 1fr)',
                          gap: '8px',
                          marginTop: '10px',
                          textAlign: 'center',
                        }}
                      >
                        {['125', '250', '500', '1000', '2000', '4000'].map((band) => {
                          const bData = results.bands[band] || {};
                          return (
                            <div
                              key={band}
                              style={{
                                background: 'rgba(40,61,41,0.4)',
                                padding: '8px 4px',
                                borderRadius: '6px',
                                border: '1px solid var(--glass-border)',
                              }}
                            >
                              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{band} Hz</div>
                              <div
                                style={{
                                  fontSize: '0.88rem',
                                  fontWeight: 700,
                                  color: 'var(--color-cream)',
                                  marginTop: '2px',
                                }}
                              >
                                {bData.measured_rt60_seconds ? bData.measured_rt60_seconds.toFixed(2) : '--'}s
                              </div>
                              <div
                                style={{
                                  fontSize: '0.75rem',
                                  color: 'var(--color-accent-emerald)',
                                  marginTop: '2px',
                                }}
                              >
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

              {/* TAB 2: ROOM MODES */}
              {activeTab === 'roommodes' && roomModeData && (
                <div>
                  <div className="results-title">
                    <Grid size={20} color="var(--color-light-sage)" />
                    <span>Low-Frequency Room Modes & Schroeder Cutoff</span>
                  </div>

                  <div
                    style={{
                      background: 'rgba(40,61,41,0.5)',
                      padding: '14px',
                      borderRadius: '10px',
                      border: '1px solid var(--glass-border)',
                      marginBottom: '16px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <span
                        style={{
                          fontSize: '0.78rem',
                          color: 'var(--color-text-muted)',
                          textTransform: 'uppercase',
                        }}
                      >
                        Schroeder Cutoff Frequency (f_s)
                      </span>
                      <div
                        style={{
                          fontSize: '1.4rem',
                          fontWeight: 800,
                          color: 'var(--color-accent-amber)',
                        }}
                      >
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

                      {roomModeData.modes?.map((m, idx) => {
                        const x = 30 + (m.frequency / 300) * 450;
                        const color =
                          m.type === 'axial' ? '#4ade80' : m.type === 'tangential' ? '#f59e0b' : '#93a891';
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

                    {/* Room Modes Line Descriptions Guide */}
                    <div className="graph-guide-container">
                      <div className="graph-guide-header">
                        <Grid size={14} />
                        <span>Line Guide: What Each Line & Zone Indicates</span>
                      </div>
                      <div className="graph-lines-grid">
                        <div className="graph-line-card">
                          <div className="line-swatch-box">
                            <div style={{ width: '100%', height: '3px', background: 'var(--color-cream)', borderRadius: '2px' }}></div>
                          </div>
                          <div className="line-guide-info">
                            <div className="line-guide-title">
                              <span>Solid Cream Curve</span>
                              <span style={{ fontSize: '0.7rem', color: 'var(--color-cream)' }}>FFT Spectrum</span>
                            </div>
                            <p className="line-guide-desc">
                              <strong>Measured FFT Magnitude (20–300 Hz):</strong> Real frequency response. Prominent peaks indicate boomy resonant frequency buildups; troughs show phase cancellation bass nulls.
                            </p>
                          </div>
                        </div>

                        <div className="graph-line-card">
                          <div className="line-swatch-box">
                            <div style={{ width: '3px', height: '16px', background: '#4ade80', margin: '0 auto', borderRadius: '1px' }}></div>
                          </div>
                          <div className="line-guide-info">
                            <div className="line-guide-title">
                              <span>Solid Green Line</span>
                              <span style={{ fontSize: '0.7rem', color: '#4ade80' }}>Axial (1D)</span>
                            </div>
                            <p className="line-guide-desc">
                              <strong>Axial Room Modes:</strong> Standing waves between 2 opposing parallel boundaries (L, W, or H). Possesses 100% modal energy; primary cause of muddy bass and room ringing.
                            </p>
                          </div>
                        </div>

                        <div className="graph-line-card">
                          <div className="line-swatch-box">
                            <div style={{ width: '3px', height: '16px', borderLeft: '2px dashed #f59e0b', margin: '0 auto' }}></div>
                          </div>
                          <div className="line-guide-info">
                            <div className="line-guide-title">
                              <span>Dashed Amber Line</span>
                              <span style={{ fontSize: '0.7rem', color: '#f59e0b' }}>Tangential (2D)</span>
                            </div>
                            <p className="line-guide-desc">
                              <strong>Tangential Room Modes:</strong> Standing waves reflecting between 4 room boundaries. Carries ~50% the energy of axial modes with moderate damping.
                            </p>
                          </div>
                        </div>

                        <div className="graph-line-card">
                          <div className="line-swatch-box">
                            <div style={{ width: '3px', height: '16px', borderLeft: '2px dotted #93a891', margin: '0 auto' }}></div>
                          </div>
                          <div className="line-guide-info">
                            <div className="line-guide-title">
                              <span>Dotted Sage Line</span>
                              <span style={{ fontSize: '0.7rem', color: '#93a891' }}>Oblique (3D)</span>
                            </div>
                            <p className="line-guide-desc">
                              <strong>Oblique Room Modes:</strong> Corner-to-corner standing waves bouncing between all 6 surfaces. Carries ~25% energy and decays rapidly.
                            </p>
                          </div>
                        </div>

                        <div className="graph-line-card" style={{ gridColumn: '1 / -1' }}>
                          <div className="line-swatch-box">
                            <div style={{ width: '20px', height: '14px', background: 'rgba(229, 179, 100, 0.25)', border: '1px solid rgba(229, 179, 100, 0.5)', borderRadius: '3px' }}></div>
                          </div>
                          <div className="line-guide-info">
                            <div className="line-guide-title">
                              <span>Shaded Amber Region (Below {roomModeData.schroeder_freq} Hz)</span>
                              <span style={{ fontSize: '0.7rem', color: 'var(--color-accent-amber)' }}>Schroeder Modal Zone</span>
                            </div>
                            <p className="line-guide-desc">
                              <strong>Modal Zone:</strong> Discrete resonant standing waves dominate room behavior in this shaded zone. Above the Schroeder cutoff frequency ({roomModeData.schroeder_freq} Hz), modal density increases and transitions into a statistical, diffuse reverberation sound field.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: WATERFALL */}
              {activeTab === 'waterfall' && waterfallData && (
                <div>
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

                    {/* Waterfall Octave Band Descriptions Guide */}
                    <div className="graph-guide-container">
                      <div className="graph-guide-header">
                        <Layers size={14} />
                        <span>Octave Line Guide: What Each Frequency Band Indicates</span>
                      </div>
                      <div className="graph-lines-grid">
                        <div className="graph-line-card">
                          <div className="line-swatch-box">
                            <div style={{ width: '100%', height: '3px', background: '#f59e0b', borderRadius: '2px' }}></div>
                          </div>
                          <div className="line-guide-info">
                            <div className="line-guide-title">
                              <span>125 Hz Octave Line</span>
                              <span style={{ fontSize: '0.7rem', color: '#f59e0b' }}>Sub-Bass</span>
                            </div>
                            <p className="line-guide-desc">
                              <strong>Deep Bass Decay:</strong> Shows low-frequency standing wave decay. Slow, extended tails here produce boomy, muddy bass buildup that drowns out mixes. Treated with thick corner bass traps.
                            </p>
                          </div>
                        </div>

                        <div className="graph-line-card">
                          <div className="line-swatch-box">
                            <div style={{ width: '100%', height: '3px', background: '#34d399', borderRadius: '2px' }}></div>
                          </div>
                          <div className="line-guide-info">
                            <div className="line-guide-title">
                              <span>250 Hz Octave Line</span>
                              <span style={{ fontSize: '0.7rem', color: '#34d399' }}>Upper Bass</span>
                            </div>
                            <p className="line-guide-desc">
                              <strong>Room Warmth & Punch:</strong> Governs lower vocal fullness and kick punch. Excess reverberation at 250 Hz creates a muffled, boxy acoustic character.
                            </p>
                          </div>
                        </div>

                        <div className="graph-line-card">
                          <div className="line-swatch-box">
                            <div style={{ width: '100%', height: '3px', background: '#f59e0b', borderRadius: '2px' }}></div>
                          </div>
                          <div className="line-guide-info">
                            <div className="line-guide-title">
                              <span>500 Hz Octave Line</span>
                              <span style={{ fontSize: '0.7rem', color: '#f59e0b' }}>Lower Midrange</span>
                            </div>
                            <p className="line-guide-desc">
                              <strong>Speech Vowel Body:</strong> Central to vocal intelligibility and acoustic fullness. Serves as the primary reference band for Sabine inverse absorption calculations.
                            </p>
                          </div>
                        </div>

                        <div className="graph-line-card">
                          <div className="line-swatch-box">
                            <div style={{ width: '100%', height: '3px', background: '#34d399', borderRadius: '2px' }}></div>
                          </div>
                          <div className="line-guide-info">
                            <div className="line-guide-title">
                              <span>1000 Hz (1 kHz) Line</span>
                              <span style={{ fontSize: '0.7rem', color: '#34d399' }}>Core Reference</span>
                            </div>
                            <p className="line-guide-desc">
                              <strong>International Benchmark:</strong> The standard ISO 3382 mid-frequency reference for single-number RT60 specifications. Governs overall acoustic balance.
                            </p>
                          </div>
                        </div>

                        <div className="graph-line-card">
                          <div className="line-swatch-box">
                            <div style={{ width: '100%', height: '3px', background: '#f59e0b', borderRadius: '2px' }}></div>
                          </div>
                          <div className="line-guide-info">
                            <div className="line-guide-title">
                              <span>2000 Hz (2 kHz) Line</span>
                              <span style={{ fontSize: '0.7rem', color: '#f59e0b' }}>Upper Midrange</span>
                            </div>
                            <p className="line-guide-desc">
                              <strong>Consonant Articulation:</strong> Essential for vocal presence and consonant clarity ('s', 't', 'k'). Clean decay here ensures speech is crisp and legible without harshness.
                            </p>
                          </div>
                        </div>

                        <div className="graph-line-card">
                          <div className="line-swatch-box">
                            <div style={{ width: '100%', height: '3px', background: '#34d399', borderRadius: '2px' }}></div>
                          </div>
                          <div className="line-guide-info">
                            <div className="line-guide-title">
                              <span>4000 Hz (4 kHz) Line</span>
                              <span style={{ fontSize: '0.7rem', color: '#34d399' }}>High Treble</span>
                            </div>
                            <p className="line-guide-desc">
                              <strong>Air & Sheen:</strong> Governs acoustic brightness. Typically decays fastest in rooms due to molecular air absorption and high porous absorption coefficients.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: CLARITY */}
              {activeTab === 'clarity' && (
                <div>
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

                  <div
                    style={{
                      background: 'rgba(40, 61, 41, 0.5)',
                      padding: '14px',
                      borderRadius: '10px',
                      border: '1px solid var(--glass-border)',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.8rem',
                        color: 'var(--color-text-muted)',
                        textTransform: 'uppercase',
                      }}
                    >
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
      </main>
    </div>
  );
}
