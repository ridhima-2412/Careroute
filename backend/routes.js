const express = require('express');
const path = require('path');

const rawHospitals = require(path.join(__dirname, '..', 'database', 'hospitals.json'));
const { calculateRecommendationScore } = require(path.join(
  __dirname,
  '..',
  'logic',
  'recommendation'
));
const { createSimulationEngine } = require('./simulation');

const DEFAULT_LOCATION = { lat: 28.6139, lng: 77.209 };
const FALLBACK_HOSPITAL_LOCATIONS = [
  { lat: 28.5672, lng: 77.21 },
  { lat: 28.5687, lng: 77.206 },
  { lat: 28.6289, lng: 77.2065 },
  { lat: 28.6817, lng: 77.295 },
];

const router = express.Router();
const hospitals = rawHospitals.map(normalizeHospital);
const simulationEngine = createSimulationEngine(hospitals);
const latestVitalsByCase = new Map();

function normalizeHospital(rawHospital, index) {
  const location =
    rawHospital.location ||
    FALLBACK_HOSPITAL_LOCATIONS[index] ||
    {
      lat: Number((DEFAULT_LOCATION.lat + index * 0.01).toFixed(4)),
      lng: Number((DEFAULT_LOCATION.lng + index * 0.01).toFixed(4)),
    };

  const specialties = Array.isArray(rawHospital.specialties)
    ? rawHospital.specialties.map((specialty) => String(specialty).toLowerCase())
    : Object.keys(rawHospital.specialists || {}).map(mapSpecialistKey);

  const status = normalizeHospitalStatus(rawHospital);

  return {
    ...rawHospital,
    id: rawHospital.id ?? `hospital-${index + 1}`,
    name: rawHospital.name || `Hospital ${index + 1}`,
    location,
    icuBeds: rawHospital.icuBeds ?? rawHospital.icu_available ?? 0,
    ventilators: rawHospital.ventilators ?? rawHospital.ventilators_available ?? 0,
    totalBeds: rawHospital.totalBeds ?? rawHospital.icu_total ?? Math.max(rawHospital.icu_available ?? 0, 1),
    totalVentilators:
      rawHospital.totalVentilators ??
      rawHospital.ventilators_total ??
      Math.max(rawHospital.ventilators_available ?? 0, 1),
    specialties: specialties.length > 0 ? specialties : ['general'],
    status,
    bedTrendPer15Min: rawHospital.bedTrendPer15Min ?? 0,
  };
}

function mapSpecialistKey(key) {
  const value = String(key).toLowerCase();

  if (value.includes('cardio')) {
    return 'cardiology';
  }

  if (value.includes('neuro')) {
    return 'neurology';
  }

  if (value.includes('trauma')) {
    return 'trauma';
  }

  return 'general';
}

function normalizeHospitalStatus(hospital) {
  const status = String(hospital.status || '').toLowerCase();

  if (status) {
    return status;
  }

  if ((hospital.icu_available ?? 0) > 0 || (hospital.ventilators_available ?? 0) > 0) {
    return 'available';
  }

  return 'full';
}

function normalizeSeverity(value) {
  const severity = String(value || '').toLowerCase();

  if (['critical', 'high'].includes(severity)) {
    return 'high';
  }

  if (['moderate', 'medium'].includes(severity)) {
    return 'medium';
  }

  return 'low';
}

function normalizeSpecialty(value) {
  const specialty = String(value || 'general').toLowerCase();

  if (specialty.includes('cardio')) {
    return 'cardiology';
  }

  if (specialty.includes('trauma')) {
    return 'trauma';
  }

  if (specialty.includes('neuro')) {
    return 'neurology';
  }

  return 'general';
}

function isValidLocation(location) {
  return (
    location &&
    typeof location.lat === 'number' &&
    typeof location.lng === 'number' &&
    Number.isFinite(location.lat) &&
    Number.isFinite(location.lng)
  );
}

function resolveLocation(payload = {}) {
  if (isValidLocation(payload.location)) {
    return payload.location;
  }

  if (typeof payload.lat === 'number' && typeof payload.lng === 'number') {
    return { lat: payload.lat, lng: payload.lng };
  }

  return DEFAULT_LOCATION;
}

function deriveSeverityFromVitals(vitals = {}) {
  if (vitals.gcs < 9 || vitals.spo2 < 90 || vitals.heartRate > 140) {
    return 'high';
  }

  if (vitals.gcs < 13 || vitals.spo2 < 94 || vitals.heartRate > 120) {
    return 'medium';
  }

  return 'low';
}

function buildSeverityResponse(vitals = {}) {
  const severity = deriveSeverityFromVitals(vitals);
  const survivalProbability = clampSurvivalProbability(vitals);

  return {
    severity,
    survivalProbability,
  };
}

