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
npm install
node backend/server.js
```

Server runs on:

```
http://localhost:5000
```

---

## 🧪 API Example

### POST `/recommend-hospital`

```json
{
  "severity": "high",
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
