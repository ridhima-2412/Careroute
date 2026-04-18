import React, { useMemo, useState } from "react";

const mockHospitals = [
  {
    id: 1,
    name: "AIIMS Trauma Centre",
    distance: "2.1 km",
    eta: "4 min",
    icuBeds: 3,
    ventilators: 2,
    specialists: ["Cardiology", "Neurology", "Trauma"],
    score: 94,
    status: "AVAILABLE",
    traffic: "Low",
    waitTime: "< 5 min",
    prealerted: true,
  },
  {
    id: 2,
    name: "Safdarjung Hospital",
    distance: "3.8 km",
    eta: "9 min",
    icuBeds: 1,
    ventilators: 0,
    specialists: ["General Surgery", "Ortho"],
    score: 61,
    status: "LIMITED",
    traffic: "High",
    waitTime: "15–20 min",
    prealerted: false,
  },
  {
    id: 3,
    name: "RML Hospital",
    distance: "5.2 km",
    eta: "13 min",
    icuBeds: 5,
    ventilators: 4,
    specialists: ["Cardiology", "Neuro ICU", "Burns"],
    score: 87,
    status: "AVAILABLE",
    traffic: "Moderate",
    waitTime: "8 min",
    prealerted: false,
  },
  {
    id: 4,
    name: "GTB Hospital",
    distance: "7.4 km",
    eta: "19 min",
    icuBeds: 0,
    ventilators: 0,
    specialists: ["General"],
    score: 22,
    status: "FULL",
    traffic: "High",
    waitTime: "> 30 min",
    prealerted: false,
  },
];

function ScoreBar({ score }) {
  const color = score > 80 ? "#06d6a0" : score > 50 ? "#ffd166" : "#ff4d6d";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 4, background: "#ffffff10", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ width: `${score}%`, height: "100%", background: color, borderRadius: 4, transition: "width 0.5s ease" }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 800, color, minWidth: 30 }}>{score}</span>
    </div>
  );
}