function clampSurvivalProbability(vitals) {
  let probability = 92;

  if (typeof vitals.spo2 === 'number') {
    probability -= Math.max(0, 95 - vitals.spo2) * 2;
  }

  if (typeof vitals.gcs === 'number') {
    probability -= Math.max(0, 12 - vitals.gcs) * 4;
  }

  if (typeof vitals.heartRate === 'number' && vitals.heartRate > 130) {
    probability -= Math.min(20, vitals.heartRate - 130);
  }

  return Math.max(15, Math.min(99, Math.round(probability)));
}

function getRecommendationContext(payload = {}) {
  const vitals = payload.patientVitals || payload.vitals || {};

  return {
    severity: normalizeSeverity(payload.severity || deriveSeverityFromVitals(vitals)),
    requiredSpecialty: normalizeSpecialty(payload.specialty || payload.requiredSpecialty),
    location: resolveLocation(payload),
    vitals,
  };
}

function getStatusLabel(status) {
  return String(status || 'available').toUpperCase();
}

function getTrafficLabel(multiplier) {
  if (multiplier >= 1.45) {
    return 'High';
  }

  if (multiplier >= 1.2) {
    return 'Moderate';
  }

  return 'Low';
}

function getWaitTimeLabel(prediction) {
  if (!prediction) {
    return 'Unknown';
  }

  if (prediction.icuBedsIn15Minutes >= 3) {
    return '< 5 min';
  }

  if (prediction.icuBedsIn15Minutes >= 1) {
    return '10-15 min';
  }

  return '> 20 min';
}

function formatHospitalForFrontend(hospital, scoring = {}) {
  const travelTimeMinutes = scoring.travelTimeMinutes ?? scoring.estimatedTravelTimeMinutes;

  return {
    id: hospital.id,
    name: hospital.name,
    lat: hospital.location?.lat,
    lng: hospital.location?.lng,
    location: hospital.location,
    distance: scoring.distanceKm != null ? `${scoring.distanceKm.toFixed(1)} km` : 'N/A',
    eta: travelTimeMinutes != null ? `${Math.max(1, Math.round(travelTimeMinutes))} min` : 'N/A',
    icuBeds: hospital.icuBeds,
    ventilators: hospital.ventilators,
    specialists: hospital.specialties.map(toTitleCase),
    score: scoring.displayScore ?? Math.max(0, Math.round(scoring.totalScore ?? 0)),
    status: getStatusLabel(hospital.status),
    traffic: getTrafficLabel(scoring.trafficMultiplier || 1),
    waitTime: getWaitTimeLabel(scoring.prediction || hospital.predictedAvailability),
    reason: scoring.reason,
    predictedAvailability: scoring.prediction || hospital.predictedAvailability,
    lastUpdatedAt: hospital.lastUpdatedAt,
  };
}

