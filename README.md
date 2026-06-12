# Careroute
# 🚑 Smart Ambulance Decision-Support System

## 📌 Overview

The **Smart Ambulance Decision-Support System** recommends the most suitable hospital during emergencies using intelligent decision logic instead of simply choosing the nearest one.

---

## 🏗️ Project Structure & Team Distribution

```plaintext
smart-ambulance/
│
├── frontend/                     👤 Person 1 (UI Developer)
│   ├── components/
│   │   ├── Vitals.js
│   │   ├── HospitalList.js
│   │   ├── MapView.js
│   │   └── Buttons.js
│   ├── App.js
│   └── api.js                   👤 Person 5 (Integration)
│
├── backend/                     👤 Person 2 (Backend Developer)
│   ├── server.js
│   ├── routes.js
│   └── simulation.js            👤 Person 5 (Integration support)
│
├── logic/                       👤 Person 3 (Logic / ML)
│   └── recommendation.js
│
├── database/                    👤 Person 4 (Data)
│   └── hospitals.json
│
├── docs/                        👤 (Optional – any member)
│   └── architecture.md
│
├── README.md
└── package.json
```

---

## 🎯 Key Features

* 🧠 Severity-based decision engine
* 🏥 Smart hospital recommendation
* 📍 Distance & travel-time calculation
* 🔄 Real-time simulation of hospital capacity
* 📊 Predictive bed availability
* 📡 Communication between ambulance & hospital
* 🎙️ Voice-assisted vitals capture with automatic form filling

---

## 🛠️ Tech Stack

* **Frontend:** React.js
* **Backend:** Node.js, Express
* **Database:** JSON (simulation)
* **Logic Layer:** Rule-based ML scoring system
* **Communication:** EventEmitter

---

## ⚙️ Setup Instructions

```bash
1️⃣ Install dependencies
npm install
2️⃣ Run Backend (Terminal 1)
cd backend
node server.js

Backend runs on:
 http://localhost:5000

3️⃣ Run Frontend (Terminal 2)
cd frontend
npm install
npm start

Frontend runs on :
  http://localhost:8000
```

### Voice Input Setup

Voice input works in **demo mode by default**, so no API key is required for a
hackathon presentation. The browser records a short clip, the backend returns a
sample emergency transcript, and the parsed values fill the vitals dashboard.

For real speech-to-text, add an OpenAI API key before starting the backend:

```powershell
$env:OPENAI_API_KEY="your-api-key"
npm run backend
```

Optional voice environment variables:

```powershell
# Force the presentation-safe mock even when an API key exists
$env:VOICE_TRANSCRIPTION_MODE="mock"

# Override the mock sentence used by the demo
$env:MOCK_VOICE_TRANSCRIPT="Patient is unconscious, heart rate 130, oxygen level 82, blood pressure 90 over 60, temperature 101, possible cardiac emergency."

# Override the transcription model
$env:OPENAI_TRANSCRIPTION_MODEL="gpt-4o-mini-transcribe"
```

Allow microphone permission when prompted. Microphone capture requires
`localhost` or an HTTPS deployment in modern browsers. Click **Speak Vitals**,
dictate the patient status, then click again to stop (or wait 10 seconds).

The backend extracts heart rate, SpO2, blood pressure, respiratory rate,
temperature, consciousness/GCS, and the suspected emergency type. Fahrenheit
temperatures such as `101` are converted to Celsius for the dashboard.


---

## 🧪 API Example

### POST `/api/hospitals/recommend`

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

## 🧠 How It Works

The system evaluates hospitals based on:

* ICU & ventilator availability
* Specialist availability
* Distance & travel time
* Predicted future capacity

Each hospital is scored and ranked, and the best one is selected.

---

## 🎤 Hackathon Pitch

> “We built a smart ambulance routing system that uses a severity-aware decision engine to recommend the most suitable hospital based on real-time resources, specialties, and travel constraints.”

---

## 🚀 Future Scope

* Google Maps integration
* Real-time hospital APIs
* ML model-based prediction
* Live tracking dashboard

---

## 📜 License

For academic and hackathon use only.

---

## CareRoute Emergency Dashboard

The frontend is designed as a professional ambulance operations dashboard
focused on decisions that matter during transport:

* **Patient condition:** risk level, survival outlook, required specialty, and large-format vital readings.
* **Voice vitals:** microphone capture, transcription confirmation, and automatic vital updates.
* **Recommended destination:** best hospital, ETA, score, ICU beds, ventilators, and emergency load.
* **Decision explanation:** human-readable selection and rejection reasons.
* **Live route:** destination, traffic, distance, and capacity-aware rerouting.
* **Hospital communication:** receiving-alert status and continuous capacity monitoring.

### Voice Vitals

Click **Start Voice Capture**, speak the patient condition and vitals, then
click **Stop and Process** or wait ten seconds. The transcript is shown for
confirmation and recognized values update the dashboard.

Microphone access requires `http://localhost` or an HTTPS deployment. For real
transcription, add this to the root `.env` file:

```env
OPENAI_API_KEY=your_api_key_here
OPENAI_TRANSCRIPTION_MODEL=gpt-4o-mini-transcribe
```

Without an API key, the backend uses presentation-safe demo transcription.

### Recommendation Explanation

CareRoute ranks hospitals using clinical severity, specialty match,
critical-care resources, predicted availability, travel distance, traffic, and
hospital load. The dashboard explains why the selected hospital is preferred
and why alternatives were deprioritized, such as:

* No ICU bed currently available.
* No ventilator currently available.
* Required emergency specialty not confirmed.
* High traffic or longer effective transfer time.
* Lower overall suitability score for the current patient.

### Hospital Dataset Integration

Hospital records are loaded from `database/hospitals.json`. A record can use:

```json
{
  "name": "City Heart Hospital",
  "location": { "lat": 28.61, "lng": 77.2 },
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

To integrate another dataset:

1. Normalize resource counts to numbers.
2. Add `location.lat` and `location.lng` when coordinates are available.
3. Use `available`, `limited`, or `full` for `status`.
4. Map specialist counts under `specialists`.
5. Restart the backend after changing the JSON file.

The backend supplies fallback coordinates when a record has no `location`
field, so incomplete hackathon datasets remain demoable.
