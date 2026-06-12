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
