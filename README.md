# CareRoute 🚑
### Smart Ambulance Decision-Support System

> Recommending the most suitable hospital during emergencies — not just the nearest one.

---

## What is CareRoute?

Most ambulances go to the nearest hospital. CareRoute goes to the **right** one.

It evaluates every nearby hospital in real time based on patient vitals, ICU availability, specialist match, live traffic, and predicted bed availability — then recommends the best option with a full AI-generated explanation of why.

---

## Features

- 🧠 **AI Reasoning Engine** — Explains why a hospital was selected and why others were rejected
- 🔄 **Autonomous Rerouting** — Detects mid-route capacity changes and switches destination automatically
- 🎙️ **Voice-Captured Vitals** — Paramedic speaks vitals hands-free, system transcribes in real time
- 📍 **Distance & travel-time calculation** — Live traffic-aware routing
- 📊 **Predictive bed availability** — Forecasts capacity 15 minutes ahead
- 📡 **Ambulance-to-hospital communication** — Pre-alert sending before arrival

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js |
| Backend | Node.js, Express |
| AI Reasoning | OpenAI API |
| Voice Transcription | OpenAI Whisper (gpt-4o-mini-transcribe) |
| Database | JSON (simulation) |
| Communication | EventEmitter |
| Containerization | Docker, Docker Compose |
| Orchestration | Kubernetes (Minikube) |

---

## Project Structure
smart-ambulance/
│
├── frontend/                  # React dashboard UI
│   ├── components/
│   │   ├── Vitals.js          # Patient vitals display
│   │   ├── HospitalList.js    # Ranked hospital recommendations
│   │   ├── MapView.js         # Live route map
│   │   └── Buttons.js         # Emergency controls
│   ├── App.js
│   ├── api.js                 # API integration layer
│   └── Dockerfile
│
├── backend/                   # Node.js server
│   ├── server.js
│   ├── routes.js
│   ├── simulation.js          # Hospital capacity simulation
│   └── Dockerfile
│
├── logic/
│   └── recommendation.js      # Scoring & ranking engine
│
├── database/
│   └── hospitals.json         # Hospital dataset
│
├── k8s/                        # Kubernetes manifests
│   ├── backend-deployment.yaml
│   ├── backend-service.yaml
│   ├── frontend-deployment.yaml
│   └── frontend-service.yaml
│
├── docker-compose.yml
└── README.md

---

## Setup & Installation

### Option 1: Run locally (no containers)

**1. Install dependencies**
```bash
npm install
```

**2. Start the backend (Terminal 1)**
```bash
cd backend
node server.js
```
Backend runs at: `http://localhost:5000`

**3. Start the frontend (Terminal 2)**
```bash
cd frontend
npm install
npm start
```
Frontend runs at: `http://localhost:8000`

### Option 2: Run with Docker Compose

```bash
docker-compose up --build
```
This builds and runs both frontend and backend containers together, with the same port mapping as above.

---

## Deployment (Docker + Kubernetes)

CareRoute's backend and frontend are containerized with Docker and can be deployed on Kubernetes for scalable, self-healing orchestration instead of running as single processes.

**Why Kubernetes here:** running multiple replicas of each service means one crashing pod doesn't take down the app — Kubernetes automatically restarts it. It also makes the deployment declarative (the desired state lives in YAML, not in manual terminal commands) and mirrors how this stack would run in a real production environment on a managed cluster (EKS/GKE/AKS) instead of just a laptop.

### Prerequisites
- Docker Desktop
- [Minikube](https://minikube.sigs.k8s.io/docs/start/)
- kubectl

### Steps

**1. Start Minikube**
```bash
minikube start --driver=docker
```

**2. Build images inside Minikube's Docker environment**
```bash
minikube docker-env | Invoke-Expression   # PowerShell
# or: eval $(minikube docker-env)          # bash/zsh

docker build -t careroute-backend:latest -f backend/Dockerfile .
docker build -t careroute-frontend:latest ./frontend
```

**3. Apply the Kubernetes manifests**
```bash
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/backend-service.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/frontend-service.yaml
```

**4. Verify pods are running**
```bash
kubectl get pods
```
You should see 2 backend and 2 frontend pods in `Running` state.

**5. Access the app**
```bash
minikube service careroute-frontend-svc --url
```
Open the printed URL in your browser.

### Architecture

| Component | Replicas | Port | Service Type |
|-----------|----------|------|---------------|
| Backend   | 2        | 5000 | NodePort |
| Frontend  | 2        | 8000 | NodePort |

### Known limitation

The frontend currently points to the backend via a directly configured URL rather than service-discovery/env-based config, since the frontend runs client-side in the browser and can't resolve internal Kubernetes DNS names. In a production setup, this would be solved with an **Ingress controller** and a proper external DNS name, or by injecting the backend URL at build/runtime via environment variables. This is documented here as a deliberate next step rather than an oversight.

---

## Voice Input Setup

Voice input runs in **demo mode by default** — no API key required for presentations. The browser records a short clip, the backend returns a sample transcript, and parsed values auto-fill the vitals dashboard.

**For real speech-to-text**, create a `.env` file in the root directory:
OPENAI_API_KEY=your_api_key_here
OPENAI_TRANSCRIPTION_MODEL=gpt-4o-mini-transcribe

**Optional environment variables:**
```bash
# Force demo mode even when API key exists
VOICE_TRANSCRIPTION_MODE=mock

# Override the demo transcript
MOCK_VOICE_TRANSCRIPT="Patient is unconscious, heart rate 130, oxygen level 82, blood pressure 90 over 60, temperature 101, possible cardiac emergency."
```

> **Note:** Microphone access requires `localhost` or an HTTPS deployment in modern browsers.

**How to use:** Click **Start Voice Capture** → speak patient vitals → click **Stop and Process** (or wait 10 seconds). Recognized values update the dashboard automatically.

---

## How the Recommendation Engine Works

Each hospital is scored based on:

- ICU and ventilator availability
- Specialist match for the patient's condition
- Distance and travel time
- Live traffic conditions
- Predicted bed availability (next 15 minutes)
- Current emergency load

The highest-scoring hospital is recommended with a full explanation. Rejected hospitals show specific reasons — full capacity, missing specialty, high traffic, or lower suitability score.

---

## API Reference

**Recommend a hospital:**
POST /api/hospitals/recommend
```json
{
  "severity": "CRITICAL",
  "requiredSpecialty": "cardiology",
  "location": {
    "lat": 28.61,
    "lng": 77.20
  }
}
```

---

## Adding Your Own Hospital Data

Edit `database/hospitals.json`. Each record should follow this format:

```json
{
  "name": "City Heart Hospital",
  "location": { "lat": 28.61, "lng": 77.20 },
  "icu_total": 20,
  "icu_available": 5,
  "ventilators_total": 10,
  "ventilators_available": 3,
  "specialists": {
    "cardiologist": 2,
    "neurologist": 1,
    "trauma": 3
  },
  "status": "available",
  "bedTrendPer15Min": 0
}
```

Restart the backend after updating the file.

---

## Future Scope

- Google Maps / real routing API integration
- Live hospital API connections
- Voice-to-vitals automatic dashboard sync
- Wearable & IoT vitals integration
- Multi-city deployment
- Ayushman Bharat Digital Mission integration
- Ingress-based routing to remove hardcoded backend URL
- CI/CD pipeline for automated build and deploy to Kubernetes

---

## Team

**AlgoAllies** — Built for hackathon, designed for real-world impact.

---

*For academic and hackathon use only.*