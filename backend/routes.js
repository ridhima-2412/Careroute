
const express = require('express');
const path = require('path');

const hospitals = require(path.join(__dirname, '..', 'database', 'hospitals.json'));
const { createSimulationEngine } = require('./simulation');

const router = express.Router();
const simulationEngine = createSimulationEngine(hospitals);

function isValidSeverity(value) {
  return ['high', 'medium', 'low'].includes(value);
}

function isValidSpecialty(value) {
  return ['cardiology', 'trauma', 'general'].includes(value);
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

function validateRecommendationRequest(req, res, next) {
  const { severity, requiredSpecialty, location } = req.body;

  if (!isValidSeverity(severity)) {
    return res.status(400).json({
      error: 'Invalid severity. Use one of: high, medium, low.',
    });
  }

  if (!isValidSpecialty(requiredSpecialty)) {
    return res.status(400).json({
      error: 'Invalid requiredSpecialty. Use one of: cardiology, trauma, general.',
    });
  }

  if (!isValidLocation(location)) {
    return res.status(400).json({
      error: 'Invalid location. Provide numeric lat and lng values.',
    });
  }

  next();
}

router.get('/hospitals', (req, res) => {
  res.status(200).json({
    hospitals: simulationEngine.getHospitals(),
  });
});

router.post('/recommend-hospital', validateRecommendationRequest, (req, res) => {
  const recommendation = simulationEngine.recommendHospital(req.body);

  res.status(200).json({
    message: 'Hospital recommendation generated successfully.',
    ...recommendation,
  });
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

router.post('/alert-hospitals', validateRecommendationRequest, (req, res) => {
  const { hospitalIds } = req.body;

  if (!Array.isArray(hospitalIds) || hospitalIds.length === 0) {
    return res.status(400).json({
      error: 'hospitalIds must be a non-empty array.',
    });
  }

  const alerts = simulationEngine.alertHospitals({
    hospitalIds,
    severity: req.body.severity,
    requiredSpecialty: req.body.requiredSpecialty,
    location: req.body.location,
  });

  res.status(200).json({
    message: 'Hospital alerts processed successfully.',
    alerts,
  });
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
