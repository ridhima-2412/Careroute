import React, { useEffect, useRef, useState } from "react";
import { transcribeVitalsAudio } from "../api";

const vitalsConfig = [
  { key: "heartRate", label: "Heart rate", unit: "bpm", low: 50, high: 140 },
  { key: "spo2", label: "SpO2", unit: "%", low: 90, high: 101 },
  { key: "bp", label: "Blood pressure", unit: "mmHg" },
  { key: "respRate", label: "Respiratory rate", unit: "/min", low: 12, high: 30 },
  { key: "temp", label: "Temperature", unit: "C", low: 35, high: 39.5 },
  { key: "gcs", label: "GCS", unit: "/15", low: 9, high: 16 },
];

function generateVitals() {
  return {
    heartRate: Math.floor(Math.random() * 60 + 70),
    spo2: Math.floor(Math.random() * 8 + 92),
    bp: `${Math.floor(Math.random() * 40 + 110)}/${Math.floor(Math.random() * 20 + 70)}`,
    respRate: Math.floor(Math.random() * 10 + 14),
    temp: (Math.random() * 2 + 36.5).toFixed(1),
    gcs: Math.floor(Math.random() * 5 + 10),
  };
}

function isCritical(value, config) {
  if (config.low == null) return false;
  const numericValue = parseFloat(value);
  return numericValue < config.low || numericValue > config.high;
}

function getRecorderOptions() {
  if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
    return { mimeType: "audio/webm;codecs=opus" };
  }
  if (MediaRecorder.isTypeSupported("audio/ogg;codecs=opus")) {
    return { mimeType: "audio/ogg;codecs=opus" };
  }
  return {};
}

