
require('dotenv').config();

const express = require('express');
const cors = require('cors');

const { router, simulationEngine } = require('./routes');
const { COMMUNICATION_EVENTS } = require('./simulation');

const app = express();
const PORT = Number(process.env.PORT) || 5000;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  const startedAt = Date.now();

  res.on('finish', () => {
    const durationMs = Date.now() - startedAt;
    console.log(`${req.method} ${req.originalUrl} -> ${res.statusCode} (${durationMs}ms)`);
  });

  next();
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api', router);
app.use('/', router);

app.use((req, res) => {
  res.status(404).json({
    error: `Route ${req.method} ${req.originalUrl} not found.`,
  });
});

app.use((error, req, res, next) => {
  const statusCode = error.statusCode || 500;
  console.error('Unhandled error:', error);

  res.status(statusCode).json({
    error: error.message || 'Internal server error.',
  });
});

simulationEngine.communicationBus.on(COMMUNICATION_EVENTS.VITALS_SENT, (payload) => {
  console.log(`[Realtime] Vitals sent to ${payload.hospitalName} for ${payload.patientId}.`);
});

simulationEngine.communicationBus.on(COMMUNICATION_EVENTS.HOSPITAL_ACCEPTED, (payload) => {
  console.log(`[Realtime] ${payload.hospitalName} accepted the incoming patient.`);
});

simulationEngine.communicationBus.on(COMMUNICATION_EVENTS.HOSPITAL_DECLINED, (payload) => {
  console.log(`[Realtime] ${payload.hospitalName} declined the incoming patient.`);
});

simulationEngine.communicationBus.on(COMMUNICATION_EVENTS.BED_STATUS_CHANGED, (payload) => {
  console.log(
    `[Realtime] ${payload.hospitalName} capacity update: ICU=${payload.icuBeds}, Ventilators=${payload.ventilators}`
  );
});

let simulationTimer = null;
let server = null;

if (require.main === module) {
  simulationTimer = simulationEngine.startBackgroundSimulation();
  server = app.listen(PORT, () => {
    console.log(`Smart Ambulance backend running on port ${PORT}`);
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(
        `Port ${PORT} is already in use. Stop the existing process or run "npm run backend:5001".`
      );
      process.exit(1);
    }

    throw error;
  });
}

module.exports = {
  app,
  server,
  simulationTimer,
};
