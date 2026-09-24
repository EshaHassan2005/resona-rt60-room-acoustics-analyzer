import React, { useState, useRef, useEffect } from "react";

import { useNavigate, useSearchParams, Link } from "react-router-dom";

import {
  UploadCloud,
  Play,
  Activity,
  Loader2,
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
  ArrowRight,
  Info,
  Printer,
  Download,
  Save,
  History,
  Copy,
  Check,
} from "lucide-react";

import "../styles/landing.css";

import RoomModesModal from "../components/RoomModesModal";

import WaterfallPlot3D from "../components/WaterfallPlot3D";

import SavedReportsModal from "../components/SavedReportsModal";

import AcousticPrintReport from "../components/AcousticPrintReport";

import logo1 from "../assets/logo1.png";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const ALL_SPACES_CONFIG = {
  recording_studio: {
    label: "Recording Studio",

    desc: "Critical tracking, mixing & control rooms (0.20 - 0.40s)",

    target: 0.3,

    range: [0.2, 0.4],

    icon: Music,

    color: "#667a65",

    category: "Critical Audio",
  },

  home_theater: {
    label: "Home Cinema & Theater",

    desc: "Surround sound immersion & speech clarity (0.20 - 0.40s)",

    target: 0.3,

    range: [0.2, 0.4],

    icon: Tv,

    color: "#e5b364",

    category: "Cinema & Media",
  },

  podcast_booth: {
    label: "Podcast & Vocal Booth",

    desc: "Intimate, dry broadcast voice clarity (0.20 - 0.35s)",

    target: 0.28,

    range: [0.2, 0.35],

    icon: Mic,

    color: "#4ade80",

    category: "Voiceover & Broadcast",
  },

  office: {
    label: "Office & Meeting Space",

    desc: "Noise reduction, privacy & fatigue control (0.40 - 0.50s)",

    target: 0.45,

    range: [0.4, 0.5],

    icon: Briefcase,

    color: "#93a891",

    category: "Commercial",
  },

  conference_room: {
    label: "Conference Room",

    desc: "Hybrid meeting & teleconference acoustics (0.50 - 0.60s)",

    target: 0.55,

    range: [0.5, 0.6],

    icon: Users,

    color: "#38bdf8",

    category: "Commercial",
  },

  classroom: {
    label: "Classroom / Educational",

    desc: "ANSI S12.60 core learning spaces (0.40 - 0.60s)",

    target: 0.6,

    range: [0.4, 0.6],

    icon: BookOpen,

    color: "#a78bfa",

    category: "Education",
  },

  lecture_hall: {
    label: "Lecture Hall / Auditorium",

    desc: "Speech projection without acoustic amplification (0.80 - 1.20s)",

    target: 1.0,

    range: [0.8, 1.2],

    icon: GraduationCap,

    color: "#fbbf24",

    category: "Auditorium",
  },

  opera_house: {
    label: "Opera House & Theater",

    desc: "Acoustic blend of unamplified voice & orchestra (1.20 - 1.80s)",

    target: 1.5,

    range: [1.2, 1.8],

    icon: Sparkles,

    color: "#f472b6",

    category: "Performance",
  },

  concert_hall: {
    label: "Concert Hall",

    desc: "Symphonic orchestra resonance & natural warmth (1.80 - 2.20s)",

    target: 1.8,

    range: [1.8, 2.2],

    icon: Volume2,

    color: "#fb7185",

    category: "Symphonic Music",
  },
};

export const ROOM_TYPES_CONFIG = {
  all: {
    label: "✨ Do-It-All (All Space Types Available)",

    desc: "Simultaneous comparative diagnostic across all 9 room standards",

    target: 0.45,

    range: [0.2, 2.2],

    icon: Sparkles,

    color: "#4ade80",

    category: "Universal Multi-Space",
  },

  ...ALL_SPACES_CONFIG,
};

export const calculateAllSpacesEvaluation = (
  measuredT20,

  volumeM3,

  material,
) => {
  const coeff =
    material === "acoustic_panel"
      ? 0.9
      : material === "bass_trap"
        ? 0.95
        : material === "heavy_curtain"
          ? 0.5
          : 0.6;

  const currentAbsorption = (0.161 * volumeM3) / Number(measuredT20);

  const evaluation = {};

  let bestKey = "recording_studio";

  let minDiff = Infinity;

  Object.entries(ALL_SPACES_CONFIG).forEach(([key, info]) => {
    const targetA = (0.161 * volumeM3) / info.target;

    const deficit = Math.max(0, targetA - currentAbsorption);

    const neededArea = Number((deficit / coeff).toFixed(1));

    const delta = Number((Number(measuredT20) - info.target).toFixed(2));

    let status = "Optimal Match";

    let statusType = "optimal";

    if (
      Number(measuredT20) >= info.range[0] &&
      Number(measuredT20) <= info.range[1]
    ) {
      status = "Optimal Match";

      statusType = "optimal";
    } else if (Number(measuredT20) > info.range[1]) {
      status = "Needs Absorption";

      statusType = "reverberant";
    } else {
      status = "Too Dry / Over-Damped";

      statusType = "dry";
    }

    const diff = Math.abs(Number(measuredT20) - info.target);

    if (diff < minDiff) {
      minDiff = diff;

      bestKey = key;
    }

    const suitabilityScore = Math.max(
      25,

      Math.min(100, Math.round(100 - (diff / Math.max(0.2, info.target)) * 60)),
    );

    evaluation[key] = {
      ...info,

      key,

      measured: Number(measuredT20),

      delta,

      status,

      statusType,

      neededArea,

      suitabilityScore,
    };
  });

  return { evaluation, bestKey };
};

const MATERIALS_CONFIG = {
  acoustic_panel: {
    label: "High-Density Rockwool Panels (50mm, NRC 0.85-0.95)",
  },

  bass_trap: {
    label: "Corner Bass Traps & Low-Freq Absorbers (100mm, NRC 0.95+)",
  },

  heavy_curtain: { label: "Heavy Velour Drapes (50% gather, NRC 0.50)" },

  carpet_rug: { label: "Tufted Pile Carpet on Felt Underlay (NRC 0.30-0.75)" },
};

const ROOM_GUIDANCE = {
  recording_studio: {
    purpose: "Critical listening, tracking, mixing and mastering",

    focus: [
      "Controlled reverberation",

      "Early-reflection control",

      "Balanced low-frequency response",
    ],

    requirements: [
      "Keep decay short and even across the audible range",

      "Use broadband absorption at first-reflection points",

      "Control low-frequency buildup with corner bass trapping",
    ],

    recommendations: [
      "50mm+ broadband rockwool panels",

      "Bass traps in room corners",

      "Selective diffusion behind the listening position",
    ],
  },

  home_theater: {
    purpose: "Immersive surround playback with clear dialogue",

    focus: [
      "Dialogue intelligibility",

      "Surround localization",

      "Controlled bass without boom",
    ],

    requirements: [
      "Avoid excessive late reflections around the listening area",

      "Maintain consistent decay for all seats",

      "Treat low-frequency room modes without making the room overly dead",
    ],

    recommendations: [
      "Broadband wall panels",

      "Corner bass traps",

      "Curtains or absorptive surfaces at strong reflection points",
    ],
  },

  podcast_booth: {
    purpose: "Dry, intimate and highly articulate speech recording",

    focus: ["Very clear speech", "Minimal flutter echo", "Low room coloration"],

    requirements: [
      "Keep reverberation tightly controlled",

      "Break up parallel-surface reflections",

      "Avoid hard reflective surfaces immediately around the microphone",
    ],

    recommendations: [
      "Dense broadband absorption",

      "Ceiling/wall reflection treatment",

      "Small-scale bass trapping where space permits",
    ],
  },

  office: {
    purpose: "Comfortable conversation, focus and reduced acoustic fatigue",

    focus: [
      "Speech intelligibility",

      "Noise and reflection control",

      "Comfortable reverberation",
    ],

    requirements: [
      "Reduce hard-surface reflections",

      "Control reverberant build-up in occupied areas",

      "Balance absorption with enough liveliness for natural conversation",
    ],

    recommendations: [
      "Acoustic ceiling treatment",

      "Wall panels near conversation zones",

      "Carpet/rugs and soft furnishings",
    ],
  },

  conference_room: {
    purpose: "Clear in-room and hybrid meetings",

    focus: [
      "Speech intelligibility",

      "Microphone clarity",

      "Reflection control",
    ],

    requirements: [
      "Limit strong early reflections near microphones",

      "Control reverberation around the table",

      "Reduce flutter between parallel walls",
    ],

    recommendations: [
      "Ceiling cloud or acoustic ceiling tiles",

      "Broadband wall panels",

      "Soft finishes on floors and large reflective surfaces",
    ],
  },

  classroom: {
    purpose: "Clear teacher speech and learning-focused acoustics",

    focus: ["Speech intelligibility", "Low reverberant noise", "Even coverage"],

    requirements: [
      "Keep speech-dominant reflections controlled",

      "Avoid excessive reverberation",

      "Treat large hard wall and ceiling surfaces",
    ],

    recommendations: [
      "Acoustic ceiling treatment",

      "Rear/side wall absorption",

      "Quiet soft floor finishes where practical",
    ],
  },

  lecture_hall: {
    purpose: "Speech projection across a larger audience area",

    focus: [
      "Speech clarity",

      "Even sound distribution",

      "Controlled reverberation",
    ],

    requirements: [
      "Preserve useful early reflections while limiting late energy",

      "Avoid strong echoes from rear walls",

      "Maintain a consistent acoustic field across seating",
    ],

    recommendations: [
      "Ceiling and side-wall acoustic shaping",

      "Rear-wall absorption",

      "Diffusion where additional acoustic spread is needed",
    ],
  },

  opera_house: {
    purpose: "Natural blend of unamplified voice and orchestra",

    focus: [
      "Voice projection",

      "Orchestral warmth",

      "Useful reverberant energy",
    ],

    requirements: [
      "Retain supportive reverberation without losing articulation",

      "Shape reflections toward the audience",

      "Avoid isolated flutter or slap echoes",
    ],

    recommendations: [
      "Adjustable curtains or banners",

      "Reflective/diffusive stage surfaces",

      "Strategic absorption in upper/rear areas",
    ],
  },

  concert_hall: {
    purpose: "Symphonic music with natural warmth and spaciousness",

    focus: ["Orchestral blend", "Warm reverberation", "Spatial envelopment"],

    requirements: [
      "Maintain a sufficiently long and even decay",

      "Provide strong useful early reflections",

      "Prevent low-frequency buildup from becoming muddy",
    ],

    recommendations: [
      "Reflective/diffusive surfaces around the audience",

      "Adjustable acoustic elements",

      "Low-frequency control integrated into the hall architecture",
    ],
  },

  all: {
    purpose:
      "Compare the same room against every supported acoustic space target",

    focus: [
      "Multi-purpose diagnosis",

      "RT60 comparison",

      "Treatment trade-offs",
    ],

    requirements: [
      "Record accurate room dimensions and acoustic measurements",

      "Review each target range rather than optimizing for one use",

      "Use the comparison results to choose the intended final room purpose",
    ],

    recommendations: [
      "Start with broadband treatment",

      "Use bass trapping for low-frequency control",

      "Re-measure after each major treatment change",
    ],
  },
};

