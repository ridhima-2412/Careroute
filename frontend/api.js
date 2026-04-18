// api.js — Frontend API service layer
// Connects to Node.js backend (or uses mock data in prototype mode)

const BASE_URL = "http://localhost:5000/api";
const MOCK_MODE = false;

// ──────────────────────────────────────────
// Mock Data
// ──────────────────────────────────────────
const MOCK_HOSPITALS = [
  {
    id: 1,
    name: "AIIMS Trauma Centre",
    lat: 28.5672,
    lng: 77.21,
    distance: "2.1 km",
    eta: "4 min",
    icuBeds: 3,
    ventilators: 2,
    specialists: ["Cardiology", "Neurology", "Trauma"],
    score: 94,
    status: "AVAILABLE",
    traffic: "Low",
    waitTime: "< 5 min",
    contact: "+91-11-26588500",
  },
  {
    id: 2,
    name: "Safdarjung Hospital",
    lat: 28.5687,
    lng: 77.206,
    distance: "3.8 km",
    eta: "9 min",
    icuBeds: 1,
    ventilators: 0,
    specialists: ["General Surgery", "Ortho"],
    score: 61,
    status: "LIMITED",
    traffic: "High",
    waitTime: "15–20 min",
    contact: "+91-11-26165060",
  },
  {
    id: 3,
    name: "RML Hospital",
    lat: 28.6289,
    lng: 77.2065,
    distance: "5.2 km",
    eta: "13 min",
    icuBeds: 5,
    ventilators: 4,
    specialists: ["Cardiology", "Neuro ICU", "Burns"],
    score: 87,
    status: "AVAILABLE",
    traffic: "Moderate",
    waitTime: "8 min",
    contact: "+91-11-23404040",
  },
  {
    id: 4,
    name: "GTB Hospital",
    lat: 28.6817,
    lng: 77.295,
    distance: "7.4 km",
    eta: "19 min",
    icuBeds: 0,
    ventilators: 0,
    specialists: ["General"],
    score: 22,
    status: "FULL",
    traffic: "High",
    waitTime: "> 30 min",
    contact: "+91-11-22924000",
  },
];

const MOCK_VITALS = () => ({
  heartRate: Math.floor(Math.random() * 60 + 70),
  spo2: Math.floor(Math.random() * 8 + 92),
  bpSystolic: Math.floor(Math.random() * 40 + 110),
  bpDiastolic: Math.floor(Math.random() * 20 + 70),
  respRate: Math.floor(Math.random() * 10 + 14),
  temp: parseFloat((Math.random() * 2 + 36.5).toFixed(1)),
  gcs: Math.floor(Math.random() * 5 + 10),
  timestamp: new Date().toISOString(),
});

// ──────────────────────────────────────────
// Helper
// ──────────────────────────────────────────
async function apiFetch(endpoint, options = {}) {
  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error(`[API] ${endpoint} failed:`, err.message);
    throw err;
  }
}

// ──────────────────────────────────────────
// Hospital APIs
// ──────────────────────────────────────────

/**
 * Get ranked list of nearby hospitals
 * @param {Object} params - { lat, lng, severity, patientVitals }
 */
export async function getHospitalRecommendations(params = {}) {
  if (MOCK_MODE) {
    await delay(300);
    return { success: true, hospitals: MOCK_HOSPITALS };
  }
  const response = await apiFetch("/hospitals/recommend", {
    method: "POST",
    body: JSON.stringify({
      severity: params.severity,
      specialty: params.specialty || params.requiredSpecialty,
      location: params.location || {
        lat: params.lat,
        lng: params.lng,
      },
      patientVitals: params.patientVitals || params.vitals,
    }),
  });
  return {
    success: response.success,
    recommendation: response.recommendation,
    hospitals: response.hospitals || [],
    severity: response.severity,
    specialty: response.specialty,
  };
}

/**
 * Send pre-alert to specific hospital with patient vitals
 */
export async function sendPreAlert(hospitalId, patientData) {
  if (MOCK_MODE) {
    await delay(500);
    console.log(`[MOCK] Pre-alert sent to hospital ${hospitalId}`, patientData);
    return { success: true, message: "Pre-alert sent successfully", hospitalId };
  }
  return apiFetch(`/hospitals/${hospitalId}/prealert`, {
    method: "POST",
    body: JSON.stringify({
      ...patientData,
      vitals: patientData.vitals || patientData.patientVitals || patientData,
    }),
  });
}

/**
 * Broadcast SOS to all hospitals in range
 */
export async function broadcastSOS(caseData) {
  if (MOCK_MODE) {
    await delay(700);
    console.log("[MOCK] SOS broadcast sent to all hospitals", caseData);
    return { success: true, alerted: MOCK_HOSPITALS.length, message: "SOS sent to 4 hospitals" };
  }
  return apiFetch("/hospitals/sos", {
    method: "POST",
    body: JSON.stringify(caseData),
  });
}

// ──────────────────────────────────────────
// Vitals APIs
// ──────────────────────────────────────────

/**
 * Get latest patient vitals (real device or simulation)
 */
export async function getLatestVitals(caseId) {
  if (MOCK_MODE) {
    await delay(100);
    return { success: true, vitals: MOCK_VITALS() };
  }
  return apiFetch(`/vitals/${caseId}/latest`);
}

/**
 * Submit vitals to backend (for logging + forwarding to hospital)
 */
export async function submitVitals(caseId, vitals) {
  if (MOCK_MODE) {
    await delay(200);
    return { success: true };
  }
  return apiFetch(`/vitals/${caseId}`, {
    method: "POST",
    body: JSON.stringify(vitals),
  });
}

// ──────────────────────────────────────────
// Routing APIs
// ──────────────────────────────────────────

/**
 * Get optimized route from current position to hospital
 */
export async function getRoute(origin, destinationId) {
  if (MOCK_MODE) {
    await delay(400);
    return {
      success: true,
      route: {
        eta: "4 min",
        distance: "2.1 km",
        trafficLevel: "Low",
        waypoints: [
          { lat: 28.6129, lng: 77.2295 },
          { lat: 28.598, lng: 77.222 },
          { lat: 28.5788, lng: 77.216 },
          { lat: 28.5672, lng: 77.21 },
        ],
      },
    };
  }
  return apiFetch("/route/optimize", {
    method: "POST",
    body: JSON.stringify({
      origin,
      destinationId,
      location: origin,
    }),
  });
}

// ──────────────────────────────────────────
// Severity / ML APIs
// ──────────────────────────────────────────

/**
 * Get severity classification from rule-based engine
 */
export async function getSeverityScore(vitals) {
  if (MOCK_MODE) {
    await delay(150);
    const { heartRate, spo2, gcs } = vitals;
    let score = "STABLE";
    let probability = 87;
    if (gcs < 9 || spo2 < 88 || heartRate > 150) {
      score = "CRITICAL";
      probability = 42;
    } else if (gcs < 13 || spo2 < 93 || heartRate > 130) {
      score = "MODERATE";
      probability = 68;
    }
    return { success: true, severity: score, survivalProbability: probability };
  }
  return apiFetch("/logic/severity", {
    method: "POST",
    body: JSON.stringify({ vitals }),
  });
}

// ──────────────────────────────────────────
// Utility
// ──────────────────────────────────────────
function delay(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

export default {
  getHospitalRecommendations,
  sendPreAlert,
  broadcastSOS,
  getLatestVitals,
  submitVitals,
  getRoute,
  getSeverityScore,
};
