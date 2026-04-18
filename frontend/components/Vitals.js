import React, { useState, useEffect } from "react";

const vitalsConfig = [
  { key: "heartRate", label: "Heart Rate", unit: "bpm", icon: "♥", min: 40, max: 180, critical: [0, 50, 140, 999], color: "#ff4d6d" },
  { key: "spo2", label: "SpO₂", unit: "%", icon: "◉", min: 80, max: 100, critical: [0, 90, 101, 999], color: "#00d4ff" },
  { key: "bp", label: "Blood Pressure", unit: "mmHg", icon: "⬆", min: 60, max: 200, critical: null, color: "#ffd166" },
  { key: "respRate", label: "Resp. Rate", unit: "/min", icon: "≋", min: 8, max: 40, critical: [0, 12, 30, 999], color: "#06d6a0" },
  { key: "temp", label: "Temperature", unit: "°C", icon: "🌡", min: 34, max: 42, critical: [0, 35, 39.5, 999], color: "#f77f00" },
  { key: "gcs", label: "GCS Score", unit: "/15", icon: "🧠", min: 3, max: 15, critical: [0, 9, 16, 999], color: "#c77dff" },
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

function isCritical(val, range) {
  if (!range) return false;
  const v = parseFloat(val);
  return v < range[1] || v > range[2];
}

export default function Vitals({ patientName = "Patient #A-112" }) {
  const [vitals, setVitals] = useState(generateVitals());
  const [history, setHistory] = useState([generateVitals()]);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const next = generateVitals();
      setVitals(next);
      setHistory((h) => [...h.slice(-19), next]);
      setPulse(true);
      setTimeout(() => setPulse(false), 300);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const severity = vitals.gcs < 9 || vitals.spo2 < 90 || vitals.heartRate > 140 ? "CRITICAL" : vitals.gcs < 13 ? "MODERATE" : "STABLE";

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <div style={styles.patientLabel}>PATIENT VITALS</div>
          <div style={styles.patientName}>{patientName}</div>
        </div>
        <div style={{ ...styles.severityBadge, background: severity === "CRITICAL" ? "#ff4d6d22" : severity === "MODERATE" ? "#ffd16622" : "#06d6a022", color: severity === "CRITICAL" ? "#ff4d6d" : severity === "MODERATE" ? "#ffd166" : "#06d6a0", border: `1px solid ${severity === "CRITICAL" ? "#ff4d6d" : severity === "MODERATE" ? "#ffd166" : "#06d6a0"}` }}>
          <span style={{ ...styles.dot, background: severity === "CRITICAL" ? "#ff4d6d" : severity === "MODERATE" ? "#ffd166" : "#06d6a0", animation: severity === "CRITICAL" ? "blink 0.6s infinite" : "none" }} />
          {severity}
        </div>
      </div>

      <div style={styles.grid}>
        {vitalsConfig.map((v) => {
          const val = vitals[v.key];
          const critical = isCritical(val, v.critical);
          return (
            <div key={v.key} style={{ ...styles.card, border: `1px solid ${critical ? v.color + "88" : "#ffffff12"}`, background: critical ? v.color + "0a" : "#ffffff05" }}>
              <div style={{ ...styles.cardIcon, color: v.color }}>{v.icon}</div>
              <div style={styles.cardLabel}>{v.label}</div>
              <div style={{ ...styles.cardValue, color: critical ? v.color : "#f0f0f0", animation: pulse ? "pop 0.3s ease" : "none" }}>
                {val}
              </div>
              <div style={{ ...styles.cardUnit, color: v.color + "99" }}>{v.unit}</div>
              {critical && <div style={{ ...styles.alertTag, color: v.color }}>⚠ ALERT</div>}
            </div>
          );
        })}
      </div>

      <div style={styles.sparkSection}>
        <div style={styles.sparkLabel}>Heart Rate Trend (last 20s)</div>
        <svg width="100%" height="48" viewBox={`0 0 ${history.length * 14} 48`} preserveAspectRatio="none">
          <polyline
            points={history.map((h, i) => `${i * 14},${48 - ((h.heartRate - 40) / 140) * 48}`).join(" ")}
            fill="none"
            stroke="#ff4d6d"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <div style={styles.footer}>
        <span style={styles.footerDot} /> Live • Updates every 2s
      </div>

      <style>{`
        @keyframes blink { 0%,100% { opacity:1 } 50% { opacity:0.2 } }
        @keyframes pop { 0% { transform: scale(1) } 50% { transform: scale(1.08) } 100% { transform: scale(1) } }
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
  grid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 },
  card: { borderRadius: 12, padding: 14, position: "relative", transition: "all 0.3s" },
  cardIcon: { fontSize: 16, marginBottom: 4 },
  cardLabel: { fontSize: 9, letterSpacing: 2, color: "#888", textTransform: "uppercase", marginBottom: 6 },
  cardValue: { fontSize: 26, fontWeight: 800, letterSpacing: -1 },
  cardUnit: { fontSize: 10, marginTop: 2 },
  alertTag: { position: "absolute", top: 8, right: 8, fontSize: 8, fontWeight: 700, letterSpacing: 1 },
  sparkSection: { marginTop: 20, background: "#ffffff05", borderRadius: 10, padding: 12 },
  sparkLabel: { fontSize: 9, color: "#666", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 },
  footer: { display: "flex", alignItems: "center", gap: 8, marginTop: 14, fontSize: 10, color: "#555", letterSpacing: 1 },
  footerDot: { width: 6, height: 6, borderRadius: "50%", background: "#06d6a0", display: "inline-block", animation: "blink 1.5s infinite" },
};
