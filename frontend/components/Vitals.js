import React, { useEffect, useRef, useState } from "react";
import { transcribeVitalsAudio } from "../api";

const vitalsConfig = [
  { key: "heartRate", label: "Heart Rate", unit: "bpm", icon: "HR", critical: [0, 50, 140, 999], color: "#ff4d6d" },
  { key: "spo2", label: "SpO2", unit: "%", icon: "O2", critical: [0, 90, 101, 999], color: "#00d4ff" },
  { key: "bp", label: "Blood Pressure", unit: "mmHg", icon: "BP", critical: null, color: "#ffd166" },
  { key: "respRate", label: "Resp. Rate", unit: "/min", icon: "RR", critical: [0, 12, 30, 999], color: "#06d6a0" },
  { key: "temp", label: "Temperature", unit: "C", icon: "TEMP", critical: [0, 35, 39.5, 999], color: "#f77f00" },
  { key: "gcs", label: "GCS Score", unit: "/15", icon: "GCS", critical: [0, 9, 16, 999], color: "#c77dff" },
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

function isCritical(value, range) {
  if (!range) return false;
  const numericValue = parseFloat(value);
  return numericValue < range[1] || numericValue > range[2];
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

export default function Vitals({ patientName = "Patient #A-112", liveVitals, onVitalsChange }) {
  const [vitals, setVitals] = useState(generateVitals());
  const [history, setHistory] = useState([generateVitals()]);
  const [pulse, setPulse] = useState(false);
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
    onVitalsChange && onVitalsChange(initialVitals);

    if (liveVitals) {
      return undefined;
    }

    const interval = setInterval(() => {
      const next = generateVitals();
      setVitals(next);
      setHistory((current) => [...current.slice(-19), next]);
      if (!voiceVitalsRef.current) {
        onVitalsChange && onVitalsChange(next);
      }
      setPulse(true);
      setTimeout(() => setPulse(false), 300);
    }, 2000);

    return () => clearInterval(interval);
  }, [liveVitals, onVitalsChange]);

  useEffect(() => {
    return () => {
      clearTimeout(recordingTimerRef.current);
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

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
      setPulse(true);
      setTimeout(() => setPulse(false), 300);
      onVitalsChange && onVitalsChange(mergedVitals);
      setVoiceStatus("filled");
    } catch (error) {
      setVoiceError(error.message || "Unable to transcribe this recording.");
      setVoiceStatus("error");
    }
  }

  function stopRecording() {
    clearTimeout(recordingTimerRef.current);
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }

  async function startRecording() {
    setVoiceError("");
    setTranscript("");
    setVoiceDetails({});

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setVoiceError("Voice recording is not supported in this browser.");
      setVoiceStatus("error");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const chunks = [];
      const recorder = new MediaRecorder(stream, getRecorderOptions());

      mediaStreamRef.current = stream;
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };
      recorder.onerror = () => {
        setVoiceError("The browser could not record audio.");
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
      const permissionDenied = error.name === "NotAllowedError" || error.name === "SecurityError";
      setVoiceError(
        permissionDenied
          ? "Microphone permission was denied. Allow microphone access and try again."
          : "Unable to access the microphone. Check that an input device is connected."
      );
      setVoiceStatus("error");
    }
  }

  function handleVoiceButton() {
    if (voiceStatus === "listening") {
      stopRecording();
    } else if (voiceStatus !== "transcribing") {
      startRecording();
    }
  }

  const severity =
    displayedVitals.gcs < 9 || displayedVitals.spo2 < 90 || displayedVitals.heartRate > 140
      ? "CRITICAL"
      : displayedVitals.gcs < 13
        ? "MODERATE"
        : "STABLE";
  const severityColor =
    severity === "CRITICAL" ? "#ff4d6d" : severity === "MODERATE" ? "#ffd166" : "#06d6a0";
  const voiceLabel = {
    idle: "Speak Vitals",
    listening: "Listening... Stop",
    transcribing: "Transcribing...",
    filled: "Vitals Filled",
    error: "Try Voice Again",
  }[voiceStatus];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <div style={styles.patientLabel}>PATIENT VITALS</div>
          <div style={styles.patientName}>{patientName}</div>
        </div>
        <div
          style={{
            ...styles.severityBadge,
            background: `${severityColor}22`,
            color: severityColor,
            border: `1px solid ${severityColor}`,
          }}
        >
          <span
            style={{
              ...styles.dot,
              background: severityColor,
              animation: severity === "CRITICAL" ? "blink 0.6s infinite" : "none",
            }}
          />
          {severity}
        </div>
      </div>

      <div
        style={{
          ...styles.voicePanel,
          borderColor:
            voiceStatus === "listening"
              ? "#ff4d6d66"
              : voiceStatus === "filled"
                ? "#06d6a055"
                : "#00d4ff33",
        }}
      >
        <button
          type="button"
          onClick={handleVoiceButton}
          disabled={voiceStatus === "transcribing"}
          style={{
            ...styles.voiceButton,
            ...(voiceStatus === "listening" ? styles.voiceButtonListening : {}),
            ...(voiceStatus === "filled" ? styles.voiceButtonFilled : {}),
          }}
          aria-label={voiceStatus === "listening" ? "Stop recording patient vitals" : "Record patient vitals"}
        >
          <span style={styles.micIcon} aria-hidden="true">
            <span style={styles.micHead} />
            <span style={styles.micStem} />
          </span>
          {voiceLabel}
        </button>
        <div style={styles.voiceCopy}>
          <div style={styles.voiceTitle}>
            VOICE ASSIST
            {voiceDetails.mode && (
              <span style={styles.modeBadge}>
                {voiceDetails.mode === "mock" ? "DEMO MODE" : "AI TRANSCRIPTION"}
              </span>
            )}
          </div>
          <div style={styles.voiceHint}>
            {voiceStatus === "listening"
              ? "Speak clearly. Recording stops automatically after 10 seconds."
              : "Say heart rate, oxygen, BP, temperature, consciousness, and condition."}
          </div>
        </div>
      </div>

      {(transcript || voiceError) && (
        <div
          style={{
            ...styles.transcriptBox,
            borderColor: voiceError ? "#ff4d6d55" : "#06d6a044",
          }}
        >
          <div
            style={{
              ...styles.transcriptLabel,
              color: voiceError ? "#ff4d6d" : "#06d6a0",
            }}
          >
            {voiceError ? "VOICE INPUT ERROR" : "CONFIRM TRANSCRIPT"}
          </div>
          <div style={styles.transcriptText}>{voiceError || `"${transcript}"`}</div>
          {!voiceError && (voiceDetails.consciousness || voiceDetails.emergencyType) && (
            <div style={styles.detectedRow}>
              {voiceDetails.consciousness && (
                <span>STATUS: {voiceDetails.consciousness.toUpperCase()}</span>
              )}
              {voiceDetails.emergencyType && (
                <span>CASE: {voiceDetails.emergencyType.toUpperCase()}</span>
              )}
            </div>
          )}
        </div>
      )}

      <div style={styles.grid}>
        {vitalsConfig.map((config) => {
          const value = displayedVitals[config.key];
          const critical = isCritical(value, config.critical);

          return (
            <div
              key={config.key}
              style={{
                ...styles.card,
                border: `1px solid ${critical ? `${config.color}88` : "#ffffff12"}`,
                background: critical ? `${config.color}0a` : "#ffffff05",
              }}
            >
              <div style={{ ...styles.cardIcon, color: config.color }}>{config.icon}</div>
              <div style={styles.cardLabel}>{config.label}</div>
              <div
                style={{
                  ...styles.cardValue,
                  color: critical ? config.color : "#f0f0f0",
                  animation: pulse ? "pop 0.3s ease" : "none",
                }}
              >
                {value}
              </div>
              <div style={{ ...styles.cardUnit, color: `${config.color}99` }}>{config.unit}</div>
              {critical && <div style={{ ...styles.alertTag, color: config.color }}>ALERT</div>}
            </div>
          );
        })}
      </div>

      <div style={styles.sparkSection}>
        <div style={styles.sparkLabel}>Heart Rate Trend (last 20s)</div>
        <svg width="100%" height="48" viewBox={`0 0 ${history.length * 14} 48`} preserveAspectRatio="none">
          <polyline
            points={history
              .map((entry, index) => `${index * 14},${48 - ((entry.heartRate - 40) / 140) * 48}`)
              .join(" ")}
            fill="none"
            stroke="#ff4d6d"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <div style={styles.footer}>
        <span style={styles.footerDot} />
        {voiceVitals ? "Voice vitals locked for dispatch" : "Live - Updates every 2s"}
      </div>

      <style>{`
        @keyframes blink { 0%,100% { opacity:1 } 50% { opacity:0.2 } }
        @keyframes pop { 0% { transform: scale(1) } 50% { transform: scale(1.08) } 100% { transform: scale(1) } }
        @keyframes voicePulse { 0%,100% { box-shadow: 0 0 0 0 #ff4d6d55 } 50% { box-shadow: 0 0 0 8px #ff4d6d00 } }
      `}</style>
    </div>
  );
}

