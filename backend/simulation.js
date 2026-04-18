
const EventEmitter = require('events');

const COMMUNICATION_EVENTS = {
  VITALS_SENT: 'vitals:sent',
  HOSPITAL_ALERTED: 'hospital:alerted',
  HOSPITAL_ACCEPTED: 'hospital:accepted',
  HOSPITAL_DECLINED: 'hospital:declined',
  BED_STATUS_CHANGED: 'beds:changed',
};

const SEVERITY_RESOURCE_PROFILES = {
  high: {
    minimumIcuBeds: 1,
    minimumVentilators: 1,
    resourceWeight: 1.0,
    maxTrafficMultiplier: 1.6,
  },
  medium: {
    minimumIcuBeds: 1,
    minimumVentilators: 0,
    resourceWeight: 0.7,
    maxTrafficMultiplier: 1.4,
  },
  low: {
    minimumIcuBeds: 0,
    minimumVentilators: 0,
    resourceWeight: 0.4,
    maxTrafficMultiplier: 1.25,
  },
};

function createCommunicationBus() {
  return new EventEmitter();
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function randomInRange(min, max) {
  return Math.random() * (max - min) + min;
}

function toRadians(value) {
  return (value * Math.PI) / 180;
}

function calculateDistanceInKm(origin, destination) {
  const earthRadiusKm = 6371;
  const latDiff = toRadians(destination.lat - origin.lat);
  const lngDiff = toRadians(destination.lng - origin.lng);

  const a =
    Math.sin(latDiff / 2) * Math.sin(latDiff / 2) +
    Math.cos(toRadians(origin.lat)) *
      Math.cos(toRadians(destination.lat)) *
      Math.sin(lngDiff / 2) *
      Math.sin(lngDiff / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

function getTrafficMultiplier(severity) {
  const profile = SEVERITY_RESOURCE_PROFILES[severity];
  return Number(randomInRange(1.0, profile.maxTrafficMultiplier).toFixed(2));
}

function estimateTravelTimeMinutes(distanceKm, trafficMultiplier) {
  const averageAmbulanceSpeedKmPerHour = 45;
  const baseMinutes = (distanceKm / averageAmbulanceSpeedKmPerHour) * 60;
  return Number((baseMinutes * trafficMultiplier).toFixed(1));
}

function predictBedAvailability(hospital) {
  const trend = hospital.bedTrendPer15Min ?? 0;
  const randomAdjustment = Math.round(randomInRange(-1, 2));
  const predictedIcuBeds = clamp(hospital.icuBeds + trend + randomAdjustment, 0, hospital.totalBeds);
  const predictedVentilators = clamp(
    hospital.ventilators + Math.round(randomInRange(-1, 2)),
    0,
    hospital.totalVentilators ?? hospital.ventilators
  );

  return {
    icuBedsIn15Minutes: predictedIcuBeds,
    ventilatorsIn15Minutes: predictedVentilators,
    confidence: trend >= 0 ? 'moderate' : 'low',
  };
}

function calculateSeverityResourceScore(hospital, severity) {
  const profile = SEVERITY_RESOURCE_PROFILES[severity];
  const icuCoverage = clamp(hospital.icuBeds / Math.max(profile.minimumIcuBeds, 1), 0, 1);
  const ventilatorCoverage = clamp(
    hospital.ventilators / Math.max(profile.minimumVentilators || 1, 1),
    0,
    1
  );

  return Number((((icuCoverage * 18) + (ventilatorCoverage * 12)) * profile.resourceWeight).toFixed(2));
}

function calculateBedAvailabilityScore(hospital, prediction) {
  const currentCapacityScore = clamp(hospital.icuBeds * 2 + hospital.ventilators, 0, 14);
  const predictedCapacityScore = clamp(prediction.icuBedsIn15Minutes + prediction.ventilatorsIn15Minutes, 0, 6);

  return Number((currentCapacityScore + predictedCapacityScore).toFixed(2));
}

function calculateDistanceScore(travelTimeMinutes) {
  const normalized = clamp(1 - travelTimeMinutes / 45, 0, 1);
  return Number((normalized * 15).toFixed(2));
}

function calculateSpecialtyScore(hospital, requiredSpecialty) {
  return hospital.specialties.includes(requiredSpecialty) ? 35 : 5;
}

function buildRecommendationReason({
  hospital,
  requiredSpecialty,
  specialtyScore,
  severityResourceScore,
  bedAvailabilityScore,
  distanceKm,
  travelTimeMinutes,
  prediction,
}) {
  const reasonParts = [];

  if (specialtyScore >= 35) {
    reasonParts.push(`matches the required ${requiredSpecialty} specialty`);
  }

  if (severityResourceScore >= 20) {
    reasonParts.push('has strong critical-care resources for the patient severity');
  }

  if (bedAvailabilityScore >= 14) {
    reasonParts.push(
      `is likely to keep beds available soon (predicted ICU beds in 15 min: ${prediction.icuBedsIn15Minutes})`
    );
  }

  reasonParts.push(`estimated travel time is ${travelTimeMinutes} minutes over ${distanceKm.toFixed(1)} km`);

  return reasonParts.join(', ');
}

function calculateRecommendationScore({ hospital, severity, requiredSpecialty, location }) {
  const distanceKm = calculateDistanceInKm(location, hospital.location);
  const trafficMultiplier = getTrafficMultiplier(severity);
  const travelTimeMinutes = estimateTravelTimeMinutes(distanceKm, trafficMultiplier);
  const prediction = predictBedAvailability(hospital);

  const specialtyScore = calculateSpecialtyScore(hospital, requiredSpecialty);
  const severityResourceScore = calculateSeverityResourceScore(hospital, severity);
  const bedAvailabilityScore = calculateBedAvailabilityScore(hospital, prediction);
  const distanceScore = calculateDistanceScore(travelTimeMinutes);

  const totalScore = Number(
    (specialtyScore + severityResourceScore + bedAvailabilityScore + distanceScore).toFixed(2)
  );

  return {
    totalScore,
    specialtyScore,
    severityResourceScore,
    bedAvailabilityScore,
    distanceScore,
    distanceKm: Number(distanceKm.toFixed(2)),
    trafficMultiplier,
    travelTimeMinutes,
    prediction,
    reason: buildRecommendationReason({
      hospital,
      requiredSpecialty,
      specialtyScore,
      severityResourceScore,
      bedAvailabilityScore,
      distanceKm,
      travelTimeMinutes,
      prediction,
    }),
  };
}

function calculateAcceptanceProbability({ hospital, severity, requiredSpecialty, travelTimeMinutes }) {
  const specialtyBonus = hospital.specialties.includes(requiredSpecialty) ? 0.2 : -0.15;
  const capacityBonus = clamp((hospital.icuBeds + hospital.ventilators) / 20, 0, 0.3);
  const severityPenalty = severity === 'high' && hospital.icuBeds < 1 ? -0.35 : 0;
  const travelPenalty = clamp(travelTimeMinutes / 100, 0, 0.2);

  return clamp(0.45 + specialtyBonus + capacityBonus + severityPenalty - travelPenalty, 0.1, 0.95);
}

function estimateRequiredResources(severity) {
  if (severity === 'high') {
    return { icuBeds: 1, ventilators: 1 };
  }

  if (severity === 'medium') {
    return { icuBeds: 1, ventilators: 0 };
  }

  return { icuBeds: 0, ventilators: 0 };
}

function createSimulationEngine(initialHospitals, communicationBus = createCommunicationBus()) {
  const hospitalState = initialHospitals.map((hospital, index) => ({
    id: hospital.id ?? `hospital-${index + 1}`,
    totalBeds: hospital.totalBeds ?? Math.max(hospital.icuBeds * 4, 20),
    totalVentilators: hospital.totalVentilators ?? Math.max(hospital.ventilators, 5),
    bedTrendPer15Min: hospital.bedTrendPer15Min ?? 0,
    lastUpdatedAt: new Date().toISOString(),
    ...hospital,
  }));

  const vitalsLog = [];

  function getHospitals() {
    return hospitalState.map((hospital) => ({
      ...hospital,
      predictedAvailability: predictBedAvailability(hospital),
    }));
  }

  function scoreHospital({ hospitalId, severity, requiredSpecialty, location }) {
    const hospital = hospitalState.find((item) => String(item.id) === String(hospitalId));

    if (!hospital) {
      const error = new Error(`Hospital with id "${hospitalId}" was not found.`);
      error.statusCode = 404;
      throw error;
    }

    return {
      hospital,
      ...calculateRecommendationScore({
        hospital,
        severity,
        requiredSpecialty,
        location,
      }),
    };
  }

  function recommendHospital(payload) {
    const scoredHospitals = hospitalState.map((hospital) => {
      const scoreBreakdown = calculateRecommendationScore({
        hospital,
        severity: payload.severity,
        requiredSpecialty: payload.requiredSpecialty,
        location: payload.location,
      });

      return {
        hospital,
        ...scoreBreakdown,
      };
    });

    scoredHospitals.sort((left, right) => right.totalScore - left.totalScore);
    const bestMatch = scoredHospitals[0];

    return {
      recommendation: {
        id: bestMatch.hospital.id,
        name: bestMatch.hospital.name,
        location: bestMatch.hospital.location,
        specialties: bestMatch.hospital.specialties,
        score: bestMatch.totalScore,
        estimatedTravelTimeMinutes: bestMatch.travelTimeMinutes,
        trafficMultiplier: bestMatch.trafficMultiplier,
        predictedAvailability: bestMatch.prediction,
        reason: bestMatch.reason,
      },
      scoringSummary: scoredHospitals.map((item) => ({
        hospitalId: item.hospital.id,
        hospitalName: item.hospital.name,
        totalScore: item.totalScore,
        specialtyScore: item.specialtyScore,
        severityResourceScore: item.severityResourceScore,
        bedAvailabilityScore: item.bedAvailabilityScore,
        distanceScore: item.distanceScore,
        estimatedTravelTimeMinutes: item.travelTimeMinutes,
      })),
    };
  }

  function sendVitals({ hospitalId, patientId, vitals }) {
    const hospital = hospitalState.find((item) => item.id === hospitalId);

    if (!hospital) {
      const error = new Error(`Hospital with id "${hospitalId}" was not found.`);
      error.statusCode = 404;
      throw error;
    }

    const record = {
      id: `vitals-${Date.now()}`,
      hospitalId,
      hospitalName: hospital.name,
      patientId: patientId ?? `patient-${Date.now()}`,
      vitals,
      sentAt: new Date().toISOString(),
    };

    vitalsLog.push(record);
    communicationBus.emit(COMMUNICATION_EVENTS.VITALS_SENT, record);

    return record;
  }

  function alertHospitals({ hospitalIds, severity, requiredSpecialty, location }) {
    const alerts = hospitalState
      .filter((hospital) => hospitalIds.some((id) => String(id) === String(hospital.id)))
      .map((hospital) => {
        const score = calculateRecommendationScore({
          hospital,
          severity,
          requiredSpecialty,
          location,
        });

        const acceptanceProbability = calculateAcceptanceProbability({
          hospital,
          severity,
          requiredSpecialty,
          travelTimeMinutes: score.travelTimeMinutes,
        });

        const accepted = Math.random() <= acceptanceProbability;
        const response = {
          hospitalId: hospital.id,
          hospitalName: hospital.name,
          accepted,
          acceptanceProbability: Number(acceptanceProbability.toFixed(2)),
          estimatedTravelTimeMinutes: score.travelTimeMinutes,
          reason: accepted
            ? 'Hospital has capacity and agreed to prepare for arrival.'
            : 'Hospital declined due to simulated capacity or specialty constraints.',
        };

        communicationBus.emit(COMMUNICATION_EVENTS.HOSPITAL_ALERTED, response);
        communicationBus.emit(
          accepted ? COMMUNICATION_EVENTS.HOSPITAL_ACCEPTED : COMMUNICATION_EVENTS.HOSPITAL_DECLINED,
          response
        );

        if (accepted) {
          const requiredResources = estimateRequiredResources(severity);
          hospital.icuBeds = clamp(hospital.icuBeds - requiredResources.icuBeds, 0, hospital.totalBeds);
          hospital.ventilators = clamp(
            hospital.ventilators - requiredResources.ventilators,
            0,
            hospital.totalVentilators
          );
          hospital.lastUpdatedAt = new Date().toISOString();

          communicationBus.emit(COMMUNICATION_EVENTS.BED_STATUS_CHANGED, {
            hospitalId: hospital.id,
            hospitalName: hospital.name,
            icuBeds: hospital.icuBeds,
            ventilators: hospital.ventilators,
            updatedAt: hospital.lastUpdatedAt,
          });
        }

        return response;
      });

    return alerts;
  }

  function startBackgroundSimulation(updateIntervalMs = 30000) {
    return setInterval(() => {
      hospitalState.forEach((hospital) => {
        const icuDelta = Math.round(randomInRange(-1, 2));
        const ventilatorDelta = Math.round(randomInRange(-1, 2));

        hospital.icuBeds = clamp(hospital.icuBeds + icuDelta, 0, hospital.totalBeds);
        hospital.ventilators = clamp(
          hospital.ventilators + ventilatorDelta,
          0,
          hospital.totalVentilators
        );
        hospital.lastUpdatedAt = new Date().toISOString();

        communicationBus.emit(COMMUNICATION_EVENTS.BED_STATUS_CHANGED, {
          hospitalId: hospital.id,
          hospitalName: hospital.name,
          icuBeds: hospital.icuBeds,
          ventilators: hospital.ventilators,
          updatedAt: hospital.lastUpdatedAt,
        });
      });
    }, updateIntervalMs);
  }

  function getVitalsLog() {
    return [...vitalsLog];
  }

  return {
    getHospitals,
    recommendHospital,
    scoreHospital,
    sendVitals,
    alertHospitals,
    startBackgroundSimulation,
    getVitalsLog,
    communicationBus,
  };
}

module.exports = {
  COMMUNICATION_EVENTS,
  createCommunicationBus,
  createSimulationEngine,
};
