const DEFAULT_PATIENT = {
  age: 52,
  gender: 'Male',
  incidentType: 'Cardiac Arrest',
};

function getPreAlertMode() {
  const configuredMode = String(process.env.PREALERT_MESSAGE_MODE || 'auto').toLowerCase();

  if (configuredMode === 'mock') {
    return 'mock';
  }

  return process.env.OPENAI_API_KEY ? 'openai' : 'mock';
}

function formatBloodPressure(vitals = {}) {
  if (vitals.bp) {
    return String(vitals.bp);
  }

  if (vitals.bpSystolic && vitals.bpDiastolic) {
    return `${vitals.bpSystolic}/${vitals.bpDiastolic}`;
  }

  return 'not available';
}

function getCathLabRequest(context) {
  const specialty = String(context.specialty || context.requiredSpecialty || '').toLowerCase();
  const incidentType = String(context.patient?.incidentType || '').toLowerCase();

  if (specialty.includes('cardio') || incidentType.includes('cardiac')) {
    return 'Requesting cath lab prep and resuscitation team on standby.';
  }

  if (specialty.includes('trauma')) {
    return 'Requesting trauma bay prep and surgical team standby.';
  }

  if (specialty.includes('neuro')) {
    return 'Requesting neuro team standby and CT readiness.';
  }

  return 'Requesting receiving team and critical-care bed prep.';
}

function buildFallbackPreAlert(context = {}) {
  const patient = { ...DEFAULT_PATIENT, ...(context.patient || {}) };
  const vitals = context.vitals || {};
  const eta = context.eta || context.hospital?.eta || 'ETA pending';
  const bloodPressure = formatBloodPressure(vitals);
  const spo2 = vitals.spo2 != null ? `${vitals.spo2}` : 'not available';
  const heartRate = vitals.heartRate != null ? `${vitals.heartRate}` : 'not available';
  const request = getCathLabRequest(context);

  return `Incoming: ${patient.gender} ${patient.age}, ${patient.incidentType}, ETA ${eta}. Vitals: BP ${bloodPressure}, HR ${heartRate}, SpO2 ${spo2}. ${request}`;
}

function buildPreAlertPrompt(context = {}) {
  const patient = { ...DEFAULT_PATIENT, ...(context.patient || {}) };

  return [
    'Write one concise hospital pre-alert handoff brief for an emergency department.',
    'Return only the final message. No markdown, no labels, no explanation.',
    'Keep it under 45 words and include: incoming patient, incident, ETA, key vitals, and requested preparation.',
    '',
    `Patient: ${patient.gender}, ${patient.age}`,
    `Incident: ${patient.incidentType}`,
    `Destination: ${context.hospital?.name || 'selected hospital'}`,
    `ETA: ${context.eta || context.hospital?.eta || 'ETA pending'}`,
    `Severity: ${context.severity || 'unknown'}`,
    `Required specialty: ${context.specialty || context.requiredSpecialty || 'general'}`,
    `Vitals JSON: ${JSON.stringify(context.vitals || {})}`,
  ].join('\n');
}

async function generateWithOpenAI(context) {
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.OPENAI_PREALERT_MODEL || 'gpt-4o-mini',
      input: buildPreAlertPrompt(context),
      temperature: 0.2,
      max_output_tokens: 120,
    }),
  });

  const payload = await response.json();
  if (!response.ok) {
    const error = new Error(payload.error?.message || 'OpenAI pre-alert generation failed.');
    error.statusCode = response.status;
    throw error;
  }

  const text = payload.output_text || payload.output?.[0]?.content?.[0]?.text;
  if (!text) {
    throw new Error('Pre-alert generation completed without message text.');
  }

  return text.trim();
}

async function generatePreAlertMessage(context = {}) {
  const mode = getPreAlertMode();

  if (mode === 'mock') {
    return {
      brief: buildFallbackPreAlert(context),
      mode,
    };
  }

  try {
    return {
      brief: await generateWithOpenAI(context),
      mode,
    };
  } catch (error) {
    return {
      brief: buildFallbackPreAlert(context),
      mode: 'fallback',
      error: error.message,
    };
  }
}

module.exports = {
  buildFallbackPreAlert,
  generatePreAlertMessage,
  getPreAlertMode,
};
