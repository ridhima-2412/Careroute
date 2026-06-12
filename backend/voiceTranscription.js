const MOCK_TRANSCRIPT =
  'Patient is unconscious, heart rate 130, oxygen level 82, blood pressure 90 over 60, temperature 101, possible cardiac emergency.';

function getTranscriptionMode() {
  const configuredMode = String(process.env.VOICE_TRANSCRIPTION_MODE || 'auto').toLowerCase();

  if (configuredMode === 'mock') {
    return 'mock';
  }

  return process.env.OPENAI_API_KEY ? 'openai' : 'mock';
}

async function transcribeWithOpenAI(audioBuffer, { mimeType, filename }) {
  const form = new FormData();
  const audioFile = new Blob([audioBuffer], { type: mimeType || 'audio/webm' });

  form.append('file', audioFile, filename || 'patient-vitals.webm');
  form.append('model', process.env.OPENAI_TRANSCRIPTION_MODEL || 'gpt-4o-mini-transcribe');
  form.append(
    'prompt',
    'Transcribe ambulance patient vitals accurately, including heart rate, SpO2, blood pressure, temperature, consciousness, and suspected emergency.'
  );

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: form,
  });

  const payload = await response.json();
  if (!response.ok) {
    const error = new Error(payload.error?.message || 'OpenAI transcription failed.');
    error.statusCode = response.status;
    throw error;
  }

  if (!payload.text) {
    throw new Error('Transcription completed without any text.');
  }

  return payload.text.trim();
}

async function transcribeAudio(audioBuffer, options = {}) {
  const mode = getTranscriptionMode();

  if (mode === 'mock') {
    return {
      transcript: process.env.MOCK_VOICE_TRANSCRIPT || MOCK_TRANSCRIPT,
      mode,
    };
  }

  return {
    transcript: await transcribeWithOpenAI(audioBuffer, options),
    mode,
  };
}

module.exports = {
  MOCK_TRANSCRIPT,
  getTranscriptionMode,
  transcribeAudio,
};