const styles = {
  container: { background: "#0d1117", border: "1px solid #ffffff15", borderRadius: 16, padding: 24, fontFamily: "'JetBrains Mono', 'Courier New', monospace", color: "#f0f0f0", width: "100%" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  patientLabel: { fontSize: 10, letterSpacing: 3, color: "#888", textTransform: "uppercase" },
  patientName: { fontSize: 18, fontWeight: 700, color: "#fff", marginTop: 4 },
  severityBadge: { display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 20, fontSize: 11, fontWeight: 700, letterSpacing: 2 },
  dot: { width: 7, height: 7, borderRadius: "50%", display: "inline-block" },
  voicePanel: { display: "flex", alignItems: "center", gap: 12, marginBottom: 16, padding: 12, border: "1px solid #00d4ff33", borderRadius: 12, background: "linear-gradient(135deg, #00d4ff0b, #c77dff08)", transition: "all 0.25s" },
  voiceButton: { minWidth: 142, border: "1px solid #00d4ff66", borderRadius: 10, padding: "10px 12px", background: "#00d4ff16", color: "#9cecff", fontFamily: "inherit", fontSize: 10, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 9 },
  voiceButtonListening: { borderColor: "#ff4d6d", background: "#ff4d6d22", color: "#ff8fa3", animation: "voicePulse 1.2s infinite" },
  voiceButtonFilled: { borderColor: "#06d6a0", background: "#06d6a018", color: "#63efc1" },
  micIcon: { width: 14, height: 17, position: "relative", display: "inline-block", border: "1.5px solid currentColor", borderTop: 0, borderRadius: "0 0 8px 8px" },
  micHead: { position: "absolute", width: 7, height: 11, left: 2, top: -4, border: "1.5px solid currentColor", borderRadius: 6, background: "#0d1117" },
  micStem: { position: "absolute", width: 1.5, height: 4, left: 5, bottom: -5, background: "currentColor" },
  voiceCopy: { minWidth: 0, flex: 1 },
  voiceTitle: { fontSize: 9, color: "#00d4ff", letterSpacing: 2, fontWeight: 800, display: "flex", alignItems: "center", gap: 7 },
  voiceHint: { marginTop: 5, color: "#777", fontSize: 9, lineHeight: 1.45 },
  modeBadge: { padding: "2px 5px", borderRadius: 4, background: "#ffffff0c", color: "#888", fontSize: 7, letterSpacing: 1 },
  transcriptBox: { marginBottom: 16, padding: 12, border: "1px solid #06d6a044", borderRadius: 10, background: "#ffffff04" },
  transcriptLabel: { fontSize: 8, fontWeight: 800, letterSpacing: 2, marginBottom: 6 },
  transcriptText: { fontSize: 10, color: "#bbb", lineHeight: 1.5 },
  detectedRow: { display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8, color: "#ffd166", fontSize: 8, letterSpacing: 1 },
  grid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 },
  card: { borderRadius: 12, padding: 14, position: "relative", transition: "all 0.3s" },
  cardIcon: { fontSize: 12, fontWeight: 800, marginBottom: 4 },
  cardLabel: { fontSize: 9, letterSpacing: 2, color: "#888", textTransform: "uppercase", marginBottom: 6 },
  cardValue: { fontSize: 26, fontWeight: 800, letterSpacing: -1 },
  cardUnit: { fontSize: 10, marginTop: 2 },
  alertTag: { position: "absolute", top: 8, right: 8, fontSize: 8, fontWeight: 700, letterSpacing: 1 },
  sparkSection: { marginTop: 20, background: "#ffffff05", borderRadius: 10, padding: 12 },
  sparkLabel: { fontSize: 9, color: "#666", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 },
  footer: { display: "flex", alignItems: "center", gap: 8, marginTop: 14, fontSize: 10, color: "#555", letterSpacing: 1 },
  footerDot: { width: 6, height: 6, borderRadius: "50%", background: "#06d6a0", display: "inline-block", animation: "blink 1.5s infinite" },
};