export default function HospitalList({ hospitals = mockHospitals, onSelect, onAlertHospital, onViewRoute, alertingHospitalId }) {
  const [alertedId, setAlertedId] = useState(1);
  const sorted = useMemo(() => [...hospitals].sort((a, b) => b.score - a.score), [hospitals]);

  async function handleAlert(hospital) {
    if (onAlertHospital) {
      const result = await onAlertHospital(hospital);
      if (result?.success) {
        setAlertedId(hospital.id);
      }
      return;
    }

    setTimeout(() => {
      setAlertedId(hospital.id);
    }, 1200);
  }

  function statusColor(s) {
    return s === "AVAILABLE" ? "#06d6a0" : s === "LIMITED" ? "#ffd166" : "#ff4d6d";
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <div style={styles.sectionLabel}>HOSPITAL RECOMMENDATIONS</div>
          <div style={styles.sectionTitle}>AI-Ranked by Suitability</div>
        </div>
        <div style={styles.countBadge}>{sorted.length} Nearby</div>
      </div>

      <div style={styles.list}>
        {sorted.map((h, idx) => (
          <div
            key={h.id}
            onClick={() => onSelect && onSelect(h)}
            style={{
              ...styles.card,
              border: idx === 0 ? "1px solid #06d6a055" : "1px solid #ffffff10",
              background: idx === 0 ? "#06d6a008" : "#ffffff04",
              cursor: "pointer",
            }}
          >
            {idx === 0 && (
              <div style={styles.topBadge}>⭐ BEST MATCH</div>
            )}

            <div style={styles.cardTop}>
              <div style={{ flex: 1 }}>
                <div style={styles.hospitalName}>{h.name}</div>
                <div style={styles.hospitalMeta}>
                  📍 {h.distance} &nbsp;|&nbsp; 🕐 ETA {h.eta} &nbsp;|&nbsp; 🚦 Traffic: {h.traffic}
                </div>
              </div>
              <div style={{ ...styles.statusPill, color: statusColor(h.status), border: `1px solid ${statusColor(h.status)}44`, background: statusColor(h.status) + "11" }}>
                {h.status}
              </div>
            </div>

            <div style={styles.resourceRow}>
              <div style={styles.resource}>
                <span style={styles.resourceVal}>{h.icuBeds}</span>
                <span style={styles.resourceLabel}>ICU Beds</span>
              </div>
              <div style={styles.divider} />
              <div style={styles.resource}>
                <span style={styles.resourceVal}>{h.ventilators}</span>
                <span style={styles.resourceLabel}>Ventilators</span>
              </div>
              <div style={styles.divider} />
              <div style={styles.resource}>
                <span style={styles.resourceVal}>{h.waitTime}</span>
                <span style={styles.resourceLabel}>Wait Time</span>
              </div>
            </div>

            <div style={styles.specialists}>
              {h.specialists.map((s) => (
                <span key={s} style={styles.specTag}>{s}</span>
              ))}
            </div>

            <div style={{ marginBottom: 12 }}>
              <div style={styles.scoreLabel}>Suitability Score</div>
              <ScoreBar score={h.score} />
            </div>

            <div style={styles.cardActions}>
              <button
                onClick={(e) => { e.stopPropagation(); handleAlert(h); }}
                style={{
                  ...styles.alertBtn,
                  background: alertedId === h.id ? "#06d6a022" : "#ffffff08",
                  color: alertedId === h.id ? "#06d6a0" : "#aaa",
                  border: alertedId === h.id ? "1px solid #06d6a0" : "1px solid #ffffff20",
                }}
              >
                {alertingHospitalId === h.id ? "⟳ Alerting..." : alertedId === h.id ? "✓ Pre-Alerted" : "⚡ Alert Hospital"}
              </button>
              <button style={styles.routeBtn} onClick={(e) => { e.stopPropagation(); onViewRoute && onViewRoute(h); }}>
                🗺 View Route
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: { background: "#0d1117", border: "1px solid #ffffff15", borderRadius: 16, padding: 24, fontFamily: "'JetBrains Mono', 'Courier New', monospace", color: "#f0f0f0" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  sectionLabel: { fontSize: 10, letterSpacing: 3, color: "#888", textTransform: "uppercase" },
  sectionTitle: { fontSize: 18, fontWeight: 700, color: "#fff", marginTop: 4 },
  countBadge: { background: "#ffffff0a", border: "1px solid #ffffff15", borderRadius: 20, padding: "4px 12px", fontSize: 11, color: "#888" },
  list: { display: "flex", flexDirection: "column", gap: 12 },
  card: { borderRadius: 14, padding: 18, position: "relative", transition: "all 0.2s" },
  topBadge: { position: "absolute", top: 12, right: 12, fontSize: 9, fontWeight: 700, color: "#06d6a0", letterSpacing: 2 },
  cardTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  hospitalName: { fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 4 },
  hospitalMeta: { fontSize: 10, color: "#666", letterSpacing: 0.5 },
  statusPill: { padding: "3px 10px", borderRadius: 20, fontSize: 9, fontWeight: 700, letterSpacing: 2, whiteSpace: "nowrap" },
  resourceRow: { display: "flex", gap: 0, marginBottom: 12, background: "#ffffff05", borderRadius: 10, overflow: "hidden" },
  resource: { flex: 1, padding: "10px 0", textAlign: "center" },
  resourceVal: { display: "block", fontSize: 18, fontWeight: 800, color: "#fff" },
  resourceLabel: { display: "block", fontSize: 8, color: "#666", letterSpacing: 2, textTransform: "uppercase", marginTop: 2 },
  divider: { width: 1, background: "#ffffff10", margin: "8px 0" },
  specialists: { display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 },
  specTag: { background: "#00d4ff11", border: "1px solid #00d4ff22", color: "#00d4ff", borderRadius: 20, padding: "2px 10px", fontSize: 9, letterSpacing: 1 },
  scoreLabel: { fontSize: 9, color: "#888", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 },
  cardActions: { display: "flex", gap: 8, marginTop: 4 },
  alertBtn: { flex: 1, padding: "8px 0", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer", transition: "all 0.3s", letterSpacing: 1 },
  routeBtn: { flex: 1, padding: "8px 0", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer", background: "#ffffff08", border: "1px solid #ffffff20", color: "#aaa", letterSpacing: 1 },
};
