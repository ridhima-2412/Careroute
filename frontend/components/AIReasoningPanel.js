import React from "react";

function strengthColor(strength) {
  if (strength === "strong") return "#06d6a0";
  if (strength === "moderate") return "#ffd166";
  return "#ff4d6d";
}

function EmptyState() {
  return (
    <div style={styles.empty}>
      <div style={styles.emptyTitle}>Awaiting decision data</div>
      <div style={styles.emptyText}>Reasoning appears after live vitals produce a ranked hospital recommendation.</div>
    </div>
  );
}

function Factor({ factor }) {
  const color = strengthColor(factor.strength);

  return (
    <div style={styles.factor}>
      <div style={styles.factorTop}>
        <span style={styles.factorLabel}>{factor.label}</span>
        <span style={{ ...styles.strength, color, borderColor: `${color}55`, background: `${color}12` }}>
          {factor.strength}
        </span>
      </div>
      <div style={styles.factorScore}>
        <div style={styles.factorTrack}>
          <div style={{ ...styles.factorFill, width: `${Math.min(100, Math.max(4, factor.score * 2))}%`, background: color }} />
        </div>
        <span style={styles.scoreValue}>{Number(factor.score || 0).toFixed(1)}</span>
      </div>
      <div style={styles.factorNote}>{factor.note}</div>
    </div>
  );
}

export default function AIReasoningPanel({ hospital }) {
  const reasoning = hospital?.aiReasoning;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <div style={styles.sectionLabel}>AI REASONING PANEL</div>
          <div style={styles.sectionTitle}>Why This Decision</div>
        </div>
        <div style={styles.modelBadge}>GenAI</div>
      </div>

      {!reasoning ? (
        <EmptyState />
      ) : (
        <>
          <div style={styles.decisionBlock}>
            <div style={styles.hospitalName}>{hospital.name}</div>
            <div style={styles.summary}>{reasoning.summary}</div>
            <div style={styles.confidenceRow}>
              <span>Confidence</span>
              <strong>{reasoning.confidence}%</strong>
            </div>
            <div style={styles.confidenceTrack}>
              <div style={{ ...styles.confidenceFill, width: `${reasoning.confidence}%` }} />
            </div>
          </div>

          <div style={styles.resourceBlock}>
            <span style={styles.resourceLabel}>Target resources</span>
            <strong>{reasoning.requiredResources}</strong>
          </div>

          <div style={styles.factorGrid}>
            {reasoning.factors.map((factor) => (
              <Factor key={factor.label} factor={factor} />
            ))}
          </div>

          <div style={styles.section}>
            <div style={styles.subhead}>Evidence Used</div>
            {reasoning.evidence.map((item) => (
              <div key={item} style={styles.evidenceItem}>{item}</div>
            ))}
          </div>

          <div style={styles.section}>
            <div style={styles.subhead}>Risks Checked</div>
            {reasoning.risks.map((item) => (
              <div key={item} style={styles.riskItem}>{item}</div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const styles = {
  container: {
    background: "#0d1117",
    border: "1px solid #00d4ff33",
    borderRadius: 12,
    padding: 18,
    fontFamily: "'JetBrains Mono', 'Courier New', monospace",
    color: "#f0f0f0",
  },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 },
  sectionLabel: { fontSize: 9, letterSpacing: 3, color: "#888", textTransform: "uppercase" },
  sectionTitle: { fontSize: 16, fontWeight: 800, color: "#fff", marginTop: 4 },
  modelBadge: {
    border: "1px solid #00d4ff55",
    background: "#00d4ff12",
    color: "#00d4ff",
    borderRadius: 8,
    padding: "4px 9px",
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: 1,
  },
  empty: { border: "1px dashed #ffffff20", borderRadius: 10, padding: 14, background: "#ffffff04" },
  emptyTitle: { fontSize: 12, fontWeight: 800, color: "#fff", marginBottom: 6 },
  emptyText: { fontSize: 10, color: "#777", lineHeight: 1.5 },
  decisionBlock: { background: "#ffffff05", border: "1px solid #ffffff10", borderRadius: 10, padding: 12, marginBottom: 10 },
  hospitalName: { fontSize: 14, fontWeight: 900, color: "#fff", marginBottom: 6 },
  summary: { fontSize: 10, lineHeight: 1.55, color: "#aaa", marginBottom: 12 },
  confidenceRow: { display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 10, color: "#777", marginBottom: 6 },
  confidenceTrack: { height: 5, background: "#ffffff10", borderRadius: 5, overflow: "hidden" },
  confidenceFill: { height: "100%", background: "linear-gradient(90deg, #06d6a0, #00d4ff)", borderRadius: 5 },
  resourceBlock: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    alignItems: "center",
    border: "1px solid #ffffff10",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    background: "#ffffff03",
    fontSize: 10,
  },
  resourceLabel: { color: "#777", textTransform: "uppercase", letterSpacing: 2, fontSize: 8 },
  factorGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 },
  factor: { border: "1px solid #ffffff10", background: "#ffffff04", borderRadius: 10, padding: 10, minWidth: 0 },
  factorTop: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6, marginBottom: 8 },
  factorLabel: { fontSize: 9, color: "#ddd", fontWeight: 800 },
  strength: { border: "1px solid", borderRadius: 7, padding: "2px 5px", fontSize: 8, textTransform: "uppercase", fontWeight: 800 },
  factorScore: { display: "flex", alignItems: "center", gap: 7, marginBottom: 7 },
  factorTrack: { flex: 1, height: 4, background: "#ffffff10", borderRadius: 4, overflow: "hidden" },
  factorFill: { height: "100%", borderRadius: 4 },
  scoreValue: { color: "#888", fontSize: 9, minWidth: 28, textAlign: "right" },
  factorNote: { color: "#777", fontSize: 9, lineHeight: 1.4 },
  section: { marginTop: 10 },
  subhead: { fontSize: 9, letterSpacing: 2, color: "#888", textTransform: "uppercase", marginBottom: 7 },
  evidenceItem: { fontSize: 10, color: "#b8c2cc", lineHeight: 1.45, borderLeft: "2px solid #00d4ff66", paddingLeft: 8, marginBottom: 6 },
  riskItem: { fontSize: 10, color: "#c9b18d", lineHeight: 1.45, borderLeft: "2px solid #ffd16688", paddingLeft: 8, marginBottom: 6 },
};
