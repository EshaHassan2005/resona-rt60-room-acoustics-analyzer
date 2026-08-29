# Resona - RT60 Room Acoustics Analyzer

[![Frontend](https://img.shields.io/badge/Frontend-Vercel-black?logo=vercel)](https://resona-rt60-room-acoustics-analyzer.vercel.app)
[![Backend](https://img.shields.io/badge/Backend-Render-46E3B7?logo=render)](https://resona-rt60-room-acoustics-analyzer.onrender.com)

Resona is a web-based room acoustics analyzer. It measures RT60 reverberation time, identifies room modes, and generates acoustic treatment recommendations based on uploaded audio or room dimensions.

---

## Live Deployment

| Service  | URL |
|----------|-----|
| Frontend | https://resona-rt60-room-acoustics-analyzer.vercel.app |
| Backend  | https://resona-rt60-room-acoustics-analyzer.onrender.com |

---

## Tech Stack

**Frontend**
- React 19 + Vite 8
- Lucide React (icons)
- Vanilla CSS

**Backend**
- Flask 3.1 (Python)
- Librosa - audio analysis and RT60 measurement
- NumPy, SciPy, Numba - DSP and signal processing
- scikit-learn - ML utilities
- Gunicorn - production WSGI server

---

## Project Structure

```
Resona/
├── Backend/
│   ├── app.py            # API routes: /treatment, /roommodes, /waterfall
│   ├── dsp.py            # RT60 and DSP algorithms
│   ├── audio_utils.py    # Audio I/O helpers
│   ├── treatment.py      # Acoustic treatment recommendations
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── components/
    │   └── styles/
    ├── .env              # VITE_API_URL (local dev only)
    └── package.json
```

---

## Local Development

**Backend**

```bash
cd Backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
python app.py
# API available at http://localhost:5000
```

**Frontend**

```bash
cd frontend
npm install
echo VITE_API_URL=http://localhost:5000 > .env
npm run dev
# App available at http://localhost:5173
```

---

## Environment Variables

| Variable       | Description           | Production value |
|----------------|-----------------------|-----------------|
| `VITE_API_URL` | Backend API base URL  | `https://resona-rt60-room-acoustics-analyzer.onrender.com` |

Set this in the Vercel project dashboard under **Settings > Environment Variables**.