function toTitleCase(value) {
  return String(value)
    .split(' ')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

function buildRecommendationResponse(payload) {
  const liveHospitals = simulationEngine.getHospitals();
  const simulationResult = simulationEngine.recommendHospital(payload);
  const simulationSummaryByHospitalId = new Map(
    simulationResult.scoringSummary.map((summary) => [String(summary.hospitalId), summary])
  );

  const rankedHospitals = liveHospitals
    .map((hospital) => {
      const mlScore = calculateRecommendationScore({
        hospital,
        severity: payload.severity,
        requiredSpecialty: payload.requiredSpecialty,
        location: payload.location,
      });
      const simulationScore = simulationSummaryByHospitalId.get(String(hospital.id)) || {};
      const combinedScore = Number(
        ((Number.isFinite(mlScore.totalScore) ? mlScore.totalScore : 0) +
          (simulationScore.totalScore || 0)).toFixed(2)
      );

      return {
        ...formatHospitalForFrontend(hospital, {
          ...simulationScore,
          combinedScore,
        }),
        scoreBreakdown: {
          mlScore: Number.isFinite(mlScore.totalScore) ? mlScore.totalScore : null,
          simulatedScore: simulationScore.totalScore ?? null,
          combinedScore,
        },
      };
    })
    .sort((left, right) => right.scoreBreakdown.combinedScore - left.scoreBreakdown.combinedScore);

  const highestCombinedScore = rankedHospitals[0]?.scoreBreakdown?.combinedScore || 1;
  rankedHospitals.forEach((hospital) => {
    hospital.score = Math.max(
      1,
      Math.min(100, Math.round((hospital.scoreBreakdown.combinedScore / highestCombinedScore) * 100))
    );
  });

  return {
    success: true,
    severity: payload.severity,
    specialty: payload.requiredSpecialty,
    location: payload.location,
    recommendation: rankedHospitals[0] || null,
    hospitals: rankedHospitals,
    scoringSummary: simulationResult.scoringSummary,
  };
}

function handleRecommendation(req, res) {
  const context = getRecommendationContext(req.body);
  const response = buildRecommendationResponse(context);

  res.status(200).json(response);
}

router.get('/hospitals', (req, res) => {
  res.status(200).json({
    success: true,
    hospitals: simulationEngine.getHospitals().map((hospital) => formatHospitalForFrontend(hospital)),
  });
});

router.post('/hospitals/recommend', handleRecommendation);
router.post('/recommend-hospital', handleRecommendation);

router.post('/hospitals/:hospitalId/prealert', (req, res, next) => {
  try {
    const context = getRecommendationContext(req.body);
    const vitals = req.body.vitals || req.body;
    const patientId = req.body.patientId || req.body.caseId || `case-${Date.now()}`;
    const record = simulationEngine.sendVitals({
      hospitalId: req.params.hospitalId,
      patientId,
      vitals,
    });
    const hospitalResponse = simulationEngine.alertHospitals({
      hospitalIds: [req.params.hospitalId],
      severity: context.severity,
      requiredSpecialty: context.requiredSpecialty,
      location: context.location,
    })[0];

    res.status(200).json({
      success: true,
      message: 'Pre-alert sent successfully.',
      hospitalId: req.params.hospitalId,
      record,
      response: hospitalResponse,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/send-vitals', (req, res, next) => {
  try {
    const { hospitalId, patientId, vitals } = req.body;

    if (!hospitalId || !vitals || typeof vitals !== 'object') {
      return res.status(400).json({
        error: 'hospitalId and vitals object are required.',
      });
    }

    const record = simulationEngine.sendVitals({ hospitalId, patientId, vitals });

    res.status(201).json({
      message: 'Vitals sent to hospital successfully.',
      record,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/hospitals/sos', (req, res) => {
  const context = getRecommendationContext(req.body);
  const hospitalIds = simulationEngine.getHospitals().map((hospital) => hospital.id);
  const alerts = simulationEngine.alertHospitals({
    hospitalIds,
    severity: context.severity,
    requiredSpecialty: context.requiredSpecialty,
    location: context.location,
  });

  res.status(200).json({
    success: true,
    alerted: alerts.length,
    message: `SOS sent to ${alerts.length} hospitals.`,
    alerts,
  });
});

router.post('/alert-hospitals', (req, res) => {
  const context = getRecommendationContext(req.body);
  const { hospitalIds } = req.body;

  if (!Array.isArray(hospitalIds) || hospitalIds.length === 0) {
    return res.status(400).json({
      error: 'hospitalIds must be a non-empty array.',
    });
  }

  const alerts = simulationEngine.alertHospitals({
    hospitalIds,
    severity: context.severity,
    requiredSpecialty: context.requiredSpecialty,
    location: context.location,
  });

  res.status(200).json({
    message: 'Hospital alerts processed successfully.',
    alerts,
  });
});

router.get('/vitals/:caseId/latest', (req, res) => {
  const record = latestVitalsByCase.get(req.params.caseId);

  res.status(200).json({
    success: true,
    vitals: record?.vitals || null,
    timestamp: record?.timestamp || null,
  });
});

router.post('/vitals/:caseId', (req, res) => {
  latestVitalsByCase.set(req.params.caseId, {
    vitals: req.body,
    timestamp: new Date().toISOString(),
  });

  res.status(201).json({
    success: true,
    caseId: req.params.caseId,
    vitals: req.body,
  });
});

router.post('/logic/severity', (req, res) => {
  const vitals = req.body.vitals || {};
  const severity = buildSeverityResponse(vitals);

  res.status(200).json({
    success: true,
    severity: severity.severity.toUpperCase(),
    survivalProbability: severity.survivalProbability,
  });
});

router.post('/route/optimize', (req, res, next) => {
  try {
    const context = getRecommendationContext(req.body);
    const routeScore = simulationEngine.scoreHospital({
      hospitalId: req.body.destinationId,
      severity: context.severity,
      requiredSpecialty: context.requiredSpecialty,
      location: req.body.origin || context.location,
    });

    res.status(200).json({
      success: true,
      route: {
        destinationId: routeScore.hospital.id,
        destinationName: routeScore.hospital.name,
        eta: `${Math.max(1, Math.round(routeScore.travelTimeMinutes))} min`,
        distance: `${routeScore.distanceKm.toFixed(1)} km`,
        trafficLevel: getTrafficLabel(routeScore.trafficMultiplier),
        coordinates: routeScore.hospital.location,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/vitals-log', (req, res) => {
  res.status(200).json({
    records: simulationEngine.getVitalsLog(),
  });
});

module.exports = {
  router,
  simulationEngine,
};