export default function Vitals({ patientName = "Patient", liveVitals, onVitalsChange }) {
  const [vitals, setVitals] = useState(generateVitals());
  const [history, setHistory] = useState([generateVitals()]);
  const [voiceVitals, setVoiceVitals] = useState(null);
  const [voiceStatus, setVoiceStatus] = useState("idle");
  const [transcript, setTranscript] = useState("");
  const [voiceDetails, setVoiceDetails] = useState({});
  const [voiceError, setVoiceError] = useState("");
  const voiceVitalsRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const displayedVitals = voiceVitals || liveVitals || vitals;

  useEffect(() => {
    const initialVitals = liveVitals || generateVitals();
    setVitals(initialVitals);
    setHistory([initialVitals]);
    onVitalsChange?.(initialVitals);

    if (liveVitals) return undefined;
    const interval = setInterval(() => {
      const next = generateVitals();
      setVitals(next);
      setHistory((current) => [...current.slice(-19), next]);
      if (!voiceVitalsRef.current) onVitalsChange?.(next);
    }, 2000);
    return () => clearInterval(interval);
  }, [liveVitals, onVitalsChange]);

  useEffect(
    () => () => {
      clearTimeout(recordingTimerRef.current);
      if (mediaRecorderRef.current?.state === "recording") mediaRecorderRef.current.stop();
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    },
    []
  );

  async function processRecording(audioBlob) {
    try {
      setVoiceStatus("transcribing");
      const result = await transcribeVitalsAudio(audioBlob);
      const mergedVitals = { ...displayedVitals, ...result.vitals };
      voiceVitalsRef.current = mergedVitals;
      setVoiceVitals(mergedVitals);
      setHistory((current) => [...current.slice(-19), mergedVitals]);
      setTranscript(result.transcript);
      setVoiceDetails({
        consciousness: result.consciousness,
        emergencyType: result.emergencyType,
        mode: result.transcriptionMode,
      });
      onVitalsChange?.(mergedVitals);
      setVoiceStatus("filled");
    } catch (error) {
      setVoiceError(error.message || "Transcription failed. Check backend connectivity and retry.");
      setVoiceStatus("error");
    }
  }

  function stopRecording() {
    clearTimeout(recordingTimerRef.current);
    if (mediaRecorderRef.current?.state === "recording") mediaRecorderRef.current.stop();
  }

  async function startRecording() {
    setVoiceError("");
    setTranscript("");
    setVoiceDetails({});

    if (!window.isSecureContext) {
      setVoiceError("Microphone access requires localhost or HTTPS. Reopen CareRoute using http://localhost.");
      setVoiceStatus("error");
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setVoiceError("This browser does not support microphone recording. Use a current Chrome or Edge browser.");
      setVoiceStatus("error");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const chunks = [];
      const recorder = new MediaRecorder(stream, getRecorderOptions());
      mediaStreamRef.current = stream;
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (event) => event.data.size > 0 && chunks.push(event.data);
      recorder.onerror = () => {
        setVoiceError("Audio recording failed. Confirm that Windows can access the selected microphone.");
        setVoiceStatus("error");
      };
      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
        stream.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
        processRecording(audioBlob);
      };
      recorder.start();
      setVoiceStatus("listening");
      recordingTimerRef.current = setTimeout(stopRecording, 10000);
    } catch (error) {
      const denied = error.name === "NotAllowedError" || error.name === "SecurityError";
      setVoiceError(
        denied
          ? "Microphone permission is blocked. Use the address-bar site controls to allow Microphone, then reload."
          : "No microphone is available. Check the input device and Windows privacy settings."
      );
      setVoiceStatus("error");
    }
  }

  function handleVoiceButton() {
    if (voiceStatus === "listening") stopRecording();
    else if (voiceStatus !== "transcribing") startRecording();
  }

  const voiceButtonLabel = {
    idle: "Start Voice Capture",
    listening: "Stop and Process",
    transcribing: "Transcribing...",
    filled: "Capture New Vitals",
    error: "Retry Voice Capture",
  }[voiceStatus];

  return (
    <section className="panel vitals-panel">
      <div className="panel-header">
        <div>
          <div className="eyebrow">Voice-captured vitals</div>
          <h2 className="panel-title">{patientName}</h2>
          <p className="panel-copy">
            {voiceVitals
              ? "Patient vitals captured through paramedic voice input."
              : "Live monitor active. Voice capture can replace simulated readings."}
          </p>
        </div>
        <span className={`status-pill ${voiceVitals ? "status-success" : "status-info"}`}>
          {voiceVitals ? "VOICE CONFIRMED" : "LIVE MONITOR"}
        </span>
      </div>

      <div className="vitals-grid">
        {vitalsConfig.map((config) => {
          const critical = isCritical(displayedVitals[config.key], config);
          return (
            <div className={`vital-card ${critical ? "vital-critical" : ""}`} key={config.key}>
              <span className="metric-label">{config.label}</span>
              <div>
                <strong>{displayedVitals[config.key]}</strong>
                <small>{config.unit}</small>
              </div>
              <span>{critical ? "Outside target range" : "Monitored"}</span>
            </div>
          );
        })}
      </div>

      <div className={`voice-capture ${voiceStatus === "listening" ? "voice-listening" : ""}`}>
        <div>
          <strong>
            {voiceStatus === "listening"
              ? "Listening to paramedic..."
              : voiceStatus === "transcribing"
                ? "Converting speech into clinical values..."
                : "Paramedic voice input"}
          </strong>
          <span>Speak heart rate, oxygen, blood pressure, temperature, consciousness, and suspected condition.</span>
        </div>
        <button
          type="button"
          className={`button ${voiceStatus === "listening" ? "button-danger" : "button-primary"}`}
          onClick={handleVoiceButton}
          disabled={voiceStatus === "transcribing"}
        >
          {voiceButtonLabel}
        </button>
      </div>

      {voiceError && <div className="error-state voice-result">{voiceError}</div>}
      {transcript && (
        <div className="voice-result">
          <div className="voice-result-header">
            <span>Transcript confirmed</span>
            <span>{voiceDetails.mode === "mock" ? "Demo transcription" : "OpenAI transcription"}</span>
          </div>
          <p>"{transcript}"</p>
          <div className="specialty-row">
            {voiceDetails.consciousness && <span className="match-chip">Status: {voiceDetails.consciousness}</span>}
            {voiceDetails.emergencyType && <span className="match-chip match-positive">Case: {voiceDetails.emergencyType}</span>}
          </div>
        </div>
      )}

      <div className="vitals-trend">
        <div>
          <span>Heart-rate trend</span>
          <small>Last {history.length * 2} seconds</small>
        </div>
        <svg viewBox={`0 0 ${Math.max(20, history.length * 18)} 64`} preserveAspectRatio="none">
          <polyline
            points={history
              .map((entry, index) => `${index * 18},${62 - ((entry.heartRate - 40) / 140) * 58}`)
              .join(" ")}
            fill="none"
            stroke="#ff5d68"
            strokeWidth="3"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </section>
  );
}
