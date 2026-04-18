// recommendations.js

// -----------------------------
// UTILS
// -----------------------------
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function toRadians(value) {
  return (value * Math.PI) / 180;
}

function calculateDistanceInKm(origin, destination) {
  const earthRadiusKm = 6371;

  const dLat = toRadians(destination.lat - origin.lat);
  const dLng = toRadians(destination.lng - origin.lng);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(origin.lat)) *
      Math.cos(toRadians(destination.lat)) *
      Math.sin(dLng / 2) ** 2;

  return earthRadiusKm * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

// -----------------------------
// SEVERITY PROFILES
// -----------------------------
const SEVERITY_WEIGHTS = {
  high: {
    resourceWeight: 1.2,
    distanceWeight: 0.8,
  },
  medium: {
    resourceWeight: 1.0,
    distanceWeight: 1.0,
  },
  low: {
    resourceWeight: 0.6,
    distanceWeight: 1.4,
  },
};

// -----------------------------
// SCORING FUNCTIONS
// -----------------------------
function calculateSpecialtyScore(hospital, requiredSpecialty) {
  if (!requiredSpecialty || requiredSpecialty === "general") return 10;

  return hospital.specialties.includes(requiredSpecialty) ? 35 : 5;
}

function calculateResourceScore(hospital, severity) {
  const profile = SEVERITY_WEIGHTS[severity] || SEVERITY_WEIGHTS.medium;

  const icuScore = clamp(hospital.icuBeds / 5, 0, 1);
  const ventilatorScore = clamp(hospital.ventilators / 5, 0, 1);

  return (icuScore * 20 + ventilatorScore * 15) * profile.resourceWeight;
}

function calculateDistanceScore(distanceKm, severity) {
  const profile = SEVERITY_WEIGHTS[severity] || SEVERITY_WEIGHTS.medium;

  const normalized = clamp(1 - distanceKm / 30, 0, 1);

  return normalized * 15 * profile.distanceWeight;
}

// -----------------------------
// MAIN FUNCTION
// -----------------------------
function calculateRecommendationScore({
  hospital,
  severity,
  requiredSpecialty,
  location,
}) {
  if (hospital.status !== "available") {
    return { totalScore: -Infinity };
  }

  const distanceKm = calculateDistanceInKm(location, hospital.location);

  const specialtyScore = calculateSpecialtyScore(
    hospital,
    requiredSpecialty
  );

  const resourceScore = calculateResourceScore(hospital, severity);

  const distanceScore = calculateDistanceScore(distanceKm, severity);

  const loadFactor =
    (hospital.icuBeds + hospital.ventilators) / 20;

  const overloadPenalty = loadFactor < 0.2 ? -8 : 0;

  const totalScore = Number(
    (specialtyScore + resourceScore + distanceScore + overloadPenalty).toFixed(2)
  );

  return {
    totalScore,
    specialtyScore: Number(specialtyScore.toFixed(2)),
    resourceScore: Number(resourceScore.toFixed(2)),
    distanceScore: Number(distanceScore.toFixed(2)),
    distanceKm: Number(distanceKm.toFixed(2)),
  };
}

// -----------------------------
module.exports = {
  calculateRecommendationScore,
};