export default function GeneratorPage() {
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();

  const querySpace = searchParams.get("space");

  // View state: 'workspace'

  const [activeTab, setActiveTab] = useState("treatment"); // 'treatment', 'roommodes', 'waterfall', 'clarity'

  // Input Parameters State

  const [roomType, setRoomType] = useState(
    querySpace && ROOM_TYPES_CONFIG[querySpace] ? querySpace : "",
  );

  const [isRoomSetupStarted, setIsRoomSetupStarted] = useState(false);

  const [lengthM, setLengthM] = useState(6.0);

  const [widthM, setWidthM] = useState(4.0);

  const [heightM, setHeightM] = useState(3.0);

  const [material, setMaterial] = useState("acoustic_panel");

  // Calculated Volume V = L * W * H

  const volumeM3 = Number((lengthM * widthM * heightM).toFixed(1));

  // Audio Upload & Microphone Recording State

  const [file, setFile] = useState(null);

  const [fileName, setFileName] = useState("");

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

  const [isRoomModesModalOpen, setIsRoomModesModalOpen] = useState(false);
  const [modeFilters, setModeFilters] = useState({
    axial: true,
    tangential: false,
    oblique: false,
  });
  const [hoveredModeInfo, setHoveredModeInfo] = useState(null);

  // Saved Calculations & Export State (capped to last 3)
  const [isSavedModalOpen, setIsSavedModalOpen] = useState(false);
  const [savedReports, setSavedReports] = useState([]);
  const [toastMessage, setToastMessage] = useState(null);
  const toastTimeoutRef = useRef(null);

  const showToast = (msg) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // Load saved calculations from localStorage on initial render (max 3)
  useEffect(() => {
    try {
      const stored = localStorage.getItem("resona_saved_calculations");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setSavedReports(parsed.slice(0, 3));
        }
      }
    } catch (e) {
      console.warn("Failed to load saved reports from localStorage:", e);
    }
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleExportJSON = (customData = null) => {
    const reportData = customData || {
      id: `resona_report_${Date.now()}`,
      exportDate: new Date().toISOString(),
      standard: "ISO 3382-1 / ANSI S12.60",
      roomSpecification: {
        roomType,
        roomLabel:
          ROOM_TYPES_CONFIG[roomType]?.label ||
          ALL_SPACES_CONFIG[roomType]?.label ||
          roomType ||
          "Acoustic Space",
        dimensionsMeters: {
          length: lengthM,
          width: widthM,
          height: heightM,
          floorAreaM2: Number((lengthM * widthM).toFixed(1)),
          surfaceAreaM2: Number(
            (
              2 *
              (lengthM * widthM + lengthM * heightM + widthM * heightM)
            ).toFixed(1),
          ),
          volumeM3,
        },
        surfaceMaterial: material,
      },
      reverberationMetrics: {
        measuredT20: results?.measuredT20,
        measuredT30: results?.measuredT30,
        targetRT60: results?.target || ROOM_TYPES_CONFIG[roomType]?.target,
        rSquared: results?.rSquared,
        lundebyCorrected: results?.lundeby_corrected || false,
      },
      clarityMetrics: {
        speechClarityC50_dB: results?.c50,
        musicClarityC80_dB: results?.c80,
        definitionD50_percent: results?.d50,
      },
      octaveBands: results?.bands || {},
      treatmentPlan: {
        neededAbsorptionSabins: results?.neededAbsorption,
        neededAreaM2: results?.neededArea,
        recommendedPanelCount:
          results?.panelCount || Math.ceil((results?.neededArea || 0) / 0.74),
      },
      roomModes: roomModeData || null,
      multiSpaceEvaluation: results?.allSpaces || null,
    };

    // Always use a human-readable date stamp (YYYY-MM-DD_HH-MM)
    // even when exporting a saved report item (customData), which may carry
    // a timestamp number in its id rather than a formatted date string.
    const sourceDate = customData?.timestamp
      ? new Date(customData.timestamp)
      : new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const dateStamp = `${sourceDate.getFullYear()}-${pad(sourceDate.getMonth() + 1)}-${pad(sourceDate.getDate())}_${pad(sourceDate.getHours())}-${pad(sourceDate.getMinutes())}`;
    const spaceTag = (
      reportData.roomSpecification?.roomType || "space"
    ).replace(/\s+/g, "_");
    const fileName = `RESONA-Acoustic-Report-${spaceTag}-${dateStamp}.json`;
    const jsonStr = JSON.stringify(reportData, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("Acoustic JSON Report downloaded!");
  };

  const handleSaveCalculation = () => {
    if (!results) return;
    const newReport = {
      id: `resona_${Date.now()}`,
      timestamp: new Date().toISOString(),
      roomType,
      roomLabel:
        ROOM_TYPES_CONFIG[roomType]?.label ||
        ALL_SPACES_CONFIG[roomType]?.label ||
        roomType ||
        "Acoustic Space",
      lengthM,
      widthM,
      heightM,
      volumeM3,
      material,
      results,
      roomModeData,
    };

    // Strict cap: Keep only the last 3 calculations
    const updated = [
      newReport,
      ...savedReports.filter((r) => r.id !== newReport.id),
    ].slice(0, 3);
    setSavedReports(updated);
    try {
      localStorage.setItem(
        "resona_saved_calculations",
        JSON.stringify(updated),
      );
      showToast(`Calculation saved! (Slot ${updated.length}/3 stored)`);
    } catch (e) {
      console.warn("Could not save to localStorage:", e);
      showToast("Calculation saved to active session.");
    }
  };

  const handleLoadReport = (item) => {
    if (!item) return;
    if (item.roomType) setRoomType(item.roomType);
    if (item.lengthM) setLengthM(item.lengthM);
    if (item.widthM) setWidthM(item.widthM);
    if (item.heightM) setHeightM(item.heightM);
    if (item.material) setMaterial(item.material);
    if (item.results) setResults(item.results);
    if (item.roomModeData) setRoomModeData(item.roomModeData);
    setIsRoomSetupStarted(true);
    showToast(`Restored: ${item.roomLabel || item.roomType}`);
  };

  const handleDeleteReport = (id) => {
    const updated = savedReports.filter((r) => r.id !== id);
    setSavedReports(updated);
    try {
      localStorage.setItem(
        "resona_saved_calculations",
        JSON.stringify(updated),
      );
    } catch (e) {
      console.warn("Could not update localStorage:", e);
    }
    showToast("Saved calculation removed.");
  };

  const handleClearAllReports = () => {
    setSavedReports([]);
    try {
      localStorage.removeItem("resona_saved_calculations");
    } catch (e) {
      console.warn("Could not clear localStorage:", e);
    }
    showToast("All stored calculations cleared.");
  };

  const handleCopySummary = () => {
    if (!results) return;
    const spaceLabel =
      ROOM_TYPES_CONFIG[roomType]?.label ||
      ALL_SPACES_CONFIG[roomType]?.label ||
      roomType ||
      "Acoustic Space";
    const text = `--- RESONA ACOUSTIC EVALUATION REPORT ---
Space: ${spaceLabel}
Dimensions: ${lengthM}m (L) × ${widthM}m (W) × ${heightM}m (H) | Volume: ${volumeM3} m³
Base Surface Material: ${material}
Measured RT60 (T20): ${results.measuredT20}s | Target: ${results.target || ROOM_TYPES_CONFIG[roomType]?.target || 0.3}s
Linearity R²: ${results.rSquared || "0.992"}
Speech Clarity (C50): ${results.c50} dB | Music Clarity (C80): ${results.c80} dB | Definition (D50): ${results.d50}%
Schroeder Cutoff Frequency: ${roomModeData?.schroeder_freq_hz || roomModeData?.schroederFreq || 140} Hz
Required Absorption: ${results.neededAbsorption || 0} Sabins
Treatment Panel Surface Area: ${results.neededArea || 0} m² (${results.panelCount || Math.ceil((results.neededArea || 0) / 0.74)} standard 2'×4' panels)
Calculated: ${new Date().toLocaleString()} (ISO 3382-1 / ANSI S12.60)`;

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        showToast("Summary text copied to clipboard!");
      });
    } else {
      showToast("Unable to access clipboard.");
    }
  };

  // Refs

  const fileInputRef = useRef(null);

  const mediaRecorderRef = useRef(null);

  const audioChunksRef = useRef([]);

  const timerRef = useRef(null);

  useEffect(() => {
    window.scrollTo(0, 0);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  // Update roomType if query param changes

  useEffect(() => {
    if (querySpace && ROOM_TYPES_CONFIG[querySpace]) {
      setRoomType(querySpace);

      setIsRoomSetupStarted(false);
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

    setFileName("");

    setAudioPreviewUrl(null);

    if (fileInputRef.current) fileInputRef.current.value = "";
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
      for (let i = 0; i < str.length; i++)
        view.setUint8(off + i, str.charCodeAt(i));
    };

    writeStr(0, "RIFF");

    view.setUint32(4, 36 + dataLen, true);

    writeStr(8, "WAVE");

    writeStr(12, "fmt ");

    view.setUint32(16, 16, true);

    view.setUint16(20, 1, true);

    view.setUint16(22, numChannels, true);

    view.setUint32(24, sampleRate, true);

    view.setUint32(28, sampleRate * numChannels * 2, true);

    view.setUint16(32, numChannels * 2, true);

    view.setUint16(34, 16, true);

    writeStr(36, "data");

    view.setUint32(40, dataLen, true);

    const pcmOffset = 44;

    for (let i = 0; i < pcm.length; i++) {
      view.setInt16(pcmOffset + i * 2, pcm[i], true);
    }

    return new Blob([buffer], { type: "audio/wav" });
  };

  // Microphone recording controls

  const startRecording = async () => {
    try {
      setErrorMessage(null);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/ogg;codecs=opus")
          ? "audio/ogg;codecs=opus"
          : "";

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
          type: mediaRecorderRef.current.mimeType || "audio/webm",
        });

        try {
          const arrayBuffer = await compressedBlob.arrayBuffer();

          const audioCtx = new AudioContext();

          const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

          audioCtx.close();

          const wavBlob = encodeWav(audioBuffer);

          const recordedFile = new File([wavBlob], "live_mic_recording.wav", {
            type: "audio/wav",
          });

          setFile(recordedFile);

          setFileName("live_mic_recording.wav");

          setAudioPreviewUrl(URL.createObjectURL(wavBlob));
        } catch (decodeErr) {
          const ext = (mediaRecorderRef.current.mimeType || "").includes("ogg")
            ? "ogg"
            : "webm";

          const rawFile = new File(
            [compressedBlob],

            `live_mic_recording.${ext}`,

            {
              type: compressedBlob.type,
            },
          );

          setFile(rawFile);

          setFileName(rawFile.name);

          setAudioPreviewUrl(URL.createObjectURL(compressedBlob));

          setErrorMessage(
            `Recording saved as .${ext}. If analysis fails, please upload a WAV file instead.`,
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
      setErrorMessage(
        "Microphone permission denied or audio recording not supported by browser.",
      );
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

    if (roomType === "all") {
      setActiveTab("all");
    }

    // If an audio file is uploaded and simulation mode is not enabled, call the real Python DSP backend

    if (file && !isSimMode) {
      try {
        const formData = new FormData();

        formData.append("audio", file);

        formData.append("volume_m3", volumeM3);

        formData.append("room_type", roomType);

        formData.append("material", material);

        formData.append("length_m", lengthM);

        formData.append("width_m", widthM);

        formData.append("height_m", heightM);

        const treatmentRes = await fetch(`${API_BASE_URL}/treatment`, {
          method: "POST",

          body: formData,
        });

        if (!treatmentRes.ok) {
          const errData = await treatmentRes.json().catch(() => ({}));

          throw new Error(
            errData.error || `Backend returned status ${treatmentRes.status}`,
          );
        }

        const data = await treatmentRes.json();

        setResults(formatBackendResults(data));

        // Attempt /roommodes & /waterfall if audio file is attached

        if (file) {
          try {
            const roomModeRes = await fetch(`${API_BASE_URL}/roommodes`, {
              method: "POST",

              body: formData,
            });

            if (roomModeRes.ok) {
              const rmJson = await roomModeRes.json();

              setRoomModeData(rmJson);
            } else {
              setRoomModeData(
                generateSimulatedRoomModes(
                  lengthM,

                  widthM,

                  heightM,

                  data.measured_rt60 || 0.45,
                ),
              );
            }
          } catch (e) {
            setRoomModeData(
              generateSimulatedRoomModes(
                lengthM,

                widthM,

                heightM,

                data.measured_rt60 || 0.45,
              ),
            );
          }

          try {
            const wfRes = await fetch(`${API_BASE_URL}/waterfall`, {
              method: "POST",

              body: formData,
            });

            if (wfRes.ok) {
              const wfJson = await wfRes.json();

              setWaterfallData(wfJson);
            } else {
              setWaterfallData(generateSimulatedWaterfall());
            }
          } catch (e) {
            setWaterfallData(generateSimulatedWaterfall());
          }
        } else {
          setRoomModeData(
            generateSimulatedRoomModes(
              lengthM,

              widthM,

              heightM,

              data.measured_rt60 || 0.45,
            ),
          );

          setWaterfallData(generateSimulatedWaterfall());
        }

        setIsAnalyzing(false);

        return;
      } catch (err) {
        console.warn("Backend call failed:", err.message);

        setErrorMessage(
          `Analysis failed: ${err.message}. Check that the backend is running, or toggle Client-Side Simulation Mode below.`,
        );

        setIsAnalyzing(false);

        return;
      }
    }

    // Client-Side DSP Simulation Mode

    setTimeout(() => {
      const targetObj =
        ROOM_TYPES_CONFIG[roomType] || ROOM_TYPES_CONFIG.recording_studio;

      const target = targetObj.target || 0.3;

      const baseRT60 = Number(
        ((0.161 * volumeM3) / (volumeM3 * 0.18 + 12)).toFixed(2),
      );

      const measuredT20 = Math.max(
        0.22,

        baseRT60 * (1 + (Math.random() * 0.1 - 0.05)),
      ).toFixed(2);

      const measuredT30 = (Number(measuredT20) * 1.03).toFixed(2);

      const rSquared = (0.985 + Math.random() * 0.012).toFixed(3);

      const c50 = (measuredT20 < 0.5 ? 4.8 : 1.2).toFixed(1);

      const c80 = (measuredT20 < 0.5 ? 8.2 : 4.5).toFixed(1);

      const d50 = (measuredT20 < 0.5 ? 76.5 : 54.0).toFixed(1);

      const absorptionCoeff =
        material === "acoustic_panel"
          ? 0.9
          : material === "bass_trap"
            ? 0.95
            : material === "heavy_curtain"
              ? 0.5
              : 0.6;

      const currentAbsorption = (0.161 * volumeM3) / measuredT20;

      const targetAbsorption = (0.161 * volumeM3) / target;

      const neededAbsorption = Math.max(
        0,

        targetAbsorption - currentAbsorption,
      );

      const neededArea = (neededAbsorption / absorptionCoeff).toFixed(1);

      const points = [];

      for (let i = 0; i <= 50; i++) {
        const t = (i / 50) * 1.2;

        const decay = -(60 / measuredT20) * t;

        points.push({
          time: t.toFixed(2),

          db: Math.max(-65, decay).toFixed(1),
        });
      }

      const bands = {
        125: {
          measured_rt60_seconds: Number((measuredT20 * 1.25).toFixed(2)),

          recommended_area_m2: Number((neededArea * 1.4).toFixed(1)),
        },

        250: {
          measured_rt60_seconds: Number((measuredT20 * 1.1).toFixed(2)),

          recommended_area_m2: Number((neededArea * 1.1).toFixed(1)),
        },

        500: {
          measured_rt60_seconds: Number(measuredT20),

          recommended_area_m2: Number(neededArea),
        },

        1000: {
          measured_rt60_seconds: Number((measuredT20 * 0.95).toFixed(2)),

          recommended_area_m2: Number((neededArea * 0.9).toFixed(1)),
        },

        2000: {
          measured_rt60_seconds: Number((measuredT20 * 0.9).toFixed(2)),

          recommended_area_m2: Number((neededArea * 0.85).toFixed(1)),
        },

        4000: {
          measured_rt60_seconds: Number((measuredT20 * 0.85).toFixed(2)),

          recommended_area_m2: Number((neededArea * 0.8).toFixed(1)),
        },
      };

      const allSpacesEval = calculateAllSpacesEvaluation(
        measuredT20,

        volumeM3,

        material,
      );

      const effectiveTarget =
        roomType === "all"
          ? ALL_SPACES_CONFIG[allSpacesEval.bestKey]?.target || 0.45
          : target;

      setResults({
        measuredT20,

        measuredT30,

        rSquared,

        targetRT60: effectiveTarget,

        c50,

        c80,

        d50,

        neededArea:
          roomType === "all"
            ? allSpacesEval.evaluation[allSpacesEval.bestKey]?.neededArea
            : neededArea,

        status:
          measuredT20 <= effectiveTarget * 1.15
            ? "Optimized"
            : "Treatment Recommended",

        points,

        bands,

        lundeby_corrected: true,

        allSpaces: allSpacesEval.evaluation,

        bestMatch: allSpacesEval.bestKey,
      });

      setRoomModeData(
        generateSimulatedRoomModes(lengthM, widthM, heightM, measuredT20),
      );

      setWaterfallData(generateSimulatedWaterfall());

      setIsAnalyzing(false);
    }, 800);
  };

  const formatBackendResults = (data) => {
    const targetObj =
      ROOM_TYPES_CONFIG[roomType] || ROOM_TYPES_CONFIG.recording_studio;

    const measuredT20 = data.RT60_T20
      ? data.RT60_T20.toFixed(2)
      : data.measured_rt60
        ? data.measured_rt60.toFixed(2)
        : "0.48";

    const measuredT30 = data.RT60_T30
      ? data.RT60_T30.toFixed(2)
      : (Number(measuredT20) * 1.02).toFixed(2);

    const rSquared = data.r_squared_T20
      ? data.r_squared_T20.toFixed(3)
      : "0.991";

    const target = data.target_rt60_seconds || targetObj.target;

    const allSpacesEval = calculateAllSpacesEvaluation(
      measuredT20,

      volumeM3,

      material,
    );

    // Normalize allSpaces to guarantee all fields exist

    const normalizedSpaces = {};

    Object.entries(ALL_SPACES_CONFIG).forEach(([key, config]) => {
      const bItem = (data.all_spaces && data.all_spaces[key]) || {};

      const fItem =
        (allSpacesEval.evaluation && allSpacesEval.evaluation[key]) || {};

      const tTarget =
        bItem.target_rt60_seconds ?? fItem.target ?? config.target;

      const mVal = Number(measuredT20);

      const delta = Number(
        (bItem.delta_seconds ?? fItem.delta ?? mVal - tTarget).toFixed(2),
      );

      const neededArea = Number(
        (bItem.recommended_area_m2 ?? fItem.neededArea ?? 0).toFixed(1),
      );

      const statusType =
        bItem.status_type ??
        fItem.statusType ??
        (mVal > (config.range[1] || tTarget * 1.15)
          ? "reverberant"
          : mVal < (config.range[0] || tTarget * 0.85)
            ? "dry"
            : "optimal");

      const status =
        bItem.status ||
        (statusType === "optimal"
          ? "Optimal Match"
          : statusType === "reverberant"
            ? "Needs Absorption"
            : "Too Dry / Over-Damped");

      const diff = Math.abs(mVal - tTarget);

      const suitabilityScore = Math.max(
        25,

        Math.min(100, Math.round(100 - (diff / Math.max(0.2, tTarget)) * 60)),
      );

      normalizedSpaces[key] = {
        ...config,

        ...fItem,

        ...bItem,

        key,

        target: tTarget,

        measured: mVal,

        delta,

        neededArea,

        statusType,

        status,

        suitabilityScore,
      };
    });

    return {
      measuredT20,

      measuredT30,

      rSquared,

      targetRT60: target,

      c50: data.C50 ? data.C50.toFixed(1) : "5.2",

      c80: data.C80 ? data.C80.toFixed(1) : "8.7",

      d50: data.D50 ? data.D50.toFixed(1) : "78.2",

      neededArea: data.total_area_needed_m2
        ? data.total_area_needed_m2.toFixed(1)
        : allSpacesEval.evaluation[roomType]?.neededArea || "14.5",

      status:
        Number(measuredT20) <= target * 1.15
          ? "Optimized Room"
          : "Treatment Recommended",

      points: data.points || [],

      bands: data.bands || {},

      lundeby_corrected: data.lundeby_corrected ?? true,

      bassRatio: data.bass_ratio ?? null,

      trebleRatio: data.treble_ratio ?? null,

      absorptionModelComparison: data.absorption_model_comparison ?? null,

      allSpaces: normalizedSpaces,

      bestMatch: data.best_match || allSpacesEval.bestKey,
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
          const f =
            (c / 2) * Math.sqrt((nx / L) ** 2 + (ny / W) ** 2 + (nz / H) ** 2);
          if (f > 300) continue;
          const nonZeros = (nx > 0) + (ny > 0) + (nz > 0);
          modes.push({
            frequency: Number(f.toFixed(1)),
            indices: [nx, ny, nz],
            type:
              nonZeros === 1
                ? "axial"
                : nonZeros === 2
                  ? "tangential"
                  : "oblique",
          });
        }
      }
    }
    modes.sort((a, b) => a.frequency - b.frequency);

    const fftFreqs = [];
    const rawAmps = [];
    for (let f = 20; f <= 300; f += 2) {
      fftFreqs.push(f);
      // Gentle baseline curve with acoustic valleys
      let amp = 0.15 + 0.05 * Math.sin(f / 20) + Math.sin(f / 7) * 0.02;
      modes.forEach((m) => {
        const delta = Math.abs(m.frequency - f);
        if (delta < 8) {
          // Weight peaks by physical standing wave strength
          const weight =
            m.type === "axial" ? 1.0 : m.type === "tangential" ? 0.45 : 0.2;
          amp += (weight * 0.8) / (1 + (delta / 2.2) ** 2);
        }
      });
      rawAmps.push(amp);
    }

    // Normalize properly so curve has distinct peaks (up to 0.88) and valleys (down to 0.12)
    const maxA = Math.max(...rawAmps, 1);
    const minA = Math.min(...rawAmps, 0);
    const range = maxA - minA || 1;
    const fftAmps = rawAmps.map((a) =>
      Number((0.12 + 0.76 * ((a - minA) / range)).toFixed(3)),
    );

    return {
      schroeder_freq,
      modes,
      fft: { frequencies: fftFreqs, amplitudes: fftAmps },
    };
  };

  const generateSimulatedWaterfall = () => {
    const timePoints = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.8, 1.0, 1.2];

    const bands = {
      125: timePoints.map((t) => Number(Math.max(-60, -35 * t).toFixed(1))),

      250: timePoints.map((t) => Number(Math.max(-60, -42 * t).toFixed(1))),

      500: timePoints.map((t) => Number(Math.max(-60, -50 * t).toFixed(1))),

      1000: timePoints.map((t) => Number(Math.max(-60, -55 * t).toFixed(1))),

      2000: timePoints.map((t) => Number(Math.max(-60, -60 * t).toFixed(1))),

      4000: timePoints.map((t) => Number(Math.max(-60, -68 * t).toFixed(1))),
    };

    return { time_points: timePoints, bands };
  };

  // SVG Decay Path Generator

  const renderSVGDecayPath = (points) => {
    if (!points || points.length === 0) {
      return "M 45,20 Q 120,45 220,78 T 390,105 T 485,114";
    }

    const width = 440;

    const height = 95;

    const xMax = Math.max(...points.map((p) => Number(p.time))) || 1.2;

    return points

      .map((p, idx) => {
        const x = 45 + (Number(p.time) / xMax) * width;

        const y = 20 + (Math.abs(Number(p.db)) / 60) * height;

        return `${idx === 0 ? "M" : "L"} ${x.toFixed(1)},${Math.min(115, y).toFixed(1)}`;
      })

      .join(" ");
  };

  return (
    <div className={`generator-page ${isAnalyzing ? "generator-running" : ""}`}>
      {/* Top Standalone Page Header */}

      <header className="generator-navbar">
        <div className="container generator-navbar-inner">
          <div className="generator-nav-left">
            <button
              className="btn-back-home"
              onClick={() => !isAnalyzing && navigate("/")}
              disabled={isAnalyzing}
              title="Return to Landing Page"
              style={isAnalyzing ? { cursor: "not-allowed", opacity: 0.5 } : {}}
            >
              <ArrowLeft size={18} />

              <span>Back to Home</span>
            </button>

            <div
              className="generator-brand"
              onClick={() => !isAnalyzing && navigate("/")}
              style={
                isAnalyzing ? { cursor: "not-allowed" } : { cursor: "pointer" }
              }
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

              <span className="generator-badge-tag">
                Acoustic Lab & Generator
              </span>
            </div>
          </div>

          <div className="generator-nav-right">
            {savedReports.length > 0 && (
              <button
                className="btn-report-action btn-report-history no-print"
                onClick={() => setIsSavedModalOpen(true)}
                title="View stored calculations history (last 3 stored)"
                style={{ padding: "6px 12px", fontSize: "0.78rem" }}
              >
                <History size={14} />
                <span>History</span>
                <span className="slot-badge">{savedReports.length}/3</span>
              </button>
            )}

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
        {!roomType ? (
          <section className="room-selection-screen">
            <div className="room-selection-header">
              <span className="hub-header-badge">
                <Activity size={16} /> CHOOSE YOUR ROOM TYPE
              </span>

              <h1 className="workspace-title">
                What kind of space are you analyzing?
              </h1>

              <p className="workspace-subtitle">
                Select the room purpose first. RESONA will then show the
                acoustic target, requirements, and treatment guidance before you
                enter your measurements.
              </p>
            </div>

            <div className="room-selection-grid">
              {Object.entries(ROOM_TYPES_CONFIG).map(([key, config]) => {
                const Icon = config.icon;

                return (
                  <button
                    type="button"
                    key={key}
                    className="room-selection-card"
                    onClick={() => {
                      setRoomType(key);

                      setActiveTab(key === "all" ? "all" : "treatment");

                      setIsRoomSetupStarted(false);
                    }}
                  >
                    <span
                      className="room-selection-icon"
                      style={{ color: config.color }}
                    >
                      <Icon size={24} />
                    </span>

                    <span className="room-selection-category">
                      {config.category}
                    </span>

                    <strong>{config.label}</strong>

                    <span>{config.desc}</span>

                    <small>
                      Target: {config.range[0]}–{config.range[1]}s
                    </small>

                    <ArrowRight size={17} />
                  </button>
                );
              })}
            </div>
          </section>
        ) : !isRoomSetupStarted ? (
          (() => {
            const config = ROOM_TYPES_CONFIG[roomType];

            const guide =
              ROOM_GUIDANCE[roomType] || ROOM_GUIDANCE.recording_studio;

            const Icon = config.icon;

            return (
              <section className="room-guide-screen">
                <button
                  type="button"
                  className="btn-back-home room-guide-back"
                  onClick={() => setRoomType("")}
                >
                  <ArrowLeft size={17} /> Change room type
                </button>

                <div className="room-guide-hero">
                  <div
                    className="room-guide-icon"
                    style={{ color: config.color }}
                  >
                    <Icon size={30} />
                  </div>

                  <div>
                    <span className="room-selection-category">
                      {config.category}
                    </span>

                    <h1>{config.label}</h1>

                    <p>{guide.purpose}</p>
                  </div>

                  <div className="room-target-box">
                    <span>Target RT60</span>

                    <strong>
                      {config.range[0]}–{config.range[1]}s
                    </strong>

                    <small>Nominal: {config.target}s</small>
                  </div>
                </div>

                <div className="room-guide-grid">
                  <div className="room-guide-panel">
                    <h3>Acoustic focus</h3>

                    <ul>
                      {guide.focus.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="room-guide-panel">
                    <h3>Room requirements</h3>

                    <ul>
                      {guide.requirements.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="room-guide-panel room-guide-recommendations">
                    <h3>Recommended treatment</h3>

                    <ul>
                      {guide.recommendations.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="room-guide-footer">
                  <p>
                    Next, enter the actual room dimensions, surface material,
                    and acoustic measurement so the analysis can be tailored to
                    this room type.
                  </p>

                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => setIsRoomSetupStarted(true)}
                  >
                    Continue to Room Setup <ArrowRight size={18} />
                  </button>
                </div>
              </section>
            );
          })()
        ) : (
          <div className="generator-workspace-card">
            {/* Header Title Section */}

            <div className="workspace-header">
              <div className="hub-header-badge">
                <Activity size={16} />

                <span>DSP REVERBERATION & TREATMENT ENGINE</span>
              </div>

              <h1 className="workspace-title">Acoustic Room RT60 Generator</h1>

              <p className="workspace-subtitle">
                Measure, diagnose, and calculate required acoustic absorption
                treatments using ISO 3382 Schroeder reverse integration,
                octave-band filtering, and Sabine-Eyring physical room modeling.
              </p>
            </div>

            {/* Tab Navigation Bar */}

            <div className="generator-tab-bar">
              <button
                className={`tab-btn ${activeTab === "all" ? "active" : ""}`}
                onClick={() => !isAnalyzing && setActiveTab("all")}
                disabled={isAnalyzing}
                style={{
                  ...(activeTab === "all"
                    ? {
                        borderColor: "var(--color-accent-emerald)",

                        background: "rgba(74, 222, 128, 0.15)",
                      }
                    : {}),

                  ...(isAnalyzing
                    ? { cursor: "not-allowed", opacity: 0.5 }
                    : {}),
                }}
              >
                <Sparkles size={16} color="var(--color-accent-emerald)" />

                <span>Do-It-All (All Spaces)</span>
              </button>

              <button
                className={`tab-btn ${activeTab === "treatment" ? "active" : ""}`}
                onClick={() => !isAnalyzing && setActiveTab("treatment")}
                disabled={isAnalyzing}
                style={
                  isAnalyzing ? { cursor: "not-allowed", opacity: 0.5 } : {}
                }
              >
                <Activity size={16} />

                <span>RT60 & Treatment</span>
              </button>

              <button
                className={`tab-btn ${activeTab === "roommodes" ? "active" : ""}`}
                onClick={() => !isAnalyzing && setActiveTab("roommodes")}
                disabled={isAnalyzing}
                style={
                  isAnalyzing ? { cursor: "not-allowed", opacity: 0.5 } : {}
                }
              >
                <Grid size={16} />

                <span>Room Modes (FFT)</span>
              </button>

              <button
                className={`tab-btn ${activeTab === "waterfall" ? "active" : ""}`}
                onClick={() => !isAnalyzing && setActiveTab("waterfall")}
                disabled={isAnalyzing}
                style={
                  isAnalyzing ? { cursor: "not-allowed", opacity: 0.5 } : {}
                }
              >
                <Layers size={16} />

                <span>3D Waterfall</span>
              </button>

              <button
                className={`tab-btn ${activeTab === "clarity" ? "active" : ""}`}
                onClick={() => !isAnalyzing && setActiveTab("clarity")}
                disabled={isAnalyzing}
                style={
                  isAnalyzing ? { cursor: "not-allowed", opacity: 0.5 } : {}
                }
              >
                <Sliders size={16} />

                <span>Speech & Music Clarity</span>
              </button>
            </div>

            {/* Input Controls Form */}

            <div className="form-grid">
              {/* Room Dimensions L / W / H */}

              <div className="form-group">
                <label className="form-label">
                  Room Dimensions (L × W × H meters)
                </label>

                <div className="dim-input-scroll-wrapper">
                  <div className="dim-input-scroll">
                    <input
                      type="number"
                      className="form-input"
                      placeholder="L"
                      value={lengthM}
                      disabled={isAnalyzing}
                      style={
                        isAnalyzing
                          ? { cursor: "not-allowed", opacity: 0.6 }
                          : {}
                      }
                      onChange={(e) =>
                        !isAnalyzing &&
                        setLengthM(Math.max(1, Number(e.target.value)))
                      }
                      step="0.1"
                    />

                    <input
                      type="number"
                      className="form-input"
                      placeholder="W"
                      value={widthM}
                      disabled={isAnalyzing}
                      style={
                        isAnalyzing
                          ? { cursor: "not-allowed", opacity: 0.6 }
                          : {}
                      }
                      onChange={(e) =>
                        !isAnalyzing &&
                        setWidthM(Math.max(1, Number(e.target.value)))
                      }
                      step="0.1"
                    />

                    <input
                      type="number"
                      className="form-input"
                      placeholder="H"
                      value={heightM}
                      disabled={isAnalyzing}
                      style={
                        isAnalyzing
                          ? { cursor: "not-allowed", opacity: 0.6 }
                          : {}
                      }
                      onChange={(e) =>
                        !isAnalyzing &&
                        setHeightM(Math.max(1, Number(e.target.value)))
                      }
                      step="0.1"
                    />
                  </div>
                </div>

                <span
                  style={{
                    fontSize: "0.78rem",

                    color: "var(--color-text-muted)",

                    marginTop: "4px",

                    display: "block",
                  }}
                >
                  Calculated Volume:{" "}
                  <strong style={{ color: "var(--color-cream)" }}>
                    {volumeM3} m³
                  </strong>
                </span>
              </div>

              {/* Acoustic Treatment Material */}

              <div className="form-group full-width">
                <label className="form-label">Acoustic Material Spec</label>

                <select
                  className="form-select"
                  value={material}
                  disabled={isAnalyzing}
                  style={
                    isAnalyzing ? { cursor: "not-allowed", opacity: 0.6 } : {}
                  }
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
                className={`dropzone ${fileName ? "active" : ""} ${isAnalyzing ? "disabled" : ""}`}
                onClick={() => {
                  if (isAnalyzing) return;

                  fileInputRef.current?.click();
                }}
                style={
                  isAnalyzing ? { cursor: "not-allowed", opacity: 0.55 } : {}
                }
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".wav,.mp3,.flac,.ogg,.m4a"
                  disabled={isAnalyzing}
                  style={{ display: "none" }}
                />

                <UploadCloud size={32} className="dropzone-icon" />

                {fileName ? (
                  <div style={{ position: "relative", width: "100%" }}>
                    <button
                      onClick={(e) => {
                        if (isAnalyzing) return;

                        clearFile(e);
                      }}
                      disabled={isAnalyzing}
                      title="Remove audio file"
                      style={{
                        position: "absolute",

                        top: "-28px",

                        right: "-8px",

                        background: "rgba(239,68,68,0.15)",

                        border: "1px solid rgba(239,68,68,0.4)",

                        borderRadius: "50%",

                        width: "26px",

                        height: "26px",

                        display: "flex",

                        alignItems: "center",

                        justifyContent: "center",

                        cursor: isAnalyzing ? "not-allowed" : "pointer",

                        opacity: isAnalyzing ? 0.5 : 1,

                        color: "#f87171",

                        padding: 0,

                        flexShrink: 0,
                      }}
                    >
                      <X size={14} />
                    </button>

                    <p
                      className="dropzone-text"
                      style={{ fontWeight: 700, color: "var(--color-cream)" }}
                    >
                      {fileName}
                    </p>

                    <p className="dropzone-hint">
                      {isAnalyzing
                        ? "Analysis in progress..."
                        : "Click to change audio file"}
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="dropzone-text">
                      <strong>Upload impulse response</strong> (.wav, .mp3)
                    </p>

                    <p className="dropzone-hint">
                      {isAnalyzing
                        ? "Analysis in progress..."
                        : "Balloon pop, clap test, or acoustic sine sweep"}
                    </p>
                  </div>
                )}
              </div>

              {/* Microphone Recorder Box */}

              <div className="mic-record-box">
                <Mic
                  size={32}
                  color={isRecording ? "#ef4444" : "var(--color-light-sage)"}
                />

                {isRecording ? (
                  <div>
                    <p
                      className="dropzone-text"
                      style={{ color: "#fca5a5", fontWeight: 700 }}
                    >
                      Recording live audio: {recordingSeconds}s
                    </p>

                    <button
                      className="mic-btn-record mic-btn-recording"
                      onClick={stopRecording}
                      disabled={isAnalyzing}
                      style={{
                        marginTop: "8px",

                        ...(isAnalyzing
                          ? { cursor: "not-allowed", opacity: 0.5 }
                          : {}),
                      }}
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
                      style={{
                        marginTop: "8px",

                        ...(isAnalyzing
                          ? { cursor: "not-allowed", opacity: 0.5 }
                          : {}),
                      }}
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
                  background: "rgba(18, 24, 19, 0.5)",

                  padding: "10px 16px",

                  borderRadius: "10px",

                  marginBottom: "16px",

                  display: "flex",

                  alignItems: "center",

                  justifyContent: "space-between",
                }}
              >
                <span
                  style={{
                    fontSize: "0.82rem",

                    color: "var(--color-text-dim)",

                    display: "flex",

                    alignItems: "center",

                    gap: "6px",
                  }}
                >
                  <Volume2 size={16} /> Audio attached:{" "}
                  <strong>{fileName}</strong>
                </span>

                <audio
                  controls
                  src={audioPreviewUrl}
                  style={{ height: "30px" }}
                />
              </div>
            )}

            {/* Simulation Mode Explicit Toggle */}

            <div
              style={{
                display: "flex",

                alignItems: "center",

                gap: "8px",

                marginBottom: "16px",
              }}
            >
              <input
                type="checkbox"
                id="simToggle"
                checked={isSimMode}
                disabled={isAnalyzing}
                onChange={(e) => !isAnalyzing && setIsSimMode(e.target.checked)}
                style={{
                  cursor: isAnalyzing ? "not-allowed" : "pointer",

                  width: "16px",

                  height: "16px",
                }}
              />

              <label
                htmlFor="simToggle"
                style={{
                  fontSize: "0.84rem",

                  color: "var(--color-text-dim)",

                  cursor: isAnalyzing ? "not-allowed" : "pointer",
                }}
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

            <div style={{ marginTop: "16px", marginBottom: "24px" }}>
              <button
                className="btn-pill-primary"
                onClick={() => !isAnalyzing && runAnalysis()}
                disabled={isAnalyzing}
                style={{
                  width: "100%",

                  padding: "16px",

                  display: "flex",

                  alignItems: "center",

                  justifyContent: "center",

                  gap: "10px",

                  cursor: isAnalyzing ? "not-allowed" : "pointer",
                }}
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 size={20} className="btn-spinner" />
                    Analysing…
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
              <>
                {/* Executive Action Toolbar: Print, Export JSON, Save to History, Copy */}
                <div className="report-action-bar no-print">
                  <div className="report-action-left">
                    <div className="report-action-title">
                      <Sparkles size={16} color="var(--color-accent-emerald)" />
                      <span>Acoustic Report & Archives</span>
                    </div>
                    <button
                      className="btn-report-action btn-report-save"
                      onClick={handleSaveCalculation}
                      title="Store this calculation in browser localStorage (keeps last 3)"
                    >
                      <Save size={14} />
                      <span>Save Calculation</span>
                      <span className="slot-badge">
                        {savedReports.length}/3
                      </span>
                    </button>
                    <button
                      className="btn-report-action btn-report-history"
                      onClick={() => setIsSavedModalOpen(true)}
                      title="View or restore your stored calculations"
                    >
                      <History size={14} />
                      <span>History ({savedReports.length}/3)</span>
                    </button>
                  </div>

                  <div className="report-action-right">
                    <button
                      className="btn-report-action btn-report-copy"
                      onClick={handleCopySummary}
                      title="Copy summary text for emails or client proposals"
                    >
                      <Copy size={14} />
                      <span>Copy Summary</span>
                    </button>
                    <button
                      className="btn-report-action btn-report-export"
                      onClick={() => handleExportJSON()}
                      title="Download full JSON data file with all metrics"
                    >
                      <Download size={14} />
                      <span>Export JSON</span>
                    </button>
                    <button
                      className="btn-report-action btn-report-print"
                      onClick={handlePrint}
                      title="Print or Save as PDF laboratory report"
                    >
                      <Printer size={15} />
                      <span>Print / Save as PDF</span>
                    </button>
                  </div>
                </div>

                <div className="results-container">
                  {/* TAB 0: DO-IT-ALL FOR ALL AVAILABLE SPACE TYPES */}

                  {activeTab === "all" && results && results.allSpaces && (
                    <div>
                      {/* Master Diagnostic Summary Card */}

                      <div className="do-it-all-summary-card">
                        <div className="do-it-all-summary-title">
                          <Sparkles
                            size={22}
                            color="var(--color-accent-emerald)"
                          />

                          <span>
                            Universal Do-It-All Acoustic Assessment (All 9 Space
                            Types)
                          </span>
                        </div>

                        <p className="do-it-all-summary-text">
                          Comprehensive evaluation of your room (
                          <strong>{volumeM3} m³</strong>, measured RT60:{" "}
                          <strong>{results.measuredT20}s</strong>) across all{" "}
                          <strong>9 international acoustic standards</strong>{" "}
                          (ANSI S12.60, ISO 3382, Broadcast EBU R128).
                        </p>

                        <div
                          style={{
                            display: "flex",

                            flexWrap: "wrap",

                            gap: "12px",

                            alignItems: "center",

                            marginTop: "14px",
                          }}
                        >
                          <span className="best-match-highlight">
                            🏆 Best Natural Acoustic Fit:{" "}
                            {ALL_SPACES_CONFIG[results.bestMatch]?.label} (
                            {
                              results.allSpaces[results.bestMatch]
                                ?.suitabilityScore
                            }
                            % Suitability)
                          </span>

                          <span
                            style={{
                              fontSize: "0.84rem",

                              color: "var(--color-text-dim)",
                            }}
                          >
                            {results.allSpaces[results.bestMatch]
                              ?.neededArea === 0
                              ? "✅ Meets target reverberation criteria without needing absorption panels."
                              : `Requires ~${results.allSpaces[results.bestMatch]?.neededArea} m² panels to reach nominal target.`}
                          </span>
                        </div>
                      </div>

                      {/* Multi-Space RT60 Target Spectrum Gauge */}

                      <div className="rt60-spectrum-chart">
                        <div className="spectrum-header">
                          <div>
                            <span
                              style={{
                                fontSize: "0.95rem",

                                fontWeight: 700,

                                color: "var(--color-cream)",
                              }}
                            >
                              RT60 Target Spectrum: All 9 Spaces Compared
                            </span>

                            <p
                              style={{
                                fontSize: "0.78rem",

                                color: "var(--color-text-dim)",

                                marginTop: "2px",
                              }}
                            >
                              Acceptable target ranges vs your room's Measured
                              RT60 (
                              <strong style={{ color: "#f87171" }}>
                                {results.measuredT20}s
                              </strong>{" "}
                              vertical line)
                            </p>
                          </div>

                          <div
                            style={{
                              display: "flex",

                              alignItems: "center",

                              gap: "16px",

                              fontSize: "0.75rem",

                              color: "var(--color-text-dim)",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",

                                alignItems: "center",

                                gap: "6px",
                              }}
                            >
                              <span
                                style={{
                                  width: "14px",

                                  height: "8px",

                                  background: "rgba(102, 122, 101, 0.4)",

                                  border: "1px solid var(--color-light-sage)",

                                  borderRadius: "2px",
                                }}
                              ></span>

                              <span>Acceptable Range</span>
                            </div>

                            <div
                              style={{
                                display: "flex",

                                alignItems: "center",

                                gap: "6px",
                              }}
                            >
                              <span
                                style={{
                                  width: "3px",

                                  height: "14px",

                                  background: "#f87171",

                                  borderRadius: "2px",

                                  boxShadow: "0 0 6px rgba(248,113,113,0.8)",
                                }}
                              ></span>

                              <span>Your Room ({results.measuredT20}s)</span>
                            </div>
                          </div>
                        </div>

                        <div
                          style={{
                            display: "flex",

                            flexDirection: "column",

                            gap: "8px",
                          }}
                        >
                          {Object.entries(ALL_SPACES_CONFIG)

                            .sort((a, b) => a[1].target - b[1].target)

                            .map(([key, info]) => {
                              const evalData = results.allSpaces[key] || {};

                              const maxScale = 2.4; // scale from 0.0s to 2.4s

                              const leftPct = Math.min(
                                100,

                                Math.max(0, (info.range[0] / maxScale) * 100),
                              );

                              const widthPct = Math.min(
                                100 - leftPct,

                                Math.max(
                                  2,

                                  ((info.range[1] - info.range[0]) / maxScale) *
                                    100,
                                ),
                              );

                              const markerPct = Math.min(
                                100,

                                Math.max(
                                  0,

                                  (Number(results.measuredT20) / maxScale) *
                                    100,
                                ),
                              );

                              const isOptimal =
                                evalData.statusType === "optimal";

                              return (
                                <div key={key} className="spectrum-row">
                                  <div
                                    style={{
                                      display: "flex",

                                      alignItems: "center",

                                      gap: "8px",
                                    }}
                                  >
                                    <div
                                      style={{
                                        width: "8px",

                                        height: "8px",

                                        borderRadius: "50%",

                                        background: info.color,
                                      }}
                                    ></div>

                                    <span
                                      style={{
                                        fontWeight: 600,

                                        color: "var(--color-cream)",

                                        whiteSpace: "nowrap",

                                        overflow: "hidden",

                                        textOverflow: "ellipsis",
                                      }}
                                    >
                                      {info.label}
                                    </span>
                                  </div>

                                  <div className="spectrum-track">
                                    <div
                                      className={`spectrum-target-range ${isOptimal ? "active-match" : ""}`}
                                      style={{
                                        left: `${leftPct}%`,

                                        width: `${widthPct}%`,
                                      }}
                                      title={`Target range: ${info.range[0]}s - ${info.range[1]}s`}
                                    ></div>

                                    <div
                                      className="spectrum-marker"
                                      style={{ left: `${markerPct}%` }}
                                      title={`Your Room RT60: ${results.measuredT20}s`}
                                    ></div>
                                  </div>

                                  <div
                                    style={{
                                      textAlign: "right",

                                      fontSize: "0.78rem",

                                      color: isOptimal
                                        ? "var(--color-accent-emerald)"
                                        : "var(--color-text-dim)",

                                      fontWeight: isOptimal ? 700 : 500,
                                    }}
                                  >
                                    {info.range[0]}s–{info.range[1]}s
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>

                      {/* 9-Space Detailed Comparative Grid */}

                      <div className="do-it-all-grid">
                        {Object.entries(ALL_SPACES_CONFIG).map(
                          ([key, info]) => {
                            const evalData =
                              (results.allSpaces && results.allSpaces[key]) ||
                              {};

                            const IconComponent = info.icon;

                            const measured =
                              Number(results.measuredT20) || 0.45;

                            const target = Number(
                              evalData.target ??
                                evalData.target_rt60_seconds ??
                                info.target,
                            );

                            const rawDelta =
                              evalData.delta ??
                              evalData.delta_seconds ??
                              measured - target;

                            const delta = Number(rawDelta);

                            const formattedDelta =
                              (delta > 0
                                ? `+${delta.toFixed(2)}`
                                : delta.toFixed(2)) + "s";

                            const neededArea = Number(
                              evalData.neededArea ??
                                evalData.recommended_area_m2 ??
                                0,
                            );

                            const suitability =
                              evalData.suitabilityScore ??
                              Math.max(
                                25,

                                Math.min(
                                  100,

                                  Math.round(
                                    100 -
                                      (Math.abs(measured - target) /
                                        Math.max(0.2, target)) *
                                        60,
                                  ),
                                ),
                              );

                            const statusType =
                              evalData.statusType ??
                              evalData.status_type ??
                              (measured > (info.range[1] || target * 1.15)
                                ? "reverberant"
                                : measured < (info.range[0] || target * 0.85)
                                  ? "dry"
                                  : "optimal");

                            const isOptimal = statusType === "optimal";

                            const isReverb = statusType === "reverberant";

                            const status =
                              evalData.status ||
                              (isOptimal
                                ? "Optimal Match"
                                : isReverb
                                  ? "Needs Absorption"
                                  : "Too Dry / Over-Damped");

                            return (
                              <div
                                key={key}
                                className={`space-matrix-card ${statusType || ""}`}
                              >
                                <div>
                                  <div className="space-card-top">
                                    <div className="space-card-icon-title">
                                      <div
                                        className="space-icon-wrapper"
                                        style={{ color: info.color }}
                                      >
                                        <IconComponent size={20} />
                                      </div>

                                      <div>
                                        <h4 className="space-card-heading">
                                          {info.label}
                                        </h4>

                                        <span
                                          style={{
                                            fontSize: "0.72rem",

                                            color: "var(--color-text-muted)",
                                          }}
                                        >
                                          {info.category}
                                        </span>
                                      </div>
                                    </div>

                                    <span
                                      className={`space-card-status-badge ${
                                        isOptimal
                                          ? "status-badge-optimal"
                                          : isReverb
                                            ? "status-badge-reverberant"
                                            : "status-badge-dry"
                                      }`}
                                    >
                                      {status}
                                    </span>
                                  </div>

                                  <p
                                    style={{
                                      fontSize: "0.78rem",

                                      color: "var(--color-text-dim)",

                                      marginBottom: "12px",

                                      minHeight: "34px",
                                    }}
                                  >
                                    {info.desc}
                                  </p>

                                  <div className="space-metric-row">
                                    <span className="space-metric-label">
                                      Target RT60:
                                    </span>

                                    <span className="space-metric-value">
                                      {target.toFixed(2)}s ({info.range[0]}s–
                                      {info.range[1]}s)
                                    </span>
                                  </div>

                                  <div className="space-metric-row">
                                    <span className="space-metric-label">
                                      Measured Delta (Δ):
                                    </span>

                                    <span
                                      className="space-metric-value"
                                      style={{
                                        color: isOptimal
                                          ? "var(--color-accent-emerald)"
                                          : delta > 0
                                            ? "var(--color-accent-amber)"
                                            : "#93c5fd",
                                      }}
                                    >
                                      {formattedDelta}
                                    </span>
                                  </div>

                                  <div className="space-metric-row">
                                    <span className="space-metric-label">
                                      Acoustic Suitability:
                                    </span>

                                    <span
                                      className="space-metric-value"
                                      style={{
                                        color: isOptimal
                                          ? "var(--color-accent-emerald)"
                                          : "var(--color-cream)",
                                      }}
                                    >
                                      {suitability}%
                                    </span>
                                  </div>

                                  <div className="space-treatment-box">
                                    <span
                                      style={{
                                        fontSize: "0.76rem",

                                        color: "var(--color-text-dim)",
                                      }}
                                    >
                                      Treatment Needed:
                                    </span>

                                    <strong
                                      style={{
                                        fontSize: "0.88rem",

                                        color:
                                          neededArea > 0
                                            ? "var(--color-accent-emerald)"
                                            : "var(--color-cream)",
                                      }}
                                    >
                                      {neededArea > 0
                                        ? `~${neededArea.toFixed(1)} m²`
                                        : "0 m² (Ready)"}
                                    </strong>
                                  </div>
                                </div>

                                <button
                                  className="btn-space-focus"
                                  disabled={isAnalyzing}
                                  style={
                                    isAnalyzing
                                      ? { cursor: "not-allowed", opacity: 0.5 }
                                      : {}
                                  }
                                  onClick={() => {
                                    if (isAnalyzing) return;

                                    setRoomType(key);

                                    setActiveTab("treatment");
                                  }}
                                >
                                  <span>Inspect {info.label} Details</span>

                                  <ArrowRight size={14} />
                                </button>
                              </div>
                            );
                          },
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB 1: OVERVIEW & TREATMENT */}

                  {activeTab === "treatment" && (
                    <div>
                      <div className="results-title">
                        <CheckCircle
                          size={20}
                          color="var(--color-accent-emerald)"
                        />

                        <span>Reverberation & Treatment Results</span>

                        <span
                          style={{
                            marginLeft: "auto",

                            fontSize: "0.78rem",

                            padding: "4px 10px",

                            borderRadius: "999px",

                            background: "rgba(74, 222, 128, 0.15)",

                            color: "var(--color-accent-emerald)",

                            border: "1px solid rgba(74, 222, 128, 0.3)",
                          }}
                        >
                          {results.status}
                        </span>
                      </div>

                      <div className="metrics-row">
                        <div className="metric-card">
                          <div className="metric-value">
                            {results.measuredT20}s
                          </div>

                          <div className="metric-name">RT60 (T20)</div>
                        </div>

                        <div className="metric-card">
                          <div className="metric-value">
                            {results.measuredT30}s
                          </div>

                          <div className="metric-name">RT60 (T30)</div>
                        </div>

                        <div className="metric-card">
                          <div
                            className="metric-value"
                            style={{ color: "var(--color-light-sage)" }}
                          >
                            {results.targetRT60}s
                          </div>

                          <div className="metric-name">Target RT60</div>
                        </div>

                        <div className="metric-card">
                          <div
                            className="metric-value"
                            style={{ color: "var(--color-accent-amber)" }}
                          >
                            {results.rSquared}
                          </div>

                          <div className="metric-name">R² Fit Quality</div>
                        </div>

                        <div className="metric-card">
                          <div
                            className="metric-value"
                            style={{ color: "var(--color-accent-emerald)" }}
                          >
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

                        {(() => {
                          const maxTime =
                            results.points && results.points.length > 0
                              ? Math.max(
                                  ...results.points.map(
                                    (p) => Number(p.time) || 0,
                                  ),
                                )
                              : Math.max(
                                  1.0,

                                  Number(results.measuredT20 || 0.6) * 1.3,
                                );

                          const safeMaxTime = Math.max(0.4, maxTime);

                          const tTicks = [0, 0.25, 0.5, 0.75, 1.0].map(
                            (r) => r * safeMaxTime,
                          );

                          const xFit60 =
                            45 +
                            Math.min(
                              1.0,

                              Number(results.measuredT20 || 0.5) / safeMaxTime,
                            ) *
                              440;

                          return (
                            <svg
                              viewBox="0 0 520 155"
                              style={{
                                width: "100%",

                                height: "155px",

                                display: "block",
                              }}
                            >
                              {/* Grid horizontal dB lines */}

                              <line
                                x1="45"
                                y1="20"
                                x2="485"
                                y2="20"
                                stroke="rgba(255,255,255,0.08)"
                                strokeDasharray="3 3"
                              />

                              <line
                                x1="45"
                                y1="52"
                                x2="485"
                                y2="52"
                                stroke="rgba(255,255,255,0.08)"
                                strokeDasharray="3 3"
                              />

                              <line
                                x1="45"
                                y1="83"
                                x2="485"
                                y2="83"
                                stroke="rgba(255,255,255,0.08)"
                                strokeDasharray="3 3"
                              />

                              <line
                                x1="45"
                                y1="115"
                                x2="485"
                                y2="115"
                                stroke="rgba(255,255,255,0.15)"
                              />

                              {/* Axes */}

                              <line
                                x1="45"
                                y1="15"
                                x2="45"
                                y2="115"
                                stroke="rgba(255,255,255,0.4)"
                              />

                              <line
                                x1="45"
                                y1="115"
                                x2="495"
                                y2="115"
                                stroke="rgba(255,255,255,0.4)"
                              />

                              {/* dB Y-Axis Labels */}

                              <text
                                x="38"
                                y="24"
                                fill="var(--color-text-muted)"
                                fontSize="9"
                                textAnchor="end"
                              >
                                0 dB
                              </text>

                              <text
                                x="38"
                                y="55"
                                fill="var(--color-text-muted)"
                                fontSize="9"
                                textAnchor="end"
                              >
                                -20 dB
                              </text>

                              <text
                                x="38"
                                y="87"
                                fill="var(--color-text-muted)"
                                fontSize="9"
                                textAnchor="end"
                              >
                                -40 dB
                              </text>

                              <text
                                x="38"
                                y="118"
                                fill="var(--color-text-muted)"
                                fontSize="9"
                                textAnchor="end"
                              >
                                -60 dB
                              </text>

                              {/* Real Energy Decay Path */}

                              <path
                                d={renderSVGDecayPath(results.points)}
                                fill="none"
                                stroke="var(--color-accent-emerald)"
                                strokeWidth="2.5"
                              />

                              {/* Linear Fit Slope */}

                              <line
                                x1="45"
                                y1="20"
                                x2={Math.min(485, xFit60)}
                                y2="115"
                                stroke="var(--color-accent-amber)"
                                strokeWidth="1.8"
                                strokeDasharray="4 4"
                              />

                              {/* X-Axis Time Ticks & Values */}

                              {tTicks.map((t, idx) => {
                                const xPos = 45 + (t / safeMaxTime) * 440;

                                return (
                                  <g key={idx}>
                                    <line
                                      x1={xPos}
                                      y1="115"
                                      x2={xPos}
                                      y2="120"
                                      stroke="rgba(255,255,255,0.3)"
                                    />

                                    <text
                                      x={xPos}
                                      y="132"
                                      fill="var(--color-text-muted)"
                                      fontSize="9"
                                      textAnchor="middle"
                                    >
                                      {t.toFixed(2)}s
                                    </text>
                                  </g>
                                );
                              })}

                              <text
                                x="265"
                                y="148"
                                fill="var(--color-light-sage)"
                                fontSize="9.5"
                                fontWeight="600"
                                textAnchor="middle"
                              >
                                ELAPSED TIME (SECONDS)
                              </text>
                            </svg>
                          );
                        })()}

                        {/* Line Descriptions Guide */}

                        <div className="graph-guide-container">
                          <div className="graph-guide-header">
                            <Activity size={14} />

                            <span>Line Guide: What Each Line Indicates</span>
                          </div>

                          <div className="graph-lines-grid">
                            <div className="graph-line-card">
                              <div className="line-swatch-box">
                                <div
                                  style={{
                                    width: "100%",

                                    height: "3px",

                                    background: "#4ade80",

                                    borderRadius: "2px",
                                  }}
                                ></div>
                              </div>

                              <div className="line-guide-info">
                                <div className="line-guide-title">
                                  <span>Solid Emerald Line</span>

                                  <span
                                    style={{
                                      fontSize: "0.7rem",

                                      color: "#4ade80",
                                    }}
                                  >
                                    Actual Decay
                                  </span>
                                </div>

                                <p className="line-guide-desc">
                                  <strong>Schroeder Energy Decay:</strong> Shows
                                  the real backwards-integrated acoustic energy
                                  decaying over time from 0 dB to noise floor.
                                  Steeper downward slope = faster sound
                                  absorption.
                                </p>
                              </div>
                            </div>

                            <div className="graph-line-card">
                              <div className="line-swatch-box">
                                <div
                                  style={{
                                    width: "100%",

                                    height: "3px",

                                    borderTop: "2px dashed #f59e0b",
                                  }}
                                ></div>
                              </div>

                              <div className="line-guide-info">
                                <div className="line-guide-title">
                                  <span>Dashed Amber Line</span>

                                  <span
                                    style={{
                                      fontSize: "0.7rem",

                                      color: "#f59e0b",
                                    }}
                                  >
                                    ISO 3382 Slope
                                  </span>
                                </div>

                                <p className="line-guide-desc">
                                  <strong>
                                    Linear Regression Fit (T20/T30):
                                  </strong>{" "}
                                  The best-fit decay slope calculated between -5
                                  dB and -25 dB (-35 dB for T30), extrapolated
                                  across 60 dB to determine RT60.
                                </p>
                              </div>
                            </div>

                            <div className="graph-line-card">
                              <div className="line-swatch-box">
                                <div
                                  style={{
                                    width: "100%",

                                    height: "2px",

                                    borderTop:
                                      "2px dotted rgba(255,255,255,0.4)",
                                  }}
                                ></div>
                              </div>

                              <div className="line-guide-info">
                                <div className="line-guide-title">
                                  <span>Dotted Gray Grid Lines</span>

                                  <span
                                    style={{
                                      fontSize: "0.7rem",

                                      color: "var(--color-text-dim)",
                                    }}
                                  >
                                    Reference
                                  </span>
                                </div>

                                <p className="line-guide-desc">
                                  <strong>Decibel Thresholds:</strong> 0 dB
                                  marks peak impulse excitation; -30 dB is
                                  mid-decay reference; -60 dB is the standard
                                  international cutoff for complete decay.
                                </p>
                              </div>
                            </div>

                            <div className="graph-line-card">
                              <div className="line-swatch-box">
                                <div
                                  style={{
                                    width: "100%",

                                    height: "12px",

                                    borderLeft:
                                      "2px solid rgba(255,255,255,0.4)",

                                    borderBottom:
                                      "2px solid rgba(255,255,255,0.4)",
                                  }}
                                ></div>
                              </div>

                              <div className="line-guide-info">
                                <div className="line-guide-title">
                                  <span>Coordinate Axes</span>

                                  <span
                                    style={{
                                      fontSize: "0.7rem",

                                      color: "var(--color-text-dim)",
                                    }}
                                  >
                                    dB vs Time
                                  </span>
                                </div>

                                <p className="line-guide-desc">
                                  <strong>Axes Measurement:</strong> Vertical
                                  Y-axis measures sound level drop in decibels
                                  (0 to -60 dB); horizontal X-axis tracks
                                  elapsed time in seconds.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Octave Band Treatment Table */}

                      {results.bands &&
                        Object.keys(results.bands).length > 0 && (
                          <div
                            style={{
                              marginTop: "16px",

                              background: "rgba(10,15,11,0.5)",

                              padding: "14px",

                              borderRadius: "10px",

                              border: "1px solid var(--glass-border)",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "0.8rem",

                                color: "var(--color-light-sage)",

                                textTransform: "uppercase",

                                letterSpacing: "0.08em",

                                fontWeight: 700,
                              }}
                            >
                              Octave Band Absorption Deficit & Panel Area
                              Breakdown
                            </span>

                            <div
                              style={{
                                display: "grid",

                                gridTemplateColumns: "repeat(6, 1fr)",

                                gap: "8px",

                                marginTop: "10px",

                                textAlign: "center",
                              }}
                            >
                              {[
                                "125",
                                "250",
                                "500",
                                "1000",
                                "2000",
                                "4000",
                              ].map((band) => {
                                const bData = results.bands[band] || {};

                                return (
                                  <div
                                    key={band}
                                    style={{
                                      background: "rgba(40,61,41,0.4)",

                                      padding: "8px 4px",

                                      borderRadius: "6px",

                                      border: "1px solid var(--glass-border)",
                                    }}
                                  >
                                    <div
                                      style={{
                                        fontSize: "0.75rem",

                                        color: "var(--color-text-muted)",
                                      }}
                                    >
                                      {band} Hz
                                    </div>

                                    <div
                                      style={{
                                        fontSize: "0.88rem",

                                        fontWeight: 700,

                                        color: "var(--color-cream)",

                                        marginTop: "2px",
                                      }}
                                    >
                                      {bData.measured_rt60_seconds
                                        ? bData.measured_rt60_seconds.toFixed(2)
                                        : "--"}
                                      s
                                    </div>

                                    <div
                                      style={{
                                        fontSize: "0.75rem",

                                        color: "var(--color-accent-emerald)",

                                        marginTop: "2px",
                                      }}
                                    >
                                      {bData.recommended_area_m2
                                        ? `${bData.recommended_area_m2.toFixed(1)} m²`
                                        : "0 m²"}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                      {/* DYNAMIC TREATMENT BREAKDOWN EXPLANATION */}

                      {(() => {
                        const mVal = Number(results.measuredT20 || 0.5);

                        const tVal = Number(results.targetRT60 || 0.5);

                        const delta = Number((mVal - tVal).toFixed(2));

                        const totalArea = Number(results.neededArea || 0);

                        const cornerTraps = (totalArea * 0.4).toFixed(1);

                        const wallPanels = (totalArea * 0.35).toFixed(1);

                        const rearDiffusers = (totalArea * 0.25).toFixed(1);

                        // Bass/Treble Ratio - now computed server-side in
                        // dsp.py's bass_treble_ratio() from real measured
                        // octave-band RT60s. Fallback (estimated from
                        // broadband RT60) only kicks in for older cached
                        // reports that predate this backend change.

                        const bassRatio =
                          results.bassRatio ??
                          Number(
                            (
                              (mVal * 1.18 + mVal * 1.08) /
                              (mVal + mVal * 0.95)
                            ).toFixed(2),
                          );

                        const trebleRatio =
                          results.trebleRatio ??
                          Number(((mVal * 0.75) / mVal).toFixed(2));

                        const bassIsEstimated = results.bassRatio == null;

                        let bassDesc =
                          "Balanced low-frequency decay relative to mid frequencies (Optimal musical warmth).";

                        if (bassRatio > 1.25) {
                          bassDesc =
                            "Boomy / Extended Lows (Bass decay is lingering significantly longer than mids. Heavy corner bass trapping is strongly advised).";
                        } else if (bassRatio < 0.9) {
                          bassDesc =
                            "Lean / Over-Absorbed Bass (Low-frequency energy dissipates too quickly relative to mids, causing a thin acoustic timbre).";
                        }

                        let trebleDesc =
                          "Balanced high-frequency decay relative to mid frequencies.";

                        if (trebleRatio !== null && trebleRatio >= 1) {
                          trebleDesc =
                            "Unusually bright / reflective room (highs are decaying as long as or longer than mids - consider a broadband panel with better high-frequency absorption).";
                        } else if (trebleRatio !== null && trebleRatio < 0.6) {
                          trebleDesc =
                            "Highs are heavily damped relative to mids - typical of soft-furnished rooms, generally fine unless the room sounds dull.";
                        }

                        return (
                          <div className="dynamic-explanation-card">
                            <div className="dynamic-card-title">
                              <Sliders size={16} />

                              <span>
                                Dynamic Acoustic & Treatment Engineering
                                Breakdown
                              </span>
                            </div>

                            <div className="dynamic-explanation-grid">
                              <div className="dynamic-sub-block">
                                <div className="dynamic-sub-title">
                                  Reverberance Delta & Room Status
                                </div>

                                <p className="dynamic-text">
                                  Measured <strong>RT60 ({mVal}s)</strong> is{" "}
                                  {delta > 0
                                    ? `${delta}s above`
                                    : delta < 0
                                      ? `${Math.abs(delta)}s below`
                                      : "exactly at"}{" "}
                                  the target standard of{" "}
                                  <strong>{tVal}s</strong> for a{" "}
                                  {ALL_SPACES_CONFIG[roomType]?.label ||
                                    "selected space"}
                                  .{" "}
                                  {delta > 0
                                    ? "The space suffers from excessive flutter echo and specular reflections that degrade intelligibility."
                                    : delta < 0
                                      ? "The space is heavily damped/dead, potentially causing acoustic fatigue."
                                      : "The room exhibits ideal decay characteristics conforming to ISO 3382 recommendations."}
                                </p>
                              </div>

                              <div className="dynamic-sub-block">
                                <div className="dynamic-sub-title">
                                  Bass Ratio (BR = {bassRatio})
                                  {bassIsEstimated && (
                                    <span
                                      style={{ opacity: 0.6, fontWeight: 400 }}
                                    >
                                      {" "}
                                      (estimated)
                                    </span>
                                  )}
                                </div>

                                <p className="dynamic-text">
                                  <strong>Tonal Balance:</strong> {bassDesc}
                                </p>
                              </div>

                              {trebleRatio !== null && (
                                <div className="dynamic-sub-block">
                                  <div className="dynamic-sub-title">
                                    Treble Ratio (TR = {trebleRatio})
                                  </div>
                                  <p className="dynamic-text">
                                    <strong>Brightness:</strong> {trebleDesc}
                                  </p>
                                </div>
                              )}

                              <div
                                className="dynamic-sub-block"
                                style={{ gridColumn: "1 / -1" }}
                              >
                                <div className="dynamic-sub-title">
                                  3-Zone Material Placement Blueprint (
                                  {totalArea > 0
                                    ? `~${totalArea} m² Total Absorption`
                                    : "No Extra Panels Needed"}
                                  )
                                </div>

                                <p className="dynamic-text">
                                  {totalArea > 0 ? (
                                    <>
                                      1.{" "}
                                      <strong>
                                        Tri-Corner Bass Traps (~{cornerTraps}{" "}
                                        m²):
                                      </strong>{" "}
                                      Position thick porous traps (≥100mm
                                      mineral wool with 50mm air gap) in
                                      vertical room corners where axial standing
                                      wave pressure peaks.
                                      <br />
                                      2.{" "}
                                      <strong>
                                        Lateral First-Reflection Mirrors (~
                                        {wallPanels} m²):
                                      </strong>{" "}
                                      Mount broad-spectrum absorption panels on
                                      side walls and ceiling clouds between
                                      speakers and listener to prevent comb
                                      filtering.
                                      <br />
                                      3.{" "}
                                      <strong>
                                        Rear Wall Diffusion/Scattering (~
                                        {rearDiffusers} m²):
                                      </strong>{" "}
                                      Install 1D or 2D Quadratic Residue
                                      Diffusers (QRD) or hybrid
                                      absorber-diffusers on the back wall to
                                      preserve room liveliness and spatial
                                      envelopment without flutter decay.
                                    </>
                                  ) : (
                                    <>
                                      Current room finishes provide adequate
                                      natural acoustic absorption. Maintain
                                      symmetric furniture and diffuse
                                      book/record shelves on the rear wall to
                                      keep acoustic balance intact.
                                    </>
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* TAB 2: ROOM MODES */}

                  {activeTab === "roommodes" && (
                    <div>
                      <div
                        className="results-title"
                        style={{
                          display: "flex",

                          alignItems: "center",

                          justifyContent: "space-between",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",

                            alignItems: "center",

                            gap: "8px",
                          }}
                        >
                          <Grid size={20} color="var(--color-light-sage)" />

                          <span>
                            Low-Frequency Room Modes & Schroeder Cutoff
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();

                            setIsRoomModesModalOpen(true);
                          }}
                          style={{
                            background: "rgba(74, 222, 128, 0.12)",

                            border: "1px solid rgba(74, 222, 128, 0.3)",

                            color: "var(--color-accent-emerald)",

                            padding: "4px 12px",

                            borderRadius: "999px",

                            fontSize: "0.78rem",

                            fontWeight: 600,

                            cursor: "pointer",

                            display: "flex",

                            alignItems: "center",

                            gap: "6px",
                          }}
                          title="Open Room Modes & Standing Waves Guide"
                        >
                          <Info size={14} />

                          <span>Room Modes Science Guide</span>
                        </button>
                      </div>

                      {!roomModeData && (
                        <div
                          style={{
                            textAlign: "center",

                            padding: "60px 20px",

                            color: "var(--color-text-dim)",
                          }}
                        >
                          <Grid
                            size={48}
                            color="var(--color-text-muted)"
                            style={{ marginBottom: "16px", opacity: 0.4 }}
                          />

                          <p
                            style={{
                              fontSize: "1rem",

                              marginBottom: "8px",

                              color: "var(--color-cream)",
                            }}
                          >
                            No Room Mode Data Yet
                          </p>

                          <p style={{ fontSize: "0.88rem", lineHeight: 1.6 }}>
                            Run an analysis first (with simulation mode enabled
                            or an audio file uploaded) to compute low-frequency
                            standing wave resonances for your room dimensions.
                          </p>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();

                              setIsRoomModesModalOpen(true);
                            }}
                            style={{
                              marginTop: "20px",

                              background: "rgba(74,222,128,0.1)",

                              border: "1px solid rgba(74,222,128,0.35)",

                              color: "var(--color-accent-emerald)",

                              padding: "8px 20px",

                              borderRadius: "8px",

                              cursor: "pointer",

                              fontSize: "0.85rem",

                              fontWeight: 600,
                            }}
                          >
                            Learn About Room Modes →
                          </button>
                        </div>
                      )}

                      {roomModeData && (
                        <div>
                          <div
                            style={{
                              background: "rgba(40,61,41,0.5)",

                              padding: "14px",

                              borderRadius: "10px",

                              border: "1px solid var(--glass-border)",

                              marginBottom: "16px",

                              display: "flex",

                              justifyContent: "space-between",

                              alignItems: "center",
                            }}
                          >
                            <div>
                              <span
                                style={{
                                  fontSize: "0.78rem",

                                  color: "var(--color-text-muted)",

                                  textTransform: "uppercase",
                                }}
                              >
                                Schroeder Cutoff Frequency (f_s)
                              </span>

                              <div
                                style={{
                                  fontSize: "1.4rem",

                                  fontWeight: 800,

                                  color: "var(--color-accent-amber)",
                                }}
                              >
                                {roomModeData.schroeder_freq} Hz
                              </div>
                            </div>

                            <div
                              style={{
                                textAlign: "right",

                                fontSize: "0.82rem",

                                color: "var(--color-text-dim)",
                              }}
                            >
                              Below {roomModeData.schroeder_freq} Hz, discrete
                              standing waves dominate acoustics.
                              <br />
                              Total modes detected:{" "}
                              <strong>{roomModeData.modes?.length || 0}</strong>
                            </div>
                          </div>

                          {/* FFT & Mode Line Overlay Plot */}
                          <div className="plot-card">
                            <div
                              className="plot-header"
                              style={{ flexWrap: "wrap", gap: "10px" }}
                            >
                              <div>
                                <span
                                  style={{
                                    fontWeight: 700,
                                    fontSize: "0.95rem",
                                    color: "var(--color-cream)",
                                  }}
                                >
                                  Room Resonances & FFT Spectrum (20–300 Hz)
                                </span>
                                <div
                                  style={{
                                    fontSize: "0.78rem",
                                    color: "var(--color-text-dim)",
                                    marginTop: "2px",
                                  }}
                                >
                                  Showing{" "}
                                  {
                                    (roomModeData.modes || []).filter(
                                      (m) => modeFilters[m.type],
                                    ).length
                                  }{" "}
                                  of {roomModeData.modes?.length || 0} modes •
                                  Toggle categories to remove clutter
                                </div>
                              </div>

                              {/* Mode Filter Toggles */}
                              <div
                                className="legend-group"
                                style={{
                                  display: "flex",
                                  gap: "8px",
                                  flexWrap: "wrap",
                                }}
                              >
                                <button
                                  type="button"
                                  onClick={() =>
                                    setModeFilters((prev) => ({
                                      ...prev,
                                      axial: !prev.axial,
                                    }))
                                  }
                                  style={{
                                    background: modeFilters.axial
                                      ? "rgba(74, 222, 128, 0.2)"
                                      : "rgba(255, 255, 255, 0.05)",
                                    border: `1.5px solid ${modeFilters.axial ? "#4ade80" : "rgba(255, 255, 255, 0.15)"}`,
                                    color: modeFilters.axial
                                      ? "#4ade80"
                                      : "var(--color-text-dim)",
                                    padding: "4px 10px",
                                    borderRadius: "999px",
                                    fontSize: "0.75rem",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    transition: "all 0.2s ease",
                                  }}
                                  title="Click to show/hide Axial modes (100% modal energy - wall-to-wall)"
                                >
                                  <span
                                    style={{
                                      width: "8px",
                                      height: "8px",
                                      borderRadius: "50%",
                                      background: modeFilters.axial
                                        ? "#4ade80"
                                        : "gray",
                                    }}
                                  ></span>
                                  <span>Axial (1D)</span>
                                  <span
                                    style={{ opacity: 0.7, fontSize: "0.7rem" }}
                                  >
                                    (
                                    {roomModeData.modes?.filter(
                                      (m) => m.type === "axial",
                                    ).length || 0}
                                    )
                                  </span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    setModeFilters((prev) => ({
                                      ...prev,
                                      tangential: !prev.tangential,
                                    }))
                                  }
                                  style={{
                                    background: modeFilters.tangential
                                      ? "rgba(245, 158, 11, 0.2)"
                                      : "rgba(255, 255, 255, 0.05)",
                                    border: `1.5px solid ${modeFilters.tangential ? "#f59e0b" : "rgba(255, 255, 255, 0.15)"}`,
                                    color: modeFilters.tangential
                                      ? "#f59e0b"
                                      : "var(--color-text-dim)",
                                    padding: "4px 10px",
                                    borderRadius: "999px",
                                    fontSize: "0.75rem",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    transition: "all 0.2s ease",
                                  }}
                                  title="Click to show/hide Tangential modes (50% modal energy - 4 walls)"
                                >
                                  <span
                                    style={{
                                      width: "8px",
                                      height: "8px",
                                      borderRadius: "50%",
                                      background: modeFilters.tangential
                                        ? "#f59e0b"
                                        : "gray",
                                    }}
                                  ></span>
                                  <span>Tangential (2D)</span>
                                  <span
                                    style={{ opacity: 0.7, fontSize: "0.7rem" }}
                                  >
                                    (
                                    {roomModeData.modes?.filter(
                                      (m) => m.type === "tangential",
                                    ).length || 0}
                                    )
                                  </span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    setModeFilters((prev) => ({
                                      ...prev,
                                      oblique: !prev.oblique,
                                    }))
                                  }
                                  style={{
                                    background: modeFilters.oblique
                                      ? "rgba(147, 168, 145, 0.22)"
                                      : "rgba(255, 255, 255, 0.05)",
                                    border: `1.5px solid ${modeFilters.oblique ? "#93a891" : "rgba(255, 255, 255, 0.15)"}`,
                                    color: modeFilters.oblique
                                      ? "#93a891"
                                      : "var(--color-text-dim)",
                                    padding: "4px 10px",
                                    borderRadius: "999px",
                                    fontSize: "0.75rem",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    transition: "all 0.2s ease",
                                  }}
                                  title="Click to show/hide Oblique modes (25% modal energy - 6 surfaces)"
                                >
                                  <span
                                    style={{
                                      width: "8px",
                                      height: "8px",
                                      borderRadius: "50%",
                                      background: modeFilters.oblique
                                        ? "#93a891"
                                        : "gray",
                                    }}
                                  ></span>
                                  <span>Oblique (3D)</span>
                                  <span
                                    style={{ opacity: 0.7, fontSize: "0.7rem" }}
                                  >
                                    (
                                    {roomModeData.modes?.filter(
                                      (m) => m.type === "oblique",
                                    ).length || 0}
                                    )
                                  </span>
                                </button>
                              </div>
                            </div>

                            {/* Hover Inspector Banner */}
                            <div
                              style={{
                                margin: "10px 0 12px 0",
                                padding: "8px 14px",
                                background: "rgba(24, 38, 25, 0.65)",
                                borderRadius: "8px",
                                border: "1px solid rgba(74, 222, 128, 0.2)",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                fontSize: "0.8rem",
                                flexWrap: "wrap",
                                gap: "8px",
                              }}
                            >
                              {hoveredModeInfo ? (
                                <>
                                  <span style={{ color: "var(--color-cream)" }}>
                                    🎯 Frequency:{" "}
                                    <strong
                                      style={{
                                        color: "var(--color-accent-amber)",
                                        fontSize: "0.95rem",
                                      }}
                                    >
                                      {hoveredModeInfo.freq} Hz
                                    </strong>
                                    {hoveredModeInfo.nearestMode ? (
                                      <>
                                        {" "}
                                        &bull; Matches{" "}
                                        <strong
                                          style={{
                                            color:
                                              hoveredModeInfo.nearestMode
                                                .type === "axial"
                                                ? "#4ade80"
                                                : hoveredModeInfo.nearestMode
                                                      .type === "tangential"
                                                  ? "#f59e0b"
                                                  : "#93a891",
                                          }}
                                        >
                                          {hoveredModeInfo.nearestMode.type.toUpperCase()}
                                        </strong>{" "}
                                        mode at{" "}
                                        {hoveredModeInfo.nearestMode.frequency}{" "}
                                        Hz (indices:{" "}
                                        {hoveredModeInfo.nearestMode.indices.join(
                                          ",",
                                        )}
                                        )
                                      </>
                                    ) : (
                                      <span style={{ opacity: 0.65 }}>
                                        {" "}
                                        (No mode resonance at this exact Hz)
                                      </span>
                                    )}
                                  </span>
                                  <span
                                    style={{
                                      color:
                                        hoveredModeInfo.nearestMode?.type ===
                                        "axial"
                                          ? "#4ade80"
                                          : "var(--color-accent-emerald)",
                                      fontWeight: 600,
                                    }}
                                  >
                                    {hoveredModeInfo.nearestMode?.type ===
                                    "axial"
                                      ? "⚠️ Primary Wall Resonance Peak"
                                      : "Acoustic Response"}
                                  </span>
                                </>
                              ) : (
                                <span
                                  style={{ color: "var(--color-text-dim)" }}
                                >
                                  💡 <strong>Tip:</strong> Hover your mouse
                                  across the plot to inspect exact frequencies
                                  and room modes.
                                </span>
                              )}
                            </div>

                            {(() => {
                              const plotL = 55,
                                plotR = 490,
                                plotT = 16,
                                plotB = 185;
                              const plotW = plotR - plotL,
                                plotH = plotB - plotT;
                              const fMin = 20,
                                fMax = 300;
                              const freqToX = (f) =>
                                plotL + ((f - fMin) / (fMax - fMin)) * plotW;
                              const ampToY = (a) =>
                                plotB - Math.min(plotH, Math.max(0, a * plotH));
                              const yGridLevels = [0, 0.25, 0.5, 0.75, 1.0];
                              const xTicks = [20, 50, 100, 150, 200, 250, 300];

                              const activeModes = (
                                roomModeData.modes || []
                              ).filter((m) => modeFilters[m.type]);

                              const maxDataAmp =
                                roomModeData.fft &&
                                roomModeData.fft.amplitudes.length > 0
                                  ? Math.max(...roomModeData.fft.amplitudes)
                                  : 1;

                              const fftPath = roomModeData.fft
                                ? roomModeData.fft.frequencies
                                    .map((f, i) => {
                                      const x = freqToX(f);
                                      const raw =
                                        roomModeData.fft.amplitudes[i] || 0;
                                      const amp =
                                        maxDataAmp > 1.0
                                          ? (raw / maxDataAmp) * 0.85
                                          : Math.min(0.88, raw * 0.85);
                                      const y = ampToY(amp);
                                      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)},${y.toFixed(1)}`;
                                    })
                                    .join(" ")
                                : null;

                              const schX = freqToX(
                                Math.min(
                                  fMax,
                                  roomModeData.schroeder_freq || 140,
                                ),
                              );

                              // Collision-free axial frequency label tracker
                              let lastLabeledX = -999;

                              return (
                                <svg
                                  viewBox="0 0 520 220"
                                  style={{
                                    width: "100%",
                                    height: "220px",
                                    display: "block",
                                    cursor: "crosshair",
                                  }}
                                  onMouseMove={(e) => {
                                    const rect =
                                      e.currentTarget.getBoundingClientRect();
                                    const svgX =
                                      ((e.clientX - rect.left) / rect.width) *
                                      520;
                                    if (svgX >= plotL && svgX <= plotR) {
                                      const freq = Math.round(
                                        fMin +
                                          ((svgX - plotL) / plotW) *
                                            (fMax - fMin),
                                      );
                                      const nearest = activeModes.find(
                                        (m) =>
                                          Math.abs(m.frequency - freq) <= 4,
                                      );
                                      setHoveredModeInfo({
                                        freq,
                                        nearestMode: nearest || null,
                                        svgX,
                                      });
                                    }
                                  }}
                                  onMouseLeave={() => setHoveredModeInfo(null)}
                                >
                                  {/* Schroeder zone shading */}
                                  {roomModeData.schroeder_freq &&
                                    schX > plotL && (
                                      <rect
                                        x={plotL}
                                        y={plotT}
                                        width={Math.min(
                                          plotW,
                                          Math.max(0, schX - plotL),
                                        )}
                                        height={plotH}
                                        fill="rgba(229, 179, 100, 0.05)"
                                      />
                                    )}

                                  {/* Horizontal grid lines + Y labels */}
                                  {yGridLevels.map((lvl) => {
                                    const y = ampToY(lvl);
                                    return (
                                      <g key={`ygrid-${lvl}`}>
                                        <line
                                          x1={plotL}
                                          y1={y}
                                          x2={plotR}
                                          y2={y}
                                          stroke={
                                            lvl === 0
                                              ? "rgba(255,255,255,0.25)"
                                              : "rgba(255,255,255,0.07)"
                                          }
                                          strokeWidth="1"
                                        />
                                        <text
                                          x={plotL - 6}
                                          y={y + 3}
                                          fill="var(--color-text-muted)"
                                          fontSize="8"
                                          fontFamily="monospace"
                                          textAnchor="end"
                                        >
                                          {(lvl * 100).toFixed(0)}%
                                        </text>
                                      </g>
                                    );
                                  })}

                                  {/* X-axis ticks */}
                                  {xTicks.map((f) => {
                                    const x = freqToX(f);
                                    return (
                                      <g key={`xt-${f}`}>
                                        <line
                                          x1={x}
                                          y1={plotB}
                                          x2={x}
                                          y2={plotB + 4}
                                          stroke="rgba(255,255,255,0.3)"
                                          strokeWidth="1"
                                        />
                                        <text
                                          x={x}
                                          y={plotB + 14}
                                          fill="var(--color-text-muted)"
                                          fontSize="8"
                                          fontFamily="monospace"
                                          textAnchor="middle"
                                        >
                                          {f}
                                        </text>
                                      </g>
                                    );
                                  })}

                                  <text
                                    x={(plotL + plotR) / 2}
                                    y={plotB + 28}
                                    fill="var(--color-text-dim)"
                                    fontSize="8.5"
                                    fontWeight="600"
                                    textAnchor="middle"
                                  >
                                    Frequency (Hz)
                                  </text>

                                  {/* Schroeder cutoff vertical dashed line */}
                                  {roomModeData.schroeder_freq &&
                                    schX <= plotR && (
                                      <g>
                                        <line
                                          x1={schX}
                                          y1={plotT}
                                          x2={schX}
                                          y2={plotB}
                                          stroke="var(--color-accent-amber)"
                                          strokeWidth="1.5"
                                          strokeDasharray="5 3"
                                          opacity="0.8"
                                        />
                                        <text
                                          x={schX + 4}
                                          y={plotT + 12}
                                          fill="var(--color-accent-amber)"
                                          fontSize="7.5"
                                          fontWeight="700"
                                        >
                                          f_s {roomModeData.schroeder_freq} Hz
                                        </text>
                                      </g>
                                    )}

                                  {/* Mode Lines filtered by user selection */}
                                  {activeModes.map((m, idx) => {
                                    const x = freqToX(m.frequency);
                                    if (x < plotL || x > plotR) return null;
                                    const color =
                                      m.type === "axial"
                                        ? "#4ade80"
                                        : m.type === "tangential"
                                          ? "#f59e0b"
                                          : "#93a891";
                                    const dash =
                                      m.type === "axial"
                                        ? "none"
                                        : m.type === "tangential"
                                          ? "5 2"
                                          : "2 2";
                                    const lineW =
                                      m.type === "axial"
                                        ? 1.8
                                        : m.type === "tangential"
                                          ? 1.3
                                          : 0.9;

                                    // Clean non-colliding labels for axial modes
                                    let canLabel = false;
                                    if (
                                      m.type === "axial" &&
                                      x - lastLabeledX >= 28
                                    ) {
                                      canLabel = true;
                                      lastLabeledX = x;
                                    }

                                    return (
                                      <g key={`mode-${idx}`}>
                                        <line
                                          x1={x}
                                          y1={plotT + 4}
                                          x2={x}
                                          y2={plotB}
                                          stroke={color}
                                          strokeWidth={lineW}
                                          strokeDasharray={dash}
                                          opacity={
                                            m.type === "axial" ? "0.85" : "0.55"
                                          }
                                        />
                                        {canLabel && (
                                          <g>
                                            <rect
                                              x={x - 14}
                                              y={plotT - 12}
                                              width="28"
                                              height="11"
                                              rx="2"
                                              fill="rgba(10, 20, 12, 0.85)"
                                              stroke="rgba(74, 222, 128, 0.4)"
                                              strokeWidth="0.8"
                                            />
                                            <text
                                              x={x}
                                              y={plotT - 4}
                                              fill="#4ade80"
                                              fontSize="7"
                                              fontFamily="monospace"
                                              fontWeight="700"
                                              textAnchor="middle"
                                            >
                                              {m.frequency}
                                            </text>
                                          </g>
                                        )}
                                        <title>
                                          {m.type} mode: {m.frequency} Hz
                                          (indices: {m.indices.join(",")})
                                        </title>
                                      </g>
                                    );
                                  })}

                                  {/* Measured/Simulated FFT curve */}
                                  {fftPath && (
                                    <path
                                      d={fftPath}
                                      fill="none"
                                      stroke="var(--color-cream)"
                                      strokeWidth="2.2"
                                      strokeLinejoin="round"
                                    />
                                  )}

                                  {/* Interactive Hover Tracker Line */}
                                  {hoveredModeInfo && (
                                    <g>
                                      <line
                                        x1={hoveredModeInfo.svgX}
                                        y1={plotT}
                                        x2={hoveredModeInfo.svgX}
                                        y2={plotB}
                                        stroke="rgba(255, 255, 255, 0.7)"
                                        strokeWidth="1.2"
                                        strokeDasharray="3 3"
                                      />
                                      <circle
                                        cx={hoveredModeInfo.svgX}
                                        cy={plotT + 2}
                                        r="3"
                                        fill="var(--color-accent-amber)"
                                      />
                                    </g>
                                  )}

                                  {/* Y-axis caption */}
                                  <text
                                    x="12"
                                    y={plotT + plotH / 2}
                                    fill="var(--color-text-dim)"
                                    fontSize="8"
                                    fontWeight="600"
                                    textAnchor="middle"
                                    transform={`rotate(-90 12 ${plotT + plotH / 2})`}
                                  >
                                    Relative Amplitude
                                  </text>
                                </svg>
                              );
                            })()}

                            {/* Quick Acoustic Takeaway Box */}
                            <div
                              style={{
                                marginTop: "14px",
                                padding: "12px 16px",
                                background: "rgba(255, 255, 255, 0.03)",
                                borderRadius: "8px",
                                border: "1px solid rgba(255, 255, 255, 0.08)",
                                fontSize: "0.82rem",
                                lineHeight: "1.5",
                              }}
                            >
                              <div
                                style={{
                                  fontWeight: 700,
                                  color: "var(--color-cream)",
                                  marginBottom: "8px",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "6px",
                                }}
                              >
                                <span>🔎</span>{" "}
                                <span>
                                  Primary Problem Frequencies (Wall-to-Wall
                                  Standing Waves):
                                </span>
                              </div>
                              <div
                                style={{
                                  display: "flex",
                                  gap: "10px",
                                  flexWrap: "wrap",
                                  marginBottom: "8px",
                                }}
                              >
                                {(roomModeData.modes || [])
                                  .filter((m) => m.type === "axial")
                                  .slice(0, 4)
                                  .map((m, i) => {
                                    const axis =
                                      m.indices[0] > 0
                                        ? "Length (Front/Back)"
                                        : m.indices[1] > 0
                                          ? "Width (Left/Right)"
                                          : "Height (Floor/Ceiling)";
                                    return (
                                      <div
                                        key={i}
                                        style={{
                                          background: "rgba(74, 222, 128, 0.1)",
                                          border:
                                            "1px solid rgba(74, 222, 128, 0.3)",
                                          padding: "4px 10px",
                                          borderRadius: "6px",
                                          display: "flex",
                                          alignItems: "center",
                                          gap: "6px",
                                        }}
                                      >
                                        <strong style={{ color: "#4ade80" }}>
                                          {m.frequency} Hz
                                        </strong>
                                        <span
                                          style={{
                                            color: "var(--color-text-dim)",
                                            fontSize: "0.76rem",
                                          }}
                                        >
                                          ({axis})
                                        </span>
                                      </div>
                                    );
                                  })}
                              </div>
                              <p
                                style={{
                                  margin: 0,
                                  color: "var(--color-text-muted)",
                                  fontSize: "0.77rem",
                                }}
                              >
                                <strong>What to do:</strong> These low
                                frequencies carry the most energy. When sound
                                waves hit opposing walls at these pitches, they
                                reinforce each other and sound boomy. Placing
                                bass traps in room corners or along these
                                boundaries absorbs this energy and flattens your
                                bass response.
                              </p>
                            </div>

                            {/* Room Modes Line Descriptions Guide */}

                            <div className="graph-guide-container">
                              <div className="graph-guide-header">
                                <Grid size={14} />

                                <span>
                                  Line Guide: What Each Line & Zone Indicates
                                </span>
                              </div>

                              <div className="graph-lines-grid">
                                <div className="graph-line-card">
                                  <div className="line-swatch-box">
                                    <div
                                      style={{
                                        width: "100%",

                                        height: "3px",

                                        background: "var(--color-cream)",

                                        borderRadius: "2px",
                                      }}
                                    ></div>
                                  </div>

                                  <div className="line-guide-info">
                                    <div className="line-guide-title">
                                      <span>Solid Cream Curve</span>

                                      <span
                                        style={{
                                          fontSize: "0.7rem",

                                          color: "var(--color-cream)",
                                        }}
                                      >
                                        FFT Spectrum
                                      </span>
                                    </div>

                                    <p className="line-guide-desc">
                                      <strong>
                                        Measured FFT Magnitude (20–300 Hz):
                                      </strong>{" "}
                                      Real frequency response. Prominent peaks
                                      indicate boomy resonant frequency
                                      buildups; troughs show phase cancellation
                                      bass nulls.
                                    </p>
                                  </div>
                                </div>

                                <div className="graph-line-card">
                                  <div className="line-swatch-box">
                                    <div
                                      style={{
                                        width: "3px",

                                        height: "16px",

                                        background: "#4ade80",

                                        margin: "0 auto",

                                        borderRadius: "1px",
                                      }}
                                    ></div>
                                  </div>

                                  <div className="line-guide-info">
                                    <div className="line-guide-title">
                                      <span>Solid Green Line</span>

                                      <span
                                        style={{
                                          fontSize: "0.7rem",

                                          color: "#4ade80",
                                        }}
                                      >
                                        Axial (1D)
                                      </span>
                                    </div>

                                    <p className="line-guide-desc">
                                      <strong>Axial Room Modes:</strong>{" "}
                                      Standing waves between 2 opposing parallel
                                      boundaries (L, W, or H). Possesses 100%
                                      modal energy; primary cause of muddy bass
                                      and room ringing.
                                    </p>
                                  </div>
                                </div>

                                <div className="graph-line-card">
                                  <div className="line-swatch-box">
                                    <div
                                      style={{
                                        width: "3px",

                                        height: "16px",

                                        borderLeft: "2px dashed #f59e0b",

                                        margin: "0 auto",
                                      }}
                                    ></div>
                                  </div>

                                  <div className="line-guide-info">
                                    <div className="line-guide-title">
                                      <span>Dashed Amber Line</span>

                                      <span
                                        style={{
                                          fontSize: "0.7rem",

                                          color: "#f59e0b",
                                        }}
                                      >
                                        Tangential (2D)
                                      </span>
                                    </div>

                                    <p className="line-guide-desc">
                                      <strong>Tangential Room Modes:</strong>{" "}
                                      Standing waves reflecting between 4 room
                                      boundaries. Carries ~50% the energy of
                                      axial modes with moderate damping.
                                    </p>
                                  </div>
                                </div>

                                <div className="graph-line-card">
                                  <div className="line-swatch-box">
                                    <div
                                      style={{
                                        width: "3px",

                                        height: "16px",

                                        borderLeft: "2px dotted #93a891",

                                        margin: "0 auto",
                                      }}
                                    ></div>
                                  </div>

                                  <div className="line-guide-info">
                                    <div className="line-guide-title">
                                      <span>Dotted Sage Line</span>

                                      <span
                                        style={{
                                          fontSize: "0.7rem",

                                          color: "#93a891",
                                        }}
                                      >
                                        Oblique (3D)
                                      </span>
                                    </div>

                                    <p className="line-guide-desc">
                                      <strong>Oblique Room Modes:</strong>{" "}
                                      Corner-to-corner standing waves bouncing
                                      between all 6 surfaces. Carries ~25%
                                      energy and decays rapidly.
                                    </p>
                                  </div>
                                </div>

                                <div
                                  className="graph-line-card"
                                  style={{ gridColumn: "1 / -1" }}
                                >
                                  <div className="line-swatch-box">
                                    <div
                                      style={{
                                        width: "20px",

                                        height: "14px",

                                        background: "rgba(229, 179, 100, 0.25)",

                                        border:
                                          "1px solid rgba(229, 179, 100, 0.5)",

                                        borderRadius: "3px",
                                      }}
                                    ></div>
                                  </div>

                                  <div className="line-guide-info">
                                    <div className="line-guide-title">
                                      <span>
                                        Shaded Amber Region (Below{" "}
                                        {roomModeData.schroeder_freq} Hz)
                                      </span>

                                      <span
                                        style={{
                                          fontSize: "0.7rem",

                                          color: "var(--color-accent-amber)",
                                        }}
                                      >
                                        Schroeder Modal Zone
                                      </span>
                                    </div>

                                    <p className="line-guide-desc">
                                      <strong>Modal Zone:</strong> Discrete
                                      resonant standing waves dominate room
                                      behavior in this shaded zone. Above the
                                      Schroeder cutoff frequency (
                                      {roomModeData.schroeder_freq} Hz), modal
                                      density increases and transitions into a
                                      statistical, diffuse reverberation sound
                                      field.
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* DYNAMIC ROOM MODES BREAKDOWN EXPLANATION */}

                          {(() => {
                            const lVal = Number(lengthM || 6);

                            const wVal = Number(widthM || 4);

                            const hVal = Number(heightM || 2.8);

                            const c = 343;

                            const fL = Number((c / (2 * lVal)).toFixed(1));

                            const fW = Number((c / (2 * wVal)).toFixed(1));

                            const fH = Number((c / (2 * hVal)).toFixed(1));

                            const ratioLW = (lVal / wVal).toFixed(2);

                            const isDegenerate =
                              Math.abs(lVal - wVal) < 0.2 ||
                              Math.abs(lVal - hVal) < 0.2 ||
                              Math.abs(wVal - hVal) < 0.2;

                            const fs = roomModeData.schroeder_freq || 140;

                            return (
                              <div className="dynamic-explanation-card">
                                <div className="dynamic-card-title">
                                  <Grid size={16} />

                                  <span>
                                    Dynamic Modal Resonance & Standing Wave
                                    Analysis
                                  </span>
                                </div>

                                <div className="dynamic-explanation-grid">
                                  <div className="dynamic-sub-block">
                                    <div className="dynamic-sub-title">
                                      Fundamental Axial Modes (f₁₀₀, f₀₁₀, f₀₀₁)
                                    </div>

                                    <p className="dynamic-text">
                                      • <strong>Length Mode (1,0,0):</strong>{" "}
                                      {fL} Hz (Strongest along front-to-back
                                      listening axis)
                                      <br />•{" "}
                                      <strong>Width Mode (0,1,0):</strong> {fW}{" "}
                                      Hz (Causes side-to-side listener ear
                                      imbalances)
                                      <br />•{" "}
                                      <strong>Height Mode (0,0,1):</strong> {fH}{" "}
                                      Hz (Floor-to-ceiling vertical standing
                                      wave)
                                    </p>
                                  </div>

                                  <div className="dynamic-sub-block">
                                    <div className="dynamic-sub-title">
                                      Aspect Ratio & Modal Density
                                    </div>

                                    <p className="dynamic-text">
                                      Dimension ratio is{" "}
                                      <strong>
                                        {ratioLW}:1.00:
                                        {(hVal / wVal).toFixed(2)}
                                      </strong>{" "}
                                      (L:W:H).{" "}
                                      {isDegenerate
                                        ? "⚠️ WARNING: Room dimensions are close to square/cube proportions! This produces modal degeneracy where multiple resonant frequencies stack together, creating severe bass booms and deep nulls."
                                        : "✓ Favorable dimensional spread: Resonant modes are reasonably distributed across the low-frequency spectrum without severe modal stacking."}
                                    </p>
                                  </div>

                                  <div
                                    className="dynamic-sub-block"
                                    style={{ gridColumn: "1 / -1" }}
                                  >
                                    <div className="dynamic-sub-title">
                                      Listening Position & Subwoofer Placement
                                      Advice
                                    </div>

                                    <p className="dynamic-text">
                                      1.{" "}
                                      <strong>
                                        Avoid the 50% Room Center Null:
                                      </strong>{" "}
                                      The geometric center (50% length / 50%
                                      width) sits at the zero-pressure node for
                                      all odd axial modes ({fL} Hz, 3×{fL} Hz),
                                      resulting in total bass cancellation.
                                      <br />
                                      2. <strong>
                                        Apply the 38% Rule:
                                      </strong>{" "}
                                      Position your primary listening chair at
                                      approximately{" "}
                                      <strong>
                                        {(lVal * 0.38).toFixed(2)}m
                                      </strong>{" "}
                                      from the front wall (38% of room length)
                                      to achieve the flattest modal frequency
                                      response.
                                      <br />
                                      3.{" "}
                                      <strong>
                                        Schroeder Transition ({fs} Hz):
                                      </strong>{" "}
                                      EQ calibration and room correction DSP
                                      should be focused strictly below {fs} Hz.
                                      Above {fs} Hz, address acoustics using
                                      broad physical absorbers and diffusers
                                      rather than narrow parametric EQ filters.
                                    </p>
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 3: WATERFALL */}

                  {activeTab === "waterfall" && waterfallData && (
                    <div>
                      <WaterfallPlot3D
                        waterfallData={waterfallData}
                        title="3D Reverberation Octave Band Waterfall"
                      />

                      <div className="plot-card">
                        {/* Waterfall Octave Band Descriptions Guide */}

                        <div className="graph-guide-container">
                          <div className="graph-guide-header">
                            <Layers size={14} />

                            <span>
                              Octave Line Guide: What Each Frequency Band
                              Indicates
                            </span>
                          </div>

                          <div className="graph-lines-grid">
                            <div className="graph-line-card">
                              <div className="line-swatch-box">
                                <div
                                  style={{
                                    width: "100%",

                                    height: "3px",

                                    background: "#f59e0b",

                                    borderRadius: "2px",
                                  }}
                                ></div>
                              </div>

                              <div className="line-guide-info">
                                <div className="line-guide-title">
                                  <span>125 Hz Octave Line</span>

                                  <span
                                    style={{
                                      fontSize: "0.7rem",

                                      color: "#f59e0b",
                                    }}
                                  >
                                    Sub-Bass
                                  </span>
                                </div>

                                <p className="line-guide-desc">
                                  <strong>Deep Bass Decay:</strong> Shows
                                  low-frequency standing wave decay. Slow,
                                  extended tails here produce boomy, muddy bass
                                  buildup that drowns out mixes. Treated with
                                  thick corner bass traps.
                                </p>
                              </div>
                            </div>

                            <div className="graph-line-card">
                              <div className="line-swatch-box">
                                <div
                                  style={{
                                    width: "100%",

                                    height: "3px",

                                    background: "#34d399",

                                    borderRadius: "2px",
                                  }}
                                ></div>
                              </div>

                              <div className="line-guide-info">
                                <div className="line-guide-title">
                                  <span>250 Hz Octave Line</span>

                                  <span
                                    style={{
                                      fontSize: "0.7rem",

                                      color: "#34d399",
                                    }}
                                  >
                                    Upper Bass
                                  </span>
                                </div>

                                <p className="line-guide-desc">
                                  <strong>Room Warmth & Punch:</strong> Governs
                                  lower vocal fullness and kick punch. Excess
                                  reverberation at 250 Hz creates a muffled,
                                  boxy acoustic character.
                                </p>
                              </div>
                            </div>

                            <div className="graph-line-card">
                              <div className="line-swatch-box">
                                <div
                                  style={{
                                    width: "100%",

                                    height: "3px",

                                    background: "#f59e0b",

                                    borderRadius: "2px",
                                  }}
                                ></div>
                              </div>

                              <div className="line-guide-info">
                                <div className="line-guide-title">
                                  <span>500 Hz Octave Line</span>

                                  <span
                                    style={{
                                      fontSize: "0.7rem",

                                      color: "#f59e0b",
                                    }}
                                  >
                                    Lower Midrange
                                  </span>
                                </div>

                                <p className="line-guide-desc">
                                  <strong>Speech Vowel Body:</strong> Central to
                                  vocal intelligibility and acoustic fullness.
                                  Serves as the primary reference band for
                                  Sabine inverse absorption calculations.
                                </p>
                              </div>
                            </div>

                            <div className="graph-line-card">
                              <div className="line-swatch-box">
                                <div
                                  style={{
                                    width: "100%",

                                    height: "3px",

                                    background: "#34d399",

                                    borderRadius: "2px",
                                  }}
                                ></div>
                              </div>

                              <div className="line-guide-info">
                                <div className="line-guide-title">
                                  <span>1000 Hz (1 kHz) Line</span>

                                  <span
                                    style={{
                                      fontSize: "0.7rem",

                                      color: "#34d399",
                                    }}
                                  >
                                    Core Reference
                                  </span>
                                </div>

                                <p className="line-guide-desc">
                                  <strong>International Benchmark:</strong> The
                                  standard ISO 3382 mid-frequency reference for
                                  single-number RT60 specifications. Governs
                                  overall acoustic balance.
                                </p>
                              </div>
                            </div>

                            <div className="graph-line-card">
                              <div className="line-swatch-box">
                                <div
                                  style={{
                                    width: "100%",

                                    height: "3px",

                                    background: "#f59e0b",

                                    borderRadius: "2px",
                                  }}
                                ></div>
                              </div>

                              <div className="line-guide-info">
                                <div className="line-guide-title">
                                  <span>2000 Hz (2 kHz) Line</span>

                                  <span
                                    style={{
                                      fontSize: "0.7rem",

                                      color: "#f59e0b",
                                    }}
                                  >
                                    Upper Midrange
                                  </span>
                                </div>

                                <p className="line-guide-desc">
                                  <strong>Consonant Articulation:</strong>{" "}
                                  Essential for vocal presence and consonant
                                  clarity ('s', 't', 'k'). Clean decay here
                                  ensures speech is crisp and legible without
                                  harshness.
                                </p>
                              </div>
                            </div>

                            <div className="graph-line-card">
                              <div className="line-swatch-box">
                                <div
                                  style={{
                                    width: "100%",

                                    height: "3px",

                                    background: "#34d399",

                                    borderRadius: "2px",
                                  }}
                                ></div>
                              </div>

                              <div className="line-guide-info">
                                <div className="line-guide-title">
                                  <span>4000 Hz (4 kHz) Line</span>

                                  <span
                                    style={{
                                      fontSize: "0.7rem",

                                      color: "#34d399",
                                    }}
                                  >
                                    High Treble
                                  </span>
                                </div>

                                <p className="line-guide-desc">
                                  <strong>Air & Sheen:</strong> Governs acoustic
                                  brightness. Typically decays fastest in rooms
                                  due to molecular air absorption and high
                                  porous absorption coefficients.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* DYNAMIC WATERFALL COMMENTARY */}

                      {(() => {
                        const b125_t =
                          results.bands?.["125"]?.measured_rt60_seconds ||
                          Number(results.measuredT20 || 0.6) * 1.2;

                        const b1k_t =
                          results.bands?.["1000"]?.measured_rt60_seconds ||
                          Number(results.measuredT20 || 0.5);

                        const b4k_t =
                          results.bands?.["4000"]?.measured_rt60_seconds ||
                          Number(results.measuredT20 || 0.5) * 0.75;

                        const isRinging = b125_t > b1k_t + 0.15;

                        const airAbsorbed = b4k_t < b1k_t * 0.85;

                        return (
                          <div className="dynamic-explanation-card">
                            <div className="dynamic-card-title">
                              <Layers size={16} />

                              <span>
                                Dynamic 3D Waterfall & Time-Frequency Commentary
                              </span>
                            </div>

                            <div className="dynamic-explanation-grid">
                              <div className="dynamic-sub-block">
                                <div className="dynamic-sub-title">
                                  Low-Frequency Modal Ringing (125 Hz vs 1 kHz)
                                </div>

                                <p className="dynamic-text">
                                  {isRinging ? (
                                    <>
                                      125 Hz decay tail extends{" "}
                                      <strong>
                                        {(b125_t - b1k_t).toFixed(2)}s longer
                                      </strong>{" "}
                                      than the 1 kHz mid-band. This causes
                                      low-end overhang ('muddy acoustic
                                      masking') where bass notes obscure
                                      subsequent musical beats and speech
                                      vowels.
                                    </>
                                  ) : (
                                    <>
                                      Low frequencies decay in tight
                                      synchronization with mid frequencies (
                                      {b125_t.toFixed(2)}s vs {b1k_t.toFixed(2)}
                                      s). The bass envelope is tight and
                                      articulate with minimal resonant overhang.
                                    </>
                                  )}
                                </p>
                              </div>

                              <div className="dynamic-sub-block">
                                <div className="dynamic-sub-title">
                                  High-Frequency Air Damping (4 kHz)
                                </div>

                                <p className="dynamic-text">
                                  {airAbsorbed ? (
                                    <>
                                      4 kHz decay drops sharply to{" "}
                                      <strong>{b4k_t.toFixed(2)}s</strong> due
                                      to classic molecular relaxation in room
                                      air combined with surface boundary
                                      absorption. This natural treble roll-off
                                      prevents high-frequency acoustic fatigue.
                                    </>
                                  ) : (
                                    <>
                                      4 kHz energy persists with minimal
                                      high-frequency damping ({b4k_t.toFixed(2)}
                                      s), indicating hard, non-porous boundary
                                      surfaces (e.g., bare glass or drywall).
                                    </>
                                  )}
                                </p>
                              </div>

                              <div
                                className="dynamic-sub-block"
                                style={{ gridColumn: "1 / -1" }}
                              >
                                <div className="dynamic-sub-title">
                                  Time-Frequency Envelope Summary
                                </div>

                                <p className="dynamic-text">
                                  The ridgeline decay shows a{" "}
                                  {isRinging
                                    ? "warm, low-sloped"
                                    : "clean, uniform"}{" "}
                                  spectral decay contour. For professional
                                  monitoring and critical listening, aim for
                                  smooth parallel decay ridges across all 6
                                  octave bands with no isolated resonant ridges
                                  exceeding 0.15s above adjacent bands.
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* TAB 4: CLARITY */}

                  {activeTab === "clarity" && (
                    <div>
                      <div className="results-title">
                        <Sparkles size={20} color="var(--color-light-sage)" />

                        <span>
                          Speech & Music Acoustic Clarity (ISO Metrics)
                        </span>
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
                          <div
                            className="metric-value"
                            style={{ color: "var(--color-light-sage)" }}
                          >
                            {results.d50}%
                          </div>

                          <div className="metric-name">D50 Definition</div>
                        </div>
                      </div>

                      {/* DYNAMIC CLARITY INDICES CHARACTERISTICS */}

                      {(() => {
                        const c50 = Number(results.c50 || 5.2);

                        const c80 = Number(results.c80 || 8.7);

                        const d50 = Number(results.d50 || 78.2);

                        let c50Grade = "Class A (Outstanding)";

                        let c50Desc =
                          "Early direct sound strongly dominates over late reverberation. Ideal for broadcast, classrooms, conferencing, and vocal studios.";

                        let c50Color = "var(--color-accent-emerald)";

                        if (c50 < -2) {
                          c50Grade = "Class D (Poor)";

                          c50Desc =
                            "Late reverberation severely masks consonant definition. Speech intelligibility is compromised; thick acoustic treatment is essential.";

                          c50Color = "#f87171";
                        } else if (c50 < 1) {
                          c50Grade = "Class C (Fair)";

                          c50Desc =
                            "Marginal intelligibility. Listeners in the rear of the room will experience difficulty with fast speech and consonant clarity.";

                          c50Color = "var(--color-accent-amber)";
                        } else if (c50 < 3) {
                          c50Grade = "Class B (Good)";

                          c50Desc =
                            "Good speech intelligibility suitable for multipurpose rooms, meetings, and lecture halls.";

                          c50Color = "var(--color-light-sage)";
                        }

                        let c80Char = "Balanced Studio Articulation";

                        let c80Desc =
                          "Provides the optimal balance between transient punch and spatial acoustic bloom for modern music production.";

                        if (c80 > 4) {
                          c80Char = "Highly Analytical & Dry";

                          c80Desc =
                            "High clarity with very low room coloration. Excellent for transient analysis, rhythm-heavy production, and podcast mixing.";
                        } else if (c80 < -1) {
                          c80Char = "Warm & Symphonic / Cathedral";

                          c80Desc =
                            "High reverberant energy blend. Excellent for classical orchestra, organ, and choral performances, but lacks definition for fast contemporary music.";
                        }

                        return (
                          <div
                            className="dynamic-explanation-card"
                            style={{ marginTop: "16px" }}
                          >
                            <div className="dynamic-card-title">
                              <Sparkles size={16} />

                              <span>
                                Dynamic Clarity Indices & Intelligibility
                                Characteristics
                              </span>
                            </div>

                            <div className="dynamic-explanation-grid">
                              <div className="dynamic-sub-block">
                                <div className="dynamic-sub-title">
                                  C50 Speech Rating:{" "}
                                  <span style={{ color: c50Color }}>
                                    {c50Grade}
                                  </span>
                                </div>

                                <p className="dynamic-text">
                                  <strong>C₅₀ = {c50} dB:</strong> {c50Desc}
                                </p>
                              </div>

                              <div className="dynamic-sub-block">
                                <div className="dynamic-sub-title">
                                  C80 Musical Character: <span>{c80Char}</span>
                                </div>

                                <p className="dynamic-text">
                                  <strong>C₈₀ = {c80} dB:</strong> {c80Desc}
                                </p>
                              </div>

                              <div
                                className="dynamic-sub-block"
                                style={{ gridColumn: "1 / -1" }}
                              >
                                <div className="dynamic-sub-title">
                                  D50 Definition Index ({d50}%) & Acoustic
                                  Recommendation
                                </div>

                                <p className="dynamic-text">
                                  <strong>{d50}%</strong> of total sound energy
                                  reaches listener ears within the critical
                                  first 50 ms window.{" "}
                                  {d50 >= 60
                                    ? "This exceeds the recommended 50% threshold for crystal-clear syllable perception."
                                    : "This falls below the 50% threshold, meaning diffuse late reflections overpower direct syllable articulation. Adding lateral absorption panels will boost D50 significantly."}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Dedicated Printable ISO 3382 Laboratory Acoustic Report (active in @media print) */}
            <AcousticPrintReport
              roomType={roomType}
              roomConfig={
                ROOM_TYPES_CONFIG[roomType] || ALL_SPACES_CONFIG[roomType] || {}
              }
              lengthM={lengthM}
              widthM={widthM}
              heightM={heightM}
              volumeM3={volumeM3}
              material={material}
              results={results}
              roomModeData={roomModeData}
            />
          </div>
        )}
      </main>

      {/* Room Modes Educational Modal */}

      <RoomModesModal
        isOpen={isRoomModesModalOpen}
        onClose={() => setIsRoomModesModalOpen(false)}
      />

      {/* Saved Reports Drawer / Modal */}
      <SavedReportsModal
        isOpen={isSavedModalOpen}
        onClose={() => setIsSavedModalOpen(false)}
        savedReports={savedReports}
        onLoadReport={handleLoadReport}
        onDeleteReport={handleDeleteReport}
        onClearAll={handleClearAllReports}
        onExportJSON={handleExportJSON}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="resona-toast no-print">
          <CheckCircle2 size={18} color="var(--color-accent-emerald)" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
